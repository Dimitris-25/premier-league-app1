// vite.config.ts
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ mode }) => {
  // φορτώνουμε όλα τα env (όχι μόνο VITE_)
  const env = loadEnv(mode, process.cwd(), "");

  const provider = String(env.VITE_AF_PROVIDER || "").toLowerCase();
  const host = String(env.VITE_AF_HOST || "");
  const isRapid = provider === "rapid" || /rapidapi/i.test(host);

  const target = isRapid
    ? "https://api-football-v1.p.rapidapi.com"
    : `https://${host || "v3.football.api-sports.io"}`;

  // RapidAPI χρειάζεται /v3 στο path
  const rewrite = (p: string) =>
    p.replace(/^\/af/, isRapid ? "/v3" : "");

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
    server: {
      proxy: {
        "/af": {
          target,
          changeOrigin: true,
          secure: true,
          rewrite,
          configure(proxy) {
            proxy.on("proxyReq", (proxyReq, req) => {
              const key = env.VITE_AF_KEY || env.VITE_API_KEY || "";
              if (isRapid) {
                proxyReq.setHeader("x-rapidapi-key", key);
                proxyReq.setHeader(
                  "x-rapidapi-host",
                  "api-football-v1.p.rapidapi.com"
                );
              } else {
                proxyReq.setHeader("x-apisports-key", key);
              }
              proxyReq.setHeader("accept", "application/json");
              proxyReq.setHeader("user-agent", "vite-proxy");

              // debug logs
              console.log(
                "[AF proxy]",
                req.method,
                proxyReq.path,
                "| key?",
                key ? "yes" : "NO"
              );
            });

            proxy.on("proxyRes", (proxyRes) => {
              console.log("[AF proxy RES]", proxyRes.statusCode);
            });
          },
        },
        "/api": {
          target: "http://localhost:3030",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
