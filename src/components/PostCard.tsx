import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Github, Linkedin, MessageSquareText, Timer, ThumbsUp, ThumbsDown } from "lucide-react";
import type { Post } from "@shared/schema";
import { useState, useEffect } from "react";
import { useStore } from "@/hooks/use-store";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { trackPostClick, trackConnectionRequest, trackInterested, trackNotInterested } from "@/hooks/useTracking";

import { parseISO } from "date-fns";
import { Link, useLocation } from "wouter";
import { cn, getGradient, getAssetUrl } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { PostDetailModal } from "./PostDetailModal";

interface PostCardProps {
  post: Post;
  index?: number;
  onTrackClick?: (postId: string) => void;
  clickMetadata?: Record<string, any>;
}

export function PostCard({ post, onTrackClick, clickMetadata }: PostCardProps) {
  const { sendRequest, requests } = useStore();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectMessage, setConnectMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [interestState, setInterestState] = useState<'none' | 'interested' | 'not_interested'>('none');
  const [dismissed, setDismissed] = useState(false);
  const [, setLocation] = useLocation();

  const isOwnPost = user?.id === post.userId;
  const hasConnected = requests.some(r => r.postId === post.id && r.fromUserId === user?.id);

  // Handle card click with tracking
  const handleCardClick = () => {
    trackPostClick(post.id, clickMetadata);
    onTrackClick?.(post.id);
    setIsDetailModalOpen(true);
  };

  // Live countdown timer - 48h for posts, event date for events
  const [timeLeft, setTimeLeft] = useState("");
  const [hoursRemaining, setHoursRemaining] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => {
      try {
        // For events, show countdown to event date; for posts, show 48h countdown from creation
        if (post.eventName && post.eventDate) {
          const eventDate = typeof post.eventDate === 'string' ? parseISO(post.eventDate) : post.eventDate;
          if (!eventDate || isNaN(eventDate.getTime())) { setTimeLeft(""); setHoursRemaining(null); return; }
          const remaining = eventDate.getTime() - Date.now();
          if (remaining <= 0) { setTimeLeft("Event Passed"); setHoursRemaining(0); return; }
          const days = Math.floor(remaining / 86400000);
          const h = Math.floor((remaining % 86400000) / 3600000);
          const m = Math.floor((remaining % 3600000) / 60000);
          const totalHours = Math.floor(remaining / 3600000);
          setHoursRemaining(totalHours);
          if (days > 0) {
            setTimeLeft(`${days}d ${h}h`);
          } else {
            setTimeLeft(`${h}h ${m}m`);
          }
        } else {
          const date = typeof post.createdAt === 'string' ? parseISO(post.createdAt) : post.createdAt;
          if (!date || isNaN(date.getTime())) { setTimeLeft(""); setHoursRemaining(null); return; }
          const remaining = 48 * 3600000 - (Date.now() - date.getTime());
          if (remaining <= 0) { setTimeLeft("Expiring"); setHoursRemaining(0); return; }
          const h = Math.floor(remaining / 3600000);
          const m = Math.floor((remaining % 3600000) / 60000);
          setHoursRemaining(h);
          setTimeLeft(`${h}h ${m}m`);
        }
      } catch { setTimeLeft(""); setHoursRemaining(null); }
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [post.createdAt, post.eventDate, post.eventName]);

  // Bug Fix: Improved skill matching regex and safety
  const getAvailabilityColor = (type: string) => {
    switch (type) {
      case "Hackathon": return "from-orange-500 to-rose-500 uppercase";
      case "Competition": return "from-blue-500 to-indigo-500 uppercase";
      case "Event": 
      case "Event Project": return "from-amber-500 to-orange-400 uppercase";
      case "Short Term Project": return "from-emerald-500 to-teal-500 uppercase";
      case "Long Term/Startup": return "from-purple-500 to-pink-500 uppercase";
      case "Coursework": return "from-sky-500 to-blue-500 uppercase";
      case "Guidance": return "from-violet-500 to-purple-500 uppercase";
      default: return "from-gray-500 to-slate-500 uppercase";
    }
  };

  const handleConnect = async () => {
    if (!user) {
      toast({ title: "Please login", description: "You need an account to connect with teammates." });
      setLocation("/login");
      return;
    }
    if (isOwnPost) return;

    setIsConnecting(true);
    try {
      await sendRequest(post.id, post.title, post.userId, connectMessage, {
        id: user.id,
        name: user.name,
        skills: user.skills || []
      });
      
      // Track connection request interaction
      trackConnectionRequest(post.id);
      
      setIsDialogOpen(false);
      toast({
        title: "Request Sent",
        description: `Connection request sent to ${post.userName}`,
      });
    } catch (e) {
      toast({ title: "Error", description: "Failed to send request", variant: "destructive" });
    } finally {
      setIsConnecting(false);
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const cardContent = (
    <motion.div
      layout
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.25 } }}
      variants={item}
      className="group glass-card rounded-3xl flex flex-col h-full hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden bg-card/20 shadow-xl border-border cursor-pointer"
      onClick={handleCardClick}
    >

      {post.eventImage && (
        <div className="w-full min-h-48 bg-muted relative overflow-hidden flex items-center justify-center">
          <img
            src={getAssetUrl(post.eventImage)}
            alt={post.title}
            className="max-w-full max-h-64 w-auto h-auto object-contain transition-transform duration-700 group-hover:brightness-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent pointer-events-none" />
        </div>
      )}

      <div className="p-6 md:p-8 flex flex-col flex-grow relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 mr-4">
            <h3 className="text-2xl font-display font-black text-foreground mb-2 group-hover:text-primary transition-colors cursor-pointer leading-tight">
              {post.title}
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground font-semibold">
              <span className="flex items-center gap-1"><MapPin size={14} className="text-accent" /> {post.city || "Remote"}</span>
              {post.university && <span className="flex items-center gap-1 opacity-70">• {post.university}</span>}
              {timeLeft && (
                <span className={cn(
                  "flex items-center gap-1 text-xs font-bold",
                  timeLeft === "Expiring" || timeLeft === "Event Passed" || (hoursRemaining !== null && hoursRemaining <= 6) ? "text-destructive" : "text-primary/70"
                )}>
                  <Timer size={12} className={timeLeft === "Expiring" || timeLeft === "Event Passed" ? "animate-pulse" : ""} />
                  {timeLeft === "Expiring" || timeLeft === "Event Passed" ? timeLeft : `${timeLeft} left`}
                </span>
              )}
            </div>
          </div>
          <Badge className={cn(
            "px-3 py-1.5 bg-gradient-to-r text-[10px] font-black tracking-widest text-primary-foreground border-none shadow-xl",
            getAvailabilityColor(post.availability)
          )}>
            {post.availability}
          </Badge>
        </div>

        <Link href={`/profile/${post.userId}`} className="flex items-center gap-3 mb-6 cursor-pointer group/user self-start">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getGradient(post.userName)} text-primary-foreground flex items-center justify-center font-bold text-sm border border-border/50 shadow-lg group-hover/user:scale-110 transition-transform`}>
            {post.userName.substring(0, 1).toUpperCase()}
          </div>
          <div>
            <h4 className="font-bold text-sm leading-tight flex items-center gap-1 text-foreground group-hover/user:text-primary transition-colors">
              {post.userName}
              {post.userId === "user-2" && <Github size={12} className="text-[#2dba4e]" />}
              {post.userId === "user-3" && <Linkedin size={12} className="text-[#0077b5]" />}
            </h4>
            <span className="text-xs text-muted-foreground font-medium">{post.userSkill}</span>
          </div>
        </Link>

        <p className="text-muted-foreground text-sm line-clamp-3 mb-8 flex-grow font-medium leading-relaxed">
          {post.description}
        </p>

        <div className="space-y-6 pt-6 border-t border-border/10">
          {post.skillsWanted && post.skillsWanted.length > 0 && (
            <div>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] block mb-3 opacity-60">Looking For Teammate</span>
              <div className="flex flex-wrap gap-2">
                {post.skillsWanted.slice(0, 4).map((skill) => (
                  <div key={skill.name} className="flex flex-col gap-1">
                    <Badge variant="secondary" className="bg-primary/5 hover:bg-primary/10 text-primary border border-primary/10 rounded-lg px-2.5 py-1 text-xs font-bold">
                      {skill.name}
                    </Badge>
                    <span className="text-[9px] font-bold text-primary/50 uppercase text-center tracking-tighter">{skill.level}</span>
                  </div>
                ))}
                {post.skillsWanted.length > 4 && (
                  <Badge variant="secondary" className="bg-muted border border-border rounded-lg self-start text-[10px] font-bold">+{post.skillsWanted.length - 4}</Badge>
                )}
              </div>
            </div>
          )}

          {/* Event Requirements */}
          {post.eventName && (
            <div>
              {/* Required Skills */}
              {(post as any).requiredSkills && (post as any).requiredSkills.length > 0 && (
                <div>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] block mb-3 opacity-60">Required Skills</span>
                  <div className="flex flex-wrap gap-2">
                    {(post as any).requiredSkills.slice(0, 3).map((skill: string) => (
                      <Badge key={skill} className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20 text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {(post as any).requiredSkills.length > 3 && (
                      <Badge variant="secondary" className="text-[10px] font-bold">+{(post as any).requiredSkills.length - 3}</Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Required Interests */}
              {(post as any).requiredInterests && (post as any).requiredInterests.length > 0 && (
                <div className="mt-4">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] block mb-3 opacity-60">Required Interests</span>
                  <div className="flex flex-wrap gap-2">
                    {(post as any).requiredInterests.slice(0, 3).map((interest: string) => (
                      <Badge key={interest} className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 text-xs">
                        {interest}
                      </Badge>
                    ))}
                    {(post as any).requiredInterests.length > 3 && (
                      <Badge variant="secondary" className="text-[10px] font-bold">+{(post as any).requiredInterests.length - 3}</Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Special Requirements */}
              {(post as any).specialRequirements && String((post as any).specialRequirements).trim().length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-[0.2em] mb-2 opacity-70">Requirements</p>
                  <p className="text-xs text-foreground/80 line-clamp-2">
                    {(post as any).specialRequirements}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-border/10 flex items-center justify-between">
          {/* Interest signal buttons */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              title="Interested — show more like this"
              onClick={() => {
                if (interestState === 'interested') {
                  setInterestState('none');
                } else {
                  setInterestState('interested');
                  trackInterested(post.id);
                }
              }}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all border",
                interestState === 'interested'
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-500"
                  : "border-border/30 text-muted-foreground hover:border-emerald-500/40 hover:text-emerald-500"
              )}
            >
              <ThumbsUp size={13} />
            </button>
            <button
              title="Not interested — hide this post"
              onClick={() => {
                setInterestState('not_interested');
                trackNotInterested(post.id);
                toast({
                  title: "Updated recommendations",
                  description: "We’ll show fewer posts like this.",
                });
                // Fade out the card after a brief pause
                setTimeout(() => setDismissed(true), 400);
              }}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all border",
                interestState === 'not_interested'
                  ? "bg-rose-500/15 border-rose-500/40 text-rose-500"
                  : "border-border/30 text-muted-foreground hover:border-rose-500/40 hover:text-rose-500"
              )}
            >
              <ThumbsDown size={13} />
            </button>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <div
                className="relative z-20"
                onClick={(event) => event.stopPropagation()}
              >
                <Button
                  size="sm"
                  disabled={isConnecting || hasConnected || isOwnPost}
                  className={cn(
                    "rounded-full px-5 transition-all h-9 font-bold",
                    hasConnected ? "bg-emerald-500 hover:bg-emerald-600 text-white" : isOwnPost ? "bg-muted text-muted-foreground" : ""
                  )}
                >
                  {isConnecting ? "..." : hasConnected ? "Sent" : isOwnPost ? "Yours" : "Connect"}
                </Button>
              </div>
            </DialogTrigger>
            <DialogContent aria-describedby={undefined} className="glass-panel border-white/20">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-foreground">
                  <MessageSquareText className="text-primary" />
                  Introduce Yourself
                </DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-muted-foreground mb-4 font-medium">
                  Sending a short message to <span className="text-primary font-bold">{post.userName}</span> increases your chances of connecting!
                </p>
                <Textarea
                  placeholder="Hi! I saw your project and I'd love to help with..."
                  value={connectMessage}
                  onChange={(e) => setConnectMessage(e.target.value)}
                  className="min-h-[120px] bg-muted/50 rounded-2xl resize-none text-foreground border-border"
                />
              </div>
              <DialogFooter>
                <Button
                  className="w-full rounded-full h-12 font-bold gradient-primary shadow-lg shadow-primary/20 text-primary-foreground"
                  onClick={handleConnect}
                  disabled={isConnecting}
                >
                  {isConnecting ? "Sending..." : "Send Request"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <PostDetailModal 
        post={post} 
        open={isDetailModalOpen} 
        onOpenChange={setIsDetailModalOpen}
      />
    </motion.div>
  );

  return (
    <AnimatePresence>
      {!dismissed && cardContent}
    </AnimatePresence>
  );
}
