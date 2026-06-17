import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";
import { logger } from "./lib/logger";
import { sessionStore } from "./session";
import { storage } from "./storage";
import cookie from "cookie";
import signature from "cookie-signature";

export function setupSocketIO(httpServer: HttpServer) {
    const socketOrigins = [
        process.env.FRONTEND_URL,
        "https://findateammate.online",
        "https://findateammate.info",
        "http://localhost:5000",
        "http://localhost:5173"
    ].filter(Boolean) as string[];

    const io = new SocketIOServer({
        cors: {
            origin: socketOrigins,
            credentials: true,
        },
        path: "/socket.io/",
        transports: ["websocket", "polling"], // Force websocket/polling
    });

    // Attachment to httpServer
    io.attach(httpServer);

    const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-in-production";

    // Use session store directly (Proper implementation, no mocks)
    io.use((socket, next) => {
        const req = socket.request as any;
        const cookieHeader = req.headers.cookie;
        
        // FIX #35: More lenient session validation for socket.io
        // Log detailed error for debugging
        if (!cookieHeader) {
            logger.log(`[Socket] No cookies for ${socket.id} - may be first connection`, "socket.io");
            // Don't fail immediately - let the next middleware handle auth failure
            return next();
        }

        const cookies = cookie.parse(cookieHeader);
        const signedSessionId = cookies['connect.sid'];
        
        if (!signedSessionId) {
            logger.log(`[Socket] No connect.sid for ${socket.id}`, "socket.io");
            return next();
        }

        // SID is usually prefixed with 's:' in express-session
        const rawSid = signedSessionId.startsWith('s:') ? signedSessionId.slice(2) : signedSessionId;
        const sessionId = signature.unsign(rawSid, SESSION_SECRET);

        if (sessionId === false) {
            logger.log(`[Socket] Invalid session signature for ${socket.id}`, "socket.io");
            return next();
        }

        sessionStore.get(sessionId, (err, session) => {
            if (err) {
                logger.error(`[Socket] Session store error for ${socket.id}`, err);
                return next(); // Continue but without session
            }
            if (session) {
                req.session = session;
            }
            next();
        });
    });

    // Maintenance Mode Guard
    io.use(async (socket, next) => {
        try {
            const setting = await storage.getSystemSetting('maintenance_mode');
            if (setting && setting.value) {
                const { enabled, mode } = setting.value as any;
                if (enabled && mode === 'FULL') {
                    // Check if user is admin
                    // Note: session is populated by previous middleware
                    const session = (socket.request as any).session;
                    if (session?.userId) {
                        // We need to fetch user to check isAdmin because session only has userId
                        const user = await storage.getUser(session.userId);
                        if (user?.isAdmin) return next();
                    }
                    return next(new Error("System is in maintenance mode."));
                }
            }
            next();
        } catch (err) {
            logger.error("Socket maintenance check error", err);
            next(); // Fail open
        }
    });

    io.on("connection", async (socket) => {
        const session = (socket.request as any).session;
        // BUG #32 FIX: Passport (OAuth) stores userId as session.passport.user,
        // while manual login stores it as session.userId. Check both.
        const userId = session?.userId || session?.passport?.user;

        if (!userId) {
            logger.log(`[Socket] Unauthorized socket attempt: ${socket.id} - no userId in session`, "socket.io");
            socket.disconnect(true);
            return;
        }

        // BUG #8 FIX: Check if user is banned before allowing socket connection
        const user = await storage.getUser(userId);
        if (user?.isBanned && !user?.isAdmin) {
            logger.log(`[Socket] Banned user ${userId} attempted socket connection: ${socket.id}`, "socket.io");
            socket.disconnect(true);
            return;
        }

        // BUG #35: Log successful connections with details
        logger.log(`[Socket] User ${userId} connected via socket ${socket.id}`, "socket.io");

        // BUG #33 FIX: Join a personal room named by userId so that
        // io.to(userId).emit(...) in route handlers actually reaches this socket.
        // Without this, all notification/chat_updated emits silently drop.
        socket.join(userId);

        logger.log(`Socket connected: ${socket.id} (User: ${userId})`, "socket.io");

        // Join a chat room
        socket.on("join_chat", async (chatId: string) => {
            try {
                // Bug Fix: Verify the user is part of this chat
                const request = await storage.getConnectionRequest(chatId);
                if (!request || request.status !== "accepted") {
                    socket.emit("error", { message: "Chat not found or not accepted" });
                    return;
                }
                if (request.fromUserId !== userId && request.toUserId !== userId) {
                    logger.log(`Unauthorized room join attempt: user ${userId} for chat ${chatId}`, "socket.io");
                    socket.emit("error", { message: "Unauthorized: You are not a participant in this chat" });
                    return;
                }

                socket.join(chatId);
                logger.log(`Socket ${socket.id} joined chat: ${chatId}`, "socket.io");
                socket.emit("join_success", { chatId });
            } catch (error) {
                logger.error("Socket join_chat error", error);
                socket.emit("error", { message: "Failed to join chat" });
            }
        });

        socket.on("leave_chat", (chatId: string) => {
             socket.leave(chatId);
             logger.log(`Socket ${socket.id} left chat: ${chatId}`, "socket.io");
        });

        // FIX BUG #15: Add disconnect cleanup
        socket.on("disconnect", () => {
            logger.log(`Socket disconnected: ${socket.id}`, "socket.io");
            // Cleanup: Leave all rooms
            socket.rooms.forEach(roomId => {
                if (roomId !== socket.id) {
                    socket.leave(roomId);
                }
            });
        });
    });

    return io;
}
