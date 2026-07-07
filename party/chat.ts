import { Server, type Connection, type ConnectionContext } from "partyserver";
import { verifyWsToken } from "./lib/auth";

// Each instance = one chat room (room name = chatId)
export class ChatRoom extends Server {
  private connectionUsers = new Map<string, string>();

  async onConnect(conn: Connection, ctx: ConnectionContext) {
    const url = new URL(ctx.request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      conn.send(JSON.stringify({ type: "error", message: "Missing auth token" }));
      conn.close(4001, "Unauthorized");
      return;
    }

    const payload = await verifyWsToken(token);
    if (!payload) {
      conn.send(JSON.stringify({ type: "error", message: "Invalid or expired token" }));
      conn.close(4001, "Unauthorized");
      return;
    }

    if (payload.isBanned) {
      conn.send(JSON.stringify({ type: "error", message: "Account suspended" }));
      conn.close(4003, "Forbidden");
      return;
    }

    const userId = payload.userId;
    const chatId = this.name; // room name = chatId

    // Validate that this user is actually a participant in this chat
    const apiUrl = this.env.VERCEL_API_URL as string || "";
    try {
      const checkRes = await fetch(`${apiUrl}/api/chats/${chatId}/check-participant`, {
        headers: {
          "x-partykit-secret": this.env.PARTYKIT_SECRET as string,
          "x-user-id": userId,
        },
      });

      if (!checkRes.ok) {
        conn.send(JSON.stringify({ type: "error", message: "Unauthorized: Not a chat participant" }));
        conn.close(4003, "Forbidden");
        return;
      }
    } catch (err) {
      console.warn("[ChatRoom] Could not verify participant — failing open:", err);
    }

    this.connectionUsers.set(conn.id, userId);
    conn.send(JSON.stringify({ type: "join_success", chatId }));
    console.log(`[ChatRoom] User ${userId} joined room ${chatId}`);
  }

  async onMessage(conn: Connection, message: string) {
    const userId = this.connectionUsers.get(conn.id);
    if (!userId) {
      conn.send(JSON.stringify({ type: "error", message: "Not authenticated" }));
      return;
    }

    let data: any;
    try {
      data = JSON.parse(message);
    } catch {
      conn.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
      return;
    }

    if (data.type === "send_message") {
      const { content, tempId } = data;
      if (!content?.trim()) {
        conn.send(JSON.stringify({ type: "error", message: "Empty message" }));
        return;
      }

      const apiUrl = this.env.VERCEL_API_URL as string || "";
      try {
        const saveRes = await fetch(`${apiUrl}/api/chats/${this.name}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-partykit-secret": this.env.PARTYKIT_SECRET as string,
            "x-user-id": userId,
          },
          body: JSON.stringify({ content: content.trim() }),
        });

        if (!saveRes.ok) {
          conn.send(JSON.stringify({ type: "error", message: "Failed to save message", tempId }));
          return;
        }

        const enrichedMessage = await saveRes.json();
        this.broadcast(JSON.stringify({ type: "receive_message", ...enrichedMessage }));
      } catch (err) {
        console.error("[ChatRoom] Failed to persist message:", err);
        conn.send(JSON.stringify({ type: "error", message: "Network error saving message", tempId }));
      }
    }
  }

  onClose(conn: Connection) {
    const userId = this.connectionUsers.get(conn.id);
    this.connectionUsers.delete(conn.id);
    console.log(`[ChatRoom] Connection ${conn.id} (user ${userId}) closed`);
  }

  onError(conn: Connection, err: unknown) {
    console.error(`[ChatRoom] Error on ${conn.id}:`, err);
    this.connectionUsers.delete(conn.id);
  }

  // HTTP endpoint: Vercel API posts messages here for broadcast
  async onRequest(request: Request): Promise<Response> {
    const secret = request.headers.get("x-partykit-secret");
    if (secret !== (this.env.PARTYKIT_SECRET as string)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }
    const body = await request.json() as any;
    this.broadcast(JSON.stringify(body));
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }
}
