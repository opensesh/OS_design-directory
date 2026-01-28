# BOS 3.0 - Claude Development Guide

## Project Overview
Brand Operating System (BOS) 3.0 - AI-powered brand management platform built with Next.js 16+, React 19, TypeScript, and Tailwind CSS. Features multi-model AI chat (Claude, Perplexity), brand knowledge systems, and collaborative workspaces.

## Essential Commands
```bash
bun dev          # Start dev server (http://localhost:3000)
bun run build    # Production build
bun run lint     # ESLint
```

## Tech Stack
- **Framework**: Next.js 16+ App Router
- **UI**: React 19 + React Aria Components (accessibility)
- **Styling**: Tailwind CSS with UUI semantic tokens (CSS variables)
- **State**: Zustand
- **Database**: Supabase
- **AI**: Anthropic SDK (Claude), Perplexity API

## Key Directories
```
app/              # Next.js pages and API routes
components/ui/    # Design system primitives (buttons, inputs, etc.)
components/chat/  # Chat interface components
lib/ai/           # AI provider configs, auto-router, tools
lib/supabase/     # Database services
hooks/            # Custom React hooks
```

## Claude Configuration Structure

The `.claude/` directory is organized for Claude Code CLI compatibility:

```
.claude/
├── CLAUDE.md                    # This file (CLI required at root)
├── settings.json                # MCP permissions (CLI required at root)
├── settings.local.json          # Local dev permissions (gitignored)
│
├── agents/                      # Autonomous workflows (CLI required at root)
│   ├── README.md
│   └── feature-dev/
│
├── commands/                    # Slash commands (CLI required at root)
│   ├── README.md
│   └── restart.md
│
├── plugins/                     # Full capability packages (CLI required at root)
│   ├── agent-sdk-dev/
│   ├── code-review/
│   ├── commit-commands/
│   ├── feature-dev/
│   ├── hookify/
│   ├── plugin-dev/
│   ├── pr-review-toolkit/
│   └── ralph-wiggum/
│
├── skills/                      # Auto-activating knowledge (CLI required at root)
│   ├── bos-code-quality/
│   ├── brand-guidelines/
│   ├── frontend-design/
│   └── ...
│
├── brand/                       # Brand content (for creatives)
│   ├── identity/                # Brand guidelines, PDFs
│   ├── writing/                 # Writing style guides
│   └── assets/                  # Future: logos, images
│
├── data/                        # Reference data
│   └── news-sources.md
│
├── reference/                   # Documentation
│   ├── design-system.md         # BOS design system reference
│   └── mcp-setup.md             # MCP server configuration
│
└── system/                      # Auto-generated (read-only)
    └── architecture.md          # Codebase architecture
```

### Categories by Audience

| Category | Folder | Audience | Contents |
|----------|--------|----------|----------|
| **CLI Tools** | `agents/`, `commands/`, `plugins/`, `skills/` | Engineers | CLI-required paths |
| **Brand** | `brand/` | Creatives | Identity docs, writing styles, assets |
| **Data** | `data/` | Both | Reference data (news sources, etc.) |
| **Reference** | `reference/` | Both | Design system, MCP setup docs |
| **System** | `system/` | Both | Auto-generated architecture |

### Agents vs Commands vs Skills

| Type | Trigger | Purpose | Location |
|------|---------|---------|----------|
| **Agents** | Auto-activates on context | Autonomous multi-step workflows | `agents/` or `plugins/*/agents/` |
| **Commands** | User types `/command` | Single operations, user-controlled | `commands/` or `plugins/*/commands/` |
| **Skills** | Auto-activates on keywords | Context-aware knowledge injection | `skills/` or `plugins/*/skills/` |
| **Plugins** | Contains all of the above | Full-featured packages | `plugins/` |

### Plugin-Embedded Agents

Some agents live inside plugins as subagents for larger workflows:

| Plugin | Embedded Agents |
|--------|-----------------|
| `feature-dev` | code-architect, code-explorer, code-reviewer |
| `pr-review-toolkit` | code-reviewer, silent-failure-hunter, code-simplifier, comment-analyzer, pr-test-analyzer, type-design-analyzer |
| `plugin-dev` | agent-creator, skill-reviewer, plugin-validator |
| `agent-sdk-dev` | agent-sdk-verifier-ts, agent-sdk-verifier-py |
| `hookify` | conversation-analyzer |

### Where to Look First

