# 켜기 (윈도우)
#
#   .\start.ps1               카메라가 있으면 카메라로, 없으면 가짜 관객으로 켠다
#   .\start.ps1 --sim         언제나 가짜 관객으로
#   .\start.ps1 --offline 30  스피커 없이 30초를 out.wav 로 적는다
#
# conda 환경(<환경이름>)이 있으면 그것을, 없으면 .venv 를 쓴다.

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$EnvName = "<환경이름>"

# Dicy2 엔진이 깔려 있으면 서버를 대신 띄운다.
$Engine = "engine\<엔진>\dicy2_server.py"
$UseDicy2 = $false
if (Test-Path $Engine) {
  $UseDicy2 = $true
  $busy = Test-NetConnection -ComputerName 127.0.0.1 -Port 4566 -InformationLevel Quiet -WarningAction SilentlyContinue
  if (-not $busy) {
    Write-Host "▸ Dicy2 엔진을 켭니다" -ForegroundColor Cyan
    if (Get-Command conda -ErrorAction SilentlyContinue) {
      Start-Process -WindowStyle Hidden conda -ArgumentList "run","-n",$EnvName,"python",$Engine
    } else {
      Start-Process -WindowStyle Hidden python -ArgumentList $Engine
    }
    Start-Sleep 4
  }
}

$args2 = $args
if ($args2.Count -eq 0 -and -not (Test-Path "<모델파일>")) {
  Write-Host "▸ 웹캠용 모델이 없어 가짜 관객(--sim)으로 켭니다." -ForegroundColor Cyan
  $args2 = @("--sim")
}
if ($UseDicy2 -and ($args2 -notcontains "--engine")) { $args2 += @("--engine","dicy2") }
if ((Test-Path "corpus\<자료이름>") -and ($args2 -notcontains "--corpus")) { $args2 += @("--corpus","corpus\<자료이름>") }

# 브라우저를 3초 뒤에 연다. 서버가 뜰 틈을 준다.
Start-Job { Start-Sleep 3; Start-Process "http://127.0.0.1:7000" } | Out-Null

if ((Get-Command conda -ErrorAction SilentlyContinue) -and ((conda env list) -match "^\s*$EnvName\s")) {
  conda run --no-capture-output -n $EnvName python run.py @args2
} elseif (Test-Path ".venv") {
  & ".\.venv\Scripts\Activate.ps1"
  python run.py @args2
} else {
  Write-Host "먼저 설치해 주세요:  .\install.ps1" -ForegroundColor Red
  exit 1
}
