import type { PartyKitServer, PartyKitRoom, PartyKitConnection } from "partykit/server";

export default {
  onConnect(conn: PartyKitConnection, room: PartyKitRoom) {
    console.log("Connected to room", room.id);
    conn.send(JSON.stringify({ type: "connected", roomId: room.id }));
  },
  async onMessage(message: string | ArrayBuffer | ArrayBufferView, conn: PartyKitConnection, room: PartyKitRoom) {
    const textMessage = typeof message === "string" ? message : new TextDecoder().decode(message as ArrayBuffer);
    console.log("Received msg:", textMessage);
    const data = JSON.parse(textMessage);
    // Broadcast to all OTHER connections in the room
    room.broadcast(JSON.stringify(data), [conn.id]);
    // If it's a real message, persist via Vercel API
    if (data.type === "message" && data.chatId && data.content) {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/chats/${data.chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-partykit-secret": process.env.PARTYKIT_SECRET || "dev-secret" },
        body: JSON.stringify({ content: data.content, senderId: data.senderId }),
      }).catch(err => console.error("Failed to persist message", err));
    }
  },
  onClose(conn: PartyKitConnection, room: PartyKitRoom) {},
} satisfies PartyKitServer;
