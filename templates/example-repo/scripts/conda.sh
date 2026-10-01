# conda 를 찾고, 없으면 Miniforge 를 깐다. install.sh · start.sh · pi-kiosk.sh 가 불러 쓴다.
#
# 터미널 설정(.zshrc 등)을 읽지 않는 자리에서도 찾아야 한다. curl | bash 로 설치할 때,
# 더블클릭으로 켤 때, 라즈베리파이 자동 시작 때가 그렇다. 그래서 흔한 설치 위치를 차례로 본다.

ENV_NAME="<환경이름>"

find_conda() {
  if [ -n "${CONDA_EXE:-}" ] && [ -x "$CONDA_EXE" ]; then echo "$CONDA_EXE"; return 0; fi
  local p
  p="$(type -P conda 2>/dev/null || true)"
  if [ -n "$p" ]; then echo "$p"; return 0; fi
  for d in "$HOME/miniforge3" "$HOME/mambaforge" "$HOME/miniconda3" "$HOME/anaconda3" \
           /opt/homebrew/Caskroom/miniforge/base /usr/local/Caskroom/miniforge/base \
           /opt/miniconda3 /opt/anaconda3 /opt/conda; do
    if [ -x "$d/bin/conda" ]; then echo "$d/bin/conda"; return 0; fi
  done
  return 1
}

# Miniforge(conda-forge 의 conda)를 ~/miniforge3 에 깐다. 관리자 권한이 필요 없고,
# 터미널 설정 파일은 건드리지 않는다.
install_miniforge() {
  local url="https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-$(uname)-$(uname -m).sh"
  local tmp
  # 설치 파일은 이름이 .sh 로 끝나야 돈다
  tmp="$(mktemp -d)/Miniforge3.sh"
  curl -fsSL -o "$tmp" "$url" || return 1
  bash "$tmp" -b -p "$HOME/miniforge3" >/dev/null || return 1
  rm -rf "$(dirname "$tmp")"
  echo "$HOME/miniforge3/bin/conda"
}

env_exists() {
  "$1" env list | awk '{print $1}' | grep -qx "$ENV_NAME"
}
