import { useEffect, useRef, useState, type ReactNode } from "react";
import { ResultGallery } from "../gallery/Grid";
import {
  hasCaptionerCache,
  isCaptionerReady,
  loadCaptioner,
  resetCaptioner,
  type DownloadProgress,
} from "../lib/captioner";
import { 손뼈대그리기, 손찾기, 손준비 } from "../lib/fist";
import {
  FILTERS,
  사진영상,
  필터끄기,
  필터준비,
  필터캡처,
  type FilterKind,
} from "../lib/filters";

type Kind = "" | "ok" | "slow" | "err";
type MakeKind = "image" | "video" | "music";
type ModelOption = { id: string; label: string };
type ModelLists = {
  image: ModelOption[];
  video: ModelOption[];
  music: ModelOption[];
};

const EMPTY_MODELS: ModelLists = { image: [], video: [], music: [] };

const 만들기목적: Record<MakeKind, string> = {
  image: "이미지를",
  video: "영상을",
  music: "음악을",
};
const 만들기결과: Record<MakeKind, string> = {
  image: "이미지가",
  video: "영상이",
  music: "음악이",
};
const 만들기힌트: Record<MakeKind, string> = {
  image: "보통 1분 안입니다.",
  video: "2–4분 걸릴 수 있습니다.",
  music: "1–2분 걸릴 수 있습니다.",
};
const 만들기초: Record<MakeKind, number> = {
  image: 90,
  video: 240,
  music: 150,
};

function NoticeSlot({
  kind,
  text,
  progress,
  className = "notice",
}: {
  kind: Kind | "idle";
  text: string;
  progress?: number | null;
  className?: string;
}) {
  const tone = kind === "" ? "idle" : kind;
  const 막대 = progress === null;
  return (
    <div className={`${className} ${tone}`} role="status">
      <p>{text || "\u00a0"}</p>
      <div className={`bar${막대 ? " pulse" : ""}`} aria-hidden="true">
        <i style={{ width: 막대 ? "36%" : `${Math.max(0, Math.min(100, progress ?? 0))}%` }} />
      </div>
    </div>
  );
}

function 로그값(값: unknown): unknown {
  try {
    return JSON.parse(
      JSON.stringify(값, (_k, v) => {
        if (typeof v === "bigint") return String(v);
        if (ArrayBuffer.isView(v)) return `[${v.constructor.name} ${v.byteLength}b]`;
        return v;
      }),
    );
  } catch {
    return String(값);
  }
}

function 문장뽑기(결과: unknown): string {
  if (!결과) return "";
  if (typeof 결과 === "string") return 결과.trim();
  if (Array.isArray(결과)) return 문장뽑기(결과[0]);
  if (typeof 결과 === "object") {
    const o = 결과 as { generated_text?: unknown };
    if (typeof o.generated_text === "string") return o.generated_text.trim();
    if (Array.isArray(o.generated_text)) {
      return 문장뽑기(o.generated_text.at(-1));
    }
    console.warn("[OpenCircuit] 문장뽑기: generated_text 없음", Object.keys(o));
  }
  return String(결과).trim();
}

function 카메라오류말(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "카메라 권한이 꺼져 있습니다. 주소창 왼쪽 자물쇠에서 허용하거나, 사진을 넣거나, 문장을 직접 쓰세요.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "연결된 카메라를 찾지 못했습니다. 사진을 넣거나 문장을 직접 쓰세요.";
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return "카메라가 다른 프로그램에서 사용 중입니다. Zoom·다른 브라우저를 닫거나, 사진을 넣으세요.";
  }
  if (!window.isSecureContext) {
    return "이 주소에서는 카메라가 막힙니다. 브라우저에서 http://127.0.0.1:1234 로 여세요. 아니면 사진을 넣으세요.";
  }
  return "카메라에 연결하지 못했습니다. 사진을 넣거나 문장을 직접 쓰세요.";
}

function 저장모델(kind: MakeKind, id: string) {
  try {
    localStorage.setItem(`oc.model.${kind}`, id);
  } catch {
    /* ignore */
  }
}

function 읽은모델(kind: MakeKind, list: ModelOption[]): string {
  const fallback = list[0]?.id ?? "";
  try {
    const saved = localStorage.getItem(`oc.model.${kind}`) ?? "";
    if (saved && list.some((m) => m.id === saved)) return saved;
  } catch {
    /* ignore */
  }
  return fallback;
}

