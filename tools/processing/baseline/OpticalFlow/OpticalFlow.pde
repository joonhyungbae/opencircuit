/**
 * 웹캠 Optical Flow 예제
 *
 * Processing 4 → Sketch → Import Library → Add Library…
 *   - Video
 *   - OpenCV for Processing (0.7 이상)
 *
 * macOS: 시스템 설정 → 개인정보 보호 및 보안 → 카메라에서 Processing 허용
 *
 * 키
 *   V  보기 전환 (벡터 / 색 / 둘 다)
 *   P  입자가 흐름을 따라가게
 *   스페이스  일시정지
 *   R  입자 다시 뿌리기
 *   + / -  벡터 간격
 */
import processing.video.*;
import org.bytedeco.javacpp.Loader;
import org.bytedeco.opencv.opencv_java;
import org.opencv.core.CvType;
import org.opencv.core.Mat;
import org.opencv.imgproc.Imgproc;
import org.opencv.video.Video;
final int PROC_W = 320;
final int PROC_H = 240;
final int TRACER_COUNT = 280;
Capture cam;
PImage work;
PImage flowColor;
PGraphics trails;
Mat prevGray;
Mat nextGray;
Mat flow;
float[] flowBuf;
int viewMode = 0;
boolean showTracers = true;
boolean paused = false;
int step = 8;
String error = "";
Tracer[] tracers;
void setup() {
  size(1280, 720);
  frameRate(30);
  textFont(createFont("SansSerif", 15, true));
  work = createImage(PROC_W, PROC_H, RGB);
  flowColor = createImage(PROC_W, PROC_H, RGB);
  trails = createGraphics(width, height);
  trails.beginDraw();
  trails.background(0, 0);
  trails.endDraw();
  tracers = new Tracer[TRACER_COUNT];
  for (int i = 0; i < tracers.length; i++) {
    tracers[i] = new Tracer();
  }
  try {
    Loader.load(opencv_java.class);
  } catch (Throwable e) {
    error = "OpenCV를 시작하지 못했습니다. Sketch → Import Library → Add Library… 에서 OpenCV for Processing (0.7 이상) 을 설치한 뒤 스케치를 다시 여세요.\n\n"
      + e.getMessage();
    return;
  }
  try {
    String[] devices = Capture.list();
    if (devices == null || devices.length == 0) {
      error = "카메라를 찾지 못했습니다. 연결을 확인한 뒤 Processing을 다시 실행하세요.";
      return;
    }
    cam = new Capture(this, 640, 480);
    cam.start();
  } catch (Exception e) {
    error = "카메라를 열 수 없습니다. macOS는 시스템 설정 → 개인정보 보호 및 보안 → 카메라에서 Processing을 허용한 뒤 다시 실행하세요.";
  }
}
void draw() {
  if (error.length() > 0) {
    drawError();
    return;
  }
  if (!paused) {
    readCamera();
    computeFlow();
  }
  background(8, 10, 16);
  image(work, 0, 0, width, height);
  fill(8, 10, 16, 140);
  noStroke();
  rect(0, 0, width, height);
  if (hasFlow()) {
    if (viewMode == 1 || viewMode == 2) {
      tint(255, 170);
      image(flowColor, 0, 0, width, height);
      noTint();
    }
    if (viewMode == 0 || viewMode == 2) {
      drawVectors();
    }
    if (showTracers && !paused) {
      updateTracers();
    }
    image(trails, 0, 0);
    drawAverageFlow();
  }
  drawHud();
}
void keyPressed() {
  if (key == 'v' || key == 'V') {
    viewMode = (viewMode + 1) % 3;
  } else if (key == 'p' || key == 'P') {
    showTracers = !showTracers;
    if (!showTracers) {
      clearTrails();
    }
  } else if (key == ' ') {
    paused = !paused;
  } else if (key == 'r' || key == 'R') {
    for (int i = 0; i < tracers.length; i++) {
      tracers[i].respawn();
    }
    clearTrails();
  } else if (key == '+' || key == '=') {
    step = constrain(step - 2, 4, 24);
  } else if (key == '-' || key == '_') {
    step = constrain(step + 2, 4, 24);
  }
}
void readCamera() {
  if (cam == null || !cam.available()) {
    return;
  }
  cam.read();
  PImage frame = cam.copy();
  frame.resize(PROC_W, PROC_H);
  frame.loadPixels();
  work.loadPixels();
  for (int y = 0; y < PROC_H; y++) {
    int row = y * PROC_W;
    for (int x = 0; x < PROC_W; x++) {
      work.pixels[row + (PROC_W - 1 - x)] = frame.pixels[row + x];
    }
  }
  work.updatePixels();
}
void computeFlow() {
  Mat bgr = toBgr(work);
  nextGray = new Mat();
  Imgproc.cvtColor(bgr, nextGray, Imgproc.COLOR_BGR2GRAY);
  bgr.release();
  if (prevGray == null || prevGray.empty()
      || prevGray.cols() != nextGray.cols() || prevGray.rows() != nextGray.rows()) {
    release(prevGray);
    prevGray = nextGray.clone();
    release(nextGray);
    nextGray = null;
    return;
  }
  if (flow == null) {
    flow = new Mat();
  }
  Video.calcOpticalFlowFarneback(prevGray, nextGray, flow, 0.5, 3, 15, 3, 5, 1.2, 0);
  int n = (int) (flow.total() * flow.channels());
  if (flowBuf == null || flowBuf.length != n) {
    flowBuf = new float[n];
  }
  flow.get(0, 0, flowBuf);
  bakeFlowColor();
  release(prevGray);
  prevGray = nextGray;
  nextGray = null;
}
void bakeFlowColor() {
  flowColor.loadPixels();
  colorMode(HSB, 360, 255, 255);
  for (int i = 0; i < PROC_W * PROC_H; i++) {
    float dx = flowBuf[i * 2];
    float dy = flowBuf[i * 2 + 1];
    float mag = sqrt(dx * dx + dy * dy);
    if (mag < 0.4) {
      flowColor.pixels[i] = color(0, 0, 0);
    } else {
      float hue = map(atan2(dy, dx), -PI, PI, 0, 360);
      float val = constrain(mag * 28, 0, 255);
      flowColor.pixels[i] = color(hue, 200, val);
    }
  }
  colorMode(RGB, 255);
  flowColor.updatePixels();
}
void drawVectors() {
  float sx = width / (float) PROC_W;
  float sy = height / (float) PROC_H;
  strokeWeight(1.4);
  colorMode(HSB, 360, 255, 255);
  for (int y = step / 2; y < PROC_H; y += step) {
    for (int x = step / 2; x < PROC_W; x += step) {
      int i = y * PROC_W + x;
      float dx = flowBuf[i * 2];
      float dy = flowBuf[i * 2 + 1];
      float mag = sqrt(dx * dx + dy * dy);
      if (mag < 0.6) {
        continue;
      }
      float len = constrain(mag * 6.5, 2, step * 1.6);
      float nx = dx / mag;
      float ny = dy / mag;
      float x0 = x * sx;
      float y0 = y * sy;
      float x1 = x0 + nx * len * sx * 0.35;
      float y1 = y0 + ny * len * sy * 0.35;
      stroke(map(atan2(dy, dx), -PI, PI, 0, 360), 180, 255, 220);
      line(x0, y0, x1, y1);
    }
  }
  colorMode(RGB, 255);
}
void updateTracers() {
  trails.beginDraw();
  trails.noStroke();
  trails.fill(0, 22);
  trails.rect(0, 0, width, height);
  trails.strokeWeight(2.2);
  for (int i = 0; i < tracers.length; i++) {
    tracers[i].step();
  }
  trails.endDraw();
}
void drawAverageFlow() {
  PVector avg = averageFlow();
  float mag = avg.mag();
  if (mag < 0.15) {
    return;
  }
  float cx = width * 0.5;
  float cy = height * 0.5;
  float scale = 48;
  stroke(255, 230);
  strokeWeight(3);
  line(cx, cy, cx + avg.x * scale, cy + avg.y * scale);
  fill(255, 230);
  noStroke();
  ellipse(cx + avg.x * scale, cy + avg.y * scale, 8, 8);
}
PVector averageFlow() {
  double sx = 0;
  double sy = 0;
  int count = 0;
  for (int i = 0; i < PROC_W * PROC_H; i += 4) {
    float dx = flowBuf[i * 2];
    float dy = flowBuf[i * 2 + 1];
    if (abs(dx) + abs(dy) < 0.4) {
      continue;
    }
    sx += dx;
    sy += dy;
    count++;
  }
  if (count == 0) {
    return new PVector(0, 0);
  }
  return new PVector((float) (sx / count), (float) (sy / count));
}
PVector flowAtScreen(float sx, float sy) {
  int x = constrain(int(sx / width * PROC_W), 0, PROC_W - 1);
  int y = constrain(int(sy / height * PROC_H), 0, PROC_H - 1);
  int i = y * PROC_W + x;
  return new PVector(flowBuf[i * 2], flowBuf[i * 2 + 1]);
}
boolean hasFlow() {
  return flowBuf != null;
}
void drawHud() {
  String[] views = { "벡터", "색", "벡터+색" };
  fill(0, 150);
  noStroke();
  rect(16, 16, 420, 92, 8);
  fill(235);
  textAlign(LEFT, TOP);
  text("Optical Flow  " + views[viewMode]
    + (showTracers ? "  ·  입자" : "")
    + (paused ? "  ·  정지" : ""), 28, 28);
  text("V 보기   P 입자   스페이스 정지   R 리셋   +/- 간격 " + step, 28, 52);
  text(int(frameRate) + " fps", 28, 76);
}
void drawError() {
  background(250, 246, 238);
  fill(56, 44, 38);
  textAlign(LEFT, TOP);
  textSize(18);
  text(error, 48, 48, width - 96, height - 96);
}
void clearTrails() {
  trails.beginDraw();
  trails.clear();
  trails.endDraw();
}
Mat toBgr(PImage img) {
  img.loadPixels();
  Mat mat = new Mat(img.height, img.width, CvType.CV_8UC3);
  byte[] data = new byte[img.width * img.height * 3];
  for (int i = 0; i < img.pixels.length; i++) {
    int c = img.pixels[i];
    int o = i * 3;
    data[o] = (byte) (c & 0xFF);
    data[o + 1] = (byte) ((c >> 8) & 0xFF);
    data[o + 2] = (byte) ((c >> 16) & 0xFF);
  }
  mat.put(0, 0, data);
  return mat;
}
void release(Mat mat) {
  if (mat != null) {
    mat.release();
  }
}
class Tracer {
  float x;
  float y;
  Tracer() {
    respawn();
  }
  void respawn() {
    x = random(width);
    y = random(height);
  }
  void step() {
    PVector f = flowAtScreen(x, y);
    float mag = f.mag();
    if (mag < 0.35) {
      if (random(1) < 0.04) {
        respawn();
      }
      return;
    }
    float px = x;
    float py = y;
    x += f.x * (width / (float) PROC_W) * 0.85;
    y += f.y * (height / (float) PROC_H) * 0.85;
    if (x < 0 || x >= width || y < 0 || y >= height) {
      respawn();
      return;
    }
    trails.colorMode(HSB, 360, 255, 255);
    trails.stroke(map(atan2(f.y, f.x), -PI, PI, 0, 360), 160, 255, 180);
    trails.line(px, py, x, y);
    trails.colorMode(RGB, 255);
  }
}
