import { db } from "./db";
import { posts, postInteractions, userPreferences, userSearches, users, systemSettings } from "../shared/schema.sqlite";
import { eq, and, inArray, desc, gt, or, isNull, not, sql } from "drizzle-orm";

interface PostScore {
  postId: string;
  score: number;
  reasons: string[];
}

interface RecommendationWeights {
  content: number;
  collaborative: number;
  explore: number;
}

type ExperimentBucket = "control" | "variant";

const WEIGHT_BOUNDS = {
  content: { min: 0.35, max: 0.7 },
  collaborative: { min: 0.2, max: 0.6 },
  explore: { min: 0.05, max: 0.2 },
};

const tuneLocks = new Map<ExperimentBucket, Promise<RecommendationWeights>>();

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getRecommendationBucket(userId: string): ExperimentBucket {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return hash % 2 === 0 ? "control" : "variant";
}

function getDefaultWeights(bucket: ExperimentBucket): RecommendationWeights {
  // Variant intentionally leans slightly collaborative for experimentation.
  return bucket === "variant"
    ? { content: 0.5, collaborative: 0.4, explore: 0.1 }
    : { content: 0.56, collaborative: 0.36, explore: 0.08 };
}

async function getAdaptiveWeights(bucket: ExperimentBucket): Promise<RecommendationWeights> {
  const key = `recommendation_weights_${bucket}`;
  const [row] = await db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
  if (!row || !row.value) {
    return getDefaultWeights(bucket);
  }

  const value = row.value as Partial<RecommendationWeights>;
  const defaults = getDefaultWeights(bucket);
  return {
    content: typeof value.content === "number" ? value.content : defaults.content,
    collaborative: typeof value.collaborative === "number" ? value.collaborative : defaults.collaborative,
    explore: typeof value.explore === "number" ? value.explore : defaults.explore,
  };
}

async function tuneWeightsIfNeeded(bucket: ExperimentBucket): Promise<RecommendationWeights> {
  const inflight = tuneLocks.get(bucket);
  if (inflight) {
    return inflight;
  }

  const lock = (async () => {
  const metaKey = `recommendation_weights_meta_${bucket}`;
  const weightKey = `recommendation_weights_${bucket}`;

  const [meta] = await db.select().from(systemSettings).where(eq(systemSettings.key, metaKey)).limit(1);
  const lastTunedAt = (meta?.value as { lastTunedAt?: string } | null)?.lastTunedAt;
  if (lastTunedAt) {
    const deltaMs = Date.now() - new Date(lastTunedAt).getTime();
    if (deltaMs < 6 * 60 * 60 * 1000) {
      return getAdaptiveWeights(bucket);
    }
  }

  const lookback = new Date();
  lookback.setDate(lookback.getDate() - 14);

  const [agg] = await db
    .select({
      views: sql<number>`COUNT(*) FILTER (WHERE ${postInteractions.interactionType} = 'view')`,
      clicks: sql<number>`COUNT(*) FILTER (WHERE ${postInteractions.interactionType} = 'click')`,
      connections: sql<number>`COUNT(*) FILTER (WHERE ${postInteractions.interactionType} = 'connection_request')`,
    })
    .from(postInteractions)
    .where(gt(postInteractions.createdAt, lookback));

  const views = Number(agg?.views || 0);
  const clicks = Number(agg?.clicks || 0);
  const connections = Number(agg?.connections || 0);
  const ctr = views > 0 ? clicks / views : 0;
  const connectionRate = clicks > 0 ? connections / clicks : 0;

  const base = await getAdaptiveWeights(bucket);
  const ctrTarget = 0.22;
  const connectionTarget = 0.16;
  const delta = (connectionRate - connectionTarget) * 0.08 + (ctr - ctrTarget) * 0.04;

  let collaborative = clamp(base.collaborative + delta, WEIGHT_BOUNDS.collaborative.min, WEIGHT_BOUNDS.collaborative.max);
  let content = clamp(base.content - delta * 0.7, WEIGHT_BOUNDS.content.min, WEIGHT_BOUNDS.content.max);
  let explore = clamp(1 - content - collaborative, WEIGHT_BOUNDS.explore.min, WEIGHT_BOUNDS.explore.max);

  // Normalize to sum exactly to 1 while preserving explore bound first.
  const remainder = 1 - explore;
  const sumMain = content + collaborative || 1;
  content = (content / sumMain) * remainder;
  collaborative = (collaborative / sumMain) * remainder;

  const tuned: RecommendationWeights = {
    content,
    collaborative,
    explore,
  };

  await db
    .insert(systemSettings)
    .values({ key: weightKey, value: tuned, updatedBy: null })
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: { value: tuned, updatedBy: null, updatedAt: new Date() },
    });

  await db
    .insert(systemSettings)
    .values({ key: metaKey, value: { lastTunedAt: new Date().toISOString(), ctr, connectionRate }, updatedBy: null })
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: {
        value: { lastTunedAt: new Date().toISOString(), ctr, connectionRate },
        updatedBy: null,
        updatedAt: new Date(),
      },
    });

  return tuned;
  })();

  tuneLocks.set(bucket, lock);
  try {
    return await lock;
  } finally {
    tuneLocks.delete(bucket);
  }
}

