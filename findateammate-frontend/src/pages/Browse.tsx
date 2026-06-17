import { useEffect, useState, useMemo, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { PostSkeletonGrid } from "@/components/PostCardSkeleton";
import { PostCard } from "@/components/PostCard";
import { useStore } from "@/hooks/use-store";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, MapPin, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useSearchTracking, getSearchSuggestions, getRecommendedPosts } from "@/hooks/useTracking";
import type { Post } from "@shared/schema";




// Force HMR update
export default function Browse() {
  const { posts, fetchPosts, isLoading, hasMore } = useStore();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // FIX #18: Get initial filter values from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const initialSearch = urlParams.get('search') || '';
  const initialSkill = urlParams.get('skill') || '';
  const initialCity = urlParams.get('city') || '';
  const initialSort = urlParams.get('sort') || 'newest';
  const initialType = urlParams.get('type') || 'all';
  
  // Performance Optimization: Debounce search
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [skillSearch, setSkillSearch] = useState(initialSkill);
  const [debouncedSkill, setDebouncedSkill] = useState(initialSkill);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSkill(skillSearch), 300);
    return () => clearTimeout(timer);
  }, [skillSearch]);

  const [sortBy, setSortBy] = useState(initialSort);
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [citySearch, setCitySearch] = useState(initialCity);
  const [debouncedCity, setDebouncedCity] = useState(initialCity);

  // Search suggestions based on user history
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recommendedFromApi, setRecommendedFromApi] = useState<Post[]>([]);
  const [recommendationBucket, setRecommendationBucket] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch search suggestions once user is available.
  useEffect(() => {
    if (!user?.id) {
      setSearchSuggestions([]);
      return;
    }
    getSearchSuggestions(5).then(suggestions => setSearchSuggestions(suggestions));
  }, [user?.id]);

  // Fetch recommendation IDs from backend model.
  useEffect(() => {
    if (!user?.id) {
      setRecommendedFromApi([]);
      setRecommendationBucket(null);
      return;
    }
    getRecommendedPosts(12, user.id).then(({ posts, bucket }) => {
      setRecommendedFromApi(posts);
      setRecommendationBucket(bucket);
    });
  }, [user?.id]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedCity(citySearch), 300);
    return () => clearTimeout(timer);
  }, [citySearch]);
  
  // FIX #18: Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (debouncedSkill) params.set('skill', debouncedSkill);
    if (debouncedCity) params.set('city', debouncedCity);
    if (sortBy !== 'newest') params.set('sort', sortBy);
    if (typeFilter !== 'all') params.set('type', typeFilter);
    
    const newUrl = params.toString() ? `/teammates?${params.toString()}` : '/teammates';
    if (window.location.pathname + window.location.search !== newUrl) {
      window.history.replaceState(null, '', newUrl);
    }
  }, [debouncedSearch, debouncedSkill, debouncedCity, sortBy, typeFilter]);

  // FIX #12: Safer skill extraction with regex
  const safeBio = user?.bio || "";
  const safeSkills = user?.skills || [];
  const userSkills = useMemo(() => {
    const skillPattern = /\b(React|Vue|Angular|Node|Python|Java|Go|Rust|TypeScript|JavaScript|Figma|Design|UI\/UX|Blockchain|Web3|AI|ML|DevOps|AWS|Docker|Kubernetes)\b/gi;
    const bioSkills = safeBio.match(skillPattern) || [];
    return [...safeSkills, ...bioSkills]
      .map(s => s.toLowerCase())
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i); // Remove duplicates
  }, [safeSkills, safeBio]);

  // FIX #2: Use ref to track if initial fetch completed
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchPosts();
    }
  }, [fetchPosts]);

  // Show personalized matches toast AT MOST ONCE per page mount.
  // Guard ref is only set to true once a match is actually found and shown,
  // so late-loaded posts that match will still trigger the toast.
  const hasShownToastRef = useRef(false);
  useEffect(() => {
    if (posts.length > 0 && !isLoading && user && !hasShownToastRef.current) {
      const matchCount = posts.filter(p => p.skillsWanted.some(s => userSkills.includes(s.name.toLowerCase()))).length;
      if (matchCount > 0) {
        hasShownToastRef.current = true; // Only lock out AFTER a match is found
        toast({
          title: "Personalized Matches",
          description: `We found ${matchCount} projects matching your skills!`,
          className: "glass-panel border-border",
          duration: 5000,
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts.length, isLoading]); // Intentionally stable: user/userSkills captured via closure, ref prevents repeat

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      const aMatches = a.skillsWanted.some(s => userSkills.includes(s.name.toLowerCase()));
      const bMatches = b.skillsWanted.some(s => userSkills.includes(s.name.toLowerCase()));

      // Sort by city match if searching by city
      if (citySearch) {
        const aCityMatch = (a.city || "").toLowerCase().includes(citySearch.toLowerCase());
        const bCityMatch = (b.city || "").toLowerCase().includes(citySearch.toLowerCase());
        if (aCityMatch && !bCityMatch) return -1;
        if (!aCityMatch && bCityMatch) return 1;
      }

      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [posts, userSkills, citySearch]);

  const filteredPosts = useMemo(() => {
    return sortedPosts
      .filter(post => {
        // Bug Fix: Exclude events from Teammates page
        if (post.eventName) return false;

        const matchesSearch = post.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          post.description.toLowerCase().includes(debouncedSearch.toLowerCase());

        const matchesSkill = !debouncedSkill || post.skillsWanted.some(s =>
          s.name.toLowerCase().includes(debouncedSkill.toLowerCase())
        );

        const matchesType = typeFilter === "all" || post.availability === typeFilter;
        const matchesCity = !debouncedCity || (post.city?.toLowerCase().includes(debouncedCity.toLowerCase()));

        return matchesSearch && matchesSkill && matchesType && matchesCity;
      })
      .sort((a, b) => {
        // Bug Fix: Ensure sort is stable and based on consistent dates
        const getSafeTime = (date: string | Date | undefined) => {
          if (!date) return 0;
          const d = new Date(date);
          return isNaN(d.getTime()) ? 0 : d.getTime();
        };

        const dateA = getSafeTime(a.createdAt);
        const dateB = getSafeTime(b.createdAt);

        if (sortBy === "newest") return dateB - dateA;
        if (sortBy === "oldest") return dateA - dateB;
        return 0;
      });
  }, [sortedPosts, debouncedSearch, debouncedSkill, typeFilter, debouncedCity, sortBy]);

  const recommendedPosts = useMemo(() => {
    if (recommendedFromApi.length === 0) {
      // Fallback until recommendations are available.
      return sortedPosts.filter(p => p.skillsWanted.some(s => userSkills.includes(s.name.toLowerCase()))).slice(0, 3);
    }

    const picked = recommendedFromApi
      .filter((p) => !p.eventName)
      .slice(0, 3);

    if (picked.length < 3) {
      const fallback = sortedPosts
        .filter((p) => !p.eventName)
        .filter((p) => !picked.some((existing) => existing.id === p.id))
        .filter((p) => p.skillsWanted.some(s => userSkills.includes(s.name.toLowerCase())))
        .slice(0, 3 - picked.length);
      return [...picked, ...fallback];
    }

    return picked;
  }, [recommendedFromApi, sortedPosts, userSkills]);

  // Track searches and clicks for personalization
  const { trackClick: trackSearchClick } = useSearchTracking(
    debouncedSearch,
    {
      skill: debouncedSkill,
      type: typeFilter,
      city: debouncedCity,
      sort: sortBy,
    },
    filteredPosts.length
  );

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen abstract-bg pb-20 pt-16 font-sans text-foreground">
      <Navbar />

      <header className="pt-24 pb-12 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full bg-primary/10 dark:bg-primary/5 blur-[120px] -z-10" />
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-display font-extrabold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-shimmer bg-clip-text text-transparent leading-[1.1]"
          >
            Find Teammates
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium"
          >
            Browse high-quality project listings and connect with developers who share your vision.
          </motion.p>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 max-w-7xl">
        {recommendedPosts.length > 0 && searchTerm === "" && skillSearch === "" && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-display font-bold flex items-center gap-2 text-foreground">
                  <Sparkles className="text-accent" size={24} /> Suggested for You
                </h2>
                <p className="text-muted-foreground text-sm">Based on your skills and profile activity.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendedPosts.map((post, idx) => (
                <PostCard
                  key={`rec-${post.id}`}
                  post={post}
                  index={idx}
                  onTrackClick={trackSearchClick}
                  clickMetadata={{ source: "suggested", bucket: recommendationBucket || "unknown" }}
                />
              ))}
            </div>
          </section>
        )}

        <div className="mb-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-black mb-2 text-foreground">Teammates</h1>
              <p className="text-muted-foreground font-medium">Find partners for your next competition, event, or project.</p>
            </div>

            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="rounded-full border-border bg-muted/50 backdrop-blur-md hover:bg-muted font-semibold h-9 px-4 text-foreground">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="glass-panel">
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
                ref={searchInputRef}
                placeholder="Search projects, skills, or locations..."
                className="pl-12 h-14 border-none bg-transparent focus-visible:ring-0 text-lg placeholder:text-muted-foreground font-medium text-foreground"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
              />
              
              {/* Search Suggestions Dropdown */}
              {showSuggestions && searchSuggestions.length > 0 && !searchTerm && (
                <div
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 mt-2 glass-panel rounded-2xl border border-border shadow-xl z-50 max-h-60 overflow-y-auto"
                >
                  <div className="p-2">
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      <Clock size={12} />
                      Recent Searches
                    </div>
                    {searchSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setSearchTerm(suggestion);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-primary/10 transition-colors text-sm font-medium text-foreground"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap md:flex-nowrap gap-3">
              <div className="relative w-full md:w-[220px]">
                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  placeholder="Filter by Skill..."
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  className="pl-10 h-14 rounded-2xl border-none bg-muted/50 hover:bg-muted/80 transition-all font-semibold text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[160px] h-14 rounded-2xl border-none bg-muted/50 hover:bg-muted/80 transition-all font-semibold text-foreground">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="glass-panel border-border">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Hackathon">Hackathon</SelectItem>
                  <SelectItem value="Competition">Competition</SelectItem>
                  <SelectItem value="Event">Workshop</SelectItem>
                  <SelectItem value="Academic">Academic</SelectItem>
                  <SelectItem value="Coursework">Coursework</SelectItem>
                  <SelectItem value="Short-term">Short-term</SelectItem>
                  <SelectItem value="Long-term">Startup</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative w-full md:w-[300px]">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  placeholder="Filter by City..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="pl-10 h-14 rounded-2xl border-none bg-muted/50 hover:bg-muted/80 transition-all font-semibold text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {/* Filtering happens automatically via debounced state */}
            </div>
          </div>
        </div>

        {isLoading && posts.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PostSkeletonGrid count={6} />
          </div>
        ) : filteredPosts.length > 0 ? (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredPosts.map((post, index) => (
              <PostCard key={post.id} post={post} index={index} onTrackClick={trackSearchClick} />
            ))}
            
            {hasMore && (
              <div className="col-span-full flex justify-center mt-8 pb-8">
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => fetchPosts(true)} 
                  disabled={isLoading}
                  className="rounded-full px-8 h-12 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all font-bold"
                >
                  {isLoading ? "Loading..." : "Load More Posts"}
                </Button>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <div className="bg-muted/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-foreground">No active posts found</h3>
            <p className="text-muted-foreground">Try adjusting your search filters or check back later.</p>
          </div>
        )}
      </main>
    </div>
  );
}
