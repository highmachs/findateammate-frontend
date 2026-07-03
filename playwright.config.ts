import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/phase9",
  timeout: 120000,
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    headless: true,
  },
  webServer: [
    { command: "npm run dev:api", port: 3000, reuseExistingServer: false, timeout: 120000 },
    { command: "npm run build && npx vite preview --port 5173", port: 5173, reuseExistingServer: false, timeout: 120000 },
    { command: "npm run dev:ws", port: 1999, reuseExistingServer: false, timeout: 120000 },
  ],
});
