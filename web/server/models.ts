/** APIFrame 공식 identifier 만. https://apiframe.ai/docs 2026-08-28
 * Imagen 4 / Imagen 4 Fast 는 Google 이 2026-08-17 종료 → Vertex 404.
 * 같은 가격대 대체: grok-imagine-image(2), grok-image(5).
 */

export type MediaKind = "image" | "video" | "music";

export type ModelOption = {
  id: string;
  label: string;
};

export const DEFAULT_IMAGE = "flux-1.1-pro";
export const DEFAULT_VIDEO = "flux-3";
export const DEFAULT_MUSIC = "mureka";

export const MODEL_OPTIONS: Record<MediaKind, ModelOption[]> = {
  image: [
    { id: "flux-1.1-pro", label: "Flux 1.1 Pro · 기본 · 5크레딧" },
    { id: "flux-2-dev", label: "Flux 2 Dev · 2크레딧" },
    { id: "grok-imagine-image", label: "Grok Image Fast · 2크레딧" },
    { id: "nano-banana-2-lite", label: "Nano Banana 2 Lite · 4크레딧" },
    { id: "flux-1.1-pro-ultra", label: "Flux 1.1 Ultra · 8크레딧" },
    { id: "grok-image", label: "Grok Image 2 · 5크레딧" },
    { id: "ideogram-v4-turbo", label: "Ideogram V4 Turbo · 4크레딧" },
    { id: "midjourney", label: "Midjourney · 10크레딧 · 4장" },
  ],
  video: [
    { id: "flux-3", label: "Flux 3 draft 5초 · 기본 · 약 40크레딧" },
    { id: "grok-imagine-video", label: "Grok Video 6초 · 38크레딧" },
    { id: "hailuo-02", label: "Hailuo 02 6초 · 34크레딧" },
    { id: "veo-3-fast", label: "Veo 3 Fast 4초 · 50크레딧" },
    { id: "wan-2.5", label: "Wan 2.5 480p 5초 · 31크레딧" },
  ],
  music: [
    { id: "mureka", label: "Mureka · 기본 · 6크레딧" },
    { id: "suno", label: "Suno · 11크레딧" },
  ],
};

const ALLOWED: Record<MediaKind, Set<string>> = {
  image: new Set(MODEL_OPTIONS.image.map((m) => m.id)),
  video: new Set(MODEL_OPTIONS.video.map((m) => m.id)),
  music: new Set(MODEL_OPTIONS.music.map((m) => m.id)),
};

const DEFAULTS: Record<MediaKind, string> = {
  image: DEFAULT_IMAGE,
  video: DEFAULT_VIDEO,
  music: DEFAULT_MUSIC,
};

export function pickModel(kind: MediaKind, raw?: string): string {
  const id = (raw ?? "").trim();
  if (id && ALLOWED[kind].has(id)) return id;
  return DEFAULTS[kind];
}
