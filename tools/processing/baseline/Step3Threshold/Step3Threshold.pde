/**
 * 3단계. 문턱값을 올려 손전등만 잡히게 하기
 *
 * 2단계에서는 얼굴도 벽도 같이 잡혔습니다. 문턱값을 올리면 더 밝은 것만 남고,
 * 어느 값에서 손전등 하나만 남는지는 방마다 다릅니다. 그래서 키로 올렸다 내렸다 하며 찾습니다.
 * 휴대폰 손전등을 켜서 카메라에 비춰 보세요.
 *
 * 필요한 라이브러리: Video, BlobDetection
 *
 * 키
 *   위 · 아래   문턱값 0.02 씩
 *   [ · ]       너무 작은 덩어리를 버리는 기준
 *   B          찾는 데 쓰는 작은 흑백 그림 보기
 *   S          화면 저장
 */
import processing.video.*;
import blobDetection.*;

final int CAM_W = 640;
final int CAM_H = 480;
final int BLOB_W = 160;
final int BLOB_H = 120;

Capture video;
PImage small;
BlobDetection blobs;
PFont ui;

float threshold = 0.6;
float minSize = 0.03;      // 화면 너비의 몇 배보다 작은 덩어리는 버린다
boolean showSmall = false;

void settings() {
  size(CAM_W, CAM_H);
}

void setup() {
  frameRate(30);
  ui = createFont("SansSerif", 14, true);
  textFont(ui);

  video = new Capture(this, CAM_W, CAM_H);
  video.start();

  small = createImage(BLOB_W, BLOB_H, RGB);
  blobs = new BlobDetection(BLOB_W, BLOB_H);
  blobs.setPosDiscrimination(true);
  blobs.setThreshold(threshold);
}

void draw() {
  if (video.available()) {
    video.read();
  }
  if (video.width == 0) {
    background(18);
    fill(230);
    text("카메라 프레임 대기 중...", 20, 30);
    return;
  }

  image(video, 0, 0, width, height);

  small.copy(video, 0, 0, video.width, video.height, 0, 0, BLOB_W, BLOB_H);
  small.filter(BLUR, 1);
  small.loadPixels();
  blobs.setThreshold(threshold);
  blobs.computeBlobs(small.pixels);

  if (showSmall) {
    // 찾는 쪽이 실제로 보고 있는 그림입니다. 문턱값을 올리면 여기가 검게 비어 갑니다.
    image(small, width - BLOB_W - 12, 12, BLOB_W, BLOB_H);
  }

  int kept = drawBlobs();
  drawHud(kept);
}

/** 기준보다 큰 덩어리만 그리고, 그 수를 돌려줍니다. */
int drawBlobs() {
  int kept = 0;
  for (int i = 0; i < blobs.getBlobNb(); i++) {
    Blob b = blobs.getBlob(i);
    if (b == null || b.w < minSize) {
      continue;
    }
    kept++;

    stroke(0, 255, 140);
    strokeWeight(2);
    noFill();
    for (int m = 0; m < b.getEdgeNb(); m++) {
      EdgeVertex a = b.getEdgeVertexA(m);
      EdgeVertex c = b.getEdgeVertexB(m);
      if (a != null && c != null) {
        line(a.x * width, a.y * height, c.x * width, c.y * height);
      }
    }

    // 잡힌 자리의 좌표. 4단계에서 여기에 패턴을 그립니다.
    float cx = b.x * width;
    float cy = b.y * height;
    noStroke();
    fill(255, 200, 0);
    ellipse(cx, cy, 10, 10);
    fill(255);
    text(int(cx) + ", " + int(cy), cx + 12, cy - 8);
  }
  return kept;
}

void drawHud(int kept) {
  noStroke();
  fill(0, 155);
  rect(12, 12, 380, 74, 6);
  fill(240);
  text("3단계 · 손전등만 남기기", 24, 32);
  fill(190);
  text("문턱값 " + nf(threshold, 1, 2) + "   최소 크기 " + nf(minSize, 1, 2)
    + "   남은 덩어리 " + kept + "개", 24, 54);
  fill(150);
  text("위·아래 문턱값   [ ] 최소 크기   B 작은 그림   S 저장", 24, 76);
}

void keyPressed() {
  if (key == CODED) {
    if (keyCode == UP) {
      threshold = constrain(threshold + 0.02, 0.05, 0.98);
    }
    if (keyCode == DOWN) {
      threshold = constrain(threshold - 0.02, 0.05, 0.98);
    }
    return;
  }
  if (key == '[') {
    minSize = constrain(minSize - 0.01, 0.0, 0.5);
  } else if (key == ']') {
    minSize = constrain(minSize + 0.01, 0.0, 0.5);
  } else if (key == 'b' || key == 'B') {
    showSmall = !showSmall;
  } else if (key == 's' || key == 'S') {
    saveFrame("step3-####.png");
    println("저장했습니다: step3-####.png");
  }
}
