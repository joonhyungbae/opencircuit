# React — Closed Circuit 스터디 슬라이드

Closed Circuit Busan 발표를 만드는 시작점입니다.
`src/deck.json` 만 고치면 슬라이드가 바뀝니다. 코드는 건드리지 않아도 됩니다.

사이트에 올라간 1회차 예 → [opencircuit.club/study/cutting-kim](https://opencircuit.club/study/cutting-kim)

## 쓰는 법

1. 이 `baseline` 폴더를 문서 폴더의 `OpenCircuit/<작품이름>-study/` 에 복사합니다.
   (Windows `문서` 또는 `Documents`, macOS `~/Documents`, Linux 는 XDG 문서 폴더)
2. 그 폴더에서 아래를 실행합니다.

**Windows** — PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process Bypass -Force
npm install
npm run dev
```

**macOS · Linux**:

```bash
npm install
npm run dev
```

브라우저가 `http://127.0.0.1:5173` 을 엽니다. 그만할 때는 그 창에서 Ctrl+C.

## 여기를 바꾸세요

- **내용** → `src/deck.json`
- **그림** → `public/` 에 두고, 주소는 `/파일이름.jpg` 처럼 적습니다. 원본을 줄이지 마세요.
- **유튜브** → `{ "kind": "youtube", "src": "https://youtu.be/…" }`

칸은 열한 가지입니다. 페이퍼에 없는 칸은 비워 두고, 다음에 알아볼 과제로 남깁니다.

| # | 칸 | 무엇을 적나 |
|---|---|---|
| 1 | 관객은 무엇을 하나 | 몸, 소리, 시간, 또는 아무것도 하지 않는지 |
| 2 | 어떤 신호를 받나 | 카메라, 센서, 마이크. 기종까지 |
| 3 | 계산은 어디에서 이루어지나 | 노트북인지, 서버인지, 마이크로컨트롤러인지 |
| 4 | 무엇이 실시간이고 무엇이 미리 만든 것인가 | 지금 바뀌는 것과 미리 만들어 둔 것 |
| 5 | 어떤 소프트웨어로 만들었나 | 게임엔진, TouchDesigner, 직접 짠 코드 |
| 6 | 무엇이 출력되나 | 화면, 프로젝션, 스피커. 개수와 크기 |
| 7 | 전시장에서는 무엇이 필요했나 | 전력, 암전, 천장고, 지킴이 |
| 8 | 공개했나 | 코드·도면·데이터셋 URL. 흉내가 아닙니다 |
| 9 | 작품이 던지는 질문은 무엇인가 | 한 문장. 논문이 자기 계보로 든 이름만 |
| 10 | 버린 시도·실패·반복은 무엇인가 | 버전, 실패한 시도, 전시를 돌며 바뀐 것 |
| 11 | 누가 무엇을 했나 | 역할. 저자 목록만으로는 부족합니다 |

## 조작

| 키 | 하는 일 |
|---|---|
| ← → · 스페이스 · PageUp/Down | 장 넘기기 |
| 아래 막대의 버튼 | 같은 일 |
| F | 전체 화면 |
| 주소 `#7` | 7번째 장으로 바로 열기 |

화면을 클릭해서는 넘어가지 않습니다. 키보드나 클리커를 씁니다.

## 블록

`deck.json` 의 `blocks` 에 넣는 종류입니다. 예는 템플릿 덱에 있습니다.

`lead` · `big` · `bullets` · `cards` · `steps` · `table` · `qa` · `note` · `figure` · `youtube` · `row`

표지는 `cover` 입니다. 섹션 색은 `"212 80% 45%"` 처럼 HSL 세 숫자만 적습니다.

## 안 될 때

- **포트가 이미 쓰인다.** `npm run dev -- --port 5174` 로 다른 문을 엽니다.
- **그림이 안 보인다.** 파일이 `public/` 안에 있는지, 주소가 `/` 로 시작하는지 봅니다.
- **JSON 오류.** 쉼표가 빠졌거나 따옴표가 짝이 안 맞습니다. Cursor 에 `deck.json` 을 열고 물어보세요.
