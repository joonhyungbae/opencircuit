#Requires -Version 5.1
<#
.SYNOPSIS
  OpenCircuit 실습 웹 (React, 라이트 테마) — Windows
#>
[CmdletBinding()]
param(
  [switch]$NoOpen
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Web = Join-Path $Root "web"
$Port = 1234
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

if (-not (Test-Path (Join-Path $Web "package.json"))) {
  Write-Fail "web\ 폴더를 찾지 못했습니다. 저장소 루트에서 start.ps1 을 실행하세요."
}

try {
  $v = & node -v 2>$null
} catch { $v = $null }
if (-not $v -or -not ($v -match "v?(\d+)") -or [int]$Matches[1] -lt 20) {
  Write-Fail "Node 20+ 가 필요합니다. bootstrap\install.ps1 을 먼저 실행하세요."
}

if (-not (Test-Path (Join-Path $Web "node_modules"))) {
  Write-Info "처음 한 번, web 의존성을 설치합니다."
  Push-Location $Web
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

Write-Ok "실습 웹: $Url"
Write-Info "그만하려면 이 창에서 Ctrl+C 를 누르세요."

if (-not $NoOpen) {
  Start-Job -ScriptBlock {
    Start-Sleep -Seconds 2
    Start-Process $using:Url
  } | Out-Null
}

Set-Location $Web
& npm.cmd run dev -- --host 127.0.0.1 --port $Port --strictPort
if ($LASTEXITCODE -ne 0) {
  Write-Fail "웹을 띄우지 못했습니다. 포트 $Port 를 확인한 뒤 다시 실행하세요."
}
