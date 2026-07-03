import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { useStore } from "@/hooks/use-store";
import { useAuth } from "@/hooks/use-auth";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, Trash2, Calendar, Users, Loader2 } from "lucide-react";
import { formatDistanceToNow, differenceInHours, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function MyPosts() {
  const { posts, deletePost, fulfillPost, fetchPosts } = useStore();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const myPosts = posts.filter(p => p.userId === user?.id);

  const handleFulfill = async (id: string) => {
    setActionLoading(id);
    try {
      await fulfillPost(id);
      toast({
        title: "Success",
        description: "Project marked as fulfilled and removed from listings.",
      });
    } catch (error: any) {
      toast({
        title: "Failed",
        description: error?.message || "Could not mark post as fulfilled.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    try {
      await deletePost(id);
      toast({
        title: "Deleted",
        description: "Project post has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error?.message || "Could not delete the post.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen abstract-bg pt-24 pb-12 px-4 lg:px-8">
      <Navbar />
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl md:text-5xl font-display font-black bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent mb-4"
          >
            Your Active Projects
          </motion.h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Manage your listings, track expiry, and mark your successful collaborations.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myPosts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-20 text-center glass-panel rounded-3xl"
            >
              <CheckCircle className="mx-auto mb-4 text-primary/40" size={64} />
              <h3 className="text-2xl font-display font-bold mb-2">No active posts</h3>
              <p className="text-muted-foreground">Ready to find some teammates? Create a new post to get started.</p>
            </motion.div>
          ) : (
            myPosts.map((post, index) => {
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="glass-card h-full border-none shadow-2xl overflow-hidden group">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="bg-muted/50 border-border">
                          <Calendar size={12} className="mr-1" />
                          {(() => {
                            try {
                              const date = typeof post.createdAt === 'string' ? parseISO(post.createdAt) : post.createdAt;
                              return !date || isNaN(new Date(date).getTime())
                                ? "Recently"
                                : formatDistanceToNow(date, { addSuffix: true });
                            } catch (e) { return "Recently"; }
                          })()}
                        </Badge>
                        {(() => {
                          try {
                            // For events, check if event is within 48 hours; for posts, check if > 40 hours old
                            if (post.eventName && post.eventDate) {
                              const eventDate = typeof post.eventDate === 'string' ? parseISO(post.eventDate) : post.eventDate;
                              if (!eventDate || isNaN(new Date(eventDate).getTime())) return null;
                              const hoursUntilEvent = differenceInHours(eventDate, new Date());
                              return hoursUntilEvent > 0 && hoursUntilEvent <= 48 ? (
                                <Badge className="bg-destructive/80 text-destructive-foreground animate-pulse shadow-md shadow-destructive/20">
                                  Event Soon
                                </Badge>
                              ) : null;
                            } else {
                              const date = typeof post.createdAt === 'string' ? parseISO(post.createdAt) : post.createdAt;
                              if (!date || isNaN(new Date(date).getTime())) return null;
                              const hoursOld = differenceInHours(new Date(), date);
                              return hoursOld >= 40 ? (
                                <Badge className="bg-destructive/80 text-destructive-foreground animate-pulse shadow-md shadow-destructive/20">
                                  Expiring Soon
                                </Badge>
                              ) : null;
                            }
                          } catch { return null; }
                        })()}
                      </div>
                      <CardTitle className="text-xl font-display font-bold group-hover:text-primary transition-colors">
                        {post.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="p-3 rounded-2xl bg-primary/5 border border-primary/10">
                        <div className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
                          <Clock size={14} />
                          <span>Expiry Status</span>
                        </div>
                        <div className="text-2xl font-display font-black">
                          {(() => {
                            try {
                              // For events, use eventDate; for posts, use createdAt + 48hrs
                              if (post.eventName && post.eventDate) {
                                const eventDate = typeof post.eventDate === 'string' ? parseISO(post.eventDate) : post.eventDate;
                                if (!eventDate || isNaN(new Date(eventDate).getTime())) return "N/A";
                                const hoursUntilEvent = differenceInHours(eventDate, new Date());
                                return hoursUntilEvent > 0 ? hoursUntilEvent : 0;
                              } else {
                                const date = typeof post.createdAt === 'string' ? parseISO(post.createdAt) : post.createdAt;
                                if (!date || isNaN(new Date(date).getTime())) return "48";
                                const hours = differenceInHours(new Date(), date);
                                return Math.max(0, 48 - hours);
                              }
                            } catch { return "48"; }
                          })()} <span className="text-sm font-normal text-muted-foreground">{post.eventName && post.eventDate ? "hours until event" : "hours remaining"}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {(post.eventName && post.eventType === "intra-college" && (user?.isOrganiser || user?.isAdmin)) && (
                          <Button
                            onClick={() => setLocation(`/organiser`)}
                            className="w-full bg-blue-600 text-white hover:brightness-110 rounded-2xl h-12 shadow-lg shadow-blue-600/20"
                          >
                            <Users className="mr-2" size={18} />
                            View Event Dashboard
                          </Button>
                        )}
                        <Button
                          onClick={() => {
                            const mode = post.eventName ? "event" : "teammate";
                            setLocation(`/create-post/${mode}?edit=${post.id}`);
                          }}
                          className="w-full bg-accent text-accent-foreground hover:brightness-110 rounded-2xl h-12 shadow-lg shadow-accent/20"
                          disabled={actionLoading === post.id}
                        >
                          Edit Post
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              className="w-full bg-primary text-primary-foreground hover:brightness-110 rounded-2xl h-12 shadow-lg shadow-primary/20"
                              disabled={actionLoading === post.id}
                            >
                              {actionLoading === post.id ? (
                                <Loader2 className="mr-2 animate-spin" size={18} />
                              ) : (
                                <CheckCircle className="mr-2" size={18} />
                              )}
                              {actionLoading === post.id ? "Processing..." : "Mark as Fulfilled"}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Mark this post as fulfilled?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove it from active listings. Use this after your collaboration is complete.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleFulfill(post.id)}>
                                Confirm Fulfilled
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive rounded-2xl h-12"
                              disabled={actionLoading === post.id}
                            >
                              <Trash2 className="mr-2" size={18} />
                              Delete Post
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. The post and related activity will be removed.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDelete(post.id)}
                              >
                                Confirm Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