/**
 * Collaborative Filtering: Find users with similar interaction patterns
 * Returns user IDs sorted by similarity (most similar first)
 */
export async function findSimilarUsers(userId: string, limit: number = 10): Promise<string[]> {
  // Get target user's interaction scores
  const targetPrefs = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  if (targetPrefs.length === 0) {
    return [];
  }

  const targetScores = targetPrefs[0].interactionScore as Record<string, number>;
  const targetPostIds = Object.keys(targetScores);

  if (targetPostIds.length === 0) {
    return [];
  }

  // Find users who interacted with similar posts
  const similarUsers = await db
    .select({
      userId: userPreferences.userId,
      interactionScore: userPreferences.interactionScore,
    })
    .from(userPreferences)
    .where(not(eq(userPreferences.userId, userId)))
    .limit(100); // Get top 100 candidates

  // Calculate cosine similarity for each user
  const similarities = similarUsers.map((user) => {
    const userScores = user.interactionScore as Record<string, number>;
    const similarity = calculateCosineSimilarity(targetScores, userScores);
    return { userId: user.userId, similarity };
  });

  // Sort by similarity and return top N
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .map((u) => u.userId);
}

/**
 * Calculate cosine similarity between two interaction score vectors
 */
function calculateCosineSimilarity(
  scores1: Record<string, number>,
  scores2: Record<string, number>
): number {
  const allPostIds = new Set([...Object.keys(scores1), ...Object.keys(scores2)]);

  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (const postId of allPostIds) {
    const score1 = scores1[postId] || 0;
    const score2 = scores2[postId] || 0;

    dotProduct += score1 * score2;
    magnitude1 += score1 * score1;
    magnitude2 += score2 * score2;
  }

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
}

/**
 * Content-Based Filtering: Score posts based on user preferences
 */
