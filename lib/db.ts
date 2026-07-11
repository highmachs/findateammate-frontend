import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../shared/schema.sqlite";

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  throw new Error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set.");
}

const dbUrl = process.env.TURSO_DATABASE_URL.replace(/^libsql:\/\//, "https://");

// Serverless-safe: HTTP-based Turso client. No persistent connections,
// no setInterval, no process signal handlers. Each function invocation
// gets its own lightweight client that communicates over HTTP.
export const tursoClient = createClient({
  url: dbUrl,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(tursoClient, { schema });
