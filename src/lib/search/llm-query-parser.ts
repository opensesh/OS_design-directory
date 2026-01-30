/**
 * LLM Query Parser for Design Directory Search
 *
 * Uses Claude Haiku to parse natural language queries into structured
 * filters and semantic concepts for intelligent search.
 */

/**
 * Parsed query structure returned by the LLM
 */
export interface ParsedQuery {
  /** The intent behind the query */
  intent: 'filter' | 'find' | 'compare' | 'explore' | 'recommend';

  /** Hard filters that must match exactly */
  filters: {
    pricing?: ('Free' | 'Freemium' | 'Paid' | 'Pay per use')[];
    categories?: string[];
    subCategories?: string[];
    minGravityScore?: number;
    maxGravityScore?: number;
    tags?: string[];
    featured?: boolean;
    opensource?: boolean;
  };

  /** Semantic concepts extracted for soft matching */
  concepts: string[];

  /** Original semantic terms for fallback matching */
  semanticTerms: string[];

  /** Confidence level of the parse */
  confidence: 'high' | 'medium' | 'low';

  /** For comparison queries - the tool being compared against */
  comparisonTarget?: string;

  /** Human-readable explanation of what the query is asking for */
  explanation?: string;
}

/**
 * The system prompt for Claude to parse search queries
 */
const QUERY_PARSER_SYSTEM_PROMPT = `You are a search query parser for a design tool directory. Your job is to understand user queries and extract structured filters and semantic concepts.

Available data fields to filter on:
- category: "Tools", "AI", "Templates", "Learning", "Inspiration", "Community"
- subCategory: "Design", "Development", "Productivity", "Generative", "Assets", "Guides", "Galleries", etc.
- pricing: "Free", "Freemium", "Paid", "Pay per use"
- gravityScore: 7.5 to 9.8 (higher = more important/popular, like a rating)
- tags: design, prototyping, ai, video, animation, icons, collaboration, react, etc.
- featured: true/false
- opensource: true/false

Intent types:
- "filter": User wants to narrow down results by specific criteria
- "find": User is looking for tools that serve a specific purpose
- "compare": User wants alternatives to a specific tool
- "explore": User is browsing/discovering without specific criteria
- "recommend": User wants suggestions based on a use case

Respond with ONLY valid JSON matching this schema:
{
  "intent": "filter" | "find" | "compare" | "explore" | "recommend",
  "filters": {
    "pricing"?: ["Free"] | ["Freemium"] | ["Paid"] | etc.,
    "categories"?: ["Tools", "AI", etc.],
    "subCategories"?: ["Design", "Development", etc.],
    "minGravityScore"?: number (7.5-9.8),
    "maxGravityScore"?: number (7.5-9.8),
    "tags"?: ["tag1", "tag2"],
    "featured"?: boolean,
    "opensource"?: boolean
  },
  "concepts": ["concept1", "concept2"],
  "semanticTerms": ["term1", "term2"],
  "confidence": "high" | "medium" | "low",
  "comparisonTarget"?: "ToolName",
  "explanation"?: "Brief explanation"
}`;

/**
 * Build the user prompt for a specific query
 */
function buildUserPrompt(query: string): string {
  return `Parse this search query: "${query}"

Examples for reference:
- "free tools rated over 9" → {"intent":"filter","filters":{"pricing":["Free"],"minGravityScore":9},"concepts":[],"semanticTerms":["tools"],"confidence":"high"}
- "mood board tools" → {"intent":"find","filters":{},"concepts":["visual inspiration","design curation","image collection","pinterest-like"],"semanticTerms":["mood board","moodboard","inspiration board"],"confidence":"medium"}
- "alternatives to Figma" → {"intent":"compare","filters":{"categories":["Tools"],"subCategories":["Design"]},"concepts":["design tool","ui design","prototyping","collaboration"],"semanticTerms":[],"confidence":"high","comparisonTarget":"Figma"}
- "freemium ai tools" → {"intent":"filter","filters":{"pricing":["Freemium"],"categories":["AI"]},"concepts":[],"semanticTerms":["ai","artificial intelligence"],"confidence":"high"}
- "best design inspiration" → {"intent":"find","filters":{"categories":["Inspiration"]},"concepts":["design gallery","showcase","portfolio"],"semanticTerms":["inspiration","design"],"confidence":"high","minGravityScore":8.5}

Now parse: "${query}"`;
}