export async function scorePostsByPreferences(
  userId: string,
  postIds: string[]
): Promise<PostScore[]> {
  if (postIds.length === 0) {
    return [];
  }

  // Get user preferences
  const prefs = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  if (prefs.length === 0) {
    // Cold-start mode: use profile priors + popularity + recency.
    const [userProfile] = await db
      .select({ skills: users.skills, city: users.city, department: users.department })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const coldPosts = await db
      .select({
        id: posts.id,
        skillsWanted: posts.skillsWanted,
        city: posts.city,
        eventUpvotes: posts.eventUpvotes,
        createdAt: posts.createdAt,
      })
      .from(posts)
      .where(inArray(posts.id, postIds));

    const maxUpvotes = Math.max(...coldPosts.map((p) => Number(p.eventUpvotes || 0)), 1);
    const profileSkills = ((userProfile?.skills as string[] | undefined) || []).map((s) => s.toLowerCase());

    return coldPosts
      .map((post) => {
        const wantedSkills = ((post.skillsWanted as any[] | undefined) || []).map((s: any) => String(s?.name || "").toLowerCase());
        const skillMatch = profileSkills.length > 0 ? calculateArrayOverlap(profileSkills, wantedSkills) : 0;

        const cityMatch = userProfile?.city && post.city && userProfile.city.toLowerCase() === post.city.toLowerCase() ? 1 : 0;
        const popularity = Number(post.eventUpvotes || 0) / maxUpvotes;
        const ageDays = Math.max(0, (Date.now() - new Date(post.createdAt).getTime()) / 86400000);
        const recency = clamp(1 - ageDays / 30, 0, 1);

        const score = skillMatch * 0.5 + cityMatch * 0.2 + popularity * 0.15 + recency * 0.15;
        const reasons: string[] = ["Cold-start profile prior"];
        if (skillMatch > 0.35) reasons.push("Profile skill match");
        if (cityMatch > 0) reasons.push("Same city");
        if (popularity > 0.5) reasons.push("Popular post");

        return { postId: post.id, score, reasons };
      })
      .sort((a, b) => b.score - a.score);
  }

  const userPref = prefs[0];

  // Get posts to score
  const postsToScore = await db
    .select({
      id: posts.id,
      skillsWanted: posts.skillsWanted,
      city: posts.city,
      eventType: posts.eventType,
    })
    .from(posts)
    .where(inArray(posts.id, postIds));

  // Score each post
  const scored = postsToScore.map((post) => {
    let score = 0;
    const reasons: string[] = [];

    // Skills match (40% weight)
    const skillMatch = calculateArrayOverlap(
      userPref.preferredSkills || [],
      (post.skillsWanted as any[] || []).map((s: any) => s.name as string)
    );
    score += skillMatch * 0.4;
    if (skillMatch > 0.5) {
      reasons.push(`${Math.round(skillMatch * 100)}% skill match`);
    }

    // City match (30% weight)
    const cityMatch = (userPref.preferredCities || []).includes(post.city || "") ? 1 : 0;
    score += cityMatch * 0.3;
    if (cityMatch > 0) {
      reasons.push("Preferred city");
    }

    // Event type match (30% weight)
    const eventTypeMatch = (userPref.preferredEventTypes || []).includes(post.eventType || "") ? 1 : 0;
    score += eventTypeMatch * 0.3;
    if (eventTypeMatch > 0) {
      reasons.push("Preferred event type");
    }

    // Boost from past interactions
    const interactionScore = (userPref.interactionScore as Record<string, number>)[post.id] || 0;
    score += interactionScore * 0.2; // 20% boost from past positive interactions
    if (interactionScore > 0.5) {
      reasons.push("Similar to posts you liked");
    }

    return {
      postId: post.id,
      score: Math.min(score, 1), // Cap at 1.0
      reasons,
    };
  });

  return scored.sort((a, b) => b.score - a.score);
}

/**
 * Calculate overlap between two arrays (Jaccard similarity)
 */
