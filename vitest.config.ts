import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    fileParallelism: false,
    maxWorkers: 1,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules", "tests", "dist", "party"],
    },
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "shared"),
      "@lib": path.resolve(__dirname, "lib"),
      "@api": path.resolve(__dirname, "api"),
    },
  },
});
