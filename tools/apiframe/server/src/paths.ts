/**
 * 작업 폴더·설정 파일 경로. Windows / macOS / Linux 에서 실제 경로를 쓴다.
 * 수강생에게는 ~ 같은 축약 대신 이 컴퓨터의 절대경로를 보여 준다.
 */
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve, sep } from "node:path";

export const IS_WINDOWS = process.platform === "win32";

export function homeDir(): string {
  if (IS_WINDOWS) {
    return process.env.USERPROFILE || homedir();
  }
  return homedir();
}

export function mcpJsonPath(): string {
  return join(homeDir(), ".cursor", "mcp.json");
}

export function opencircuitHome(): string {
  return resolve(homeDir(), ".opencircuit");
}

function xdgDocuments(): string | null {
  const file = join(homeDir(), ".config", "user-dirs.dirs");
  if (!existsSync(file)) return null;
  try {
    const text = readFileSync(file, "utf8");
    const m = /XDG_DOCUMENTS_DIR="([^"]+)"/.exec(text);
    if (!m) return null;
    const raw = m[1].replace(/\$HOME/g, homeDir()).replace(/^~(?=\/|$)/, homeDir());
    return raw ? resolve(raw) : null;
  } catch {
    return null;
  }
}

/** 문서 폴더. Windows 한국어는 Documents 또는 문서, Linux 는 XDG 를 존중한다. */
export function documentsDir(): string {
  const home = homeDir();
  if (IS_WINDOWS) {
    for (const name of ["Documents", "문서"]) {
      const p = join(home, name);
      if (existsSync(p)) return p;
    }
    return join(home, "Documents");
  }
  const xdg = process.platform === "linux" ? xdgDocuments() : null;
  if (xdg && existsSync(xdg)) return xdg;
  return join(home, "Documents");
}

export function defaultWorksRoot(): string {
  return join(documentsDir(), "OpenCircuit");
}

export function jobsIndexPath(): string {
  return join(defaultWorksRoot(), ".apiframe-jobs.json");
}

/** ~ 와 %USERPROFILE% 를 이 OS 홈으로 푼다. */
export function expandUserPath(input: string): string {
  let s = input.trim();
  const home = homeDir();
  if (IS_WINDOWS) {
    s = s.replace(/%USERPROFILE%/gi, home).replace(/%HOME%/gi, home);
    if (s === "~") return resolve(home);
    if (s.startsWith("~/") || s.startsWith("~\\")) {
      return resolve(home, s.slice(2).replace(/[/\\]/g, sep));
    }
    return resolve(s);
  }
  if (s === "~") return resolve(home);
  if (s.startsWith("~/")) return resolve(home, s.slice(2));
  return resolve(s);
}

function normForCompare(p: string): string {
  const r = resolve(p);
  return IS_WINDOWS ? r.toLowerCase() : r;
}

export function isForbiddenPath(target: string): boolean {
  const oc = normForCompare(opencircuitHome());
  const resolved = normForCompare(target);
  return resolved === oc || resolved.startsWith(oc + sep);
}

export function workDirHint(workName = "<작업이름>"): string {
  return join(defaultWorksRoot(), workName);
}
