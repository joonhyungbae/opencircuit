# NOTICE · tools/processing

이 폴더에 벤더링된 제3자 코드는 없습니다. 두 스케치에는 저장소 [LICENSE](../../LICENSE)가 적용됩니다.

스케치를 실행하려면 아래 라이브러리를 각자 Processing 라이브러리 매니저에서 설치해야 합니다.
저장소가 배포하지 않으므로 라이선스는 각 배포처를 따릅니다.

| 라이브러리 | 출처 | 쓰는 곳 |
|---|---|---|
| Video | Processing Foundation, https://github.com/processing/processing-video | 웹캠 프레임 받기 (`processing.video.Capture`) |
| OpenCV for Processing | Greg Borenstein, https://github.com/atduskgreg/opencv-processing | 흑백·문턱값·외곽선·얼굴·플로우 (`gab.opencv`) |
| BlobDetection | Julien 'v3ga' Gachadoat, http://www.v3ga.net/processing/BlobDetection/ | 밝은 덩어리 찾기 (`blobDetection`), 1~5단계 |

`OpticalFlow` 스케치는 OpenCV for Processing 이 함께 설치하는 OpenCV 자바 바인딩(`org.opencv`, `org.bytedeco`)을 직접 부릅니다.
라이브러리를 설치하면 같이 들어오므로 따로 받을 것은 없습니다.
