import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../../lib/db";
import { chats } from "@shared/schema.sqlite";
import { eq } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only callable from PartyKit (server-to-server)
  const secret = req.headers["x-partykit-secret"];
  if (secret !== process.env.PARTYKIT_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const userId = req.headers["x-user-id"] as string;
  const chatId = req.query.id as string;

  if (!userId || !chatId) {
    return res.status(400).json({ error: "Missing userId or chatId" });
  }

  const [chat] = await db
    .select()
    .from(chats)
    .where(eq(chats.id, chatId));

  if (!chat) return res.status(404).json({ error: "Chat not found" });

  const isParticipant = chat.user1Id === userId || chat.user2Id === userId;
  if (!isParticipant) return res.status(403).json({ error: "Not a participant" });

  return res.status(200).json({ ok: true });
}
