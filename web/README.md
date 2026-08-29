# OpenCircuit 실습 웹

문장을 만든 뒤 이 웹에서 이미지·영상·음악을 보내고 받는 React 앱입니다.
라이트 테마입니다.

저장소 **루트**에서 띄웁니다. `web/` 안에서 `npm` 을 직접 칠 필요는 없습니다.

## 켜는 법

**Windows** — PowerShell:

```powershell
Set-ExecutionPolicy -Scope Process Bypass -Force
.\start.ps1
```

**macOS · Linux** — 터미널:

```bash
chmod +x start.sh
./start.sh
```

브라우저가 `http://127.0.0.1:1234` 을 엽니다. 그만하려면 그 창에서 Ctrl+C.
이미 그 포트를 쓰는 프로세스가 있으면 스크립트가 먼저 종료하고 다시 띄웁니다.

브라우저를 자동으로 열지 않으려면 `./start.sh --no-open` 또는 `.\start.ps1 -NoOpen`.

## 페이지

| 주소 | 하는 일 |
|---|---|
| `/` | 실습 안내 |
| `/make` | 웹캠 → 문장 → 이 웹에서 생성·수신 |
| `/gallery` | 문서 폴더 `OpenCircuit` 아래 작업을 3D 방에 검 |

전시장은 이 컴퓨터를 기준으로 문서 폴더를 찾습니다.
Windows 는 `문서` 또는 `Documents`, Linux 는 XDG 문서 폴더입니다.

## 알아둘 것

- 이 폴더는 부트스트랩(MCP 도구 설치)과 **별개**입니다. 루트 `npm run build` 에 포함하지 않습니다.
- 작품은 `.opencircuit` 이 아니라 문서 폴더의 `OpenCircuit` 에 둡니다.
