# web 제3자 구성요소

설치 시 `web/node_modules` 에 내려받는 패키지입니다.

| 패키지 | 용도 | 라이선스 |
|---|---|---|
| react, react-dom | UI | MIT |
| react-router-dom | 페이지 이동 | MIT |
| three | 전시장 3D | MIT |
| @mediapipe/tasks-vision | 주먹 촬영 | Apache-2.0 |

장면 3D 얼굴 필터는 `public/jeeliz` 에 벤더링한 Jeeliz FaceFilter(Apache-2.0)를 씁니다.
목록은 저장소 루트 `NOTICE.md` 와 `web/public/jeeliz/NOTICE.txt` 를 보세요.
| @vitejs/plugin-react, vite, typescript | 개발·빌드 | MIT |

웹캠 문장 모델 로더는 `tools/transformersjs/baseline/lib` 의 번들을 그대로 씁니다.
그 구성요소는 `tools/transformersjs/NOTICE.md` 를 보세요.
