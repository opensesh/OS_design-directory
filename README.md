# Design Directory

An interactive 3D design resource directory created by [Open Session](https://opensession.co). Use it as-is to explore 155+ curated design resources, or fork it as a template for any dataset — swap the JSON and make it your own.

<!-- TODO: Add a GIF or screenshot here showing the app in action -->
<!-- ![Design Directory Preview](docs/assets/preview.gif) -->

**Key Features:**
- **3D Universe** — Each resource is a particle in an interactive Three.js scene, positioned by gravity score
- **Card & Table Views** — Switch between 3D, card grid, and sortable table layouts
- **Category Filtering** — Six color-coded categories with animated transitions
- **Semantic Search** — Local fuzzy search with optional AI-powered natural language queries
- **Landing Page** — WebGL shader effects, starfield, character-scramble title, orbiting logos
- **Light & Dark Mode** — Full theming with smooth transitions

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/opensesh/OS_design-directory.git
cd OS_design-directory

# Install dependencies
bun install
# or: npm install

# Start development server
bun dev
# or: npm run dev

# Build for production
bun run build
```

The dev server runs at `http://localhost:3001/` with hot module replacement.

---

## What You'll See

The app has four display modes:

| Mode | URL | Description |
|------|-----|-------------|
| **Landing** | `/` (default) | Animated entry with WebGL shader background, starfield, orbiting logos, and view picker |
| **3D Universe** | `/?display=3d` | Interactive Three.js particle scene — each dot is a resource |
| **Card Grid** | `/?display=card` | Responsive cards grouped by category and subcategory |
| **Data Table** | `/?display=table` | Sortable, filterable table with all resource fields |

Press `Cmd+K` (or `Ctrl+K`) to open search from any view.

---

## Fork & Customize

Want to create your own resource directory? Here's how:

1. **Fork this repository** on GitHub
2. **Clone your fork** locally
3. **Edit resources** in `src/data/resources.json`
4. **Add screenshots** to `public/assets/screenshots/`
5. **Customize branding** in `src/styles/theme.css`
6. **Run `bun dev`** to preview your changes
7. **Deploy** to Vercel, Netlify, or your preferred host

For a full walkthrough of everything you can customize — categories, colors, landing page effects, animations, search behavior, fonts — see **[docs/START_HERE.md](docs/START_HERE.md)**.

---

## Customizing Resources

### Adding a Resource

Edit `src/data/resources.json` and add a new object to the array:

```json
{
  "id": 101,
  "name": "Your Tool Name",
  "url": "https://example.com",
  "description": "A brief description of what this tool does and why it's useful.",
  "category": "Tools",
  "subCategory": "Design & Creative",
  "pricing": "Free",
  "featured": false,
  "opensource": true,
  "tags": ["design", "prototyping"],
  "tier": 2,
  "screenshot": "/assets/screenshots/101-your-tool.jpg",
  "gravityScore": 7.5,
  "gravityRationale": "Useful tool for specific use case"
}
```

### Removing a Resource

Simply delete the resource object from `src/data/resources.json`.

### Resource Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | Yes | Unique identifier |
| `name` | string | Yes | Display name |
| `url` | string | Yes | Resource URL |
| `description` | string | No | Long description (shown in detail view) |
| `category` | string | Yes | One of: `Tools`, `Inspiration`, `AI`, `Learning`, `Templates`, `Community` |
| `subCategory` | string | No | Subcategory for grouping |
| `pricing` | string | No | `Free`, `Freemium`, or `Paid` |
| `featured` | boolean | No | Highlight in UI (default: false) |
| `opensource` | boolean | No | Open source flag (default: false) |
| `tags` | string[] | No | Searchable tags |
| `tier` | number | No | Priority tier (1 = highest) |
| `screenshot` | string | No | Path to screenshot image |
| `gravityScore` | number | Yes | 1.0-10.0, higher = closer to center in 3D view |
| `gravityRationale` | string | No | Brief explanation of the score |

### Screenshots

- **Location:** `public/assets/screenshots/`
- **Naming:** `{id}-{name-slug}.jpg` (e.g., `101-figma.jpg`)
- **Recommended size:** 1280x800px
- **Format:** JPG (quality 85)

### Categories

Resources are organized into six categories:

| Category | Color | Description |
|----------|-------|-------------|
| **Tools** | Pink | Design tools, builders, editors |
| **Inspiration** | Orange | Showcases, galleries, collections |
| **AI** | Cyan | AI-powered tools and platforms |
| **Learning** | Green | Tutorials, courses, documentation |
| **Templates** | Amber | Starter kits, UI kits, themes |
| **Community** | Blue | Forums, Discord servers, communities |

---

## Automation Scripts

Scripts in the `scripts/` folder automate resource management.

### Add Resources (`add-resources.ts`)

Add new resources with automatic deduplication and ID assignment.

```bash
# Edit the newResources array in the script, then:
npx tsx scripts/add-resources.ts
```

### Capture Screenshots (`capture-screenshots.ts`)

Automatically capture website screenshots using [shot-scraper](https://github.com/simonw/shot-scraper).

```bash
pip3 install --user shot-scraper && shot-scraper install  # one-time setup
npx tsx scripts/capture-screenshots.ts                     # capture missing
npx tsx scripts/capture-screenshots.ts --dry-run           # preview only
```

### Validate Resources (`validate.cjs`)

Check data integrity and view category/pricing statistics.

```bash
node scripts/validate.cjs
```

<details>
<summary>Additional scripts (screenshot fixing, descriptions, migrations)</summary>

### Fix Screenshots with AI (`fix-screenshots.ts`)

Uses Claude Vision API to detect bad screenshots (CAPTCHAs, error pages) and finds replacements via Google Images. Requires `ANTHROPIC_API_KEY` and `SERPAPI_API_KEY` in `.env`.

```bash
npx tsx scripts/fix-screenshots.ts              # analyze and fix
npx tsx scripts/fix-screenshots.ts --analyze-only  # audit only
```

### Update Descriptions (`update-descriptions.cjs`)

Apply AI-generated descriptions. Add entries to the `ENHANCED_DESCRIPTIONS` object in the script, then run:

```bash
node scripts/update-descriptions.cjs
```

### Transform Taxonomy (`transform-taxonomy.cjs`)

Migrate resources between category structures:

```bash
node scripts/transform-taxonomy.cjs
```

### Migrate Screenshots (`migrate-screenshots.ts`)

Rename/move screenshot files to a new naming convention:

```bash
npx tsx scripts/migrate-screenshots.ts
```

</details>

---

## Complete Workflow: Adding New Resources

1. Add entries to the `newResources` array in `scripts/add-resources.ts`, then run `npx tsx scripts/add-resources.ts`
2. Capture screenshots: `npx tsx scripts/capture-screenshots.ts`
3. (Optional) Fix bad screenshots: `npx tsx scripts/fix-screenshots.ts`
4. Validate: `node scripts/validate.cjs`

---

## Project Structure

```
design-directory/
├── src/
│   ├── components/
│   │   ├── canvas/              # 3D rendering (Three.js + R3F)
│   │   │   ├── InspoCanvas.tsx  # Main 3D scene
│   │   │   ├── ResourceNodes.tsx
│   │   │   ├── GalaxyBackground.tsx
│   │   │   ├── NebulaClusters.tsx
│   │   │   └── SaturnRings.tsx
│   │   ├── landing/             # Landing page components
│   │   │   ├── LandingPage.tsx
│   │   │   ├── PrismaticBurst.tsx  # WebGL shader (OGL)
│   │   │   ├── Starfield.tsx       # Canvas 2D starfield
│   │   │   ├── FlipCounter.tsx     # Animated digit counter
│   │   │   ├── DecryptedText.tsx   # Character-scramble reveal
│   │   │   ├── OrbitingResources.tsx
│   │   │   └── orbit-config.ts     # Orbit layout config
│   │   ├── card-view/           # Card grid components
│   │   ├── search/              # Search modal (Cmd+K)
│   │   └── ui/                  # Shared UI primitives
│   ├── data/
│   │   ├── resources.json       # ← YOUR RESOURCE DATA
│   │   └── index.ts             # Data export
│   ├── pages/
│   │   ├── Home.tsx             # Main page (all view modes)
│   │   └── ResourceDetail.tsx   # Individual resource page
│   ├── types/
│   │   └── resource.ts          # TypeScript types + category config
│   ├── lib/
│   │   ├── search/              # Search engine (fuzzy + semantic)
│   │   │   └── semantic-mappings.ts  # Synonym & concept definitions
│   │   └── motion-tokens.ts     # Animation timing constants
│   ├── hooks/                   # Custom React hooks
│   ├── store/
│   │   └── useAppStore.ts       # Zustand (view mode state)
│   ├── utils/                   # Layout algorithms
│   └── styles/
│       ├── theme.css            # CSS variable tokens (light + dark)
│       └── fonts.css            # @font-face declarations
├── public/
│   ├── assets/screenshots/      # Resource screenshots (JPG)
│   ├── fonts/                   # Web fonts (woff2)
│   └── textures/                # 3D textures (skybox, nebula)
├── api/search/                  # Vercel serverless function (AI search)
├── scripts/                     # Automation scripts
├── docs/                        # Documentation
│   └── START_HERE.md            # Customization guide
└── [config files]
```

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Build Tool** | Vite |
| **Framework** | React 18 + TypeScript |
| **3D Rendering** | Three.js + React Three Fiber + Drei |
| **WebGL Shaders** | OGL (landing page effects) |
| **Animation** | Framer Motion |
| **State** | Zustand |
| **Styling** | Tailwind CSS |
| **Routing** | React Router v7 |
| **AI Search** | Anthropic SDK (optional) |

---

## How It Works

### Particle System
The 3D visualization uses Three.js InstancedMesh to render particles efficiently. Each particle represents a resource, with position determined by the `gravityScore` - higher scores place resources closer to the center.

### Layout Algorithms
- **Galaxy** - Spiral formation with category-based clustering
- **Fibonacci Sphere** - Even distribution using golden ratio
- **Grid** - Clean 3D grid arrangement

### Morphing Transitions
When switching views, particles animate smoothly to their new positions using cubic easing.

---

## Development

```bash
# Start dev server
bun dev

# Type checking
bun run typecheck

# Linting
bun run lint

# Production build
bun run build

# Preview production build
bun run preview
```

---

## Deployment

This project can be deployed to any static hosting provider:

**Vercel (Recommended)**
```bash
vercel
```

**Netlify**
```bash
netlify deploy --prod
```

**Manual**
```bash
bun run build
# Upload `dist/` folder to your host
```

---

## Deployment Options

This project is designed to work at three levels—from zero-config static hosting to full production with AI-powered search.

### Tier 1: Static Site (Zero Dependencies)

Fork it, build it, deploy it. No API keys, no backend, no external services required.

```bash
bun run build
# Upload dist/ to any static host (GitHub Pages, Netlify, Cloudflare, etc.)
```

**What works:**
- Full 3D visualization, card view, and list view
- Category filtering and tag search
- Local keyword-based search
- All animations and interactions

### Tier 2: AI-Powered Search (Optional)

Add your own Anthropic API key to enable intelligent natural language search.

```env
ANTHROPIC_API_KEY=sk-ant-...
```

**What you get:**
- Natural language queries ("show me free prototyping tools")
- Semantic understanding of search intent
- Multi-filter extraction from conversational queries

**Fallback behavior:** If the API is unavailable or times out (5s), search automatically falls back to local keyword matching. The app never breaks.

### Tier 3: Production (Our Hosted Version)

We use [Vercel KV](https://vercel.com/docs/storage/vercel-kv) for persistent rate limiting across serverless cold starts.

**What it adds:**
- Rate limiting that persists across deployments (10 req/min, 100 req/day per IP)
- No configuration needed—Vercel auto-provisions KV credentials

**For self-hosters:** Rate limiting is skipped if KV is unavailable (fail-open). Your app still works; you just won't have persistent rate limits. If you need rate limiting, you can:
- Deploy to Vercel (KV auto-configured)
- Use Upstash Redis directly (requires code modification)
- Implement your own rate limiting middleware

---

## Environment Variables

### For the App (Optional)

These enable enhanced features but are **not required** to run the application:

| Variable | Required | Purpose |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | No | Enables AI-powered natural language search |

### For Automation Scripts (Optional)

These are only needed if you use the screenshot automation:

| Variable | Required | Purpose |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | For `fix-screenshots.ts` | Claude Vision for detecting bad screenshots |
| `SERPAPI_API_KEY` | For `fix-screenshots.ts` | Google Images API for finding replacements |

### For Production (Vercel Only)

| Variable | Required | Purpose |
|----------|----------|---------|
| `KV_REST_API_*` | Auto-provisioned | Vercel KV for rate limiting (no manual setup needed) |

Create a `.env` file for local development:

```env
# Optional - enables AI search
ANTHROPIC_API_KEY=sk-ant-...

# Optional - only for screenshot automation
SERPAPI_API_KEY=...
```

---

## Theming & Color System

This project features a complete **light and dark mode** theming system using CSS custom properties. All colors are defined in `src/styles/theme.css` and automatically adapt based on user preference.

### Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| **Charcoal** | `#191919` | Brand identity, dark backgrounds |
| **Vanilla** | `#FFFAEE` | Warm neutrals, light accents |
| **Aperol** | `#FE5102` | Primary accent (CTAs, links, badges) |

### Theme Tokens

All UI colors use semantic CSS variables that switch between light and dark values:

```css
/* Backgrounds */
--bg-primary       /* Main canvas/page background */
--bg-secondary     /* Elevated surfaces (cards, modals) */
--bg-tertiary      /* Hover states, subtle fills */

/* Foregrounds */
--fg-primary       /* Primary text */
--fg-secondary     /* Secondary text */
--fg-tertiary      /* Muted/disabled text */

/* Borders */
--border-primary   /* Default borders */
--border-secondary /* Subtle borders */

/* Brand */
--bg-brand-solid   /* Brand-colored buttons */
--fg-brand-primary /* Brand-colored text/icons */
```

### Light Mode Palette

| Token | Hex | Description |
|-------|-----|-------------|
| `--bg-primary` | `#faf8f5` | Warm off-white background |
| `--bg-secondary` | `#ffffff` | Pure white for elevated surfaces |
| `--bg-tertiary` | `#f5f3f0` | Subtle hover states |
| `--fg-primary` | `#191919` | Charcoal text |
| `--fg-secondary` | `#5c574f` | Secondary text |
| `--border-secondary` | `#d5d1cb` | Warm gray borders |

### Dark Mode Palette

| Token | Hex | Description |
|-------|-----|-------------|
| `--bg-primary` | `#141414` | Deep charcoal background |
| `--bg-secondary` | `#1C1C1C` | Slightly elevated surfaces |
| `--bg-tertiary` | `#252525` | Hover states |
| `--fg-primary` | `#E8E8E8` | Light gray text |
| `--fg-secondary` | `#9CA3AF` | Muted text |
| `--border-secondary` | `#2C2C2C` | Subtle dark borders |

### Theme Toggle

Users can switch between light and dark mode using the theme toggle button in the header. The system also respects the user's OS preference by default.

### Customizing the Theme

To customize colors for your own brand:

1. **Edit `src/styles/theme.css`** - Modify the `:root` (light) and `.dark` selectors
2. **Update brand tokens** - Change `--brand-charcoal`, `--brand-vanilla`, and `--brand-aperol`
3. **Adjust canvas gradients** - The `--canvas-gradient-top` and `--canvas-gradient-bottom` variables control the 3D canvas edge blending

### Theme Transitions

Smooth 300ms transitions are applied globally when switching themes, covering:
- Background colors
- Border colors
- Text colors
- SVG fills and strokes

---

## Fonts

This project uses **Neue Haas Grotesk Display** and **OffBit** — both are commercial fonts included for demonstration purposes. If you fork this project, you must either purchase your own license or replace them with open-source alternatives.

| Current Font | Role | Open-Source Alternative |
|-------------|------|----------------------|
| Neue Haas Grotesk | Headings & body (`font-display`, `font-text`) | [Inter](https://rsms.me/inter/) or [DM Sans](https://fonts.google.com/specimen/DM+Sans) |
| OffBit | Accent/monospace (`font-accent`, `font-mono`) | [Space Mono](https://fonts.google.com/specimen/Space+Mono) or [JetBrains Mono](https://www.jetbrains.com/lp/mono/) |

**To swap fonts:**
1. Replace `.woff2` files in `public/fonts/`
2. Update `@font-face` declarations in `src/styles/fonts.css`
3. Update font family names in `tailwind.config.ts`

---

## Design Philosophy

Every aspect of this project reflects Open Session's commitment to craft:

- **Brand-First Design** - Custom Aperol orange (#FE5102) with warm charcoal and vanilla neutrals
- **Light & Dark Modes** - Full theming support with smooth transitions
- **Smooth Interactions** - Carefully tuned easing curves and transitions
- **Performance Matters** - Optimized rendering for fluid 60fps experience
- **Accessibility** - Keyboard navigation and screen reader support

---

## License

MIT License - feel free to fork and customize for your own use.

---

**Built with care by [Open Session](https://opensession.co)**

---

## Security

### Rate Limiting

The LLM-powered search endpoint (`/api/search/parse-query`) is rate-limited:
- **10 requests per minute** per IP
- **100 requests per day** per IP

Exceeding these limits returns a `429 Too Many Requests` response.

**Note for self-hosters:** Rate limiting requires Vercel KV. If you deploy elsewhere, the rate limiter gracefully skips (fail-open behavior)—your app works, but without persistent rate limits.

### Security Headers

The following security headers are configured via `vercel.json`:
- `X-Content-Type-Options: nosniff` - Prevents MIME-type sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information

### Input Validation

- Search queries are limited to 1,000 characters
- All LLM responses are sanitized with whitelist validation
- No user data is stored or persisted

### Reporting Vulnerabilities

If you discover a security vulnerability, please email security@opensession.co rather than opening a public issue. We'll respond within 48 hours.
