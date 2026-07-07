import PartySocket from "partysocket";

// Three separate connection types, one client-side manager
let chatSocket: PartySocket | null = null;
let notificationSocket: PartySocket | null = null;
let globalSocket: PartySocket | null = null;
let currentChatRoom: string | null = null;
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

const PARTYKIT_HOST = import.meta.env.VITE_PARTYKIT_HOST || "localhost:1999";

// ─── Token management ───────────────────────────────────────────────────────

async function getWsToken(): Promise<string | null> {
  // Reuse token if still valid (> 60s remaining)
  if (cachedToken && Date.now() < tokenExpiry - 60_000) return cachedToken;

  try {
    const res = await fetch("/api/ws-token", { credentials: "include" });
    if (!res.ok) return null;
    const { token } = await res.json();
    // Decode expiry from JWT payload (base64 middle segment)
    const payload = JSON.parse(atob(token.split(".")[1]));
    cachedToken = token;
    tokenExpiry = payload.exp * 1000;
    return token;
  } catch {
    return null;
  }
}

// ─── Notification socket (per-user room) ────────────────────────────────────

export async function connectNotificationSocket(userId: string): Promise<void> {
  if (notificationSocket) return; // Already connected
  const token = await getWsToken();
  if (!token) return;

  notificationSocket = new PartySocket({
    host: PARTYKIT_HOST,
    party: "notifications",
    room: userId, // Room = userId (private per-user room)
    query: { token },
  });

  notificationSocket.addEventListener("error", handleGlobalError);
  notificationSocket.addEventListener("close", (evt) => {
    if (evt.code !== 1000) { // Non-clean close = reconnect
      console.warn("[PartySocket/notifications] Closed unexpectedly, will reconnect");
    }
  });
}

export function getNotificationSocket(): PartySocket | null {
  return notificationSocket;
}

// ─── Global socket (maintenance_update) ─────────────────────────────────────

export async function connectGlobalSocket(): Promise<void> {
  if (globalSocket) return;
  const token = await getWsToken();
  if (!token) return;

  globalSocket = new PartySocket({
    host: PARTYKIT_HOST,
    party: "global",
    room: "global",
    query: { token },
  });
  globalSocket.addEventListener("error", handleGlobalError);
}

export function getGlobalSocket(): PartySocket | null {
  return globalSocket;
}

// ─── Chat socket (per-chat room) ─────────────────────────────────────────────
// These map to the old connectSocket() / getSocket() / disconnectSocket() signatures
// so Chat.tsx and GlobalListener.tsx work without modification.

export async function connectSocket(chatId?: string): Promise<any> {
  // If no chatId given, return existing socket (GlobalListener.tsx calls this without chatId)
  if (!chatId && chatSocket) return chatSocket;

  const token = await getWsToken();
  if (!token) {
    window.dispatchEvent(new CustomEvent("socket_offline", {
      detail: { message: "Could not authenticate WebSocket connection." }
    }));
    return null;
  }

  // If switching rooms, close the old socket first
  if (chatId && chatId !== currentChatRoom && chatSocket) {
    chatSocket.close();
    chatSocket = null;
  }

  if (!chatSocket) {
    currentChatRoom = chatId || null;
    chatSocket = new PartySocket({
      host: PARTYKIT_HOST,
      party: "chat",
      room: chatId || "lobby",
      query: { token },
    });

    // Wrap PartySocket to mimic Socket.IO's .on()/.off()/.emit() API
    // so Chat.tsx and GlobalListener.tsx compile without any changes
    return createSocketIOCompatWrapper(chatSocket, chatId || null);
  }

  return createSocketIOCompatWrapper(chatSocket, chatId || null);
}

export function getSocket(): any {
  if (!chatSocket) return null;
  return createSocketIOCompatWrapper(chatSocket, currentChatRoom);
}

export function disconnectSocket(): void {
  if (chatSocket) { chatSocket.close(); chatSocket = null; currentChatRoom = null; }
  if (notificationSocket) { notificationSocket.close(); notificationSocket = null; }
  if (globalSocket) { globalSocket.close(); globalSocket = null; }
  cachedToken = null;
  tokenExpiry = 0;
}

// ─── Socket.IO compatibility shim ────────────────────────────────────────────
// Chat.tsx and GlobalListener.tsx use socket.on(), socket.off(), socket.emit()
// PartySocket is a plain WebSocket — this shim bridges the two APIs

function createSocketIOCompatWrapper(ws: PartySocket, chatId: string | null) {
  const listeners = new Map<string, Set<Function>>();

  // Forward raw WS messages to the correct .on() listeners
  const messageHandler = (evt: MessageEvent) => {
    try {
      const data = JSON.parse(evt.data);
      const type = data.type;
      if (!type) return;
      const fns = listeners.get(type);
      if (fns) {
        // Strip the `type` field before passing to listener — matches Socket.IO payload shape
        const { type: _, ...payload } = data;
        fns.forEach(fn => fn(Object.keys(payload).length === 0 ? undefined : payload));
      }
    } catch {}
  };

  ws.addEventListener("message", messageHandler);

  return {
    // connected state
    get connected() { return ws.readyState === WebSocket.OPEN; },

    // Socket.IO-style .on()
    on(event: string, fn: Function) {
      if (event === "connect") {
        ws.addEventListener("open", fn as any);
      } else if (event === "disconnect") {
        ws.addEventListener("close", fn as any);
      } else if (event === "connect_error") {
        ws.addEventListener("error", fn as any);
      } else {
        if (!listeners.has(event)) listeners.set(event, new Set());
        listeners.get(event)!.add(fn);
      }
    },

    // Socket.IO-style .off()
    off(event: string, fn: Function) {
      if (event === "connect") {
        ws.removeEventListener("open", fn as any);
      } else if (event === "disconnect") {
        ws.removeEventListener("close", fn as any);
      } else if (event === "connect_error") {
        ws.removeEventListener("error", fn as any);
      } else {
        listeners.get(event)?.delete(fn);
      }
    },

    // Socket.IO-style .emit() → sends JSON to PartyKit server
    emit(event: string, ...args: any[]) {
      if (ws.readyState !== WebSocket.OPEN) {
        console.warn(`[SocketShim] Cannot emit "${event}" — socket not open`);
        return;
      }
      if (event === "join_chat") {
        // join_chat is implicit in PartyKit (room is set at connect time)
        // Send it anyway as a message so the server can validate participation
        ws.send(JSON.stringify({ type: "join_chat", chatId: args[0] }));
      } else if (event === "leave_chat") {
        ws.send(JSON.stringify({ type: "leave_chat", chatId: args[0] }));
      } else if (event === "send_message") {
        ws.send(JSON.stringify({ type: "send_message", ...args[0] }));
      } else {
        ws.send(JSON.stringify({ type: event, ...args[0] }));
      }
    },

    // Cleanup
    removeAllListeners() { listeners.clear(); },
    close() { ws.close(); },
  };
}

// ─── GlobalListener compatibility ────────────────────────────────────────────
// GlobalListener calls connectSocket() without a chatId on initial mount.
// This returns the notification + global sockets wrapped in the same interface.

function handleGlobalError() {
  window.dispatchEvent(new CustomEvent("socket_offline", {
    detail: { message: "Real-time connection lost. You can still use the app but messages may not sync instantly. Please refresh the page." }
  }));
}
