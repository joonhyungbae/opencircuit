#!/usr/bin/env bash
# OpenCircuit 스터디 슬라이드 (React 템플릿) — macOS · Linux
# Windows 는 web.ps1 을 쓰세요.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DECK="${ROOT}/tools/react/baseline"
PORT=5173
NO_OPEN=0
DOCTOR=0
TAILSCALE=0
LOCAL_ONLY=0
NEW_NAME=""
DOCS_DIR=""
BIND="127.0.0.1"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-open) NO_OPEN=1 ;;
    --doctor) DOCTOR=1 ;;
    --tailscale) TAILSCALE=1; NO_OPEN=1 ;;
    --local) LOCAL_ONLY=1 ;;
    --new)
      [[ $# -ge 2 && -n "$2" ]] \
        || { echo "[실패] --new 뒤에 작품 이름을 적어 주세요. 예) ./web.sh --new 작품이름" >&2; exit 1; }
      NEW_NAME="$2"; shift ;;
    --dir)
      [[ $# -ge 2 && -n "$2" ]] \
        || { echo "[실패] --dir 뒤에 폴더를 적어 주세요. 예) --dir ~/Documents" >&2; exit 1; }
      DOCS_DIR="$2"; shift ;;
    -h|--help)
      echo "사용법: ./web.sh [덱_폴더] [옵션]"
      echo "       ./web.sh --new <작품이름>"
      echo ""
      echo "스터디 발표 슬라이드를 띄웁니다."
      echo "덱_폴더를 안 적으면 tools/react/baseline 을 띄웁니다."
      echo "내 발표를 띄우려면 만들어 둔 폴더를 적습니다. 예) ./web.sh ~/Documents/OpenCircuit/작품이름-study"
      echo ""
      echo "  --new <이름> 문서 폴더에 내 발표 폴더를 만듭니다. 처음 한 번 여기서 시작하세요."
      echo "  --dir <경로> --new 가 쓸 문서 폴더를 직접 정합니다."
      echo "  --tailscale  이 컴퓨터의 Tailscale 주소로 엽니다."
      echo "               SSH 로 붙어 화면이 없으면 이 모드가 저절로 켜집니다."
      echo "  --local      저절로 켜지는 것을 막고 127.0.0.1 에만 엽니다."
      echo "  --doctor     브라우저가 왜 안 열리는지 진단합니다."
      exit 0
      ;;
    -*) echo "[실패] 모르는 옵션입니다: $1" >&2; exit 1 ;;
    *) DECK="$(cd "$1" 2>/dev/null && pwd)" || { echo "[실패] 그런 폴더가 없습니다: $1" >&2; exit 1; } ;;
  esac
  shift
done

URL="http://127.0.0.1:${PORT}"

info() { printf '[정보] %s\n' "$*"; }
ok() { printf '[성공] %s\n' "$*"; }
warn() { printf '[주의] %s\n' "$*"; }
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

# 왜 안 열리는지 사람이 읽을 수 있게 보여 준다.
show_browser_doctor() {
  echo ""
  echo "==== 브라우저 열기 진단 ===="
  printf '%-22s %s\n' "OS" "$(uname -s)"
  printf '%-22s %s\n' "DISPLAY" "${DISPLAY:-(없음)}"
  printf '%-22s %s\n' "WAYLAND_DISPLAY" "${WAYLAND_DISPLAY:-(없음)}"
  printf '%-22s %s\n' "XDG_SESSION_TYPE" "${XDG_SESSION_TYPE:-(없음)}"
  printf '%-22s %s\n' "LD_LIBRARY_PATH" "${LD_LIBRARY_PATH:-(없음)}"
  local c
  for c in xdg-open x-www-browser sensible-browser google-chrome chromium firefox; do
    printf '%-22s %s\n' "$c" "$(command -v "$c" 2>/dev/null || echo '(없음)')"
  done
  local xrc=0
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL" >/dev/null 2>&1 || xrc=$?
    printf '%-22s %s\n' "xdg-open 종료코드" "${xrc}  (0 이 아니면 이게 원인입니다)"
  fi
  local brc=0
  browser_open "$URL" || brc=$?
  case "$brc" in
    0) printf '%-22s %s\n' "결과" "열었습니다 (${BROWSER_TRIED})" ;;
    2) printf '%-22s %s\n' "결과" "화면이 없는 세션이라 시도하지 않았습니다" ;;
    *) printf '%-22s %s\n' "결과" "실패 — 시도: ${BROWSER_TRIED:-(후보 없음)}"
       [[ -n "$BROWSER_ERR" ]] && printf '%-22s %s\n' "마지막 오류" "$BROWSER_ERR" ;;
  esac
  echo ""
  echo "직접 열어 보세요: ${URL}"
  echo ""
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
    fail "Windows 에서는 PowerShell 의 web.ps1 을 실행하세요."
    ;;
  *)
    fail "지원하지 않는 운영체제입니다. Windows 는 web.ps1, macOS·Linux 는 web.sh 입니다."
    ;;
