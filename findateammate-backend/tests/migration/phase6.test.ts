import { describe, it, expect } from "vitest";
import "dotenv/config";

describe("Phase 6: TursoSessionStore contract", () => {
  const sid = "test-sid-" + Date.now();

  it("set then get returns the same session object", async () => {
    const { TursoSessionStore } = await import("../../backend/session");
    const store = new TursoSessionStore();
    const sess = { cookie: { expires: new Date(Date.now() + 60000) }, userId: "u1" };
    await new Promise<void>((res) => store.set(sid, sess as any, () => res()));
    const result = await new Promise((res) => store.get(sid, (_e, s) => res(s)));
    expect((result as any).userId).toBe("u1");
  });

  it("destroy removes the session so a subsequent get returns undefined", async () => {
    const { TursoSessionStore } = await import("../../backend/session");
    const store = new TursoSessionStore();
    await new Promise<void>((res) => store.destroy(sid, () => res()));
    const result = await new Promise((res) => store.get(sid, (_e, s) => res(s)));
    expect(result).toBeUndefined();
  });

  it("an expired session is not returned even if the row still exists", async () => {
    const { TursoSessionStore } = await import("../../backend/session");
    const store = new TursoSessionStore();
    const expiredSid = "expired-" + Date.now();
    const sess = { cookie: { expires: new Date(Date.now() - 1000) }, userId: "u2" };
    await new Promise<void>((res) => store.set(expiredSid, sess as any, () => res()));
    const result = await new Promise((res) => store.get(expiredSid, (_e, s) => res(s)));
    expect(result).toBeUndefined();
  });

  it("prune() removes only expired rows, leaves active ones intact", async () => {
    const { TursoSessionStore } = await import("../../backend/session");
    const store = new TursoSessionStore();
    const activeSid = "active-" + Date.now();
    await new Promise<void>((res) => store.set(activeSid, { cookie: { expires: new Date(Date.now() + 60000) }, userId: "u3" } as any, () => res()));
    await store.prune();
    const result = await new Promise((res) => store.get(activeSid, (_e, s) => res(s)));
    expect((result as any).userId).toBe("u3");
  });
});
