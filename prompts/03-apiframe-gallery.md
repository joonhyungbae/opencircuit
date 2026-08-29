# Cursor 프롬프트 — Phase 3: APIFrame 생성 + 전시장 베이스라인

> 사용법: Cursor 에이전트 모드에서 `@03-apiframe-gallery.md 진행해줘`

---

## 0. 먼저 알아야 할 것 — 시간이 없다

**수업은 2026-08-29(토) 14:00이다.** 이 문서를 받는 시점이 그 전날이라면,
아래 **P0만 끝내고 보고하라.** P1·P2는 되면 좋고 안 되면 수업이 그대로 성립한다.

| | 범위 | 없으면 |
|---|---|---|
| **P0** | `tools/apiframe/server` + 부트스트랩 다중 서버 등록 | **수업이 안 된다** |
| **P1** | `tools/threejs/baseline` (전시장) | 결과를 폴더로만 본다 |
| **P2** | `tools/transformersjs/baseline` (웹캠 → 문장) | 수강생이 문장을 직접 쓴다 |

P0가 위태로우면 P1·P2를 **먼저 버려라.** 셋을 반쯤 만든 것보다 하나가 확실히 도는 게 낫다.

---

## 1. 맥락

Phase 1(부트스트랩 + `core/hello`)은 끝났고 `main`에 있다.
**Phase 2(`tools/p5js`)는 아직 실행되지 않았다 — 지금 하지 마라.**
p5.js는 지금 범위가 아니다. 모션캡처 수업용이며 이번에 필요 없다.

원래 계획의 순서(Phase 3 GitHub → Phase 4 genmedia)를 **바꾼다.**
이번 주제가 Cursor·GitHub·APIFrame이고, 그중 코드로 만들어야 하는 것은 APIFrame이다.
GitHub Device Flow 연동은 하룻밤에 안전하게 만들 수 없으므로 **뒤로 민다** —
수강생은 이번엔 위키의 수동 절차로 GitHub에 올린다.

### 이 도구로 할 실습

```
자기 재료를 웹캠 앞에 둔다
   ↓  (P2) 브라우저 안의 작은 모델이 문장 하나를 뱉는다 — 서버로 안 간다
문장
   ↓  Cursor에게 말해서 APIFrame 호출          ← P0. 이 도구가 하는 일
이미지 4장 / 영상 1개 / 음악 1곡
   ↓  (P1) 전시장 페이지가 그것들을 벽에 건다
GitHub Pages URL
```

수강생 열 명은 비개발자 작가다. 여섯은 코드를 써 본 적이 없다.
**"npm install 하세요"는 지시가 아니라 장벽이다.**

매체는 사람마다 다르다 — 국악 작곡가에게는 음악, 영상감독에게는 영상,
회화 작가에게는 이미지다. 그래서 세 매체를 모두 지원해야 한다.

---

## 2. 확인된 사실 (다시 조사하지 마라)

2026-08-28 확인. 아래는 사실이므로 그대로 쓰되, **요청/응답 스키마는 추측하지 말고
공식 문서에서 확인하라.**

| 항목 | 값 |
|---|---|
| 베이스 URL | `https://api.apiframe.ai/v2` |
| 이미지 | `POST /v2/images/generate` — Midjourney·Flux·Ideogram·Imagen 등 50+ |
| 영상 | `POST /v2/videos/generate` — Kling·Sora 2·Runway·Veo·Luma 등 30+ |
| 음악 | `POST /v2/music/generate` — Suno·Udio·Mureka·ElevenLabs Music·Lyria |
| 방식 | **비동기 작업** — 제출 후 상태 폴링 또는 웹훅 |
| 레이트 리밋 | 일반 요청 500/분 |
| 문서 | `docs.apiframe.ai` 는 **301 → `https://apiframe.ai/docs/`** |

**문서에서 반드시 확인할 것** (추측 금지):
인증 헤더 이름과 형식 · 작업 상태 폴링 엔드포인트 경로 · 완료 응답의 결과 URL 필드명 ·
모델 지정 파라미터 이름 · 실패 응답 형태.

### 비용 — 이건 남의 돈이다

수강생은 **본인 명의 카드로 결제하고 부산문화재단에서 실비 정산**받는다.
크레딧을 태우면 그날 수업이 멈추고, 정산 범위를 넘으면 개인 부담이 된다.

확인된 예: Flux 3 영상은 **720p 초당 29크레딧($0.29)**, 1080p 초당 49크레딧($0.49),
draft 미리보기 초당 10크레딧($0.10). **5초짜리 하나가 $1.45다.**

그래서 이 서버는 다음을 지켜야 한다.

