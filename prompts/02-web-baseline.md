# Cursor 프롬프트 — Phase 2: 웹 베이스라인 + 로컬 작업 루프

> 사용법: Cursor 에이전트 모드에서 `@02-web-baseline.md 진행해줘`

---

## 맥락

Phase 1(부트스트랩 + `mcp-hello`)은 끝났고 `main`에 있다.
설치·업데이트·진단이 Windows/macOS 양쪽에서 동작하며, git 없이도 tarball 로 우회한다.

이번 페이즈의 목표는 **첫 시제작을 가능하게 하는 것**이다.
주제는 프로그램 소개 · Cursor·GitHub·APIFrame 사용법 ·
Cursor 기반 MCP 오케스트레이션으로 첫 시제작 만들기.

수강생은 비개발자 작가 10명이고, 4시간 안에 **무언가를 만들어 손에 쥐어야** 한다.

### 베이스라인의 성격 (중요)

특정 강사의 수업 내용을 따라가지 않는다.
**각 프리웨어로 작품을 만들기 위한 기반**이고, 프로그램이 끝난 뒤에도 수강생이 계속 쓴다.
폴더 이름은 도구 기준이다: `tools/p5js/`
이 저장소의 축은 수업 일정이 아니라 소프트웨어 이름이다.

---

## 0단계 — 라이선스 (확인 완료, 반드시 지킬 것)

이 확인은 **이미 끝났다**. https://p5js.org/copyright/ 기준이며
결과는 [NOTICE.md](../NOTICE.md)에 기록되어 있다. 다시 조사하지 말고 아래를 따르라.

| 대상 | 라이선스 | 처리 |
|---|---|---|
| p5.js **라이브러리 본체** | LGPL-2.1 | ✅ 벤더링한다 |
| p5.js **예제 페이지 코드** | **CC BY-NC-SA 4.0** | ❌ **가져오지 않는다** |

### ⛔ 예제 코드를 복사·번안하지 마라

p5js.org/examples 의 코드는 CC BY-NC-SA 4.0 이고, ShareAlike 조항이
파생물에 동일 라이선스를 요구한다. 이 저장소의 [LICENSE](../LICENSE)와 호환되지 않아
**베이스라인 전체가 CC BY-NC-SA 로 끌려간다.**

**베이스라인은 레퍼런스의 API 설명만 참고해 직접 작성하라.**
`createCanvas()`·`ellipse()` 같은 API 호출은 사용이지 복제가 아니다.
제한되는 것은 예제 페이지의 특정 코드 텍스트를 가져오는 행위다.

### LGPL-2.1 준수 (라이브러리 벤더링)

- `p5.min.js` 를 **절대 수정하지 마라**
- `tools/p5js/baseline/lib/` 에 LGPL 원문 사본을 `license.txt` 로 함께 둔다
- 가져온 **정확한 버전과 다운로드 URL** 을 [NOTICE.md](../NOTICE.md) 표에 기록한다
- `<script src="lib/p5.min.js">` 로 평문 로드해 수강생이 교체할 수 있게 둔다
- 우리가 쓴 `sketch.js` 에는 저장소 LICENSE 가 적용된다 (LGPL 은 전이되지 않는다)

---

## 이번 작업 범위

**웹 베이스라인 1개 + `tools/p5js/server` (로컬 부분만).**
GitHub 연동과 APIFrame 은 다음 페이즈다. 미리 만들지 마라.

```text
opencircuit/
  tools/
    p5js/                    # 소프트웨어 하나 = 폴더 하나
      baseline/              #   수강생에게 복사될 원본
        index.html
        sketch.js
        style.css
        lib/                 #   벤더링한 p5.min.js + license.txt
        README.md            #   수강생용 한국어 안내
      server/                #   @opencircuit/mcp-p5js
        package.json
        src/index.ts
      README.md              #   이 도구로 무엇을 할 수 있는지
      NOTICE.md              #   p5.js LGPL-2.1 고지
```

폴더 규약은 [tools/README.md](../tools/README.md)를 따른다.
**`servers/` 는 더 이상 없다** — `core/`(공통)와 `tools/<소프트웨어>/`(도구별)로 갈렸다.

### 베이스라인 요구사항

**빌드 없음.** `index.html`을 브라우저로 열면 그냥 돈다. 번들러·npm install 불필요.

**오프라인 동작.** p5.js를 CDN에서 불러오지 말고 `lib/`에 벤더링한다
(0단계에서 허용되지 않으면 대안을 보고하라). 수업장 와이파이를 믿지 않는다.

**demo 가 아니라 baseline.** 공식 예제를 그대로 복사해두는 건 링크를 주는 것과 같다.
작가가 만질 지점이 **밖으로 드러나 있어야** 한다. `sketch.js` 상단에
수정할 파라미터를 모아두고 한국어 주석으로 무엇이 바뀌는지 적어라.

```js
// ── 여기를 바꿔보세요 ────────────────────────────
const 색 = "#ff3b30";      // 도형 색
const 개수 = 40;           // 화면에 그릴 개수
const 속도 = 0.5;          // 움직이는 빠르기
// ────────────────────────────────────────────
```

