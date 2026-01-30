/**
 * Query Classifier for Design Directory Search
 *
 * Determines whether a query should use local-only search (fast path)
 * or LLM-enhanced search (for complex queries requiring intent parsing).
 */

/**
 * Patterns that indicate a complex query requiring LLM parsing
 */
const COMPLEX_QUERY_PATTERNS = {
  // Rating/score operators
  ratingOperators: /\b(over|under|above|below|more\s+than|less\s+than|greater\s+than|at\s+least|at\s+most)\s*\d+/i,
  ratingKeywords: /\b(top\s*rated|best|highest\s*rated|rating|rated|score|gravity)/i,

  // Pricing filters
  pricingKeywords: /\b(free|freemium|paid|premium|open\s*source|oss|subscription|one-time|lifetime)/i,

  // Comparison queries
  comparisonKeywords: /\b(alternative|alternatives|similar\s+to|like|instead\s+of|vs|versus|compared\s+to|replacement)/i,

  // Multi-intent queries (multiple concepts combined)
  multiIntent: /\b(and|with|for|that|which)\b/i,

  // Explicit filtering language
  filterLanguage: /\b(only|just|exclusively|show\s+me|find\s+me|give\s+me|looking\s+for)\b/i,

  // Feature-based queries
  featureQueries: /\b(tools?\s+for|apps?\s+for|resources?\s+for|software\s+for)\b/i,

  // Category combinations
  categoryPlusModifier: /\b(ai|design|dev|development|learning|community|templates?|inspiration)\s+(tools?|apps?|resources?|platforms?)/i,
};

/**
 * Patterns that indicate a simple query (fast path)
 */
const SIMPLE_QUERY_PATTERNS = {
  // Single tool name (capitalized or known tools)
  singleToolName: /^[A-Z][a-zA-Z0-9\s]{0,20}$/,

  // Very short queries without operators
  veryShort: /^[a-zA-Z]{1,8}$/,
};

/**
 * Known tool names that should always use fast path
 * (partial list - the search engine handles exact matching)
 */
const KNOWN_TOOL_NAMES = new Set([
  'figma',
  'framer',
  'webflow',
  'notion',
  'linear',
  'cursor',
  'claude',
  'chatgpt',
  'midjourney',
  'github',
  'vercel',
  'supabase',
  'tailwind',
  'react',
]);

export interface QueryClassification {
  isComplex: boolean;
  reasons: string[];
  suggestedIntent?: 'filter' | 'find' | 'compare' | 'explore';
}

/**
 * Classify a search query as simple (local-only) or complex (LLM-enhanced)
 */
export function classifyQueryComplexity(query: string): QueryClassification {
  const normalizedQuery = query.toLowerCase().trim();
  const reasons: string[] = [];

  // Empty or very short queries are simple
  if (!normalizedQuery || normalizedQuery.length < 2) {
    return { isComplex: false, reasons: ['query too short'] };
  }

  // Known tool names are simple
  if (KNOWN_TOOL_NAMES.has(normalizedQuery)) {
    return { isComplex: false, reasons: ['known tool name'] };
  }

  // Check for simple patterns first
  if (SIMPLE_QUERY_PATTERNS.veryShort.test(normalizedQuery) && normalizedQuery.length <= 5) {
    return { isComplex: false, reasons: ['very short single word'] };
  }

  // Check for complex patterns
  let suggestedIntent: 'filter' | 'find' | 'compare' | 'explore' | undefined;

  if (COMPLEX_QUERY_PATTERNS.ratingOperators.test(normalizedQuery)) {
    reasons.push('contains rating operator');
    suggestedIntent = 'filter';
  }

  if (COMPLEX_QUERY_PATTERNS.ratingKeywords.test(normalizedQuery)) {
    reasons.push('contains rating keyword');
    suggestedIntent = suggestedIntent || 'filter';
  }

  if (COMPLEX_QUERY_PATTERNS.pricingKeywords.test(normalizedQuery)) {
    reasons.push('contains pricing keyword');
    suggestedIntent = suggestedIntent || 'filter';
  }

  if (COMPLEX_QUERY_PATTERNS.comparisonKeywords.test(normalizedQuery)) {
    reasons.push('comparison query');
    suggestedIntent = 'compare';
  }

  if (COMPLEX_QUERY_PATTERNS.filterLanguage.test(normalizedQuery)) {
    reasons.push('explicit filter language');
    suggestedIntent = suggestedIntent || 'filter';
  }

  if (COMPLEX_QUERY_PATTERNS.featureQueries.test(normalizedQuery)) {
    reasons.push('feature-based query');
    suggestedIntent = suggestedIntent || 'find';
  }

  if (COMPLEX_QUERY_PATTERNS.categoryPlusModifier.test(normalizedQuery)) {
    reasons.push('category with modifier');
    suggestedIntent = suggestedIntent || 'find';
  }

  // Multi-word queries with connecting words often need semantic understanding
  const wordCount = normalizedQuery.split(/\s+/).length;
  if (wordCount >= 4 && COMPLEX_QUERY_PATTERNS.multiIntent.test(normalizedQuery)) {
    reasons.push('multi-intent query');
    suggestedIntent = suggestedIntent || 'find';
  }

  // If we found any complexity indicators, it's complex
  if (reasons.length > 0) {
    return {
      isComplex: true,
      reasons,
      suggestedIntent,
    };
  }

  // Default: treat multi-word queries (3+) as potentially complex
  // to catch semantic queries like "mood board tools"
  if (wordCount >= 3) {
    return {
      isComplex: true,
      reasons: ['multi-word query may need semantic understanding'],
      suggestedIntent: 'find',
    };
  }

  // Simple query
  return { isComplex: false, reasons: ['simple query'] };
}

/**
 * Quick check if a query is simple (for performance)
 */
export function isSimpleQuery(query: string): boolean {
  return !classifyQueryComplexity(query).isComplex;
}

/**
 * Quick check if a query is complex
 */
export function isComplexQuery(query: string): boolean {
  return classifyQueryComplexity(query).isComplex;
}
