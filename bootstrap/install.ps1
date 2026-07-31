#Requires -Version 5.1
<#
.SYNOPSIS
  OpenCircuit 수강생용 부트스트랩 (Windows)

.DESCRIPTION
  Node/git/Cursor 확인 후 GitHub 레포를 ~/.opencircuit/repo 에 clone·빌드하고
  전역 ~/.cursor/mcp.json 에 opencircuit-hello 를 등록합니다.

.PARAMETER Doctor
  설치 없이 현재 상태만 진단합니다.

.PARAMETER Update
  git pull + npm install + build 를 강제 수행합니다.
#>
[CmdletBinding()]
param(
  [switch]$Doctor,
  [switch]$Update
)

$ErrorActionPreference = "Stop"
$RepoUrl = "https://github.com/joonhyungbae/opencircuit.git"
$ServerKey = "opencircuit-hello"
$CursorDownloadUrl = "https://cursor.com/download"
$TarballUrl = "https://codeload.github.com/joonhyungbae/opencircuit/tar.gz/refs/heads/main"
$CommitApiUrl = "https://api.github.com/repos/joonhyungbae/opencircuit/commits/main"
$HomeOpenCircuit = Join-Path $env:USERPROFILE ".opencircuit"
$RepoDir = Join-Path $HomeOpenCircuit "repo"
$script:HasGit = $false
$McpJsonPath = Join-Path $env:USERPROFILE ".cursor\mcp.json"
$ScriptDir = $PSScriptRoot
$VerifyScript = Join-Path $ScriptDir "verify.mjs"
$MergeScript = Join-Path $ScriptDir "merge-mcp.mjs"

function Write-Info([string]$Message) { Write-Host "[정보] $Message" -ForegroundColor Cyan }
function Write-Ok([string]$Message) { Write-Host "[성공] $Message" -ForegroundColor Green }
function Write-WarnMsg([string]$Message) { Write-Host "[주의] $Message" -ForegroundColor Yellow }
function Write-Fail([string]$Message) {
  Write-Host "[실패] $Message" -ForegroundColor Red
}

function Get-NodeMajor {
  try {
    $v = & node -v 2>$null
    if (-not $v) { return $null }
    if ($v -match "v?(\d+)") { return [int]$Matches[1] }
    return $null
  } catch { return $null }
}

function Get-NodePath {
  try {
    $cmd = Get-Command node -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
  } catch { }
  return $null
}

function Get-NpmCmd {
  $nodePath = Get-NodePath
  if ($nodePath) {
    $candidate = Join-Path (Split-Path $nodePath) "npm.cmd"
    if (Test-Path $candidate) { return $candidate }
  }
  return "npm.cmd"
}

function Test-GitPresent {
  try {
    $null = & git --version 2>$null
    return ($LASTEXITCODE -eq 0)
  } catch { return $false }
}

function Test-CursorPresent {
  $candidates = @(
    (Join-Path $env:LOCALAPPDATA "Programs\cursor\Cursor.exe"),
    (Join-Path $env:LOCALAPPDATA "Programs\Cursor\Cursor.exe"),
    (Join-Path $env:LOCALAPPDATA "Programs\cursor\cursor.exe")
  )
  foreach ($p in $candidates) {
    if (Test-Path $p) { return $true }
  }
  try {
    if (Get-Command cursor -ErrorAction SilentlyContinue) { return $true }
  } catch { }
  return $false
}

function Get-HelloEntry {
  Join-Path $RepoDir "servers\hello\dist\index.js"
}

function Get-RepoCommit {
  if ((Test-Path (Join-Path $RepoDir ".git")) -and (Test-GitPresent)) {
    try {
      Push-Location $RepoDir
      $h = & git rev-parse --short HEAD 2>$null
      if ($LASTEXITCODE -eq 0 -and $h) { return $h.Trim() }
    } catch { } finally {
      Pop-Location
    }
  }
  # tarball 설치에는 .git 이 없다 — 설치 시 기록한 해시를 읽는다.
  $marker = Join-Path $RepoDir ".oc-commit"
  if (Test-Path $marker) {
    $v = (Get-Content $marker -Raw -ErrorAction SilentlyContinue)
    if ($v) { return $v.Trim() }
  }
  return $null
}

