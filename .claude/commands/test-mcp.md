---
description: Test MCP server connection and all tools
allowed-tools: Bash, Read
---

Run an automated test suite against the BOS MCP server. This validates environment, authentication, all 10 tools, the resource endpoint, asset proxy, and error sanitization.

## Setup

1. **Determine the base URL:**
   - If the dev server is running: `http://localhost:3000`
   - Otherwise use `NEXT_PUBLIC_APP_URL` or `https://bos-3-0.vercel.app`
   - Verify the base URL is reachable with a quick `curl -s -o /dev/null -w "%{http_code}" {BASE_URL}`

2. **Get the MCP API key:**
   - Check if `MCP_TEST_API_KEY` env var is set
   - If not, ask the user for their MCP API key (generated in BOS settings)

3. **Initialize results tracking:**
   - Track pass/fail/skip counts
   - Store failure details for summary

## Test Execution

Run tests sequentially. For each test, report the result inline: PASS, FAIL (with reason), or SKIP (with reason).

### Phase 1: Environment Check

Check that required env vars are set (read their existence, not their values):

```bash
# Check each var exists (non-empty)
[ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && echo "PASS: NEXT_PUBLIC_SUPABASE_URL" || echo "FAIL: NEXT_PUBLIC_SUPABASE_URL not set"
[ -n "$SUPABASE_SERVICE_ROLE_KEY" ] && echo "PASS: SUPABASE_SERVICE_ROLE_KEY" || echo "FAIL: SUPABASE_SERVICE_ROLE_KEY not set"
[ -n "$OPENAI_API_KEY" ] && echo "PASS: OPENAI_API_KEY" || echo "FAIL: OPENAI_API_KEY not set"
```

### Phase 2: Auth Flow

Test authentication against the MCP endpoint:

```bash
# A1: No token - expect 401
curl -s -o /dev/null -w "%{http_code}" -X POST {BASE_URL}/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'

# A2: Invalid token - expect 401
curl -s -o /dev/null -w "%{http_code}" -X POST {BASE_URL}/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake_invalid_token_xyz" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'

# A3: Valid token - expect 200
curl -s -o /dev/null -w "%{http_code}" -X POST {BASE_URL}/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {API_KEY}" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'

# A5: OAuth metadata
curl -s -o /dev/null -w "%{http_code}" {BASE_URL}/.well-known/oauth-authorization-server
```

For A3, also validate the response body contains `serverInfo` and `capabilities`.

### Phase 3: Tool Invocation

For each of the 10 tools, send a `tools/call` JSON-RPC request with valid parameters. The session must be initialized first (use the response from A3).

**Important:** The MCP transport is streamable-http. After `initialize`, you must send `initialized` notification, then proceed with tool calls. Each request should include the session ID from the initialize response (via `Mcp-Session-Id` header if provided).

Test each tool with this pattern:

```bash
curl -s -X POST {BASE_URL}/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {API_KEY}" \
  -H "Mcp-Session-Id: {SESSION_ID}" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"{TOOL_NAME}","arguments":{TOOL_PARAMS}}}'
```

**Tools to test (in order):**

1. `get_brand_context` — params: `{}`
2. `get_brand_colors` — params: `{"group":"all","include_guidelines":true}`
3. `get_brand_assets` — params: `{"category":"logos","limit":5}`
4. `search_brand_knowledge` — params: `{"query":"brand voice","limit":3}`
5. `search_brand_assets` — params: `{"query":"logo dark background","limit":3}`
6. `get_brand_guidelines` — params: `{}`
7. `get_design_tokens` — params: `{"format":"css","scope":"colors"}`
8. `get_brand_voice` — params: `{"platform":"linkedin"}`
9. `get_writing_style` — params: `{"style_type":"blog"}`
10. `get_typography_system` — params: `{"include_font_files":true}`

**For each response, validate:**
- HTTP status is 200
- Response is valid JSON
- Response contains `result` with `content` array
- Content text (when parsed as JSON) contains `summary` (string, non-empty)
- Content text contains `data` field
- Content text contains `usage_hint` (string)
- Content text contains `related_tools` (array)

