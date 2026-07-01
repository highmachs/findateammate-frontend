import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { io as ioClient } from "socket.io-client";
import { sessionStore } from "../../backend/session";
import { db } from "../../backend/db";
import { users, posts, connectionRequests } from "../../shared/schema.sqlite";
import signature from "cookie-signature";

const SESSION_SECRET = process.env.SESSION_SECRET || "d6b3f92a1c0e4b8d7f5c2a1b3e9d8f7a6c5b4a3d2e1f0a9b8c7d6e5f4g3h2i1j";

function createSignedCookie(sid: string) {
  return "connect.sid=s%3A" + encodeURIComponent(signature.sign(sid, SESSION_SECRET));
}

describe("Phase 8: Socket.IO chat against Turso-backed storage", () => {
  it("a message sent by client A is received by client B and persisted in Turso", async () => {
    // 1. Create test users
    const userA = "socket-userA-" + Date.now();
    const userB = "socket-userB-" + Date.now();
    const postId = "socket-post-" + Date.now();
    const chatId = "socket-chat-" + Date.now(); // chatId is connectionRequest ID

    await db.insert(users).values([
      { id: userA, username: userA, name: "User A", email: userA + "@test.com", bio: "", portfolio: "", github: "", department: "CS", city: "London", university: "UCL", skills: ["TypeScript"] },
      { id: userB, username: userB, name: "User B", email: userB + "@test.com", bio: "", portfolio: "", github: "", department: "CS", city: "London", university: "UCL", skills: ["TypeScript"] }
    ]).onConflictDoNothing();

    await db.insert(posts).values({
      id: postId, userId: userA, userName: "User A", userSkill: "Beginner", title: "Chat Post", description: "Chat testing", skillsOffered: [], skillsWanted: [], availability: "Flexible", city: "Remote"
    }).onConflictDoNothing();

    await db.insert(connectionRequests).values({
      id: chatId, postId, postTitle: "Chat Post", fromUserId: userB, fromUserName: "User B", fromUserSkill: "Beginner", toUserId: userA, toUserName: "User A", status: "accepted"
    }).onConflictDoNothing();

    // 2. Create sessions
    const sidA = "test-session-A-" + Date.now();
    const sidB = "test-session-B-" + Date.now();
    
    await new Promise<void>((resolve) => sessionStore.set(sidA, { cookie: { maxAge: 86400000 }, userId: userA }, () => resolve()));
    await new Promise<void>((resolve) => sessionStore.set(sidB, { cookie: { maxAge: 86400000 }, userId: userB }, () => resolve()));

    // 3. Connect clients
    const clientA = ioClient("http://localhost:5000", { extraHeaders: { Cookie: createSignedCookie(sidA) } });
    const clientB = ioClient("http://localhost:5000", { extraHeaders: { Cookie: createSignedCookie(sidB) } });

    // Wait for connection
    await new Promise<void>((resolve) => clientA.on("connect", resolve));
    await new Promise<void>((resolve) => clientB.on("connect", resolve));

    // Both clients join the chat room
    clientA.emit("join_chat", chatId);
    clientB.emit("join_chat", chatId);
    await new Promise<void>((resolve) => clientB.on("join_success", resolve));

    // 4. Send message via HTTP POST
    const received = new Promise((resolve) => clientB.on("receive_message", resolve));
    
    // Fetch CSRF token first
    const csrfRes = await fetch("http://localhost:5000/api/csrf-token", {
      headers: { "Cookie": createSignedCookie(sidA) }
    });
    const { csrfToken } = await csrfRes.json();
    
    // Extract x-csrf-token cookie
    const setCookie = csrfRes.headers.get("set-cookie");
    const csrfCookie = setCookie ? setCookie.split(";")[0] : "";

    const response = await fetch(`http://localhost:5000/api/chats/${chatId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `${createSignedCookie(sidA)}; ${csrfCookie}`,
        "x-csrf-token": csrfToken
      },
      body: JSON.stringify({ text: "hello from turso" })
    });
    
    const responseText = await response.text();
    if (response.status !== 200) {
      console.error("HTTP POST failed with 403:", responseText);
    }
    expect(response.status).toBe(200);

    // 5. Verify receipt
    const msg: any = await received;
    expect(msg.text).toBe("hello from turso");

    const { eq } = await import("drizzle-orm");
    const { messages } = await import("../../shared/schema.sqlite");
    const [persisted] = await db.select().from(messages).where(eq(messages.id, msg.id));
    expect(persisted?.text).toBe("hello from turso");

    clientA.disconnect(); clientB.disconnect();
  });
});

describe("Phase 8: audit-scheduler runs correctly against Turso", () => {
  it("manually triggering the export produces correct output sourced from Turso data", async () => {
    // 1. Insert a mock audit log into Turso
    const { db } = await import("../../backend/db");
    const { auditLogs } = await import("../../shared/schema.sqlite");
    
    await db.insert(auditLogs).values({
      action: "TEST_EXPORT",
      resource: "Phase 8 Verification",
      userId: "test-admin",
      userName: "Admin",
      details: { phase: 8 }
    });

    // 2. Run the export
    const { exportAuditLogsToCSV } = await import("../../backend/lib/audit-scheduler");
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 1); // Tomorrow
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1); // Yesterday
    
    const resultCsv = await exportAuditLogsToCSV(startDate, endDate);
    
    // 3. Verify the mock log is in the CSV
    expect(resultCsv).toContain("TEST_EXPORT");
    expect(resultCsv).toContain("Phase 8 Verification");
  });
});
