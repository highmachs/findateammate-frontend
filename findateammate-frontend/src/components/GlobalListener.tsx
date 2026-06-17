import { useEffect, useRef } from "react";
import { useStore } from "@/hooks/use-store";
import { useAuth } from "@/hooks/use-auth";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Message } from "@shared/schema";
import { useAnalytics } from "@/hooks/use-analytics";

export function GlobalListener() {
    const { chats, addMessage, fetchChats, fetchNotifications } = useStore();
    const { user } = useAuth();
    const [location] = useLocation();
    const { toast } = useToast();
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const hasShownFallbackToastRef = useRef(false);
    
    // Track page views
    useAnalytics();

    // Keep a ref to the current location so handleReceiveMessage always reads
    // the latest path WITHOUT adding `location` as a socket-effect dependency
    // (adding it caused the entire socket setup to tear down and rebuild on every
    //  route change, which is wasteful and causes listener accumulation)
    const locationRef = useRef(location);
    useEffect(() => {
        locationRef.current = location;
    }, [location]);

    // FIX BUG #3: Start fallback polling when socket fails
    const startPollingFallback = (userId: string) => {
        if (pollingIntervalRef.current) return; // Already polling
        
        console.log("[GlobalListener] Starting fallback polling every 10 seconds");
        pollingIntervalRef.current = setInterval(() => {
            fetchNotifications();
            useStore.getState().fetchRequests(userId).catch(err => 
                console.error("Polling error:", err)
            );
        }, 10000); // Poll every 10 seconds
    };

    const stopPollingFallback = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
            hasShownFallbackToastRef.current = false;
            console.log("[GlobalListener] Stopped fallback polling");
        }
    };

    // 1. Initialize Socket when user is logged in
    useEffect(() => {
        if (user?.id) {
            console.log("[GlobalListener] Connecting socket for user:", user.id);
            const socket = connectSocket();
            const userId = user.id; // Capture user.id to avoid stale closure

            // Named handler so we can remove exactly this listener in cleanup
            const handleConnect = () => {
                console.log("[GlobalListener] Socket connected!");
                stopPollingFallback(); // Stop polling if socket reconnected
                // REAL-TIME FIX: Re-join all rooms on reconnection
                const currentChats = useStore.getState().chats;
                currentChats.forEach(chat => {
                    socket.emit("join_chat", chat.id);
                });
                // FIX: Retry pending messages when connection restored
                useStore.getState().retryPendingMessages().catch(err => 
                    console.error("Failed to retry pending messages", err)
                );
            };

            const handleConnectError = (error: Error) => {
                console.error("[GlobalListener] Socket connection error:", error);
                // FIX BUG #3: Start fallback polling on socket error
                startPollingFallback(userId);
                if (!hasShownFallbackToastRef.current) {
                    hasShownFallbackToastRef.current = true;
                    toast({
                        title: "Connection Issue",
                        description: "Using fallback mode for real-time updates",
                        variant: "default",
                    });
                }
            };

            const handleDisconnect = () => {
                console.log("[GlobalListener] Socket disconnected");
                // FIX BUG #3: Start fallback polling when socket disconnects
                startPollingFallback(userId);
            };

            const handleReceiveMessage = (message: Message) => {
                console.log("[GlobalListener] Received message:", message);
                if (!message) return; // Safety check
                addMessage(message.chatId, message);

                // Use ref for location so we don't need location in this effect's deps
                const isOnChatPage = locationRef.current.startsWith(`/chat/${message.chatId}`);
                if (!isOnChatPage) {
                    toast({
                        title: `New message`,
                        description: message.text,
                    });
                }
            };
            
            const handleNotification = () => {
                console.log("[GlobalListener] Received new notification signal!");
                fetchNotifications();
                // FIX: Also refresh requests when a notification arrives (e.g. connection_request)
                if (userId) {
                    useStore.getState().fetchRequests(userId);
                }
            };

            const handleChatUpdated = (payload: { chatId: string }) => {
                console.log("[GlobalListener] Chat updated signal!", payload);
                fetchChats(userId);
            };

            socket.on("connect", handleConnect);
            socket.on("connect_error", handleConnectError);
            socket.on("disconnect", handleDisconnect);
            socket.on("receive_message", handleReceiveMessage);
            socket.on("notification", handleNotification);
            socket.on("chat_updated", handleChatUpdated);

            return () => {
                socket.off("connect", handleConnect);
                socket.off("connect_error", handleConnectError);
                socket.off("disconnect", handleDisconnect);
                socket.off("receive_message", handleReceiveMessage);
                socket.off("notification", handleNotification);
                socket.off("chat_updated", handleChatUpdated);
                stopPollingFallback();
            };
        } else {
            disconnectSocket();
            stopPollingFallback();
        }
    // Only re-run when the user changes (login/logout), NOT on every route change
    }, [user?.id, addMessage, toast, fetchNotifications, fetchChats]);

    // 2. Join Rooms
    useEffect(() => {
        const socket = getSocket();
        if (socket && socket.connected && chats.length > 0) {
            chats.forEach(chat => {
                socket.emit("join_chat", chat.id);
            });
        }
    }, [chats, user?.id]);

    // 3. Initial Fetch of chats to know what rooms to join
    useEffect(() => {
        if (user?.id) {
            fetchChats(user.id);
        }
    }, [user?.id, fetchChats]);
    
    // 4. Socket Offline Notification Listener
    useEffect(() => {
        const handleSocketOffline = (event: Event) => {
            const customEvent = event as CustomEvent;
            toast({
                title: "Connection Lost",
                description: customEvent.detail?.message || "Real-time features unavailable. Please refresh.",
                variant: "destructive",
                duration: 10000,
            });
        };
        
        window.addEventListener("socket_offline", handleSocketOffline);
        
        return () => {
            window.removeEventListener("socket_offline", handleSocketOffline);
        };
    }, [toast]);

    return null; // Headless component
}
