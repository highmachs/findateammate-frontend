import type * as Party from "partykit/server";
import { verifyWsToken } from "./lib/auth";

export default class Notifications implements Party.Server {
  env: Record<string, unknown>;
  name: string;

  constructor(public room: Party.Room) {
    this.env = room.env as Record<string, unknown>;
    this.name = room.id;
  }

  broadcast(msg: string) {
    this.room.broadcast(msg);
  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    const url = new URL(ctx.request.url);
    const token = url.searchParams.get("token");

    // Allow publisher connections from Vercel API (secret header, no token)
    const secret = ctx.request.headers.get("x-partykit-secret");
    if (secret && secret === ((this as any).env.PARTYKIT_SECRET as string)) {
      return; // Authorized publisher
    }

    if (!token) {
      conn.close(4001, "Unauthorized");
      return;
    }

    const payload = await verifyWsToken(token, this.env as Record<string, unknown>);
    if (!payload) {
      conn.close(4001, "Invalid token");
      return;
    }

    // Confirm the user can only listen to their OWN notification room
    if (payload.userId !== this.name) {
      conn.send(JSON.stringify({ type: "error", message: "Room mismatch" }));
      conn.close(4003, "Forbidden");
      return;
    }

    console.log(`[NotificationRoom] User ${payload.userId} listening on room ${this.name}`);
  }

  // Vercel API calls this room's HTTP endpoint to push events to the user
  async onRequest(request: Request): Promise<Response> {
    const secret = request.headers.get("x-partykit-secret");
    if (secret !== (this.env.PARTYKIT_SECRET as string)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const body = await request.json() as any;
    this.broadcast(JSON.stringify(body));
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  onMessage() {}
  onClose() {}
  onError(conn: Party.Connection, err: unknown) {
    console.error("[NotificationRoom] Error:", err);
  }
}
