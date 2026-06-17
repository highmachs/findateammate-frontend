import { Navbar } from "@/components/Navbar";
import { useStore } from "@/hooks/use-store";
import { useMemo, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Calendar, MapPin, Info, ArrowBigUp, ArrowBigDown, Search, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { parseISO } from "date-fns";
import { SafeExternalLink } from "@/components/SafeExternalLink";
import { Dialog, DialogContent, DialogClose, DialogTitle } from "@/components/ui/dialog";
import { X, FileText, Timer } from "lucide-react";
import { cn, getAssetUrl } from "@/lib/utils";
import { EventRegistrationModal } from "@/components/EventRegistrationModal";
import { EventSkeletonGrid } from "@/components/EventCardSkeleton";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { computeMatchScore } from "@/lib/matching";
import { COLLEGES } from "@shared/constants";
import { trackInterested, trackNotInterested } from "@/hooks/useTracking";


/**
 * Countdown to event date.
 * If eventDate is set, counts down to that date.
 * Otherwise, counts down from creation time (legacy).
 */
function useEventCountdown(eventDate: string | Date | undefined, createdAt: string | Date | undefined) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    if (!eventDate && !createdAt) return;
    
    const tick = () => {
      try {
        const now = new Date();
        let targetDate: Date | null = null;

        // Prefer eventDate if available
        if (eventDate) {
          const ed = typeof eventDate === 'string' ? parseISO(eventDate) : eventDate;
          if (ed && !isNaN(ed.getTime())) {
            targetDate = ed;
          }
        }

        // Fallback to 48 hours from createdAt if no eventDate
        if (!targetDate && createdAt) {
          const created = typeof createdAt === 'string' ? parseISO(createdAt) : createdAt;
          if (created && !isNaN(created.getTime())) {
            targetDate = new Date(created.getTime() + 48 * 3600000);
          }
        }

        if (!targetDate) { setTimeLeft(""); return; }

        const remaining = targetDate.getTime() - now.getTime();
        if (remaining <= 0) { setTimeLeft("Event ended"); return; }

        const days = Math.floor(remaining / (24 * 3600000));
        const h = Math.floor((remaining % (24 * 3600000)) / 3600000);
        const m = Math.floor((remaining % 3600000) / 60000);

        if (days > 0) {
          setTimeLeft(`${days}d ${h}h`);
        } else {
          setTimeLeft(`${h}h ${m}m`);
        }
      } catch { setTimeLeft(""); }
    };
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [eventDate, createdAt]);
  return timeLeft;
}

function EventCountdown({ eventDate, createdAt }: { eventDate: string | Date | undefined; createdAt: string | Date | undefined }) {
  const timeLeft = useEventCountdown(eventDate, createdAt);
  if (!timeLeft) return null;
  const isUrgent = timeLeft === "Event ended" || timeLeft.startsWith("0h");
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border",
      isUrgent
        ? "bg-destructive/10 border-destructive/20 text-destructive"
        : "bg-primary/5 border-primary/10 text-primary"
    )}>
      <Timer size={14} className={isUrgent ? "animate-pulse" : ""} />
      <span>{timeLeft === "Event ended" ? "Event ended" : `${timeLeft} until event`}</span>
    </div>
  );
}

