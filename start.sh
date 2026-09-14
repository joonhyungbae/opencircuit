#!/usr/bin/env bash
# OpenCircuit 실습 웹 (React, 라이트 테마) — macOS · Linux
# Windows 는 start.ps1 을 쓰세요.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB="${ROOT}/web"
PORT=1234
URL="http://127.0.0.1:${PORT}"
NO_OPEN=0

for arg in "$@"; do
  case "$arg" in
    --no-open) NO_OPEN=1 ;;
    -h|--help)
      echo "사용법: ./start.sh [--no-open]"
      echo "저장소 루트에서 실습 웹을 띄웁니다."
      exit 0
      ;;
  esac
done

info() { printf '[정보] %s\n' "$*"; }
ok() { printf '[성공] %s\n' "$*"; }
fail() { printf '[실패] %s\n' "$*" >&2; exit 1; }

# 이 포트에서 듣고 있는 프로세스를 종료한다. lsof(macOS) · ss(Linux) 순으로 찾는다.
# 브라우저를 연다. 실패를 삼키지 않는 것이 요점이다.
# xdg-open 은 데스크톱 세션을 못 찾으면 텍스트 브라우저를 뒤지다 종료 코드 3 으로 끝난다.
# 그래서 후보를 차례로 띄워 보고, "정말 살아 있는지"까지 확인한다.
# conda·CUDA 가 끼워 넣은 LD_LIBRARY_PATH 는 브라우저를 조용히 죽인다 — 떼고 띄운다.
# 리눅스의 /usr/bin/open 은 배포판에 따라 openvt(가상 터미널)라서 쓰지 않는다.
BROWSER_ERR=""
BROWSER_TRIED=""
browser_open() {
  local url="$1" c pid rc err i
  if [[ "$(uname -s)" == Darwin ]]; then
    open "$url" >/dev/null 2>&1 && return 0
    return 1
  fi
  if [[ -z "${DISPLAY:-}" && -z "${WAYLAND_DISPLAY:-}" ]]; then
    return 2
  fi
  err="$(mktemp 2>/dev/null || echo /tmp/oc-browser-err.$$)"
  for c in xdg-open x-www-browser sensible-browser google-chrome google-chrome-stable \
           chromium chromium-browser firefox; do
    command -v "$c" >/dev/null 2>&1 || continue
    BROWSER_TRIED="${BROWSER_TRIED}${BROWSER_TRIED:+, }${c}"
    : > "$err"
    env -u LD_LIBRARY_PATH -u LD_PRELOAD "$c" "$url" >/dev/null 2>"$err" &
    pid=$!
    # 최대 1.5 초 기다린다. 살아 있으면 떴다는 뜻이고, 바로 죽었으면 종료 코드를 본다.
    for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
      kill -0 "$pid" 2>/dev/null || break
      sleep 0.1
    done
    if kill -0 "$pid" 2>/dev/null; then
      rm -f "$err"
      return 0
    fi
    rc=0
    wait "$pid" 2>/dev/null || rc=$?
    if [[ "$rc" -eq 0 ]]; then
      # 이미 떠 있던 창에 탭으로 붙은 경우다.
      rm -f "$err"
      return 0
    fi
    BROWSER_ERR="$(head -c 300 "$err" 2>/dev/null | tr '\n' ' ')"
  done
  rm -f "$err"
  return 1
}

free_port() {
  local port="$1"
  local pid
  local pids=()
  if command -v lsof >/dev/null 2>&1; then
    while IFS= read -r pid; do
      [[ -n "$pid" ]] && pids+=("$pid")
    done < <(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
  elif command -v ss >/dev/null 2>&1; then
    while IFS= read -r pid; do
      [[ -n "$pid" ]] && pids+=("$pid")
    done < <(ss -lptn "sport = :${port}" 2>/dev/null | sed -n 's/.*pid=\([0-9]*\).*/\1/p' | sort -u)
  elif command -v fuser >/dev/null 2>&1; then
    if fuser "${port}/tcp" >/dev/null 2>&1; then
      info "포트 ${port} 를 쓰던 프로세스를 종료합니다."
      fuser -k "${port}/tcp" >/dev/null 2>&1 || true
      sleep 0.4
    fi
    return
  fi
  if [[ ${#pids[@]} -eq 0 ]]; then
    return
  fi
  info "포트 ${port} 를 쓰던 프로세스를 종료합니다."
  for pid in "${pids[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  sleep 0.4
  for pid in "${pids[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill -9 "$pid" 2>/dev/null || true
    fi
  done
}

case "$(uname -s)" in
  Darwin|Linux) ;;
  MINGW*|MSYS*|CYGWIN*)
    fail "Windows 에서는 PowerShell 의 start.ps1 을 실행하세요."
    ;;
  *)
    fail "지원하지 않는 운영체제입니다. Windows 는 start.ps1, macOS·Linux 는 start.sh 입니다."
    ;;
esac

[[ -f "${WEB}/package.json" ]] || fail "web/ 폴더를 찾지 못했습니다. 저장소 루트에서 실행하세요."

if ! command -v node >/dev/null 2>&1; then
  fail "Node 20+ 가 필요합니다. bootstrap/install.sh 를 먼저 실행하세요."
fi
major="$(node -v | sed -E 's/^v([0-9]+).*/\1/')"
if [[ -z "$major" || "$major" -lt 20 ]]; then
  fail "Node 20+ 가 필요합니다. 지금 버전은 $(node -v) 입니다."
fi

if [[ ! -d "${WEB}/node_modules" ]]; then
  info "처음 한 번, web 의존성을 설치합니다."
  (cd "$WEB" && npm install --no-fund --no-audit) \
    || fail "npm install 에 실패했습니다. 인터넷을 확인한 뒤 다시 실행하세요."
fi

free_port "$PORT"

if [[ "$NO_OPEN" -eq 0 ]]; then
  (
    sleep 1.2
    rc=0
    browser_open "$URL" || rc=$?
    if [[ "$rc" -eq 2 ]]; then
      printf '[정보] %s\n' "화면이 없는 세션입니다(DISPLAY 없음). 브라우저에서 ${URL} 을 직접 여세요."
    elif [[ "$rc" -ne 0 ]]; then
      printf '[주의] %s\n' "브라우저를 자동으로 열지 못했습니다. ${URL} 을 직접 여세요."
      [[ -n "$BROWSER_TRIED" ]] && printf '[주의] %s\n' "시도한 것: ${BROWSER_TRIED}"
      [[ -n "$BROWSER_ERR" ]] && printf '[주의] %s\n' "마지막 오류: ${BROWSER_ERR}"
      printf '[정보] %s\n' "원인을 보려면 다른 창에서: bash web.sh --doctor"
    fi
  ) &
fi

ok "실습 웹: ${URL}"
info "그만하려면 이 창에서 Ctrl+C 를 누르세요."
cd "$WEB"
exec npm run dev -- --host 127.0.0.1 --port "$PORT" --strictPort
