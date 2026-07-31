#!/usr/bin/env node
/**
 * 전역 mcp.json 병합.
 * 사용법: node merge-mcp.mjs <mcp.json경로> <서버키> <node경로> <진입스크립트경로>
 * 기존 키는 보존하고 지정 키만 덮어쓴다.
 * 이미 있는 env 값은 유지하고, 없으면 env: {} 를 둔다.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";

const [mcpPath, key, nodePath, entryPath] = process.argv.slice(2);
if (!mcpPath || !key || !nodePath || !entryPath) {
  console.error(
    "사용법: node merge-mcp.mjs <mcp.json> <서버키> <node경로> <진입스크립트>",
  );
  process.exit(2);
}

let config = { mcpServers: {} };
if (existsSync(mcpPath)) {
  try {
    const raw = readFileSync(mcpPath, "utf8").trim();
    if (raw) {
      config = JSON.parse(raw);
    }
  } catch {
    console.error(
      `기존 mcp.json 을 읽지 못했습니다: ${mcpPath}. JSON 문법을 고친 뒤 다시 실행하세요.`,
    );
    process.exit(1);
  }
}

if (!config.mcpServers || typeof config.mcpServers !== "object") {
  config.mcpServers = {};
}

const prev = config.mcpServers[key];
const prevEnv =
  prev && typeof prev === "object" && prev.env && typeof prev.env === "object"
    ? prev.env
    : {};

config.mcpServers[key] = {
  command: nodePath,
  args: [entryPath],
  env: prevEnv,
};

mkdirSync(dirname(mcpPath), { recursive: true });
writeFileSync(mcpPath, JSON.stringify(config, null, 2) + "\n", "utf8");
console.log(`OK keys=${Object.keys(config.mcpServers).join(",")}`);
