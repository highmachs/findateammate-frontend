import { useEffect, useRef } from "react";
import { useStore } from "@/hooks/use-store";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Message } from "@shared/schema";
import { useAnalytics } from "@/hooks/use-analytics";
import PartySocket from "partysocket";

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
            const socket = new PartySocket({
                host: import.meta.env.VITE_PARTYKIT_HOST || "localhost:1999",
                party: "notifications",
                room: user.id
            });
            const userId = user.id;

            const handleOpen = () => {
                console.log("[GlobalListener] Socket connected!");
                stopPollingFallback();
                useStore.getState().retryPendingMessages().catch(err => 
                    console.error("Failed to retry pending messages", err)
                );
            };

            const handleClose = () => {
                console.log("[GlobalListener] Socket disconnected");
                startPollingFallback(userId);
            };

            const handleError = (error: Event) => {
                console.error("[GlobalListener] Socket connection error:", error);
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

            const handleMessage = (evt: MessageEvent) => {
                try {
                    const data = JSON.parse(evt.data);
                    
                    if (data.type === "receive_message") {
                        const message: Message = data.message;
                        addMessage(message.chatId, message);
                        const isOnChatPage = locationRef.current.startsWith(`/chat/${message.chatId}`);
                        if (!isOnChatPage) {
                            toast({ title: `New message`, description: message.text });
                        }
                    } else if (data.type === "notification") {
                        console.log("[GlobalListener] Received new notification signal!");
                        fetchNotifications();
                        if (userId) useStore.getState().fetchRequests(userId);
                    } else if (data.type === "chat_updated") {
                        fetchChats(userId);
                    }
                } catch (e) {
                    console.error("Failed to parse GlobalListener message", e);
                }
            };

            socket.addEventListener("open", handleOpen);
            socket.addEventListener("close", handleClose);
            socket.addEventListener("error", handleError);
            socket.addEventListener("message", handleMessage);

            return () => {
                socket.removeEventListener("open", handleOpen);
                socket.removeEventListener("close", handleClose);
                socket.removeEventListener("error", handleError);
                socket.removeEventListener("message", handleMessage);
                socket.close();
                stopPollingFallback();
            };
        } else {
            stopPollingFallback();
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
