#!/usr/bin/env bash
#
# 한 줄로 깔기 (맥 · 리눅스)
#
#   curl -fsSL https://raw.githubusercontent.com/<계정>/<저장소>/main/install.sh | bash
#
# 하는 일: 저장소 받기 → conda 확인(없으면 Miniforge 를 깐다) → conda 환경 만들기
#          → 웹캠 모델 받기 → 켜는 법 알려 주기. 이미 받아 둔 폴더 안에서 실행해도 된다.
# 언제나 conda 환경으로 돌린다. venv 나 시스템 파이썬으로 넘어가지 않는다.
set -euo pipefail

REPO="https://github.com/<계정>/<저장소>"
NAME="<저장소>"

say() { printf '\033[1;36m▸\033[0m %s\n' "$*"; }
oops() { printf '\033[1;31m✗\033[0m %s\n' "$*" >&2; exit 1; }

# ── 1. 저장소 ────────────────────────────────────────────────────────────
if [ -f "run.py" ] && [ -d "<환경이름>" ]; then
  DIR="$(pwd)"
  say "이미 받아 둔 폴더에서 실행합니다: $DIR"
else
  DIR="$(pwd)/$NAME"
  if [ -d "$DIR/.git" ] && command -v git >/dev/null 2>&1; then
    say "폴더가 이미 있어 최신으로 받습니다: $DIR"
    git -C "$DIR" pull --ff-only >/dev/null 2>&1 || say "최신으로 받지 못했습니다. 있는 그대로 씁니다."
  elif [ -d "$DIR" ]; then
    say "폴더가 이미 있어 그대로 씁니다: $DIR"
  elif command -v git >/dev/null 2>&1 && git --version >/dev/null 2>&1; then
    say "받는 중: $DIR"
    git clone -q "$REPO" "$DIR"
  else
    # git 이 없으면 압축 파일로 받는다. 맥에서 개발 도구 설치 창이 뜨는 것을 피한다.
    say "받는 중 (압축 파일): $DIR"
    mkdir -p "$DIR"
    curl -fsSL "$REPO/archive/refs/heads/main.tar.gz" | tar xz -C "$DIR" --strip-components 1
  fi
fi
cd "$DIR"

# shellcheck source=scripts/conda.sh
source scripts/conda.sh   # ENV_NAME, find_conda, install_miniforge, env_exists

# ── 2. conda. 없으면 Miniforge 를 사용자 폴더에 깐다 ───────────────────────
if CONDA="$(find_conda)"; then
  say "conda 를 씁니다: $CONDA"
else
  say "conda 가 없어 Miniforge 를 깝니다 (~/miniforge3, 몇 분 걸립니다)"
  CONDA="$(install_miniforge)" || oops "Miniforge 를 깔지 못했습니다. https://conda-forge.org/download/ 에서 받아 깐 뒤 이 명령을 다시 실행하세요."
fi
py() { "$CONDA" run --no-capture-output -n "$ENV_NAME" python "$@"; }

# ── 2-1. 환경 ────────────────────────────────────────────────────────────
if env_exists "$CONDA"; then
  say "이미 있는 환경을 최신으로 맞춥니다. 몇 분 걸립니다."
  "$CONDA" env update -n "$ENV_NAME" -f environment.yml --prune
else
  say "conda 환경을 처음 만듭니다: $ENV_NAME (몇 분 걸립니다)"
  "$CONDA" env create -f environment.yml
fi

# ── 3. 웹캠용 모델. 없어도 --sim 으로 돌아가므로 실패해도 멈추지 않는다 ──
MODEL="<모델파일>"
if [ ! -f "$MODEL" ]; then
  say "웹캠용 모델 파일을 받습니다"
  curl -fsSL -o "$MODEL" \
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/<모델파일>" \
    || say "모델을 받지 못했습니다. 웹캠 없이(--sim) 쓰는 데는 지장이 없습니다."
fi

# ── 4. Dicy2 엔진. 소리를 고르는 쪽이라 이 작품의 핵심이다 ──────────────
if [ ! -d "engine/<엔진>" ]; then
  say "Dicy2 엔진을 받습니다"
  mkdir -p engine
  git clone -q --depth 1 --recurse-submodules --shallow-submodules \
    https://github.com/<엔진 저장소> engine/<엔진> \
    || say "Dicy2 를 받지 못했습니다. 엔진 없이도 돌아갑니다(규칙으로 고릅니다)."
fi
if [ -d "engine/<엔진>" ]; then
  py -m pip install -q maxosc python-osc >/dev/null 2>&1 || true
fi

# ── 5. 소리 묶음 하나. 처음부터 진짜 소리가 나게 한다 ───────────────────
if [ ! -d "corpus/<자료이름>" ]; then
  say "소리 묶음(<자료이름>, 퍼블릭 도메인)을 받습니다"
  py fetch_corpus.py <자료이름> >/dev/null 2>&1 \
    || say "소리 묶음을 받지 못했습니다. 나중에 '\"$CONDA\" run -n $ENV_NAME python fetch_corpus.py <자료이름>' 로 받으면 됩니다."
fi

echo
say "다 됐습니다. 이렇게 켭니다."
echo
echo "    cd $DIR"
echo "    ./start.sh --corpus corpus/<자료이름>"
echo
echo "  켜지면 브라우저에서  127.0.0.1:7000  을 엽니다. 끌 때는 Ctrl+C 입니다."
echo "  다른 소리로 바꾸려면:  \"$CONDA\" run -n $ENV_NAME python fetch_corpus.py --list"
