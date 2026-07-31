# OpenCircuit 아키텍처

수강생(미디어아트/공연/시각예술 작가, 비개발자)이 Cursor·Claude Code·Codex에서
같은 MCP 도구로 창작할 수 있게 하는 기반이다. 터미널 명령은 부트스트랩이 대신하고,
일상 작업은 MCP tool 호출로 한다.

---

## 1. 호스트 중립

| 우선순위 | 호스트 | 설정 위치 |
|---|---|---|
| 1 | Cursor | **전역** `~/.cursor/mcp.json` (프로젝트 `.cursor/mcp.json` 아님) |
| 2 | Claude Code | 해당 호스트 MCP 설정 |
| 3 | Codex CLI | `~/.codex/config.toml` (TOML) |

### Cursor MCP 설정은 전역만 쓴다

- **경로**: Windows `%USERPROFILE%\.cursor\mcp.json`, macOS `~/.cursor/mcp.json`
- **프로젝트 스코프(`<workspace>/.cursor/mcp.json`)는 쓰지 않는다.**
- **이유**: 수강생은 `opencircuit` 레포가 아니라 자기 작업 폴더에서 창작한다.
  도구가 폴더를 따라다녀야 하므로, 워크스페이스마다 설정을 두지 않고 전역에 한 번 등록한다.
- 부트스트랩은 이 전역 파일을 **생성하거나 병합**한다 (기존 서버 항목 보존).

그 외:

- MCP **서버 코드**는 호스트를 모른다. stdio로 뜨고 tool을 노출할 뿐이다.
- 호스트마다 다른 것은 **설정 파일 형식·경로**뿐이다. 서버 안에 `if (cursor)` 분기를 두지 않는다.
- mcp.json의 `command`는 **`node`(실제 실행파일) + 절대경로 args**다.
  Windows에서 `npx`(.cmd)를 쓸 때 필요했던 `cmd /c` 래핑은 **쓰지 않는다**.
  OS 분기는 경로 구분자(`\` / `/`) 정도만 남는다.

```
[Cursor / Claude Code / Codex]
        │  stdio (MCP)
        ▼
  ~/.opencircuit/repo/servers/*/dist  (git clone + 로컬 빌드)
```

---

## 2. 지식을 MCP 서버 안에 넣는다

Claude Code 스킬·서브에이전트·플러그인은 Cursor로 이식되지 않는다.
사용법·규약·주의사항은 호스트 전용 문서가 아니라 **모든 호스트가 읽는 두 곳**에 둔다.

| 위치 | 담을 내용 |
|---|---|
| tool description | 언제 쓰는지, 입력 규약, 흔한 실패 모드 |
| tool 반환값 | 결과 + **다음에 할 일** 안내 문장 |

예: `scaffold_station` 성공 시
「이제 `src/index.html`을 수정한 뒤 `publish_station`을 호출하세요」를 반환에 포함한다.

Phase 4에서 `instructions/` 원본 → `.cursor/rules`, `CLAUDE.md`, `AGENTS.md`를
생성할 예정이지만, **동작에 필요한 지식의 1차 출처는 여전히 tool description/반환값**이다.

---

## 3. 실패는 사람이 읽을 수 있어야 한다

수강생에게 스택 트레이스를 보여주지 않는다. 한국어로 **원인 + 다음 행동**을 쓴다.

- 나쁜 예: `Error: ENOENT: no such file or directory, open '.env'`
- 좋은 예: `APIFrame API 키가 없습니다. Cursor MCP 설정(~/.cursor/mcp.json)의 opencircuit-genmedia 서버 env 블록에 APIFRAME_KEY=... 를 넣어 주세요. 부트스트랩을 다시 실행하거나 해당 파일을 직접 수정한 뒤 Cursor를 재시작하세요.`

부트스트랩(`--doctor` 포함)과 MCP tool 모두 같은 규칙을 따른다.

---

## 기술 결정

| 항목 | 결정 | 이유 |
|---|---|---|
| 언어 | TypeScript, Node.js 20+ | MCP SDK·수업 중 수정 용이 |
| MCP | `@modelcontextprotocol/sdk`, stdio | 호스트 공통 |
| 배포 | **git clone** → `~/.opencircuit/repo` → `npm install` + 빌드 → `node` 절대경로 등록 | 네트워크는 설치·업데이트 시점에만. 기동은 순수 로컬 |
| 모노레포 | npm workspaces만 | Turborepo 등 추가 도구 없음 |
| 런타임 | 부트스트랩이 Node 설치 책임 | 수강생이 Node를 직접 설치하지 않게 |
| MCP 설정 | **전역** `~/.cursor/mcp.json` | 작업 폴더와 무관하게 도구 유지 |
| 비밀키 | mcp.json의 **`env` 블록** (`.env` 파일 아님) | 전역 설정·cwd 무관 |
| 도구 루트 | `~/.opencircuit/` | 도구 전용. 수강생 작업물 금지 |

하지 않는 것: Docker, 전역 `npm i -g`, npm publish를 배포 수단으로 쓰는 것,
이 페이즈의 테스트 프레임워크, 프로젝트 스코프 mcp.json, 비밀키용 `.env` 파일,
**관리자/`sudo`를 요구하는 설치 경로**(공식 `.pkg` 등). macOS는 Homebrew 또는
`~/.opencircuit/node`에 Node 바이너리 타르볼을 풀어 쓴다.
`cmd /c`로 `npx`를 감싸는 Windows 분기도 쓰지 않는다.

### 배포: git clone (npm publish 아님)

`npx -y`는 MCP 서버가 기동될 때마다 레지스트리를 조회하므로, 수업장 와이파이·오프라인에서
실패하기 쉽고 핫픽스 전달도 불확실하다.

**결정**: 부트스트랩이 레포를 `~/.opencircuit/repo`에 clone하고, 의존성 설치·빌드 후
`node` + `servers/hello/dist/index.js` 절대경로로 등록한다. 기동 시에는 네트워크가 필요 없다.

`package.json`의 `name`(`@opencircuit/mcp-hello` 등)은 워크스페이스 식별용으로만 남긴다.
npm org 확보·publish·마이너 버전 고정은 **하지 않는다**. 나중에 필요하면 그때 얹는다.

### 홈 디렉터리 레이아웃 (경로 충돌 방지)

| 경로 | 용도 |
|---|---|
| `~/.opencircuit/repo` | git clone 작업트리 |
| `~/.opencircuit/node` | macOS 등에서 관리자 없이 푼 Node 바이너리 (레포와 분리) |

clone 대상을 `~/.opencircuit` 루트로 두면 Node 타르볼이 작업트리를 오염시키므로 **반드시 `repo/` 하위에 clone**한다.

### 전제: 레포는 public이어야 한다

수강생이 GitHub 로그인 없이 clone하려면
[joonhyungbae/opencircuit](https://github.com/joonhyungbae/opencircuit) 가 **public**이어야 한다.
**8/29 수업 전에 public 전환이 필요하다.**

### `~/.opencircuit`은 도구 전용

- `repo/`·(필요 시) `node/` 만 둔다.
- 수강생 작품·스테이션·작업 폴더는 여기에 두지 않는다 (`git pull` 충돌 방지).
- 이 규칙을 bootstrap README에 한국어로 명시한다.

### 업데이트

```text
cd ~/.opencircuit/repo && git pull && npm install && npm run build
```

- 부트스트랩에 **`--update`** 플래그로 제공한다.
- Phase 2 이후: 위 절차를 `update_tools` MCP tool로 감싸
  수강생이 「도구 업데이트해줘」로 실행할 수 있게 한다 (**지금은 구현하지 않음**, 문서만).

### `--doctor`

설치를 건너뛰고 Node / git / Cursor / mcp.json / 서버응답 / **현재 커밋 해시**를 표로 출력한다.

### 비밀키는 mcp.json `env`에

전역 mcp.json을 쓰므로 서버는 cwd의 `.env`에 의존하지 않는다.
Phase 1부터 서버 항목에 `env` 자리를 잡아, Phase 3(`APIFRAME_KEY` 등)에서
스키마를 다시 쓰지 않는다.

예시 (Windows·macOS 동일 스키마, 경로 구분자만 다름):

```json
{
  "mcpServers": {
    "opencircuit-hello": {
      "command": "node",
      "args": ["C:\\Users\\…\\.opencircuit\\repo\\servers\\hello\\dist\\index.js"],
      "env": {}
    }
  }
}
```

macOS 예: `"args": ["/Users/…/.opencircuit/repo/servers/hello/dist/index.js"]`.
`command`는 양쪽 모두 `node` (필요하면 `node`의 절대경로). `cmd /c` 래핑 없음.

### 이름 규칙

| 대상 | 규칙 | 예 |
|---|---|---|
| 레포 폴더 | `servers/<역할>/` | `servers/hello/` |
| Cursor MCP 키 | `opencircuit-<역할>` | `opencircuit-hello` |
| 수강생 설치 위치 | `~/.opencircuit/repo` | — |

`package.json` name(`@opencircuit/mcp-*`)은 워크스페이스용이며 배포·MCP 키와 무관하다.

---

## Phase 1 범위와 레이아웃

이번 페이즈는 **레포 뼈대 + 부트스트랩 + 검증용 최소 서버**다.
`mcp-station`, `mcp-genmedia`, OSC, Unity, npm publish, `--dev` 키는 만들지 않는다.

```
opencircuit/                   # GitHub: joonhyungbae/opencircuit (public 필요)
  package.json                 # workspaces 루트
  servers/
    hello/                     # 검증용 최소 서버
      package.json             # name: @opencircuit/mcp-hello (식별용만)
      src/index.ts             # tool: ping
  bootstrap/
    install.ps1                # Windows
    install.sh                 # macOS
    README.md                  # 수강생용 한국어 안내
  docs/
    architecture.md            # 본 문서
```

수강생 머신에 설치된 뒤:

```
~/.opencircuit/
  repo/                        # git clone
    servers/hello/dist/index.js
  node/                        # (선택) macOS 홈 Node
```

### `servers/hello`

- tool 하나: `ping`
- description에 「설치·연결 검증용. 수업 시작 전 doctor와 함께 쓰세요」류 안내
- 반환: 성공 여부, (가능하면) 현재 커밋 식별, 다음 행동 안내

### 부트스트랩 순서

1. OS 판별 — 관리자 권한 없는 경로만 사용
2. Node 20+ 확인 → 없으면 설치
   - Windows: `winget install OpenJS.NodeJS.LTS` (사용자 스코프 가능 시 우선)
   - macOS: Homebrew 있으면 `brew install node`. 없으면 공식 바이너리 tarball을
     **`~/.opencircuit/node`**에 풀어 PATH에 추가 (관리자 암호 불필요). `.pkg`/sudo는 쓰지 않는다.
3. git 확인 → 없으면 설치(관리자 없이 가능한 경로 우선)
4. Cursor 확인 → 없으면 다운로드 URL 안내 후 **중단**
5. `https://github.com/joonhyungbae/opencircuit` → **`~/.opencircuit/repo`**
   - 없으면: `git clone --depth 1`
   - 있으면: `git pull` (멱등). `--update`는 pull + `npm install` + 빌드 강제
6. `~/.opencircuit/repo`에서 `npm install` 후 빌드
7. **전역** `~/.cursor/mcp.json` 생성 또는 **병합**
   - `opencircuit-hello` → `command: node`,
     `args: [<홈>/.opencircuit/repo/servers/hello/dist/index.js]`, `env: {}`
   - Windows/`cmd` 래핑 없음. macOS와 스키마 동일
8. 서버 1회 실행으로 MCP handshake 검증, 결과를 한국어로 출력
9. `--doctor`: Node / git / Cursor / mcp.json / 서버응답 / **현재 커밋 해시** 표

멱등: 두 번 실행해도 기존 MCP 항목을 지우지 않는다. `~/.opencircuit/repo`가 있으면 clone 대신 pull한다.

### 수락 기준

- [ ] Node/git이 없는 깨끗한 Windows에서 `install.ps1` → Cursor 재시작 →
      `opencircuit-hello` 초록불, `ping` 성공
- [ ] **비행기 모드에서 Cursor를 재시작해도 `ping`이 성공한다** (핵심)
- [ ] 두 번 실행해도 깨지지 않는다 (멱등). `~/.opencircuit/repo`가 이미 있으면 clone 대신 pull
- [ ] 기존 전역 mcp.json의 다른 서버 항목이 보존된다
- [ ] 서버 항목에 `env` 블록이 있다 (비어 있어도 됨)
- [ ] `--update`로 최신 커밋이 반영된다
- [ ] `--doctor`가 Node / git / Cursor / mcp.json / 서버응답 / 현재 커밋 해시를 표로 출력한다
- [ ] 모든 실패 메시지가 한국어이고 다음 행동을 지시한다

---

## 이후 페이즈 (참고 — 지금 구현하지 않음)

| Phase | 내용 |
|---|---|
| 2 | `mcp-station` — 스테이션 레포·배포. `update_tools` MCP tool로 `--update` 감싸기 |
| 3 | `mcp-genmedia` — APIFrame 키는 mcp.json `env`의 `APIFRAME_KEY` (스펙은 공식 문서 확인 후) |
| 4 | 호스트별 지시문 생성 (`instructions/` → rules / CLAUDE.md / AGENTS.md) |
| 5+ | `mcp-osc` → `mcp-unity` → `mcp-webaudio` |

서버가 늘어나도 원칙 1–3, 전역 mcp.json, `env` 블록, git clone 배포(`~/.opencircuit/repo`),
npm workspaces 구조는 그대로 유지한다.