esac

# 문서 폴더를 찾는다. 수강생마다 이름이 다르다 — Documents · 문서 · XDG 설정.
find_docs_dir() {
  local d="" c
  if command -v xdg-user-dir >/dev/null 2>&1; then
    d="$(xdg-user-dir DOCUMENTS 2>/dev/null || true)"
    if [[ -n "$d" && -d "$d" && "$d" != "$HOME" ]]; then
      echo "$d"
      return
    fi
  fi
  for c in "${HOME}/Documents" "${HOME}/문서"; do
    if [[ -d "$c" ]]; then
      echo "$c"
      return
    fi
  done
  echo ""
}

# 내 발표 폴더를 만든다. 수강생이 숨김 폴더(~/.opencircuit)를 뒤지지 않게 하는 것이 요점이다.
make_study_folder() {
  local name="$1" docs target base e
  case "$name" in
    ""|-*) fail "작품 이름을 적어 주세요. 예) ./web.sh --new 작품이름" ;;
    */*) fail "작품 이름에 / 는 쓸 수 없습니다: ${name}" ;;
  esac

  docs="$DOCS_DIR"
  if [[ -z "$docs" ]]; then
    docs="$(find_docs_dir)"
  fi
  [[ -n "$docs" ]] \
    || fail "문서 폴더를 찾지 못했습니다. --dir 로 직접 정해 주세요. 예) ./web.sh --new ${name} --dir ~/Documents"
  [[ -d "$docs" ]] || fail "그런 폴더가 없습니다: ${docs}"

  base="${ROOT}/tools/react/baseline"
  [[ -f "${base}/package.json" ]] || fail "템플릿을 찾지 못했습니다: ${base}"

  target="${docs}/OpenCircuit/${name}-study"
  if [[ -e "$target" ]]; then
    fail "이미 있습니다: ${target}
지우거나 다른 이름을 쓰세요. 덮어쓰지 않습니다."
  fi

  info "만드는 곳: ${target}"
  mkdir -p "$target"
  # node_modules 와 dist 는 빼고 옮긴다 — 무겁고, npm install 이 다시 만든다.
  (
    cd "$base"
    for e in * .[!.]*; do
      [[ -e "$e" ]] || continue
      case "$e" in node_modules|dist) continue ;; esac
      cp -R "$e" "${target}/"
    done
  )
  # 절차서를 같이 둔다. 그래야 Cursor 채팅에서 @04-study-slides.md 로 부를 수 있다.
  if [[ -f "${ROOT}/prompts/04-study-slides.md" ]]; then
    cp "${ROOT}/prompts/04-study-slides.md" "${target}/"
  else
    warn "절차서를 찾지 못했습니다: ${ROOT}/prompts/04-study-slides.md"
  fi
  ok "폴더를 만들었습니다."

  info "의존성을 설치합니다. 처음 한 번, 몇 분 걸립니다."
  if (cd "$target" && npm install --no-fund --no-audit >/dev/null 2>&1); then
    ok "설치 완료. 발표 직전에 기다릴 일이 없습니다."
  else
    warn "npm install 에 실패했습니다. 인터넷을 확인한 뒤 그 폴더에서 'npm install' 을 실행하세요."
  fi

  echo ""
  ok "준비됐습니다: ${target}"
  echo ""
  echo "  1. Cursor 에서 File → Open Folder 로 위 폴더를 엽니다."
  echo "  2. 채팅(에이전트 모드)에 이렇게 씁니다:"
  echo ""
  echo "       @04-study-slides.md"
  echo "       논문 DOI: 10.1145/..."
  echo "       이 논문으로 src/deck.json 을 채워 주세요."
  echo ""
  echo "  3. 확인:  ./web.sh \"${target}\""
  echo ""
}

if [[ -n "$NEW_NAME" ]]; then
  make_study_folder "$NEW_NAME"
  exit 0
fi

if [[ "$DOCTOR" -eq 1 ]]; then
  show_browser_doctor
  exit 0
fi

# 먼저 tailnet 주소를 얻어 본다. 못 얻으면 왜 못 얻었는지 남긴다 — 조용히 넘어가지 않는다.
TS_IP=""
TS_WHY=""
TS_WARNED=0
if command -v tailscale >/dev/null 2>&1; then
  TS_IP="$(tailscale ip -4 2>/dev/null | head -1 || true)"
  [[ -n "$TS_IP" ]] || TS_WHY="Tailscale 이 로그인되어 있지 않습니다. 'tailscale status' 로 확인하세요."
else
  TS_WHY="이 컴퓨터에 Tailscale 이 없습니다."
fi

HEADLESS=0
if [[ -z "${DISPLAY:-}" && -z "${WAYLAND_DISPLAY:-}" ]]; then
  HEADLESS=1
fi

# SSH 로 붙어 화면이 없는데 127.0.0.1 에만 열면 그 주소는 아무도 볼 수 없다.
# 그런 상황에서 tailnet 이 있으면 저절로 그쪽으로 연다. --local 로 끌 수 있다.
AUTO_TS=0
if [[ "$TAILSCALE" -eq 0 && "$LOCAL_ONLY" -eq 0 && "$HEADLESS" -eq 1 && -n "$TS_IP" ]]; then
  TAILSCALE=1
  NO_OPEN=1
  AUTO_TS=1
fi

# Tailscale 로 열기. 0.0.0.0 이 아니라 tailnet 주소에만 묶는다 —
# 같은 공유기의 남들에게까지 열리지 않게 하기 위해서다.
TS_NAME=""
if [[ "$TAILSCALE" -eq 1 && "$LOCAL_ONLY" -eq 0 ]]; then
  if [[ -n "$TS_IP" ]]; then
    BIND="$TS_IP"
    # MagicDNS 이름이 있으면 그 이름으로도 열 수 있게 Vite 허용 목록에 넣는다.
    TS_NAME="$(tailscale status --json 2>/dev/null \
      | sed -n 's/.*"DNSName"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1 || true)"
    TS_NAME="${TS_NAME%.}"
    if [[ -n "$TS_NAME" ]]; then
      export OC_ALLOWED_HOSTS="${TS_NAME},${BIND}"
    else
      export OC_ALLOWED_HOSTS="${BIND}"
    fi
    URL="http://${BIND}:${PORT}"
  else
    # --tailscale 을 붙였는데 tailnet 이 없다. 중단하지 않고 127.0.0.1 로 연다.
    TAILSCALE=0
    TS_WARNED=1
    warn "$TS_WHY"
  fi
fi

[[ -f "${DECK}/package.json" ]] || fail "슬라이드 폴더를 찾지 못했습니다: ${DECK}"
[[ -f "${DECK}/src/deck.json" ]] || fail "src/deck.json 이 없습니다. 슬라이드 폴더가 맞는지 보세요: ${DECK}"

if ! command -v node >/dev/null 2>&1; then
  fail "Node 20+ 가 필요합니다. bootstrap/install.sh 를 먼저 실행하세요."
fi
major="$(node -v | sed -E 's/^v([0-9]+).*/\1/')"
if [[ -z "$major" || "$major" -lt 20 ]]; then
  fail "Node 20+ 가 필요합니다. 지금 버전은 $(node -v) 입니다."
