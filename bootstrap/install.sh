#!/usr/bin/env bash
# OpenCircuit 수강생용 부트스트랩 (macOS)
set -euo pipefail

REPO_URL="https://github.com/joonhyungbae/opencircuit.git"
TARBALL_URL="https://codeload.github.com/joonhyungbae/opencircuit/tar.gz/refs/heads/main"
COMMIT_API_URL="https://api.github.com/repos/joonhyungbae/opencircuit/commits/main"
# Node 버전은 고정한다. nodejs.org 의 index.json 을 파싱하려면 python3 가 필요한데,
# Xcode Command Line Tools 가 없는 맥에서는 python3 호출이 CLT 설치 창을 띄운다.
NODE_PIN="v20.19.0"
SERVER_KEY="opencircuit-hello"
LEGACY_KEYS=("opencircuit-hello-dev")
HAS_GIT=0
CURSOR_DOWNLOAD_URL="https://cursor.com/download"
HOME_OC="${HOME}/.opencircuit"
REPO_DIR="${HOME_OC}/repo"
NODE_HOME_DIR="${HOME_OC}/node"
MCP_JSON="${HOME}/.cursor/mcp.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

DOCTOR=0
UPDATE=0
for arg in "$@"; do
  case "$arg" in
    --doctor) DOCTOR=1 ;;
    --update) UPDATE=1 ;;
    -h|--help)
      echo "사용법: ./install.sh [--doctor] [--update]"
      exit 0
      ;;
  esac
done

info() { printf '[정보] %s\n' "$*"; }
ok() { printf '[성공] %s\n' "$*"; }
warn() { printf '[주의] %s\n' "$*"; }
fail() { printf '[실패] %s\n' "$*" >&2; exit 1; }

node_major() {
  if ! command -v node >/dev/null 2>&1; then
    echo ""
    return
  fi
  node -v | sed -E 's/^v([0-9]+).*/\1/'
}

refresh_path() {
  export PATH="${NODE_HOME_DIR}/bin:${PATH}"
  if [[ -x /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  elif [[ -x /usr/local/bin/brew ]]; then
    eval "$(/usr/local/bin/brew shellenv)"
  fi
}

ensure_path_persist_node_home() {
  local line='export PATH="$HOME/.opencircuit/node/bin:$PATH"'
  for rc in "${HOME}/.zprofile" "${HOME}/.zshrc" "${HOME}/.bash_profile" "${HOME}/.bashrc"; do
    if [[ -f "$rc" ]] && grep -Fq '.opencircuit/node/bin' "$rc"; then
      return
    fi
  done
  local target="${HOME}/.zprofile"
  echo "" >> "$target"
  echo "# OpenCircuit Node (관리자 권한 없이 홈에 설치)" >> "$target"
  echo "$line" >> "$target"
  ok "PATH에 ~/.opencircuit/node/bin 을 ${target} 에 추가했습니다."
}

install_node_tarball() {
  local arch uname_m tarball url tmp ver
  uname_m="$(uname -m)"
  case "$uname_m" in
    arm64|aarch64) arch="arm64" ;;
    x86_64) arch="x64" ;;
    *) fail "지원하지 않는 Mac 아키텍처입니다: ${uname_m}. https://nodejs.org 에서 Node 20 LTS 를 확인하세요." ;;
  esac

  info "공식 Node 바이너리를 ~/.opencircuit/node 에 풉니다 (레포 clone 경로와 분리)."
  mkdir -p "${HOME_OC}"
  tmp="$(mktemp -d)"
  ver="${NODE_PIN}"
  tarball="node-${ver}-darwin-${arch}.tar.gz"
  url="https://nodejs.org/dist/${ver}/${tarball}"
  info "다운로드: ${url}"
  if ! curl -fL --progress-bar -o "${tmp}/${tarball}" "$url"; then
    rm -rf "$tmp"
    fail "Node 다운로드에 실패했습니다. 인터넷을 확인한 뒤 다시 실행하세요."
  fi
  mkdir -p "${NODE_HOME_DIR}"
  tar -xzf "${tmp}/${tarball}" -C "${NODE_HOME_DIR}" --strip-components=1
  rm -rf "$tmp"
  ensure_path_persist_node_home
  refresh_path
  export PATH="${NODE_HOME_DIR}/bin:${PATH}"
  local major
  major="$(node_major)"
  if [[ -z "$major" || "$major" -lt 20 ]]; then
    fail "홈에 Node를 풀었지만 실행되지 않습니다. ${NODE_HOME_DIR}/bin/node 를 확인하세요."
  fi
  ok "Node $(node -v) 홈 설치 완료"
}

