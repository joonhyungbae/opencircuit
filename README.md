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

### 다음에 다시 열 때

새로 설치하지 않습니다. 이 폴더를 찾아서 여는 것뿐입니다.

1. Cursor를 열고 **File → Open Recent**(파일 → 최근 항목 열기)에서 `opencircuit` 이 들어간 폴더를 고릅니다.
2. <kbd>Ctrl/⌘</kbd>+<kbd>`</kbd> 로 터미널을 열고 위의 `start` 명령을 다시 실행합니다.

그만할 때는 그 터미널에서 <kbd>Ctrl</kbd>+<kbd>C</kbd> 입니다.
폴더가 어디 있는지 모르겠거나 잘 안 되면 → [다시 열기](https://opencircuit.club/wiki/start/reopen)

---

## 스터디 슬라이드

Closed Circuit Busan 스터디에서 **아트 페이퍼 한 편을 읽고 발표 자료를 만드는** 자리입니다.
PPT 파일이 아니라 브라우저로 발표합니다. 저장소 루트에서:

**Windows** — PowerShell:

```powershell
.\web.ps1
```

**macOS · Linux**:

```bash
./web.sh
```

`http://127.0.0.1:5173` 이 열립니다. 내 발표 폴더를 띄우려면 뒤에 폴더를 적습니다.
자세한 내용 → [tools/react/README.md](tools/react/README.md)

### 열한 칸

발표는 논문에 **무엇이 적혀 있는지**를 열한 칸으로 묻습니다.

```
① 관객은 무엇을 하나 → ② 어떤 신호를 받나 → ③ 계산은 어디에서
→ ④ 실시간/미리 만든 것 → ⑤ 소프트웨어 → ⑥ 무엇이 출력되나
→ ⑦ 전시장 요건 → ⑧ 공개했나 → ⑨ 작품이 던지는 질문
⑩ 버린 시도 · ⑪ 누가 무엇을 했나  ← 만든 과정 쪽에 둡니다
```

**비어 있는 칸이 채워진 칸만큼 중요합니다.** 논문이 안 적었으면 추측으로 메우지 않고
「논문에 적히지 않은 것」 한 장에 모아 다음에 알아볼 과제로 남깁니다.
「없었다」가 아니라 **「논문에 적히지 않음(있었는지 없었는지는 알 수 없음)」**입니다.

각 장에 `source` 를 달면 제목 옆에 배지가 뜹니다 — 논문이 적은 것과 발표자가 채운 것을
화면에서 구분하기 위해서입니다.

### 발표 준비 — 안내서 하나로

