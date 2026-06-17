import { defineConfig } from "drizzle-kit";
import "dotenv/config";

import fs from "fs";
import path from "path";

const getSSLConfig = () => {
  // Use SSL for managed cloud databases.
  if (process.env.DATABASE_URL?.includes("render.com")) {
    return {
      rejectUnauthorized: false,
    };
  }

  if (process.env.DATABASE_URL?.includes("rds.amazonaws.com")) {
        const certPath = path.join(process.cwd(), "certs", "global-bundle.pem");
        if (fs.existsSync(certPath)) {
            return {
                rejectUnauthorized: true,
                ca: fs.readFileSync(certPath).toString(),
            };
        }

    // Fallback: still require SSL even when CA bundle is unavailable.
    return {
      rejectUnauthorized: false,
    };
    }
    return false;
};

const dbUrl = process.env.DATABASE_URL!;
const url = new URL(dbUrl);

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    host: url.hostname,
    port: parseInt(url.port || "5432"),
    user: url.username,
    password: decodeURIComponent(url.password), // Safe decode
    database: url.pathname.slice(1), // Remove leading /
    ssl: getSSLConfig(),
  },
});
