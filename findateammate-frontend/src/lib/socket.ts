import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const connectSocket = () => {
    if (!socket) {
        // VITE_API_URL is intentionally empty on Vercel (HTTP uses rewrites),
        // but WebSocket upgrades CANNOT be proxied by Vercel rewrites.
        // The socket MUST connect directly to the Render backend.
        // Priority: VITE_SOCKET_URL → VITE_API_URL → Render backend (prod) → undefined (dev)
        const url =
            import.meta.env.VITE_SOCKET_URL ||
            import.meta.env.VITE_API_URL ||
            (import.meta.env.PROD ? "https://findateammate-rpqh.onrender.com" : undefined);

        socket = io(url, {
            path: "/socket.io/",
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
            reconnectionDelayMax: 10000,
            // FIX #34: Polling fallback for cross-origin session cookie transmission
            transports: ["websocket", "polling"],
        });

        // When all reconnection attempts are exhausted, clear the dead socket reference
        // so that connectSocket() can create a fresh one on next call (e.g., after page focus).
        socket.on("reconnect_failed", () => {
            console.warn("[Socket] Reconnection failed after max attempts. Clearing socket.");
            // FIX #15: Notify user of connection failure
            window.dispatchEvent(new CustomEvent("socket_offline", { 
                detail: { message: "Real-time connection lost. You can still use the app but messages may not sync instantly. Please refresh the page." }
            }));
            socket?.removeAllListeners();
            socket = null;
        });

        // FIX #34: Better error logging for debugging session/auth issues
        socket.on("connect_error", (error: any) => {
            console.error("[Socket] Connection error:", {
                message: error?.message,
                data: error?.data?.message,
                type: typeof error,
            });
        });
    }
    return socket;
};

export const getSocket = () => {
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
    }
};