function calculateArrayOverlap(arr1: string[], arr2: string[]): number {
  if (arr1.length === 0 || arr2.length === 0) {
    return 0;
  }

  const set1 = new Set(arr1.map((s) => s.toLowerCase()));
  const set2 = new Set(arr2.map((s) => s.toLowerCase()));

  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

/**
 * Hybrid Recommendation: Combine collaborative and content-based filtering
 */
export async function getRecommendedPosts(
  userId: string,
  excludePostIds: string[] = [],
  limit: number = 20
): Promise<PostScore[]> {
  const bucket = getRecommendationBucket(userId);
  const weights = await tuneWeightsIfNeeded(bucket);

  const exclusionClause =
    excludePostIds.length > 0 ? not(inArray(posts.id, excludePostIds)) : undefined;

  // Get all active posts (not deleted, not expired)
  const activePosts = await db
    .select({ id: posts.id })
    .from(posts)
    .where(
      and(
        exclusionClause,
        or(isNull(posts.eventDate), gt(posts.eventDate, new Date()))
      )
    )
    .limit(200); // Get top 200 candidates

  const postIds = activePosts.map((p) => p.id);

  if (postIds.length === 0) {
    return [];
  }

  // Content-based scores
  const contentScores = await scorePostsByPreferences(userId, postIds);

  // Small deterministic exploration boost to avoid filter bubbles.
  const daySeed = new Date().toISOString().slice(0, 10);
  const explorationScore = (postId: string) => {
    const raw = `${postId}:${daySeed}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
    }
    return (hash % 100) / 100; // 0..0.99
  };

  // Collaborative filtering scores
  const similarUsers = await findSimilarUsers(userId, 10);

  // Get posts that similar users liked
  const collaborativeScores: Record<string, number> = {};
  if (similarUsers.length > 0) {
    const similarUserPrefs = await db
      .select()
      .from(userPreferences)
      .where(inArray(userPreferences.userId, similarUsers));

    // Aggregate scores from similar users
    for (const pref of similarUserPrefs) {
      const scores = pref.interactionScore as Record<string, number>;
      for (const [postId, score] of Object.entries(scores)) {
        if (postIds.includes(postId)) {
          collaborativeScores[postId] = (collaborativeScores[postId] || 0) + score;
        }
      }
    }

    // Normalize collaborative scores
    const maxCollabScore = Math.max(...Object.values(collaborativeScores), 1);
    for (const postId in collaborativeScores) {
      collaborativeScores[postId] /= maxCollabScore;
    }
  }

  // Combine scores with adaptive online-tuned weights.
  const finalScores = contentScores.map((post) => {
    const collabScore = collaborativeScores[post.postId] || 0;
    const exploreBoost = explorationScore(post.postId) * weights.explore;
    const finalScore = post.score * weights.content + collabScore * weights.collaborative + exploreBoost;

    const reasons = [...post.reasons];
    if (collabScore > 0.3) {
      reasons.push("Popular with similar users");
    }
    if (exploreBoost > weights.explore * 0.6) {
      reasons.push("Discovery pick");
    }
    reasons.push(`Bucket: ${bucket}`);

    return {
      postId: post.postId,
      score: finalScore,
      reasons,
    };
  });

  // Sort by final score and return top N
  return finalScores.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Update user preferences based on latest interactions
 * Should be called periodically or after significant interactions
 */
export async function updateUserPreferencesFromInteractions(userId: string): Promise<void> {
  // Get recent interactions (last 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const interactions = await db
    .select({
      postId: postInteractions.postId,
      interactionType: postInteractions.interactionType,
      durationSeconds: postInteractions.durationSeconds,
      post: {
        skillsWanted: posts.skillsWanted,
        city: posts.city,
        eventType: posts.eventType,
      },
    })
    .from(postInteractions)
    .innerJoin(posts, eq(postInteractions.postId, posts.id))
    .where(
      and(
        eq(postInteractions.userId, userId),
        gt(postInteractions.createdAt, ninetyDaysAgo)
      )
    );

  if (interactions.length === 0) {
    return;
  }

  // Calculate preference scores
  const skillCounts: Record<string, number> = {};
  const cityCounts: Record<string, number> = {};
  const eventTypeCounts: Record<string, number> = {};
  const postScores: Record<string, number> = {};

  for (const interaction of interactions) {
    // Calculate interaction value
    let value = 0;
    switch (interaction.interactionType) {
      case "view":
        value = 0.1;
        break;
      case "click":
        value = 0.3;
        break;
      case "connection_request":
        value = 1.0;
        break;
      case "interested":
        value = 1.2;
        break;
      case "not_interested":
        value = -0.8;
        break;
      case "skip":
        value = -0.2;
        break;
    }

    // Boost for time spent (cap at 2 minutes)
    const timeBoost = Math.min((interaction.durationSeconds || 0) / 120, 1);
    value *= 1 + timeBoost;

    // Accumulate post score
    postScores[interaction.postId] = (postScores[interaction.postId] || 0) + value;

    // Only extract preferences from positive interactions
    if (value > 0) {
      // Extract skills
      const skills = (interaction.post.skillsWanted as any[] || []).map((s: any) => s.name as string);
      for (const skill of skills) {
        skillCounts[skill] = (skillCounts[skill] || 0) + value;
      }

      // Extract city
      if (interaction.post.city) {
        cityCounts[interaction.post.city] =
          (cityCounts[interaction.post.city] || 0) + value;
      }

      // Extract event type
      if (interaction.post.eventType) {
        eventTypeCounts[interaction.post.eventType] =
          (eventTypeCounts[interaction.post.eventType] || 0) + value;
      }
    }
  }

  // Get top preferences
  const topSkills = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([skill]) => skill);

  const topCities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([city]) => city);

  const topEventTypes = Object.entries(eventTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type]) => type);

  // Normalize post scores to 0-1 range
  const maxScore = Math.max(...Object.values(postScores), 1);
  const normalizedPostScores: Record<string, number> = {};
  for (const [postId, score] of Object.entries(postScores)) {
    normalizedPostScores[postId] = Math.max(0, Math.min(1, score / maxScore));
  }

  // Upsert user preferences
  await db
    .insert(userPreferences)
    .values({
      userId,
      preferredSkills: topSkills,
      preferredCities: topCities,
      preferredEventTypes: topEventTypes,
      interactionScore: normalizedPostScores,
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: {
        preferredSkills: topSkills,
        preferredCities: topCities,
        preferredEventTypes: topEventTypes,
        interactionScore: normalizedPostScores,
        updatedAt: new Date(),
      },
    });
}

/**
 * Get search suggestions based on user's past searches
 */
export async function getSearchSuggestions(userId: string, limit: number = 5): Promise<string[]> {
  const recentSearches = await db
    .select({
      query: userSearches.query,
      resultsCount: userSearches.resultsCount,
      clickedPostIds: userSearches.clickedPostIds,
    })
    .from(userSearches)
    .where(eq(userSearches.userId, userId))
    .orderBy(desc(userSearches.createdAt))
    .limit(50);

  // Score searches by usefulness (searches that had results and led to clicks)
  const searchScores: Record<string, number> = {};

  for (const search of recentSearches) {
    const query = search.query.toLowerCase().trim();
    if (!query) continue;

    let score = 1;

    // Boost if it had results
    if ((search.resultsCount || 0) > 0) {
      score += 2;
    }

    // Boost if user clicked on results
    if (((search.clickedPostIds as string[]) || []).length > 0) {
      score += 5;
    }

    searchScores[query] = (searchScores[query] || 0) + score;
  }

  // Return top searches
  return Object.entries(searchScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([query]) => query);
}

/**
 * Boost preferences based on successful connections (accepted connection requests)
 * This creates a feedback loop that improves recommendations over time
 */
export async function boostPreferencesFromConnection(
  userId: string,
  postId: string,
  wasAccepted: boolean
): Promise<void> {
  // Get the post details
  const [post] = await db
    .select({
      skillsWanted: posts.skillsWanted,
      city: posts.city,
      eventType: posts.eventType,
    })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (!post) return;

  // Get current interaction score
  const prefs = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  if (prefs.length === 0) {
    // No preferences yet - update will happen on next interaction batch
    return;
  }

  const currentPrefs = prefs[0];
  const interactionScore = currentPrefs.interactionScore as Record<string, number>;

  // Apply feedback boost/penalty
  const feedbackValue = wasAccepted ? 0.3 : -0.1; // +0.3 for accepted, -0.1 for rejected
  const currentScore = interactionScore[postId] || 0;
  const newScore = Math.max(0, Math.min(1, currentScore + feedbackValue));

  interactionScore[postId] = newScore;

  // If accepted, also boost preferences for similar attributes
  if (wasAccepted) {
    const skills = (post.skillsWanted as any[] || []).map((s: any) => s.name as string);
    const preferredSkills = currentPrefs.preferredSkills || [];
    const preferredCities = currentPrefs.preferredCities || [];
    const preferredEventTypes = currentPrefs.preferredEventTypes || [];

    // Add skills from successful connection to preferences if not already present
    for (const skill of skills) {
      if (!preferredSkills.includes(skill) && preferredSkills.length < 15) {
        preferredSkills.push(skill);
      }
    }

    // Add city if not present
    if (post.city && !preferredCities.includes(post.city) && preferredCities.length < 10) {
      preferredCities.push(post.city);
    }

    // Add event type if not present
    if (post.eventType && !preferredEventTypes.includes(post.eventType) && preferredEventTypes.length < 10) {
      preferredEventTypes.push(post.eventType);
    }

    // Update preferences with feedback
    await db
      .update(userPreferences)
      .set({
        preferredSkills,
        preferredCities,
        preferredEventTypes,
        interactionScore,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId));
  } else {
    // Just update the interaction score for rejected connections
    await db
      .update(userPreferences)
      .set({
        interactionScore,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId));
  }
}