function Refresh-Path {
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
              [System.Environment]::GetEnvironmentVariable("Path", "User")
}

function Ensure-Node {
  $major = Get-NodeMajor
  if ($null -ne $major -and $major -ge 20) {
    Write-Ok "Node $(node -v) 확인"
    return
  }
  if ($null -ne $major) {
    Write-WarnMsg "Node v$major 가 너무 낮습니다. 20 이상이 필요합니다. 설치를 시도합니다."
  } else {
    Write-Info "Node가 없습니다. winget으로 LTS 설치를 시도합니다."
  }

  $winget = Get-Command winget -ErrorAction SilentlyContinue
  if (-not $winget) {
    Write-Fail "winget을 찾을 수 없습니다. https://nodejs.org 에서 Node 20 LTS 를 설치한 뒤 PowerShell을 새로 열고 이 스크립트를 다시 실행하세요."
    exit 1
  }

  try {
    & winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
  } catch {
    Write-Fail "Node 설치에 실패했습니다. https://nodejs.org 에서 Node 20 LTS 를 직접 설치한 뒤 PowerShell을 새로 열고 다시 실행하세요."
    exit 1
  }

  Refresh-Path
  $major = Get-NodeMajor
  if ($null -eq $major -or $major -lt 20) {
    Write-Fail "Node 설치 후에도 명령을 찾지 못했습니다. PowerShell을 완전히 닫았다가 다시 연 뒤 스크립트를 재실행하세요."
    exit 1
  }
  Write-Ok "Node $(node -v) 설치됨"
}

# git 은 있으면 쓰고 없으면 tarball 로 우회한다.
# winget 의 git 설치는 권한 승격 창을 띄울 수 있고, 수업 중에 이건 막히는 지점이다.
# 따라서 여기서 절대 중단하지 않는다.
function Resolve-GitAvailability {
  if (Test-GitPresent) {
    $script:HasGit = $true
    Write-Ok "git $((git --version) -replace 'git version ','') 확인"
    return
  }
  $winget = Get-Command winget -ErrorAction SilentlyContinue
  if ($winget) {
    Write-Info "git이 없습니다. winget으로 설치를 시도합니다."
    try {
      & winget install -e --id Git.Git --accept-package-agreements --accept-source-agreements
      Refresh-Path
    } catch { }
    if (Test-GitPresent) {
      $script:HasGit = $true
      Write-Ok "git 설치됨"
      return
    }
  }
  $script:HasGit = $false
  Write-WarnMsg "git이 없습니다. 내려받기(tarball) 방식으로 설치합니다 — 설치·사용에는 문제가 없습니다."
  Write-Info "나중에 git이 필요해지면 https://git-scm.com/download/win 에서 설치하고 부트스트랩을 다시 실행하세요."
}

# tarball 설치에는 .git 이 없으므로 커밋 해시를 파일로 남긴다.
# (doctor 가 수강생 간 버전을 대조하는 유일한 근거다)
function Save-CommitMarker {
  $sha = ""
  try {
    $resp = Invoke-RestMethod -Uri $CommitApiUrl -Headers @{ "User-Agent" = "opencircuit-bootstrap" } -TimeoutSec 20
    if ($resp -and $resp.sha) { $sha = [string]$resp.sha }
  } catch { }
  if ($sha.Length -ge 7) { $sha = $sha.Substring(0, 7) } else { $sha = "unknown" }
  Set-Content -Path (Join-Path $RepoDir ".oc-commit") -Value $sha -Encoding UTF8
}

