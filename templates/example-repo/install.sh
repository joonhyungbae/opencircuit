#!/usr/bin/env bash
#
# 한 줄로 깔기 (맥 · 리눅스)
#
#   curl -fsSL https://raw.githubusercontent.com/<계정>/<저장소>/main/install.sh | bash
#
# 하는 일: 저장소 받기 → conda 환경 만들기 → 필요한 것 설치 → 웹캠 모델 받기 → 켜는 법 알려 주기.
# conda 가 없으면 파이썬 가상환경으로 대신 깐다. 이미 받아 둔 폴더 안에서 실행해도 된다.
set -euo pipefail

REPO="https://github.com/<계정>/<저장소>"
NAME="<저장소>"
ENV_NAME="<환경이름>"

say() { printf '\033[1;36m▸\033[0m %s\n' "$*"; }
oops() { printf '\033[1;31m✗\033[0m %s\n' "$*" >&2; exit 1; }

# ── 1. 저장소 ────────────────────────────────────────────────────────────
if [ -f "run.py" ] && [ -d "<환경이름>" ]; then
  DIR="$(pwd)"
  say "이미 받아 둔 폴더에서 실행합니다: $DIR"
else
  command -v git >/dev/null 2>&1 \
    || oops "git 이 필요합니다. 맥은 'xcode-select --install', 리눅스는 'sudo apt install git' 으로 깝니다."
  DIR="$(pwd)/$NAME"
  if [ -d "$DIR" ]; then
    say "폴더가 이미 있어 최신으로 받습니다: $DIR"
    git -C "$DIR" pull --ff-only >/dev/null 2>&1 || say "최신으로 받지 못했습니다. 있는 그대로 씁니다."
  else
    say "받는 중: $DIR"
    git clone -q "$REPO" "$DIR"
  fi
fi
cd "$DIR"

# ── 2. 환경 ──────────────────────────────────────────────────────────────
# conda 쪽을 먼저 본다. 소리 라이브러리가 pip 보다 덜 깨진다.
if command -v conda >/dev/null 2>&1; then
  say "conda 로 환경을 만듭니다: $ENV_NAME"
  if conda env list | awk '{print $1}' | grep -qx "$ENV_NAME"; then
    say "이미 있는 환경을 최신으로 맞춥니다. 몇 분 걸립니다."
    conda env update -n "$ENV_NAME" -f environment.yml --prune
  else
    say "처음 만드는 중입니다. 몇 분 걸립니다."
    conda env create -f environment.yml
  fi
  HOW="conda activate $ENV_NAME"
else
  say "conda 가 없어 파이썬 가상환경으로 깝니다."
  say "소리 장치가 말썽이면 나중에 Miniconda 를 깔고 이 명령을 다시 실행하세요: https://docs.conda.io/projects/miniconda/"
  PY=""
  for c in python3 python; do
    if command -v "$c" >/dev/null 2>&1 \
      && "$c" -c 'import sys; raise SystemExit(0 if sys.version_info >= (3,10) else 1)' 2>/dev/null; then
      PY="$c"; break
    fi
  done
  [ -n "$PY" ] || oops "파이썬 3.10 이상이 필요합니다. https://www.python.org/downloads/ 에서 받아 깐 뒤 터미널을 껐다 다시 열고 실행하세요."
  [ -d ".venv" ] || "$PY" -m venv .venv
  # shellcheck disable=SC1091
  source .venv/bin/activate
  python -m pip install -q --upgrade pip
  python -m pip install -q -r requirements.txt
  HOW="source .venv/bin/activate"
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
  if command -v conda >/dev/null 2>&1 && conda env list | awk '{print $1}' | grep -qx "$ENV_NAME"; then
    conda run -n "$ENV_NAME" python -m pip install -q maxosc python-osc >/dev/null 2>&1 || true
  else
    python -m pip install -q maxosc python-osc >/dev/null 2>&1 || true
  fi
fi

# ── 5. 소리 묶음 하나. 처음부터 진짜 소리가 나게 한다 ───────────────────
if [ ! -d "corpus/<자료이름>" ]; then
  say "소리 묶음(<자료이름>, 퍼블릭 도메인)을 받습니다"
  if command -v conda >/dev/null 2>&1 && conda env list | awk '{print $1}' | grep -qx "$ENV_NAME"; then
    conda run --no-capture-output -n "$ENV_NAME" python fetch_corpus.py <자료이름> >/dev/null 2>&1 \
      || say "소리 묶음을 받지 못했습니다. 나중에 'python fetch_corpus.py <자료이름>' 로 받으면 됩니다."
  else
    python fetch_corpus.py <자료이름> >/dev/null 2>&1 \
      || say "소리 묶음을 받지 못했습니다. 나중에 'python fetch_corpus.py <자료이름>' 로 받으면 됩니다."
  fi
fi

echo
say "다 됐습니다. 이렇게 켭니다."
echo
echo "    cd $DIR"
echo "    ./start.sh --corpus corpus/<자료이름>"
echo
echo "  켜지면 브라우저에서  127.0.0.1:7000  을 엽니다. 끌 때는 Ctrl+C 입니다."
echo "  다른 소리로 바꾸려면:  python fetch_corpus.py --list"
echo "  터미널에서 직접 켜고 싶으면:  $HOW  그다음  python run.py --sim"