export function CameraPage() {
  const 캠 = useRef<HTMLVideoElement>(null);
  const 사진엘 = useRef<HTMLImageElement>(null);
  const 필터캔 = useRef<HTMLCanvasElement>(null);
  const 손캔 = useRef<HTMLCanvasElement>(null);
  const 파일칸 = useRef<HTMLInputElement>(null);
  const 스트림 = useRef<MediaStream | null>(null);
  const 파이프 = useRef<null | ((img: string, opts: object) => Promise<unknown>)>(
    null,
  );
  const [상태, set상태] = useState("");
  const [kind, setKind] = useState<Kind>("");
  const [문장, set문장] = useState("");
  const [찍는중, set찍는중] = useState(false);
  const [캠켜짐, set캠켜짐] = useState(false);
  const [캠시도중, set캠시도중] = useState(false);
  const [올린사진, set올린사진] = useState("");
  const [필터, set필터] = useState<FilterKind>("none");
  const [필터여는중, set필터여는중] = useState(false);
  const [손안내, set손안내] = useState("");
  const 찍는잠금 = useRef(false);
  const 찍기참조 = useRef<() => Promise<void>>(async () => {});
  const [모델진행, set모델진행] = useState<DownloadProgress | null>(null);
  const [모델실패, set모델실패] = useState("");
  const [캐시있음, set캐시있음] = useState(false);
  const 장면있음 = 캠켜짐 || !!올린사진;

  function 알림(텍스트: string, next: Kind = "") {
    if (next === "ok") {
      set상태("");
      setKind("");
      return;
    }
    set상태(텍스트);
    setKind(next);
  }

  function 스트림끄기() {
    스트림.current?.getTracks().forEach((t) => t.stop());
    스트림.current = null;
    const video = 캠.current;
    if (video) video.srcObject = null;
    set캠켜짐(false);
  }

  async function 카메라켜기() {
    if (!navigator.mediaDevices?.getUserMedia) {
      알림(
        "이 브라우저는 카메라를 지원하지 않습니다. Chrome 또는 Edge 로 http://127.0.0.1:1234 를 여세요.",
        "err",
      );
      return;
    }
    set캠시도중(true);
    스트림끄기();
    const 시도: MediaStreamConstraints[] = [
      {
        video: { facingMode: { ideal: "environment" }, aspectRatio: { ideal: 4 / 3 } },
        audio: false,
      },
      { video: { facingMode: "user", aspectRatio: { ideal: 4 / 3 } }, audio: false },
      { video: true, audio: false },
    ];
    let last: unknown;
    for (const 설정 of 시도) {
      try {
        const s = await navigator.mediaDevices.getUserMedia(설정);
        스트림.current = s;
        const video = 캠.current;
        if (video) {
          video.srcObject = s;
          video.muted = true;
          video.playsInline = true;
          await video.play().catch(() => {});
        }
        set올린사진("");
        set캠켜짐(true);
        set캠시도중(false);
        알림("", "ok");
        return;
      } catch (err) {
        last = err;
      }
    }
    set캠시도중(false);
    알림(카메라오류말(last), "err");
  }

  useEffect(() => {
    void 카메라켜기();
    return () => {
      void 필터끄기();
      스트림끄기();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (필터 === "none") {
      const canvas = 필터캔.current;
      const video = 캠.current;
      if (canvas && video) void 필터준비("none", canvas, video);
      const 살아있음 = 스트림.current
        ?.getVideoTracks()
        .some((t) => t.readyState === "live");
      if (캠켜짐 && !살아있음 && !올린사진) void 카메라켜기();
      return;
    }
    let alive = true;
    set필터여는중(true);
    void (async () => {
      try {
        const canvas = 필터캔.current;
        const video = 캠.current;
        const img = 사진엘.current;
        console.info("[OpenCircuit] 필터 효과", {
          필터,
          캠켜짐,
          videoW: video?.videoWidth ?? 0,
          imgW: img?.naturalWidth ?? 0,
          canvas: !!canvas,
        });
        let src: HTMLVideoElement | null = null;
        if (캠켜짐 && video) {
          if (!video.videoWidth) {
            await new Promise<void>((resolve) => {
              const 끝 = () => resolve();
              video.addEventListener("loadeddata", 끝, { once: true });
              window.setTimeout(끝, 2500);
            });
          }
          if (video.videoWidth) src = video;
        } else if (img && img.naturalWidth) src = await 사진영상(img);
        if (!alive) {
          console.info("[OpenCircuit] 필터 효과 중단 (이전 실행)");
          return;
        }
        if (!canvas || !src) {
          console.warn("[OpenCircuit] 필터 소스 없음", { canvas: !!canvas, src: !!src });
          set필터여는중(false);
          return;
        }
        await 필터준비(필터, canvas, src);
        console.info("[OpenCircuit] 필터 준비 끝", 필터);
        if (alive) set필터여는중(false);
      } catch (err) {
        console.error("[OpenCircuit] 필터 실패", err);
        if (!alive) return;
        set필터여는중(false);
        set필터("none");
        알림("얼굴 필터를 열지 못했습니다. 카메라를 켠 뒤 다시 고르세요.", "err");
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [필터, 캠켜짐, 올린사진]);

  useEffect(() => {
    if (!캠켜짐) {
      set손안내("");
      return;
    }
    let alive = true;
    let raf = 0;
    let 연속 = 0;
    let 열었음 = true;
    let 식힘 = 0;
    let 안내 = "";
    const 안내바꾸기 = (t: string) => {
      if (t === 안내) return;
      안내 = t;
      set손안내(t);
    };
    안내바꾸기("손 모델을 열고 있습니다.");
    void 손준비()
      .then(() => {
        if (!alive) return;
        안내바꾸기("손을 카메라에 보여 주세요.");
        const tick = () => {
          if (!alive) return;
          const video = 캠.current;
          const overlay = 손캔.current;
          if (video?.videoWidth && overlay) {
            const 결과 = 손찾기(video);
            손뼈대그리기(overlay, video, 결과);
            if (결과.hands.length) {
              안내바꾸기(
                결과.fist
                  ? "주먹입니다. 촬영합니다."
                  : "손을 찾았습니다. 주먹을 쥐면 찍힙니다.",
              );
              if (결과.fist) {
                연속 += 1;
                if (열었음 && 연속 >= 4 && performance.now() > 식힘) {
                  열었음 = false;
                  식힘 = performance.now() + 2500;
                  console.info("[OpenCircuit] 주먹 → 촬영");
                  void 찍기참조.current();
                }
              } else {
                연속 = 0;
                열었음 = true;
              }
            } else {
              연속 = 0;
              열었음 = true;
              안내바꾸기("손을 카메라에 보여 주세요.");
            }
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      })
      .catch((err) => {
        console.error("[OpenCircuit] 손 모델 실패", err);
        if (alive) 안내바꾸기("손 모델을 열지 못했습니다. 버튼으로 찍으세요.");
      });
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [캠켜짐]);

  async function 모델받기(다시 = false): Promise<boolean> {
    if (파이프.current && !다시) return true;
    if (다시) {
      resetCaptioner();
      파이프.current = null;
    }
    set모델실패("");
    set모델진행({ file: "준비", pct: 0, loaded: 0, total: 0 });
    try {
      const pipe = await loadCaptioner((p) => set모델진행(p));
      파이프.current = pipe;
      set모델진행(null);
      set캐시있음(true);
      알림("", "ok");
      return true;
    } catch (err) {
      파이프.current = null;
      set모델진행(null);
      const why = err instanceof Error ? err.message.slice(0, 180) : "";
      set모델실패(
        `모델을 끝까지 받지 못했습니다${why ? ` (${why})` : ""}. 「모델 다시 받기」를 누르거나 문장을 직접 쓰세요.`,
      );
      return false;
    }
  }

  useEffect(() => {
    void (async () => {
      if (isCaptionerReady()) {
        파이프.current = await loadCaptioner(() => {});
        set캐시있음(true);
        return;
      }
      const hit = await hasCaptionerCache();
      set캐시있음(hit);
      if (hit) await 모델받기();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function 사진고르기() {
    파일칸.current?.click();
  }

  function 사진읽기(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      알림("이미지 파일만 넣을 수 있습니다.", "err");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      알림("파일이 너무 큽니다. 12MB 보다 작은 사진을 넣으세요.", "err");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result ?? "");
      if (!url) {
        알림("사진을 읽지 못했습니다. 다른 파일을 넣어 보세요.", "err");
        return;
      }
      스트림끄기();
      set올린사진(url);
      알림("", "ok");
    };
    reader.onerror = () => {
      알림("사진을 읽지 못했습니다. 다른 파일을 넣어 보세요.", "err");
    };
    reader.readAsDataURL(file);
  }

  async function 찍기() {
    if (찍는잠금.current) return;
    찍는잠금.current = true;
    if (!파이프.current) {
      const ok = await 모델받기();
      if (!ok || !파이프.current) {
        찍는잠금.current = false;
        return;
      }
    }
    let 사진 = "";
    const 필터화면 = 필터캔.current;
    if (필터 !== "none" && 필터화면 && 필터화면.width) {
      사진 = 필터캡처(필터화면);
    } else if (올린사진) {
      사진 = 올린사진;
    } else {
      const video = 캠.current;
      if (!video || !video.videoWidth) {
        찍는잠금.current = false;
        알림("장면이 없습니다. 카메라를 켜거나 사진을 넣으세요.", "err");
        return;
      }
      const 캔버스 = document.createElement("canvas");
      캔버스.width = video.videoWidth;
      캔버스.height = video.videoHeight;
      캔버스.getContext("2d")?.drawImage(video, 0, 0);
      사진 = 캔버스.toDataURL("image/jpeg", 0.85);
    }
    set찍는중(true);
    try {
      const 결과 = await 파이프.current(사진, {
        text: "Describe this scene in one short sentence.",
        max_new_tokens: 40,
      });
      console.info("[OpenCircuit] 모델 결과", 로그값(결과));
      const 나온 = 문장뽑기(결과);
      if (!나온) throw new Error("empty");
      set문장(나온);
      알림("", "ok");
    } catch (err) {
      console.error("[OpenCircuit] 찍기 실패", err);
      알림("문장을 만들지 못했습니다. 문장 칸에 직접 쓰세요.", "err");
    } finally {
      찍는잠금.current = false;
      set찍는중(false);
    }
  }
  찍기참조.current = 찍기;

  let 장면안내: { kind: Kind | "idle"; text: string; progress: number | null } = {
    kind: "idle",
    text: "",
    progress: 0,
  };
  if (모델진행) {
    const 파일 =
      모델진행.file && 모델진행.file !== "준비" ? ` · ${모델진행.file}` : "";
    장면안내 = {
      kind: 캐시있음 ? "ok" : "slow",
      text: 캐시있음
        ? `이미 받아 둔 문장 모델을 열고 있습니다. ${모델진행.pct}%${파일}`
        : `문장용 모델을 처음 받는 중입니다. 약 500MB · ${모델진행.pct}%${파일}`,
      progress: 모델진행.pct,
    };
  } else if (모델실패) {
    장면안내 = { kind: "err", text: 모델실패, progress: 0 };
  } else if (kind === "err" && 상태) {
    장면안내 = { kind: "err", text: 상태, progress: 0 };
  } else if (필터여는중) {
                장면안내 = {
      kind: "slow",
      text: "얼굴 필터를 열고 있습니다.",
      progress: null,
    };
  } else if (찍는중) {
    장면안내 = {
      kind: "slow",
      text: "장면을 읽고 문장으로 바꾸는 중입니다.",
      progress: null,
    };
  } else if (손안내) {
    장면안내 = {
      kind: 손안내.includes("찾았습니다") || 손안내.includes("주먹") ? "ok" : "idle",
      text: 손안내,
      progress: 0,
    };
  }

  return (
    <main className="studio">
      <NoticeSlot
        kind={장면안내.kind}
        text={장면안내.text || "장면 · 문장 모델 안내가 여기 나옵니다."}
        progress={장면안내.progress}
      />
      <MakeBar
        prompt={문장}
        onNotice={알림}
        scene={
          <section className="panel scene-panel">
            <h2>장면</h2>
            <div className="filter-tabs" role="tablist" aria-label="얼굴 필터">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={필터 === f.id}
                  className={필터 === f.id ? "tab on" : "tab"}
                  onClick={() => set필터(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <p className="filter-credit">
              주먹을 쥐면 장면이 문장이 됩니다. 손: MediaPipe · 얼굴: Jeeliz FaceFilter
            </p>
            <input
              ref={파일칸}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                사진읽기(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <div
              className={`stage${장면있음 ? " on" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
              }}
              onDrop={(e) => {
                e.preventDefault();
                사진읽기(e.dataTransfer.files?.[0]);
              }}
            >
              <video
                ref={캠}
                className={`preview${캠켜짐 && 필터 === "none" ? "" : " off"}`}
                autoPlay
                playsInline
                muted
              />
              {올린사진 ? (
                <img
                  ref={사진엘}
                  className={`preview still${필터 !== "none" ? " off" : ""}`}
                  src={올린사진}
                  alt="올린 사진"
                />
              ) : null}
              <canvas
                ref={필터캔}
                className={`preview filter-out${필터 === "none" ? " off" : ""}`}
              />
              <canvas
                ref={손캔}
                className={`preview hand-out${캠켜짐 ? "" : " off"}`}
              />
              {!장면있음 ? (
                <div className="stage-empty">
                  <p>카메라가 없거나 꺼져 있으면 사진을 넣으세요.</p>
                  <div className="stage-empty-btns">
                    <button
                      type="button"
                      className="btn ghost"
                      disabled={캠시도중}
                      onClick={() => void 카메라켜기()}
                    >
                      {캠시도중 ? "연결 중…" : "카메라 켜기"}
                    </button>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={사진고르기}
                    >
                      사진 넣기
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="scene-actions">
              <button
                type="button"
                className="btn scene-caption"
                disabled={!장면있음 || 찍는중 || !!모델진행}
                onClick={() => void 찍기()}
              >
                {모델진행
                  ? 캐시있음
                    ? `모델 여는 중 ${모델진행.pct}%`
                    : `모델 받는 중 ${모델진행.pct}%`
                  : 찍는중
                    ? "읽는 중…"
                    : "이 장면을 문장으로"}
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={사진고르기}
              >
                {올린사진 ? "다른 사진" : "사진 넣기"}
              </button>
              {!캠켜짐 ? (
                <button
                  type="button"
                  className="btn ghost"
                  disabled={캠시도중}
                  onClick={() => void 카메라켜기()}
                >
                  {캠시도중 ? "연결 중…" : "웹캠으로"}
                </button>
              ) : null}
              {모델실패 ? (
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => void 모델받기(true)}
                >
                  모델 다시 받기
                </button>
              ) : null}
            </div>
          </section>
        }
        sentence={
          <section className="panel sentence-panel">
            <h2>문장</h2>
            <textarea
              id="문장"
              rows={2}
              value={문장}
              onChange={(e) => set문장(e.target.value)}
              placeholder="장면을 문장으로 바꾸거나, 여기에 직접 쓰세요."
            />
          </section>
        }
      />
    </main>
  );
}

function MakeBar({
  prompt,
  onNotice,
  scene,
  sentence,
}: {
  prompt: string;
  onNotice: (text: string, kind?: Kind) => void;
  scene: ReactNode;
  sentence: ReactNode;
}) {
  const [work, setWork] = useState("실습");
  const [busy, setBusy] = useState(false);
  const [keyHint, setKeyHint] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [keyMsg, setKeyMsg] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [키고침, set키고침] = useState(false);
  const [models, setModels] = useState<ModelLists>(EMPTY_MODELS);
  const [imageModel, setImageModel] = useState("flux-1.1-pro");
  const [videoModel, setVideoModel] = useState("flux-3");
  const [musicModel, setMusicModel] = useState("mureka");
  const [makeKind, setMakeKind] = useState<MakeKind>("image");
  const [galleryTick, setGalleryTick] = useState(0);
  const [경과, set경과] = useState(0);
  const [makeNote, setMakeNote] = useState<{ kind: Kind | "idle"; text: string }>({
    kind: "idle",
    text: "",
  });

  useEffect(() => {
    fetch("/api/studio")
      .then(
        (r) =>
          r.json() as Promise<{
            hasKey: boolean;
            keyHint?: string;
            models?: ModelLists;
          }>,
      )
      .then((s) => {
        setHasKey(!!s.hasKey);
        setKeyHint(s.keyHint ?? "");
        if (s.models) {
          setModels(s.models);
          setImageModel(읽은모델("image", s.models.image));
          setVideoModel(읽은모델("video", s.models.video));
          setMusicModel(읽은모델("music", s.models.music));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!busy) {
      set경과(0);
      return;
    }
    const 시작 = Date.now();
    const id = window.setInterval(() => {
      set경과(Math.floor((Date.now() - 시작) / 1000));
    }, 500);
    return () => window.clearInterval(id);
  }, [busy]);

  const 고른모델 =
    makeKind === "image" ? imageModel : makeKind === "video" ? videoModel : musicModel;
  const 모델목록 = models[makeKind].length
    ? models[makeKind]
    : [{ id: 고른모델, label: 고른모델 }];

  function 모델바꾸기(id: string) {
    if (makeKind === "image") setImageModel(id);
    else if (makeKind === "video") setVideoModel(id);
    else setMusicModel(id);
    저장모델(makeKind, id);
  }

  async function 키저장() {
    const key = keyInput.trim();
    if (!key) {
      setKeyMsg("키를 붙여 넣은 뒤 저장을 누르세요.");
      return;
    }
    try {
      const res = await fetch("/api/key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        keyHint?: string;
      };
      if (!data.ok) {
        setHasKey(false);
        setKeyMsg(data.message ?? "키를 저장하지 못했습니다.");
        return;
      }
      setHasKey(true);
      setKeyHint(data.keyHint ?? "");
      setKeyInput("");
      set키고침(false);
      setKeyMsg("");
    } catch {
      setKeyMsg("서버에 연결하지 못했습니다. start.sh 가 켜져 있는지 확인하세요.");
    }
  }

  async function 만들기() {
    const text = prompt.trim();
    if (!text) {
      setMakeNote({
        kind: "err",
        text: "문장이 없습니다. 장면을 문장으로 바꾸거나 직접 쓰세요.",
      });
      return;
    }
    setMakeNote({ kind: "idle", text: "" });
    setBusy(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: makeKind,
          prompt: text,
          work: work.trim() || "실습",
          model: 고른모델,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        saved?: string[];
      };
      if (data.ok) {
        setGalleryTick((n) => n + 1);
        setMakeNote({
          kind: "ok",
          text: `${만들기결과[makeKind]} 아래에 생겼습니다.`,
        });
        onNotice("", "ok");
      } else {
        setMakeNote({
          kind: "err",
          text: data.message ?? "만들지 못했습니다.",
        });
      }
    } catch {
      setMakeNote({
        kind: "err",
        text: "서버에 연결하지 못했습니다. start.sh 가 켜져 있는지 확인하세요.",
      });
    } finally {
      setBusy(false);
    }
  }

  const 키입력칸 = !hasKey || 키고침;

  return (
    <>
      <div className="input-row">
        {scene}
        <div className="write-col">
          {sentence}
          {키입력칸 ? (
        <div className="key-strip">
          <strong>API 키</strong>
          <input
            id="apikey"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="afk_ 로 시작하는 키"
            onKeyDown={(e) => {
              if (e.key === "Enter") void 키저장();
            }}
          />
          <button type="button" className="btn" onClick={() => void 키저장()}>
            이 컴퓨터에 저장
          </button>
          {키고침 ? (
            <button
              type="button"
              className="btn text"
              onClick={() => {
                set키고침(false);
                setKeyInput("");
                setKeyMsg("");
              }}
            >
              취소
            </button>
          ) : null}
          {keyMsg ? <span className="key-err">{keyMsg}</span> : null}
        </div>
      ) : (
        <p className="key-mini">
          키 저장됨{keyHint ? ` · ${keyHint}` : ""}
          <button type="button" className="btn text" onClick={() => set키고침(true)}>
            바꾸기
          </button>
        </p>
      )}
      <section className="panel make-bar">
        <h2>만들기</h2>
        <div className="make-line">
          <input
            id="작업이름"
            type="text"
            value={work}
            onChange={(e) => setWork(e.target.value)}
            placeholder="작업 이름"
            aria-label="작업 이름"
          />
          <div className="tabs" role="tablist">
            {(
              [
                ["image", "이미지"],
                ["video", "영상"],
                ["music", "음악"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={makeKind === id}
                className={makeKind === id ? "tab on" : "tab"}
                onClick={() => setMakeKind(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <select
            id="모델"
            value={고른모델}
            aria-label="모델"
            onChange={(e) => 모델바꾸기(e.target.value)}
          >
            {모델목록.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <button type="button" className="btn" disabled={busy} onClick={() => void 만들기()}>
            {busy ? "만드는 중…" : "만들기"}
          </button>
        </div>
        <NoticeSlot
          className="notice make-note"
          kind={
            busy
              ? "slow"
              : makeNote.kind
          }
          text={
            busy
              ? `${만들기목적[makeKind]} 만들고 있습니다. ${만들기힌트[makeKind]} · ${경과}초`
              : makeNote.text || "만들기를 누르면 진행이 여기 나옵니다."
          }
          progress={
            busy
              ? Math.min(95, Math.round((경과 / 만들기초[makeKind]) * 100))
              : makeNote.kind === "ok"
                ? 100
                : 0
          }
        />
      </section>
        </div>
      </div>
      <section className="panel results">
        <h2>결과</h2>
        <ResultGallery work={work} tick={galleryTick} />
      </section>
    </>
  );
}