- `generate_video`·`generate_music` 은 **기본값이 가장 싼 설정**이다 (영상: 5초, draft)
- 모든 생성 tool 의 **반환값에 예상 비용을 한국어로 적는다**
- 한 번 호출에 이미지 **4장을 넘지 않는다** (기본 1장, 최대 4장)
- 비싼 호출(영상·음악)은 반환값 첫 줄에 비용을 먼저 쓴다

---

## 3. 이번 작업 범위

```text
opencircuit/
  tools/
    apiframe/                  # P0
      server/                  #   @opencircuit/mcp-apiframe
        package.json
        src/index.ts
      README.md
      NOTICE.md
    threejs/                   # P1
      baseline/
        index.html
        lib/                   #   벤더링한 three.module.js + OrbitControls + license
        README.md
      README.md
      NOTICE.md
    transformersjs/            # P2
      baseline/
        index.html
        README.md
      README.md
      NOTICE.md
  bootstrap/
    install.sh / install.ps1   # 다중 서버 등록으로 일반화 (P0)
```

폴더 규약은 [tools/README.md](../tools/README.md), 설계 원칙은
[docs/architecture.md](../docs/architecture.md)를 따른다.

---

## 4. P0 — `tools/apiframe/server`

MCP 키 `opencircuit-apiframe`, 패키지명 `@opencircuit/mcp-apiframe`.

### tools

| tool | 하는 일 |
|---|---|
| `generate_image` | 프롬프트 → 이미지. 기본 1장, 최대 4장 |
| `generate_video` | 프롬프트 → 영상. 기본 5초·draft |
| `generate_music` | 프롬프트 → 음악. 기본 1곡 |
| `check_job` | 진행 중인 작업의 상태·결과 |
| `list_works` | 작업 폴더 목록 |

### 동기/비동기 경계 (MCP 타임아웃 때문에 중요하다)

- **이미지**: 최대 90초까지 기다렸다가 파일 경로를 반환한다.
  90초를 넘으면 작업 ID와 함께 "아직 만드는 중입니다. `check_job` 으로 확인하세요"를 반환
- **영상·음악**: 기다리지 않는다. **즉시 작업 ID를 반환**하고 `check_job` 을 안내한다
- `check_job` 이 완료를 확인하면 그때 내려받아 작업 폴더에 저장한다

수강생이 "기다리는 동안 다른 걸 만든다"를 손으로 겪게 되는 지점이다.
반환 문구에 그 점을 한 줄 적어라.

### 작업 폴더와 저장 규약

- 기본 위치 `~/Documents/OpenCircuit/<작업이름>/`
- **`~/.opencircuit` 하위는 거부한다** (도구 전용 폴더. 업데이트 때 충돌한다)
- 결과물은 `<작업폴더>/media/` 에 저장한다
- 파일명은 `01-image.png`, `02-video.mp4`, `03-music.mp3` 처럼 **순번 + 종류**

### `media/manifest.json` — P1과의 계약

전시장 베이스라인이 이 파일 하나만 읽는다. **형식을 바꾸지 마라.**

```json
{
  "work": "작업이름",
  "items": [
    {
      "file": "01-image.png",
      "type": "image",
      "prompt": "쓴 프롬프트 그대로",
      "model": "midjourney",
      "createdAt": "2026-08-29T15:22:10+09:00"
    }
  ]
}
```

- `type` 은 `image` · `video` · `music` 셋 중 하나
- 생성할 때마다 **append** 한다. 기존 항목을 덮어쓰지 않는다
- 파일이 없어도 매니페스트만 있으면 전시장은 떠야 한다 (빈 방)

### API 키

[docs/architecture.md](../docs/architecture.md) 결정대로 **mcp.json 의 `env` 블록**에서
읽는다. `.env` 파일을 쓰지 마라. 키 이름은 `APIFRAME_KEY`.

키가 없을 때의 메시지는 architecture.md 3절의 예시를 그대로 따른다 —
스택 트레이스가 아니라 **원인 + 다음 행동**을 한국어로.

**키를 로그·반환값·에러 메시지에 절대 출력하지 마라.** 수강생이 화면을 캡처해
단톡방에 올린다.

---

## 5. P0 — 부트스트랩 다중 서버 등록

지금 `install.sh` 는 `SERVER_KEY="opencircuit-hello"` 하나를,
`install.ps1` 은 `$ServerKey = "opencircuit-hello"` 하나를 하드코딩하고 있다.
**서버가 둘 이상이 되므로 목록으로 일반화하라.**

- 두 스크립트에 **(키, 진입경로) 목록**을 두고 순회하며 `merge-mcp.mjs` 를 호출한다
- `merge-mcp.mjs` 는 그대로 쓴다 (이미 키 단위로 병합하고 기존 `env` 를 보존한다)
- `--doctor` 는 **등록된 모든 서버**의 상태를 표로 출력한다
- handshake 검증도 서버마다 돈다
- 기존 `opencircuit-hello` 항목과, 수강생이 직접 넣은 다른 서버 항목이 **보존**되어야 한다
- `LEGACY_KEYS` 정리 로직을 깨뜨리지 마라

