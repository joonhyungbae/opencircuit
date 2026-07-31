# Cursor 프롬프트 — Phase 1: 레포 뼈대 + 부트스트랩

> 사용법: Cursor 에이전트 모드에서 이 파일 전체를 붙여넣거나 `@01-bootstrap.md` 로 참조.

---

## 프로젝트 맥락

`<오픈서킷 부산: 아트앤테크 프랙티스>`는 부산 청년 작가 10명 내외가 4개월간 아트앤테크
작품 한 편을 완성해 전시까지 가는 교육 프로그램이다. 2026.08.29 ~ 12.19.

이 저장소(`opencircuit`)는 **수강생에게 제공할 창작 도구 기반**을 만든다.
수강생 각자가 좋은 baseline에서 시작할 수 있게 하는 것이 목적이다.

**수강생 프로필이 설계를 지배한다: 개발자가 아니다.** 미디어아트/공연/시각예술 작가이고,
터미널을 처음 여는 사람도 있다고 가정하라. "npm install 하세요"는 지시가 아니라 장벽이다.

전체 커리큘럼(9회차)과 각 회차가 요구하는 스택:

| 회차 | 날짜 | 주제 | 필요 스택 |
|---|---|---|---|
| 1 | 08.29 | Cursor 기반 MCP 오케스트레이션으로 첫 시제작 | Cursor, GitHub, APIFrame |
| 2 | 09.02 | 아이스브레이킹 (온라인) | — |
| 3 | 09.05 | 모션캡처·실시간 인터랙티브 | OSC, MoCap |
| 4 | 09.19 | Unity 실시간 영상·인터랙션 | Unity, C# |
| 5 | 10.24 | 생성형 AI 제작 파이프라인 | 이미지/영상 생성 API |
| 6 | 11.07 | 키네틱·피지컬 컴퓨팅 | Arduino, 시리얼 |
| 7 | 11.21 | 오픈포럼 「공유 지식 인프라」 | 문서화 |
| 8 | 12.05 | 웹 사운드아트 | Web Audio API |
| 9 | 12.12 | 공동 크리틱 | — |

---

## 아키텍처 원칙 (반드시 지킬 것)

**1. 호스트 중립.** 1순위 타깃은 Cursor, 2순위는 Claude Code와 Codex CLI다.
MCP 서버는 셋 다에서 동일하게 동작한다 — 호스트마다 다른 건 설정 파일 형식뿐이다.
서버 코드에 특정 호스트를 가정하는 분기를 절대 넣지 마라.

**2. 지식을 MCP 서버 안에 넣는다.** Claude Code의 스킬·서브에이전트·플러그인은
Cursor로 이식되지 않는다. 따라서 보통 스킬에 넣을 사용법·규약·주의사항을
**tool description과 tool 반환값**에 담아야 한다. 이 둘은 모든 호스트에서 모델이 읽는다.

- tool description: 언제 쓰는지, 입력 규약, 흔한 실패 모드
- tool 반환값: 결과 + **다음에 무엇을 할지에 대한 안내 문장**

예) `scaffold_station` 이 레포를 만들고 끝내지 말고, 반환 텍스트에
"이제 `src/index.html` 을 수정한 뒤 `publish_station` 을 호출하세요" 를 포함시킨다.

**3. 실패는 사람이 읽을 수 있어야 한다.** 스택 트레이스가 아니라
"APIFrame API 키가 없습니다. `.env` 파일에 `APIFRAME_KEY=...` 를 추가하세요" 같은 문장.

---

## 기술 결정 (확정됨 — 임의로 바꾸지 말 것)

- **언어: TypeScript / Node.js 20+**
- **MCP SDK: `@modelcontextprotocol/sdk`** (stdio transport)
- **배포: npm 퍼블리시 → `npx` 로 실행.**
  단일 실행파일 번들 대신 이걸 택한 이유는 (a) 빌드 파이프라인이 단순하고
  (b) 수업 중 서버를 고쳐서 즉시 재배포할 수 있어야 하기 때문이다.
  대가로 **Node 런타임 설치를 부트스트랩이 책임진다.**
- **패키지 스코프: `@opencircuit/mcp-*`**
- **모노레포**: npm workspaces (Turborepo 등 추가 도구 없이)

---

## 이번 작업 범위 (Phase 1)

**레포 뼈대 + 부트스트랩 스크립트만.** MCP 서버 구현은 다음 페이즈다.
단, 부트스트랩이 등록할 대상이 필요하므로 **`@opencircuit/mcp-hello` 라는
최소 동작 서버 하나**를 함께 만든다 (tool 1개: `ping` — 설치 검증용).

