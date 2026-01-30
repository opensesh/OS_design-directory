/**
 * Vercel Edge Function for LLM Query Parsing
 *
 * Securely proxies Claude API calls to parse search queries
 * into structured filters and semantic concepts.
 */

import Anthropic from '@anthropic-ai/sdk';

export const config = {
  runtime: 'edge',
};

/**
 * System prompt for query parsing
 */
const SYSTEM_PROMPT = `You are a search query parser for a design tool directory. Your job is to understand user queries and extract structured filters and semantic concepts.

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

IMPORTANT: Respond with ONLY valid JSON, no markdown, no code blocks.`;

/**
 * Build the user prompt for parsing
 */
function buildUserPrompt(query: string): string {
  return `Parse this search query into structured JSON: "${query}"

Return JSON with this structure:
{
  "intent": "filter" | "find" | "compare" | "explore" | "recommend",
  "filters": {
    "pricing": ["Free"] (optional array),
    "categories": ["Tools"] (optional array),
    "subCategories": ["Design"] (optional array),
    "minGravityScore": 9 (optional number),
    "maxGravityScore": 10 (optional number),
    "tags": ["design"] (optional array),
    "featured": true (optional boolean),
    "opensource": true (optional boolean)
  },
  "concepts": ["concept1", "concept2"] (semantic concepts for soft matching),
  "semanticTerms": ["term1"] (original terms for fallback),
  "confidence": "high" | "medium" | "low",
  "comparisonTarget": "Figma" (optional, for comparison queries),
  "explanation": "Brief explanation" (optional)
}

Examples:
- "free tools rated over 9" → {"intent":"filter","filters":{"pricing":["Free"],"minGravityScore":9},"concepts":[],"semanticTerms":["tools"],"confidence":"high"}
- "mood board tools" → {"intent":"find","filters":{},"concepts":["visual inspiration","design curation","image collection","pinterest-like","collage"],"semanticTerms":["mood board"],"confidence":"medium"}
- "alternatives to Figma" → {"intent":"compare","filters":{"categories":["Tools"]},"concepts":["design tool","ui design","prototyping"],"semanticTerms":[],"confidence":"high","comparisonTarget":"Figma"}

Now parse: "${query}"`;
}

export default async function handler(req: Request): Promise<Response> {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse request body
  let query: string;
  try {
    const body = await req.json();
    query = body.query;

    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid query parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check for API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'API key not configured' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey,
    });

    // Call Claude Haiku for fast, cost-effective parsing
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildUserPrompt(query),
        },
      ],
    });

    // Extract text content
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // Parse the JSON response
    let parsed;
    try {
      // Clean up potential markdown code blocks
      let jsonText = textContent.text.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
      }
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', textContent.text);
      throw new Error('Invalid JSON from Claude');
    }

    // Return the parsed query
    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Claude API error:', error);

    // Return a fallback response that the client can use
    return new Response(
      JSON.stringify({
        intent: 'find',
        filters: {},
        concepts: [],
        semanticTerms: [query],
        confidence: 'low',
        error: 'LLM parsing failed',
      }),
      {
        status: 200, // Return 200 with fallback so client doesn't crash
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