fi

if [[ ! -d "${DECK}/node_modules" ]]; then
  info "처음 한 번, 슬라이드 의존성을 설치합니다. 몇 분 걸립니다."
  (cd "$DECK" && npm install --no-fund --no-audit) \
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

if [[ "$AUTO_TS" -eq 1 ]]; then
  info "화면이 없는 세션이라 Tailscale 주소로 엽니다. (127.0.0.1 만 쓰려면 --local)"
elif [[ "$HEADLESS" -eq 1 && "$TAILSCALE" -eq 0 ]]; then
  [[ -n "$TS_WHY" && "$TS_WARNED" -eq 0 ]] && info "$TS_WHY"
  info "화면이 없는 세션이라 127.0.0.1 로 엽니다. 이 주소는 이 컴퓨터 안에서만 보입니다."
  info "내 노트북에서 보려면 그쪽 터미널에서 포트를 넘기세요:"
  info "  ssh -L ${PORT}:127.0.0.1:${PORT} ${USER}@<이 서버 주소>"
  info "그다음 내 노트북 브라우저에서 http://127.0.0.1:${PORT}"
fi
ok "스터디 슬라이드: ${URL}"
if [[ "$TAILSCALE" -eq 1 ]]; then
  [[ -n "$TS_NAME" ]] && info "MagicDNS 로도 됩니다: http://${TS_NAME}:${PORT}"
  info "내 노트북·폰 브라우저에서 위 주소를 여세요. 같은 tailnet 이어야 합니다."
  info "이 컴퓨터의 Tailscale 안에서만 열립니다 — 공유기의 다른 사람에게는 안 보입니다."
fi
info "고칠 파일: ${DECK}/src/deck.json"
info "그만하려면 이 창에서 Ctrl+C 를 누르세요."
cd "$DECK"
exec npm run dev -- --host "$BIND" --port "$PORT" --strictPort
