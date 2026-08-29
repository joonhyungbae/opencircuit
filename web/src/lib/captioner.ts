const 모델이름 = "HuggingFaceTB/SmolVLM-256M-Instruct";
const 기본질문 = "Describe this scene in one short sentence.";

export type CaptionPipe = (img: string, opts: object) => Promise<unknown>;

export interface DownloadProgress {
  file: string;
  pct: number;
  loaded: number;
  total: number;
}

type Tensorish = {
  dims?: number[];
  slice?: (dim: unknown, range: unknown) => unknown;
};

type Processor = {
  apply_chat_template: (messages: unknown, opts?: object) => string;
  batch_decode: (ids: unknown, opts?: object) => string[];
  (text: string, images: unknown, opts?: object): Promise<{
    input_ids: Tensorish;
    [key: string]: unknown;
  }>;
};

type LoadedPipe = {
  processor: Processor;
  model: { generate: (opts: object) => Promise<Tensorish> };
};

type TfMod = {
  pipeline: (task: string, model: string, opts?: object) => Promise<LoadedPipe>;
  RawImage: { fromBlob: (blob: Blob) => Promise<unknown> };
  ModelRegistry: {
    is_pipeline_cached: (task: string, model: string) => Promise<boolean>;
  };
  env: {
    allowLocalModels: boolean;
    allowRemoteModels: boolean;
    useBrowserCache: boolean;
  };
};

let cached: CaptionPipe | null = null;
let inflight: Promise<CaptionPipe> | null = null;

