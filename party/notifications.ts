import type { PartyKitServer, PartyKitRoom, PartyKitConnection } from "partykit/server";

export default {
  onConnect(conn: PartyKitConnection, room: PartyKitRoom) {
    conn.send(JSON.stringify({ type: "connected", roomId: room.id }));
  },
  async onMessage(message: string | ArrayBuffer | ArrayBufferView, conn: PartyKitConnection, room: PartyKitRoom) {
    const textMessage = typeof message === "string" ? message : new TextDecoder().decode(message as ArrayBuffer);
    const data = JSON.parse(textMessage);
    // Broadcast notifications to everyone else in the room
    room.broadcast(JSON.stringify(data), [conn.id]);
  },
} satisfies PartyKitServer;
