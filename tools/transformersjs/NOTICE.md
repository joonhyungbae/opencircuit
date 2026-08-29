# NOTICE — tools/transformersjs

이 폴더에 벤더링된 transformers.js 에는 **Apache-2.0** 이 그대로 적용됩니다.
우리가 작성한 `baseline/index.html` 에는 저장소 [LICENSE](../../LICENSE)가 적용됩니다.

## 벤더링

| 경로 | 출처 | 원저작자 | 라이선스 | 수정 |
|---|---|---|---|---|
| `baseline/lib/transformers.min.js` | https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0/dist/transformers.web.js | Hugging Face | Apache-2.0 | 없음 (브라우저 ESM 엔트리를 이 이름으로 둠) |
| `baseline/lib/ort.webgpu.bundle.min.mjs` | https://cdn.jsdelivr.net/npm/onnxruntime-web@1.26.0-dev.20260416-b7804b056c/dist/ort.webgpu.bundle.min.mjs | Microsoft | MIT | 없음 |
| `baseline/lib/onnxruntime-common.js` | (재export) `ort.webgpu.bundle.min.mjs` 의 Tensor | — | MIT 원본을 따름 | 한 줄 재export |

라이선스 원문: `baseline/lib/license.txt`

버전 **4.2.0** (2026-08-28 고정).

공식 예제 페이지의 코드를 복사하지 않았습니다. 라이브러리 API 설명만 참고해 직접 작성했습니다.

## 벤더링하지 않는 것

| 대상 | 출처 | 라이선스 | 이유 |
|---|---|---|---|
| SmolVLM-256M-Instruct 가중치 | https://huggingface.co/HuggingFaceTB/SmolVLM-256M-Instruct | Apache-2.0 | 실행 시 브라우저가 내려받음. 약 500MB, 오리진마다 다시 받음 |
