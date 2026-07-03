import { useParams, useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { useStore } from "@/hooks/use-store";
import { useAuth } from "@/hooks/use-auth";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Calendar, Clock, Sparkles, Send, Globe, Loader2 } from "lucide-react";
import { SafeExternalLink } from "@/components/SafeExternalLink";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from "lucide-react";
import { cn, getAssetUrl } from "@/lib/utils";
import { trackConnectionRequest } from "@/hooks/useTracking";

export default function PostDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { posts, requests, sendRequest, isLoading, fetchPosts } = useStore();
  const { user } = useAuth();
  const { toast } = useToast();

  const [connectMessage, setConnectMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Critical Fix: Fetch posts if store is empty (e.g. direct navigation)
  useEffect(() => {
    if (posts.length === 0) {
      fetchPosts();
    }
  }, [posts.length, fetchPosts]);

  const post = posts.find(p => p.id === id);

  if (isLoading && !post) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Navbar />
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-primary/20 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-primary/20 rounded"></div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Navbar />
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar size={40} className="text-muted-foreground" />
          </div>
          <h2 className="text-3xl font-display font-bold">Post Not Found</h2>
          <p className="text-muted-foreground max-w-xs mx-auto">This project may have been removed or is no longer available.</p>
          <Button onClick={() => setLocation("/teammates")} className="rounded-full px-8">
            Back to Browse
          </Button>
        </div>
      </div>
    );
  }

  const isOwnPost = post.userId === user?.id;
  const hasRequested = requests.some(r => r.postId === post.id && r.fromUserId === user?.id);

  const handleConnect = async () => {
    if (!user?.id) {
      toast({ title: "Please login", description: "You need an account to connect with teammates." });
      setLocation("/login");
      return;
    }
    if (isOwnPost || hasRequested) return;
    if (!connectMessage.trim() || connectMessage.trim().length < 10) {
      toast({
        title: "Message Required",
        description: "Please add at least 10 characters about why you're a good fit.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      await sendRequest(post.id, post.title, post.userId, connectMessage, {
        id: user.id,
        name: user.name,
        skills: user.skills || []
      });
      trackConnectionRequest(post.id);
      setIsDialogOpen(false);
      toast({
        title: "Request Sent!",
        description: `Your connection request for "${post.title}" has been sent.`,
      });
    } catch (error: any) {
      toast({
        title: "Request Failed",
        description: error?.message || "Could not send request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen abstract-bg pt-24 pb-12 px-4 lg:px-8">
      <Navbar />
      <div className="max-w-4xl mx-auto">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setLocation("/teammates")}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Browse</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-[2rem] overflow-hidden border-none shadow-2xl"
        >
          {post.eventImage ? (
            <div className="w-full max-h-96 bg-muted flex items-center justify-center relative overflow-hidden">
              <img
                src={getAssetUrl(post.eventImage)}
                alt={post.title}
                className="max-w-full max-h-96 w-auto h-auto object-contain"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            </div>
          ) : (
            <div className="h-48 bg-gradient-to-br from-primary via-accent to-secondary opacity-30 relative">
              <div className="absolute inset-0 abstract-bg mix-blend-overlay" />
            </div>
          )}

          <div className={cn("px-8 pb-12 relative", !post.eventName && "-mt-16")}>
            {!post.eventName ? (
              <Link href={`/profile/${post.userId}`}>
                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary to-accent border-4 border-background flex items-center justify-center text-3xl font-black text-primary-foreground shadow-xl mb-6 animate-float cursor-pointer hover:scale-105 transition-transform">
                  {post.userName.charAt(0)}
                </div>
              </Link>
            ) : (
                <div className="h-8" /> // Spacer for events
            )}

            <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
              <div>
                <h1 className="text-4xl font-display font-black mb-2">{post.title}</h1>
                <div className="flex items-center gap-4 text-muted-foreground flex-wrap">
                  {!post.eventName && (
                    <Link href={`/profile/${post.userId}`} className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer">
                      <Sparkles size={16} className="text-primary" />
                      {post.userName} • {post.userSkill}
                    </Link>
                  )}
                  <span className="flex items-center gap-1">
                    <MapPin size={16} />
                    {post.city || "Remote"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={16} />
                    {(() => {
                      try {
                        if (!post.createdAt) return "Recently";
                        const date = typeof post.createdAt === 'string' ? parseISO(post.createdAt) : post.createdAt;
                        return !date || isNaN(new Date(date).getTime())
                          ? "Recently"
                          : formatDistanceToNow(date, { addSuffix: true });
                      } catch (e) { return "Recently"; }
                    })()}
                  </span>
                  {post.eventWebsite && (
                    <SafeExternalLink href={post.eventWebsite} className="flex items-center gap-1 text-accent hover:text-accent/80 font-bold">
                      <Globe size={16} />
                      Event Website
                    </SafeExternalLink>
                  )}
                </div>
              </div>
              <Badge variant="secondary" className="px-4 py-1.5 text-lg font-bold bg-accent/20 text-accent rounded-xl border-accent/20">
                {post.availability}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-primary/60 mb-3">About the Project</h3>
                  <p className="text-lg leading-relaxed text-foreground/80 whitespace-pre-wrap">
                    {post.description}
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-accent/60 mb-4">Skills I'm Bringing</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.skillsOffered.map(skill => (
                      <div key={skill.name} className="flex flex-col gap-1">
                        <Badge className="bg-secondary/30 text-secondary-foreground border-secondary/20 rounded-lg px-3 py-1">
                          {skill.name}
                        </Badge>
                        <span className="text-[10px] font-bold text-secondary/60 uppercase px-1">{skill.level}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-primary/60 mb-4">Skills I'm Looking For</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.skillsWanted.map(skill => (
                      <div key={skill.name} className="flex flex-col gap-1">
                        <Badge className="bg-primary/20 text-primary border-primary/10 rounded-lg px-3 py-1 font-bold">
                          {skill.name}
                        </Badge>
                        <span className="text-[10px] font-bold text-primary/60 uppercase px-1">{skill.level}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Event Requirements */}
            {post.eventName && (
              <div className="pt-8 space-y-6">
                {/* Allowed Departments */}
                {(post as any).allowedDepartments && Array.isArray((post as any).allowedDepartments) && (post as any).allowedDepartments.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-foreground">Allowed Departments</h3>
                    <div className="flex flex-wrap gap-2">
                      {(post as any).allowedDepartments.map((dept: string) => (
                        <Badge key={dept} variant="outline">
                          {dept}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Required Skills */}
                {(post as any).requiredSkills && (post as any).requiredSkills.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-foreground">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {(post as any).requiredSkills.map((skill: string) => (
                        <Badge key={skill} className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Required Interests */}
                {(post as any).requiredInterests && (post as any).requiredInterests.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-foreground">Required Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {(post as any).requiredInterests.map((interest: string) => (
                        <Badge key={interest} className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Special Requirements */}
                {(post as any).specialRequirements && String((post as any).specialRequirements).trim().length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-foreground">Requirements</h3>
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                        {(post as any).specialRequirements}
                      </p>
                    </div>
                  </div>
                )}

                {/* Max Cross-Department Participants */}
                {typeof (post as any).maxCrossDeptParticipants === "number" && (post as any).maxCrossDeptParticipants > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-foreground">Cross-Department Cap</h3>
                    <p className="text-sm text-foreground/80">Max {(post as any).maxCrossDeptParticipants} participant{(post as any).maxCrossDeptParticipants !== 1 ? "s" : ""} from other departments</p>
                  </div>
                )}
              </div>
            )}

            <div className="pt-8 border-t border-border/10">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    disabled={isOwnPost || hasRequested || isConnecting}
                    className={cn(
                      "w-full md:w-auto px-12 h-14 text-lg font-bold rounded-2xl transition-all",
                      hasRequested ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" : "gradient-primary text-primary-foreground shadow-xl shadow-primary/20"
                    )}
                  >
                    {isOwnPost ? (
                      "This is your post"
                    ) : hasRequested ? (
                      "Connection Pending"
                    ) : (
                      <>
                        <Send className="mr-3" size={20} />
                        Send Connection Request
                      </>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent aria-describedby={undefined} className="glass-panel border-border/20">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <MessageSquare className="text-primary" />
                      Introduce Yourself
                    </DialogTitle>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <p className="text-sm text-muted-foreground font-medium">
                      {post.eventName ? (
                          <span>Tell the event organizer why you're interested!</span>
                      ) : (
                          <>Tell <span className="text-primary font-bold">{post.userName}</span> why you're a good fit for this project!</>
                      )}
                    </p>
                    <Textarea
                      placeholder="I'd love to help with the frontend..."
                      value={connectMessage}
                      onChange={(e) => setConnectMessage(e.target.value)}
                      className="min-h-[120px] bg-muted/50 border-input rounded-2xl resize-none text-foreground"
                      disabled={isConnecting}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">{connectMessage.length}/500</p>
                  </div>
                  <DialogFooter>
                    <Button
                      className="w-full h-12 rounded-full font-bold gradient-primary text-primary-foreground"
                      onClick={handleConnect}
                      disabled={isConnecting || connectMessage.trim().length < 10}
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Submit Request"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
