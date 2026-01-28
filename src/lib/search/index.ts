/**
 * Semantic Search Library for Design Directory
 *
 * Export all search-related functionality from a single entry point
 */

// Core search functionality
export {
  semanticSearch,
  quickSearch,
  getSuggestions,
  type ScoredResult,
  type MatchQuality,
  type SearchMetadata,
  type SearchResponse,
} from './semantic-search';

// AI response generation
export {
  generateAIResponse,
  generateWelcomeResponse,
  generateCategoryResponse,
  generateFilterResponse,
  type AIResponse,
} from './ai-response-generator';

// Semantic mappings (for extension/customization)
export {
  synonymGroups,
  conceptMappings,
  categoryAliases,
  pricingKeywords,
  expandSynonyms,
  detectConcepts,
  resolveCategory,
  resolvePricing,
} from './semantic-mappings';

// Fuzzy matching utilities
export {
  levenshteinDistance,
  similarityRatio,
  isFuzzyMatch,
  findBestMatch,
  getFuzzyScore,
  tokenize,
  hasAnyFuzzyWordMatch,
  getMultiTermFuzzyScore,
} from './fuzzy-match';

// Validation utilities (for build-time checks)
export {
  validateSearchData,
  validateConceptMappings,
  getValidationReport,
  type ValidationError,
  type ValidationResult,
} from './validate-search-data';
