#!/usr/bin/env node
/**
 * opencircuit-apiframe — APIFrame 이미지·영상·음악 생성 MCP 서버.
 * 호스트(Cursor/Claude Code/Codex)를 가정하지 않는다. stdio만 사용한다.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  getJob,
  resultUrls,
  submitImage,
  submitMusic,
  submitVideo,
  waitForJobs,
  type Job,
} from "./apiframe.js";
import { estimateImage, estimateMusic, estimateVideo, formatActualCost } from "./cost.js";
import {
  NEXT_AFTER_GENERATE,
  NEXT_AFTER_SUBMIT,
  UserFacingError,
  msgForbiddenOc,
  msgNoKey,
  toUserMessage,
} from "./korean.js";
import {
  defaultWorksRoot,
  expandUserPath,
  isForbiddenPath,
  mcpJsonPath,
  opencircuitHome,
  workDirHint,
} from "./paths.js";
import {
  appendItem,
  ensureWorkDir,
  extensionFor,
  fileName,
  forgetJob,
  listWorkFolders,
  lookupJob,
  mediaDir,
  nextSeq,
  nowKst,
  rememberJob,
  resolveWorkDir,
  type MediaType,
  type PendingJob,
} from "./workspace.js";

const IMAGE_WAIT_MS = 90_000;
const DEFAULT_IMAGE_MODEL = "flux-1.1-pro";
const DEFAULT_VIDEO_MODEL = "flux-3";
const DEFAULT_MUSIC_MODEL = "mureka";
const DEFAULT_VIDEO_DURATION = 5;

const server = new McpServer({
  name: "opencircuit-apiframe",
  version: "0.1.0",
});

function textResult(text: string, isError = false) {
  return { content: [{ type: "text" as const, text }], isError };
}

function requireKey(): void {
  if (!process.env.APIFRAME_KEY?.trim()) {
    throw new UserFacingError(msgNoKey());
  }
}

async function downloadToMedia(
  pending: PendingJob,
  urls: string[],
): Promise<string[]> {
  const saved: string[] = [];
  let seq = nextSeq(pending.workDir);
  for (const url of urls) {
    let res: Response;
    try {
      res = await fetch(url);
    } catch {
      throw new UserFacingError(
        "결과 파일을 내려받지 못했습니다. 인터넷을 확인한 뒤 check_job 을 다시 호출하세요.",
      );
    }
    if (!res.ok) {
      throw new UserFacingError(
        `결과 파일을 내려받지 못했습니다 (HTTP ${res.status}). 잠시 뒤 check_job 을 다시 호출하세요.`,
      );
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = extensionFor(
      pending.type,
      url,
      res.headers.get("content-type"),
    );
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

function rememberAll(
  jobs: { jobId: string }[],
  work: string,
  workDir: string,
  type: MediaType,
  prompt: string,
  model: string,
): void {
  const createdAt = nowKst();
  for (const j of jobs) {
    rememberJob({
      jobId: j.jobId,
      work,
      workDir,
      type,
      prompt,
      model,
      createdAt,
    });
  }
}

async function collectFinished(
  jobs: Job[],
  pendingTemplate: Omit<PendingJob, "jobId">,
): Promise<{ saved: string[]; pendingIds: string[]; failed: string[]; costs: string[] }> {
  const saved: string[] = [];
  const pendingIds: string[] = [];
  const failed: string[] = [];
  const costs: string[] = [];
  for (const job of jobs) {
    const actual = formatActualCost(job.creditCost);
    if (actual) costs.push(actual);
    if (job.status === "FAILED") {
      failed.push(job.error ? String(job.error) : "생성에 실패했습니다.");
      forgetJob(job.id);
      continue;
    }
    if (job.status !== "COMPLETED") {
      pendingIds.push(job.id);
      continue;
    }
    const urls = resultUrls(job, pendingTemplate.type);
    if (urls.length === 0) {
      failed.push("완료됐지만 결과 주소가 없습니다. 콘솔에서 해당 작업을 확인하세요.");
      forgetJob(job.id);
      continue;
    }
    const files = await downloadToMedia({ ...pendingTemplate, jobId: job.id }, urls);
    saved.push(...files);
    forgetJob(job.id);
  }
  return { saved, pendingIds, failed, costs };
}

server.registerTool(
  "generate_image",
  {
    title: "이미지 생성",
    description:
      "프롬프트로 이미지를 만듭니다. 기본 1장, 최대 4장. 기본 모델 flux-1.1-pro (장당 5크레딧). " +
      "최대 90초 기다린 뒤 파일 경로를 반환합니다. 그 안에 안 끝나면 작업 ID를 주니 check_job 으로 확인하세요. " +
      `작업 폴더는 ${workDirHint()} 입니다. ${opencircuitHome()} 하위는 거부합니다. ` +
      `APIFRAME_KEY 는 ${mcpJsonPath()} 의 opencircuit-apiframe env 에서 읽습니다. ` +
      "한 번에 4장을 넘기지 마세요. Midjourney 는 항상 4장이 나와 비쌉니다.",
    inputSchema: {
      prompt: z.string().min(1).describe("이미지 설명 (1–2000자)"),
      work: z.string().min(1).describe(`작업 이름. 결과가 ${workDirHint()}/media/ 에 쌓입니다`),
      count: z
        .number()
        .int()
        .optional()
        .describe("장 수. 기본 1, 최대 4"),
      model: z
        .string()
        .optional()
        .describe("APIFrame 모델 ID. 기본 flux-1.1-pro"),
      work_path: z
        .string()
        .optional()
        .describe(`작업 폴더를 직접 지정할 때만. ${opencircuitHome()} 하위는 거부`),
    },
  },
  async ({ prompt, work, count, model, work_path }) => {
    try {
      const n = count ?? 1;
      if (!Number.isInteger(n) || n < 1 || n > 4) {
        return textResult(
          "한 번에 이미지는 1–4장입니다. count 를 1에서 4 사이로 넣어 주세요.",
          true,
        );
      }
      const chosen = (model ?? DEFAULT_IMAGE_MODEL).trim() || DEFAULT_IMAGE_MODEL;
      const workDir = ensureWorkDir(work, work_path);
      requireKey();
      const cost = estimateImage(chosen, n);
      const submitted: { jobId: string }[] = [];
      const jobsToWait = chosen === "midjourney" ? 1 : n;
      for (let i = 0; i < jobsToWait; i += 1) {
        submitted.push(await submitImage(prompt, chosen));
      }
      rememberAll(submitted, work, workDir, "image", prompt, chosen);
      const jobs = await waitForJobs(
        submitted.map((s) => s.jobId),
        IMAGE_WAIT_MS,
      );
      const collected = await collectFinished(jobs, {
        work,
        workDir,
        type: "image",
        prompt,
        model: chosen,
        createdAt: nowKst(),
      });
      const lines = [cost];
      if (collected.costs.length) lines.push(collected.costs[0]!);
      if (collected.saved.length) {
        lines.push(`저장했습니다: ${collected.saved.join(", ")}`);
        lines.push(`폴더: ${mediaDir(workDir)}`);
      }
      if (collected.failed.length) {
        lines.push(`실패한 작업: ${collected.failed.join(" / ")}`);
      }
      if (collected.pendingIds.length) {
        lines.push(
          `아직 만드는 중입니다. 작업 ID: ${collected.pendingIds.join(", ")}. check_job 으로 확인하세요.`,
        );
      }
      if (!collected.saved.length && !collected.pendingIds.length && collected.failed.length) {
        return textResult(lines.join("\n"), true);
      }
      lines.push(NEXT_AFTER_GENERATE);
      return textResult(lines.join("\n"));
    } catch (err) {
      return textResult(toUserMessage(err), true);
    }
  },
);

server.registerTool(
  "generate_video",
  {
    title: "영상 생성",
    description:
      "프롬프트로 영상을 만듭니다. 기본 Flux 3 · 5초 · draft (약 40크레딧). " +
      "기다리지 않고 즉시 작업 ID를 반환합니다. 끝나면 check_job 으로 받아 저장하세요. " +
      "1080p·긴 영상은 비쌉니다. 수업에서는 draft 5초를 쓰세요.",
    inputSchema: {
      prompt: z.string().min(1).describe("영상 설명 (1–4000자)"),
      work: z.string().min(1).describe("작업 이름"),
      model: z.string().optional().describe("기본 flux-3"),
      duration: z
        .number()
        .int()
        .optional()
        .describe("초. 기본 5. Flux 3 는 5–20"),
      draft: z
        .boolean()
        .optional()
        .describe("싼 미리보기. 기본 true"),
      work_path: z.string().optional().describe("작업 폴더 직접 지정"),
    },
  },
  async ({ prompt, work, model, duration, draft, work_path }) => {
    try {
      const chosen = (model ?? DEFAULT_VIDEO_MODEL).trim() || DEFAULT_VIDEO_MODEL;
      const seconds = duration ?? DEFAULT_VIDEO_DURATION;
      if (!Number.isInteger(seconds) || seconds < 5 || seconds > 20) {
        return textResult(
          "영상 길이는 5–20초입니다. 수업에서는 5초를 쓰세요. 길수록 크레딧이 많이 나갑니다.",
          true,
        );
      }
      const isDraft = draft !== false;
      const workDir = ensureWorkDir(work, work_path);
      requireKey();
      const cost = estimateVideo(chosen, seconds, isDraft);
      const submitted = await submitVideo(prompt, chosen, seconds, isDraft);
      rememberAll([submitted], work, workDir, "video", prompt, chosen);
      const lines = [
        cost,
        `작업을 접수했습니다. 작업 ID: ${submitted.jobId} (상태 ${submitted.status})`,
        `폴더: ${mediaDir(workDir)} — 끝나면 여기에 저장됩니다.`,
        NEXT_AFTER_SUBMIT,
      ];
      return textResult(lines.join("\n"));
    } catch (err) {
      return textResult(toUserMessage(err), true);
    }
  },
);

server.registerTool(
  "generate_music",
  {
    title: "음악 생성",
    description:
      "프롬프트로 음악을 만듭니다. 기본 mureka (약 6크레딧, 1회). " +
      "기다리지 않고 즉시 작업 ID를 반환합니다. 끝나면 check_job 으로 받아 저장하세요. " +
      "Suno 는 11크레딧이고 곡이 두 개 나올 수 있습니다.",
    inputSchema: {
      prompt: z.string().min(1).describe("음악 설명 또는 가사"),
      work: z.string().min(1).describe("작업 이름"),
      model: z.string().optional().describe("기본 mureka"),
      work_path: z.string().optional().describe("작업 폴더 직접 지정"),
    },
  },
  async ({ prompt, work, model, work_path }) => {
    try {
      const chosen = (model ?? DEFAULT_MUSIC_MODEL).trim() || DEFAULT_MUSIC_MODEL;
      const workDir = ensureWorkDir(work, work_path);
      requireKey();
      const cost = estimateMusic(chosen);
      const submitted = await submitMusic(prompt, chosen);
      rememberAll([submitted], work, workDir, "music", prompt, chosen);
      const lines = [
        cost,
        `작업을 접수했습니다. 작업 ID: ${submitted.jobId} (상태 ${submitted.status})`,
        `폴더: ${mediaDir(workDir)} — 끝나면 여기에 저장됩니다.`,
        NEXT_AFTER_SUBMIT,
      ];
      return textResult(lines.join("\n"));
    } catch (err) {
      return textResult(toUserMessage(err), true);
    }
  },
);

server.registerTool(
  "check_job",
  {
    title: "작업 확인",
    description:
      "진행 중인 생성 작업의 상태를 보고, 완료됐으면 파일을 작업 폴더 media/ 에 저장합니다. " +
      "generate_video · generate_music 은 이 도구로 받아야 합니다. " +
      "이미지 90초를 넘긴 경우에도 이 도구를 쓰세요.",
    inputSchema: {
      job_id: z.string().min(1).describe("generate_* 가 준 작업 ID"),
      work: z
        .string()
        .optional()
        .describe("작업 이름을 잃어버렸을 때만. 보통은 생략"),
      work_path: z.string().optional(),
    },
  },
  async ({ job_id, work, work_path }) => {
    try {
      requireKey();
      const job = await getJob(job_id);
      let pending = lookupJob(job_id);
      if (!pending && work) {
        const workDir = resolveWorkDir(work, work_path);
        pending = {
          jobId: job_id,
          work,
          workDir,
          type: inferType(job),
          prompt: "",
          model: job.model ?? "",
          createdAt: nowKst(),
        };
      }
      const progress =
        typeof job.progress === "number" ? `${job.progress}%` : "알 수 없음";
      if (job.status === "QUEUED" || job.status === "PROCESSING") {
        return textResult(
          [
            `아직 만드는 중입니다. 상태 ${job.status} (${progress}). 작업 ID: ${job_id}`,
            NEXT_AFTER_SUBMIT,
          ].join("\n"),
        );
      }
      if (job.status === "FAILED") {
        forgetJob(job_id);
        return textResult(
          `생성이 실패했습니다: ${job.error ?? "이유 없음"}. 크레딧은 보통 환불됩니다. 프롬프트를 바꿔 generate_* 를 다시 호출하세요.`,
          true,
        );
      }
      if (job.status !== "COMPLETED") {
        return textResult(
          `알 수 없는 상태입니다 (${job.status}). 잠시 뒤 check_job 을 다시 호출하세요.`,
          true,
        );
      }
      if (!pending) {
        return textResult(
          `작업은 끝났지만 저장할 폴더를 모릅니다. check_job 에 work 이름(예: 첫작업)을 넣어 주세요.`,
          true,
        );
      }
      ensureWorkDir(pending.work, pending.workDir);
      const urls = resultUrls(job, pending.type);
      if (urls.length === 0) {
        return textResult(
          "완료됐지만 결과 주소가 없습니다. https://console.apiframe.ai 에서 해당 작업을 확인하세요.",
          true,
        );
      }
      const files = await downloadToMedia(pending, urls);
      forgetJob(job_id);
      const actual = formatActualCost(job.creditCost);
      return textResult(
        [
          actual,
          `저장했습니다: ${files.join(", ")}`,
          `폴더: ${mediaDir(pending.workDir)}`,
          NEXT_AFTER_GENERATE,
        ]
          .filter(Boolean)
          .join("\n"),
      );
    } catch (err) {
      return textResult(toUserMessage(err), true);
    }
  },
);

function inferType(job: Job): MediaType {
  const r = job.result;
  if (r?.videoUrl || r?.videos?.length) return "video";
  if (r?.tracks?.length) return "music";
  return "image";
}

server.registerTool(
  "list_works",
  {
    title: "작업 목록",
    description:
      `${defaultWorksRoot()} 아래 작업 폴더와 media/manifest.json 항목 수를 보여 줍니다. ` +
      "인자 없이 호출하세요.",
    inputSchema: {
      root: z
        .string()
        .optional()
        .describe(`다른 루트를 볼 때만. 기본 ${defaultWorksRoot()}`),
    },
  },
  async ({ root }) => {
    try {
      const worksRoot = root ? expandUserPath(root) : defaultWorksRoot();
      if (isForbiddenPath(worksRoot)) {
        throw new UserFacingError(msgForbiddenOc());
      }
      const works = listWorkFolders(worksRoot);
      if (works.length === 0) {
        return textResult(
          `아직 만든 작업이 없습니다. generate_image 로 첫 이미지를 만들어 보세요. 기본 위치는 ${workDirHint()} 입니다.`,
        );
      }
      const lines = ["작업 폴더 목록:"];
      for (const w of works) {
        const nImg = w.items.filter((i) => i.type === "image").length;
        const nVid = w.items.filter((i) => i.type === "video").length;
        const nMus = w.items.filter((i) => i.type === "music").length;
        lines.push(
          `- ${w.name}  (이미지 ${nImg}, 영상 ${nVid}, 음악 ${nMus})  ${w.dir}`,
        );
      }
      lines.push("다음: 전시장 index.html 을 열거나 generate_* 로 더 만드세요.");
      return textResult(lines.join("\n"));
    } catch (err) {
      return textResult(toUserMessage(err), true);
    }
  },
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err: unknown) => {
  const message =
    err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
  console.error(
    `opencircuit-apiframe 서버를 시작하지 못했습니다: ${message}. Node 20+ 가 설치돼 있는지 확인한 뒤 부트스트랩을 다시 실행하세요.`,
  );
  process.exit(1);
});
