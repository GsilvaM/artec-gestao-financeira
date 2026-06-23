import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import financeiroHandler from "./api/financeiro";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "artec-api-financeiro-dev",
      configureServer(server) {
        server.middlewares.use("/api/financeiro", (req, res) => {
          req.url = `/api/financeiro${req.url ?? ""}`;
          void financeiroHandler(req, res);
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
