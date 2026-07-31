#!/usr/bin/env node
/**
 * opencircuit-hello — 설치·연결 검증용 최소 MCP 서버.
 * 호스트(Cursor/Claude Code/Codex)를 가정하지 않는다. stdio만 사용한다.
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG_DIR = join(HERE, "..");
const REPO_ROOT = join(PKG_DIR, "..", "..");

function readPackageVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(join(PKG_DIR, "package.json"), "utf8"),
    ) as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function readGitCommit(): string {
  try {
    const gitDir = join(REPO_ROOT, ".git");
    if (!existsSync(gitDir)) return "unknown";
    return execSync("git rev-parse --short HEAD", {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      windowsHide: true,
    }).trim();
  } catch {
    return "unknown";
  }
}

const VERSION = readPackageVersion();
const COMMIT = readGitCommit();

const server = new McpServer({
  name: "opencircuit-hello",
  version: VERSION,
});

server.registerTool(
  "ping",
  {
    title: "Ping",
    description:
      "OpenCircuit MCP 설치·연결 검증용. 인자 없음. " +
      "수업 시작 전·부트스트랩 --doctor와 함께 쓰세요. " +
      "실패 시 Cursor를 재시작한 뒤 ~/.cursor/mcp.json 의 opencircuit-hello 항목과 " +
      "Node 설치 여부, ~/.opencircuit/repo 빌드 여부를 확인하세요. " +
      "흔한 실패: 서버 미등록, Node 미설치, dist 미빌드.",
  },
  async () => {
    const text = [
      `pong — opencircuit-hello (package ${VERSION}, commit ${COMMIT})`,
      "연결이 정상입니다.",
      "다음: Cursor MCP 목록에서 opencircuit-hello 가 초록불인지 확인하세요. 문제가 있으면 부트스트랩을 --doctor 로 다시 실행하세요.",
    ].join("\n");
    return {
      content: [{ type: "text", text }],
    };
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
    `opencircuit-hello 서버를 시작하지 못했습니다: ${message}. Node 20+ 가 설치돼 있는지 확인한 뒤 부트스트랩을 다시 실행하세요.`,
  );
  process.exit(1);
});
