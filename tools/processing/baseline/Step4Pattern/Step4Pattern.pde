/**
 * 4단계. 잡힌 자리에 패턴 그리기
 *
 * 3단계에서 손전등 하나만 남겼다면, 그 자리의 좌표가 b.x 와 b.y 입니다(0~1 이라 화면 크기를 곱합니다).
 * 그 좌표를 drawPattern() 에 넘기는 것이 전부입니다.
 * 패턴을 바꾸고 싶으면 아래 drawPattern() 안만 고치면 됩니다. 나머지는 건드리지 않아도 됩니다.
 *
 * 필요한 라이브러리: Video, BlobDetection
 *
 * 키
 *   위 · 아래   문턱값
 *   C          지나간 자리 지우기
 *   V          카메라 화면 보기 끄고 켜기
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
PGraphics trail;      // 지나간 자리를 남겨 두는 층
PFont ui;

float threshold = 0.7;
float minSize = 0.03;
boolean showVideo = true;

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

  trail = createGraphics(width, height);
  trail.beginDraw();
  trail.clear();
  trail.endDraw();
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

  background(0);
  if (showVideo) {
    image(video, 0, 0, width, height);
    noStroke();
    fill(0, 90);                 // 패턴이 잘 보이도록 카메라 화면을 조금 눌러 둡니다
    rect(0, 0, width, height);
  }

  small.copy(video, 0, 0, video.width, video.height, 0, 0, BLOB_W, BLOB_H);
  small.filter(BLUR, 1);
  small.loadPixels();
  blobs.setThreshold(threshold);
  blobs.computeBlobs(small.pixels);

  // 지나간 자리를 천천히 지웁니다. 값을 키우면 빨리 사라지고, 0 이면 계속 쌓입니다.
  trail.beginDraw();
  trail.noStroke();
  trail.fill(0, 18);
  trail.rect(0, 0, width, height);
  trail.endDraw();

  Blob big = biggestBlob();
  if (big != null) {
    float x = big.x * width;
    float y = big.y * height;
    float size = max(big.w * width, big.h * height);
    drawPattern(x, y, size);
  }

  image(trail, 0, 0);
  drawHud(big);
}

/* ------------------------------------------------------------------
   여기가 패턴입니다. 이 함수 안만 고치면 그리는 것이 달라집니다.
   x, y 는 손전등이 잡힌 자리, size 는 잡힌 덩어리의 크기입니다.
   ------------------------------------------------------------------ */
void drawPattern(float x, float y, float size) {
  trail.beginDraw();
  trail.noFill();
  trail.strokeWeight(2);

  // 동심원 셋
  for (int i = 0; i < 3; i++) {
    float d = size * (1.0 + i * 0.8) + sin(frameCount * 0.05 + i) * 6;
    trail.stroke(180 - i * 40, 200, 255, 200);
    trail.ellipse(x, y, d, d);
  }

  // 가운데에서 뻗는 선 여덟
  trail.stroke(255, 220, 120, 180);
  for (int i = 0; i < 8; i++) {
    float a = TWO_PI / 8 * i + frameCount * 0.02;
    float r1 = size * 0.6;
    float r2 = size * 1.4;
    trail.line(x + cos(a) * r1, y + sin(a) * r1, x + cos(a) * r2, y + sin(a) * r2);
  }

  trail.endDraw();
}

/** 기준보다 큰 덩어리 중 가장 큰 것 하나. 손전등 하나만 잡을 때 쓰는 방법입니다. */
Blob biggestBlob() {
  Blob best = null;
  float bestSize = 0;
  for (int i = 0; i < blobs.getBlobNb(); i++) {
    Blob b = blobs.getBlob(i);
    if (b == null || b.w < minSize) {
      continue;
    }
    float s = b.w * b.h;
    if (s > bestSize) {
      bestSize = s;
      best = b;
    }
  }
  return best;
}

void drawHud(Blob big) {
  noStroke();
  fill(0, 155);
  rect(12, 12, 360, 74, 6);
  fill(240);
  text("4단계 · 잡힌 자리에 패턴", 24, 32);
  fill(190);
  String where = big == null ? "찾는 중" : int(big.x * width) + ", " + int(big.y * height);
  text("문턱값 " + nf(threshold, 1, 2) + "   자리 " + where, 24, 54);
  fill(150);
  text("위·아래 문턱값   C 지우기   V 카메라   S 저장", 24, 76);
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
  if (key == 'c' || key == 'C') {
    trail.beginDraw();
    trail.clear();
    trail.endDraw();
  } else if (key == 'v' || key == 'V') {
    showVideo = !showVideo;
  } else if (key == 's' || key == 'S') {
    saveFrame("step4-####.png");
    println("저장했습니다: step4-####.png");
  }
}
