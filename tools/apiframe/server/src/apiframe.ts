/**
 * APIFrame v2 클라이언트.
 * 스키마는 2026-08-28 https://apiframe.ai/docs/ 확인분.
 *
 * 인증: X-API-Key
 * 제출: POST /v2/{images|videos|music}/generate → { jobId, status }
 * 폴링: GET /v2/jobs/:id → { id, status, progress, result, error, creditCost, model }
 * 이미지 결과: result.images[]
 * 영상 결과: result.videoUrl 또는 result.videos[]
 * 음악 결과: result.tracks[].audioUrl
 */
import { UserFacingError, msgHttpStatus, msgNoKey, redact } from "./korean.js";

export const BASE_URL = "https://api.apiframe.ai/v2";

export type JobStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | string;

export interface SubmitResponse {
  jobId: string;
  status: JobStatus;
}

export interface JobResult {
  images?: string[];
  gridUrl?: string;
  videoUrl?: string;
  videos?: string[];
  tracks?: Array<{
    id?: string;
    audioUrl?: string;
    imageUrl?: string | null;
    title?: string | null;
    tags?: string | null;
    duration?: number | null;
  }>;
}

export interface Job {
  id: string;
  status: JobStatus;
  progress?: number;
  model?: string;
  result?: JobResult | null;
  error?: string | null;
  creditCost?: number;
  createdAt?: string;
  completedAt?: string | null;
}

function apiKey(): string {
  const key = process.env.APIFRAME_KEY?.trim() ?? "";
  if (!key) {
    throw new UserFacingError(msgNoKey());
  }
  return key;
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { error: redact(text).slice(0, 200) };
  }
}

function errorMessage(body: unknown): string {
  if (body && typeof body === "object") {
    const rec = body as { error?: unknown; message?: unknown };
    if (typeof rec.error === "string") return rec.error;
    if (typeof rec.message === "string") return rec.message;
  }
  return "";
}

async function request(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<unknown> {
  const key = apiKey();
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        "X-API-Key": key,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    const raw = err instanceof Error ? err.message : "네트워크 오류";
    throw new UserFacingError(
      `APIFrame 에 연결하지 못했습니다: ${redact(raw)}. 인터넷을 확인한 뒤 다시 시도하세요.`,
    );
  }

  const parsed = await parseBody(res);
  if (!res.ok) {
    throw new UserFacingError(msgHttpStatus(res.status, errorMessage(parsed)));
  }
  return parsed;
}

function asSubmit(parsed: unknown): SubmitResponse {
  const rec = parsed as { jobId?: unknown; id?: unknown; status?: unknown };
  const jobId =
    typeof rec.jobId === "string"
      ? rec.jobId
      : typeof rec.id === "string"
        ? rec.id
        : "";
  if (!jobId) {
    throw new UserFacingError(
      "작업을 접수했지만 작업 ID를 받지 못했습니다. 잠시 뒤 콘솔에서 작업 목록을 확인하거나 다시 시도하세요.",
    );
  }
  return {
    jobId,
    status: typeof rec.status === "string" ? rec.status : "QUEUED",
  };
}

export async function submitImage(
  prompt: string,
  model: string,
): Promise<SubmitResponse> {
  const body: Record<string, unknown> = { prompt, model };
  if (model === "flux-1.1-pro" || model === "flux-1.1-pro-ultra") {
    body.fluxParams = { output_format: "png" };
  }
  return asSubmit(await request("POST", "/images/generate", body));
}

export async function submitVideo(
  prompt: string,
  model: string,
  duration: number,
  draft: boolean,
): Promise<SubmitResponse> {
  const body: Record<string, unknown> = { prompt, model };
  if (model === "flux-3") {
    body.flux3Params = {
      duration,
      draft,
    };
  } else if (model === "grok-imagine-video") {
    body.grokImagineVideoParams = { duration: 6 };
  } else if (model === "hailuo-02") {
    body.hailuoParams = { duration: 6, resolution: "768p" };
  } else if (model === "veo-3-fast") {
    body.veoParams = { duration: 4, generate_audio: false };
  } else if (model === "wan-2.5") {
    body.wanParams = { duration: 5, resolution: "480p" };
  }
  return asSubmit(await request("POST", "/videos/generate", body));
}

export async function submitMusic(
  prompt: string,
  model: string,
): Promise<SubmitResponse> {
  return asSubmit(
    await request("POST", "/music/generate", { prompt, model }),
  );
}

export async function getJob(jobId: string): Promise<Job> {
  const parsed = (await request("GET", `/jobs/${encodeURIComponent(jobId)}`)) as Job;
  if (!parsed || typeof parsed !== "object") {
    throw new UserFacingError(
      "작업 상태를 읽지 못했습니다. 잠시 뒤 check_job 을 다시 호출하세요.",
    );
  }
  return parsed;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForJobs(
  jobIds: string[],
  timeoutMs: number,
  intervalMs = 2500,
): Promise<Job[]> {
  const deadline = Date.now() + timeoutMs;
  const done = new Map<string, Job>();
  while (Date.now() < deadline) {
    for (const id of jobIds) {
      if (done.has(id)) continue;
      const job = await getJob(id);
      if (job.status === "COMPLETED" || job.status === "FAILED") {
        done.set(id, job);
      }
    }
    if (done.size === jobIds.length) {
      return jobIds.map((id) => done.get(id)!);
    }
    const remain = deadline - Date.now();
    if (remain <= 0) break;
    await sleep(Math.min(intervalMs, remain));
  }
  const out: Job[] = [];
  for (const id of jobIds) {
    if (done.has(id)) out.push(done.get(id)!);
    else out.push(await getJob(id));
  }
  return out;
}

export function resultUrls(job: Job, type: "image" | "video" | "music"): string[] {
  const r = job.result;
  if (!r) return [];
  if (type === "image") {
    return (r.images ?? []).filter((u) => typeof u === "string").slice(0, 4);
  }
  if (type === "video") {
    if (typeof r.videoUrl === "string") return [r.videoUrl];
    return (r.videos ?? []).filter((u) => typeof u === "string").slice(0, 4);
  }
  return (r.tracks ?? [])
    .map((t) => t.audioUrl)
    .filter((u): u is string => typeof u === "string");
}