function 웹지피유(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

async function loadTf(): Promise<TfMod> {
  const href = "/vendor/transformers.min.js";
  console.info("[OpenCircuit] transformers 불러오기", href);
  const mod = (await import(/* @vite-ignore */ href)) as TfMod;
  if (!mod?.pipeline || !mod.RawImage) {
    console.error("[OpenCircuit] transformers 모듈 불완전", Object.keys(mod ?? {}));
    throw new Error("no pipeline");
  }
  return mod;
}

function progressOf(info: {
  status?: string;
  file?: string;
  name?: string;
  progress?: number;
  loaded?: number;
  total?: number;
}): DownloadProgress | null {
  const file = String(info.file ?? info.name ?? "model");
  if (typeof info.progress === "number" && Number.isFinite(info.progress)) {
    return {
      file,
      pct: Math.max(0, Math.min(100, Math.round(info.progress))),
      loaded: info.loaded ?? 0,
      total: info.total ?? 0,
    };
  }
  if (info.total && info.total > 0 && typeof info.loaded === "number") {
    return {
      file,
      pct: Math.max(0, Math.min(100, Math.round((info.loaded / info.total) * 100))),
      loaded: info.loaded,
      total: info.total,
    };
  }
  return null;
}

function 질문(opts: object): string {
  const text = (opts as { text?: unknown }).text;
  return typeof text === "string" && text.trim() ? text.trim() : 기본질문;
}

function 토큰수(opts: object): number {
  const n = (opts as { max_new_tokens?: unknown }).max_new_tokens;
  return typeof n === "number" && n > 0 ? n : 40;
}

function 답만(전체: string): string {
  const t = 전체.replace(/\r/g, "").trim();
  const 표시 = ["Assistant:", "assistant:", "Assistant\n", "assistant\n"];
  for (const m of 표시) {
    const i = t.lastIndexOf(m);
    if (i >= 0) return t.slice(i + m.length).trim();
  }
  return t;
}

function 캡션파이프(tf: TfMod, raw: LoadedPipe): CaptionPipe {
  return async (img, opts) => {
    const blob = await (await fetch(img)).blob();
    const image = await tf.RawImage.fromBlob(blob);
    const messages = [
      {
        role: "user",
        content: [{ type: "image" }, { type: "text", text: 질문(opts) }],
      },
    ];
    let text = raw.processor.apply_chat_template(messages, {
      add_generation_prompt: true,
    });
    if (!text.includes("<image>")) {
      text = `User:<image>${질문(opts)}\nAssistant:`;
    }
    console.info("[OpenCircuit] 캡션 프롬프트", text);
    const inputs = await raw.processor(text, [image], {
      do_image_splitting: false,
    });
    const generated = await raw.model.generate({
      ...inputs,
      max_new_tokens: 토큰수(opts),
    });
    let ids: unknown = generated;
    const start = inputs.input_ids?.dims?.at(-1);
    if (typeof start === "number" && typeof generated.slice === "function") {
      try {
        ids = generated.slice(null, [start, null]);
      } catch (err) {
        console.warn("[OpenCircuit] 생성 토큰 자르기 실패, 전체를 디코드합니다", err);
      }
    }
    const decoded = raw.processor.batch_decode(ids, { skip_special_tokens: true });
    const 문장 = 답만(decoded[0] ?? "");
    console.info("[OpenCircuit] 캡션 디코드", decoded, "→", 문장);
    return [{ generated_text: 문장 }];
  };
}

async function createPipe(
  tf: TfMod,
  device: "webgpu" | "wasm",
  onProgress: (p: DownloadProgress) => void,
): Promise<CaptionPipe> {
  tf.env.allowLocalModels = false;
  tf.env.useBrowserCache = true;
  tf.env.allowRemoteModels = true;
  const onProg = (info: {
    status?: string;
    file?: string;
    name?: string;
    progress?: number;
    loaded?: number;
    total?: number;
  }) => {
    const p = progressOf(info);
    if (p) onProgress(p);
  };
  console.info("[OpenCircuit] 모델 로드", { device, model: 모델이름 });
  const raw = await tf.pipeline("image-to-text", 모델이름, {
    device,
    progress_callback: onProg,
  });
  if (!raw?.processor || !raw.model) {
    throw new Error("pipeline missing processor");
  }
  console.info("[OpenCircuit] 모델 준비 (Idefics3 프로세서로 캡션)");
  return 캡션파이프(tf, raw);
}

export function hasWebGpu(): boolean {
  return 웹지피유();
}

export function isCaptionerReady(): boolean {
  return cached !== null;
}

/** 브라우저에 이미 받아 둔 파일이 있는지. 네트워크로 다시 받지 않아도 됩니다. */
export async function hasCaptionerCache(): Promise<boolean> {
  try {
    const tf = await loadTf();
    tf.env.useBrowserCache = true;
    if (!tf.ModelRegistry?.is_pipeline_cached) return false;
    const hit = await tf.ModelRegistry.is_pipeline_cached("image-to-text", 모델이름);
    console.info("[OpenCircuit] 모델 캐시", hit ? "있음" : "없음");
    return hit;
  } catch (err) {
    console.warn("[OpenCircuit] 캐시 확인 실패", err);
    return false;
  }
}

/** 한 번만 받습니다. 페이지를 다시 열어도 브라우저 캐시를 씁니다. */
export function loadCaptioner(
  onProgress: (p: DownloadProgress) => void,
): Promise<CaptionPipe> {
  if (cached) return Promise.resolve(cached);
  if (inflight) return inflight;
  inflight = (async () => {
    const tf = await loadTf();
    const order: Array<"webgpu" | "wasm"> = 웹지피유()
      ? ["webgpu", "wasm"]
      : ["wasm"];
    let last: unknown;
    for (const device of order) {
      try {
        const pipe = await createPipe(tf, device, onProgress);
        cached = pipe;
        return pipe;
      } catch (err) {
        last = err;
        console.warn("[OpenCircuit] 모델 로드 실패", { device, err });
      }
    }
    throw last instanceof Error ? last : new Error("model load failed");
  })().catch((err) => {
    inflight = null;
    throw err;
  });
  return inflight;
}

export function resetCaptioner(): void {
  cached = null;
  inflight = null;
}
