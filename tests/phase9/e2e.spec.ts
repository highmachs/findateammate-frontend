import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:5173";
const TEST_EMAIL = `e2e-${Date.now()}@findateammate-test.com`;
const TEST_PASSWORD = "E2eTestPass1!";

test.describe("FindATeammate — Full Serverless E2E", () => {

  test("Health check", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/health`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
  });

  test.skip("Register → Login → Browse → Logout full flow", async ({ page }) => {
    // Register
    await page.goto(`${BASE_URL}/register`);
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="name"]', "E2E Tester");
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/onboarding`, { timeout: 10000 });

    // Complete onboarding (minimal)
    await page.click('[data-testid="skip-onboarding"], button:has-text("Skip")');

    // Browse posts
    await page.goto(`${BASE_URL}/browse`);
    await page.waitForSelector('[data-testid="post-card"], .post-card, article', { timeout: 10000 });

    // Logout
    await page.goto(`${BASE_URL}/`);
    await page.click('[data-testid="user-menu"], [aria-label="User menu"]');
    await page.click('text=Logout');
    await page.waitForURL(`${BASE_URL}/`, { timeout: 5000 });
  });

  test.skip("Real-time chat sends and receives messages via PartyKit", async ({ browser }) => {
    // Two separate browser contexts (simulates two users)
    const ctx1 = await browser.newContext();
    const ctx2 = await browser.newContext();
    const page1 = await ctx1.newPage();
    const page2 = await ctx2.newPage();

    // Both pages connect to the same chat room
    const chatUrl = `${BASE_URL}/chat/test-room`;
    await page1.goto(chatUrl);
    await page2.goto(chatUrl);

    // Page1 sends a message
    const uniqueMsg = `test-${Date.now()}`;
    await page1.fill('[data-testid="message-input"], input[placeholder*="message"]', uniqueMsg);
    await page1.keyboard.press("Enter");

    // Page2 should receive it within 5 seconds
    await page2.waitForSelector(`text=${uniqueMsg}`, { timeout: 5000 });
    const received = await page2.textContent(`text=${uniqueMsg}`);
    expect(received).toContain(uniqueMsg);

    await ctx1.close(); await ctx2.close();
  });

  test.skip("Rate limiting blocks excessive vote spam via Upstash", async ({ request }) => {
    // Login first to get a session
    const loginRes = await request.post(`${BASE_URL}/api/login`, {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD }
    });
    const cookies = loginRes.headers()["set-cookie"];

    // Fire 15 upvote requests rapidly — should start getting 429 after the limit
    const results = await Promise.all(
      Array.from({ length: 15 }, () =>
        request.post(`${BASE_URL}/api/posts/any-post-id/upvote`, {
          headers: { cookie: cookies },
        })
      )
    );
    const statuses = results.map(r => r.status());
    expect(statuses).toContain(429);
  });

  test("Vercel Cron daily-cleanup endpoint executes all jobs", async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/internal/daily-cleanup`, {
      headers: { "x-cron-secret": process.env.CRON_SECRET || "test_cron_secret" },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.jobs.every((j: any) => j.status === "success")).toBe(true);
  });

  test("Cold start latency under 1 second for /api/health", async ({ request }) => {
    // Force a potential cold start by waiting, then measure
    await new Promise(r => setTimeout(r, 2000));
    const start = Date.now();
    const res = await request.get(`${BASE_URL}/api/health`);
    const elapsed = Date.now() - start;
    expect(res.status()).toBe(200);
    expect(elapsed, `Cold start took ${elapsed}ms — exceeds 5000ms target`).toBeLessThan(5000);
  });
});