export default function Events() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { posts, upvoteEvent, downvoteEvent, fetchPosts, isLoading, hasMore } = useStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [citySearch, setCitySearch] = useState("");
  const [sortBy, setSortBy] = useState("upvotes");
  const [selectedPoster, setSelectedPoster] = useState<string | null>(null);
  const [selectedEventDetail, setSelectedEventDetail] = useState<any | null>(null);
  const [, setLocation] = useLocation();
  const [registrationModal, setRegistrationModal] = useState<{ open: boolean; eventId: string; eventName: string; eventType: string; requiredSkills?: string[]; requiredInterests?: string[]; specialRequirements?: string; crossDeptRequiresApproval?: boolean; organizerDepartment?: string } | null>(null);
  const [pendingVoteEventId, setPendingVoteEventId] = useState<string | null>(null);
  const [eventInterest, setEventInterest] = useState<Record<string, "interested" | "not_interested" | "none">>({});
  const [requirementViewingDelay, setRequirementViewingDelay] = useState<{ eventId: string; remainingMs: number } | null>(null);
  const requirementsRef = useRef<HTMLDivElement>(null);
  const requirementDelayTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Handle requirement viewing delay timer (2 seconds before enabling Register button)
  useEffect(() => {
    if (!requirementViewingDelay) {
      if (requirementDelayTimerRef.current) {
        clearInterval(requirementDelayTimerRef.current);
        requirementDelayTimerRef.current = null;
      }
      return;
    }

    requirementDelayTimerRef.current = setInterval(() => {
      setRequirementViewingDelay(prev => {
        if (!prev) return null;
        const newRemaining = prev.remainingMs - 100;
        if (newRemaining <= 0) {
          setRequirementViewingDelay(null);
          return null;
        }
        return { ...prev, remainingMs: newRemaining };
      });
    }, 100);

    return () => {
      if (requirementDelayTimerRef.current) {
        clearInterval(requirementDelayTimerRef.current);
        requirementDelayTimerRef.current = null;
      }
    };
  }, [requirementViewingDelay]);

  // Handle scrolling to requirements section when detail dialog opens with delay
  useEffect(() => {
    if (selectedEventDetail && requirementViewingDelay?.eventId === selectedEventDetail.id && requirementsRef.current) {
      // Use setTimeout to ensure DOM is fully rendered before scrolling
      const scrollTimeout = setTimeout(() => {
        requirementsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return () => clearTimeout(scrollTimeout);
    }
  }, [selectedEventDetail, requirementViewingDelay?.eventId]);


  const events = useMemo(() => {
    return posts
      .filter(p => !!p.eventName) // Must have event name
      .filter(post => {
        try {
          // Validate post has required date field
          if (!post.createdAt) return false;

          const createdAtDate = typeof post.createdAt === 'string' ? parseISO(post.createdAt) : post.createdAt;
          if (isNaN(createdAtDate.getTime())) return false; // Invalid date check

          // Check if event has an eventDate set and exclude if it has passed
          if (post.eventDate) {
            const eventDate = typeof post.eventDate === 'string' ? parseISO(post.eventDate) : post.eventDate;
            if (!isNaN(eventDate.getTime()) && eventDate <= new Date()) {
              return false; // Event date has passed, exclude it
            }
          }

          const matchesSearch = (post.eventName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (post.eventDetails?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (post.title?.toLowerCase() || "").includes(searchTerm.toLowerCase());

          const SAIRAM_COLLEGES = COLLEGES.filter((college) => college.startsWith("SAIRAM"));
          const isSairamEvent =
            (post as any).eventType === "intra-college" &&
            SAIRAM_COLLEGES.includes(((post as any).hostCollege || "").toUpperCase() as any);
          
          const matchesType = typeFilter === "all"
            ? true
            : typeFilter === "sairam-events" 
              ? isSairamEvent
              : typeFilter === "outside-college" 
                ? (post as any).eventType === "outside-college"
                : true;
          const matchesCity = !citySearch || (post.city?.toLowerCase() || "").includes(citySearch.toLowerCase());

          return matchesSearch && matchesType && matchesCity;
        } catch (err) {
          return false; // Skip invalid posts instead of crashing
        }
      })
      .sort((a, b) => {
        const getTime = (date: string | Date | undefined) => {
          if (!date) return 0;
          try {
            const d = typeof date === 'string' ? parseISO(date) : date;
            // Check if date is valid
            return isNaN(d.getTime()) ? 0 : d.getTime();
          } catch (e) {
            return 0;
          }
        };

        if (sortBy === "upvotes") return (b.eventUpvotes || 0) - (a.eventUpvotes || 0);
        if (sortBy === "newest") return getTime(b.createdAt) - getTime(a.createdAt);
        if (sortBy === "oldest") return getTime(a.createdAt) - getTime(b.createdAt);
        return (b.eventUpvotes || 0) - (a.eventUpvotes || 0);
        })
        .sort((a, b) => {
          const aDemoted = (eventInterest[a.id] || "none") === "not_interested" ? 1 : 0;
          const bDemoted = (eventInterest[b.id] || "none") === "not_interested" ? 1 : 0;
          return aDemoted - bDemoted;
      });
        }, [posts, searchTerm, typeFilter, citySearch, sortBy, eventInterest]);

  return (
    <div className="min-h-screen abstract-bg pb-20 pt-24">
      <Navbar />
      <main className="container mx-auto px-4 lg:px-8 max-w-7xl">
        <header className="mb-12">
          <h1 className="text-4xl md:text-6xl font-display font-extrabold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Upcoming Events
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl font-medium">
            Discover hackathons, workshops, and competitions where you can find your next team. Trending events are boosted by the community.
          </p>
        </header>

        <div className="mb-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-2 ml-auto items-center flex-wrap">
              {/* Event Type Filter Buttons */}
              <div className="flex gap-2">
                <Button
                  variant={typeFilter === "all" ? "default" : "outline"}
                  onClick={() => setTypeFilter("all")}
                  className={cn(
                    "rounded-full font-semibold h-9 px-4 transition-all",
                    typeFilter === "all" 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                      : "border-border bg-muted/50 hover:bg-muted text-foreground"
                  )}
                >
                  All Events
                </Button>
                <Button
                  variant={typeFilter === "sairam-events" ? "default" : "outline"}
                  onClick={() => setTypeFilter("sairam-events")}
                  className={cn(
                    "rounded-full font-semibold h-9 px-4 transition-all",
                    typeFilter === "sairam-events" 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                      : "border-border bg-muted/50 hover:bg-muted text-foreground"
                  )}
                >
                  SAIRAM Events
                </Button>
                <Button
                  variant={typeFilter === "outside-college" ? "default" : "outline"}
                  onClick={() => setTypeFilter("outside-college")}
                  className={cn(
                    "rounded-full font-semibold h-9 px-4 transition-all",
                    typeFilter === "outside-college" 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                      : "border-border bg-muted/50 hover:bg-muted text-foreground"
                  )}
                >
                  Outside College Events
                </Button>
              </div>

              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="rounded-full border-border bg-muted/50 backdrop-blur-md hover:bg-muted transition-all font-semibold h-9 px-4 text-foreground">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="glass-panel">
                  <SelectItem value="upvotes">Most Popular</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="glass-panel p-3 rounded-3xl flex flex-col md:flex-row gap-3 shadow-2xl shadow-primary/5 border-border">
            <div className="relative flex-grow group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
              <Input
                placeholder="Search events, skills, or locations..."
                className="pl-12 h-14 border-none bg-transparent focus-visible:ring-0 text-lg placeholder:text-muted-foreground/40 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap md:flex-nowrap gap-3">
              <div className="relative w-full md:w-[300px]">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  placeholder="Filter by City..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="pl-10 h-14 rounded-2xl border-none bg-muted/50 hover:bg-muted/80 transition-all font-semibold text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {/* Note: Search is reactive via useMemo - button kept for UX consistency but triggers no action */}
            </div>
          </div>
        </div>

        {isLoading && events.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <EventSkeletonGrid count={6} />
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event, index) => {
              const isPdf = event.eventImage?.toLowerCase().endsWith(".pdf");
              const imageUrl = getAssetUrl(event.eventImage);
              return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className="h-full bg-card border-border hover:border-primary/50 transition-all duration-300 overflow-hidden group relative shadow-lg hover:shadow-primary/10 cursor-pointer"
                  onClick={() => setSelectedEventDetail(event)}
                >
                  {/* Vote Controls */}
                  <div className="absolute top-4 left-4 z-20 flex flex-col items-center bg-background/80 backdrop-blur-sm rounded-xl p-1 border border-border shadow-sm">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-8 w-8 transition-colors hover:bg-primary/10",
                        (event as any).myVote === 1 ? "text-primary font-bold bg-primary/10" : "hover:text-primary"
                      )}
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (pendingVoteEventId) return;
                        setPendingVoteEventId(event.id);
                        try {
                          await upvoteEvent(event.id);
                        } finally {
                          setPendingVoteEventId(null);
                        }
                      }}
                      disabled={pendingVoteEventId === event.id}
                    >
                      {pendingVoteEventId === event.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <ArrowBigUp size={20} className={(event as any).myVote === 1 ? "fill-current" : ""} />
                      )}
                    </Button>
                    <span className={cn(
                        "text-xs font-black py-1", 
                        (event as any).myVote === 1 ? "text-primary" : (event as any).myVote === -1 ? "text-destructive" : "text-foreground"
                    )}>
                        {event.eventUpvotes || 0}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-8 w-8 transition-colors hover:bg-destructive/10",
                        (event as any).myVote === -1 ? "text-destructive font-bold bg-destructive/10" : "hover:text-destructive"
                      )}
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (pendingVoteEventId) return;
                        setPendingVoteEventId(event.id);
                        try {
                          await downvoteEvent(event.id);
                        } finally {
                          setPendingVoteEventId(null);
                        }
                      }}
                      disabled={pendingVoteEventId === event.id}
                    >
                      {pendingVoteEventId === event.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <ArrowBigDown size={20} className={(event as any).myVote === -1 ? "fill-current" : ""} />
                      )}
                    </Button>
                  </div>

                  {/* Event Image / Placeholder */}
                  <div 
                    className={cn(
                      "min-h-64 bg-muted relative group overflow-hidden transition-all flex items-center justify-center",
                      event.eventImage ? "cursor-pointer hover:opacity-90" : ""
                    )}
                    onClick={(e) => {
                      if (imageUrl) {
                        e.stopPropagation();
                        setSelectedPoster(imageUrl);
                      }
                    }}
                  >
                    {event.eventImage ? (
                      <div className="w-full h-full flex items-center justify-center relative">
                        {isPdf ? (
                           <div className="w-full h-full flex flex-col items-center justify-center bg-primary/5 group-hover:bg-primary/10 transition-colors">
                              <FileText size={48} className="text-primary mb-2" />
                              <span className="text-xs font-bold text-primary uppercase tracking-wider">View PDF Poster</span>
                           </div>
                        ) : (
                          <img
                            src={imageUrl}
                            alt={event.eventName || "Event"}
                            className="max-w-full max-h-96 w-auto h-auto object-contain transition-transform duration-700 group-hover:brightness-110"
                          />
                        )}
                        {!isPdf && <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent pointer-events-none" />}
                      </div>
                    ) : (
                      <div className="w-full h-64 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                        <Calendar className="w-12 h-12 text-primary/40 group-hover:scale-110 transition-transform duration-500" />
                      </div>
                    )}

                    <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground font-bold shadow-lg border-none hover:bg-primary/90">
                      {event.availability}
                    </Badge>

                    {/* Event Type Badge (Intra-College / Outside-College) */}
                    {(event as any).eventType && (
                      <Badge className={cn(
                        "absolute top-4 right-32 font-bold shadow-lg border-none",
                        (event as any).eventType === "intra-college"
                          ? "bg-blue-500/80 text-white hover:bg-blue-500/90"
                          : "bg-slate-600/80 text-white hover:bg-slate-600/90"
                      )}>
                        {(event as any).eventType === "intra-college" ? "🏫 Intra" : "🌍 Outside"}
                      </Badge>
                    )}

                    {/* Open to All Departments Badge */}
                    {(event as any).eventType === "intra-college" && !(event as any).allowedDepartments && (
                      <Badge className="absolute bottom-4 right-4 font-semibold shadow-lg border-emerald-500/50 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/30">
                        ✓ Open to All Departments
                      </Badge>
                    )}
                  </div>

                  {/* Card Content */}
                  <CardHeader className="pb-2 px-6">
                    <CardTitle className="text-xl font-display font-bold leading-tight text-foreground group-hover:text-primary transition-colors mt-2">
                      {event.eventName}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium mt-1">
                      <MapPin size={14} className="text-accent" />
                      {event.city || "Remote"}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 px-6 pb-6">
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {event.eventDetails || "No additional details provided."}
                    </p>

                    {/* Event Date Display */}
                    {(() => {
                      const rawEventDate = (event as any).eventDate;
                      if (!rawEventDate) return null;
                      const parsedEventDate = typeof rawEventDate === "string" ? parseISO(rawEventDate) : rawEventDate;
                      if (!parsedEventDate || isNaN(parsedEventDate.getTime())) return null;
                      return (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold bg-primary/5 border border-primary/10 text-primary">
                          <Calendar size={16} />
                          {parsedEventDate.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </div>
                      );
                    })()}

                    {/* Live Countdown Timer - Shows time until event  */}
                    <EventCountdown eventDate={(event as any).eventDate} createdAt={event.createdAt} />

                    {/* Match Score Display for Intra-College Events with Requirements */}
                    {(event as any).eventType === "intra-college" && ((event as any).requiredSkills?.length > 0 || (event as any).requiredInterests?.length > 0) && user && (() => {
                      const matchResult = computeMatchScore(
                        user.skills || [],
                        user.interests || [],
                        (event as any).requiredSkills || [],
                        (event as any).requiredInterests || []
                      );
                      return (
                        <motion.div 
                          className={cn(
                            "p-3 rounded-xl border space-y-2",
                            matchResult.score >= 40
                              ? "bg-emerald-500/5 border-emerald-500/20"
                              : "bg-amber-500/5 border-amber-500/20"
                          )}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wide"
                              style={{ color: matchResult.score >= 40 ? "rgb(16 185 129)" : "rgb(217 119 6)" }}
                            >
                              {matchResult.score >= 40 ? "✓ Skills Match" : "⚠ Limited Match"}
                            </p>
                            <span className={cn(
                              "text-sm font-bold",
                              matchResult.score >= 40 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                            )}>
                              {Math.round(matchResult.score)}%
                            </span>
                          </div>
                          <Progress value={matchResult.score} className="h-1.5" />
                          <p className="text-xs text-muted-foreground">
                            {matchResult.matchedSkills.length} of {(event as any).requiredSkills?.length || 0} skills match
                          </p>
                        </motion.div>
                      );
                    })()}

                    <div className="pt-4 flex items-center justify-between gap-2 border-t border-border">
                      <div>
                          {/* Show Manage button to: (1) admins viewing organiser events, (2) event creator */}
                          {((user?.isAdmin && (event as any).isEventOrganiser) || user?.id === event.userId) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="rounded-xl border-primary/20 hover:bg-primary/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/organizer`);
                              }}
                            >
                              📊 Manage
                            </Button>
                          )}
                      </div>
                      <div className="flex gap-2 items-center">
                        <button
                          title="Interested — show more like this"
                          onClick={(e) => {
                            e.stopPropagation();
                            const current = eventInterest[event.id] || "none";
                            if (current === "interested") {
                              setEventInterest(prev => ({ ...prev, [event.id]: "none" }));
                              return;
                            }
                            setEventInterest(prev => ({ ...prev, [event.id]: "interested" }));
                            trackInterested(event.id);
                          }}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                            (eventInterest[event.id] || "none") === "interested"
                              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                              : "border-border/40 text-muted-foreground hover:border-emerald-500/40 hover:text-emerald-500"
                          )}
                        >
                          👍 Interested
                        </button>

                        <button
                          title="Not interested — show fewer like this"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEventInterest(prev => ({ ...prev, [event.id]: "not_interested" }));
                            trackNotInterested(event.id);
                            toast({
                              title: "Updated recommendations",
                              description: "We’ll show fewer events like this.",
                            });
                          }}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                            (eventInterest[event.id] || "none") === "not_interested"
                              ? "bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400"
                              : "border-border/40 text-muted-foreground hover:border-rose-500/40 hover:text-rose-500"
                          )}
                        >
                          👎 Not Interested
                        </button>

                        {(() => {
                          // Calculate match score for register button disable logic
                          if ((event as any).eventType === "intra-college" && ((event as any).requiredSkills?.length > 0 || (event as any).requiredInterests?.length > 0) && user) {
                            const matchResult = computeMatchScore(
                              user.skills || [],
                              user.interests || [],
                              (event as any).requiredSkills || [],
                              (event as any).requiredInterests || []
                            );
                            
                            return (
                              <div className="relative">
                                <Button 
                                  size="sm" 
                                  variant="default" 
                                  className="rounded-xl font-semibold"
                                  disabled={!matchResult.isEligible}
                                  title={!matchResult.isEligible ? "Your profile doesn't meet the minimum skill requirement (40%)" : undefined}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEventDetail(event);
                                    setRequirementViewingDelay({ eventId: event.id, remainingMs: 2000 });
                                  }}
                                >
                                  {!matchResult.isEligible ? "Below Minimum Match" : "Join Event"}
                                </Button>
                                {!matchResult.isEligible && (
                                  <div className="absolute top-full mt-2 -left-20 w-56 p-2 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive font-medium flex items-center gap-2 z-10">
                                    <AlertCircle size={14} className="flex-shrink-0" />
                                    Below 40% requirement
                                  </div>
                                )}
                              </div>
                            );
                          }
                          
                          // Only show Register button for intra-college events
                          if ((event as any).eventType === "intra-college") {
                            return (
                              <Button 
                                size="sm" 
                                variant="default" 
                                className="rounded-xl font-semibold"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEventDetail(event);
                                  setRequirementViewingDelay({ eventId: event.id, remainingMs: 2000 });
                                }}
                              >
                                Join Event
                              </Button>
                            );
                          }
                          
                          // Outside-college events: don't show Register button
                          return null;
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              );
            })}
            
            {hasMore && (
              <div className="col-span-full flex justify-center mt-12 pb-8">
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => fetchPosts(true)} 
                  disabled={isLoading}
                  className="rounded-full px-8 h-12 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all font-bold"
                >
                  {isLoading ? "Loading..." : "Load More Events"}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-[2.5rem] border border-border">
            <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Info size={32} className="text-primary opacity-50" />
            </div>
            <h3 className="text-2xl font-display font-bold mb-2 text-foreground">No events found yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Be the first to share an event! Create a post and include the event details to see it here.
            </p>
          </div>
        )}
      </main>

      {/* Poster Viewer Modal */}
      <Dialog open={!!selectedPoster} onOpenChange={(open) => !open && setSelectedPoster(null)}>
        <DialogContent aria-describedby={undefined} className="max-w-4xl w-[95vw] max-h-[90vh] md:h-[90vh] glass-panel p-0 overflow-hidden flex flex-col items-center justify-center border-none">
           <DialogTitle className="sr-only">Event Poster Viewer</DialogTitle>
           <DialogClose className="absolute right-4 top-4 z-50 rounded-full bg-background/50 p-2 hover:bg-background transition-colors text-foreground">
             <X size={24} />
           </DialogClose>
           <div className="w-full h-full bg-black/50 backdrop-blur-md flex items-center justify-center p-4">
              {selectedPoster?.toLowerCase().endsWith(".pdf") ? (
                <iframe 
                  src={selectedPoster} 
                  className="w-full h-full rounded-xl bg-white" 
                  title="Event Poster PDF"
                />
              ) : (
                <img 
                  src={selectedPoster || ""} 
                  alt="Event Poster" 
                  className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" 
                />
              )}
           </div>
        </DialogContent>
      </Dialog>

      {/* Event Detail Modal */}
      {selectedEventDetail && (
        <Dialog open={!!selectedEventDetail} onOpenChange={(open) => !open && setSelectedEventDetail(null)}>
          <DialogContent aria-describedby={undefined} className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto glass-panel border-border">
            <DialogTitle className="sr-only">{selectedEventDetail.eventName || "Event Details"}</DialogTitle>
            <DialogClose className="absolute right-4 top-4 z-50 rounded-full bg-background/80 p-2 hover:bg-background transition-colors text-foreground">
              <X size={24} />
            </DialogClose>
            
            <div className="space-y-6 pt-6">
              {/* Header */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-3xl font-display font-extrabold text-foreground leading-tight">
                    {selectedEventDetail.eventName}
                  </h2>
                  <Badge className="bg-primary text-primary-foreground font-bold shadow-lg">
                    {selectedEventDetail.availability}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {(selectedEventDetail as any).eventType && (
                    <Badge className={cn(
                      "font-semibold",
                      (selectedEventDetail as any).eventType === "intra-college"
                        ? "bg-blue-500/80 text-white"
                        : "bg-slate-600/80 text-white"
                    )}>
                      {(selectedEventDetail as any).eventType === "intra-college" ? "🏫 Intra-College" : "🌍 Outside College"}
                    </Badge>
                  )}
                  {(selectedEventDetail as any).eventType === "intra-college" && !(selectedEventDetail as any).allowedDepartments && (
                    <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/50">
                      ✓ Open to All Departments
                    </Badge>
                  )}
                  {(selectedEventDetail as any).eventType === "intra-college" && (selectedEventDetail as any).allowedDepartments && (
                    <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/50">
                      📋 Specific Departments Only
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-primary" />
                    <span className="font-medium">{selectedEventDetail.city || "Remote"}</span>
                  </div>
                  {(selectedEventDetail as any).hostCollege && (
                    <>
                      <span>•</span>
                      <span className="text-sm font-medium">{(selectedEventDetail as any).hostCollege}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Event Image */}
              {selectedEventDetail.eventImage && (() => {
                const isPdf = selectedEventDetail.eventImage?.toLowerCase().endsWith(".pdf");
                const imageUrl = getAssetUrl(selectedEventDetail.eventImage);
                return (
                  <div className="rounded-xl overflow-hidden border border-border">
                    {isPdf ? (
                      <div className="w-full aspect-video bg-primary/5 flex flex-col items-center justify-center">
                        <FileText size={64} className="text-primary mb-3" />
                        <Button asChild variant="default" className="font-semibold">
                          <SafeExternalLink href={imageUrl} className="flex items-center gap-2">
                            View PDF Poster <ExternalLink size={14} />
                          </SafeExternalLink>
                        </Button>
                      </div>
                    ) : (
                      <img
                        src={imageUrl}
                        alt={selectedEventDetail.eventName || "Event"}
                        className="w-full h-auto object-contain max-h-96"
                      />
                    )}
                  </div>
                );
              })()}

              {/* Event Date & Countdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(() => {
                  const rawEventDate = (selectedEventDetail as any).eventDate;
                  if (rawEventDate) {
                    const parsedEventDate = typeof rawEventDate === "string" ? parseISO(rawEventDate) : rawEventDate;
                    if (parsedEventDate && !isNaN(parsedEventDate.getTime())) {
                      return (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-primary/5 border border-primary/10 text-primary">
                          <Calendar size={18} />
                          <span>{parsedEventDate.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}</span>
                        </div>
                      );
                    }
                  }
                  return null;
                })()}
                <EventCountdown eventDate={(selectedEventDetail as any).eventDate} createdAt={selectedEventDetail.createdAt} />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground">About the Event</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedEventDetail.eventDetails || selectedEventDetail.description || "No additional details provided."}
                </p>
              </div>

              {/* Allowed Departments (if specific) */}
              {(selectedEventDetail as any).allowedDepartments && Array.isArray((selectedEventDetail as any).allowedDepartments) && (selectedEventDetail as any).allowedDepartments.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-foreground">Allowed Departments</h3>
                  <div className="flex flex-wrap gap-2">
                    {(selectedEventDetail as any).allowedDepartments.map((dept: string) => (
                      <Badge key={dept} variant="outline" className="font-medium">
                        {dept}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Requirements Section */}
              <div ref={requirementsRef}>
                {/* Required Skills */}
                {(selectedEventDetail as any).requiredSkills && (selectedEventDetail as any).requiredSkills.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-foreground">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {(selectedEventDetail as any).requiredSkills.map((skill: string) => (
                        <Badge key={skill} className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Required Interests */}
                {(selectedEventDetail as any).requiredInterests && (selectedEventDetail as any).requiredInterests.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-foreground">Required Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {(selectedEventDetail as any).requiredInterests.map((interest: string) => (
                        <Badge key={interest} className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Match Score Display */}
              {(selectedEventDetail as any).eventType === "intra-college" && ((selectedEventDetail as any).requiredSkills?.length > 0 || (selectedEventDetail as any).requiredInterests?.length > 0) && user && (() => {
                const matchResult = computeMatchScore(
                  user.skills || [],
                  user.interests || [],
                  (selectedEventDetail as any).requiredSkills || [],
                  (selectedEventDetail as any).requiredInterests || []
                );
                return (
                  <div className={cn(
                    "p-4 rounded-xl border space-y-3",
                    matchResult.score >= 40
                      ? "bg-emerald-500/5 border-emerald-500/20"
                      : "bg-amber-500/5 border-amber-500/20"
                  )}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold" style={{ color: matchResult.score >= 40 ? "rgb(16 185 129)" : "rgb(217 119 6)" }}>
                        {matchResult.score >= 40 ? "✓ You Match!" : "⚠ Limited Match"}
                      </h3>
                      <span className={cn(
                        "text-2xl font-black",
                        matchResult.score >= 40 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                      )}>
                        {Math.round(matchResult.score)}%
                      </span>
                    </div>
                    <Progress value={matchResult.score} className="h-2" />
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Skills Match</p>
                        <p className="font-semibold">{matchResult.skillMatchPercentage}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Interest Match</p>
                        <p className="font-semibold">{matchResult.interestMatchPercentage}%</p>
                      </div>
                    </div>
                    {matchResult.matchedSkills.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Matching Skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {matchResult.matchedSkills.map(skill => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Organizer Info */}
              <div className="space-y-2 pt-4 border-t border-border">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Organized By</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">{selectedEventDetail.userName?.charAt(0) || "?"}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{selectedEventDetail.userName}</p>
                    <p className="text-sm text-muted-foreground">{selectedEventDetail.userSkill}</p>
                  </div>
                </div>
              </div>

              {/* Special Requirements (if provided by organiser) */}
              {(selectedEventDetail as any).specialRequirements && String((selectedEventDetail as any).specialRequirements).trim().length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Requirements</h3>
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                      {(selectedEventDetail as any).specialRequirements}
                    </p>
                  </div>
                </div>
              )}

              {/* Max Cross-Department Participants */}
              {typeof (selectedEventDetail as any).maxCrossDeptParticipants === "number" && (selectedEventDetail as any).maxCrossDeptParticipants > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Cross-Department Cap</h3>
                  <div className="rounded-xl border border-border/40 bg-muted/20 p-3">
                    <p className="text-sm text-foreground/90">
                      Max {(selectedEventDetail as any).maxCrossDeptParticipants} participant{(selectedEventDetail as any).maxCrossDeptParticipants !== 1 ? "s" : ""} from other departments
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    title="Interested — show more events like this"
                    onClick={() => {
                      const current = eventInterest[selectedEventDetail.id] || "none";
                      if (current === "interested") {
                        setEventInterest(prev => ({ ...prev, [selectedEventDetail.id]: "none" }));
                        return;
                      }
                      setEventInterest(prev => ({ ...prev, [selectedEventDetail.id]: "interested" }));
                      trackInterested(selectedEventDetail.id);
                    }}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-all",
                      (eventInterest[selectedEventDetail.id] || "none") === "interested"
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                        : "border-border/40 text-muted-foreground hover:border-emerald-500/40 hover:text-emerald-500"
                    )}
                  >
                    👍 Interested
                  </button>

                  <button
                    title="Not interested — show fewer like this"
                    onClick={() => {
                      setEventInterest(prev => ({ ...prev, [selectedEventDetail.id]: "not_interested" }));
                      trackNotInterested(selectedEventDetail.id);
                      toast({
                        title: "Updated recommendations",
                        description: "We’ll show fewer events like this.",
                      });
                      setSelectedEventDetail(null);
                    }}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-all",
                      (eventInterest[selectedEventDetail.id] || "none") === "not_interested"
                        ? "bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400"
                        : "border-border/40 text-muted-foreground hover:border-rose-500/40 hover:text-rose-500"
                    )}
                  >
                    👎 Not Interested
                  </button>
                </div>

                <div className="flex gap-3">
                {(selectedEventDetail as any).eventType === "intra-college" && user && (() => {
                  const hasRequirements = (selectedEventDetail as any).requiredSkills?.length > 0 || (selectedEventDetail as any).requiredInterests?.length > 0;
                  const delayRemainingMs = requirementViewingDelay?.eventId === selectedEventDetail.id
                    ? (requirementViewingDelay?.remainingMs ?? 0)
                    : 0;
                  const isDelayActive = delayRemainingMs > 0;
                  const delaySeconds = Math.ceil(delayRemainingMs / 1000);
                  if (hasRequirements) {
                    const matchResult = computeMatchScore(
                      user.skills || [],
                      user.interests || [],
                      (selectedEventDetail as any).requiredSkills || [],
                      (selectedEventDetail as any).requiredInterests || []
                    );
                    return (
                      <Button 
                        variant="default" 
                        className="flex-1 font-semibold" 
                        size="lg"
                        disabled={!matchResult.isEligible || isDelayActive}
                        title={isDelayActive 
                          ? `Please review requirements for ${delaySeconds} more second${delaySeconds !== 1 ? 's' : ''}`
                          : undefined}
                        onClick={() => {
                          setSelectedEventDetail(null);
                          setRequirementViewingDelay(null);
                          setRegistrationModal({
                            open: true,
                            eventId: selectedEventDetail.id,
                            eventName: selectedEventDetail.eventName || "Untitled Event",
                            eventType: (selectedEventDetail as any).eventType || "outside-college",
                            requiredSkills: (selectedEventDetail as any).requiredSkills,
                            requiredInterests: (selectedEventDetail as any).requiredInterests,
                            specialRequirements: (selectedEventDetail as any).specialRequirements,
                            crossDeptRequiresApproval: (selectedEventDetail as any).crossDeptRequiresApproval,
                            organizerDepartment: (selectedEventDetail as any).organizerDepartment || (selectedEventDetail as any).userDepartment
                          });
                        }}
                      >
                        {matchResult.isEligible ? "Register for Event" : "Below Minimum Match (40%)"}
                      </Button>
                    );
                  }
                  return (
                    <Button 
                      variant="default" 
                      className="flex-1 font-semibold" 
                      size="lg"
                      disabled={isDelayActive}
                      title={isDelayActive 
                        ? `Please review requirements for ${delaySeconds} more second${delaySeconds !== 1 ? 's' : ''}`
                        : undefined}
                      onClick={() => {
                        setSelectedEventDetail(null);
                        setRequirementViewingDelay(null);
                        setRegistrationModal({
                          open: true,
                          eventId: selectedEventDetail.id,
                          eventName: selectedEventDetail.eventName || "Untitled Event",
                          eventType: (selectedEventDetail as any).eventType || "outside-college",
                          requiredSkills: (selectedEventDetail as any).requiredSkills,
                          requiredInterests: (selectedEventDetail as any).requiredInterests,
                          specialRequirements: (selectedEventDetail as any).specialRequirements,
                          crossDeptRequiresApproval: (selectedEventDetail as any).crossDeptRequiresApproval,
                          organizerDepartment: (selectedEventDetail as any).organizerDepartment || (selectedEventDetail as any).userDepartment
                        });
                      }}
                    >
                      Register for Event
                    </Button>
                  );
                })()}
                <Button asChild variant="outline" className="flex-1 font-semibold" size="lg">
                  <SafeExternalLink href={selectedEventDetail.eventWebsite || "#"} className="flex items-center justify-center gap-2">
                    Visit Website <ExternalLink size={16} />
                  </SafeExternalLink>
                </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Event Registration Modal */}
      {registrationModal && (
        <EventRegistrationModal
          open={registrationModal.open}
          onOpenChange={(open) => !open && setRegistrationModal(null)}
          eventId={registrationModal.eventId}
          eventName={registrationModal.eventName}
          eventType={registrationModal.eventType as "intra-college" | "outside-college"}
          requiredSkills={registrationModal.requiredSkills}
          requiredInterests={registrationModal.requiredInterests}
          specialRequirements={registrationModal.specialRequirements}
          crossDeptRequiresApproval={registrationModal.crossDeptRequiresApproval}
          userDepartment={user?.department}
          organizerDepartment={registrationModal.organizerDepartment}
          onRegistrationSuccess={() => {
            setRegistrationModal(null);
            fetchPosts();
          }}
        />
      )}
    </div>
  );
}
