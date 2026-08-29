# APIFrame — 이미지·영상·음악 생성

Cursor에게 문장을 말하면 이미지나 영상, 음악을 만들어
문서 폴더의 `OpenCircuit/<작업이름>/media/` 에 저장합니다.

| OS | 작품 폴더 예 |
|---|---|
| Windows | `문서\OpenCircuit\<이름>` 또는 `Documents\OpenCircuit\<이름>` |
| macOS | `~/Documents/OpenCircuit/<이름>` |
| Linux | 문서 폴더(XDG)의 `OpenCircuit/<이름>` |

MCP 키: `opencircuit-apiframe`

## 수업에서 하는 일

1. 문장 하나 (손으로 쓰거나, 웹캠 베이스라인에서 받거나)
2. Cursor에게 「이 문장으로 이미지 만들어줘」
3. 결과가 `media/` 에 쌓이고, 같은 폴더의 전시장(`index.html`)이 벽에 겁니다

## 도구

| tool | 하는 일 |
|---|---|
| `generate_image` | 프롬프트 → 이미지. 기본 1장, 최대 4장. 최대 90초 기다림 |
| `generate_video` | 프롬프트 → 영상. 기본 5초·draft. 즉시 작업 ID |
| `generate_music` | 프롬프트 → 음악. 즉시 작업 ID |
| `check_job` | 진행 중인 작업 확인·저장 |
| `list_works` | 작업 폴더 목록 |

영상·음악은 시간이 걸립니다. 기다리는 동안 다른 것을 만들어도 됩니다.
`check_job` 으로 받으면 그때 파일이 저장됩니다.

## API 키

키는 `.env` 가 아니라 **Cursor MCP 설정**에 넣습니다.

1. https://console.apiframe.ai 에서 키를 만듭니다 (`afk_` 로 시작).
2. Cursor MCP 설정의 `opencircuit-apiframe` → `env` 에
   `"APIFRAME_KEY": "afk_..."` 를 넣습니다.
   (Windows `%USERPROFILE%\.cursor\mcp.json`, macOS·Linux `~/.cursor/mcp.json`)
3. Cursor를 완전히 종료했다가 다시 엽니다.

키를 채팅·스크린샷·단톡방에 올리지 마세요.

## 비용 (남의 돈)

수강생이 본인 카드로 결제하고 실비 정산합니다. 기본값은 싸게 잡혀 있습니다.

| 호출 | 기본 | 대략 (2026-08-28 문서) |
|---|---|---|
| 이미지 1장 (`flux-1.1-pro`) | 1장 | 5크레딧 ≈ $0.05 |
| 영상 (`flux-3` draft 5초) | draft · 5초 | 40크레딧 ≈ $0.40 |
| 음악 (`mureka`) | 1회 | 6크레딧 ≈ $0.06 |

1크레딧 = $0.01. 1080p·긴 영상·여러 장은 시키지 마세요.

현재 사이트에 **Hobby** 플랜은 없습니다. 유료는 Basic $39/월(첫 달 $19)부터입니다.
시작용 100크레딧은 전화 확인 또는 $1 뒤에 열립니다.

## 작업 폴더

- 기본: 문서 폴더의 `OpenCircuit/<작업이름>/` (위 표)
- 결과: `media/01-image.png` 처럼 순번+종류
- 목록: `media/manifest.json` (전시장이 이 파일만 읽습니다)
- `.opencircuit` 안에는 만들지 않습니다 (도구 전용)

첫 생성 때 전시장 베이스라인(`tools/threejs/baseline`)이 작업 폴더에 복사됩니다.
이미 `index.html` 이 있으면 덮어쓰지 않습니다.
