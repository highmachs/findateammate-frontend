import type { PartyKitServer, PartyKitRoom, PartyKitConnection } from "partykit/server";

export default {
  onConnect(conn: PartyKitConnection, room: PartyKitRoom) {
    conn.send(JSON.stringify({ type: "connected", roomId: room.id }));
  },
} satisfies PartyKitServer;