function Install-RepoTarball {
  $tmp = Join-Path ([System.IO.Path]::GetTempPath()) ("oc-" + [guid]::NewGuid().ToString("N"))
  New-Item -ItemType Directory -Force -Path $tmp | Out-Null
  $archive = Join-Path $tmp "oc.tar.gz"
  Write-Info "도구 내려받기: $TarballUrl"
  try {
    Invoke-WebRequest -Uri $TarballUrl -OutFile $archive -UseBasicParsing
  } catch {
    Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
    Write-Fail "도구를 내려받지 못했습니다. 인터넷을 확인한 뒤 다시 실행하세요."
    exit 1
  }
  if (Test-Path $RepoDir) { Remove-Item -Recurse -Force $RepoDir }
  New-Item -ItemType Directory -Force -Path $RepoDir | Out-Null
  # tar.exe 는 Windows 10 1803+ 에 기본 포함되어 있다.
  & tar -xzf $archive -C $RepoDir --strip-components=1
  $tarOk = ($LASTEXITCODE -eq 0)
  Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
  if (-not $tarOk) {
    Write-Fail "내려받은 파일을 푸는 데 실패했습니다. 다시 실행하세요."
    exit 1
  }
  Save-CommitMarker
  Write-Ok "설치 완료 (커밋 $(Get-RepoCommit))"
}

function Ensure-CursorOrAbort {
  if (Test-CursorPresent) {
    Write-Ok "Cursor 확인"
    return
  }
  Write-Fail "Cursor가 설치되어 있지 않습니다. $CursorDownloadUrl 에서 설치한 뒤 이 스크립트를 다시 실행하세요."
  exit 1
}

function Ensure-Repo {
  param([switch]$ForceUpdate)

  New-Item -ItemType Directory -Force -Path $HomeOpenCircuit | Out-Null

  if (-not $script:HasGit) {
    # git 이 없으면 매번 새로 내려받는다. 멱등하고, 오프라인이 아닌 한 항상 성공한다.
    Install-RepoTarball
  }
  elseif (Test-Path (Join-Path $RepoDir ".git")) {
    Write-Info "기존 레포 발견: $RepoDir — git pull"
    Push-Location $RepoDir
    try {
      & git pull --ff-only
      if ($LASTEXITCODE -ne 0) {
        Write-Fail "git pull 에 실패했습니다. 네트워크를 확인하거나, 로컬 변경이 있다면 ~/.opencircuit 밖에서 작업 중인지 확인하세요."
        exit 1
      }
    } finally {
      Pop-Location
    }
    Write-Ok "pull 완료 (커밋 $(Get-RepoCommit))"
  }
  else {
    # tarball 로 설치했다가 나중에 git 이 생긴 경우 — 지우고 clone 으로 승격한다.
    if (Test-Path $RepoDir) {
      Write-Info "기존 설치를 git 저장소로 교체합니다."
      Remove-Item -Recurse -Force $RepoDir
    }
    Write-Info "레포 clone: $RepoUrl (branch main) → $RepoDir"
    # 원격 기본 브랜치가 gh-pages 일 수 있으므로 main 을 명시한다.
    & git clone --depth 1 --branch main $RepoUrl $RepoDir
    if ($LASTEXITCODE -ne 0) {
      Write-WarnMsg "git clone 에 실패했습니다. 내려받기(tarball) 방식으로 다시 시도합니다."
      Install-RepoTarball
    } else {
      Write-Ok "clone 완료"
    }
  }

  if ($ForceUpdate) {
    Write-Info "--update: pull 후 의존성·빌드를 다시 수행합니다."
  }
}

function Build-Repo {
  Write-Info "npm install + build: $RepoDir"
  $npm = Get-NpmCmd
  Push-Location $RepoDir
  try {
    & $npm install --no-fund --no-audit
    if ($LASTEXITCODE -ne 0) {
      throw "npm install failed"
    }
    & $npm run build
    if ($LASTEXITCODE -ne 0) {
      throw "npm run build failed"
    }
  } catch {
    Write-Fail "빌드에 실패했습니다. 인터넷 연결을 확인한 뒤 다시 실행하세요. (한 번 성공하면 이후 오프라인에서도 ping 이 됩니다.)"
    exit 1
  } finally {
    Pop-Location
  }

  $entry = Get-HelloEntry
  if (-not (Test-Path $entry)) {
    Write-Fail "빌드 후에도 진입 파일이 없습니다: $entry"
    exit 1
  }
  Write-Ok "빌드 완료 (커밋 $(Get-RepoCommit))"
}

