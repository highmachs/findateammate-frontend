/**
 * Frontend matching utilities
 * Client-side version of the backend matching algorithm for instant UI feedback
 */

export interface MatchResult {
  score: number; // 0-100
  skillMatchPercentage: number; // 0-100
  interestMatchPercentage: number; // 0-100
  matchedSkills: string[];
  matchedInterests: string[];
  missingSkills: string[];
  missingInterests: string[];
  isEligible: boolean; // score >= 40
}

/**
 * Normalize array: trim, lowercase, deduplicate
 */
function normalizeArray(arr: string[]): string[] {
  if (!Array.isArray(arr)) return [];
  const normalized = arr
    .map(item => (typeof item === 'string' ? item.trim().toLowerCase() : ''))
    .filter(item => item.length > 0);
  return Array.from(new Set(normalized));
}

/**
 * Find intersection between two arrays (case-insensitive)
 */
function findIntersection(arr1: string[], arr2: string[]): string[] {
  const set2 = new Set(arr2);
  return arr1.filter(item => set2.has(item));
}

/**
 * Compute match score between a student profile and an event's requirements
 * 
 * @param studentSkills - Array of skills the student has
 * @param studentInterests - Array of interests the student has
 * @param requiredSkills - Array of skills required by the event
 * @param requiredInterests - Array of interests relevant to the event
 * @returns MatchResult with score (0-100) and breakdown
 */
export function computeMatchScore(
  studentSkills: string[] = [],
  studentInterests: string[] = [],
  requiredSkills: string[] = [],
  requiredInterests: string[] = []
): MatchResult {
  // Handle empty requirements - 100% match (no specific requirements)
  if (requiredSkills.length === 0 && requiredInterests.length === 0) {
    return {
      score: 100,
      skillMatchPercentage: 100,
      interestMatchPercentage: 100,
      matchedSkills: [],
      matchedInterests: [],
      missingSkills: [],
      missingInterests: [],
      isEligible: true,
    };
  }

  // Normalize and deduplicate
  const normalizedStudentSkills = normalizeArray(studentSkills);
  const normalizedStudentInterests = normalizeArray(studentInterests);
  const normalizedRequiredSkills = normalizeArray(requiredSkills);
  const normalizedRequiredInterests = normalizeArray(requiredInterests);

  // Calculate skill matches
  const skillMatches = findIntersection(
    normalizedStudentSkills,
    normalizedRequiredSkills
  );
  const skillMatchPercentage =
    normalizedRequiredSkills.length > 0
      ? (skillMatches.length / normalizedRequiredSkills.length) * 100
      : 100; // No required skills = 100% match

  // Calculate interest matches
  const interestMatches = findIntersection(
    normalizedStudentInterests,
    normalizedRequiredInterests
  );
  const interestMatchPercentage =
    normalizedRequiredInterests.length > 0
      ? (interestMatches.length / normalizedRequiredInterests.length) * 100
      : 100; // No required interests = 100% match

  // Combined score: 60% skills, 40% interests
  const score =
    (skillMatchPercentage * 0.6) + (interestMatchPercentage * 0.4);

  // Determine eligibility (minimum 40% score)
  const isEligible = score >= 40;

  // Calculate missing items
  const missingSkills = normalizedRequiredSkills.filter(
    (skill) => !skillMatches.includes(skill)
  );
  const missingInterests = normalizedRequiredInterests.filter(
    (interest) => !interestMatches.includes(interest)
  );

  return {
    score: Math.round(score),
    skillMatchPercentage: Math.round(skillMatchPercentage),
    interestMatchPercentage: Math.round(interestMatchPercentage),
    matchedSkills: skillMatches,
    matchedInterests: interestMatches,
    missingSkills,
    missingInterests,
    isEligible,
  };
}

/**
 * Get color class based on match score
 */
export function getMatchScoreColor(score: number): string {
  if (score >= 70) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

/**
 * Get background color class based on match score
 */
export function getMatchScoreBackground(score: number): string {
  if (score >= 70) return "bg-emerald-500/10 border-emerald-500/20";
  if (score >= 40) return "bg-amber-500/10 border-amber-500/20";
  return "bg-destructive/10 border-destructive/20";
}
