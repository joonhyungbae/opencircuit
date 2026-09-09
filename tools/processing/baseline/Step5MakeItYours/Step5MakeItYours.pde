/**
 * 5단계. 찾는 대상과 패턴을 내 마음대로 바꾸기
 *
 * 4단계까지는 밝은 것을 찾아 동심원을 그렸습니다. 여기서는 둘 다 바꿔 봅니다.
 * 찾는 대상은 밝은 것, 어두운 것, 화면에서 마우스로 고른 색 셋 중에 고릅니다.
 * 패턴도 셋 중에 고릅니다. 각각 코드에서 어디를 고치면 되는지는 아래 함수 둘에 모여 있습니다.
 *
 * 필요한 라이브러리: Video, BlobDetection
 *
 * 키
 *   1 · 2 · 3   찾는 대상 (밝은 것 · 어두운 것 · 고른 색)
 *   마우스 클릭  3번일 때 그 자리의 색을 고른다
 *   P          패턴 바꾸기
 *   위 · 아래   문턱값
 *   + · -      고른 색을 얼마나 너그럽게 볼지
 *   C 지우기   V 카메라 보기   S 저장
 */
import processing.video.*;
import blobDetection.*;

final int CAM_W = 640;
final int CAM_H = 480;
final int BLOB_W = 160;
final int BLOB_H = 120;

Capture video;
PImage small;        // 찾는 데 쓰는 작은 그림
BlobDetection blobs;
PGraphics trail;
PFont ui;

int findMode = 0;    // 0 밝은 것, 1 어두운 것, 2 고른 색
int patternMode = 0; // 0 동심원, 1 네모, 2 반짝임
float threshold = 0.7;
float minSize = 0.03;
int targetColor;      // setup() 에서 정한다
float tolerance = 90;
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
  targetColor = color(255, 60, 60);   // 3번 모드에서 마우스로 고르면 바뀐다

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
    fill(0, 90);
    rect(0, 0, width, height);
  }

  prepareSmall();
  blobs.setPosDiscrimination(findMode != 1);   // 어두운 것을 찾을 때만 false
  blobs.setThreshold(threshold);
  blobs.computeBlobs(small.pixels);

  trail.beginDraw();
  trail.noStroke();
  trail.fill(0, 18);
  trail.rect(0, 0, width, height);
  trail.endDraw();

  Blob big = biggestBlob();
  if (big != null) {
    drawPattern(big.x * width, big.y * height, max(big.w * width, big.h * height));
  }

  image(trail, 0, 0);
  drawHud(big);
}

/* ------------------------------------------------------------------
   찾는 대상. 여기서 작은 그림을 어떻게 만드느냐가 무엇을 찾을지를 정합니다.
   고른 색 모드는 목표 색과 가까운 자리만 흰색으로 칠해서 넘깁니다.
   ------------------------------------------------------------------ */
void prepareSmall() {
  small.copy(video, 0, 0, video.width, video.height, 0, 0, BLOB_W, BLOB_H);

  if (findMode == 2) {
    small.loadPixels();
    float tr = red(targetColor);
    float tg = green(targetColor);
    float tb = blue(targetColor);
    for (int i = 0; i < small.pixels.length; i++) {
      int c = small.pixels[i];
      float d = dist(red(c), green(c), blue(c), tr, tg, tb);
      small.pixels[i] = d < tolerance ? color(255) : color(0);
    }
    small.updatePixels();
  }

  small.filter(BLUR, 1);
  small.loadPixels();
}

/* ------------------------------------------------------------------
   패턴. 그리는 것을 바꾸려면 이 함수 안만 고칩니다.
   ------------------------------------------------------------------ */
void drawPattern(float x, float y, float size) {
  trail.beginDraw();
  trail.noFill();
  trail.strokeWeight(2);

  if (patternMode == 0) {
    for (int i = 0; i < 3; i++) {
      float d = size * (1.0 + i * 0.8) + sin(frameCount * 0.05 + i) * 6;
      trail.stroke(180 - i * 40, 200, 255, 200);
      trail.ellipse(x, y, d, d);
    }
  } else if (patternMode == 1) {
    trail.pushMatrix();
    trail.translate(x, y);
    trail.rotate(frameCount * 0.02);
    for (int i = 0; i < 4; i++) {
      float d = size * (0.8 + i * 0.5);
      trail.stroke(255, 200 - i * 40, 120, 200);
      trail.rect(-d / 2, -d / 2, d, d);
    }
    trail.popMatrix();
  } else {
    trail.noStroke();
    for (int i = 0; i < 12; i++) {
      float a = random(TWO_PI);
      float r = random(size * 0.4, size * 1.6);
      trail.fill(255, random(150, 255), random(80, 200), 200);
      trail.ellipse(x + cos(a) * r, y + sin(a) * r, 4, 4);
    }
  }

  trail.endDraw();
}

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

void mousePressed() {
  if (findMode != 2 || video.width == 0) {
    return;
  }
  // 누른 자리의 색을 목표 색으로 삼습니다.
  int vx = int(map(mouseX, 0, width, 0, video.width));
  int vy = int(map(mouseY, 0, height, 0, video.height));
  targetColor = video.get(vx, vy);
  println("고른 색: " + int(red(targetColor)) + ", " + int(green(targetColor)) + ", " + int(blue(targetColor)));
}

void drawHud(Blob big) {
  String[] finders = { "밝은 것", "어두운 것", "고른 색" };
  String[] patterns = { "동심원", "네모", "반짝임" };

  noStroke();
  fill(0, 155);
  rect(12, 12, 430, 96, 6);
  fill(240);
  text("5단계 · 내 마음대로", 24, 32);
  fill(190);
  text("찾는 것 " + finders[findMode] + "   패턴 " + patterns[patternMode]
    + "   문턱값 " + nf(threshold, 1, 2), 24, 54);
  String where = big == null ? "찾는 중" : int(big.x * width) + ", " + int(big.y * height);
  text("자리 " + where + (findMode == 2 ? "   색 허용 " + int(tolerance) : ""), 24, 76);
  fill(150);
  text("1 2 3 찾는 것   P 패턴   위·아래 문턱값   C 지우기   S 저장", 24, 98);

  if (findMode == 2) {
    fill(targetColor);
    rect(width - 40, 16, 24, 24, 4);
  }
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
  if (key == '1') {
    findMode = 0;
  } else if (key == '2') {
    findMode = 1;
  } else if (key == '3') {
    findMode = 2;
  } else if (key == 'p' || key == 'P') {
    patternMode = (patternMode + 1) % 3;
  } else if (key == '+' || key == '=') {
    tolerance = constrain(tolerance + 10, 10, 220);
  } else if (key == '-' || key == '_') {
    tolerance = constrain(tolerance - 10, 10, 220);
  } else if (key == 'c' || key == 'C') {
    trail.beginDraw();
    trail.clear();
    trail.endDraw();
  } else if (key == 'v' || key == 'V') {
    showVideo = !showVideo;
  } else if (key == 's' || key == 'S') {
    saveFrame("step5-####.png");
    println("저장했습니다: step5-####.png");
  }
}
