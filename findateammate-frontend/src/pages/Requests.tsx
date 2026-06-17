import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useStore } from "@/hooks/use-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Check, X, MessageSquare, Clock, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";


export default function Requests() {
  const { requests, fetchRequests, isLoading, acceptRequest, disconnectRequest } = useStore();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // FIX: Use ref to prevent fetchRequests dependency loop
  useEffect(() => {
    if (user?.id) {
      fetchRequests(user.id);
    }
  }, [user?.id]); // Only re-fetch when user ID changes

  const incomingRequests = useMemo(() => {
    if (!user) return [];
    return requests.filter(r => r.toUserId === user.id);
  }, [requests, user]);

  const outgoingRequests = useMemo(() => {
    if (!user) return [];
    return requests.filter(r => r.fromUserId === user.id);
  }, [requests, user]);

  const handleAccept = async (id: string) => {
    if (actionLoading) return;
    setActionLoading(id);
    try {
      await acceptRequest(id);
      toast({
        title: "Request Accepted",
        description: "You can now start chatting with your teammate!",
      });
    } catch (error: any) {
      toast({
        title: "Failed to Accept",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };
  
  const handleDisconnect = async (id: string) => {
    if (actionLoading) return;
    setActionLoading(id);
    try {
      await disconnectRequest(id);
      toast({
        title: "Request Removed",
        description: "The connection has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to Remove",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen abstract-bg pb-20 pt-24">
      <Navbar />

      <main className="container mx-auto px-4 lg:px-8 max-w-4xl">
        <header className="mb-12">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl md:text-5xl font-display font-black bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent mb-4"
          >
            Connections
          </motion.h1>
          <p className="text-muted-foreground text-lg">Manage your team requests and start collaborating.</p>
        </header>

        <Tabs defaultValue="incoming" className="w-full">
          <TabsList className="bg-muted/20 p-1 rounded-full mb-8 h-14 border border-border">
            <TabsTrigger value="incoming" className="rounded-full px-8 py-2.5 text-base font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Incoming</TabsTrigger>
            <TabsTrigger value="outgoing" className="rounded-full px-8 py-2.5 text-base font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Sent Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="incoming" className="space-y-4">
            {isLoading ? (
              <div className="glass-panel p-20 rounded-[2rem] text-center border-border">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground font-bold">Loading connections...</p>
              </div>
            ) : incomingRequests.length > 0 ? (
              incomingRequests.map((req, index) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card p-6 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-none shadow-xl bg-card"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 text-accent flex items-center justify-center font-black text-xl border border-border shadow-inner">
                      {(req.fromUserName || "User").substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-display font-black text-xl mb-1">{req.fromUserName}</h3>
                      <div className="text-sm text-muted-foreground flex flex-col gap-1">
                        <span className="font-bold text-primary">{req.fromUserSkill}</span>
                        <span>Wants to join: <span className="text-foreground font-semibold">"{req.postTitle}"</span></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                    {req.status === 'pending' ? (
                      <>
                        <Button
                          variant="ghost"
                          className="rounded-2xl h-12 px-6 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDisconnect(req.id)}
                          disabled={actionLoading === req.id}
                        >
                          {actionLoading === req.id ? <Loader2 size={16} className="mr-2 animate-spin" /> : <X size={20} className="mr-2" />} Decline
                        </Button>
                        <Button
                          onClick={() => handleAccept(req.id)}
                          className="rounded-2xl h-12 px-8 bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/20"
                          disabled={actionLoading === req.id}
                        >
                          {actionLoading === req.id ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Check size={20} className="mr-2" />} Accept
                        </Button>
                      </>
                    ) : req.status === 'accepted' ? (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setLocation(`/chat/${req.id}`)}
                          className="rounded-2xl h-12 px-8 bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
                        >
                          <MessageSquare size={20} className="mr-2" /> Start Chat
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => handleDisconnect(req.id)}
                          className="rounded-2xl h-12 px-4 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          disabled={actionLoading === req.id}
                        >
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <Badge className="px-4 py-1.5 rounded-xl bg-destructive/10 text-destructive border-destructive/20 capitalize font-bold">
                        {req.status}
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-20 glass-panel rounded-[2.5rem] border-border">
                <Check className="mx-auto mb-4 text-primary opacity-20" size={64} />
                <p className="text-muted-foreground text-xl font-medium">No pending requests.</p>
              </div>
            ) }
          </TabsContent>

          <TabsContent value="outgoing">
            {outgoingRequests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {outgoingRequests.map((req) => (
                  <motion.div
                    key={req.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-6 rounded-3xl border-border bg-card"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent font-bold">
                          {req.postTitle.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold">{req.postTitle}</h4>
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold opacity-70">
                            {req.status}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full text-muted-foreground hover:text-destructive"
                        onClick={() => handleDisconnect(req.id)}
                        disabled={actionLoading === req.id}
                      >
                        {actionLoading === req.id ? (
                          <><Loader2 size={14} className="mr-1 animate-spin" /> Processing...</>
                        ) : req.status === 'pending' ? (
                          'Cancel Request'
                        ) : (
                          'Remove Connection'
                        )}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 glass-panel rounded-[2.5rem]">
                <Clock className="mx-auto mb-4 text-accent opacity-20" size={64} />
                <p className="text-muted-foreground text-xl font-medium mb-6">You haven't sent any requests yet.</p>
                <Link href="/teammates">
                  <Button className="rounded-2xl h-14 px-10 bg-accent text-white hover:brightness-110 font-bold shadow-xl shadow-accent/20">Explore Projects</Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
