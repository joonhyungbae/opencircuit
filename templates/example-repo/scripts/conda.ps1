# conda 를 찾고, 없으면 Miniforge 를 깐다. install.ps1 · start.ps1 이 불러 쓴다.
# 터미널 설정을 읽지 않아도 찾도록 흔한 설치 위치를 차례로 본다.

$EnvName = "<환경이름>"

function Find-Conda {
  if ($env:CONDA_EXE -and (Test-Path $env:CONDA_EXE)) { return $env:CONDA_EXE }
  $c = Get-Command conda.exe -ErrorAction SilentlyContinue
  if ($c) { return $c.Source }
  foreach ($d in @("$env:USERPROFILE\miniforge3", "$env:USERPROFILE\mambaforge", "$env:USERPROFILE\miniconda3",
                   "$env:USERPROFILE\anaconda3", "$env:LOCALAPPDATA\miniforge3", "C:\ProgramData\miniforge3",
                   "C:\ProgramData\miniconda3", "C:\ProgramData\anaconda3")) {
    $exe = Join-Path $d "Scripts\conda.exe"
    if (Test-Path $exe) { return $exe }
  }
  return $null
}

# Miniforge 를 사용자 폴더(~\miniforge3)에 조용히 깐다. 관리자 권한이 필요 없다.
function Install-Miniforge {
  $exe = Join-Path $env:TEMP "Miniforge3-Windows-x86_64.exe"
  Invoke-WebRequest "https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-Windows-x86_64.exe" -OutFile $exe
  Start-Process -Wait -FilePath $exe -ArgumentList "/InstallationType=JustMe", "/RegisterPython=0", "/AddToPath=0", "/S", "/D=$env:USERPROFILE\miniforge3"
  return (Join-Path "$env:USERPROFILE\miniforge3" "Scripts\conda.exe")
}

function Test-CondaEnv($Conda) {
  return [bool]((& $Conda env list) | Select-String -Pattern "^$EnvName\s")
}