ensure_node() {
  refresh_path
  local major
  major="$(node_major)"
  if [[ -n "$major" && "$major" -ge 20 ]]; then
    ok "Node $(node -v) 확인"
    return
  fi
  if [[ -n "$major" ]]; then
    warn "Node v${major} 가 너무 낮습니다. 20 이상이 필요합니다."
  fi

  if command -v brew >/dev/null 2>&1; then
    info "Homebrew로 Node를 설치합니다."
    brew install node
    refresh_path
    major="$(node_major)"
    if [[ -n "$major" && "$major" -ge 20 ]]; then
      ok "Node $(node -v) 설치됨 (Homebrew)"
      return
    fi
    warn "Homebrew 설치 후에도 Node 20+ 를 찾지 못했습니다. 홈 타르볼 설치로 넘어갑니다."
  else
    info "Homebrew가 없습니다. 관리자 암호가 필요한 .pkg 대신 ~/.opencircuit/node 에 Node를 풉니다."
  fi

  install_node_tarball
}

# git 은 있으면 쓰고 없으면 tarball 로 우회한다.
# 깨끗한 맥에서 git 을 호출하면 Xcode Command Line Tools 설치 창이 뜨고
# 관리자 암호와 수 GB 다운로드를 요구한다 — 수업 중에 이건 치명적이다.
# 따라서 여기서 절대 중단하지 않는다.
probe_git() {
  if command -v git >/dev/null 2>&1; then
    HAS_GIT=1
    ok "git $(git --version | sed 's/git version //') 확인"
    return
  fi
  if command -v brew >/dev/null 2>&1; then
    info "git이 없습니다. Homebrew로 설치를 시도합니다."
    brew install git || true
    if command -v git >/dev/null 2>&1; then
      HAS_GIT=1
      ok "git 설치됨"
      return
    fi
  fi
  HAS_GIT=0
  warn "git이 없습니다. 내려받기(tarball) 방식으로 설치합니다 — 설치·사용에는 문제가 없습니다."
  info "나중에 git이 필요해지면 https://git-scm.com/download/mac 에서 설치하고 부트스트랩을 다시 실행하세요."
}

ensure_cursor() {
  if [[ -d "/Applications/Cursor.app" ]] || command -v cursor >/dev/null 2>&1; then
    ok "Cursor 확인"
    return
  fi
  fail "Cursor가 설치되어 있지 않습니다. ${CURSOR_DOWNLOAD_URL} 에서 설치한 뒤 이 스크립트를 다시 실행하세요."
}

hello_entry() {
  echo "${REPO_DIR}/servers/hello/dist/index.js"
}

repo_commit() {
  if [[ -d "${REPO_DIR}/.git" ]] && command -v git >/dev/null 2>&1; then
    git -C "${REPO_DIR}" rev-parse --short HEAD 2>/dev/null || true
  elif [[ -f "${REPO_DIR}/.oc-commit" ]]; then
    tr -d '[:space:]' < "${REPO_DIR}/.oc-commit"
  fi
}

# tarball 설치에는 .git 이 없으므로 커밋 해시를 파일로 남긴다.
# (doctor 가 수강생 간 버전을 대조하는 유일한 근거다)
record_commit_marker() {
  local sha
  sha="$(node -e 'fetch(process.argv[1],{headers:{"User-Agent":"opencircuit-bootstrap"}}).then(r=>r.json()).then(j=>console.log(String(j.sha||"").slice(0,7))).catch(()=>console.log(""))' "${COMMIT_API_URL}" 2>/dev/null || true)"
  printf '%s\n' "${sha:-unknown}" > "${REPO_DIR}/.oc-commit"
}

