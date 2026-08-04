import { Server, type Connection, type ConnectionContext } from "partyserver";
import { verifyWsToken } from "./lib/auth";

export class Global extends Server {
  async onConnect(conn: Connection, ctx: ConnectionContext) {
    const url = new URL(ctx.request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      conn.close(4001, "Missing token");
      return;
    }

    const payload = await verifyWsToken(token, this.env as Record<string, unknown>);
    if (!payload) {
      conn.close(4001, "Invalid token");
      return;
    }

    // Send current maintenance state on connect
    const currentState = ((await this.ctx.storage.get("maintenance")) as boolean) ?? false;
    conn.send(JSON.stringify({ type: "maintenance_update", value: currentState }));
  }

  // Vercel API pushes maintenance state changes here
  async onRequest(request: Request): Promise<Response> {
    const secret = request.headers.get("x-partykit-secret");
    if (secret !== (this.env.PARTYKIT_SECRET as string)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }
    const { value } = await request.json() as { value: boolean };
    await this.ctx.storage.put("maintenance", value);
    this.broadcast(JSON.stringify({ type: "maintenance_update", value }));
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  onMessage() {}
  onClose() {}
  onError(conn: Connection, err: unknown) {
    console.error("[GlobalRoom] Error:", err);
  }
}
