import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { UserFacingError } from "../../tools/apiframe/server/src/korean.js";

function homeDir(): string {
  if (process.platform === "win32") {
    return process.env.USERPROFILE || homedir();
  }
  return homedir();
}

export function mcpJsonPath(): string {
  return join(homeDir(), ".cursor", "mcp.json");
}

/** 저장소 밖. 이 파일은 git에 들어가지 않는다. */
export function localKeyPath(): string {
  return join(homeDir(), ".opencircuit", "apiframe-key");
}

function readLocalKey(): string {
  const file = localKeyPath();
  if (!existsSync(file)) return "";
  try {
    return readFileSync(file, "utf8").trim();
  } catch {
    return "";
  }
}

function readMcpKey(): string {
  const file = mcpJsonPath();
  if (!existsSync(file)) return "";
  try {
    const raw = JSON.parse(readFileSync(file, "utf8")) as {
      mcpServers?: Record<string, { env?: Record<string, string> }>;
    };
    return raw.mcpServers?.["opencircuit-apiframe"]?.env?.APIFRAME_KEY?.trim() ?? "";
  } catch {
    return "";
  }
}

/** 호출 쪽에 키 문자열을 돌려주지 말 것. */
export function loadApiFrameKey(): boolean {
  const fromEnv = process.env.APIFRAME_KEY?.trim();
  if (fromEnv) return true;
  const local = readLocalKey();
  if (local) {
    process.env.APIFRAME_KEY = local;
    return true;
  }
  const mcp = readMcpKey();
  if (mcp) {
    process.env.APIFRAME_KEY = mcp;
    return true;
  }
  return false;
}

export function saveApiFrameKey(raw: string): void {
  const key = raw.trim();
  if (!key) {
    throw new UserFacingError("키가 비어 있습니다. 붙여 넣은 뒤 다시 저장하세요.");
  }
  process.env.APIFRAME_KEY = key;
  const file = localKeyPath();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, key + "\n", { encoding: "utf8", mode: 0o600 });
}

export function keyHint(): string {
  if (!loadApiFrameKey()) return "";
  const key = process.env.APIFRAME_KEY?.trim() ?? "";
  if (key.length < 8) return "저장됨";
  return `${key.slice(0, 4)}…${key.slice(-3)}`;
}