- **Building a feature?** → Check `plugins/feature-dev/`
- **Reviewing a PR?** → Check `plugins/pr-review-toolkit/`
- **Creating a plugin?** → Check `plugins/plugin-dev/`
- **Brand questions?** → Check `brand/identity/`
- **Writing content?** → Check `brand/writing/`
- **Design system?** → Check `reference/design-system.md`

---

## Code Conventions

### TypeScript
- Strict mode enabled
- Prefer `interface` for component props
- Use Zod for runtime validation where needed

### Components
- Use React Aria Components for accessible primitives
- Co-locate component-specific types in the same file
- Prefer composition over prop drilling

### Styling with CSS Variables
All colors use semantic CSS variables from `theme.css`:
```css
/* Backgrounds */
var(--bg-primary)      /* Main background */
var(--bg-secondary)    /* Elevated surfaces */
var(--bg-tertiary)     /* Hover states */

/* Foreground/Text */
var(--fg-primary)      /* Primary text */
var(--fg-secondary)    /* Secondary text */
var(--fg-tertiary)     /* Muted/disabled */

/* Brand */
var(--fg-brand-primary)   /* Brand text/icons */
var(--bg-brand-solid)     /* Brand buttons */

/* Borders */
var(--border-primary)     /* Default borders */
var(--border-secondary)   /* Subtle borders */
```

---

## Design System Guidelines

### Border Styling (IMPORTANT)
**Avoid harsh white or brand-colored outlines.** Borders should be soft, subtle, and supportive.

#### Container Borders (Cards, Panels, Sections)
Use `--border-secondary` for containers - it provides a soft gray that works in both light and dark modes:
```css
/* Container borders - soft and subtle */
border border-[var(--border-secondary)]

/* Dividers inside containers */
border-t border-[var(--border-secondary)]
/* Or with reduced opacity for very subtle dividers */
border-t border-[var(--border-secondary)]/50
```

#### Interactive Element Borders (Inputs, Buttons)
```css
/* Default - subtle */
border border-[var(--border-secondary)]

/* Hover - slightly more visible */
hover:border-[var(--fg-tertiary)]

/* Focus - clear but not harsh */
focus:border-[var(--border-primary)]
```

#### NEVER use these (harsh/distracting)
```css
border-[var(--border-brand-solid)]   /* Too bright */
border-white                          /* Too harsh */
border-[var(--border-primary)]/40     /* Can appear washed out */
border-2                              /* Too thick */
focus:ring-2 ring-[var(--bg-brand-solid)]  /* Too prominent */
```

#### ALWAYS prefer
```css
border border-[var(--border-secondary)]  /* Soft container borders */
hover:border-[var(--fg-tertiary)]        /* Subtle hover state */
focus:border-[var(--border-primary)]     /* Clear focus state */
```

### Card Pattern
```css
bg-[var(--bg-secondary)]/30
border border-[var(--border-secondary)]
hover:bg-[var(--bg-secondary)]/60
```

### Input Pattern
```css
bg-[var(--bg-secondary)]/30
border border-[var(--border-secondary)]
focus:border-[var(--border-primary)]
focus:bg-[var(--bg-secondary)]/50
```

### Brand Color Usage
Use `--fg-brand-primary` and `--bg-brand-solid` sparingly:
- Primary action buttons (Submit, Send)
- Type badges/labels (small elements)
- Accent highlights
- NOT for borders or outlines

### Forbidden Icons
**NEVER use the `Sparkles` icon from Lucide. EVER.** This is a hard rule with no exceptions. The 4-point star/sparkle icon is generic AI aesthetic that doesn't match the brand vision. Do not import it, do not use it, do not suggest it. For empty states or prompts, use text-only or more purposeful iconography.

### Interactive States
```css
/* Hover-revealed actions */
opacity-0 group-hover:opacity-100 transition-opacity duration-150

/* Toggle buttons - use background, not borders */
/* Inactive */ text-[var(--fg-tertiary)] hover:bg-[var(--bg-secondary)]/50
/* Active */   bg-[var(--bg-tertiary)] text-[var(--fg-primary)]
```

---

## Icon Guidelines

### Philosophy: Don't Overuse Icons
Icons should be **functional, not decorative**. They work best when they aid recognition or provide affordances for interaction. Overusing icons creates visual noise and dilutes their communicative power.

### Where Icons ARE Appropriate
- **Buttons** - Action buttons with icons (e.g., `<Plus /> Add Item`)
- **Icon buttons** - Standalone icon-only buttons with clear actions
- **Navigation items** - Sidebar/menu items where icons aid recognition
- **Cards** - In the icon area of selection cards (upper-left)
- **Tab navigation** - Tab buttons can have icons
- **Status indicators** - Success/error/warning states