/**
 * Parse a query using the Claude API via the Edge Function
 */
export async function parseQueryWithLLM(query: string): Promise<ParsedQuery> {
  try {
    const response = await fetch('/api/search/parse-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const parsed: ParsedQuery = await response.json();

    // Validate and sanitize the response
    return sanitizeParsedQuery(parsed);
  } catch (error) {
    console.warn('LLM query parsing failed, using fallback:', error);
    return createFallbackParse(query);
  }
}

/**
 * Sanitize and validate the parsed query from LLM
 */
function sanitizeParsedQuery(parsed: Partial<ParsedQuery>): ParsedQuery {
  // Ensure valid intent
  const validIntents = ['filter', 'find', 'compare', 'explore', 'recommend'] as const;
  const intent = validIntents.includes(parsed.intent as typeof validIntents[number])
    ? (parsed.intent as ParsedQuery['intent'])
    : 'find';

  // Sanitize filters
  const filters: ParsedQuery['filters'] = {};

  if (parsed.filters) {
    // Validate pricing
    if (Array.isArray(parsed.filters.pricing)) {
      const validPricing = ['Free', 'Freemium', 'Paid', 'Pay per use'];
      filters.pricing = parsed.filters.pricing.filter(p =>
        validPricing.includes(p)
      ) as ParsedQuery['filters']['pricing'];
    }

    // Validate categories
    if (Array.isArray(parsed.filters.categories)) {
      const validCategories = ['Tools', 'AI', 'Templates', 'Learning', 'Inspiration', 'Community'];
      filters.categories = parsed.filters.categories.filter(c =>
        validCategories.includes(c)
      );
    }

    // Validate subCategories (allow any string, just ensure it's an array)
    if (Array.isArray(parsed.filters.subCategories)) {
      filters.subCategories = parsed.filters.subCategories.filter(s => typeof s === 'string');
    }

    // Validate gravity scores
    if (typeof parsed.filters.minGravityScore === 'number') {
      filters.minGravityScore = Math.max(0, Math.min(10, parsed.filters.minGravityScore));
    }
    if (typeof parsed.filters.maxGravityScore === 'number') {
      filters.maxGravityScore = Math.max(0, Math.min(10, parsed.filters.maxGravityScore));
    }

    // Validate tags
    if (Array.isArray(parsed.filters.tags)) {
      filters.tags = parsed.filters.tags.filter(t => typeof t === 'string');
    }

    // Boolean flags
    if (typeof parsed.filters.featured === 'boolean') {
      filters.featured = parsed.filters.featured;
    }
    if (typeof parsed.filters.opensource === 'boolean') {
      filters.opensource = parsed.filters.opensource;
    }
  }

  // Ensure arrays for concepts and semanticTerms
  const concepts = Array.isArray(parsed.concepts)
    ? parsed.concepts.filter(c => typeof c === 'string')
    : [];

  const semanticTerms = Array.isArray(parsed.semanticTerms)
    ? parsed.semanticTerms.filter(t => typeof t === 'string')
    : [];

  // Validate confidence
  const validConfidence = ['high', 'medium', 'low'] as const;
  const confidence = validConfidence.includes(parsed.confidence as typeof validConfidence[number])
    ? (parsed.confidence as ParsedQuery['confidence'])
    : 'medium';

  return {
    intent,
    filters,
    concepts,
    semanticTerms,
    confidence,
    comparisonTarget: typeof parsed.comparisonTarget === 'string' ? parsed.comparisonTarget : undefined,
    explanation: typeof parsed.explanation === 'string' ? parsed.explanation : undefined,
  };
}

/**
 * Create a fallback parse when LLM is unavailable
 * Uses simple heuristics to extract basic filters
 */
export function createFallbackParse(query: string): ParsedQuery {
  const normalizedQuery = query.toLowerCase();
  const filters: ParsedQuery['filters'] = {};
  const concepts: string[] = [];
  let intent: ParsedQuery['intent'] = 'find';

  // Detect pricing
  if (/\bfree\b/.test(normalizedQuery) && !/\bfreemium\b/.test(normalizedQuery)) {
    filters.pricing = ['Free'];
    intent = 'filter';
  } else if (/\bfreemium\b/.test(normalizedQuery)) {
    filters.pricing = ['Freemium'];
    intent = 'filter';
  } else if (/\bpaid\b/.test(normalizedQuery) || /\bpremium\b/.test(normalizedQuery)) {
    filters.pricing = ['Paid'];
    intent = 'filter';
  }

  // Detect rating filters
  const ratingMatch = normalizedQuery.match(/(?:over|above|greater than|at least)\s*(\d+(?:\.\d+)?)/i);
  if (ratingMatch) {
    filters.minGravityScore = parseFloat(ratingMatch[1]);
    intent = 'filter';
  }

  const ratingMatchBelow = normalizedQuery.match(/(?:under|below|less than|at most)\s*(\d+(?:\.\d+)?)/i);
  if (ratingMatchBelow) {
    filters.maxGravityScore = parseFloat(ratingMatchBelow[1]);
    intent = 'filter';
  }

  // Detect categories
  if (/\bai\b/.test(normalizedQuery) || /\bartificial intelligence\b/.test(normalizedQuery)) {
    filters.categories = ['AI'];
  } else if (/\btools?\b/.test(normalizedQuery) && !/\bai tools?\b/.test(normalizedQuery)) {
    filters.categories = ['Tools'];
  } else if (/\binspiration\b/.test(normalizedQuery) || /\binspo\b/.test(normalizedQuery)) {
    filters.categories = ['Inspiration'];
  } else if (/\blearning\b/.test(normalizedQuery) || /\btutorial\b/.test(normalizedQuery)) {
    filters.categories = ['Learning'];
  } else if (/\btemplate\b/.test(normalizedQuery)) {
    filters.categories = ['Templates'];
  } else if (/\bcommunity\b/.test(normalizedQuery)) {
    filters.categories = ['Community'];
  }

  // Detect comparison intent
  const comparisonMatch = normalizedQuery.match(/alternative(?:s)?\s+(?:to|for)\s+(\w+)/i);
  if (comparisonMatch) {
    intent = 'compare';
    return {
      intent,
      filters,
      concepts: ['similar functionality', 'same category'],
      semanticTerms: [],
      confidence: 'low',
      comparisonTarget: comparisonMatch[1],
    };
  }

  // Detect open source preference
  if (/\bopen\s*source\b/.test(normalizedQuery) || /\boss\b/.test(normalizedQuery)) {
    filters.opensource = true;
    intent = 'filter';
  }

  // Extract remaining terms as semantic concepts
  const cleanedQuery = normalizedQuery
    .replace(/\b(free|freemium|paid|premium|open\s*source|oss|over|under|above|below|at least|at most|greater than|less than|tools?|apps?|resources?)\b/gi, '')
    .replace(/\d+(\.\d+)?/g, '')
    .trim();

  if (cleanedQuery.length > 2) {
    concepts.push(cleanedQuery);
  }

  return {
    intent,
    filters,
    concepts,
    semanticTerms: [],
    confidence: 'low',
  };
}

/**
 * Export the system prompt for use in the Edge Function
 */
export { QUERY_PARSER_SYSTEM_PROMPT, buildUserPrompt };
