/**
 * OpenCV Cam Demo
 *
 * 왼쪽 = 카메라 원본, 오른쪽 = OpenCV 처리 결과.
 * 숫자키 1~8 로 처리 모드를 바꾸고, 위/아래 화살표로 파라미터를 조절한다.
 * s 키를 누르면 현재 화면을 PNG로 저장한다.
 *
 * 필요한 라이브러리: OpenCV for Processing 0.7.0, Video Library for Processing 4
 */
import gab.opencv.*;
import processing.video.*;
import java.awt.Rectangle;
final int CAM_W = 640;
final int CAM_H = 480;
final int BAR_H = 64;
Capture video;
OpenCV opencv;
int mode = 1;
final String[] MODE_NAMES = {
  "",
  "ORIGINAL",       // 1 - 원본 그대로 (파이프라인 확인용)
  "GRAY",           // 2 - 그레이스케일
  "CANNY EDGES",    // 3 - 캐니 엣지
  "THRESHOLD",      // 4 - 이진화
  "CONTOURS",       // 5 - 외곽선 검출
  "FACE DETECT",    // 6 - 얼굴 검출 (haar cascade)
  "OPTICAL FLOW",   // 7 - 옵티컬 플로우
  "MOTION (BG SUB)" // 8 - 배경 차분 기반 움직임
};
// 모드별 조절 파라미터
int cannyLow      = 40;
int threshLevel   = 100;
int contourLevel  = 70;
int minContourArea = 300;
PImage processed;
ArrayList<Contour> contours = new ArrayList<Contour>();
Rectangle[] faces = new Rectangle[0];
boolean bgSubStarted = false;
void settings() {
  size(CAM_W * 2, CAM_H + BAR_H);
}
void setup() {
  frameRate(30);
  String[] cams = Capture.list();
  println("--- 사용 가능한 카메라 " + cams.length + "대 ---");
  for (int i = 0; i < cams.length; i++) println("  [" + i + "] " + cams[i]);
  // autovideosrc = 시스템 기본 카메라. 특정 카메라를 쓰려면 위 목록의
  // 이름을 그대로 넣으면 된다:  new Capture(this, CAM_W, CAM_H, cams[0], 30)
  video = new Capture(this, "pipeline:autovideosrc");
  video.start();
  opencv = new OpenCV(this, CAM_W, CAM_H);
  opencv.loadCascade(OpenCV.CASCADE_FRONTALFACE);
  // 참고: OpenCV.VERSION 은 이 배포판에서 미치환 플레이스홀더가 나오므로 쓰지 않는다.
  println("ready - 숫자키 1~8 로 모드 전환");
}
void draw() {
  if (video.available()) video.read();
  background(18);
  // 카메라 첫 프레임이 아직 안 왔을 때
  if (video.width == 0 || video.height == 0) {
    fill(220);
    textAlign(LEFT, TOP);
    textSize(14);
    text("카메라 프레임 대기 중...", 20, 20);
    drawBar();
    return;
  }
  image(video, 0, 0, CAM_W, CAM_H);   // 왼쪽: 원본
  process();
  if (processed != null) {
    image(processed, CAM_W, 0, CAM_W, CAM_H);  // 오른쪽: 처리 결과
  }
  // 오른쪽 패널 좌표계로 옮겨서 검출 결과를 겹쳐 그린다
  pushMatrix();
  translate(CAM_W, 0);
  drawOverlay();
  popMatrix();
  drawBar();
}
/** 선택된 모드에 따라 OpenCV 연산을 수행한다. */
void process() {
  opencv.loadImage(video);
  contours.clear();
  faces = new Rectangle[0];
  switch (mode) {
  case 1:
    processed = video;
    break;
  case 2:
    opencv.gray();
    processed = opencv.getSnapshot();
    break;
  case 3:
    // 캐니는 보통 상한을 하한의 2~3배로 잡는다
    opencv.findCannyEdges(cannyLow, cannyLow * 3);
    processed = opencv.getSnapshot();
    break;
  case 4:
    opencv.gray();
    opencv.threshold(threshLevel);
    processed = opencv.getSnapshot();
    break;
  case 5:
    opencv.gray();
    opencv.threshold(contourLevel);
    processed = opencv.getSnapshot();
    contours = opencv.findContours();
    break;
  case 6:
    faces = opencv.detect();
    processed = opencv.getSnapshot();
    break;
  case 7:
    opencv.calculateOpticalFlow();
    processed = opencv.getSnapshot();
    break;
  case 8:
    if (!bgSubStarted) {
      opencv.startBackgroundSubtraction(5, 3, 0.5);
      bgSubStarted = true;
    }
    opencv.updateBackground();
    opencv.dilate();   // 노이즈 정리
    opencv.erode();
    processed = opencv.getSnapshot();
    break;
  }
}
/** 오른쪽 패널 위에 검출 결과(외곽선/얼굴/플로우)를 겹쳐 그린다. */
void drawOverlay() {
  noFill();
  if (mode == 5) {
    stroke(0, 255, 120);
    strokeWeight(2);
    for (Contour c : contours) {
      if (c.area() < minContourArea) continue;   // 자잘한 노이즈 제외
      c.draw();
    }
  } else if (mode == 6) {
    stroke(0, 255, 120);
    strokeWeight(3);
    for (int i = 0; i < faces.length; i++) {
      rect(faces[i].x, faces[i].y, faces[i].width, faces[i].height);
    }
  } else if (mode == 7) {
    stroke(0, 255, 200);
    strokeWeight(1);
    opencv.drawOpticalFlow();
  }
}
/** 하단 정보 바 */
void drawBar() {
  noStroke();
  fill(26);
  rect(0, CAM_H, width, BAR_H);
  fill(240);
  textAlign(LEFT, CENTER);
  textSize(16);
  text(mode + ".  " + MODE_NAMES[mode], 16, CAM_H + 21);
  fill(140);
  textSize(12);
  text("1-8 mode   UP/DOWN adjust   s save   |   " + nf(frameRate, 2, 1) + " fps",
       16, CAM_H + 45);
  textAlign(RIGHT, CENTER);
  fill(200);
  textSize(13);
  text(paramLabel(), width - 16, CAM_H + 21);
  fill(140);
  textSize(12);
  text(resultLabel(), width - 16, CAM_H + 45);
  // 패널 라벨
  fill(255);
  textAlign(LEFT, TOP);
  textSize(12);
  text("INPUT", 10, 10);
  text("OPENCV", CAM_W + 10, 10);
}
String paramLabel() {
  if (mode == 3) return "canny low = " + cannyLow + "  (high = " + (cannyLow * 3) + ")";
  if (mode == 4) return "threshold = " + threshLevel;
  if (mode == 5) return "threshold = " + contourLevel + "   min area = " + minContourArea;
  return "";
}
String resultLabel() {
  if (mode == 5) {
    int shown = 0;
    for (Contour c : contours) if (c.area() >= minContourArea) shown++;
    return shown + " contours (of " + contours.size() + ")";
  }
  if (mode == 6) return faces.length + " face(s)";
  if (mode == 7) return "avg flow " + nf(opencv.getAverageFlow().mag(), 1, 2);
  return "";
}
void keyPressed() {
  if (key >= '1' && key <= '8') {
    mode = key - '0';
    return;
  }
  if (key == 's' || key == 'S') {
    saveFrame("opencv-cam-####.png");
    println("saved: opencv-cam-####.png");
    return;
  }
  if (key == CODED) {
    if (keyCode == UP)   adjust(+1);
    if (keyCode == DOWN) adjust(-1);
  }
}
void adjust(int dir) {
  if (mode == 3)      cannyLow     = constrain(cannyLow + dir * 5, 5, 200);
  else if (mode == 4) threshLevel  = constrain(threshLevel + dir * 5, 0, 255);
  else if (mode == 5) contourLevel = constrain(contourLevel + dir * 5, 0, 255);
}
