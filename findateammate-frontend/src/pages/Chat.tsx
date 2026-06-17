import { useEffect, useState, useRef, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { useStore } from "@/hooks/use-store";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MoreVertical, Paperclip, Shield, Globe, Github, MessageSquare, ArrowLeft, Loader2, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Trash2, UserX } from "lucide-react";

import { getSocket, connectSocket } from "@/lib/socket";
import { logger } from "@/lib/logger";
import { useAuth } from "@/hooks/use-auth";

interface ChatProps {
    params: { id?: string }
}

export default function Chat({ params }: ChatProps) {
    const chatId = params.id;
    const [, setLocation] = useLocation();
    const { chats, fetchChats, messages, fetchMessages, sendMessage, clearChat, disconnectRequest } = useStore();
    const { user } = useAuth();
    const [inputValue, setInputValue] = useState("");
    const { toast } = useToast();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [socketConnected, setSocketConnected] = useState(() => !!getSocket()?.connected);
    const [isSending, setIsSending] = useState(false);
    const [isMessagesLoading, setIsMessagesLoading] = useState(false);
    const [rateLimitWait, setRateLimitWait] = useState(0);
    const [partnerDetails, setPartnerDetails] = useState<any>(null);
    const [loadingPartner, setLoadingPartner] = useState(false);

        useEffect(() => {
            if (rateLimitWait <= 0) return;
            const timer = setTimeout(() => setRateLimitWait((prev) => Math.max(0, prev - 1)), 1000);
            return () => clearTimeout(timer);
        }, [rateLimitWait]);

    // Bug Fix: Better active chat selection
    const activeChat = useMemo(() => chats.find(c => c.id === chatId), [chats, chatId]);

    // Fetch partner details when activeChat changes
    useEffect(() => {
        const fetchPartnerDetails = async () => {
            if (!activeChat?.partnerId) return;
            setLoadingPartner(true);
            try {
                const response = await fetch(`/api/users/${activeChat.partnerId}`);
                if (response.ok) {
                    const data = await response.json();
                    setPartnerDetails(data);
                }
            } catch (error) {
                logger.error("[Chat] Failed to fetch partner details", error);
            } finally {
                setLoadingPartner(false);
            }
        };
        fetchPartnerDetails();
    }, [activeChat?.partnerId]);

    // Socket.IO Connection + track live connected state
    useEffect(() => {
        const socket = connectSocket();
        setSocketConnected(socket.connected);

        const onConnect = () => setSocketConnected(true);
        const onDisconnect = () => setSocketConnected(false);
        // BUG #24 FIX: Add error handler for socket.io errors from join_chat
        const onError = (data: any) => {
            toast({
                title: "Chat Join Error",
                description: data?.message || "Failed to join chat",
                variant: "destructive"
            });
            logger.error("[Chat] Socket error", data);
        };
        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("error", onError);

        if (chatId) {
            socket.emit("join_chat", chatId);
        }

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("error", onError);
            if (chatId) socket.emit("leave_chat", chatId);
        };
    }, [chatId, toast]);

    useEffect(() => {
        if (user) {
            fetchChats(user.id);
        }
    }, [user?.id, fetchChats]);

    useEffect(() => {
        if (chatId) {
            setIsMessagesLoading(true);
            fetchMessages(chatId).finally(() => setIsMessagesLoading(false));
        }
    }, [chatId, fetchMessages]);

    // Rate limit client-side: max 5 messages per 10 seconds
    const lastSendTimes = useRef<number[]>([]);

    // Bug Fix: Smart autoscroll
    useEffect(() => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        const lastMessage = messages[chatId || ""]?.at(-1);
        const isSelf = lastMessage?.senderId === user?.id;
        if (isNearBottom || isSelf) {
            scrollRef.current.scrollTop = scrollHeight;
        }
    }, [messages, chatId, user?.id]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatId || !inputValue.trim() || !user) return;

        // Client-side rate limit: 5 messages per 10 seconds
        const now = Date.now();
        lastSendTimes.current = lastSendTimes.current.filter(t => now - t < 10000);
        if (lastSendTimes.current.length >= 5) {
            const oldest = lastSendTimes.current[0] || now;
            const waitMs = Math.max(0, 10000 - (now - oldest));
            const waitSeconds = Math.ceil(waitMs / 1000);
            setRateLimitWait(waitSeconds);
            toast({
                title: "Slow down",
                description: `You're sending messages too quickly. Try again in ${waitSeconds}s.`,
                variant: "destructive"
            });
            return;
        }
        setRateLimitWait(0);
        lastSendTimes.current.push(now);

        const text = inputValue.trim();
        setInputValue("");
        setIsSending(true);

        try {
            // Primary: Send via HTTP POST (reliable, always works)
            await sendMessage(chatId, text);
        } catch (err) {
            logger.error("Failed to send message", err);
            // Restore the input so user can retry
            setInputValue(text);
                        toast({
                            title: "Send failed",
                            description: "Could not send your message. Please retry.",
                            variant: "destructive",
                        });
                } finally {
                        setIsSending(false);
        }
    };

    const currentMessages = useMemo(() => {
        const chatMsgs = messages[chatId || ""];
        if (!chatId || !chatMsgs) return [];
        return [...chatMsgs].sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
    }, [messages, chatId]); // Note: chatId remains a dependency, but we access messages[chatId]

    if (!user) return null;

    return (
        <div className="h-screen bg-background flex flex-col overflow-hidden">
            <Navbar />

            <main className="flex-grow pt-16 flex h-full">
                {/* Sidebar - Chat List */}
                <div className={cn(
                    "w-full md:w-80 lg:w-96 border-r border-border bg-muted/10 flex flex-col",
                    chatId ? "hidden md:flex" : "flex"
                )}>
                    <div className="p-4 border-b border-border/50">
                        <h2 className="font-display font-bold text-xl">Messages</h2>
                    </div>
                    <div className="flex-grow overflow-y-auto p-2 space-y-2">
                        {chats.length > 0 ? chats.map(chat => (
                            <button
                                key={chat.id}
                                onClick={() => setLocation(`/chat/${chat.id}`)}
                                className={cn(
                                    "w-full text-left p-4 rounded-xl cursor-pointer transition-all hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50",
                                    chat.id === chatId ? "bg-primary/10 border border-primary/20 shadow-lg" : ""
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary shrink-0">
                                        {chat.partnerName.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-grow overflow-hidden">
                                        <div className="flex justify-between items-baseline">
                                            <h4 className="font-bold text-sm truncate">{chat.partnerName}</h4>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                                {(() => {
                                                    try {
                                                        if (!chat.timestamp) return "";
                                                        const date = new Date(chat.timestamp);
                                                        return isNaN(date.getTime()) ? "" : format(date, 'h:mm a');
                                                    } catch (e) { return ""; }
                                                })()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                                    </div>
                                </div>
                            </button>
                        )) : (
                            <div className="p-8 text-center text-muted-foreground italic text-sm">
                                {chats.length === 0 ? "No conversations yet" : "Loading chats..."}
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={cn(
                    "flex-grow flex flex-col bg-background/20 backdrop-blur-sm relative",
                    !chatId && "hidden md:flex items-center justify-center"
                )}>
                    {activeChat ? (
                        <>
                            {/* Chat Header */}
                            <div className="h-16 border-b border-border/50 flex items-center justify-between px-4 md:px-6 bg-card/50 backdrop-blur-md shrink-0">
                                <div className="flex items-center gap-2 md:gap-3">
                                    <Button size="icon" variant="ghost" onClick={() => setLocation("/chat")} className="md:hidden h-9 w-9">
                                        <ArrowLeft size={18} />
                                    </Button>

                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent-foreground cursor-pointer hover:ring-2 hover:ring-accent/40 transition-all uppercase">
                                                {activeChat.partnerName.substring(0, 2)}
                                            </div>
                                        </DialogTrigger>
                                        <DialogContent aria-describedby={undefined} className="glass-panel border-border/20 sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle className="text-2xl font-display font-bold">Partner Profile</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-2xl font-display font-bold text-primary-foreground border border-border uppercase">
                                                        {activeChat.partnerName.substring(0, 2)}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold">{activeChat.partnerName}</h3>
                                                        <Badge variant="outline" className="mt-1">Active Builder</Badge>
                                                    </div>
                                                </div>

                                                <div className="p-4 rounded-2xl bg-muted/50 border border-border backdrop-blur-sm">
                                                    <h4 className="text-sm font-bold mb-2 flex items-center gap-2"><Shield size={14} /> Description</h4>
                                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                                        {loadingPartner
                                                            ? "Loading profile details..."
                                                            : partnerDetails?.bio || "This user is a member of the FindATeammate community. Reach out to collaborate!"}
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    {partnerDetails?.portfolio ? (
                                                        <Button variant="outline" className="w-full h-12 rounded-xl bg-muted/30 border-border gap-2 font-bold" asChild>
                                                            <a href={partnerDetails.portfolio} target="_blank" rel="noopener noreferrer">
                                                                <Globe size={14} className="text-primary" /> Portfolio
                                                            </a>
                                                        </Button>
                                                    ) : (
                                                        <Button variant="outline" className="w-full h-12 rounded-xl bg-muted/30 border-border gap-2 font-bold opacity-50 cursor-not-allowed" disabled title="Portfolio not available">
                                                            <Globe size={14} className="text-primary" /> Portfolio
                                                        </Button>
                                                    )}
                                                    {partnerDetails?.github ? (
                                                        <Button variant="outline" className="w-full h-12 rounded-xl bg-muted/30 border-border gap-2 font-bold" asChild>
                                                            <a href={partnerDetails.github} target="_blank" rel="noopener noreferrer">
                                                                <Github size={14} className="text-secondary" /> GitHub
                                                            </a>
                                                        </Button>
                                                    ) : (
                                                        <Button variant="outline" className="w-full h-12 rounded-xl bg-muted/30 border-border gap-2 font-bold opacity-50 cursor-not-allowed" disabled title="GitHub not available">
                                                            <Github size={14} className="text-secondary" /> GitHub
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                    <div>
                                        <h3 className="font-bold">{activeChat.partnerName}</h3>
                                        <span className={`text-xs flex items-center gap-1 ${
                                            socketConnected ? "text-green-600" : "text-muted-foreground"
                                        }`}>
                                            <span className={`w-2 h-2 rounded-full ${
                                                socketConnected ? "bg-green-500 animate-pulse" : "bg-muted-foreground"
                                            }`} />
                                            {socketConnected ? "Connected" : "Connecting..."}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button size="icon" variant="ghost" className="h-8 w-8">
                                                <MoreVertical size={20} />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem 
                                                className="text-destructive focus:text-destructive cursor-pointer"
                                                onClick={async () => {
                                                    if (confirm("Are you sure you want to clear this chat history? This cannot be undone.")) {
                                                        await clearChat(activeChat.id);
                                                        toast({ title: "Chat cleared", description: "History has been removed for you." });
                                                    }
                                                }}
                                            >
                                                <Trash2 size={16} className="mr-2" />
                                                Clear Chat
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                className="text-destructive focus:text-destructive cursor-pointer"
                                                onClick={async () => {
                                                    if (confirm("Are you sure you want to disconnect? This will remove the connection for both users.")) {
                                                        await disconnectRequest(activeChat.id);
                                                        setLocation("/teammates");
                                                        toast({ title: "Disconnected", description: "You are no longer connected with this user." });
                                                    }
                                                }}
                                            >
                                                <UserX size={16} className="mr-2" />
                                                Remove Connection
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            {/* Messages Container */}
                            <div
                                ref={scrollRef}
                                className="flex-grow overflow-y-auto p-6 space-y-6 bg-transparent"
                            >
                                {isMessagesLoading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map((s) => (
                                            <div key={s} className="h-14 rounded-2xl bg-muted/40 animate-pulse" />
                                        ))}
                                    </div>
                                ) : currentMessages.length > 0 ? currentMessages.map((msg) => {
                                    const isMe = msg.senderId === user.id;
                                    return (
                                        <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                                            <div className={cn(
                                                "max-w-[70%] p-4 rounded-2xl shadow-sm text-sm",
                                                isMe
                                                    ? "bg-primary text-primary-foreground rounded-br-none"
                                                    : "bg-card text-foreground rounded-bl-none border border-border/30"
                                            )}>
                                                <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                                                <span className={cn("text-[10px] block mt-1 opacity-70", isMe ? "text-primary-foreground" : "text-muted-foreground")}>
                                                    {(() => {
                                                        try {
                                                            const timestamp = msg.timestamp ? new Date(msg.timestamp).getTime() : null;
                                                            return timestamp && !isNaN(timestamp) ? format(new Date(timestamp), 'h:mm a') : 'now';
                                                        } catch (e) { return 'now'; }
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="h-full flex flex-col items-center justify-center opacity-40">
                                        <MessageSquare size={48} className="mb-2" />
                                        <p className="text-sm font-medium">No messages yet. Say hello!</p>
                                    </div>
                                )}
                            </div>

                            {/* Input Container */}
                            <div className="p-4 bg-card/50 backdrop-blur-md border-t border-border/50 shrink-0">
                                {!socketConnected && (
                                    <div className="mb-3 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                                        <WifiOff size={14} />
                                        Reconnecting chat. Sending is temporarily disabled.
                                    </div>
                                )}
                                {rateLimitWait > 0 && (
                                    <div className="mb-3 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                                        Rate limit active. Please wait {rateLimitWait}s before sending another message burst.
                                    </div>
                                )}
                                <form onSubmit={handleSend} className="flex items-center gap-2 max-w-4xl mx-auto">
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      className="text-muted-foreground hover:bg-muted"
                                      onClick={() => toast({ title: "Coming Soon", description: "File attachments will be available soon." })}
                                    >
                                        <Paperclip size={20} />
                                    </Button>
                                    <Input
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder={socketConnected ? "Type a message..." : "Waiting for connection..."}
                                        className="flex-grow h-12 rounded-full bg-muted/50 border-input shadow-inner focus-visible:ring-1 focus-visible:ring-primary text-foreground"
                                        disabled={!socketConnected || isSending}
                                    />
                                    <Button
                                      type="submit"
                                      size="icon"
                                      disabled={!socketConnected || isSending || !inputValue.trim()}
                                      className="h-12 w-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
                                    >
                                        {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={20} className="ml-0.5" />}
                                    </Button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-center opacity-60">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                                <MessageSquare size={40} className="text-primary" />
                            </div>
                            <h2 className="text-2xl font-display font-bold mb-2">Select a Conversation</h2>
                            <p className="max-w-[280px]">Choose a chat from the left to start collaborating with your teammates.</p>
                            <Button variant="outline" className="mt-8 md:hidden" onClick={() => setLocation("/teammates")}>
                                Browse Projects
                            </Button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
