/**
 * 1단계. 웹캠 열기
 *
 * 3회차 실습의 첫 칸입니다. 창에 내 얼굴이 나오면 됩니다.
 * 여기서부터 2단계(밝은 곳 찾기), 3단계(손전등만 남기기), 4단계(패턴 그리기)로 이어집니다.
 *
 * 필요한 라이브러리: Video (Video Library for Processing 4)
 * macOS 는 처음 실행할 때 카메라를 써도 되는지 물어봅니다. 허용을 누르세요.
 *
 * 키
 *   S  지금 화면을 그림 파일로 저장
 */
import processing.video.*;

final int CAM_W = 640;
final int CAM_H = 480;

Capture video;
PFont ui;

void settings() {
  size(CAM_W, CAM_H);
}

void setup() {
  frameRate(30);
  ui = createFont("SansSerif", 14, true);
  textFont(ui);

  // 콘솔(아래 검은 칸)에 카메라 목록이 찍힙니다.
  // 노트북 내장 대신 다른 카메라를 쓰려면 목록의 이름을 그대로 넣으면 됩니다.
  //   video = new Capture(this, CAM_W, CAM_H, cams[1], 30);
  String[] cams = Capture.list();
  println("카메라 " + cams.length + "대");
  for (int i = 0; i < cams.length; i++) {
    println("  [" + i + "] " + cams[i]);
  }

  video = new Capture(this, CAM_W, CAM_H);
  video.start();
}

void draw() {
  if (video.available()) {
    video.read();
  }

  // 카메라 첫 프레임이 오기 전까지는 검은 화면에 안내만 그립니다.
  if (video.width == 0) {
    background(18);
    fill(230);
    text("카메라 프레임 대기 중...", 20, 30);
    return;
  }

  image(video, 0, 0, width, height);

  fill(0, 150);
  noStroke();
  rect(12, 12, 210, 30, 6);
  fill(240);
  text("1단계 · 웹캠   " + int(frameRate) + " fps", 24, 32);
}

void keyPressed() {
  if (key == 's' || key == 'S') {
    saveFrame("step1-####.png");
    println("저장했습니다: step1-####.png");
  }
}
