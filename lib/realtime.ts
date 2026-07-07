// Publish real-time events from Vercel API functions to PartyKit rooms

const PARTYKIT_HOST = process.env.PARTYKIT_HOST!; // e.g. findateammate.username.partykit.dev
const PARTYKIT_SECRET = process.env.PARTYKIT_SECRET!;

async function publishToRoom(
  party: "notifications" | "global" | "chat",
  roomId: string,
  payload: object
): Promise<void> {
  const url = `https://${PARTYKIT_HOST}/parties/${party}/${roomId}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-partykit-secret": PARTYKIT_SECRET,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`[Realtime] Failed to publish to ${party}/${roomId}: ${res.status}`);
    }
  } catch (err) {
    // Never throw — a realtime publish failure should not break the HTTP response
    console.error(`[Realtime] Network error publishing to ${party}/${roomId}:`, err);
  }
}

// ── Public API — mirrors old Socket.IO emit patterns exactly ──────────────────

/** Replaces: io.to(userId).emit("notification", payload) */
export async function emitNotification(userId: string, payload?: object): Promise<void> {
  await publishToRoom("notifications", userId, { type: "notification", ...(payload ?? {}) });
}

/** Replaces: io.to(fromUserId).emit("chat_updated", { chatId }) and io.to(toUserId).emit("chat_updated", ...) */
export async function emitChatUpdated(userIds: string[], chatId: string): Promise<void> {
  await Promise.all(
    userIds.map(uid => publishToRoom("notifications", uid, { type: "chat_updated", chatId }))
  );
}

/** Replaces: io.to(chatId).emit("receive_message", enrichedMessage) */
export async function emitMessage(chatId: string, enrichedMessage: object): Promise<void> {
  await publishToRoom("chat", chatId, { type: "receive_message", ...enrichedMessage });
}

/** Replaces: io.emit("maintenance_update", value) */
export async function emitMaintenance(value: boolean): Promise<void> {
  await publishToRoom("global", "global", { type: "maintenance_update", value });
}
