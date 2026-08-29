import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import { handleStudioApi } from "./server/studio-api.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const tfLib = path.join(repoRoot, "tools", "transformersjs", "baseline", "lib");

function homeDir(): string {
  if (process.platform === "win32") {
    return process.env.USERPROFILE || os.homedir();
  }
  return os.homedir();
}

function xdgDocuments(): string | null {
  const file = path.join(homeDir(), ".config", "user-dirs.dirs");
  if (!fs.existsSync(file)) return null;
  try {
    const text = fs.readFileSync(file, "utf8");
    const m = /XDG_DOCUMENTS_DIR="([^"]+)"/.exec(text);
    if (!m) return null;
    const raw = m[1]
      .replace(/\$HOME/g, homeDir())
      .replace(/^~(?=\/|$)/, homeDir());
    return raw ? path.resolve(raw) : null;
  } catch {
    return null;
  }
}

function documentsDir(): string {
  const home = homeDir();
  if (process.platform === "win32") {
    for (const name of ["Documents", "문서"]) {
      const p = path.join(home, name);
      if (fs.existsSync(p)) return p;
    }
    return path.join(home, "Documents");
  }
  const xdg = process.platform === "linux" ? xdgDocuments() : null;
  if (xdg && fs.existsSync(xdg)) return xdg;
  return path.join(home, "Documents");
}

function worksRoot(): string {
  return path.join(documentsDir(), "OpenCircuit");
}

function safeWorkName(name: string): string | null {
  const t = decodeURIComponent(name).trim();
  if (!t || t.includes("..") || t.includes("/") || t.includes("\\")) return null;
  return t;
}

function readManifest(dir: string): {
  work: string;
  items: Array<{
    file: string;
    type: string;
    prompt: string;
    model: string;
    createdAt: string;
  }>;
} {
  const p = path.join(dir, "media", "manifest.json");
  if (!fs.existsSync(p)) return { work: "", items: [] };
  try {
    const raw = JSON.parse(fs.readFileSync(p, "utf8")) as {
      work?: string;
      items?: unknown;
    };
    if (!raw || !Array.isArray(raw.items)) return { work: "", items: [] };
    return { work: raw.work ?? "", items: raw.items as never[] };
  } catch {
    return { work: "", items: [] };
  }
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function contentType(file: string): string {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".json") return "application/json";
  return "application/octet-stream";
}

function studioPlugin(): Plugin {
  return {
    name: "opencircuit-studio",
    configureServer(server) {
      server.middlewares.use(
        (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          void handleStudioApi(req, res)
            .then((hit) => {
              if (hit) return;
              routeStatic(req, res, next);
            })
            .catch((err: unknown) => {
              const message =
                err instanceof Error ? err.message : "요청에 실패했습니다.";
              sendJson(res, 500, { ok: false, message });
            });
        },
      );
    },
  };
}

function routeStatic(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
): void {
          const url = (req.url ?? "").split("?")[0];
          if (url.startsWith("/mediapipe/wasm/")) {
            const name = path.basename(url);
            const dir = path.join(here, "node_modules/@mediapipe/tasks-vision/wasm");
            const abs = path.resolve(dir, name);
            if (!abs.startsWith(dir + path.sep) || !fs.existsSync(abs)) {
              res.statusCode = 404;
              res.end();
              return;
            }
            if (name.endsWith(".wasm")) res.setHeader("Content-Type", "application/wasm");
            else if (name.endsWith(".js") || name.endsWith(".mjs")) {
              res.setHeader("Content-Type", "text/javascript; charset=utf-8");
            }
            fs.createReadStream(abs).pipe(res);
            return;
          }
          if (url.startsWith("/vendor/")) {
            const name = path.basename(url);
            const abs = path.resolve(tfLib, name);
            if (!abs.startsWith(tfLib + path.sep) || !fs.existsSync(abs)) {
              res.statusCode = 404;
              res.end();
              return;
            }
            if (name.endsWith(".mjs") || name.endsWith(".js")) {
              res.setHeader("Content-Type", "text/javascript; charset=utf-8");
            }
            fs.createReadStream(abs).pipe(res);
            return;
          }
          if (url === "/api/works") {
            const root = worksRoot();
            const works: Array<{
              name: string;
              items: ReturnType<typeof readManifest>["items"];
            }> = [];
            if (fs.existsSync(root)) {
              for (const name of fs.readdirSync(root)) {
                if (name.startsWith(".")) continue;
                const dir = path.join(root, name);
                try {
                  if (!fs.statSync(dir).isDirectory()) continue;
                } catch {
                  continue;
                }
                const man = readManifest(dir);
                works.push({ name, items: man.items });
              }
              works.sort((a, b) => a.name.localeCompare(b.name, "ko"));
            }
            sendJson(res, 200, { root, works });
            return;
          }

          const media = /^\/work-media\/([^/]+)\/(.+)$/.exec(url);
          if (media) {
            const work = safeWorkName(media[1] ?? "");
            const file = media[2] ?? "";
            if (!work || file.includes("..") || file.includes("\\")) {
              sendJson(res, 400, { error: "잘못된 경로입니다." });
              return;
            }
            const abs = path.resolve(worksRoot(), work, "media", file);
            const allowed = path.resolve(worksRoot(), work, "media") + path.sep;
            if (!abs.startsWith(allowed) || !fs.existsSync(abs)) {
              res.statusCode = 404;
              res.end();
              return;
            }
            res.setHeader("Content-Type", contentType(abs));
            fs.createReadStream(abs).pipe(res);
            return;
          }

          next();
}

export default defineConfig({
  plugins: [react(), studioPlugin()],
  server: {
    host: "127.0.0.1",
    port: 1234,
    strictPort: true,
    fs: { allow: [repoRoot] },
  },
  resolve: {
    alias: {
      "onnxruntime-web/webgpu": path.join(tfLib, "ort.webgpu.bundle.min.mjs"),
      "onnxruntime-common": path.join(tfLib, "onnxruntime-common.js"),
    },
  },
});
