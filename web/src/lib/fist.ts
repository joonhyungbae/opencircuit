import {
  FilesetResolver,
  HandLandmarker,
  type ImageSource,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

const WASM = "/mediapipe/wasm";
const 손모델 = "/mediapipe/hand_landmarker.task";

const 뼈대: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [0, 17],
];

let fileset: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>> | null =
  null;
let 손: HandLandmarker | null = null;
let lastTs = 0;
let 실패로그 = false;

function 시각(): number {
  const t = performance.now();
  if (t <= lastTs) lastTs += 1;
  else lastTs = t;
  return lastTs;
}

function 거리(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));
}

function 접힘(marks: NormalizedLandmark[], tip: number, pip: number): boolean {
  return 거리(marks[tip], marks[0]) < 거리(marks[pip], marks[0]) * 1.12;
}

export function 주먹인가(marks: NormalizedLandmark[]): boolean {
  if (marks.length < 21) return false;
  const 검지 = 접힘(marks, 8, 6);
  const 중지 = 접힘(marks, 12, 10);
  const 약지 = 접힘(marks, 16, 14);
  const 소지 = 접힘(marks, 20, 18);
  const 엄지 = 거리(marks[4], marks[17]) < 거리(marks[2], marks[1]) * 1.6;
  return 검지 && 중지 && 약지 && 소지 && 엄지;
}

export async function 손준비(): Promise<void> {
  if (손) return;
  console.info("[OpenCircuit] 손 모델 여는 중");
  fileset = await FilesetResolver.forVisionTasks(WASM);
  손 = await HandLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: 손모델, delegate: "CPU" },
    runningMode: "VIDEO",
    numHands: 2,
    minHandDetectionConfidence: 0.35,
    minHandPresenceConfidence: 0.35,
    minTrackingConfidence: 0.35,
  });
  console.info("[OpenCircuit] 손 모델 준비");
}

export type 손결과 = {
  hands: NormalizedLandmark[][];
  fist: boolean;
};

export function 손찾기(src: ImageSource): 손결과 {
  if (!손) return { hands: [], fist: false };
  try {
    const out = 손.detectForVideo(src, 시각());
    const hands = out.landmarks ?? [];
    return { hands, fist: hands.some((h) => 주먹인가(h)) };
  } catch (err) {
    if (!실패로그) {
      실패로그 = true;
      console.error("[OpenCircuit] 손 인식 한 프레임 실패", err);
    }
    return { hands: [], fist: false };
  }
}

export function 손뼈대그리기(
  canvas: HTMLCanvasElement,
  src: ImageSource,
  결과: 손결과,
): void {
  let w = 0;
  let h = 0;
  if (src instanceof HTMLVideoElement) {
    w = src.videoWidth;
    h = src.videoHeight;
  } else if (src instanceof HTMLCanvasElement) {
    w = src.width;
    h = src.height;
  }
  if (!w || !h) return;
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, w, h);
  const 색 = 결과.fist ? "#ff4d6d" : "#3dff9a";
  for (const marks of 결과.hands) {
    ctx.strokeStyle = 색;
    ctx.lineWidth = Math.max(3, w * 0.006);
    ctx.lineCap = "round";
    for (const [a, b] of 뼈대) {
      const p = marks[a];
      const q = marks[b];
      if (!p || !q) continue;
      ctx.beginPath();
      ctx.moveTo(p.x * w, p.y * h);
      ctx.lineTo(q.x * w, q.y * h);
      ctx.stroke();
    }
    ctx.fillStyle = 색;
    for (const p of marks) {
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, Math.max(3, w * 0.01), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
