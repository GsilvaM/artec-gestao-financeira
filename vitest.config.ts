import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { config } from "dotenv";

config();

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.ts"],
    globals: true,
    exclude: ["e2e", "node_modules", "**/.opencode/**"],
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? "",
      DIRECT_URL: process.env.DIRECT_URL ?? "",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    },
    pool: "forks",
  },
});
