import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Vite 6 은 Host 헤더가 낯설면 요청을 막는다 (DNS 리바인딩 방어).
// Tailscale MagicDNS 이름으로 들어오려면 그 이름을 허용 목록에 넣어야 한다.
// web.sh --tailscale 이 OC_ALLOWED_HOSTS 를 채워 준다. 평소에는 비어 있다.
const allowedHosts = (process.env.OC_ALLOWED_HOSTS ?? "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    ...(allowedHosts.length > 0 ? { allowedHosts } : {}),
  },
});
