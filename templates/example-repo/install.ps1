# 한 줄로 깔기 (윈도우)
#
#   Set-ExecutionPolicy -Scope Process Bypass -Force
#   irm https://raw.githubusercontent.com/<계정>/<저장소>/main/install.ps1 -OutFile "$env:TEMP\sc-install.ps1"
#   & "$env:TEMP\sc-install.ps1"
#
# 하는 일: 저장소 받기 → conda 확인(없으면 Miniforge 를 깐다) → conda 환경 만들기
#          → 웹캠 모델 받기 → 켜는 법 알려 주기.
# 언제나 conda 환경으로 돌린다. venv 나 시스템 파이썬으로 넘어가지 않는다.

$ErrorActionPreference = "Stop"
$Repo = "https://github.com/<계정>/<저장소>"
$Name = "<저장소>"

function Say($m)  { Write-Host "▸ $m" -ForegroundColor Cyan }
function Oops($m) { Write-Host "✗ $m" -ForegroundColor Red; exit 1 }

# ── 1. 저장소 ────────────────────────────────────────────────────────────
if ((Test-Path "run.py") -and (Test-Path "<환경이름>")) {
  $Dir = (Get-Location).Path
  Say "이미 받아 둔 폴더에서 실행합니다: $Dir"
} else {
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Oops "git 이 필요합니다. https://git-scm.com/download/win 에서 받아 깐 뒤 PowerShell 을 껐다 다시 열고 실행하세요."
  }
  $Dir = Join-Path (Get-Location).Path $Name
  if (Test-Path $Dir) {
    Say "폴더가 이미 있어 최신으로 받습니다: $Dir"
    git -C $Dir pull --ff-only | Out-Null
  } else {
    Say "받는 중: $Dir"
    git clone -q $Repo $Dir
  }
}
Set-Location $Dir

. .\scripts\conda.ps1   # $EnvName, Find-Conda, Install-Miniforge, Test-CondaEnv

# ── 2. conda. 없으면 Miniforge 를 사용자 폴더에 깐다 ───────────────────────
$Conda = Find-Conda
if ($Conda) {
  Say "conda 를 씁니다: $Conda"
} else {
  Say "conda 가 없어 Miniforge 를 깝니다 (~\miniforge3, 몇 분 걸립니다)"
  $Conda = Install-Miniforge
}
if (Test-CondaEnv $Conda) {
  Say "이미 있는 환경을 최신으로 맞춥니다. 몇 분 걸립니다."
  & $Conda env update -n $EnvName -f environment.yml --prune
} else {
  Say "conda 환경을 처음 만듭니다: $EnvName (몇 분 걸립니다)"
  & $Conda env create -f environment.yml
}

# ── 3. 웹캠용 모델 ───────────────────────────────────────────────────────
$Model = "<모델파일>"
if (-not (Test-Path $Model)) {
  Say "웹캠용 모델 파일을 받습니다"
  try {
    Invoke-WebRequest -UseBasicParsing -OutFile $Model `
      "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/<모델파일>"
  } catch {
    Say "모델을 받지 못했습니다. 웹캠 없이(--sim) 쓰는 데는 지장이 없습니다."
  }
}

# ── 4. Dicy2 엔진 ────────────────────────────────────────────────────────
if (-not (Test-Path "engine/<엔진>")) {
  Say "Dicy2 엔진을 받습니다"
  New-Item -ItemType Directory -Force -Path engine | Out-Null
  try {
    git clone -q --depth 1 --recurse-submodules --shallow-submodules `
      https://github.com/<엔진 저장소> engine/<엔진>
  } catch {
    Say "Dicy2 를 받지 못했습니다. 엔진 없이도 돌아갑니다(규칙으로 고릅니다)."
  }
}
if (Test-Path "engine/<엔진>") {
  try {
    & $Conda run -n $EnvName python -m pip install -q maxosc python-osc | Out-Null
  } catch { }
}

# ── 5. 소리 묶음 하나 ────────────────────────────────────────────────────
if (-not (Test-Path "corpus/<자료이름>")) {
  Say "소리 묶음(<자료이름>, 퍼블릭 도메인)을 받습니다"
  try {
    & $Conda run --no-capture-output -n $EnvName python fetch_corpus.py <자료이름> | Out-Null
  } catch {
    Say "소리 묶음을 받지 못했습니다. 나중에 'python fetch_corpus.py <자료이름>' 로 받으면 됩니다."
  }
}

Write-Host ""
Say "다 됐습니다. 이렇게 켭니다."
Write-Host ""
Write-Host "    cd $Dir"
Write-Host "    .\start.ps1 --corpus corpus/<자료이름>"
Write-Host ""
Write-Host "  켜지면 브라우저에서  127.0.0.1:7000  을 엽니다. 끌 때는 Ctrl+C 입니다."
Write-Host "  직접 켜고 싶으면:  & `"$Conda`" run -n $EnvName python run.py --sim"