변수명을 한글로 할지는 판단에 맡긴다. 다만 **비개발자가 무엇을 바꾸면
무엇이 달라지는지 즉시 알 수 있어야 한다**는 기준은 지켜라.

**Web Audio 자리를 비워둔다.** 나중에 웹 사운드아트가 같은 구조 위에 올라갈 수 있다.
지금 소리를 구현하지는 말고, 나중에 붙일 자리를 주석으로 표시해두라.

**하나만 만든다.** 웹캠·사운드 변형은 다음 페이즈다.

### `tools/p5js/server` 의 tools

MCP 키는 `opencircuit-p5js`, 패키지명은 `@opencircuit/mcp-p5js`.

> GitHub 배포는 이 서버에 넣지 마라. 그건 `tools/github/` 의 일이고 Phase 3이다.
> 이 서버는 **p5.js 프로젝트를 만들고 미리 보는 것**까지만 한다.

| tool | 하는 일 |
|---|---|
| `create_work` | 베이스라인을 수강생 작업 폴더로 복사 |
| `preview_work` | 로컬 정적 서버를 띄우고 URL 반환 |
| `list_works` | 만든 작업 목록 |

**작업 폴더 위치**: `~/.opencircuit` 에 **절대 만들지 마라** — 도구 전용이고
업데이트 때 충돌한다. 기본값은 `~/Documents/OpenCircuit/<이름>` 으로 하고
인자로 다른 경로를 받을 수 있게 하되, `~/.opencircuit` 하위 경로는 거부하라.

**`preview_work`**: Node 내장 http 모듈만 쓴다(의존성 추가 금지).
포트가 사용 중이면 다른 포트를 찾는다. 반환값에 URL 과 종료 방법을 담아라.

### 원칙 재확인

- **호스트 중립** — 서버 코드는 Cursor/Claude/Codex 를 모른다
- **지식은 tool description 과 반환값에** — 스킬·룰 파일은 이식되지 않는다.
  `create_work` 반환에 "이제 `sketch.js`의 색을 바꿔보고 `preview_work`를 부르세요" 를 담아라
- **실패는 한국어로 원인 + 다음 행동**
- 부트스트랩이 새 서버를 `~/.cursor/mcp.json`에 등록하도록 갱신하라
  (키: `opencircuit-p5js`, `merge-mcp.mjs` 재사용)

---

## 수락 기준

- [ ] `tools/p5js/baseline/index.html` 을 브라우저로 직접 열면 **네트워크 없이** 동작한다
- [ ] `create_work` 로 만든 폴더가 `~/Documents/OpenCircuit/<이름>` 에 생기고 바로 열린다
- [ ] `~/.opencircuit` 하위를 대상으로 하면 거부하고 이유를 한국어로 설명한다
- [ ] `preview_work` 가 URL 을 반환하고 그 주소에서 스케치가 보인다
- [ ] 포트 충돌 시 다른 포트로 뜬다
- [ ] `sketch.js` 상단 파라미터를 바꾸고 새로고침하면 눈에 보이게 달라진다
- [ ] 부트스트랩 실행 후 `opencircuit-p5js` 가 mcp.json 에 등록된다
- [ ] 기존 `opencircuit-hello` 항목이 보존된다
- [ ] [NOTICE.md](../NOTICE.md) 에 p5.js 항목이 채워져 있다
- [ ] 모든 실패 메시지가 한국어이고 다음 행동을 지시한다

---

## 하지 말 것

- CDN 링크 (오프라인에서 죽는다)
- 번들러·프레임워크 (Vite, React 등)
- GitHub 연동, APIFrame — 다음 페이즈
- 웹캠·사운드 변형 — 다음 페이즈
- 라이선스 확인 없이 예제 코드 벤더링
- 수강생에게 스택 트레이스 노출

---

## 작업 순서

1. 0단계 준수사항 숙지 (조사 불필요 — 이미 끝났다)
2. `tools/p5js/baseline/` 작성, 브라우저에서 직접 검증
3. `tools/p5js/server/` 작성
4. 부트스트랩 갱신
5. 이 머신에서 전체 흐름 실검증 후 보고

---

# 다음 페이즈 (지금 하지 말 것)

**Phase 3 — GitHub 연동**
`tools/github/server` 를 새로 만들고 GitHub OAuth **Device Flow** 를 직접 구현한다
(`gh` CLI 나 Personal Access Token 을 쓰지 않는다 — 추가 설치와 토큰 복사를 피한다).
수강생은 화면에 뜬 코드를 브라우저에 입력하는 것으로 끝난다.
이후 레포 생성 · 커밋 · GitHub Pages 배포 · 라이브 URL 반환.
수강생이 브라우저에 코드를 입력하는 것으로 GitHub에 올린다.

**Phase 4 — `mcp-genmedia`**
APIFrame 연동. 생성한 이미지를 베이스라인 스케치에 넣는 흐름까지.
키는 mcp.json `env` 의 `APIFRAME_KEY`. API 스펙은 추측하지 말고 공식 문서를 확인할 것.
