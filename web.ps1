#Requires -Version 5.1
<#
.SYNOPSIS
  OpenCircuit 스터디 슬라이드 (React 템플릿) — Windows
.PARAMETER Deck
  띄울 슬라이드 폴더. 안 적으면 tools\react\baseline 을 띄웁니다.
#>
[CmdletBinding()]
param(
  [Parameter(Position = 0)]
  [string]$Deck,
  [switch]$NoOpen
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrWhiteSpace($Deck)) {
  $Deck = Join-Path $Root "tools\react\baseline"
}
$Port = 5173
$Url = "http://127.0.0.1:$Port"

function Write-Info([string]$Message) { Write-Host "[정보] $Message" -ForegroundColor Cyan }
function Write-Ok([string]$Message) { Write-Host "[성공] $Message" -ForegroundColor Green }
function Write-Fail([string]$Message) {
  Write-Host "[실패] $Message" -ForegroundColor Red
  exit 1
}

function Stop-PortListener([int]$Port) {
  $ids = @()
  try {
    $ids = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
      Select-Object -ExpandProperty OwningProcess -Unique)
  } catch { }
  if ($ids.Count -eq 0) {
    $rows = netstat -ano 2>$null | Select-String ":$Port\s+.*LISTENING"
    foreach ($row in $rows) {
      if ($row.Line -match "\s+(\d+)\s*$") { $ids += [int]$Matches[1] }
    }
    $ids = $ids | Select-Object -Unique
  }
  $ids = @($ids | Where-Object { $_ -and $_ -ne 0 })
  if ($ids.Count -eq 0) { return }
  Write-Info "포트 $Port 를 쓰던 프로세스를 종료합니다."
  foreach ($procId in $ids) {
    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
  }
  Start-Sleep -Milliseconds 400
}

if (-not (Test-Path (Join-Path $Deck "package.json"))) {
  Write-Fail "슬라이드 폴더를 찾지 못했습니다: $Deck"
}
if (-not (Test-Path (Join-Path $Deck "src\deck.json"))) {
  Write-Fail "src\deck.json 이 없습니다. 슬라이드 폴더가 맞는지 보세요: $Deck"
}

try {
  $v = & node -v 2>$null
} catch { $v = $null }
if (-not $v -or -not ($v -match "v?(\d+)") -or [int]$Matches[1] -lt 20) {
  Write-Fail "Node 20+ 가 필요합니다. bootstrap\install.ps1 을 먼저 실행하세요."
}

if (-not (Test-Path (Join-Path $Deck "node_modules"))) {
  Write-Info "처음 한 번, 슬라이드 의존성을 설치합니다. 몇 분 걸립니다."
  Push-Location $Deck
  try {
    & npm.cmd install --no-fund --no-audit
    if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
  } catch {
    Write-Fail "npm install 에 실패했습니다. 인터넷을 확인한 뒤 다시 실행하세요."
  } finally {
    Pop-Location
  }
}

Stop-PortListener $Port

Write-Ok "스터디 슬라이드: $Url"
Write-Info "고칠 파일: $Deck\src\deck.json"
Write-Info "그만하려면 이 창에서 Ctrl+C 를 누르세요."

if (-not $NoOpen) {
  Start-Job -ScriptBlock {
    Start-Sleep -Seconds 2
    Start-Process $using:Url
  } | Out-Null
}

Set-Location $Deck
& npm.cmd run dev -- --host 127.0.0.1 --port $Port --strictPort
if ($LASTEXITCODE -ne 0) {
  Write-Fail "슬라이드를 띄우지 못했습니다. 포트 $Port 를 확인한 뒤 다시 실행하세요."
}
