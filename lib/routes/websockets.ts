import { Router } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { connectionRequests as chats } from "../../shared/schema.sqlite";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

export const websocketsRouter = Router();

const WS_JWT_SECRET = process.env.WS_JWT_SECRET!;
const WS_JWT_EXPIRES_IN = "8h";

websocketsRouter.get("/ws-token", requireAuth, (req: any, res: any) => {
  const user = req.user;
  
  if (user.isBanned) {
    return res.status(403).json({ error: "Account suspended" });
  }

  const token = jwt.sign(
    {
      userId: user.id,
      name: user.name,
      isBanned: user.isBanned ?? false,
    },
    WS_JWT_SECRET,
    { expiresIn: WS_JWT_EXPIRES_IN }
  );

  res.setHeader("Cache-Control", "private, no-store");
  return res.status(200).json({ token });
});

websocketsRouter.get("/chats/:id/check-participant", async (req: any, res: any) => {
  // Only callable from PartyKit (server-to-server)
  const secret = req.headers["x-partykit-secret"];
  if (secret !== process.env.PARTYKIT_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const userId = req.headers["x-user-id"] as string;
  const chatId = req.params.id;

  if (!userId || !chatId) {
    return res.status(400).json({ error: "Missing userId or chatId" });
  }

  const [chat] = await db
    .select()
    .from(chats)
    .where(eq(chats.id, chatId));

  if (!chat) return res.status(404).json({ error: "Chat not found" });

  const isParticipant = chat.fromUserId === userId || chat.toUserId === userId;
  if (!isParticipant) return res.status(403).json({ error: "Not a participant" });

  return res.status(200).json({ ok: true });
});
