/**
 * Cross-Department Event Matching Algorithm
 * 
 * Computes a match score for students registering for cross-department events.
 * Score = (skillMatch% × 60) + (interestMatch% × 40)
 * Minimum 40% score required for registration.
 */

/**
 * Match result data structure
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
 * Normalize array: lowercase, trim, deduplicate, remove empty strings
 */
function normalizeArray(arr: unknown[]): string[] {
  if (!Array.isArray(arr)) return [];

  return Array.from(
    new Set(
      arr
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.toLowerCase().trim())
        .filter((item) => item.length > 0)
    )
  );
}

/**
 * Find intersection of two arrays (case-insensitive)
 */
function findIntersection(arr1: string[], arr2: string[]): string[] {
  const set1 = new Set(arr1.map((s) => s.toLowerCase()));
  return arr2.filter((item) => set1.has(item.toLowerCase()));
}

/**
 * Validate match score eligibility
 */
export function isEligibleForCrossDeptRegistration(score: number): boolean {
  return score >= 40;
}

/**
 * Format match result for API response
 */
export function formatMatchResult(result: MatchResult) {
  return {
    score: result.score,
    isEligible: result.isEligible,
    skillMatch: result.skillMatchPercentage,
    interestMatch: result.interestMatchPercentage,
    matchedSkills: result.matchedSkills,
    matchedInterests: result.matchedInterests,
    missingSkills: result.missingSkills,
    missingInterests: result.missingInterests,
  };
}

/**
 * Generate human-readable eligibility message
 */
export function generateEligibilityMessage(result: MatchResult): string {
  if (!result.isEligible) {
    const missingCount =
      result.missingSkills.length + result.missingInterests.length;
    return `You don't meet the minimum requirements. Match score: ${result.score}%. Missing ${missingCount} requirement${missingCount !== 1 ? "s" : ""}.`;
  }

  if (result.score === 100) {
    return "Perfect match! You meet all requirements.";
  }

  return `Good match! You meet ${result.score}% of requirements. Missing: ${
    result.missingSkills.length > 0
      ? result.missingSkills.join(", ") + " (skills)"
      : ""
  } ${
    result.missingInterests.length > 0
      ? result.missingInterests.join(", ") + " (interests)"
      : ""
  }`.trim();
}