function Read-McpJson {
  if (-not (Test-Path $McpJsonPath)) {
    return [pscustomobject]@{ mcpServers = [pscustomobject]@{} }
  }
  try {
    $raw = Get-Content $McpJsonPath -Raw -Encoding UTF8
    if ([string]::IsNullOrWhiteSpace($raw)) {
      return [pscustomobject]@{ mcpServers = [pscustomobject]@{} }
    }
    $j = $raw | ConvertFrom-Json
    if (-not $j.mcpServers) {
      $j | Add-Member -NotePropertyName mcpServers -NotePropertyValue ([pscustomobject]@{}) -Force
    }
    return $j
  } catch {
    Write-Fail "기존 mcp.json 을 읽지 못했습니다: $McpJsonPath . JSON 문법을 고친 뒤 다시 실행하세요."
    exit 1
  }
}

function Merge-McpConfig {
  $nodePath = Get-NodePath
  if (-not $nodePath) {
    Write-Fail "node 경로를 찾지 못했습니다. PowerShell을 다시 연 뒤 재실행하세요."
    exit 1
  }
  if (-not (Test-Path $MergeScript)) {
    Write-Fail "병합 스크립트가 없습니다: $MergeScript . 레포 clone 이 완전한지 확인하세요."
    exit 1
  }

  # clone 이후에는 설치된 레포의 merge 스크립트를 우선 사용
  $mergeInRepo = Join-Path $RepoDir "bootstrap\merge-mcp.mjs"
  $merge = if (Test-Path $mergeInRepo) { $mergeInRepo } else { $MergeScript }

  $entry = Get-HelloEntry
  $beforeKeys = @()
  if (Test-Path $McpJsonPath) {
    try { $beforeKeys = @((Read-McpJson).mcpServers.PSObject.Properties.Name) } catch { }
  }

  Write-Info "등록: $ServerKey → $entry"
  $out = & $nodePath $merge $McpJsonPath $ServerKey $nodePath $entry 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Fail "mcp.json 병합 실패:`n$($out | Out-String)"
    exit 1
  }
  Write-Ok "mcp.json 저장: $McpJsonPath"
  $afterKeys = @((Read-McpJson).mcpServers.PSObject.Properties.Name)
  if ($beforeKeys.Count -gt 0) {
    Write-Ok "서버 키: $($afterKeys -join ', ')"
  }
}

function Invoke-Verify {
  $nodePath = Get-NodePath
  $entry = Get-HelloEntry
  $verifyInRepo = Join-Path $RepoDir "bootstrap\verify.mjs"
  $verify = if (Test-Path $verifyInRepo) { $verifyInRepo } else { $VerifyScript }

  if (-not $nodePath) {
    Write-Fail "node를 찾을 수 없습니다."
    return $false
  }
  if (-not (Test-Path $entry)) {
    Write-Fail "서버 진입 파일이 없습니다: $entry . 부트스트랩을 다시 실행하세요."
    return $false
  }

  Write-Info "opencircuit-hello handshake 검증 중..."
  $output = & $nodePath $verify $nodePath $entry 2>&1
  $code = $LASTEXITCODE
  $text = ($output | Out-String).Trim()
  if ($code -ne 0) {
    Write-Fail "검증 실패:`n$text"
    return $false
  }
  Write-Ok "검증 성공"
  Write-Host $text
  return $true
}

