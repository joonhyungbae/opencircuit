#Requires -Version 5.1
<#
.SYNOPSIS
  OpenCircuit 스터디 슬라이드 (React 템플릿) — Windows
.PARAMETER Deck
  띄울 슬라이드 폴더. 안 적으면 tools\react\baseline 을 띄웁니다.
.PARAMETER New
  문서 폴더에 내 발표 폴더를 만듭니다. 처음 한 번 여기서 시작하세요.
.PARAMETER Dir
  -New 가 쓸 문서 폴더를 직접 정합니다.
#>
[CmdletBinding()]
param(
  [Parameter(Position = 0)]
  [string]$Deck,
  [string]$New,
  [string]$Dir,
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
function Write-WarnMsg([string]$Message) { Write-Host "[주의] $Message" -ForegroundColor Yellow }
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

# 문서 폴더를 찾는다. 한국어 Windows 는 "문서", 영어는 "Documents" 다.
function Find-DocsDir {
  try {
    $d = [Environment]::GetFolderPath("MyDocuments")
    if ($d -and (Test-Path $d)) { return $d }
  } catch { }
  foreach ($c in @((Join-Path $env:USERPROFILE "Documents"), (Join-Path $env:USERPROFILE "문서"))) {
    if (Test-Path $c) { return $c }
  }
  return $null
}

# 내 발표 폴더를 만든다. 수강생이 숨김 폴더(%USERPROFILE%\.opencircuit)를 뒤지지 않게 하는 것이 요점이다.
function New-StudyFolder([string]$Name) {
  if ([string]::IsNullOrWhiteSpace($Name)) {
    Write-Fail "작품 이름을 적어 주세요. 예) .\web.ps1 -New 작품이름"
  }
  if ($Name -match '[\\/:*?"<>|]') {
    Write-Fail "작품 이름에 쓸 수 없는 글자가 있습니다: $Name"
  }

  $docs = if ([string]::IsNullOrWhiteSpace($Dir)) { Find-DocsDir } else { $Dir }
  if (-not $docs) {
    Write-Fail "문서 폴더를 찾지 못했습니다. -Dir 로 직접 정해 주세요."
  }
  if (-not (Test-Path $docs)) { Write-Fail "그런 폴더가 없습니다: $docs" }

  $base = Join-Path $Root "tools\react\baseline"
  if (-not (Test-Path (Join-Path $base "package.json"))) {
    Write-Fail "템플릿을 찾지 못했습니다: $base"
  }

  $target = Join-Path (Join-Path $docs "OpenCircuit") "$Name-study"
  if (Test-Path $target) {
    Write-Fail "이미 있습니다: $target`n지우거나 다른 이름을 쓰세요. 덮어쓰지 않습니다."
  }

  Write-Info "만드는 곳: $target"
  New-Item -ItemType Directory -Path $target -Force | Out-Null
  # node_modules 와 dist 는 빼고 옮긴다 — 무겁고, npm install 이 다시 만든다.
  Get-ChildItem -Path $base -Force |
    Where-Object { $_.Name -notin @("node_modules", "dist") } |
    ForEach-Object { Copy-Item -Path $_.FullName -Destination $target -Recurse -Force }

  # 절차서를 같이 둔다. 그래야 Cursor 채팅에서 @04-study-slides.md 로 부를 수 있다.
  $proc = Join-Path $Root "prompts\04-study-slides.md"
  if (Test-Path $proc) {
    Copy-Item -Path $proc -Destination $target -Force
  } else {
    Write-WarnMsg "절차서를 찾지 못했습니다: $proc"
  }
  Write-Ok "폴더를 만들었습니다."

  Write-Info "의존성을 설치합니다. 처음 한 번, 몇 분 걸립니다."
  Push-Location $target
  try {
    & npm.cmd install --no-fund --no-audit | Out-Null
    if ($LASTEXITCODE -eq 0) {
      Write-Ok "설치 완료. 발표 직전에 기다릴 일이 없습니다."
    } else {
      Write-WarnMsg "npm install 에 실패했습니다. 그 폴더에서 'npm install' 을 실행하세요."
    }
  } finally {
    Pop-Location
  }

  Write-Host ""
  Write-Ok "준비됐습니다: $target"
  Write-Host ""
  Write-Host "  1. Cursor 에서 File → Open Folder 로 위 폴더를 엽니다."
  Write-Host "  2. 채팅(에이전트 모드)에 이렇게 씁니다:"
  Write-Host ""
  Write-Host "       @04-study-slides.md"
  Write-Host "       논문 DOI: 10.1145/..."
  Write-Host "       이 논문으로 src/deck.json 을 채워 주세요."
  Write-Host ""
  Write-Host "  3. 확인:  .\web.ps1 `"$target`""
  Write-Host ""
}

if (-not [string]::IsNullOrWhiteSpace($New)) {
  New-StudyFolder $New
  exit 0
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
