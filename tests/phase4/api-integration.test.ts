import { describe, it, expect } from "vitest";

const BASE = "http://localhost:3000";

async function get(path: string, cookie?: string) {
  return fetch(`${BASE}${path}`, {
    headers: cookie ? { cookie } : {},
    credentials: "include",
  });
}

async function post(path: string, body: object, cookie?: string) {
  return fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
    credentials: "include",
  });
}

describe("Phase 4: API function integration (requires vercel dev)", () => {

  it("GET /api/health returns 200 with status ok", async () => {
    const res = await get("/api/health");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
  });

  it("GET /api/csrf-token returns a token", async () => {
    const res = await get("/api/csrf-token");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(typeof json.csrfToken).toBe("string");
    expect(json.csrfToken.length).toBeGreaterThan(10);
  });

  it("GET /api/me returns 401 when not authenticated", async () => {
    const res = await get("/api/me");
    expect(res.status).toBe(401);
  });

  it("POST /api/register → POST /api/login → GET /api/me full flow", async () => {
    const email = `test-${Date.now()}@testdomain.com`;
    const password = "Test1234!@#$";

    // Register
    const regRes = await post("/api/register", { email, password, name: "Test User" });
    expect(regRes.status).toBe(201);

    // Login
    const loginRes = await post("/api/login", { email, password });
    expect(loginRes.status).toBe(200);
    const setCookie = loginRes.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();

    // Get /api/me with session cookie
    const meRes = await get("/api/me", setCookie!);
    expect(meRes.status).toBe(200);
    const me = await meRes.json();
    expect(me.email).toBe(email);

    // Logout
    const logoutRes = await post("/api/logout", {}, setCookie!);
    expect(logoutRes.status).toBe(200);

    // /api/me should now 401
    const afterLogout = await get("/api/me", setCookie!);
    expect(afterLogout.status).toBe(401);
  });

  it("POST /api/internal/daily-cleanup requires CRON_SECRET header", async () => {
    const noAuth = await post("/api/internal/daily-cleanup", {});
    expect(noAuth.status).toBe(401);

    const withAuth = await fetch(`${BASE}/api/internal/daily-cleanup`, {
      method: "POST",
      headers: { "x-cron-secret": process.env.CRON_SECRET! },
    });
    expect(withAuth.status).toBe(200);
    const json = await withAuth.json();
    expect(json.success).toBe(true);
  });
});
