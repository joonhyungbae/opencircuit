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
  if command -v xdg-open >/dev/null 2>&1; then
    (sleep 1.2; xdg-open "$URL" >/dev/null 2>&1 || true) &
  elif command -v open >/dev/null 2>&1; then
    (sleep 1.2; open "$URL" >/dev/null 2>&1 || true) &
  fi
fi

ok "실습 웹: ${URL}"
info "그만하려면 이 창에서 Ctrl+C 를 누르세요."
cd "$WEB"
exec npm run dev -- --host 127.0.0.1 --port "$PORT" --strictPort