install_repo_tarball() {
  local tmp
  tmp="$(mktemp -d)"
  info "도구 내려받기: ${TARBALL_URL}"
  if ! curl -fsSL "${TARBALL_URL}" -o "${tmp}/oc.tar.gz"; then
    rm -rf "$tmp"
    fail "도구를 내려받지 못했습니다. 인터넷을 확인한 뒤 다시 실행하세요."
  fi
  rm -rf "${REPO_DIR}"
  mkdir -p "${REPO_DIR}"
  if ! tar -xzf "${tmp}/oc.tar.gz" -C "${REPO_DIR}" --strip-components=1; then
    rm -rf "$tmp"
    fail "내려받은 파일을 푸는 데 실패했습니다. 다시 실행하세요."
  fi
  rm -rf "$tmp"
  record_commit_marker
  ok "설치 완료 (커밋 $(repo_commit))"
}

merge_script() {
  if [[ -f "${REPO_DIR}/bootstrap/merge-mcp.mjs" ]]; then
    echo "${REPO_DIR}/bootstrap/merge-mcp.mjs"
  else
    echo "${SCRIPT_DIR}/merge-mcp.mjs"
  fi
}

verify_script() {
  if [[ -f "${REPO_DIR}/bootstrap/verify.mjs" ]]; then
    echo "${REPO_DIR}/bootstrap/verify.mjs"
  else
    echo "${SCRIPT_DIR}/verify.mjs"
  fi
}

ensure_repo() {
  mkdir -p "${HOME_OC}"

  if [[ "${HAS_GIT}" -ne 1 ]]; then
    # git 이 없으면 매번 새로 내려받는다. 멱등하고, 오프라인이 아닌 한 항상 성공한다.
    install_repo_tarball
    return
  fi

  if [[ -d "${REPO_DIR}/.git" ]]; then
    info "기존 레포 발견: ${REPO_DIR} — git pull"
    if ! git -C "${REPO_DIR}" pull --ff-only; then
      fail "git pull 에 실패했습니다. 네트워크를 확인하거나, 로컬 변경이 있다면 ~/.opencircuit 밖에서 작업 중인지 확인하세요."
    fi
    ok "pull 완료 (커밋 $(repo_commit))"
    return
  fi

  # tarball 로 설치했다가 나중에 git 이 생긴 경우 — 지우고 clone 으로 승격한다.
  if [[ -e "${REPO_DIR}" ]]; then
    info "기존 설치를 git 저장소로 교체합니다."
    rm -rf "${REPO_DIR}"
  fi

  info "레포 clone: ${REPO_URL} (branch main) → ${REPO_DIR}"
  # 원격 기본 브랜치가 gh-pages 일 수 있으므로 main 을 명시한다.
  if ! git clone --depth 1 --branch main "${REPO_URL}" "${REPO_DIR}"; then
    warn "git clone 에 실패했습니다. 내려받기(tarball) 방식으로 다시 시도합니다."
    install_repo_tarball
    return
  fi
  ok "clone 완료"
}

build_repo() {
  info "npm install + build: ${REPO_DIR}"
  (
    cd "${REPO_DIR}"
    npm install --no-fund --no-audit
    npm run build
  ) || fail "빌드에 실패했습니다. 인터넷을 확인한 뒤 다시 실행하세요. (한 번 성공하면 이후 오프라인에서도 ping 이 됩니다.)"
  [[ -f "$(hello_entry)" ]] || fail "빌드 후에도 진입 파일이 없습니다: $(hello_entry)"
  ok "빌드 완료 (커밋 $(repo_commit))"
}

merge_mcp() {
  local node_path entry
  node_path="$(command -v node)"
  entry="$(hello_entry)"
  [[ -x "$node_path" ]] || fail "node 경로를 찾지 못했습니다."
  info "등록: ${SERVER_KEY} → ${entry}"
  node "$(merge_script)" "${MCP_JSON}" "${SERVER_KEY}" "${node_path}" "${entry}" \
    || fail "mcp.json 병합에 실패했습니다."
  ok "mcp.json 저장: ${MCP_JSON}"
}

