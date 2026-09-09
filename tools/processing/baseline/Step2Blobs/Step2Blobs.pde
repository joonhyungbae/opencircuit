/**
 * 2단계. 밝은 곳에 테두리 그리기 (Blob Detection)
 *
 * 수업에서 BlobDetection 예제를 열어 밝은 부분에 테두리가 그려지던 그 화면입니다.
 * 카메라 그림을 작게 줄여서(BLOB_W x BLOB_H) 밝은 덩어리를 찾고, 찾은 테두리는 큰 화면에 그립니다.
 * 작게 줄이는 이유는 640x480 을 그대로 뒤지면 느려지기 때문입니다.
 *
 * 필요한 라이브러리: Video, BlobDetection
 *
 * 여기서 바꿔 볼 것
 *   THRESHOLD  밝기 문턱값 0.0~1.0. 올릴수록 더 밝은 것만 남습니다. 3단계에서 키로 바꿉니다
 *   BLOB_W, BLOB_H  찾는 해상도. 키우면 자세해지고 느려집니다
 */
import processing.video.*;
import blobDetection.*;

final int CAM_W = 640;
final int CAM_H = 480;

// 블롭을 찾는 작은 그림의 크기
final int BLOB_W = 160;
final int BLOB_H = 120;

final float THRESHOLD = 0.6;

Capture video;
PImage small;
BlobDetection blobs;
PFont ui;

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
  blobs.setPosDiscrimination(true);   // true = 밝은 덩어리를 찾는다. false 면 어두운 덩어리
  blobs.setThreshold(THRESHOLD);
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

  // 카메라 그림을 작은 그림에 옮겨 담고, 그것에서 밝은 덩어리를 찾습니다.
  small.copy(video, 0, 0, video.width, video.height, 0, 0, BLOB_W, BLOB_H);
  small.filter(BLUR, 1);         // 자잘한 얼룩을 눌러 줍니다
  small.loadPixels();
  blobs.computeBlobs(small.pixels);

  drawBlobs();
  drawHud();
}

/** 찾은 덩어리의 테두리와 네모를 그립니다. 좌표는 0~1 이라 화면 크기를 곱해서 씁니다. */
void drawBlobs() {
  for (int i = 0; i < blobs.getBlobNb(); i++) {
    Blob b = blobs.getBlob(i);
    if (b == null) {
      continue;
    }

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

    stroke(255, 200, 0);
    strokeWeight(1);
    rect(b.xMin * width, b.yMin * height, b.w * width, b.h * height);
  }
}

void drawHud() {
  noStroke();
  fill(0, 150);
  rect(12, 12, 300, 52, 6);
  fill(240);
  text("2단계 · 밝은 곳 찾기", 24, 32);
  fill(190);
  text("문턱값 " + nf(THRESHOLD, 1, 2) + "   덩어리 " + blobs.getBlobNb() + "개", 24, 54);
}

void keyPressed() {
  if (key == 's' || key == 'S') {
    saveFrame("step2-####.png");
    println("저장했습니다: step2-####.png");
  }
}