범위를 넘어서 `mcp-station`, `mcp-genmedia`, OSC, Unity 관련 코드를 미리 만들지 마라.

### 산출물

```
opencircuit/
  package.json            # npm workspaces 루트
  servers/
    hello/                # @opencircuit/mcp-hello — 검증용 최소 서버
      package.json
      src/index.ts
  bootstrap/
    install.ps1           # Windows
    install.sh            # macOS
    README.md             # 수강생용 안내 (한국어, 스크린샷 자리 표시)
  docs/
    architecture.md       # 위 원칙 3개를 정리
```

### 부트스트랩이 하는 일 (순서대로)

1. OS 판별, 관리자 권한 불필요한 경로로만 동작
2. **Node 20+ 확인 → 없으면 설치**
   - Windows: `winget install OpenJS.NodeJS.LTS`
   - macOS: Homebrew 있으면 `brew install node`, 없으면 공식 설치 프로그램 안내
3. **git 확인 → 없으면 설치**
4. **Cursor 설치 여부 확인** — 없으면 다운로드 URL 안내 후 중단
5. **`.cursor/mcp.json` 생성/병합**
   - 기존 파일이 있으면 **덮어쓰지 말고 병합**할 것 (수강생이 다른 MCP를 이미 쓸 수 있다)
   - ⚠️ **Windows에서는 `npx` 를 직접 command 로 쓰면 stdio 연결이 실패한다.**
     `command: "cmd"`, `args: ["/c", "npx", "-y", "@opencircuit/mcp-hello"]` 형태로 감쌀 것.
     macOS는 `command: "npx"` 로 충분하다. 이 분기를 반드시 구현하라.
6. **검증**: 서버를 한 번 실행해 MCP handshake 가 성립하는지 확인하고 결과를 사람이 읽을 수 있게 출력
7. **`--doctor` 플래그**: 설치는 건너뛰고 현재 상태만 진단해 출력
   (수업 중 "안 되는데요" 대응용 — 이게 실전에서 제일 많이 쓰인다)

### 수락 기준

- [ ] Node 가 **설치되지 않은** 깨끗한 Windows 머신에서 `install.ps1` 실행 → Cursor 재시작 → Cursor MCP 설정에 `opencircuit-hello` 가 초록불로 뜨고 `ping` tool 호출이 성공한다
- [ ] 같은 스크립트를 **두 번** 실행해도 깨지지 않는다 (멱등)
- [ ] 기존 `.cursor/mcp.json` 에 다른 서버가 있어도 그 항목이 보존된다
- [ ] 모든 실패 메시지가 한국어이고, 다음 행동을 지시한다
- [ ] `--doctor` 가 Node/git/Cursor/mcp.json/서버응답 5개 항목을 체크해 표로 출력한다

---

## 하지 말 것

- 스택 트레이스를 그대로 수강생에게 노출
- `sudo` / 관리자 권한 요구
- 전역 npm 패키지 설치 (`npm i -g`) — 권한 문제의 온상
- Docker 의존
- 테스트 프레임워크 도입 (이 페이즈에서는 불필요)
- README에 영어 지시문

---

## 작업 방식

1. 먼저 `docs/architecture.md` 를 써서 설계를 확정하고 **나에게 확인받아라**
2. 승인 후 코드 작성
3. `install.ps1` 은 이 머신(Windows 11)에서 실제로 실행해 검증하라 —
   단, Node 는 이미 설치돼 있을 수 있으므로 "미설치" 경로는 코드 리뷰로 대신하고
   그 사실을 명시하라

---

# 다음 페이즈 (지금 하지 말 것)

**Phase 2 — `@opencircuit/mcp-station`**
수강생별 웹사이트(스테이션)의 GitHub 레포 생성·커밋·배포.
1회차 실라버스의 "GitHub 사용법"에 대응하고, 이후 전 회차 산출물이 여기 쌓인다.
tool 후보: `create_station`, `publish_station`, `add_work_log`

**Phase 3 — `@opencircuit/mcp-genmedia`**
APIFrame 연동 이미지/영상 생성. 1회차 "첫 시제작"의 결과물이 나오는 부분.
⚠️ APIFrame API 스펙은 추측하지 말고 공식 문서를 확인한 뒤 구현할 것.

**Phase 4 (9월) — 호스트 이식**
`instructions/` 단일 원본 → `.cursor/rules/*.mdc`, `CLAUDE.md`, `AGENTS.md` 생성 스크립트.
Codex 는 `~/.codex/config.toml` (TOML) 이라 형식이 다르다.

**Phase 5+ — 회차별 서버**
`mcp-osc`(3·6·8회차 공용, 재사용 밀도 최고) → `mcp-unity`(4회차) → `mcp-webaudio`(8회차)