**Error case for search tools:**
- `search_brand_knowledge` with `{}` (missing required `query`) — expect error in response
- `search_brand_assets` with `{}` (missing required `query`) — expect error in response

### Phase 4: Resource Tests

```bash
# R1: List resources
curl -s -X POST {BASE_URL}/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {API_KEY}" \
  -H "Mcp-Session-Id: {SESSION_ID}" \
  -d '{"jsonrpc":"2.0","id":20,"method":"resources/list","params":{}}'

# R2: Read brand colors resource (use the URI from R1)
curl -s -X POST {BASE_URL}/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {API_KEY}" \
  -H "Mcp-Session-Id: {SESSION_ID}" \
  -d '{"jsonrpc":"2.0","id":21,"method":"resources/read","params":{"uri":"bos://brand/open-session/colors"}}'
```

**Validate R2 response contains:**
- `meta` object with `uri`, `brandSlug`, `generatedAt`
- `brand` color group
- `monoScale` color group
- `cssTokens` object
- `quickReference` with `primaryLight`, `primaryDark`, `accent`

### Phase 5: Asset Proxy Tests

```bash
# P1: Valid asset path (try a known path, or use one from get_brand_assets response)
curl -s -o /dev/null -w "%{http_code}" {BASE_URL}/api/brand/assets/download/logos/brandmark-vanilla.svg

# P3: Path traversal attempt
curl -s -o /dev/null -w "%{http_code}" "{BASE_URL}/api/brand/assets/download/../../../etc/passwd"

# P4: Double-slash attempt
curl -s -o /dev/null -w "%{http_code}" "{BASE_URL}/api/brand/assets/download/logos//hidden.svg"

# P8/P9: Check headers on successful download
curl -s -D - -o /dev/null {BASE_URL}/api/brand/assets/download/logos/brandmark-vanilla.svg | grep -i "cache-control\|x-content-type-options"
```

**Expected:**
- P1: 200 (if file exists) or 404/500 (if not in storage — note this)
- P3: 400 (path traversal blocked)
- P4: 400 (double-slash blocked)
- Headers: `Cache-Control` and `X-Content-Type-Options: nosniff` present

### Phase 6: Error Sanitization

```bash
# S2: Invalid tool name
curl -s -X POST {BASE_URL}/api/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {API_KEY}" \
  -H "Mcp-Session-Id: {SESSION_ID}" \
  -d '{"jsonrpc":"2.0","id":30,"method":"tools/call","params":{"name":"nonexistent_tool","arguments":{}}}'
```

**Validate error responses:**
- No strings matching `sk-` (OpenAI key prefix)
- No strings matching `sbp_` (Supabase key prefix)
- No strings matching `eyJ` (JWT prefix)
- No internal URLs (supabase.co, openai.com internal endpoints)
- Error messages are < 100 characters

## Summary Report

After all tests complete, print a summary:

```
═══════════════════════════════════════
  BOS MCP Server Test Results
═══════════════════════════════════════

  Environment:  {pass}/{total}
  Auth Flow:    {pass}/{total}
  Tools:        {pass}/{total}
  Resources:    {pass}/{total}
  Asset Proxy:  {pass}/{total}
  Error Safety: {pass}/{total}

  ─────────────────────────────────────
  TOTAL:        {pass}/{total} passed
  ─────────────────────────────────────

  {any failure details listed here}
═══════════════════════════════════════
```

## Notes

- If the dev server is not running, suggest the user run `bun dev` first or provide a production URL
- For tools that depend on database content (assets, guidelines), a "no results" response is not a failure — it means the brand has no data in that category yet. Mark as PASS with a note.
- The `search_brand_knowledge` and `search_brand_assets` tools require embeddings in the database. If they return empty results, note it but don't fail.
- If a session ID is not returned by the server, try sending requests without it (some transports don't require it).
- Asset proxy tests may 404 if the specific file doesn't exist in storage — adjust the path based on `get_brand_assets` results if needed.
