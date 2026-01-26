/**
 * Fuzzy Matching Utilities for Design Directory Search
 *
 * Lightweight implementation of Levenshtein distance for handling typos
 * No external dependencies - pure TypeScript
 */

/**
 * Calculate the Levenshtein distance between two strings
 * This is the minimum number of single-character edits (insertions, deletions, substitutions)
 * required to transform one string into the other
 */
export function levenshteinDistance(a: string, b: string): number {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();

  // Early exit for identical strings
  if (aLower === bLower) return 0;

  // Early exit for empty strings
  if (aLower.length === 0) return bLower.length;
  if (bLower.length === 0) return aLower.length;

  // Create distance matrix
  const matrix: number[][] = [];

  // Initialize first column
  for (let i = 0; i <= aLower.length; i++) {
    matrix[i] = [i];
  }

  // Initialize first row
  for (let j = 0; j <= bLower.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= aLower.length; i++) {
    for (let j = 1; j <= bLower.length; j++) {
      const cost = aLower[i - 1] === bLower[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[aLower.length][bLower.length];
}

/**
 * Calculate similarity ratio between two strings (0 to 1)
 * 1 = identical, 0 = completely different
 */
export function similarityRatio(a: string, b: string): number {
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1;

  const distance = levenshteinDistance(a, b);
  return 1 - (distance / maxLength);
}

/**
 * Check if two strings are fuzzy matches based on similarity threshold
 */
export function isFuzzyMatch(query: string, target: string, threshold = 0.7): boolean {
  // Skip fuzzy matching for very short queries (too many false positives)
  if (query.length < 3) return false;

  return similarityRatio(query, target) >= threshold;
}

/**
 * Find the best fuzzy match from a list of candidates
 * Returns null if no match meets the threshold
 */
export function findBestMatch(
  query: string,
  candidates: string[],
  threshold = 0.7
): { match: string; similarity: number } | null {
  let bestMatch: string | null = null;
  let bestSimilarity = 0;

  for (const candidate of candidates) {
    const similarity = similarityRatio(query, candidate);
    if (similarity >= threshold && similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestMatch = candidate;
    }
  }

  if (bestMatch) {
    return { match: bestMatch, similarity: bestSimilarity };
  }

  return null;
}

/**
 * Get fuzzy score for use in weighted search results
 * Returns a score from 0 to 1 that can be multiplied by a weight
 */
export function getFuzzyScore(query: string, target: string, threshold = 0.6): number {
  const similarity = similarityRatio(query, target);
  if (similarity < threshold) return 0;

  // Scale the score so that threshold maps to 0 and 1 maps to 1
  return (similarity - threshold) / (1 - threshold);
}

/**
 * Split a query into individual terms for multi-word fuzzy matching
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s\-_.,;:!?]+/)
    .filter(token => token.length > 0);
}

/**
 * Check if any word in the query fuzzy-matches any word in the target
 */
export function hasAnyFuzzyWordMatch(
  query: string,
  target: string,
  threshold = 0.7
): boolean {
  const queryTokens = tokenize(query);
  const targetTokens = tokenize(target);

  for (const qToken of queryTokens) {
    for (const tToken of targetTokens) {
      if (isFuzzyMatch(qToken, tToken, threshold)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Calculate aggregate fuzzy score across all query terms against a target
 * Useful for multi-word queries
 */
export function getMultiTermFuzzyScore(
  query: string,
  target: string,
  threshold = 0.6
): number {
  const queryTokens = tokenize(query);
  const targetTokens = tokenize(target);

  if (queryTokens.length === 0 || targetTokens.length === 0) {
    return 0;
  }

  let totalScore = 0;
  let matchCount = 0;

  for (const qToken of queryTokens) {
    let bestTokenScore = 0;

    // Find the best matching target token for this query token
    for (const tToken of targetTokens) {
      const score = getFuzzyScore(qToken, tToken, threshold);
      if (score > bestTokenScore) {
        bestTokenScore = score;
      }
    }

    if (bestTokenScore > 0) {
      totalScore += bestTokenScore;
      matchCount++;
    }
  }

  // Return average score, weighted by how many query terms matched
  if (matchCount === 0) return 0;

  const coverageBonus = matchCount / queryTokens.length;
  return (totalScore / queryTokens.length) * coverageBonus;
}
