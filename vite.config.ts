/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // Project goal is >=80% coverage across the whole codebase, but most
      // files don't have tests yet this early in the build. Re-enable a
      // `thresholds` block here once coverage is being tracked project-wide
      // — turning it on now would fail every run on untested files.
    },
  },
});
