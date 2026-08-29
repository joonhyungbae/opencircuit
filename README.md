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
Set-ExecutionPolicy -Scope Process Bypass -Force
irm https://raw.githubusercontent.com/joonhyungbae/opencircuit/main/bootstrap/install.ps1 -OutFile "$env:TEMP\oc-install.ps1"
& "$env:TEMP\oc-install.ps1"
```

> 첫 줄이 필요한 이유: Windows는 기본적으로 스크립트 실행을 막아 두었습니다.
> 이 창에서만(`-Scope Process`) 일시적으로 허용하는 것이라 컴퓨터 설정은 그대로입니다.

**macOS · Linux** — 터미널에서:

```bash
curl -fsSL https://raw.githubusercontent.com/joonhyungbae/opencircuit/main/bootstrap/install.sh -o /tmp/oc-install.sh
bash /tmp/oc-install.sh
```

> Linux 도 같은 스크립트입니다. `sudo` / `apt` 로 Node 를 깔지 않고, 없으면 홈 폴더에 풉니다.
> Windows 의 Git Bash 에서는 이 파일을 쓰지 말고 위 PowerShell 안내를 따르세요.

설치가 끝나면 **Cursor를 완전히 종료했다가 다시 열고**, MCP 목록에서 `opencircuit-hello`가
초록불인지 확인하세요. 그다음 Cursor에게 이렇게 말해 보세요:

> ping 해줘

---

## 실습 웹

실습 페이지(문장 만들기 · 생성 · 전시장)는 React 라이트 테마입니다.
저장소 루트에서 아래만 실행하면 됩니다.

**Windows** — PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process Bypass -Force
.\start.ps1
```

**macOS · Linux**:

```bash
./start.sh
```

브라우저가 `http://127.0.0.1:1234` 을 엽니다. 자세한 내용 → [web/README.md](web/README.md)

---

## 명령

| 명령 | 하는 일 |
|---|---|
| `install.ps1` / `install.sh` | 도구 설치 (여러 번 실행해도 안전합니다) |
| `--doctor` | 어디가 문제인지 진단합니다. **안 될 때 가장 먼저 쓰세요** |
| `--update` | 도구를 최신 버전으로 갱신합니다 |
| `start.ps1` / `start.sh` | 실습 웹을 띄웁니다 |

---

## 담긴 도구

소프트웨어별로 서버를 둡니다. 수업 일정은 이 저장소의 축이 아닙니다.

| 서버 | 역할 |
|---|---|
| `hello` | 설치·연결 검증 |
| `apiframe` | 이미지·영상·음악 생성 |
| `github` | 레포 생성·Pages 배포 (예정) |
| `p5js` | 웹 그래픽 베이스라인 (예정) |

> 지금 쓸 수 있는 것: `hello`, `apiframe`, 전시장(`tools/threejs/baseline`), 웹캠 문장(`tools/transformersjs/baseline`).

---

## 구조

```text
opencircuit/
├── tools/              # 소프트웨어별 번들 — 하나당 폴더 하나
│   └── <소프트웨어>/
│       ├── server/     #   MCP 서버 (선택)
│       ├── baseline/   #   시작점 프로젝트 (선택)
│       └── README.md
├── core/               # 소프트웨어에 종속되지 않는 것
│   └── hello/          #   설치·연결 검증
├── web/                # 실습 웹 (React, 라이트 테마)
├── start.ps1           # 실습 웹 실행 (Windows)
├── start.sh            # 실습 웹 실행 (macOS · Linux)
├── bootstrap/          # 설치 스크립트
│   ├── install.ps1     # Windows
│   ├── install.sh      # macOS · Linux
│   └── README.md       # 수강생용 상세 안내
└── docs/
    └── architecture.md # 설계 원칙과 결정 기록
```

폴더 이름은 **소프트웨어의 통용 이름**입니다. 역할이나 수업 일정으로 부르지 않습니다.
규약은 [tools/README.md](tools/README.md)에 있습니다.

설치되면 도구는 홈 아래 `.opencircuit/repo` 에 자리잡습니다.
Windows 는 `%USERPROFILE%\.opencircuit\repo`, macOS·Linux 는 `~/.opencircuit/repo` 입니다.

> [!IMPORTANT]
> `.opencircuit` 은 **도구 전용** 폴더입니다.
> 작품이나 작업 파일은 이 안에 두지 마세요 — 업데이트할 때 충돌합니다.
> 작품은 문서 폴더의 `OpenCircuit` 아래에 둡니다 (Windows `문서` 또는 `Documents`, Linux 는 XDG 문서 폴더).

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

프로그램 소개 → [opencircuit.club](https://opencircuit.club)

---

## 라이선스와 사용 정책

수강생과 함께 만들어 가는 교육 자산이라, **무단 재강의와 상업화는 막되 개인 학습과
작품 제작은 자유롭게** 열어 두었습니다.

| | |
|---|---|
| ✅ **자유롭게** | 개인 학습·실험, 자기 작업에 활용, 인용·링크·시연 |
| ✅ **제한 없음** | 이 도구로 만든 **작품** — 전시·판매·배포에 허가가 필요 없습니다 |
| ✋ **사전 허가** | 강좌·워크숍의 교재나 커리큘럼 기반으로 사용 (유·무료 불문) |
| ✋ **사전 허가** | 판매, 유료 서비스·제품에의 편입, 그 밖의 수익 창출 |

만든 작품은 온전히 만든 사람의 것입니다. 제한은 **도구와 교재 자체**에만 걸립니다.

교재로 쓰고 싶으시면 [jh.bae@kaist.ac.kr](mailto:jh.bae@kaist.ac.kr)로 연락 주세요 —
금지라기보다 협의 사항입니다.

전문은 [LICENSE](LICENSE), 제3자 구성요소는 [NOTICE.md](NOTICE.md)를 보세요.

---

<div align="center">
<sub>

**[opencircuit.club](https://opencircuit.club)**

</sub>
</div>
