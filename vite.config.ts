/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}", "e2e/**/*.spec.ts"],
    exclude: ["**/node_modules/**", "**/e2e/**", "node_modules/**", "e2e/**"],
    setupFiles: ["./src/test-setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: [
        "node_modules/**",
        "e2e/**",
        "playwright.config.ts",
        "postcss.config.js",
        "tailwind.config.js",
        ".eslintrc.cjs",
        "src/main.tsx",
        "src/test-setup.ts",
        "src/utils/mockData.ts",
        "**/emscripten_fetch_worker.js",
      ],
      thresholds: {
        global: {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
    },
  },
});
