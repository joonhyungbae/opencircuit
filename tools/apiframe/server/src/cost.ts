/**
 * 예상 비용. 숫자는 2026-08-28 https://apiframe.ai/docs/pricing 기준.
 * 1크레딧 = $0.01. 실제 차감은 작업의 creditCost 가 정본이다.
 */

export type MediaKind = "image" | "video" | "music";

const IMAGE_FLAT: Record<string, number> = {
  "flux-1.1-pro": 5,
  "flux-1.1-pro-ultra": 8,
  "flux-2-dev": 2,
  "nano-banana-2-lite": 4,
  "nano-banana": 5,
  "imagen-4-fast": 2,
  "imagen-4": 5,
  midjourney: 10,
  "ideogram-v4-turbo": 4,
  "ideogram-v2a-turbo": 3,
  "grok-imagine-image": 2,
  "grok-image": 5,
  "dall-e-2": 2,
};

const MUSIC_FLAT: Record<string, number> = {
  mureka: 6,
  suno: 11,
  udio: 9,
  producer: 6,
  "lyria-3-clip": 5,
  "lyria-3-pro": 10,
};

function usd(credits: number): string {
  return `$${ (credits * 0.01).toFixed(2) }`;
}

function line(credits: number, detail: string): string {
  return `예상 비용: 약 ${credits}크레딧 ≈ ${usd(credits)} (1크레딧 = $0.01). ${detail}`;
}

export function estimateImage(model: string, count: number): string {
  const unit = IMAGE_FLAT[model];
  if (unit == null) {
    return `예상 비용: 모델마다 다릅니다. 기본 flux-1.1-pro 는 장당 5크레딧 ≈ $0.05 입니다. ${count}장이면 그만큼 곱하세요. 실제 금액은 작업이 끝난 뒤 creditCost 로 확인하세요.`;
  }
  const total = unit * count;
  const extra =
    model === "midjourney"
      ? "Midjourney 는 한 번에 이미지 4장이 나옵니다 (10크레딧)."
      : `${model} ${count}장.`;
  return line(total, extra);
}

export function estimateVideo(
  model: string,
  durationSec: number,
  draft: boolean,
): string {
  if (model === "flux-3") {
    const perSec = draft ? 8 : 21;
    const total = perSec * durationSec;
    const mode = draft ? "draft 720p" : "720p";
    return line(
      total,
      `Flux 3 ${mode} ${durationSec}초 (초당 ${perSec}크레딧). 수업용 가장 싼 설정은 draft 5초입니다.`,
    );
  }
  return `예상 비용: ${model} 은 초당 과금이 모델마다 다릅니다. 싼 기본값은 Flux 3 draft 5초 (약 40크레딧 ≈ $0.40) 입니다. 실제 금액은 작업이 끝난 뒤 creditCost 로 확인하세요.`;
}

export function estimateMusic(model: string): string {
  const unit = MUSIC_FLAT[model];
  if (unit == null) {
    return `예상 비용: 모델마다 다릅니다. 기본 mureka 는 6크레딧 ≈ $0.06 입니다.`;
  }
  const extra =
    model === "suno" || model === "mureka"
      ? `${model} 1회 생성 (모델이 곡을 두 개 줄 수 있습니다).`
      : `${model} 1곡.`;
  return line(unit, extra);
}

export function formatActualCost(creditCost: unknown): string {
  if (typeof creditCost !== "number" || !Number.isFinite(creditCost)) {
    return "";
  }
  return `실제 차감: ${creditCost}크레딧 ≈ ${usd(creditCost)}.`;
}