발표 준비 여덟 단계는 [`prompts/05-study-guide.md`](prompts/05-study-guide.md) 에 들어 있습니다.
Cursor 가 이 파일을 읽고 한 단계씩 안내하므로 명령어를 외울 필요가 없습니다. 코딩은 하지 않습니다.
사람이 읽는 판 → [opencircuit.club/study/guideline](https://opencircuit.club/study/guideline)

**시작 전에 할 일 둘**

1. [tekneh.com](https://tekneh.com) 에서 논문을 고르고, 스터디 공유 드라이브에서 PDF 를 내려받습니다.
2. Cursor 에서 **File → Open Folder** 로 문서 폴더의 `OpenCircuit` 폴더를 엽니다. 없으면 새로 만듭니다.

**채팅(에이전트 모드)에 이렇게 씁니다.** `cutting-kim` 자리에 내 발표 작품의 이름을 영문으로 적습니다.
도구를 설치한 적이 없어도 됩니다. 에이전트가 이 저장소를 설치하는 것부터 합니다.

```
https://raw.githubusercontent.com/joonhyungbae/opencircuit/main/prompts/05-study-guide.md 를 읽고 그 순서대로 발표 준비를 안내해 주세요.
작품 이름은 cutting-kim 입니다.
```

| # | 단계 | 누가 |
|---|---|---|
| 1 | 논문을 고르고 PDF 를 내려받는다 | 발표자 |
| 2 | 작업 창을 확인한다 | 에이전트 |
| 3 | 발표 폴더를 만들고 PDF 를 옮긴다 (`web.sh --new`) | 에이전트 |
| 4 | 초안을 만든다 ([절차서](prompts/04-study-slides.md)) | 에이전트 |
| 5 | 슬라이드를 띄운다 | 에이전트 |
| 6 | 「논문에 적히지 않은 것」 장을 함께 본다 | 함께 |
| 7 | 그림을 넣는다 | 캡처는 발표자 |
| 8 | 고른 이유 · ⑨ 한 문장 · 토의 3번을 넣는다 | 문장은 발표자 |

> [!TIP]
> Cursor 의 기본 모델은 코드 작성에 맞춰져 있습니다. 논문을 읽는 4단계에서는 채팅창에 `/model` 을
> 입력해 Claude 로 바꾸기를 권합니다. Claude 는 토큰을 많이 써서 사용 한도가 빨리 줄어드니,
> 꼭 필요한 단계에서만 쓰고 끝나면 기본 모델로 돌아옵니다.

발표가 끝나면 발표 폴더를 통째로 압축해 기획자(배준형)에게 보냅니다.
[opencircuit.club/study](https://opencircuit.club/study) 에 회차 순으로 올라갑니다.

`web.sh --new` 는 발표 폴더에 안내서와 절차서를 함께 복사합니다. 중간에 멈췄다면 발표 폴더의
`05-study-guide.md` 를 부르고 몇 단계부터인지 말하면 이어집니다.

### 제작 계획서 — 안내서 하나로

12월 전시 작품의 제작 계획서는 [`prompts/06-plan-guide.md`](prompts/06-plan-guide.md) 가 안내합니다.
Cursor 와 대화하며 `plan.md` 를 한 칸씩 채우고, 칸을 마칠 때마다 내 구글 문서로 올립니다.
구글 문서에는 기획자가 댓글을 답니다. 전용 주소는 각자의 튜터링 페이지에 있습니다.
사람이 읽는 판 → [opencircuit.club/wiki/plan](https://opencircuit.club/wiki/plan)

```
https://raw.githubusercontent.com/joonhyungbae/opencircuit/main/prompts/06-plan-guide.md 를 읽고 그 순서대로 제작 계획서를 안내해 주세요.
내 전용 주소는 (튜터링 페이지에서 복사한 주소) 입니다.
```

계획서는 문서 폴더의 `OpenCircuit/plan/plan.md` 에 생깁니다. 템플릿은 [`templates/plan/plan.md`](templates/plan/plan.md).

### SSH 로 붙어 있을 때

서버에 SSH 로 접속한 상태면 그 안에 화면이 없어 브라우저가 뜨지 않습니다.
**Tailscale 이 떠 있으면 `web.sh` 가 알아서 tailnet 주소로 엽니다.** 옵션이 필요 없습니다.
없으면 그 사실을 알리고 `127.0.0.1` 로 열면서 SSH 포트 포워딩 명령을 찍어 줍니다.

| 옵션 | 하는 일 |
|---|---|
| `--tailscale` | 화면이 있어도 tailnet 주소로 엽니다 |
| `--local` | 자동 전환을 끄고 `127.0.0.1` 에만 엽니다 |
| `--doctor` | 브라우저가 왜 안 열리는지 진단합니다 |

tailnet 주소에만 묶으므로 같은 공유기의 다른 사람에게는 보이지 않습니다.

---

## 명령

| 명령 | 하는 일 |
|---|---|
| `install.ps1` / `install.sh` | 도구 설치 (여러 번 실행해도 안전합니다) |
| `--doctor` | 어디가 문제인지 진단합니다. **안 될 때 가장 먼저 쓰세요** |
| `--update` | 도구를 최신 버전으로 갱신합니다 |
| `start.ps1` / `start.sh` | 실습 웹을 띄웁니다 |
| `web.ps1` / `web.sh` | 스터디 발표 슬라이드를 띄웁니다 |
| `--new <작품이름>` | 내 발표 폴더를 만듭니다 (문서 폴더에) |

이 저장소를 **포크해서 고쳐 쓰거나 PR 을 보내려면** → [포크한 저장소를 원본과 맞추기](docs/fork-and-sync.md).
발표 자료를 만드는 것뿐이라면 포크는 필요 없습니다. `baseline` 을 복사하세요.

부트스트랩은 아트페이퍼 코퍼스 MCP(`tekneh`)도 함께 등록합니다.
파이썬 패키지라 `uv` 가 필요한데 부트스트랩이 알아서 깝니다. **선택 사항이라
설치에 실패해도 중단하지 않고**, tekneh 없이도 슬라이드는 만들 수 있습니다.
`--doctor` 에 `tekneh` 줄이 나옵니다.

---

## 담긴 도구

소프트웨어별로 서버를 둡니다. 수업 일정은 이 저장소의 축이 아닙니다.

| 서버 | 역할 |
|---|---|
| `hello` | 설치·연결 검증 |
| `apiframe` | 이미지·영상·음악 생성 |
| `github` | 레포 생성·Pages 배포 (예정) |
| `react` | Closed Circuit 스터디 슬라이드 |
| `p5js` | 웹 그래픽 베이스라인 (예정) |

> 지금 쓸 수 있는 것: `hello`, `apiframe`, 전시장(`tools/threejs/baseline`), 웹캠 문장(`tools/transformersjs/baseline`),
> Processing 스케치(`tools/processing/baseline`), 스터디 슬라이드(`tools/react/baseline`).

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
├── web.ps1             # 스터디 슬라이드 실행 (Windows)
├── web.sh              # 스터디 슬라이드 실행 (macOS · Linux)
├── prompts/            # 에이전트에게 붙여넣는 절차서
│   ├── 04-study-slides.md  # 아트 페이퍼 → 발표 슬라이드 (절차서)
│   ├── 05-study-guide.md   # 스터디 발표 준비 여덟 단계 (안내서)
│   └── 06-plan-guide.md    # 제작 계획서 쓰기 (안내서)
├── templates/plan/     # 제작 계획서 템플릿 plan.md
├── bootstrap/          # 설치 스크립트
│   ├── install.ps1     # Windows
│   ├── install.sh      # macOS · Linux
│   └── README.md       # 수강생용 상세 안내
└── docs/
    ├── architecture.md    # 설계 원칙과 결정 기록
    └── fork-and-sync.md   # 포크를 원본과 맞추는 법
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
