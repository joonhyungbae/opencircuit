<div align="center">

# OpenCircuit

**아트앤테크 창작을 위한 MCP 도구 모음**

[![Program](https://img.shields.io/badge/opencircuit.club-000000?style=flat-square)](https://opencircuit.club)
[![Node](https://img.shields.io/badge/Node-20%2B-5FA04E?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![MCP](https://img.shields.io/badge/Model_Context_Protocol-stdio-6E56CF?style=flat-square)](https://modelcontextprotocol.io)

한국어 · [English](README.en.md)

</div>

---

## 무엇인가요

**‹오픈서킷 부산: 아트앤테크 프랙티스›** 수강생이 Cursor에서 곧바로 창작을 시작할 수 있도록
만든 MCP(Model Context Protocol) 서버 모음입니다.

작가가 터미널·설정 파일과 씨름하는 대신, AI 에디터에게 말을 걸어 모션캡처를 붙이고
사운드를 만들고 작업을 웹에 올릴 수 있게 하는 것이 목표입니다.

프로그램 소개 → **[opencircuit.club](https://opencircuit.club)**

---

## 설치

Cursor가 이미 설치되어 있어야 합니다. 나머지(Node·git)는 부트스트랩이 알아서 처리합니다.

**Windows** — PowerShell에서:

```powershell
irm https://raw.githubusercontent.com/joonhyungbae/opencircuit/main/bootstrap/install.ps1 -OutFile "$env:TEMP\oc-install.ps1"
& "$env:TEMP\oc-install.ps1"
```

**macOS** — 터미널에서:

```bash
curl -fsSL https://raw.githubusercontent.com/joonhyungbae/opencircuit/main/bootstrap/install.sh -o /tmp/oc-install.sh
bash /tmp/oc-install.sh
```

설치가 끝나면 **Cursor를 완전히 종료했다가 다시 열고**, MCP 목록에서 `opencircuit-hello`가
초록불인지 확인하세요. 그다음 Cursor에게 이렇게 말해 보세요:

> ping 해줘

---

## 명령

| 명령 | 하는 일 |
|---|---|
| `install.ps1` / `install.sh` | 설치 (여러 번 실행해도 안전합니다) |
| `--doctor` | 어디가 문제인지 진단합니다. **안 될 때 가장 먼저 쓰세요** |
| `--update` | 도구를 최신 버전으로 갱신합니다 |

---

## 담긴 도구

회차별 수업에서 필요한 것을 서버 하나씩으로 만듭니다.

| 서버 | 역할 | 대응 회차 |
|---|---|---|
| `hello` | 설치·연결 검증 | — |
| `station` | 개인 웹사이트(스테이션) 생성·배포 | 1회차 · 상시 |
| `genmedia` | 이미지·영상 생성 파이프라인 | 1 · 5회차 |
| `osc` | 모션캡처·센서·사운드 브리지 | 3 · 6 · 8회차 |
| `unity` | 게임 엔진 연동 | 4회차 |
| `webaudio` | 웹 사운드아트 | 8회차 |

> 현재는 `hello`만 구현되어 있습니다. 나머지는 수업 일정에 맞춰 추가됩니다.

---

## 구조

```
opencircuit/
├── servers/            # MCP 서버 (역할별)
│   └── hello/
├── bootstrap/          # 설치 스크립트
│   ├── install.ps1     # Windows
│   ├── install.sh      # macOS
│   └── README.md       # 수강생용 상세 안내
└── docs/
    └── architecture.md # 설계 원칙과 결정 기록
```

설치되면 도구는 `~/.opencircuit/repo` 에 자리잡습니다.

> [!IMPORTANT]
> `~/.opencircuit` 은 **도구 전용** 폴더입니다.
> 작품이나 작업 파일은 이 안에 두지 마세요 — 업데이트할 때 충돌합니다.

---

## 설계 원칙

**호스트 중립.** 1순위는 Cursor지만 Claude Code·Codex에서도 같은 서버가 그대로 동작합니다.
서버 코드는 어떤 에디터가 자기를 부르는지 모릅니다.

**지식은 도구 안에.** 사용법과 주의사항을 별도 문서가 아니라 tool description과 반환값에
담습니다. 어느 에디터에서 열든 AI가 같은 안내를 읽습니다.

**실패는 사람의 말로.** 스택 트레이스 대신 무엇이 잘못됐고 다음에 무엇을 할지 한국어로 씁니다.

**기동에 네트워크가 필요 없게.** 설치할 때 한 번만 받아두고, 이후에는 오프라인에서도 뜹니다.
수업장 와이파이를 믿지 않습니다.

자세한 내용 → [docs/architecture.md](docs/architecture.md)

---

## 프로그램

| | |
|---|---|
| **기간** | 2026.08.29 — 12.19 |
| **대상** | 부산 청년 작가 10명 내외 |
| **장소** | 사상인디스테이션 외 |
| **주최** | 부산문화재단 |

교육 9회, 국내외 사례조사 2회, 크리틱과 설치를 거쳐 12월 19일 성과공유회로 마칩니다.
전체 커리큘럼 → [opencircuit.club/curriculum](https://opencircuit.club/curriculum)

---

<div align="center">
<sub>

**[opencircuit.club](https://opencircuit.club)**

</sub>
</div>
