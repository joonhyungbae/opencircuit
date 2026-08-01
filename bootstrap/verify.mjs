#!/usr/bin/env node
/**
 * MCP handshake + ping 검증.
 * 사용법: node verify.mjs <node절대경로> <서버진입스크립트절대경로>
 * 성공 시 stdout에 COMMIT=<hash> 한 줄을 포함할 수 있다.
 */
import { spawn } from "node:child_process";

const nodeBin = process.argv[2];
const entry = process.argv[3];

if (!nodeBin || !entry) {
  console.error(
    "사용법: node verify.mjs <node경로> <서버진입스크립트경로>",
  );
  process.exit(2);
}

function send(child, msg) {
  child.stdin.write(JSON.stringify(msg) + "\n");
}

function readMessages(buf, chunk, onMessage) {
  buf.value += chunk.toString("utf8");
  let idx;
  while ((idx = buf.value.indexOf("\n")) !== -1) {
    const line = buf.value.slice(0, idx).replace(/\r$/, "");
    buf.value = buf.value.slice(idx + 1);
    if (!line.trim()) continue;
    try {
      onMessage(JSON.parse(line));
    } catch {
      /* ignore non-JSON */
    }
  }
}

const child = spawn(nodeBin, [entry], {
  stdio: ["pipe", "pipe", "pipe"],
  windowsHide: true,
  env: process.env,
});

const pending = new Map();
let nextId = 1;
const buf = { value: "" };
let stderr = "";

child.stderr.on("data", (c) => {
  stderr += c.toString("utf8");
});

child.stdout.on("data", (chunk) => {
  readMessages(buf, chunk, (msg) => {
    if (msg.id != null && pending.has(msg.id)) {
      const { resolve } = pending.get(msg.id);
      pending.delete(msg.id);
      resolve(msg);
    }
  });
});

function request(method, params) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`타임아웃: ${method}`));
    }, 20000);
    pending.set(id, {
      resolve: (msg) => {
        clearTimeout(timer);
        resolve(msg);
      },
    });
    send(child, { jsonrpc: "2.0", id, method, params });
  });
}

function fail(message) {
  console.error(message);
  if (stderr.trim()) {
    console.error("서버 메시지:", stderr.trim().slice(0, 500));
  }
  try {
    child.kill();
  } catch {
    /* ignore */
  }
  process.exit(1);
}

try {
  const init = await request("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "opencircuit-bootstrap", version: "0.1.0" },
  });
  if (init.error) {
    fail(
      `MCP handshake 실패: ${init.error.message}. Cursor를 재시작한 뒤 부트스트랩을 다시 실행하세요.`,
    );
  }

  send(child, { jsonrpc: "2.0", method: "notifications/initialized" });

  const ping = await request("tools/call", { name: "ping", arguments: {} });
  if (ping.error) {
    fail(
      `ping 실패: ${ping.error.message}. mcp.json 의 서버 경로와 ~/.opencircuit/repo 빌드를 확인하세요.`,
    );
  }

  const text = (ping.result?.content ?? [])
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("\n");

  const commitMatch = text.match(/commit\s+([0-9a-f]+|unknown)/i);
  const commit = commitMatch?.[1] ?? "unknown";

  console.log("OK");
  console.log(`COMMIT=${commit}`);
  console.log(text);

  child.kill();
  process.exit(0);
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  fail(
    `서버 검증에 실패했습니다: ${message}. Node와 ~/.opencircuit/repo/core/hello/dist 가 있는지 확인한 뒤 부트스트랩을 다시 실행하세요.`,
  );
}
