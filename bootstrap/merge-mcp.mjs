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

/**
 * 폐기된 설계가 남긴 키를 정리한다.
 * `opencircuit-hello-dev` 는 npm 배포 시절의 dev/prod 키 분리에서 나온 것으로,
 * git clone 방식으로 바꾸면서 없어졌다. 남아 있으면 doctor 가 계속 보고한다.
 * 우리 네임스페이스(opencircuit-)의 키만 지우므로 다른 MCP 서버는 건드리지 않는다.
 */
const LEGACY_KEYS = ["opencircuit-hello-dev"];
const removed = LEGACY_KEYS.filter((k) => k !== key && k in config.mcpServers);
for (const k of removed) delete config.mcpServers[k];

// 다른 MCP 서버를 쓰던 수강생을 위해 최초 수정 시 백업을 남긴다.
if (existsSync(mcpPath) && !existsSync(`${mcpPath}.bak`)) {
  try {
    writeFileSync(`${mcpPath}.bak`, readFileSync(mcpPath, "utf8"), "utf8");
  } catch {
    // 백업 실패가 설치를 막을 이유는 없다.
  }
}

mkdirSync(dirname(mcpPath), { recursive: true });
writeFileSync(mcpPath, JSON.stringify(config, null, 2) + "\n", "utf8");
if (removed.length) {
  console.log(`정리한 이전 항목: ${removed.join(", ")}`);
}
console.log(`OK keys=${Object.keys(config.mcpServers).join(",")}`);