---

## 6. P1 — `tools/threejs/baseline` (전시장)

**빌드 없음.** `index.html` 을 브라우저로 열면 그냥 돈다.

- `media/manifest.json` 을 읽어 벽에 건다 — 이미지는 판으로, 영상은 비디오 텍스처로,
  음악은 그 방의 사운드로
- three.js 는 **CDN이 아니라 `lib/` 에 벤더링**한다 (three.js는 MIT).
  로컬 파일을 가리키는 `<script type="importmap">` 으로 불러온다.
  OrbitControls 도 같이 벤더링한다 — 이게 초보가 CDN에서 가장 많이 막히는 지점이다
- 매니페스트가 없거나 비었으면 **빈 방과 함께 한국어 안내**를 띄운다.
  "아직 만든 것이 없습니다. Cursor에게 `generate_image` 를 시켜 보세요."
- `file://` 로 열면 `fetch` 가 막힐 수 있다. 그때 무엇을 해야 하는지 화면에 한국어로 안내하라

**demo 가 아니라 baseline 이다.** 작가가 만질 지점이 밖으로 드러나야 한다.
`index.html` 상단에 벽 색·조명·간격·바닥 유무 같은 파라미터를 모아 두고
한국어 주석으로 무엇이 바뀌는지 적어라. Phase 2 프롬프트의 「여기를 바꿔보세요」 관용구를 따른다.

---

## 7. P2 — `tools/transformersjs/baseline` (웹캠 → 문장)

브라우저 안에서 도는 작은 비전-언어 모델이 카메라에 보이는 것을 **문장 하나**로 말한다.
그 문장이 APIFrame 프롬프트가 된다.

- `transformers.js` + **SmolVLM-256M-Instruct** (WebGPU, 없으면 WASM 폴백)
- 화면에 **"모델을 받는 중입니다 — 처음 한 번만, 약 500MB"** 상태를 반드시 보여 준다
- **WebGPU가 없으면 "느린 모드로 돕니다"를 한국어로 알린다.** 조용히 멈추면 안 된다 —
  수강생 중 최소 두 명은 구형·내장그래픽 노트북이다
- **문장을 직접 입력하는 칸을 항상 함께 둔다.** 모델이 못 뜨거나 결과가 마음에 안 들면
  손으로 쓴다. 이 페이지는 어떤 경우에도 수업을 막지 않아야 한다
- 결과 문장 옆에 **복사 버튼**

### 오프라인 원칙의 의도된 예외

architecture.md 는 "기동에 네트워크가 필요 없게"를 원칙으로 둔다.
이 베이스라인은 **모델 가중치를 실행 시점에 내려받으므로 그 원칙의 예외**다.
`tools/transformersjs/README.md` 에 예외임을 명시하고, 수업 운영상
**수업 시작 직후 미리 열어 캐시해 둔다**는 전제를 적어라.

캐시는 **오리진 단위**다. 운영자 페이지에서 받아 둬도 수강생이 자기 GitHub Pages 주소를
열면 다시 받는다. 이 사실도 README에 적어라.

---

## 8. 라이선스 (벤더링 전에 반드시)

[NOTICE.md](../NOTICE.md)의 기록 규칙을 따른다. **표를 먼저 채우고 나서 가져와라.**

| 대상 | 예상 | 해야 할 일 |
|---|---|---|
| three.js | MIT | 버전·출처 URL 고정, 라이선스 원문 `lib/license.txt`, NOTICE 표에 기록 |
| transformers.js | Apache-2.0 | 위와 같음 |
| SmolVLM 가중치 | 확인 필요 | **벤더링하지 않는다** (실행 시 다운로드). 출처와 라이선스만 NOTICE에 기록 |

**공식 예제 코드를 복사하지 마라.** p5.js에서 겪은 것과 같은 문제다 —
예제 페이지가 ShareAlike 계열이면 베이스라인 전체가 끌려간다.
**API 설명만 참고해 직접 작성하라.** API 호출은 사용이지 복제가 아니다.

`tools/<소프트웨어>/` 마다 README와 NOTICE를 **따로** 둔다 (떼어내도 말이 되게).

---

## 9. 원칙 재확인

- **호스트 중립** — 서버 코드에 Cursor/Claude/Codex 분기를 넣지 마라
- **지식은 tool description 과 반환값에.** 룰 파일·스킬은 이식되지 않는다.
  `generate_image` 반환에 "다음: `check_job` 으로 확인하거나, 전시장 `index.html` 을 여세요"를 담아라
