# three.js — 전시장 베이스라인

`media/manifest.json` 에 적힌 이미지·영상·음악을 방 안 벽에 거는 시작점입니다.
빌드 없이 `index.html` 을 열면 됩니다.

## 쓰는 법

1. 이 `baseline` 폴더를 문서 폴더의 `OpenCircuit/<작업이름>/` 에 복사하거나
   (Windows `문서` 또는 `Documents`, macOS `~/Documents`, Linux 는 XDG 문서 폴더),
   Cursor에게 `generate_image` 를 시키면 작업 폴더에 전시장이 자동으로 복사됩니다.
2. 같은 작업 이름으로 이미지·영상·음악을 만듭니다. 파일이 `media/` 에 쌓입니다.
3. `index.html` 을 엽니다.

`file://` 로 파일을 직접 열면 브라우저가 `manifest.json` 을 막습니다.
그때는 화면에 나온 안내를 따르거나, 이 폴더에서 아래를 실행하세요.

```bash
npx --yes serve .
```

나온 주소를 브라우저로 엽니다. Cursor 의 미리보기(Preview)를 써도 됩니다.

## 여기를 바꿔보세요

`index.html` 맨 위 상수입니다. 저장한 뒤 새로고침하면 방이 달라집니다.

- 벽 색, 바닥 색, 바닥을 켤지
- 조명 밝기
- 작품 사이 간격

## 매니페스트

전시장은 `media/manifest.json` 만 읽습니다. 형식을 바꾸지 마세요.
파일이 없거나 `items` 가 비어 있으면 빈 방과 한국어 안내가 뜹니다.
