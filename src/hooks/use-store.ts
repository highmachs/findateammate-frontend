import { create } from "zustand";
import * as api from "@/lib/api";
import { User, Post, InsertPost, ConnectionRequest, Message, Notification, ChatWithDetails } from "@shared/schema";

export interface StoreState {
    posts: Post[];
    requests: ConnectionRequest[];
    chats: ChatWithDetails[]; 
    messages: Record<string, Message[]>; // Map chatId -> messages
    isLoading: boolean;
    error: Error | null; // Added for UI feedback
    
    nextCursor: string | null;
    hasMore: boolean;
    lastFetchedAt: number | null;
    
    // FIX: Offline message queue for resilience
    pendingMessages: Array<{ chatId: string; text: string; tempId: string }>;

    // Actions
    fetchPosts: (loadMore?: boolean) => Promise<void>;
    createPost: (postData: Omit<InsertPost, 'id' | 'createdAt' | 'userId' | 'userName' | 'userSkill' | 'eventUpvotes'>, user: { id: string, name: string, skills: string[] }) => Promise<void>;
    updatePost: (id: string, postData: Partial<Post>) => Promise<void>;
    hydrateDashboard: (data: { unreadCount: number, feed: { items: Post[], nextCursor: string | null } }) => void;

    fetchRequests: (userId: string) => Promise<void>;
    sendRequest: (postId: string, postTitle: string, toUserId: string, message: string, fromUser: { id: string, name: string, skills: string[] }) => Promise<void>;
    acceptRequest: (requestId: string) => Promise<void>;
    disconnectRequest: (requestId: string) => Promise<void>;

    fetchChats: (userId: string) => Promise<void>;
    fetchMessages: (chatId: string) => Promise<void>;
    sendMessage: (chatId: string, text: string) => Promise<Message | null>;
    addMessage: (chatId: string, message: Message) => void;
    retryPendingMessages: () => Promise<void>; // FIX: Retry offline messages

    updateProfile: (userId: string, profileData: Partial<User>) => Promise<void>;
    deletePost: (id: string) => Promise<void>;
    fulfillPost: (id: string) => Promise<void>;
    upvoteEvent: (id: string) => Promise<void>;
    downvoteEvent: (id: string) => Promise<void>;
    clearChat: (chatId: string) => Promise<void>;

    // Notifications
    notifications: Notification[];
    fetchNotifications: () => Promise<void>;
    markAsRead: (ids: string[] | 'all') => Promise<void>;
    clearNotifications: (ids: string[] | 'all') => Promise<void>;
    unreadCount: number;

    // Public & Admin Actions
    fetchPublicUser: (id: string) => Promise<User | null>;
    adminDeleteUser: (id: string) => Promise<void>;
    adminPromoteUser: (id: string, isAdmin: boolean) => Promise<void>;
    adminPromoteOrganiser: (id: string, isOrganiser: boolean) => Promise<void>;
    adminBanUser: (id: string, reason: string) => Promise<void>;
    adminUnbanUser: (id: string) => Promise<void>;
    adminDeletePost: (id: string) => Promise<void>;

    // Admin Organiser Management
    getAdminOrganisers: (page: number, limit: number) => Promise<any>;
    getAdminOrganizerEvents: (userId: string) => Promise<any[]>;
    getAdminOrganizerDashboard: (userId: string, eventId: string) => Promise<any>;

    // Getters
    getAdminStats: () => Promise<any>; // Ideally type this
    getAdminUsers: () => Promise<User[]>;
    getPosts: () => Promise<Post[]>;
}

