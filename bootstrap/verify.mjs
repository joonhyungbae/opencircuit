#!/usr/bin/env node
/**
 * MCP handshake + ping 검증.
 * 사용법: node verify.mjs <node절대경로> <서버진입스크립트절대경로>
 * 성공 시 stdout에 COMMIT=<hash> 한 줄을 포함할 수 있다.
 */
import { spawn } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";

const repoHint = join(homedir(), ".opencircuit", "repo");

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

// 검증이 끝났는지 표시한다. 정상 종료 직전의 child.kill() 이
// exit 핸들러를 깨워 "시작하자마자 종료됐다"고 오보하는 것을 막는다.
let settled = false;

// spawn 실패(node 경로가 틀림 등)는 예외가 아니라 'error' 이벤트로 온다.
// 핸들러가 없으면 try/catch 로도 잡히지 않고 날 스택 트레이스가 그대로 노출된다.
child.on("error", (err) => {
  fail(
    `서버를 실행하지 못했습니다: ${err?.message ?? err}. ` +
      `Node 설치를 확인한 뒤 부트스트랩을 다시 실행하세요.`,
  );
});

// 서버가 즉시 죽으면 타임아웃(20초)을 기다릴 이유가 없다.
// 기다리면 실패 하나당 20초씩 수업 시간이 사라진다.
child.on("exit", (code, signal) => {
  if (!settled) {
    const how = signal ? `신호 ${signal}` : `종료 코드 ${code}`;
    fail(
      `서버가 시작하자마자 종료됐습니다 (${how}). ` +
        (stderr.trim() ? `서버 메시지: ${stderr.trim().split("\n")[0]}. ` : "") +
        `부트스트랩을 --update 로 다시 실행해 보세요.`,
    );
  }
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
  settled = true;
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

  const listed = await request("tools/list", {});
  if (listed.error) {
    fail(
      `tools/list 실패: ${listed.error.message}. mcp.json 의 서버 경로와 ${repoHint} 빌드를 확인하세요.`,
    );
  }
  const toolNames = (listed.result?.tools ?? [])
    .map((t) => t?.name)
    .filter(Boolean);
  if (toolNames.length === 0) {
    fail(
      "서버가 도구를 하나도 내놓지 않았습니다. 부트스트랩을 --update 로 다시 실행하세요.",
    );
  }

  let commit = "n/a";
  let extra = "";
  if (toolNames.includes("ping")) {
    const ping = await request("tools/call", { name: "ping", arguments: {} });
    if (ping.error) {
      fail(
        `ping 실패: ${ping.error.message}. mcp.json 의 서버 경로와 ${repoHint} 빌드를 확인하세요.`,
      );
    }
    extra = (ping.result?.content ?? [])
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("\n");
    const commitMatch = extra.match(/commit\s+([0-9a-f]+|unknown)/i);
    commit = commitMatch?.[1] ?? "unknown";
  }

  console.log("OK");
  console.log(`COMMIT=${commit}`);
  console.log(`TOOLS=${toolNames.join(",")}`);
  if (extra) console.log(extra);

  settled = true;
  child.kill();
  process.exit(0);
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  fail(
    `서버 검증에 실패했습니다: ${message}. Node와 ${join(repoHint, "core", "hello", "dist")} 가 있는지 확인한 뒤 부트스트랩을 다시 실행하세요.`,
  );
}
