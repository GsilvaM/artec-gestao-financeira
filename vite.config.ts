import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

async function sendWebResponse(response: Response, res: { statusCode: number; setHeader: (key: string, value: string) => void; end: (body?: string | Buffer) => void }) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));

  const contentType = response.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/pdf") || contentType.includes("application/octet-stream")) {
    const responseBody = Buffer.from(await response.arrayBuffer());
    res.end(responseBody);
    return;
  }

  const responseBody = await response.text();
  res.end(responseBody);
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "artec-api-financeiro-dev",
      configureServer(server) {
        server.middlewares.use("/api/financeiro", async (req, res) => {
          try {
            const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(Buffer.from(chunk));
            }
            const body = Buffer.concat(chunks).toString();
            const headers = new Headers();
            for (const [key, value] of Object.entries(req.headers)) {
              if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
            }
            const request = new Request(url.toString(), {
              method: req.method,
              headers,
              body: body || undefined,
            });
            const { default: handler } = await import("./src/routes/api/financeiro/handler");
            const response = await handler(request);
            await sendWebResponse(response, res);
          } catch (err) {
            console.error("[api/financeiro] unhandled error:", err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Internal server error" }));
          }
        });
        server.middlewares.use("/api/admin", async (req, res) => {
          try {
            const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(Buffer.from(chunk));
            }
            const body = Buffer.concat(chunks).toString();
            const headers = new Headers();
            for (const [key, value] of Object.entries(req.headers)) {
              if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
            }
            const request = new Request(url.toString(), {
              method: req.method,
              headers,
              body: body || undefined,
            });
            const { default: handler } = await import("./src/routes/api/admin/handler");
            const response = await handler(request);
            await sendWebResponse(response, res);
          } catch (err) {
            console.error("[api/admin] unhandled error:", err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Internal server error" }));
          }
        });
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
  },
});