export const useStore = create<StoreState>((set, get) => ({
    posts: [],
    requests: [],
    chats: [],
    messages: {},
    isLoading: false,
    error: null, // Global error state
    nextCursor: null,
    hasMore: true,
    lastFetchedAt: null,
    pendingMessages: [], // FIX: Queue for offline messages

    fetchPosts: async (loadMore = false) => {
        const state = get();
        if (loadMore && !state.nextCursor) return; // No more items

        // Stale-While-Revalidate (60s TTL)
        if (!loadMore && state.lastFetchedAt && (Date.now() - state.lastFetchedAt < 60000)) {
            return;
        }

        set({ isLoading: true, error: null });
        try {
            const cursor = loadMore ? state.nextCursor || undefined : undefined;
            const { items, nextCursor } = await api.fetchPosts(cursor);
            
            set(state => ({
                posts: loadMore ? [...state.posts, ...items] : items,
                nextCursor,
                hasMore: !!nextCursor,
                lastFetchedAt: Date.now()
            }));
        } catch (error) {
            console.error("Failed to fetch posts:", error);
            set({ error: error as Error }); // Expose error to UI
        } finally {
            set({ isLoading: false });
        }
    },

    createPost: async (postData, user) => {
        set({ isLoading: true });
        try {
            const isEvent = !!postData.eventName;
            let createdPost: Post | null = null;
            
            if (isEvent) {
                createdPost = await api.createEventPost({ 
                    ...postData, 
                    userId: user.id,
                    userName: user.name,
                    userSkill: user.skills?.[0] || "Unspecified" 
                });
            } else {
                createdPost = await api.createTeammatePost({
                    ...postData, 
                    userId: user.id,
                    userName: user.name,
                    userSkill: user.skills?.[0] || "Unspecified" 
                });
            }
            set((state) => ({
                posts: createdPost
                    ? [createdPost as Post, ...state.posts.filter((p) => p.id !== (createdPost as Post).id)]
                    : state.posts,
                lastFetchedAt: null,
            }));
        } catch (error) {
            console.error("Failed to create post:", error);
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    hydrateDashboard: (data) => {
        set({
            unreadCount: data.unreadCount,
            posts: data.feed.items,
            nextCursor: data.feed.nextCursor,
            hasMore: !!data.feed.nextCursor,
            lastFetchedAt: Date.now()
        });
    },

    updatePost: async (id, postData) => {
        try {
            const updatedPost = await api.updatePost(id, postData);
            set(state => ({
                posts: state.posts.map(p => p.id === id ? { ...p, ...updatedPost } : p),
                lastFetchedAt: null,
            }));
            await get().fetchPosts();
        } catch (error) {
            console.error("Failed to update post:", error);
            throw error;
        }
    },

    fetchRequests: async (userId) => {
        set({ isLoading: true });
        try {
            const requests = await api.fetchRequests(userId);
            set({ requests });
        } catch (error) {
                        if (error instanceof Error && error.name === "AbortError") return;
                        console.error("Failed to fetch requests:", error);
        } finally {
            set({ isLoading: false });
        }
    },

    sendRequest: async (postId, postTitle, toUserId, message, fromUser) => {
        try {
            await api.createConnectionRequest({
                postId,
                postTitle,
                toUserId,
                fromUserId: fromUser.id,
                fromUserName: fromUser.name,
                fromUserSkill: fromUser.skills?.[0] || "Unspecified",
                message,
            });
            // Refresh requests
            await get().fetchRequests(fromUser.id);
        } catch (error) {
            console.error("Failed to send request:", error);
            throw error;
        }
    },

    acceptRequest: async (requestId) => {
        const previousStatus = get().requests.find(r => r.id === requestId)?.status;
        try {
            // Optimistic update
            set({
                requests: get().requests.map(r =>
                    r.id === requestId ? { ...r, status: 'accepted' as const } : r
                )
            });
            await api.acceptRequest(requestId);
        } catch (error) {
            console.error("Failed to accept request:", error);
            // FIX BUG #9: Rollback only the affected request, not entire stale list
            set(state => ({
                requests: state.requests.map(r =>
                    r.id === requestId ? { ...r, status: previousStatus || 'pending' } : r
                )
            }));
            throw error;
        }
    },

    disconnectRequest: async (requestId) => {
        try {
            // Use deleteRequest (fully removes the connection + chat) not rejectRequest
            // (which only sets status to 'rejected', leaving a zombie record in the DB)
            await api.deleteRequest(requestId);
            set(state => ({
                requests: state.requests.filter(r => r.id !== requestId),
                chats: state.chats.filter(c => c.id !== requestId),
            }));
        } catch (error) {
            console.error("Failed to disconnect:", error);
            throw error;
        }
    },

    fetchChats: async (userId) => {
        try {
            const chats = await api.fetchChats(userId);
            set({ chats });
        } catch (error) {
            console.error("Failed to fetch chats:", error);
        }
    },

    fetchMessages: async (chatId) => {
        try {
            const messages = await api.fetchMessages(chatId);
            set(state => {
                const existingMessages = state.messages[chatId] || [];
                // Merge: keep existing messages and add new ones, dedup by ID
                const messageMap = new Map();
                [...existingMessages, ...messages].forEach(msg => {
                    messageMap.set(msg.id, msg);
                });
                // FIX: Sort messages by timestamp to ensure chronological order
                const sorted = Array.from(messageMap.values()).sort((a, b) => 
                    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                );
                return {
                    messages: { ...state.messages, [chatId]: sorted }
                };
            });
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        }
    },

    sendMessage: async (chatId, text) => {
        try {
            const newMessage = await api.sendMessage({ chatId, text });
            get().addMessage(chatId, newMessage);
            return newMessage;
        } catch (error) {
            console.error("Failed to send message:", error);
            // FIX: Queue message for retry when offline
            const tempId = `temp-${Date.now()}`;
            set(state => ({
                pendingMessages: [...state.pendingMessages, { chatId, text, tempId }]
            }));
            throw error;
        }
    },

    retryPendingMessages: async () => {
        const { pendingMessages } = get();
        if (pendingMessages.length === 0) return;
        
        const failed: typeof pendingMessages = [];
        for (const { chatId, text, tempId } of pendingMessages) {
            try {
                const newMessage = await api.sendMessage({ chatId, text });
                get().addMessage(chatId, newMessage);
            } catch (err) {
                console.error(`Failed to retry message ${tempId}:`, err);
                failed.push({ chatId, text, tempId });
            }
        }
        
        // Keep only failed messages in the queue
        set({ pendingMessages: failed });
    },

    addMessage: (chatId, message) => {
        set(state => {
            const chatMessages = state.messages[chatId] || [];
            // Rely on IDs for reliable deduping
            const isDuplicate = chatMessages.some(m => m.id === message.id);
            if (isDuplicate) return state;
            
            // PERFORMANCE FIX: Prevent memory leak by keeping only the last 100 messages
            // FIX: Sort new messages list by timestamp to maintain order
            const updatedMessages = [...chatMessages, message]
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                .slice(-100);
            
            return {
                messages: { ...state.messages, [chatId]: updatedMessages }
            };
        });
    },

    updateProfile: async (userId, profileData) => {
        try {
            const updatedUser = await api.updateUserProfile(userId, profileData);
            return updatedUser;
        } catch (error) {
            console.error("Failed to update profile:", error);
            throw error;
        }
    },

    deletePost: async (id) => {
        try {
            await api.deletePost(id);
            set(state => ({ posts: state.posts.filter(p => p.id !== id) }));
        } catch (error) {
            console.error("Failed to delete post:", error);
            throw error;
        }
    },

    fulfillPost: async (id) => {
        // Treat fulfill as delete for now
        try {
            await api.fulfillPost(id);
            set(state => ({ posts: state.posts.filter(p => p.id !== id) }));
        } catch (error) {
            console.error("Failed to fulfill post:", error);
            throw error;
        }
    },

    upvoteEvent: async (id) => {
        const previousPosts = get().posts;
        try {
            // Optimistic update
            set(state => ({
                posts: state.posts.map(p => {
                    if (p.id !== id) return p;
                    
                    // Logic:
                    // If already upvoted (myVote === 1) -> Toggle OFF (0), decrement
                    // If downvoted (myVote === -1) -> Switch to UP (1), increment by 2
                    // If no vote (myVote === 0/null) -> Switch to UP (1), increment by 1
                    
                    const myVote = (p as any).myVote || 0;
                    let newVote = 1;
                    let voteDiff = 1;

                    if (myVote === 1) {
                        newVote = 0; // Remove vote
                        voteDiff = -1;
                    } else if (myVote === -1) {
                        newVote = 1;
                        voteDiff = 2;
                    }

                    return { 
                        ...p, 
                        eventUpvotes: (p.eventUpvotes || 0) + voteDiff,
                        myVote: newVote
                    } as Post;
                })
            }));
            await api.upvotePost(id);
        } catch (error) {
            console.error("Failed to upvote:", error);
            // Rollback on failure
            set({ posts: previousPosts });
            // Notify user of failure
            const { toast } = await import("@/hooks/use-toast");
            toast({ title: "Vote failed", description: "Could not register your vote. Please try again.", variant: "destructive" });
        }
    },

    downvoteEvent: async (id) => {
        const previousPosts = get().posts;
        try {
            // Optimistic update
            set(state => ({
                posts: state.posts.map(p => {
                    if (p.id !== id) return p;

                    const myVote = (p as any).myVote || 0;
                    let newVote = -1;
                    let voteDiff = -1;

                    if (myVote === -1) {
                        newVote = 0; // Remove vote
                        voteDiff = 1;
                    } else if (myVote === 1) {
                        newVote = -1;
                        voteDiff = -2;
                    }

                    return { 
                        ...p, 
                        eventUpvotes: (p.eventUpvotes || 0) + voteDiff,
                        myVote: newVote
                    } as Post;
                })
            }));
            await api.downvotePost(id);
        } catch (error) {
            console.error("Failed to downvote:", error);
            // Rollback on failure
            set({ posts: previousPosts });
            // Notify user of failure
            const { toast } = await import("@/hooks/use-toast");
            toast({ title: "Vote failed", description: "Could not register your vote. Please try again.", variant: "destructive" });
        }
    },

    clearChat: async (chatId) => {
        try {
            await api.clearChat(chatId);
            // Optimistically clear messages from state
            set(state => ({
                messages: { ...state.messages, [chatId]: [] }
            }));
        } catch (error) {
            console.error("Failed to clear chat:", error);
            throw error;
        }
    },

    // Notifications
    notifications: [],
    unreadCount: 0,

    fetchNotifications: async () => {
        try {
            const notifications = await api.fetchNotifications();
            set({ 
                notifications,
                unreadCount: notifications.filter((n: Notification) => !n.isRead).length
            });
        } catch (error) {
            if (error instanceof Error && error.name === "AbortError") return;
            console.error("Failed to fetch notifications:", error);
        }
    },

    markAsRead: async (ids) => {
        const previousState = {
            notifications: get().notifications,
            unreadCount: get().unreadCount
        };
        try {
            if (ids === 'all') {
                set(state => ({
                    notifications: state.notifications.map(n => ({ ...n, isRead: true })),
                    unreadCount: 0
                }));
                await api.markAllNotificationsRead();
            } else {
                const idArray = Array.isArray(ids) ? ids : [ids];
                set(state => ({
                    notifications: state.notifications.map(n => idArray.includes(n.id) ? { ...n, isRead: true } : n),
                    unreadCount: state.notifications.filter(n => !n.isRead && !idArray.includes(n.id)).length
                }));
                // Parallel requests for multiple IDs
                await Promise.all(idArray.map(id => api.markNotificationRead(id)));
            }
        } catch (error) {
            console.error("Failed to mark as read:", error);
            set(previousState);
        }
    },

    clearNotifications: async (ids) => {
        const previousState = {
            notifications: get().notifications,
            unreadCount: get().unreadCount
        };
        try {
            if (ids === 'all') {
                set({ notifications: [], unreadCount: 0 });
                await api.deleteAllNotifications();
            } else {
                const idArray = Array.isArray(ids) ? ids : [ids];
                set(state => {
                    const newNotifications = state.notifications.filter(n => !idArray.includes(n.id));
                    return {
                        notifications: newNotifications,
                        unreadCount: newNotifications.filter(n => !n.isRead).length
                    };
                });
                await Promise.all(idArray.map(id => api.deleteNotification(id)));
            }
        } catch (error) {
            console.error("Failed to clear notifications:", error);
            set(previousState);
        }
    },

    // Public & Admin Actions
    fetchPublicUser: async (id) => {
        try {
            return await api.getPublicUser(id);
        } catch (error) {
            console.error("Failed to fetch public user:", error);
            return null;
        }
    },

    adminDeleteUser: async (id) => {
        try {
            await api.deleteUser(id);
        } catch (error) {
            console.error("Failed to delete user:", error);
            throw error;
        }
    },

    adminPromoteUser: async (id, isAdmin) => {
        try {
            await api.promoteUser(id, isAdmin);
        } catch (error) {
            console.error("Failed to promote user:", error);
            throw error;
        }
    },

    adminPromoteOrganiser: async (id, isOrganiser) => {
        try {
            await api.promoteOrganiser(id, isOrganiser);
        } catch (error) {
            console.error("Failed to promote organiser:", error);
            throw error;
        }
    },

    adminBanUser: async (id, reason) => {
        try {
            await api.banUser(id, reason);
        } catch (error) {
            console.error("Failed to ban user:", error);
            throw error;
        }
    },

    adminUnbanUser: async (id) => {
        try {
            await api.unbanUser(id);
        } catch (error) {
            console.error("Failed to unban user:", error);
            throw error;
        }
    },

    adminDeletePost: async (id) => {
        try {
            await api.adminDeletePost(id);
            // Optimistically update posts list if it's currently loaded
            set(state => ({ posts: state.posts.filter(p => p.id !== id) }));
        } catch (error) {
            console.error("Failed to delete post (admin):", error);
            throw error;
        }
    },

    // Admin Organiser Management
    getAdminOrganisers: async (page, limit) => {
        try {
            return await api.getAdminOrganisers(page, limit);
        } catch (error) {
            console.error("Failed to fetch organisers:", error);
            throw error;
        }
    },

    getAdminOrganizerEvents: async (userId) => {
        try {
            return await api.getAdminOrganizerEvents(userId);
        } catch (error) {
            console.error("Failed to fetch organiser events:", error);
            throw error;
        }
    },

    getAdminOrganizerDashboard: async (userId, eventId) => {
        try {
            return await api.getAdminOrganizerDashboard(userId, eventId);
        } catch (error) {
            console.error("Failed to fetch organiser dashboard:", error);
            throw error;
        }
    },

    // Getters for useQuery
    getAdminStats: async () => {
        return await api.getAdminStats();
    },
    getAdminUsers: async () => {
        return await api.getAdminUsers();
    },
    getPosts: async () => {
        const { items } = await api.fetchPosts();
        return items;
    }
}));