invoke_verify() {
  local node_path
  node_path="$(command -v node)"
  info "opencircuit-hello handshake 검증 중..."
  if ! node "$(verify_script)" "${node_path}" "$(hello_entry)"; then
    fail "검증에 실패했습니다."
  fi
  ok "검증 성공"
}

show_doctor() {
  echo ""
  echo "==== OpenCircuit Doctor ===="
  printf '%-12s %s\n' "항목" "상태"
  printf '%-12s %s\n' "------------" "----------------"

  local major node_status git_status cursor_status mcp_status ver_status commit_status
  major="$(node_major)"
  if [[ -n "$major" && "$major" -ge 20 ]]; then
    node_status="OK ($(node -v))"
  else
    node_status="FAIL (Node 20+ 필요)"
  fi
  printf '%-12s %s\n' "Node" "$node_status"

  if command -v git >/dev/null 2>&1; then
    git_status="OK ($(git --version | sed 's/git version //'))"
  elif [[ -f "${REPO_DIR}/.oc-commit" ]]; then
    git_status="없음 — tarball 모드 (정상)"
  else
    git_status="없음 (설치 시 tarball 로 우회됩니다)"
  fi
  printf '%-12s %s\n' "git" "$git_status"

  if [[ -d "/Applications/Cursor.app" ]] || command -v cursor >/dev/null 2>&1; then
    cursor_status="OK"
  else
    cursor_status="FAIL (${CURSOR_DOWNLOAD_URL})"
  fi
  printf '%-12s %s\n' "Cursor" "$cursor_status"

  if [[ -f "$MCP_JSON" ]]; then
    mcp_status="$(node -e '
      const fs=require("fs");
      try {
        const j=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
        const keys=Object.keys(j.mcpServers||{});
        if(!keys.includes("opencircuit-hello")) { console.log("FAIL (opencircuit-hello 없음)"); process.exit(0); }
        console.log("OK (키: "+keys.join(", ")+")");
      } catch { console.log("FAIL (파싱 오류)"); }
    ' "$MCP_JSON" 2>/dev/null || echo "FAIL (파싱 오류)")"
  else
    mcp_status="FAIL (파일 없음)"
  fi
  printf '%-12s %s\n' "mcp.json" "$mcp_status"

  ver_status="FAIL (서버 진입 파일 없음)"
  if [[ -f "$(hello_entry)" && -n "$major" && "$major" -ge 20 ]]; then
    local out
    if out="$(node "$(verify_script)" "$(command -v node)" "$(hello_entry)" 2>&1)"; then
      local c
      c="$(printf '%s\n' "$out" | sed -n 's/^COMMIT=//p' | head -n1)"
      ver_status="OK (commit=${c:-unknown})"
    else
      ver_status="FAIL (서버 무응답 — 부트스트랩 재실행)"
    fi
  fi
  printf '%-12s %s\n' "서버응답" "$ver_status"

  if [[ -n "$(repo_commit)" ]]; then
    commit_status="OK ($(repo_commit))"
  else
    commit_status="FAIL (repo 없음 — 부트스트랩 실행)"
  fi
  printf '%-12s %s\n' "커밋" "$commit_status"
  echo "mcp.json: ${MCP_JSON}"
  echo "repo: ${REPO_DIR}"
  echo ""
}

echo ""
echo "OpenCircuit 부트스트랩"
if [[ "$DOCTOR" -eq 1 ]]; then
  show_doctor
  exit 0
fi

ensure_node
probe_git
ensure_cursor
ensure_repo
build_repo
merge_mcp
invoke_verify

ok "준비 완료. Cursor를 완전히 종료했다가 다시 연 뒤 MCP 목록에서 opencircuit-hello 초록불을 확인하세요."
info "도구 위치: ${REPO_DIR} — 작품·작업 폴더는 여기에 두지 마세요."
info "업데이트: ./install.sh --update"
echo ""
