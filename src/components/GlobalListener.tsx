import { useEffect, useRef } from "react";
import { useStore } from "@/hooks/use-store";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Message } from "@shared/schema";
import { useAnalytics } from "@/hooks/use-analytics";
import { connectSocket, disconnectSocket, getSocket, connectNotificationSocket, getNotificationSocket, connectGlobalSocket, getGlobalSocket } from "@/lib/socket";
export function GlobalListener() {
    const { chats, addMessage, fetchChats, fetchNotifications } = useStore();
    const { user } = useAuth();
    const [location] = useLocation();
    const { toast } = useToast();
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const hasShownFallbackToastRef = useRef(false);
    
    useAnalytics();

    const locationRef = useRef(location);
    useEffect(() => {
        locationRef.current = location;
    }, [location]);

    const startPollingFallback = (userId: string) => {
        if (pollingIntervalRef.current) return;
        
        console.log("[GlobalListener] Starting fallback polling");
        pollingIntervalRef.current = setInterval(() => {
            fetchNotifications();
            useStore.getState().fetchRequests(userId).catch(err => 
                console.error("Polling error:", err)
            );
        }, 10000);
    };

    const stopPollingFallback = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
            hasShownFallbackToastRef.current = false;
        }
    };

    useEffect(() => {
        if (user?.id) {
            const userId = user.id;

            // Connect chat socket (for general presence, if needed)
            const socket = connectSocket();
            
            // Connect notification and global sockets alongside chat socket
            connectNotificationSocket(userId);
            connectGlobalSocket();

            const handleOpen = () => {
                console.log("[GlobalListener] Chat socket connected!");
                stopPollingFallback();
                useStore.getState().retryPendingMessages().catch(err => 
                    console.error("Failed to retry pending messages", err)
                );
            };

            const handleClose = () => {
                console.log("[GlobalListener] Socket disconnected");
                startPollingFallback(userId);
            };

            const handleError = () => {
                console.error("[GlobalListener] Socket connection error");
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

            const handleMessage = (data: any) => {
                try {
                    if (data?.type === "receive_message") {
                        const message: Message = data;
                        addMessage(message.chatId, message);
                        const isOnChatPage = locationRef.current.startsWith(`/chat/${message.chatId}`);
                        if (!isOnChatPage) {
                            toast({ title: `New message`, description: message.text });
                        }
                    }
                } catch (e) {
                    console.error("Failed to parse GlobalListener message", e);
                }
            };

            // Hook up chat socket listeners (Socket.IO compat wrapper)
            const currentSocket = getSocket();
            if (currentSocket) {
                currentSocket.on("connect", handleOpen);
                currentSocket.on("disconnect", handleClose);
                currentSocket.on("connect_error", handleError);
                currentSocket.on("receive_message", (data: any) => handleMessage({ type: "receive_message", ...data }));
            }

            // Inside the useEffect that runs on user?.id, after socket setup:
            const notifSocket = getNotificationSocket();
            if (notifSocket) {
                const notifHandler = (evt: MessageEvent) => {
                    try {
                        const data = JSON.parse(evt.data);
                        if (data.type === "notification") {
                            console.log("[GlobalListener] Received new notification signal!");
                            fetchNotifications();
                            if (userId) useStore.getState().fetchRequests(userId);
                        } else if (data.type === "chat_updated") {
                            fetchChats(userId);
                        }
                    } catch {}
                };
                notifSocket.addEventListener("message", notifHandler);
                
                // Store handler for cleanup
                (notifSocket as any)._notifHandler = notifHandler;
            }

            const globalSock = getGlobalSocket();
            if (globalSock) {
                const globalHandler = (evt: MessageEvent) => {
                    try {
                        const data = JSON.parse(evt.data);
                        if (data.type === "maintenance_update") {
                            window.dispatchEvent(new CustomEvent("maintenance_update", { detail: { value: data.value } }));
                        }
                    } catch {}
                };
                globalSock.addEventListener("message", globalHandler);
                (globalSock as any)._globalHandler = globalHandler;
            }

            return () => {
                const currentSocket = getSocket();
                if (currentSocket) {
                    currentSocket.off("connect", handleOpen);
                    currentSocket.off("disconnect", handleClose);
                    currentSocket.off("connect_error", handleError);
                    // note: we don't call disconnectSocket() here because we want sockets to persist across route changes
                }
                
                const notif = getNotificationSocket();
                if (notif && (notif as any)._notifHandler) {
                    notif.removeEventListener("message", (notif as any)._notifHandler);
                }
                
                const glob = getGlobalSocket();
                if (glob && (glob as any)._globalHandler) {
                    glob.removeEventListener("message", (glob as any)._globalHandler);
                }
                
                stopPollingFallback();
            };
        } else {
            stopPollingFallback();
            disconnectSocket();
        }
    }, [user?.id, addMessage, toast, fetchNotifications, fetchChats]);

    useEffect(() => {
        if (user?.id) {
            fetchChats(user.id);
        }
    }, [user?.id, fetchChats]);
    
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

    return null;
}