- **실패는 한국어로 원인 + 다음 행동.** 스택 트레이스를 수강생에게 보이지 마라
- **`~/.opencircuit` 은 도구 전용.** 작업물을 그 안에 만들지 마라

---

## 10. 수락 기준

- [ ] `APIFRAME_KEY` 없이 `generate_image` 를 부르면 한국어로 원인과 다음 행동을 말한다
- [ ] 키가 있으면 이미지가 `~/Documents/OpenCircuit/<이름>/media/` 에 저장된다
- [ ] `media/manifest.json` 이 위 형식대로 생기고, 두 번째 호출에서 **append** 된다
- [ ] `generate_video` 가 즉시 작업 ID를 반환하고 `check_job` 안내를 담는다
- [ ] `generate_video`·`generate_music` 반환값 첫 줄에 **예상 비용**이 한국어로 있다
- [ ] `generate_image` 는 한 번에 4장을 넘지 않는다
- [ ] 대상 경로가 `~/.opencircuit` 하위면 거부하고 이유를 한국어로 설명한다
- [ ] API 키가 로그·반환값·에러 어디에도 나오지 않는다
- [ ] 부트스트랩 실행 후 `opencircuit-hello` 와 `opencircuit-apiframe` 이 **둘 다** 등록된다
- [ ] 수강생이 직접 넣은 다른 MCP 서버 항목이 보존된다
- [ ] `--doctor` 가 서버 **둘 다**의 상태를 표로 출력한다
- [ ] (P1) `tools/threejs/baseline/index.html` 을 열면 **네트워크 없이** 방이 뜬다
- [ ] (P1) 매니페스트가 비어도 빈 방과 한국어 안내가 뜬다
- [ ] (P2) WebGPU가 없어도 동작하고, 느린 모드임을 한국어로 알린다
- [ ] (P2) 모델이 못 떠도 문장을 직접 입력해 다음 단계로 갈 수 있다
- [ ] [NOTICE.md](../NOTICE.md) 에 새로 벤더링한 것이 모두 기록돼 있다
- [ ] 모든 실패 메시지가 한국어이고 다음 행동을 지시한다

---

## 11. 하지 말 것

- **Phase 2(`tools/p5js`) 착수** — 이번 범위 밖이다
- **GitHub 연동·Device Flow** — 이번 범위 밖. 수강생은 위키의 수동 절차로 올린다
- CDN 링크 (three.js·transformers.js 라이브러리 본체는 벤더링한다)
- 번들러·프레임워크 (Vite, React 등)
- `.env` 파일로 키 읽기 (mcp.json `env` 를 쓴다)
- APIFrame 요청/응답 스키마 **추측** — 공식 문서를 열어 확인하라
- 라이선스 표를 채우기 전에 제3자 코드 벤더링
- 수강생에게 스택 트레이스 노출
- 비싼 기본값 (1080p·긴 영상·여러 곡)

---

## 12. 작업 순서

1. `https://apiframe.ai/docs/` 에서 인증·폴링·응답 스키마 확인
2. `tools/apiframe/server` 작성 → **본인 키로 이미지 1장 실제 생성해 검증**
3. 부트스트랩 다중 서버 등록으로 일반화 → 이 머신에서 재실행해 둘 다 초록불 확인
4. (P1) `tools/threejs/baseline` 작성 → 2번이 만든 실제 `media/` 로 검증
5. (P2) `tools/transformersjs/baseline` 작성
6. NOTICE·README 채우기
7. 보고: **실제로 돌려 본 것과 못 돌려 본 것을 구분해서** 쓸 것

---

## 13. 이 저장소 밖의 후속 (여기서 하지 마라, 보고만)

- **레포 public 전환** — architecture.md 가 8/29 전 필요 항목으로 걸어 둔 것. 아직 미해결이면 보고하라
- **APIFrame 플랜 이름 확인** — 수업 진행안에 "APIFrame Hobby"로 적혀 있는데
  현재 사이트에는 그 이름이 없고 유료 플랜이 $39/월(첫 달 $19)부터로 나온다.
  플랜명이 틀리면 수강생이 잘못 결제해 **실비 정산을 못 받는다.** 결제 화면에서 확인해 보고하라
- **실측 비용** — 이미지 1장·영상 5초·음악 1곡의 실제 크레딧 소모를 재서 보고하라.
  그 숫자가 수업 당일 상한의 근거가 된다

---

## 14. 다음 페이즈 (지금 하지 말 것)

| Phase | 내용 |
|---|---|
| 4 | `tools/github/server` — Device Flow 로그인, 레포 생성·커밋·Pages 배포·URL 반환 |
| 5 | `tools/p5js` — 웹 베이스라인 (Phase 2 프롬프트 그대로) |
| 6+ | `tools/osc` → `tools/unity` → `tools/arduino` → `tools/webaudio` |