### Where Icons are NOT Appropriate
- **Section headers** - `<h3>` titles should NOT have icons next to them
- **Modal headers** - Title + description only, no decorative icons
- **Form labels** - Text-only labels
- **Page headers** - Main `<h1>` titles should NOT have icons
- **Duplicated contexts** - If a card has an icon, don't repeat it in subtitles

### Banned Icons (ABSOLUTE BAN - NO EXCEPTIONS)
- **`Sparkles`** - The 4-point star/galaxy icon from Lucide Icons is corny and doesn't match the app's vibe or brand language. **NEVER use this icon anywhere in the codebase. This is a HARD BAN with zero exceptions. Do not import it, do not suggest it, do not use it under any circumstances.**

**Alternatives by context:**
- For release updates/announcements: Use `Bell` or `Megaphone`
- For creative/artistic contexts: Use `Wand2`, `Palette`, or `PenTool`
- For AI/automation features: Use `Wand2`, `Target`, `Lightbulb`, or `Zap`
- For empty states: Use text-only or more purposeful iconography

### Section Header Pattern (IMPORTANT)
**Do NOT place icons before section headers.** Headers should be text-only.

NEVER:
```tsx
<div className="flex items-center gap-3">
  <div className="p-2 bg-[var(--bg-tertiary)] rounded-lg">
    <SomeIcon className="w-5 h-5" />
  </div>
  <div>
    <h3>Section Title</h3>
    <p>Description text</p>
  </div>
</div>
```

INSTEAD:
```tsx
<div>
  <h3>Section Title</h3>
  <p>Description text</p>
</div>
```

### Modal Header Pattern
**Do NOT place icons in modal headers.** The header should contain only:
- Title (h2) - left-aligned
- Subtitle/description text (optional) - left-aligned
- Close button (X) - right-aligned

Icons belong in the modal body (e.g., selection cards), not duplicated in the header.

### Selection Card Icon Pattern
**Icons in selection cards should appear ONLY in the upper-left corner.** Do not repeat icons in subtitles, labels, or other areas of the card - this is redundant.

Card structure:
```tsx
<button className="card">
  {/* Icon - upper left only */}
  <div className="p-3 rounded-xl bg-[var(--bg-primary)] border">
    <Icon className="w-6 h-6" />
  </div>

  {/* Title */}
  <h3>Card Title</h3>

  {/* Description */}
  <p>Description text</p>

  {/* Subtitle - TEXT ONLY, no icon */}
  <div className="text-xs text-[var(--fg-quaternary)]">
    Subtitle text only
  </div>
</button>
```

NEVER put icons in card subtitles:
```tsx
<div className="flex items-center gap-2 text-xs">
  <SomeIcon className="w-3.5 h-3.5" />
  Subtitle text
</div>
```

---

## Brand Colors Reference
| Token | Hex | Usage |
|-------|-----|-------|
| Charcoal | `#191919` | Dark backgrounds |
| Vanilla | `#FFFAEE` | Light/cream accents |
| Aperol | `#FE5102` | Primary brand color |

---

## MCP Servers (Model Context Protocol)

This project uses MCP servers to extend Claude's capabilities with external tools and services.

| Server | Purpose |
|--------|---------|
| **Supabase** | Database operations, migrations, edge functions |
| **Vercel** | Deployments, logs, project management |
| **Figma** | Design context, screenshots, code generation |
| **Notion** | Documentation, pages, databases |
| **GitHub** | Repository, issues, PRs, code search |

**For setup instructions, see [reference/mcp-setup.md](./reference/mcp-setup.md)**

---

## BOS MCP Server (Outbound)

BOS also exposes its own MCP server for external AI clients to access brand knowledge.

### Available Tools

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `search_brand_knowledge` | Semantic search across brand docs | Questions about voice, messaging, philosophy |
| `get_brand_colors` | Retrieve color palette | "What colors should I use?" |
| `get_brand_assets` | List logos, fonts, images | "Show me our logos" |
| `get_brand_guidelines` | Fetch guideline documents | Deep dive into specific guidelines |
| `search_brand_assets` | Semantic asset search | "Find photos with warm tones" |

### MCP Server Endpoint
```
URL: https://bos-3-0.vercel.app/api/mcp
Transport: streamable-http
Auth: Bearer token (API key from BOS settings)
```

### Voice Guidance for AI Assistants
When using BOS MCP, act as a **brand steward**, not an outside advisor:
- Use "we" and "our" naturally
- Integrate brand knowledge seamlessly without clinical prefixes
- Be helpful and informative while embodying brand voice
