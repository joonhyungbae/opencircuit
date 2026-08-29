import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { UserFacingError, msgBadWorkName, msgForbiddenOc } from "./korean.js";
import {
  defaultWorksRoot,
  expandUserPath,
  isForbiddenPath,
  jobsIndexPath,
} from "./paths.js";

export { defaultWorksRoot as defaultRoot, isForbiddenPath, jobsIndexPath };

export type MediaType = "image" | "video" | "music";

export interface ManifestItem {
  file: string;
  type: MediaType;
  prompt: string;
  model: string;
  createdAt: string;
}

export interface Manifest {
  work: string;
  items: ManifestItem[];
}

export interface PendingJob {
  jobId: string;
  work: string;
  workDir: string;
  type: MediaType;
  prompt: string;
  model: string;
  createdAt: string;
}

export function nowKst(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(new Date()).map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}+09:00`;
}

export function sanitizeWorkName(name: string): string {
  const t = name.trim();
  if (!t || t.includes("/") || t.includes("\\") || t.includes("..")) {
    throw new UserFacingError(msgBadWorkName());
  }
  return t;
}

export function resolveWorkDir(work: string, workPath?: string): string {
  const name = sanitizeWorkName(work);
  const dir = workPath ? expandUserPath(workPath) : join(defaultWorksRoot(), name);
  if (isForbiddenPath(dir)) {
    throw new UserFacingError(msgForbiddenOc());
  }
  return dir;
}

export function mediaDir(workDir: string): string {
  return join(workDir, "media");
}

export function manifestPath(workDir: string): string {
  return join(mediaDir(workDir), "manifest.json");
}

export function ensureWorkDir(work: string, workPath?: string): string {
  const dir = resolveWorkDir(work, workPath);
  mkdirSync(mediaDir(dir), { recursive: true });
  if (!existsSync(manifestPath(dir))) {
    writeManifest(dir, { work, items: [] });
  }
  copyGalleryIfNeeded(dir);
  return dir;
}

function gallerySource(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, "..", "..", "threejs", "baseline");
}

function copyGalleryIfNeeded(workDir: string): void {
  const destHtml = join(workDir, "index.html");
  if (existsSync(destHtml)) return;
  const src = gallerySource();
  const srcHtml = join(src, "index.html");
  if (!existsSync(srcHtml)) return;
  copyFileSync(srcHtml, destHtml);
  const srcLib = join(src, "lib");
  const destLib = join(workDir, "lib");
  if (existsSync(srcLib)) {
    mkdirSync(destLib, { recursive: true });
    for (const name of readdirSync(srcLib)) {
      const from = join(srcLib, name);
      if (statSync(from).isFile()) {
        copyFileSync(from, join(destLib, name));
      }
    }
  }
}

export function readManifest(workDir: string): Manifest {
  const p = manifestPath(workDir);
  if (!existsSync(p)) {
    return { work: "", items: [] };
  }
  try {
    const raw = JSON.parse(readFileSync(p, "utf8")) as Manifest;
    if (!raw || !Array.isArray(raw.items)) {
      return { work: "", items: [] };
    }
    return raw;
  } catch {
    throw new UserFacingError(
      `media/manifest.json 을 읽지 못했습니다: ${p}. JSON 문법을 고친 뒤 다시 시도하세요.`,
    );
  }
}

export function writeManifest(workDir: string, manifest: Manifest): void {
  mkdirSync(mediaDir(workDir), { recursive: true });
  writeFileSync(
    manifestPath(workDir),
    JSON.stringify(manifest, null, 2) + "\n",
    "utf8",
  );
}

export function nextSeq(workDir: string): number {
  let max = 0;
  const man = readManifest(workDir);
  for (const item of man.items) {
    const m = /^(\d{2})-/.exec(item.file);
    if (m) max = Math.max(max, Number(m[1]));
  }
  const dir = mediaDir(workDir);
  if (existsSync(dir)) {
    for (const name of readdirSync(dir)) {
      const m = /^(\d{2})-/.exec(name);
      if (m) max = Math.max(max, Number(m[1]));
    }
  }
  return max + 1;
}

export function appendItems(
  workDir: string,
  workName: string,
  items: ManifestItem[],
): Manifest {
  const man = readManifest(workDir);
  if (!man.work) man.work = workName;
  man.items.push(...items);
  writeManifest(workDir, man);
  return man;
}

export function appendItem(
  workDir: string,
  workName: string,
  item: ManifestItem,
): Manifest {
  return appendItems(workDir, workName, [item]);
}

interface JobsFile {
  jobs: Record<string, PendingJob>;
}

function readJobsFile(): JobsFile {
  const p = jobsIndexPath();
  if (!existsSync(p)) return { jobs: {} };
  try {
    const raw = JSON.parse(readFileSync(p, "utf8")) as JobsFile;
    if (!raw || typeof raw.jobs !== "object" || raw.jobs == null) {
      return { jobs: {} };
    }
    return raw;
  } catch {
    return { jobs: {} };
  }
}

function writeJobsFile(data: JobsFile): void {
  mkdirSync(dirname(jobsIndexPath()), { recursive: true });
  writeFileSync(jobsIndexPath(), JSON.stringify(data, null, 2) + "\n", "utf8");
}

export function rememberJob(job: PendingJob): void {
  const data = readJobsFile();
  data.jobs[job.jobId] = job;
  writeJobsFile(data);
}

export function lookupJob(jobId: string): PendingJob | undefined {
  return readJobsFile().jobs[jobId];
}

export function forgetJob(jobId: string): void {
  const data = readJobsFile();
  delete data.jobs[jobId];
  writeJobsFile(data);
}

export function listWorkFolders(root = defaultWorksRoot()): {
  name: string;
  dir: string;
  items: ManifestItem[];
}[] {
  if (!existsSync(root)) return [];
  const out: { name: string; dir: string; items: ManifestItem[] }[] = [];
  for (const name of readdirSync(root)) {
    if (name.startsWith(".")) continue;
    const dir = join(root, name);
    try {
      if (!statSync(dir).isDirectory()) continue;
    } catch {
      continue;
    }
    const man = existsSync(manifestPath(dir))
      ? readManifest(dir)
      : { work: name, items: [] };
    out.push({ name, dir, items: man.items });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

export function extensionFor(
  type: MediaType,
  url: string,
  contentType?: string | null,
): string {
  if (type === "video") return "mp4";
  if (type === "music") return "mp3";
  const ct = contentType ?? "";
  if (ct.includes("jpeg")) return "jpg";
  if (ct.includes("webp")) return "webp";
  const m = url.split("?")[0].match(/\.(png|jpg|jpeg|webp)$/i);
  if (!m) return "png";
  return m[1].toLowerCase() === "jpeg" ? "jpg" : m[1].toLowerCase();
}

export function fileName(seq: number, type: MediaType, ext: string): string {
  return `${String(seq).padStart(2, "0")}-${type}.${ext}`;
}
