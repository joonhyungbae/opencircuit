export type FilterKind = "none" | "dog" | "glasses" | "tiger" | "werewolf";

export const FILTERS: { id: FilterKind; label: string }[] = [
  { id: "none", label: "없음" },
  { id: "dog", label: "강아지" },
  { id: "glasses", label: "안경" },
  { id: "tiger", label: "호랑이" },
  { id: "werewolf", label: "늑대" },
];

const 루트 = "/jeeliz";
const 개 = `${루트}/demos/threejs/dog_face/models/dog`;
const 안경 = `${루트}/demos/threejs/glassesVTO`;
const 호랑이 = `${루트}/demos/threejs/tiger`;
const 늑대 = `${루트}/demos/threejs/werewolf/models/werewolf`;

// Jeeliz 공식 데모는 three r97 전역 API를 씁니다.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ThreeApi = any;

declare global {
  interface Window {
    THREE: ThreeApi;
    JEELIZFACEFILTER: {
      init: (opt: Record<string, unknown>) => void;
      destroy: () => Promise<void>;
      resize: () => void;
      toggle_pause: (pause: boolean, shutVideo?: boolean) => Promise<void>;
      update_videoElement: (video: HTMLVideoElement, cb?: () => void) => void;
    };
    JeelizThreeHelper: {
      init: (spec: JeelizSpec, cb?: (i: number, on: boolean) => void) => ThreeStuff;
      create_camera: () => ThreeObj;
      update_camera: (cam: ThreeObj) => void;
      render: (state: DetectState, cam: ThreeObj) => void;
      get_isDetected: () => boolean;
      get_threeVideoTexture: () => ThreeObj;
      create_threejsOccluder: (url: string) => ThreeObj;
    };
    JeelizThreeGlassesCreator: (spec: {
      envMapURL: string;
      frameMeshURL: string;
      lensesMeshURL: string;
      occluderURL: string;
    }) => { glasses: ThreeObj; occluder: ThreeObj };
    TWEEN: { update: () => void; Tween: new (target: object) => TweenApi };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ThreeObj = any;

type ThreeMat = {
  opacity: { value: number } | number;
  set_amortized?: (
    p: ThreeObj,
    s: ThreeObj,
    q: ThreeObj,
    parent: false,
    k: number,
  ) => void;
  uniforms?: { mouthOpening?: { value: number } };
  needsUpdate?: boolean;
};

type ThreeStuff = {
  scene: ThreeObj;
  faceObject: ThreeObj;
  renderer: {
    toneMapping?: number;
    outputEncoding?: number;
    getSize?: (t?: ThreeObj) => { width: number; height: number };
  };
  videoMesh: { material: ThreeMat; geometry: unknown };
};

type JeelizSpec = {
  canvasElement: HTMLCanvasElement;
  videoElement: HTMLVideoElement;
  videoTransformMat2: unknown;
  GL: WebGLRenderingContext;
  videoTexture: unknown;
  maxFacesDetected: number;
};

type DetectState = {
  detected: number;
  expressions: number[];
};

type TweenApi = {
  to: (v: object, ms: number) => TweenApi;
  start: () => TweenApi;
  onComplete: (fn: () => void) => TweenApi;
};

type MixerApi = {
  clipAction: (clip: unknown) => {
    play: () => void;
    reset: () => void;
    paused: boolean;
    timescale?: number;
    timeScale?: number;
    noLoop?: boolean;
  };
  update: (dt: number) => void;
};

let 줄 = Promise.resolve();
let 세대 = 0;
let 켜짐 = false;
let 지금: FilterKind = "none";
let 카메라: ThreeObj | null = null;
let 장면: ThreeStuff | null = null;
let 마지막스펙: JeelizSpec | null = null;
let 장식: ThreeObj | null = null;
let 조명묶음: ThreeObj | null = null;
let 장식세대 = 0;
let 개상태: {
  ear?: ThreeObj;
  tongue?: ThreeObj;
  mixer?: MixerApi;
  action?: ReturnType<MixerApi["clipAction"]>;
  loaded: boolean;
  over: boolean;
  under: boolean;
  animating: boolean;
  opaque: boolean;
  out: boolean;
  done: boolean;
} | null = null;
let 호랑이상태: {
  mats: ThreeMat[];
  mouth?: ThreeObj;
  particles: ThreeObj[];
  shot: number;
  dir: ThreeObj | null;
} | null = null;
const 사진홀드: {
  canvas: HTMLCanvasElement | null;
  video: HTMLVideoElement | null;
  stream: MediaStream | null;
} = { canvas: null, video: null, stream: null };

function three() {
  return window.THREE;
}

function 로그(...값: unknown[]) {
  console.info("[OpenCircuit] 필터", ...값);
}

function 스크립트(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-oc-jeeliz="${src}"]`)) {
      로그("스크립트 이미 있음", src);
      resolve();
      return;
    }
    로그("스크립트 로드", src);
    const el = document.createElement("script");
    el.src = src;
    el.async = false;
    el.dataset.ocJeeliz = src;
    el.onload = () => {
      로그("스크립트 완료", src);
      resolve();
    };
    el.onerror = () => reject(new Error(`스크립트를 읽지 못했습니다: ${src}`));
    document.head.appendChild(el);
  });
}

let 신경망: unknown = null;

async function 라이브러리(): Promise<void> {
  if (window.JEELIZFACEFILTER && window.JeelizThreeHelper && window.THREE && 신경망) {
    로그("라이브러리 재사용");
    return;
  }
  await 스크립트(`${루트}/libs/three/v97/three.min.js`);
  await 스크립트(`${루트}/dist/jeelizFaceFilter.js`);
  await 스크립트(`${루트}/helpers/JeelizThreeHelper.js`);
  await 스크립트(`${루트}/libs/three/customMaterials/FlexMaterial/ThreeFlexMaterial.js`);
  await 스크립트(`${루트}/libs/tween/v16_3_5/Tween.min.js`);
  await 스크립트(`${루트}/demos/threejs/glassesVTO/JeelizThreeGlassesCreator.js`);
  if (!window.THREE) throw new Error("THREE 가 없습니다.");
  if (!window.JEELIZFACEFILTER) throw new Error("JEELIZFACEFILTER 가 없습니다.");
  if (!window.JeelizThreeHelper) throw new Error("JeelizThreeHelper 가 없습니다.");
  if (typeof window.JeelizThreeGlassesCreator !== "function") {
    throw new Error("JeelizThreeGlassesCreator 가 없습니다.");
  }
  if (!신경망) {
    const url = `${루트}/neuralNets/NN_DEFAULT.json`;
    로그("신경망 받는 중", url);
    const res = await fetch(url);
    로그("신경망 응답", res.status, res.ok);
    if (!res.ok) throw new Error(`신경망을 받지 못했습니다 (${res.status}).`);
    신경망 = await res.json();
    로그("신경망 파싱 완료");
  }
}

function 텍(url: string) {
  const T = three();
  return new T.TextureLoader().load(url);
}

function 영상올때까지(video: HTMLVideoElement): Promise<void> {
  if (video.videoWidth) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const 끝 = (ok: boolean) => {
      video.removeEventListener("loadeddata", 성공);
      window.clearTimeout(시계);
      if (ok) resolve();
      else reject(new Error("영상 크기를 읽지 못했습니다."));
    };
    const 성공 = () => 끝(!!video.videoWidth);
    const 시계 = window.setTimeout(() => 끝(!!video.videoWidth), 4000);
    video.addEventListener("loadeddata", 성공);
    void video.play().catch(() => {});
  });
}

export async function 사진영상(img: HTMLImageElement): Promise<HTMLVideoElement> {
  사진홀드.stream?.getTracks().forEach((t) => t.stop());
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext("2d")?.drawImage(img, 0, 0);
  if (typeof canvas.captureStream !== "function") {
    throw new Error("이 브라우저는 사진에 필터를 씌우지 못합니다. 웹캠을 쓰세요.");
  }
  const stream = canvas.captureStream(8);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.srcObject = stream;
  사진홀드.canvas = canvas;
  사진홀드.video = video;
  사진홀드.stream = stream;
  await video.play().catch(() => {});
  await 영상올때까지(video);
  return video;
}

function 칸맞추기(canvas: HTMLCanvasElement, video: HTMLVideoElement) {
  const w = video.videoWidth || 640;
  const h = video.videoHeight || 480;
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
}

async function 엔진끄기(): Promise<void> {
  const 있었음 = 켜짐;
  켜짐 = false;
  지금 = "none";
  카메라 = null;
  장면 = null;
  마지막스펙 = null;
  장식 = null;
  조명묶음 = null;
  개상태 = null;
  호랑이상태 = null;
  if (!있었음 || !window.JEELIZFACEFILTER?.destroy) {
    로그("엔진끄기 건너뜀", { 있었음 });
    return;
  }
  로그("엔진 destroy 시작");
  try {
    await Promise.race([
      window.JEELIZFACEFILTER.destroy(),
      new Promise<void>((_, reject) => {
        window.setTimeout(() => reject(new Error("destroy 시간 초과")), 4000);
      }),
    ]);
    로그("엔진 destroy 끝");
  } catch (err) {
    로그("엔진 destroy 실패", err);
  }
}

function 개장면(face: ThreeObj, 토큰: number) {
  const T = three();
  const root = new T.Object3D();
  const mgr = new T.LoadingManager();
  let ear: ThreeObj | undefined;
  let nose: ThreeObj | undefined;
  let tongue: ThreeObj | undefined;
  개상태 = {
    loaded: false,
    over: false,
    under: true,
    animating: false,
    opaque: false,
    out: false,
    done: false,
  };

  new T.BufferGeometryLoader(mgr).load(`${개}/dog_ears.json`, (geom: unknown) => {
    const mat = T.FlexMaterial({
      map: 텍(`${개}/texture_ears.jpg`),
      flexMap: 텍(`${개}/flex_ears_256.jpg`),
      alphaMap: 텍(`${개}/alpha_ears_256.jpg`),
      transparent: true,
      opacity: 1,
      bumpMap: 텍(`${개}/normal_ears.jpg`),
      bumpScale: 0.0075,
      shininess: 1.5,
      specular: 0xffffff,
    });
    ear = new T.Mesh(geom, mat);
    ear.scale.multiplyScalar(0.025);
    ear.position.setY(-0.3);
    ear.frustumCulled = false;
    ear.renderOrder = 10000;
    if (ear.material && !Array.isArray(ear.material) && ear.material.opacity) {
      (ear.material.opacity as { value: number }).value = 1;
    }
  });

  new T.BufferGeometryLoader(mgr).load(`${개}/dog_nose.json`, (geom: unknown) => {
    const mat = new T.MeshPhongMaterial({
      map: 텍(`${개}/texture_nose.jpg`),
      shininess: 1.5,
      specular: 0xffffff,
      bumpMap: 텍(`${개}/normal_nose.jpg`),
      bumpScale: 0.005,
    });
    nose = new T.Mesh(geom, mat);
    nose.scale.multiplyScalar(0.018);
    nose.position.setY(-0.05);
    nose.position.setZ(0.15);
    nose.frustumCulled = false;
    nose.renderOrder = 10000;
  });

  new T.JSONLoader(mgr).load(`${개}/dog_tongue.json`, (geom: ThreeObj & { computeMorphNormals?: () => void; animations?: unknown[] }) => {
    geom.computeMorphNormals?.();
    const mat = T.FlexMaterial({
      map: 텍(`${개}/dog_tongue.jpg`),
      flexMap: 텍(`${개}/flex_tongue_256.png`),
      alphaMap: 텍(`${개}/tongue_alpha_256.jpg`),
      transparent: true,
      morphTargets: true,
      opacity: 1,
    });
    tongue = new T.Mesh(geom, mat);
    if (tongue.material && !Array.isArray(tongue.material) && tongue.material.opacity) {
      (tongue.material.opacity as { value: number }).value = 0;
    }
    tongue.scale.multiplyScalar(2);
    tongue.position.setY(-0.28);
    tongue.frustumCulled = false;
    tongue.visible = false;
    if (개상태) {
      개상태.mixer = new T.AnimationMixer(tongue);
      const clip = geom.animations?.[0];
      if (clip && 개상태.mixer) {
        개상태.action = 개상태.mixer.clipAction(clip);
        개상태.action.noLoop = true;
        개상태.action.play();
      }
    }
  });

  mgr.onLoad = () => {
    if (토큰 !== 장식세대) {
      로그("개 메시 버림 (필터가 바뀜)");
      return;
    }
    if (ear) root.add(ear);
    if (nose) root.add(nose);
    if (tongue) root.add(tongue);
    face.add(root);
    if (개상태) {
      개상태.ear = ear;
      개상태.tongue = tongue;
      개상태.loaded = true;
    }
  };
}

function 안경장면(face: ThreeObj) {
  const r = window.JeelizThreeGlassesCreator({
    envMapURL: `${안경}/envMap.jpg`,
    frameMeshURL: `${안경}/models3D/glassesFramesBranchesBent.json`,
    lensesMeshURL: `${안경}/models3D/glassesLenses.json`,
    occluderURL: `${안경}/models3D/face.json`,
  });
  const dy = 0.07;
  r.occluder.rotation.set(0.3, 0, 0);
  r.occluder.position.set(0, 0.03 + dy, -0.04);
  r.occluder.scale.multiplyScalar(0.0084);
  face.add(r.occluder);
  r.glasses.position.set(0, dy, 0.4);
  r.glasses.scale.multiplyScalar(0.006);
  face.add(r.glasses);
  if (장면) {
    const T = three();
    if (T.ACESFilmicToneMapping) 장면.renderer.toneMapping = T.ACESFilmicToneMapping;
    if (T.sRGBEncoding) 장면.renderer.outputEncoding = T.sRGBEncoding;
  }
}

function 호랑장면(face: ThreeObj, spec: JeelizSpec, 토큰: number) {
  const T = three();
  호랑이상태 = { mats: [], particles: [], shot: 0, dir: new T.Vector3() };

  function 마스크재질(url: string) {
    let vs = T.ShaderLib.lambert.vertexShader as string;
    vs = vs.replace(
      "void main() {",
      "varying vec3 vPos; uniform float mouthOpening; void main(){ vPos=position;",
    );
    vs = vs.replace(
      "#include <begin_vertex>",
      [
        "#include <begin_vertex>",
        "float isLowerJaw = step(position.y+position.z*0.2, 0.0);",
        "float theta = isLowerJaw * mouthOpening * 3.14/12.0;",
        "transformed.yz = mat2(cos(theta), sin(theta),-sin(theta), cos(theta))*transformed.yz;",
      ].join("\n"),
    );
    let fs = T.ShaderLib.lambert.fragmentShader as string;
    fs = fs.replace(
      "void main() {",
      "varying vec3 vPos; uniform sampler2D samplerVideo; uniform vec2 resolution; uniform mat2 videoTransformMat2; void main(){",
    );
    fs = fs.replace(
      "#include <dithering_fragment>",
      [
        "#include <dithering_fragment>",
        "float alphaMask = 1.0;",
        "vec2 pointToEyeL = vPos.xy - vec2(0.25,0.15);",
        "vec2 pointToEyeR = vPos.xy - vec2(-0.25,0.15);",
        "alphaMask *= smoothstep(0.05, 0.2, length(vec2(0.6,1.)*pointToEyeL));",
        "alphaMask *= smoothstep(0.05, 0.2, length(vec2(0.6,1.)*pointToEyeR));",
        "alphaMask = max(alphaMask, smoothstep(0.65, 0.75, vPos.z));",
        "float isDark = step(dot(texelColor.rgb, vec3(1.,1.,1.)), 1.0);",
        "alphaMask = mix(alphaMask, 1., isDark);",
        "vec2 uvVp = gl_FragCoord.xy/resolution;",
        "float scale = 0.03 / vPos.z;",
        "vec2 uvMove = vec2(-sign(vPos.x), -1.5) * scale;",
        "uvVp += uvMove;",
        "vec2 uvVideo = 0.5 + 2.0 * videoTransformMat2 * (uvVp - 0.5);",
        "vec4 videoColor = texture2D(samplerVideo, uvVideo);",
        "float videoColorGS = dot(vec3(0.299, 0.587, 0.114), videoColor.rgb);",
        "videoColor.rgb = videoColorGS * vec3(1.5,0.6,0.0);",
        "gl_FragColor = mix(videoColor, gl_FragColor, alphaMask);",
      ].join("\n"),
    );
    const mat = new T.ShaderMaterial({
      vertexShader: vs,
      fragmentShader: fs,
      uniforms: Object.assign(
        {
          samplerVideo: { value: window.JeelizThreeHelper.get_threeVideoTexture() },
          resolution: {
            value: new T.Vector2(spec.canvasElement.width, spec.canvasElement.height),
          },
          mouthOpening: { value: 0 },
          videoTransformMat2: { value: spec.videoTransformMat2 },
        },
        T.ShaderLib.lambert.uniforms,
      ),
      lights: true,
      transparent: true,
    });
    const map = 텍(url);
    mat.uniforms.map = { value: map };
    mat.map = map;
    호랑이상태?.mats.push(mat);
    return mat;
  }

  new T.BufferGeometryLoader().load(`${호랑이}/TigerHead.json`, (geom: unknown) => {
    const mesh = new T.Mesh(geom, [
      new T.MeshLambertMaterial({ color: 0xffffff }),
      마스크재질(`${호랑이}/white.png`),
      마스크재질(`${호랑이}/headTexture2.png`),
      new T.MeshBasicMaterial({ color: 0x331100 }),
    ]);
    mesh.scale.set(2, 3, 2);
    mesh.position.set(0, 0.2, -0.48);
    const mouth = new T.Mesh(
      new T.PlaneBufferGeometry(0.5, 0.6),
      new T.MeshBasicMaterial({ color: 0x000000 }),
    );
    mouth.position.set(0, -0.35, 0.5);
    if (호랑이상태) 호랑이상태.mouth = mouth;
    if (토큰 !== 장식세대) return;
    face.add(mesh, mouth);
  });

  const group = new T.Object3D();
  const spr = document.createElement("canvas");
  spr.width = 16;
  spr.height = 16;
  const ctx = spr.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    g.addColorStop(0, "rgba(255,255,255,0.5)");
    g.addColorStop(0.2, "rgba(0,255,255,0.5)");
    g.addColorStop(0.4, "rgba(0,0,64,0.5)");
    g.addColorStop(1, "rgba(0,0,0,0.5)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 16, 16);
  }
  const pmat = new T.SpriteMaterial({
    map: new T.CanvasTexture(spr),
    blending: T.AdditiveBlending,
  });
  for (let i = 0; i <= 200; i += 1) {
    const p = new T.Sprite(pmat);
    p.scale.multiplyScalar(0);
    p.visible = false;
    호랑이상태?.particles.push(p);
    group.add(p);
  }
  if (토큰 === 장식세대) face.add(group);
}

function 늑대장면(face: ThreeObj, 토큰: number) {
  const T = three();
  const loader = new T.JSONLoader();
  loader.load(`${늑대}/werewolf_not_animated.json`, (geom: unknown) => {
    const matHead = new T.MeshPhongMaterial({
      map: 텍(`${늑대}/head_diffuse.png`),
      normalMap: 텍(`${늑대}/head_normal.jpg`),
      alphaMap: 텍(`${늑대}/head_alpha.jpg`),
      side: T.FrontSide,
      shininess: 10,
      transparent: true,
      morphTargets: true,
    });
    const matFur = new T.MeshPhongMaterial({
      map: 텍(`${늑대}/fur_diffuse.jpg`),
      normalMap: 텍(`${늑대}/fur_normal.png`),
      alphaMap: 텍(`${늑대}/fur_alpha.jpg`),
      transparent: true,
      shininess: 20,
      opacity: 1,
      normalScale: new T.Vector2(2, 2),
      depthWrite: false,
    });
    const matTeeth = new T.MeshPhongMaterial({
      map: 텍(`${늑대}/teeth_diffuse.jpg`),
      transparent: true,
      emissive: 0x070505,
      emissiveIntensity: 0,
      shininess: 0,
      reflectivity: 0,
      morphTargets: true,
    });
    const mesh = new T.Mesh(geom, [matHead, matFur, matTeeth]);
    mesh.frustumCulled = false;
    mesh.renderOrder = 1000000;
    const root = new T.Object3D();
    root.add(mesh);
    root.scale.multiplyScalar(7);
    root.position.y -= 1.2;
    root.position.z -= 0.5;
    if (토큰 === 장식세대) face.add(root);
  });
}

function 조명(kind: FilterKind) {
  if (!조명묶음) return;
  const T = three();
  if (kind === "tiger") {
    조명묶음.add(new T.AmbientLight(0xffffff, 0.3));
    const dir = new T.DirectionalLight(0xff8833, 2);
    dir.position.set(0, 0.5, 1);
    조명묶음.add(dir);
    return;
  }
  조명묶음.add(new T.AmbientLight(0xffffff, kind === "werewolf" ? 1 : 0.8));
  const dir = new T.DirectionalLight(0xffffff, 0.5);
  dir.position.set(100, 1000, 1000);
  조명묶음.add(dir);
}

function 혀움직이기(reverse: boolean) {
  const s = 개상태;
  const mesh = s?.tongue;
  const action = s?.action;
  if (!s || !mesh || !action || !window.TWEEN) return;
  mesh.visible = true;
  if (reverse) {
    action.timeScale = -1;
    action.timescale = -1;
    action.paused = false;
    window.setTimeout(() => {
      action.paused = true;
      s.opaque = false;
      s.out = false;
      s.animating = false;
      s.done = true;
      const fade =
        mesh.material && !Array.isArray(mesh.material) ? mesh.material.opacity : null;
      if (fade) new window.TWEEN.Tween(fade).to({ value: 0 }, 150).start();
    }, 150);
  } else {
    action.timeScale = 1;
    action.timescale = 1;
    action.reset();
    action.paused = false;
    new window.TWEEN.Tween(
      (mesh.material && !Array.isArray(mesh.material)
        ? mesh.material.opacity
        : {}) as object,
    )
      .to({ value: 1 }, 100)
      .onComplete(() => {
        s.opaque = true;
        window.setTimeout(() => {
          action.paused = true;
          s.animating = false;
          s.out = true;
          s.done = true;
        }, 150);
      })
      .start();
  }
}

function 입자쏘기(p: ThreeObj, delay: number, dir: ThreeObj) {
  if (p.visible || !window.TWEEN) return;
  p.position.set(0.5 * (Math.random() - 0.5), -0.35 + 0.5 * (Math.random() - 0.5), 0.5);
  p.visible = true;
  new window.TWEEN.Tween(p.position)
    .to({ x: dir.x * 10, y: dir.y * 10, z: dir.z * 10 }, delay)
    .start()
    .onComplete(() => {
      p.visible = false;
    });
  p.scale.x = p.scale.y = Math.random() * 0.6;
  new window.TWEEN.Tween(p.scale).to({ x: 0.8, y: 0.8 }, delay).start();
}

function 매프레임(kind: FilterKind, detect: DetectState) {
  const T = three();
  if (kind === "dog" && 개상태?.loaded && window.JeelizThreeHelper.get_isDetected()) {
    const quat = new T.Quaternion();
    const eul = new T.Euler();
    eul.setFromQuaternion(quat);
    const ear = 개상태.ear;
    if (ear?.material && !Array.isArray(ear.material) && ear.material.set_amortized) {
      ear.material.set_amortized(
        ear.getWorldPosition(new T.Vector3()),
        ear.getWorldScale(new T.Vector3()),
        ear.getWorldQuaternion(eul),
        false,
        0.1,
      );
    }
    const tongue = 개상태.tongue;
    if (tongue?.material && !Array.isArray(tongue.material) && tongue.material.set_amortized) {
      tongue.material.set_amortized(
        tongue.getWorldPosition(new T.Vector3()),
        tongue.getWorldScale(new T.Vector3()),
        tongue.getWorldQuaternion(eul),
        false,
        0.3,
      );
    }
    if (detect.expressions[0] >= 0.85 && !개상태.over) {
      개상태.over = true;
      개상태.under = false;
      개상태.done = false;
    }
    if (detect.expressions[0] <= 0.1 && !개상태.under) {
      개상태.over = false;
      개상태.under = true;
      개상태.done = false;
    }
    if (개상태.over && !개상태.animating && !개상태.done) {
      개상태.animating = true;
      혀움직이기(개상태.out);
    }
    if (개상태.opaque && 개상태.mixer) 개상태.mixer.update(0.16);
  }

  if (kind === "tiger" && 호랑이상태 && window.JeelizThreeHelper.get_isDetected()) {
    let open = (detect.expressions[0] - 0.2) * 5;
    open = Math.min(Math.max(open, 0), 1);
    if (open > 0.5 && 장면 && 호랑이상태.dir) {
      const theta = Math.random() * 6.28;
      호랑이상태.dir.set(0.5 * Math.cos(theta), 0.5 * Math.sin(theta), 1);
      호랑이상태.dir.applyEuler(장면.faceObject.rotation);
      const p = 호랑이상태.particles[호랑이상태.shot];
      if (p) 입자쏘기(p, 2000 + 40 * Math.random(), 호랑이상태.dir);
      호랑이상태.shot = (호랑이상태.shot + 1) % 호랑이상태.particles.length;
    }
    호랑이상태.mats.forEach((m) => {
      if (m.uniforms?.mouthOpening) m.uniforms.mouthOpening.value = open;
    });
    if (호랑이상태.mouth) 호랑이상태.mouth.scale.setY(1 + open * 0.4);
  }

  window.TWEEN?.update();
}

function 장식갈기() {
  const T = three();
  장식세대 += 1;
  if (장면 && 장식) 장면.faceObject.remove(장식);
  if (장면 && 조명묶음) 장면.scene.remove(조명묶음);
  장식 = new T.Object3D();
  조명묶음 = new T.Object3D();
  장면?.faceObject.add(장식);
  장면?.scene.add(조명묶음);
  개상태 = null;
  호랑이상태 = null;
}

function 장면붙이기(kind: FilterKind, spec: JeelizSpec) {
  if (!장면) return;
  마지막스펙 = spec;
  장식갈기();
  조명(kind);
  if (!장식) return;
  const 토큰 = 장식세대;
  if (kind === "dog") 개장면(장식, 토큰);
  else if (kind === "glasses") 안경장면(장식);
  else if (kind === "tiger") 호랑장면(장식, spec, 토큰);
  else if (kind === "werewolf") 늑대장면(장식, 토큰);
}

function 소스바꾸기(canvas: HTMLCanvasElement, video: HTMLVideoElement) {
  칸맞추기(canvas, video);
  window.JEELIZFACEFILTER.update_videoElement(video, () => {
    window.JEELIZFACEFILTER.resize();
    if (카메라) window.JeelizThreeHelper.update_camera(카메라);
  });
}

async function 엔진켜기(
  kind: FilterKind,
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  my: number,
): Promise<void> {
  칸맞추기(canvas, video);
  로그("엔진켜기", {
    kind,
    canvas: `${canvas.width}x${canvas.height}`,
    video: `${video.videoWidth}x${video.videoHeight}`,
    readyState: video.readyState,
  });
  await 영상올때까지(video);
  if (my !== 세대) {
    로그("엔진켜기 세대 불일치 (영상 후)", my, 세대);
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const 시계 = window.setTimeout(() => {
      reject(new Error("Jeeliz init 이 15초 안에 끝나지 않았습니다."));
    }, 15000);
    const 끝 = (fn: () => void) => {
      window.clearTimeout(시계);
      fn();
    };
    로그("JEELIZFACEFILTER.init 호출");
    window.JEELIZFACEFILTER.init({
      canvas,
      NNC: 신경망,
      followZRot: true,
      videoSettings: { videoElement: video },
      callbackReady(err: false | string, spec: JeelizSpec) {
        로그("callbackReady", err || "ok", spec ? Object.keys(spec) : []);
        if (err) {
          끝(() => reject(new Error(String(err))));
          return;
        }
        if (my !== 세대) {
          로그("callbackReady 세대 불일치", my, 세대);
          끝(() => resolve());
          return;
        }
        try {
          장면 = window.JeelizThreeHelper.init(spec);
          카메라 = window.JeelizThreeHelper.create_camera();
          마지막스펙 = spec;
          장면붙이기(kind, spec);
          지금 = kind;
          켜짐 = true;
          로그("장면 준비됨", kind);
          끝(() => resolve());
        } catch (e) {
          로그("장면 실패", e);
          끝(() => reject(e));
        }
      },
      callbackTrack(detect: DetectState) {
        if (!켜짐 || my !== 세대 || !카메라) return;
        if (지금 !== "none") 매프레임(지금, detect);
        window.JeelizThreeHelper.render(detect, 카메라);
      },
    });
  });
}

async function 준비본(
  kind: FilterKind,
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
): Promise<void> {
  로그("준비본 시작", { kind, 켜짐, 지금 });
  if (kind === "none") {
    로그("3D만 가림 (카메라는 유지)");
    지금 = "none";
    if (장면) 장식갈기();
    try {
      await window.JEELIZFACEFILTER?.toggle_pause?.(true, false);
    } catch {
      /* 아직 안 켜진 경우 */
    }
    return;
  }
  await 라이브러리();
  로그("라이브러리 끝", {
    THREE: !!window.THREE,
    FF: !!window.JEELIZFACEFILTER,
    Helper: !!window.JeelizThreeHelper,
  });
  if (켜짐 && 지금 === kind) {
    로그("같은 필터, 소스만 교체");
    소스바꾸기(canvas, video);
    return;
  }
  if (켜짐 && 마지막스펙) {
    로그("필터만 교체", 지금, "→", kind);
    try {
      await window.JEELIZFACEFILTER.toggle_pause(false, false);
    } catch {
      /* 이미 재생 중 */
    }
    지금 = kind;
    장면붙이기(kind, 마지막스펙);
    return;
  }
  const my = ++세대;
  await 엔진끄기();
  if (my !== 세대) {
    로그("준비본 세대 불일치 (끄기 후)", my, 세대);
    return;
  }
  await 엔진켜기(kind, canvas, video, my);
  로그("준비본 끝", { kind, 켜짐 });
}

export function 필터준비(
  kind: FilterKind,
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
): Promise<void> {
  const 다음 = 줄.then(() => 준비본(kind, canvas, video));
  줄 = 다음.then(
    () => undefined,
    () => undefined,
  );
  return 다음;
}

export function 필터끄기(): Promise<void> {
  세대 += 1;
  const 다음 = 줄.then(() => 엔진끄기());
  줄 = 다음.then(
    () => undefined,
    () => undefined,
  );
  return 다음;
}

export function 필터캡처(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/jpeg", 0.85);
}
