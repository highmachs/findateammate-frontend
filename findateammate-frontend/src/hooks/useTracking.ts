import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import type { Post } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const RECOMMENDATION_TTL_MS = 30 * 1000;
const RECOMMENDATION_TIMEOUT_MS = 4000;

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const recommendationIdsCache = new Map<string, CacheEntry<string[]>>();
const recommendationPostsCache = new Map<string, CacheEntry<Post[]>>();

function recommendationCacheKey(limit: number, cacheScope?: string): string {
  return `${cacheScope || "anonymous"}:${limit}`;
}

function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCached<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + RECOMMENDATION_TTL_MS,
  });
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

/**
 * Track post view when component mounts and time spent when it unmounts
 */
export function usePostTracking(postId: string | undefined, enabled: boolean = true) {
  const viewStartTime = useRef<number>(0);
  const tracked = useRef(false);

  useEffect(() => {
    if (!enabled || !postId || tracked.current) return;

    // Track view when component mounts
    viewStartTime.current = Date.now();
    tracked.current = true;

    apiRequest("POST", "/api/interactions", {
      postId,
      interactionType: "view",
      durationSeconds: 0,
    }).catch((err) => console.warn("Failed to track view:", err));

    // Track time spent when component unmounts
    return () => {
      const durationSeconds = Math.floor((Date.now() - viewStartTime.current) / 1000);
      
      if (durationSeconds > 0) {
        // Use sendBeacon for reliable tracking even when page is closing
        const data = JSON.stringify({
          postId,
          interactionType: "view",
          durationSeconds,
        });

        // Try sendBeacon first (works even if page is closing)
        if (navigator.sendBeacon) {
          const blob = new Blob([data], { type: "application/json" });
          navigator.sendBeacon("/api/interactions", blob);
        } else {
          // Fallback to fetch
          fetch("/api/interactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: data,
            keepalive: true,
          }).catch((err) => console.warn("Failed to track duration:", err));
        }
      }

      // Reset guard so reopening the same modal tracks a new view session.
      tracked.current = false;
    };
  }, [postId, enabled]);
}

/**
 * Track post click (user clicked to view details)
 */
export function trackPostClick(postId: string, metadata?: Record<string, any>) {
  apiRequest("POST", "/api/interactions", {
    postId,
    interactionType: "click",
    durationSeconds: 0,
    metadata,
  }).catch((err) => console.warn("Failed to track click:", err));
}

/**
 * Track post skip (user explicitly dismissed or swiped away)
 */
export function trackPostSkip(postId: string) {
  apiRequest("POST", "/api/interactions", {
    postId,
    interactionType: "skip",
    durationSeconds: 0,
  }).catch((err) => console.warn("Failed to track skip:", err));
}

/**
 * Track connection request sent
 */
export function trackConnectionRequest(postId: string) {
  apiRequest("POST", "/api/interactions", {
    postId,
    interactionType: "connection_request",
    durationSeconds: 0,
  }).catch((err) => console.warn("Failed to track connection request:", err));
}

/**
 * Track explicit interest in a post — boosts similar content in recommendations
 */
export function trackInterested(postId: string) {
  apiRequest("POST", "/api/interactions", {
    postId,
    interactionType: "interested",
    durationSeconds: 0,
  }).catch(() => {});
}

/**
 * Track explicit disinterest — suppresses this post and similar content
 */
export function trackNotInterested(postId: string) {
  apiRequest("POST", "/api/interactions", {
    postId,
    interactionType: "not_interested",
    durationSeconds: 0,
  }).catch(() => {});
}

/**
 * Track search query and results
 */
export function trackSearch(
  query: string,
  filters: Record<string, any>,
  resultsCount: number,
  clickedPostIds: string[] = []
) {
  const normalizedQuery = (query || "").trim();
  const safeFilters = filters && typeof filters === "object" ? filters : {};
  const hasFilter = Object.values(safeFilters).some((value) =>
    typeof value === "string" ? value.trim().length > 0 : Boolean(value)
  );
  const safeClickedPostIds = Array.from(new Set((clickedPostIds || []).filter(Boolean)));

  if (!normalizedQuery && !hasFilter && safeClickedPostIds.length === 0) {
    return;
  }

  apiRequest("POST", "/api/searches", {
    query: normalizedQuery,
    filters: safeFilters,
    resultsCount,
    clickedPostIds: safeClickedPostIds,
  }).catch((err) => console.warn("Failed to track search:", err));
}

/**
 * Hook to track search with clicked posts
 */
export function useSearchTracking(
  query: string,
  filters: Record<string, any>,
  resultsCount: number
) {
  const clickedPosts = useRef<Set<string>>(new Set());
  const searchTracked = useRef(false);
  const [location] = useLocation();

  // Track clicked post
  const trackClick = (postId: string) => {
    clickedPosts.current.add(postId);
  };

  // Track search when component unmounts or query changes
  useEffect(() => {
    searchTracked.current = false;
    clickedPosts.current.clear();

    return () => {
      if (!searchTracked.current) {
        trackSearch(query, filters, resultsCount, Array.from(clickedPosts.current));
        searchTracked.current = true;
      }
    };
  }, [query, JSON.stringify(filters), resultsCount]);

  // Also track when navigating away
  useEffect(() => {
    return () => {
      if (clickedPosts.current.size > 0) {
        trackSearch(query, filters, resultsCount, Array.from(clickedPosts.current));
      }
    };
  }, [location]);

  return { trackClick };
}

/**
 * Get personalized post recommendations
 */
export async function getRecommendations(limit: number = 20, cacheScope?: string): Promise<string[]> {
  const key = recommendationCacheKey(limit, cacheScope);
  const cached = getCached(recommendationIdsCache, key);
  if (cached) return cached;

  try {
    const response = await fetchWithTimeout(`/api/recommendations?limit=${limit}`, {
      credentials: "include",
    }, RECOMMENDATION_TIMEOUT_MS);
    
    if (response.ok) {
      const data = await response.json();
      const postIds = data.postIds || [];
      setCached(recommendationIdsCache, key, postIds);
      return postIds;
    }

    return getCached(recommendationIdsCache, key) || [];
  } catch (err) {
    console.warn("Failed to fetch recommendations:", err);
    return getCached(recommendationIdsCache, key) || [];
  }
}

/**
 * Get full recommended teammate posts payload
 */
export async function getRecommendedPosts(limit: number = 12, cacheScope?: string): Promise<{ posts: Post[]; bucket: string | null }> {
  const key = recommendationCacheKey(limit, cacheScope);
  const cached = getCached(recommendationPostsCache, key);
  if (cached) return { posts: cached, bucket: null };

  try {
    const response = await fetchWithTimeout(`/api/recommendations/posts?limit=${limit}`, {
      credentials: "include",
    }, RECOMMENDATION_TIMEOUT_MS);

    if (response.ok) {
      const data = await response.json();
      const posts = data.posts || [];
      setCached(recommendationPostsCache, key, posts);
      return { posts, bucket: data.bucket || null };
    }

    return { posts: getCached(recommendationPostsCache, key) || [], bucket: null };
  } catch (err) {
    console.warn("Failed to fetch recommended posts:", err);
    return { posts: getCached(recommendationPostsCache, key) || [], bucket: null };
  }
}

/**
 * Get search suggestions based on user history
 */
export async function getSearchSuggestions(limit: number = 5): Promise<string[]> {
  try {
    const response = await fetch(`/api/search/suggestions?limit=${limit}`, {
      credentials: "include",
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.suggestions || [];
    }
    
    return [];
  } catch (err) {
    console.warn("Failed to fetch search suggestions:", err);
    return [];
  }
}
