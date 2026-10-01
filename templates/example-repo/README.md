# <대표기술>-<의도>

**<관객이 무엇을 하면 무엇이 일어나는지 한 문장>.** <그 다음에 무엇이 이어지는지 한 문장>.
<끝나면 어떻게 되는지 한 문장>.

<필요한 장비 한 줄>로 돕니다. <핵심 기술>이 <무엇>을 맡습니다. 완성된 작품이 아니라
출발점이고, 바꿔 가며 자기 작품으로 만들라고 둔 예제입니다.

《2026 오픈서킷 부산: 아트앤테크 프랙티스》 멘토링 과정에서 만든 예제입니다. 참여 작가와
작업을 구상하다 공통으로 쓸 만한 뼈대가 나와, 참여자 누구나 쓸 수 있도록 공개합니다.

(작가 이름과 작품 구상은 본인 확인을 받은 뒤에 적습니다. 전시가 끝난 뒤라면
「이 예제는 《작품명》(작가, 연도) 작업에서 나왔습니다」로 적을 수 있습니다.)

## 1. 깔기

터미널을 엽니다. 윈도우는 시작 메뉴에서 `PowerShell`, 맥은 `터미널`입니다.

**맥 · 리눅스**

```bash
curl -fsSL https://raw.githubusercontent.com/<계정>/<저장소>/main/install.sh | bash
```

**윈도우 (PowerShell)**

```powershell
Set-ExecutionPolicy -Scope Process Bypass -Force
irm https://raw.githubusercontent.com/<계정>/<저장소>/main/install.ps1 -OutFile "$env:TEMP\install.ps1"
& "$env:TEMP\install.ps1"
```

설치가 챙기는 것: <환경>, <엔진이나 모델>, <처음 쓸 자료>.

## 2. 켜기

```bash
./start.sh          # 맥 · 리눅스
.\start.ps1         # 윈도우
```

브라우저가 저절로 열립니다. 안 열리면 `127.0.0.1:7000` 을 칩니다. 끌 때는 <kbd>Ctrl</kbd>+<kbd>C</kbd>.

이 한 줄이 <무엇과 무엇>을 알아서 챙깁니다.

## 3. 화면에서 보는 것

- **<칸 이름>**: <무엇이 보이는지 한 줄>
- **<칸 이름>**: <무엇이 보이는지 한 줄>

## 4. 바꾸는 자리

1. **대시보드 슬라이더** — <무엇이 달라지는지>
2. **`<패키지>/settings.py`** — 숫자가 전부 이 파일에 있습니다
3. **<자료 바꾸기>** — <명령 한 줄>
4. **`<핵심 파일>`의 `<핵심 함수>`** — <작품의 성격을 정하는 자리>

## 5. 안 될 때

| 이런 일이 생기면 | 이렇게 합니다 |
|---|---|
| <실제로 막히는 자리> | <무엇을 치면 되는지> |

## 6. 더 들어가기

```text
settings.py   만지는 숫자
run.py        시작하는 자리
...
```

<핵심 기술>에 대한 설명 한 문단. 왜 이런 구조인지는 [docs/notes.md](docs/notes.md).
AI 도구로 고칠 때의 규칙은 [AGENTS.md](AGENTS.md).

## 쓰는 것과 라이선스

<쓰는 라이브러리와 라이선스 한 문단>. 전체 목록은 [NOTICE.md](NOTICE.md).

코드는 [OpenCircuit License v1.0](LICENSE)을 따릅니다. 오픈소스가 아니라 소스를 공개하되
쓰임을 제한합니다.

- **됩니다**: 받아서 쓰고 고치기. 이것으로 만든 **작품**은 전시하고 팔아도 허가가 필요 없습니다.
- **문의해 주세요**: 강좌나 워크숍의 교재로 쓰는 것, 코드 자체를 파는 것. <jh.bae@kaist.ac.kr>

---

<details>
<summary>English</summary>

<Three sentences on what happens.>

```bash
curl -fsSL https://raw.githubusercontent.com/<계정>/<저장소>/main/install.sh | bash
cd <저장소> && ./start.sh
```

Source-available, not open source: personal and artistic use is free and the works you make are
entirely yours; teaching with it or selling it needs permission ([LICENSE](LICENSE)).

</details>

<sub>《2026 오픈서킷 부산: 아트앤테크 프랙티스》에서 만든 작품 베이스라인입니다. 다른 도구는
[opencircuit](https://github.com/joonhyungbae/opencircuit)에 모여 있습니다.</sub>