function Show-Doctor {
  Write-Host ""
  Write-Host "==== OpenCircuit Doctor ====" -ForegroundColor Magenta

  $rows = @()

  $major = Get-NodeMajor
  $nodeStatus = if ($null -ne $major -and $major -ge 20) { "OK ($(node -v))" } else { "FAIL (Node 20+ 필요)" }
  $rows += [pscustomobject]@{ Item = "Node"; Status = $nodeStatus }

  $gitStatus = if (Test-GitPresent) {
    "OK ($((git --version) -replace 'git version ',''))"
  } elseif (Test-Path (Join-Path $RepoDir ".oc-commit")) {
    "없음 — tarball 모드 (정상)"
  } else {
    "없음 (설치 시 tarball 로 우회됩니다)"
  }
  $rows += [pscustomobject]@{ Item = "git"; Status = $gitStatus }

  $cursorStatus = if (Test-CursorPresent) { "OK" } else { "FAIL ($CursorDownloadUrl 에서 설치)" }
  $rows += [pscustomobject]@{ Item = "Cursor"; Status = $cursorStatus }

  $mcpStatus = "FAIL (파일 없음)"
  $prodPath = $null
  if (Test-Path $McpJsonPath) {
    try {
      $cfg = Read-McpJson
      $keys = @($cfg.mcpServers.PSObject.Properties.Name)
      if ($keys -contains $ServerKey) {
        $prodPath = [string]$cfg.mcpServers.$ServerKey.args[0]
        $mcpStatus = "OK (키: $($keys -join ', '))"
      } else {
        $mcpStatus = "FAIL (opencircuit-hello 없음 — 부트스트랩 실행)"
      }
    } catch {
      $mcpStatus = "FAIL (JSON 파싱 오류)"
    }
  }
  $rows += [pscustomobject]@{ Item = "mcp.json"; Status = $mcpStatus }

  $verStatus = "FAIL (서버 진입 파일 없음)"
  $entry = $null
  if ($prodPath -and (Test-Path $prodPath)) { $entry = $prodPath }
  elseif (Test-Path (Get-HelloEntry)) { $entry = Get-HelloEntry }

  if ($entry -and (Get-NodeMajor) -ge 20) {
    $verifyInRepo = Join-Path $RepoDir "bootstrap\verify.mjs"
    $verify = if (Test-Path $verifyInRepo) { $verifyInRepo } else { $VerifyScript }
    $out = & (Get-NodePath) $verify (Get-NodePath) $entry 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0) {
      $c = if ($out -match "COMMIT=(\S+)") { $Matches[1] } else { "unknown" }
      $verStatus = "OK (commit=$c)"
    } else {
      $verStatus = "FAIL (서버 무응답 — 부트스트랩 재실행)"
    }
  }
  $rows += [pscustomobject]@{ Item = "Server"; Status = $verStatus }

  $commit = Get-RepoCommit
  $commitStatus = if ($commit) { "OK ($commit)" } else { "FAIL (repo 없음 — 부트스트랩 실행)" }
  $rows += [pscustomobject]@{ Item = "Commit"; Status = $commitStatus }

  $rows | Format-Table -AutoSize | Out-String | Write-Host
  Write-Host "mcp.json: $McpJsonPath"
  Write-Host "repo: $RepoDir"
  Write-Host ""
}

# ---- main ----
Write-Host ""
Write-Host "OpenCircuit 부트스트랩" -ForegroundColor Magenta

if ($Doctor) {
  Show-Doctor
  exit 0
}

Ensure-Node
Resolve-GitAvailability
Ensure-CursorOrAbort
Ensure-Repo -ForceUpdate:$Update
Build-Repo
Merge-McpConfig
$ok = Invoke-Verify
if (-not $ok) { exit 1 }

Write-Host ""
Write-Ok "준비 완료. Cursor를 완전히 종료했다가 다시 연 뒤 MCP 목록에서 opencircuit-hello 초록불을 확인하세요."
Write-Info "도구 위치: $RepoDir — 작품·작업 폴더는 여기에 두지 마세요."
Write-Info "업데이트: .\install.ps1 -Update"
Write-Host ""
