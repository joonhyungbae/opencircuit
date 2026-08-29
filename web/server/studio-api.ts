import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { join, resolve, sep } from "node:path";
import {
  getJob,
  resultUrls,
  submitImage,
  submitMusic,
  submitVideo,
  waitForJobs,
  type Job,
} from "../../tools/apiframe/server/src/apiframe.js";
import { estimateImage, estimateMusic, estimateVideo, formatActualCost } from "../../tools/apiframe/server/src/cost.js";
import { UserFacingError, toUserMessage } from "../../tools/apiframe/server/src/korean.js";
import { defaultWorksRoot } from "../../tools/apiframe/server/src/paths.js";
import {
  appendItem,
  ensureWorkDir,
  extensionFor,
  fileName,
  forgetJob,
  lookupJob,
  mediaDir,
  nextSeq,
  nowKst,
  readManifest,
  rememberJob,
  resolveWorkDir,
  writeManifest,
  type MediaType,
  type PendingJob,
} from "../../tools/apiframe/server/src/workspace.js";
import { keyHint, loadApiFrameKey, saveApiFrameKey } from "./key.js";
import { MODEL_OPTIONS, pickModel } from "./models.js";


const WAIT_MS = { image: 90_000, video: 240_000, music: 150_000 } as const;

export type Traffic = { dir: "out" | "in"; text: string };

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let n = 0;
    req.on("data", (c: Buffer) => {
      n += c.length;
      if (n > 32_000) {
        reject(new Error("too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function requireKey(): void {
  if (!loadApiFrameKey()) {
    throw new UserFacingError(
      "API 키가 없습니다. 이 페이지의 API 키 칸에 붙여 넣고 「이 컴퓨터에 저장」을 누르세요. 키는 저장소에 커밋되지 않습니다.",
    );
  }
}

async function downloadToMedia(pending: PendingJob, urls: string[]): Promise<string[]> {
  const saved: string[] = [];
  let seq = nextSeq(pending.workDir);
  for (const url of urls) {
    let res: Response;
    try {
      res = await fetch(url);
    } catch {
      throw new UserFacingError(
        "결과 파일을 내려받지 못했습니다. 잠시 뒤 다시 확인하세요.",
      );
    }
    if (!res.ok) {
      throw new UserFacingError(
        `결과 파일을 내려받지 못했습니다 (HTTP ${res.status}). 잠시 뒤 다시 확인하세요.`,
      );
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = extensionFor(pending.type, url, res.headers.get("content-type"));
    const name = fileName(seq, pending.type, ext);
    writeFileSync(join(mediaDir(pending.workDir), name), buf);
    appendItem(pending.workDir, pending.work, {
      file: name,
      type: pending.type,
      prompt: pending.prompt,
      model: pending.model,
      createdAt: nowKst(),
    });
    saved.push(name);
    seq += 1;
  }
  return saved;
}

async function saveIfDone(
  job: Job,
  pending: PendingJob,
): Promise<{ saved: string[]; pending: boolean; failed: string; cost: string }> {
  const cost = formatActualCost(job.creditCost) ?? "";
  if (job.status === "FAILED") {
    forgetJob(job.id);
    return {
      saved: [],
      pending: false,
      failed: job.error ? String(job.error) : "생성에 실패했습니다.",
      cost,
    };
  }
  if (job.status !== "COMPLETED") {
    return { saved: [], pending: true, failed: "", cost };
  }
  const urls = resultUrls(job, pending.type);
  if (urls.length === 0) {
    forgetJob(job.id);
    return {
      saved: [],
      pending: false,
      failed: "완료됐지만 결과 주소가 없습니다.",
      cost,
    };
  }
  const saved = await downloadToMedia(pending, urls);
  forgetJob(job.id);
  return { saved, pending: false, failed: "", cost };
}

function safeFileName(file: string): string | null {
  const t = file.trim();
  if (!t || t.includes("..") || t.includes("/") || t.includes("\\")) return null;
  if (t === "manifest.json") return null;
  return t;
}

function deleteMedia(workName: string, file: string): { ok: true; message: string } {
  const work = (workName || "실습").trim() || "실습";
  const name = safeFileName(file);
  if (!name) {
    throw new UserFacingError("지울 파일을 지정해 주세요.");
  }
  const workDir = resolveWorkDir(work);
  const dir = mediaDir(workDir);
  const abs = resolve(dir, name);
  const allowed = resolve(dir) + sep;
  if (!abs.startsWith(allowed)) {
    throw new UserFacingError("잘못된 경로입니다.");
  }
  const man = readManifest(workDir);
  const items = man.items.filter((it) => it.file !== name);
  if (items.length === man.items.length) {
    throw new UserFacingError("그 결과가 목록에 없습니다.");
  }
  writeManifest(workDir, { ...man, items });
  if (existsSync(abs)) unlinkSync(abs);
  return { ok: true, message: "지웠습니다." };
}

function inferType(job: Job): MediaType {
  const r = job.result;
  if (r?.videoUrl || r?.videos?.length) return "video";
  if (r?.tracks?.length) return "music";
  return "image";
}

async function generate(body: {
  kind?: string;
  prompt?: string;
  work?: string;
  model?: string;
}): Promise<{
  ok: boolean;
  message: string;
  jobId?: string;
  saved?: string[];
  work: string;
  folder: string;
  traffic: Traffic[];
}> {
  requireKey();
  const kind = body.kind;
  const prompt = (body.prompt ?? "").trim();
  const work = (body.work ?? "실습").trim() || "실습";
  if (kind !== "image" && kind !== "video" && kind !== "music") {
    throw new UserFacingError("이미지·영상·음악 중에서 골라 주세요.");
  }
  if (!prompt) {
    throw new UserFacingError("문장이 비어 있습니다. 문장을 쓴 뒤 다시 누르세요.");
  }
  const workDir = ensureWorkDir(work);
  const folder = mediaDir(workDir);
  const traffic: Traffic[] = [];
  const label = kind === "image" ? "이미지" : kind === "video" ? "영상" : "음악";
  const model = pickModel(kind, body.model);
  const cost =
    kind === "image"
      ? estimateImage(model, 1)
      : kind === "video"
        ? estimateVideo(model, 5, true)
        : estimateMusic(model);
  traffic.push({ dir: "out", text: `${label} 생성을 보냈습니다. ${cost}` });
  const submitted =
    kind === "image"
      ? await submitImage(prompt, model)
      : kind === "video"
        ? await submitVideo(prompt, model, 5, true)
        : await submitMusic(prompt, model);
  rememberJob({
    jobId: submitted.jobId,
    work,
    workDir,
    type: kind,
    prompt,
    model,
    createdAt: nowKst(),
  });
  const jobs = await waitForJobs([submitted.jobId], WAIT_MS[kind]);
  const result = await saveIfDone(jobs[0]!, {
    jobId: submitted.jobId,
    work,
    workDir,
    type: kind,
    prompt,
    model,
    createdAt: nowKst(),
  });
  if (result.failed) {
    return { ok: false, message: result.failed, work, folder, traffic };
  }
  if (result.pending) {
    return {
      ok: false,
      message: "아직 만드는 중입니다. 잠시 뒤 다시 눌러 주세요.",
      jobId: submitted.jobId,
      work,
      folder,
      traffic,
    };
  }
  const msg = `저장했습니다: ${result.saved.join(", ")}`;
  return { ok: true, message: msg, saved: result.saved, work, folder, traffic };
}

async function checkJob(jobId: string, workName?: string): Promise<{
  ok: boolean;
  message: string;
  jobId: string;
  saved?: string[];
  work?: string;
  folder?: string;
  traffic: Traffic[];
}> {
  requireKey();
  const traffic: Traffic[] = [];
  traffic.push({ dir: "out", text: `작업 확인을 보냈습니다. ID ${jobId}` });
  const job = await getJob(jobId);
  traffic.push({
    dir: "in",
    text: `상태 ${job.status}${typeof job.progress === "number" ? ` (${job.progress}%)` : ""}`,
  });
  let pending = lookupJob(jobId);
  if (!pending && workName) {
    const workDir = ensureWorkDir(workName);
    pending = {
      jobId,
      work: workName,
      workDir,
      type: inferType(job),
      prompt: "",
      model: job.model ?? "",
      createdAt: nowKst(),
    };
  }
  if (job.status === "QUEUED" || job.status === "PROCESSING") {
    return {
      ok: true,
      message: "아직 만드는 중입니다. 잠시 뒤 다시 확인하세요.",
      jobId,
      work: pending?.work,
      folder: pending ? mediaDir(pending.workDir) : undefined,
      traffic,
    };
  }
  if (!pending) {
    return {
      ok: false,
      message: "작업은 있지만 저장할 폴더를 모릅니다. 작업 이름을 넣어 주세요.",
      jobId,
      traffic,
    };
  }
  const result = await saveIfDone(job, pending);
  if (result.failed) {
    traffic.push({ dir: "in", text: result.failed });
    return { ok: false, message: result.failed, jobId, traffic };
  }
  if (result.pending) {
    return {
      ok: true,
      message: "아직 만드는 중입니다.",
      jobId,
      work: pending.work,
      folder: mediaDir(pending.workDir),
      traffic,
    };
  }
  const msg = `저장했습니다: ${result.saved.join(", ")}`;
  traffic.push({ dir: "in", text: msg });
  return {
    ok: true,
    message: msg,
    jobId,
    saved: result.saved,
    work: pending.work,
    folder: mediaDir(pending.workDir),
    traffic,
  };
}

export async function handleStudioApi(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = (req.url ?? "").split("?")[0];
  const method = req.method ?? "GET";

  if (url === "/api/studio" && method === "GET") {
    const hasKey = loadApiFrameKey();
    sendJson(res, 200, {
      hasKey,
      keyHint: hasKey ? keyHint() : "",
      worksRoot: defaultWorksRoot(),
      models: MODEL_OPTIONS,
    });
    return true;
  }

  if (url === "/api/key" && method === "POST") {
    try {
      const raw = await readBody(req);
      const body = raw ? (JSON.parse(raw) as { key?: string }) : {};
      saveApiFrameKey(body.key ?? "");
      sendJson(res, 200, {
        ok: true,
        hasKey: true,
        keyHint: keyHint(),
        message: "이 컴퓨터에만 저장했습니다. 저장소에는 넣지 않습니다.",
      });
    } catch (err) {
      sendJson(res, 400, {
        ok: false,
        message: toUserMessage(err),
      });
    }
    return true;
  }

  if (url === "/api/delete" && method === "POST") {
    try {
      const raw = await readBody(req);
      const body = raw ? (JSON.parse(raw) as { work?: string; file?: string }) : {};
      const out = deleteMedia(body.work ?? "", body.file ?? "");
      sendJson(res, 200, out);
    } catch (err) {
      sendJson(res, 400, {
        ok: false,
        message: toUserMessage(err),
      });
    }
    return true;
  }

  if (url === "/api/generate" && method === "POST") {
    try {
      const raw = await readBody(req);
      const body = raw ? (JSON.parse(raw) as { kind?: string; prompt?: string; work?: string; model?: string }) : {};
      const out = await generate(body);
      sendJson(res, out.ok ? 200 : 400, out);
    } catch (err) {
      sendJson(res, 400, {
        ok: false,
        message: toUserMessage(err),
        traffic: [{ dir: "in", text: toUserMessage(err) }],
      });
    }
    return true;
  }

  const check = /^\/api\/jobs\/([^/]+)$/.exec(url);
  if (check && method === "GET") {
    try {
      const jobId = decodeURIComponent(check[1] ?? "");
      const q = new URL(req.url ?? "/", "http://127.0.0.1");
      const work = q.searchParams.get("work") ?? undefined;
      const out = await checkJob(jobId, work);
      sendJson(res, out.ok ? 200 : 400, out);
    } catch (err) {
      sendJson(res, 400, {
        ok: false,
        message: toUserMessage(err),
        traffic: [{ dir: "in", text: toUserMessage(err) }],
      });
    }
    return true;
  }

  return false;
}
