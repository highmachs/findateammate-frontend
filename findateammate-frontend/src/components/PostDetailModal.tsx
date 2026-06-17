import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import type { Post } from "@shared/schema";
import { MessageSquareText, MapPin, Clock, Globe, X, ThumbsUp, ThumbsDown, Zap } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useStore } from "@/hooks/use-store";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { formatDistanceToNow, parseISO } from "date-fns";
import { cn, getAssetUrl, getGradient } from "@/lib/utils";
import { SafeExternalLink } from "@/components/SafeExternalLink";
import { usePostTracking, trackConnectionRequest, trackInterested, trackNotInterested } from "@/hooks/useTracking";
import { computeMatchScore } from "@/lib/matching";

interface PostDetailModalProps {
  post: Post;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function PostDetailModal({ post, open, onOpenChange }: PostDetailModalProps) {
  const { user } = useAuth();
  const { sendRequest, requests } = useStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [connectMessage, setConnectMessage] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
    const [interestState, setInterestState] = useState<'none' | 'interested' | 'not_interested'>('none');

    // Compute skill match for teammate posts (non-events)
    const matchResult = useMemo(() => {
      if (!user || post.eventName) return null;
      const userSkills = (user.skills || []).map((s: any) => typeof s === 'string' ? s : s.name ?? '');
      const userInterests = (user.interests || []).map((i: any) => typeof i === 'string' ? i : i.name ?? '');
      const wantedSkills = (post.skillsWanted || []).map((s: any) => typeof s === 'string' ? s : s.name ?? '');
      return computeMatchScore(userSkills, userInterests, wantedSkills, []);
    }, [user, post.skillsWanted, post.eventName]);
  const [isDialogOpen, setIsDialogOpen] = useState(open || false);

  // Keep local dialog state in sync when parent controls `open`.
  useEffect(() => {
    if (typeof open === "boolean") {
      setIsDialogOpen(open);
    }
  }, [open]);

  // Track time spent viewing post details
  usePostTracking(post.id, isDialogOpen);

  const isOwnPost = post.userId === user?.id;
  const hasRequested = requests.some(r => r.postId === post.id && r.fromUserId === user?.id);

  const getAvailabilityColor = (type: string) => {
    switch (type) {
      case "Hackathon": return "from-orange-500 to-rose-500";
      case "Competition": return "from-blue-500 to-indigo-500";
      case "Event": 
      case "Event Project": return "from-amber-500 to-orange-400";
      case "Short Term Project": return "from-emerald-500 to-teal-500";
      case "Long Term/Startup": return "from-purple-500 to-pink-500";
      case "Coursework": return "from-sky-500 to-blue-500";
      case "Guidance": return "from-violet-500 to-purple-500";
      default: return "from-gray-500 to-slate-500";
    }
  };

  const handleConnect = async () => {
    if (!user?.id) {
      toast({ title: "Please login", description: "You need an account to connect with teammates." });
      setLocation("/login");
      return;
    }
    if (isOwnPost || hasRequested) return;

    setIsConnecting(true);
    try {
      await sendRequest(post.id, post.title, post.userId, connectMessage, {
        id: user.id,
        name: user.name,
        skills: user.skills || []
      });
      
      // Track connection request for personalization engine
      trackConnectionRequest(post.id);
      
      toast({
        title: "Request Sent!",
        description: `Your connection request for "${post.title}" has been sent.`,
      });
      setIsDialogOpen(false);
      setConnectMessage("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send connection request",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={(newOpen) => {
      setIsDialogOpen(newOpen);
      onOpenChange?.(newOpen);
    }}>
      <DialogTrigger asChild>
        <div className="cursor-pointer" onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDialogOpen(true);
        }} />
      </DialogTrigger>
      
      <DialogContent aria-describedby={undefined} className="max-w-2xl max-h-[90vh] glass-panel border-border/20 p-0 overflow-hidden">
        <DialogTitle className="sr-only">{post.title || "Post Details"}</DialogTitle>
        <div className="overflow-y-auto max-h-[90vh]">
          {/* Image Section */}
          {post.eventImage && (
            <div className="w-full h-48 bg-muted flex items-center justify-center relative overflow-hidden">
              <img
                src={getAssetUrl(post.eventImage)}
                alt={post.title}
                className="max-w-full max-h-48 w-auto h-auto object-contain"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            </div>
          )}

          {/* Close button - positioned absolutely over image or content */}
          <button
            onClick={() => setIsDialogOpen(false)}
            className="absolute top-4 right-4 z-50 p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-foreground" />
          </button>

          {/* Content Section */}
          <div className="p-6 md:p-8 space-y-8">
            {/* Title & Basic Info */}
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-black mb-4 text-foreground">
                {post.title}
              </h2>
              
              <div className="flex flex-wrap items-center gap-3 mb-6 text-sm text-muted-foreground font-semibold">
                <span className="flex items-center gap-1">
                  <MapPin size={16} className="text-accent" />
                  {post.city || "Remote"}
                </span>
                {post.university && (
                  <span className="flex items-center gap-1 opacity-70">• {post.university}</span>
                )}
                <span className="flex items-center gap-1">
                  <Clock size={16} />
                  {(() => {
                    try {
                      if (!post.createdAt) return "Recently";
                      const date = typeof post.createdAt === 'string' ? parseISO(post.createdAt) : post.createdAt;
                      return !date || isNaN(new Date(date).getTime())
                        ? "Recently"
                        : formatDistanceToNow(date, { addSuffix: true });
                    } catch { return "Recently"; }
                  })()}
                </span>
                {post.eventWebsite && (
                  <SafeExternalLink href={post.eventWebsite} className="text-accent hover:text-accent/80 font-bold flex items-center gap-1">
                    <Globe size={16} />
                    Event Website
                  </SafeExternalLink>
                )}
              </div>

              <Badge className={cn(
                "bg-gradient-to-r text-sm font-bold text-primary-foreground border-none shadow-xl",
                getAvailabilityColor(post.availability)
              )}>
                {post.availability}
              </Badge>
            </div>

            {/* Posted By */}
            {!post.eventName && (
              <div className="flex items-center gap-3 pb-6 border-b border-border/10">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getGradient(post.userName)} text-primary-foreground flex items-center justify-center font-bold text-lg border border-border/50 shadow-lg`}>
                  {post.userName.substring(0, 1).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{post.userName}</h3>
                  <p className="text-sm text-muted-foreground">{post.userSkill}</p>
                </div>
              </div>
            )}

              {/* Match Score — shown for teammate posts when viewer is logged in */}
              {matchResult && !isOwnPost && (
                <div className={cn(
                  "rounded-2xl border p-4 flex items-center justify-between gap-4",
                  matchResult.score >= 70
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : matchResult.score >= 40
                      ? "bg-amber-500/10 border-amber-500/20"
                      : "bg-destructive/10 border-destructive/20"
                )}>
                  <div className="flex items-center gap-2">
                    <Zap size={16} className={
                      matchResult.score >= 70 ? "text-emerald-500" :
                      matchResult.score >= 40 ? "text-amber-500" : "text-destructive"
                    } />
                    <span className="text-sm font-bold text-foreground">
                      {matchResult.score >= 70 ? "Strong Match" : matchResult.score >= 40 ? "Partial Match" : "Low Match"}
                    </span>
                    {matchResult.matchedSkills.length > 0 && (
                      <span className="text-xs text-muted-foreground font-medium">
                        · {matchResult.matchedSkills.join(", ")}
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    "text-2xl font-black tabular-nums",
                    matchResult.score >= 70 ? "text-emerald-500" :
                    matchResult.score >= 40 ? "text-amber-500" : "text-destructive"
                  )}>
                    {matchResult.score}%
                  </span>
                </div>
              )}

            {/* Description */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-primary/60 mb-3">About the Project</h3>
              <p className="text-base leading-relaxed text-foreground/80 whitespace-pre-wrap font-medium">
                {post.description}
              </p>
            </div>

            {/* Skills Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Skills Offered */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-secondary/60 mb-4">Skills I'm Bringing</h3>
                <div className="flex flex-wrap gap-2">
                  {post.skillsOffered.map(skill => (
                    <div key={skill.name} className="flex flex-col gap-1">
                      <Badge className="bg-secondary/20 text-secondary-foreground border-secondary/30 rounded-lg px-3 py-1 text-xs font-bold">
                        {skill.name}
                      </Badge>
                      <span className="text-[9px] font-bold text-secondary/50 uppercase">{skill.level}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills Wanted */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-primary/60 mb-4">Skills I'm Looking For</h3>
                <div className="flex flex-wrap gap-2">
                  {post.skillsWanted.map(skill => (
                    <div key={skill.name} className="flex flex-col gap-1">
                      <Badge className="bg-primary/20 text-primary border-primary/10 rounded-lg px-3 py-1 text-xs font-bold">
                        {skill.name}
                      </Badge>
                      <span className="text-[9px] font-bold text-primary/50 uppercase">{skill.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Event Requirements */}
            {post.eventName && (
              <>
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

                {/* Allowed Departments */}
                {(post as any).allowedDepartments && Array.isArray((post as any).allowedDepartments) && (post as any).allowedDepartments.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-foreground">Allowed Departments</h3>
                    <div className="flex flex-wrap gap-2">
                      {(post as any).allowedDepartments.map((dept: string) => (
                        <Badge key={dept} variant="outline" className="text-xs">
                          {dept}
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
              </>
            )}

            {/* Connection Request Button & Dialog */}
            <div className="pt-8 border-t border-border/10">
                {/* Interested / Not Interested */}
                {!isOwnPost && (
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => {
                        if (interestState === 'interested') {
                          setInterestState('none');
                        } else {
                          setInterestState('interested');
                          trackInterested(post.id);
                        }
                      }}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border transition-all",
                        interestState === 'interested'
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-500"
                          : "border-border/40 text-muted-foreground hover:border-emerald-500/40 hover:text-emerald-500"
                      )}
                    >
                      <ThumbsUp size={15} />
                      Interested
                    </button>
                    <button
                      onClick={() => {
                        if (interestState === 'not_interested') {
                          setInterestState('none');
                        } else {
                          setInterestState('not_interested');
                          trackNotInterested(post.id);
                          toast({
                            title: "Updated recommendations",
                            description: "We’ll show fewer posts like this.",
                          });
                        }
                      }}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border transition-all",
                        interestState === 'not_interested'
                          ? "bg-rose-500/15 border-rose-500/40 text-rose-500"
                          : "border-border/40 text-muted-foreground hover:border-rose-500/40 hover:text-rose-500"
                      )}
                    >
                      <ThumbsDown size={15} />
                      Not Interested
                    </button>
                  </div>
                )}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    disabled={isOwnPost || hasRequested}
                    className={cn(
                      "w-full px-6 h-12 text-base font-bold rounded-full transition-all",
                      hasRequested 
                        ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                        : isOwnPost 
                          ? "bg-muted text-muted-foreground cursor-not-allowed"
                          : "gradient-primary text-primary-foreground shadow-lg shadow-primary/20"
                    )}
                  >
                    {isOwnPost ? "This is your post" : hasRequested ? "Request Sent" : "Send Connection Request"}
                  </Button>
                </DialogTrigger>

                <DialogContent aria-describedby={undefined} className="glass-panel border-border/20 max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-foreground">
                      <MessageSquareText className="text-primary" size={20} />
                      Introduce Yourself
                    </DialogTitle>
                  </DialogHeader>

                  <div className="py-4 space-y-4">
                    <p className="text-sm text-muted-foreground font-medium">
                      {post.eventName ? (
                        <span>Tell the organizers why you're interested!</span>
                      ) : (
                        <>Tell <span className="text-primary font-bold">{post.userName}</span> why you're interested in this project!</>
                      )}
                    </p>
                    <Textarea
                      placeholder="Hi! I'd love to help with..."
                      value={connectMessage}
                      onChange={(e) => setConnectMessage(e.target.value)}
                      className="min-h-[120px] bg-muted/50 rounded-2xl resize-none text-foreground border-border"
                    />
                  </div>

                  <div className="flex gap-2">
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1 rounded-full h-11 font-bold">
                        Cancel
                      </Button>
                    </DialogTrigger>
                    <Button
                      className="flex-1 rounded-full h-11 font-bold gradient-primary text-primary-foreground shadow-lg shadow-primary/20"
                      onClick={handleConnect}
                      disabled={isConnecting}
                    >
                      {isConnecting ? "Sending..." : "Send Request"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
