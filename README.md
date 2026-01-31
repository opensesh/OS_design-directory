# Design Directory

An interactive 3D design resource repository created by [Open Session](https://opensession.co) to help enable and inspire designers worldwide.

## Purpose

This project serves as a living, interactive catalog of design resources curated by Open Session. Rather than a traditional static list, we've built an immersive 3D particle visualization that makes discovering design tools, inspiration, and resources an engaging experience.

**Key Features:**
- **Interactive 3D Visualization** - Each particle represents a design resource, creating a dynamic constellation of tools and inspiration
- **Multiple View Modes** - Switch between Galaxy, Card, and List layouts
- **Category Filtering** - Filter by Tools, Inspiration, AI, Learning, Templates, and Community
- **Resource Details** - Click any resource to see descriptions, screenshots, and links
- **Search & Tags** - Find resources by name or tags
- **Gravity-Based Layout** - Higher-rated resources appear closer to the center in 3D view

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

## Fork & Customize

Want to create your own resource directory? Here's how:

1. **Fork this repository** on GitHub
2. **Clone your fork** locally
3. **Edit resources** in `src/data/resources.json`
4. **Add screenshots** to `public/assets/screenshots/`
5. **Customize branding** in `src/styles/theme.css`
6. **Run `bun dev`** to preview your changes
7. **Deploy** to Vercel, Netlify, or your preferred host

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

This project includes scripts to automate resource management. All scripts are in the `scripts/` folder.

### 1. Add Resources (`add-resources.ts`)

Add new resources with automatic deduplication and ID assignment.

```bash
# Edit the newResources array in the script, then:
npx tsx scripts/add-resources.ts
```

### 2. Capture Screenshots (`capture-screenshots.ts`)

Automatically capture website screenshots using [shot-scraper](https://github.com/simonw/shot-scraper).

**Prerequisites:**
```bash
pip3 install --user shot-scraper
shot-scraper install
```

**Usage:**
```bash
# Capture all missing screenshots
npx tsx scripts/capture-screenshots.ts

# Limit to 10 captures
npx tsx scripts/capture-screenshots.ts --limit=10

# Preview without capturing
npx tsx scripts/capture-screenshots.ts --dry-run
```

**Output:** Screenshots saved to `public/assets/screenshots/` and paths updated in `resources.json`.

### 3. Fix Screenshots with AI (`fix-screenshots.ts`)

Uses Claude Vision API to detect bad screenshots (CAPTCHAs, error pages, login walls) and automatically finds replacements via Google Images.

**Prerequisites:**
Add to your `.env` file:
```
ANTHROPIC_API_KEY=sk-ant-...
SERPAPI_API_KEY=...
```

**Usage:**
```bash
# Analyze and fix all screenshots
npx tsx scripts/fix-screenshots.ts

# Analyze only (no replacements)
npx tsx scripts/fix-screenshots.ts --analyze-only

# Limit to 20 screenshots
npx tsx scripts/fix-screenshots.ts --limit=20
```

**Output:**
- Bad screenshots backed up to `public/assets/screenshots/backup/`
- Replacements downloaded and resized
- Audit report saved to `scripts/image-audit-report.json`

### 4. Update Descriptions (`update-descriptions.cjs`)

Apply enhanced descriptions to resources. Descriptions are stored in the `ENHANCED_DESCRIPTIONS` object in the script.

**Workflow:**
1. Generate descriptions using Claude with a prompt like: *"Write a 4-8 sentence description for [tool name]. Include what it does, key features, target users, and value proposition."*
2. Add the generated text to `ENHANCED_DESCRIPTIONS` in the script
3. Run the script:

```bash
node scripts/update-descriptions.cjs
```

### 5. Transform Taxonomy (`transform-taxonomy.cjs`)

Migrate resources from old category/subcategory structure to new consolidated taxonomy.

```bash
node scripts/transform-taxonomy.cjs
```

### 6. Validate Resources (`validate.cjs`)

Check data integrity and view statistics.

```bash
node scripts/validate.cjs
```

**Output:**
- Total resource count
- Category breakdown
- Subcategory statistics
- Average description length
- Missing screenshots list

### 7. Migrate Screenshots (`migrate-screenshots.ts`)

Migrate screenshot files to a new naming convention or location.

```bash
npx tsx scripts/migrate-screenshots.ts
```

---

## Complete Workflow: Adding New Resources

### Step 1: Add Resource Data
1. Edit `scripts/add-resources.ts`
2. Add entries to the `newResources` array with basic info (name, URL, category)
3. Run `npx tsx scripts/add-resources.ts`

### Step 2: Capture Screenshots
```bash
npx tsx scripts/capture-screenshots.ts
```

### Step 3: Fix Bad Screenshots
```bash
npx tsx scripts/fix-screenshots.ts
```

### Step 4: Generate & Apply Descriptions
1. Use Claude to generate rich descriptions for new resources
2. Add to `scripts/update-descriptions.cjs`
3. Run `node scripts/update-descriptions.cjs`

### Step 5: Validate
```bash
node scripts/validate.cjs
```

---

## Project Structure

```
design-directory/
├── src/
│   ├── components/
│   │   ├── canvas/              # 3D rendering components
│   │   │   ├── GalaxyBackground.tsx
│   │   │   ├── ResourceNodes.tsx
│   │   │   └── InspoCanvas.tsx
│   │   ├── card-view/           # Card/grid UI components
│   │   │   ├── CardView.tsx
│   │   │   ├── CategoryGrid.tsx
│   │   │   └── ResourceCard.tsx
│   │   └── ui/                  # General UI components
│   │       ├── AILoader.tsx     # AI typing indicator
│   │       ├── dot-loader.tsx   # Animated dot loader
│   │       └── ...
│   ├── data/
│   │   ├── index.ts             # Data export
│   │   └── resources.json       # ← YOUR RESOURCE DATA
│   ├── pages/                   # Page components
│   │   ├── Home.tsx
│   │   └── ResourceDetail.tsx
│   ├── types/
│   │   └── resource.ts          # TypeScript interfaces
│   ├── store/
│   │   └── useAppStore.ts       # Zustand state management
│   ├── utils/                   # Layout algorithms
│   └── styles/
│       └── theme.css            # CSS variables & theming
├── public/
│   ├── assets/
│   │   └── screenshots/         # Resource screenshots
│   ├── textures/                # 3D textures (skybox, etc.)
│   └── fonts/                   # Web fonts
├── scripts/                     # Automation scripts
│   ├── add-resources.ts
│   ├── capture-screenshots.ts
│   ├── fix-screenshots.ts
│   ├── migrate-screenshots.ts
│   ├── update-descriptions.cjs
│   ├── transform-taxonomy.cjs
│   └── validate.cjs
├── docs/                        # Additional documentation
└── [config files]
```

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Build Tool** | Vite |
| **Framework** | React 18 + TypeScript |
| **3D Rendering** | Three.js + React Three Fiber |
| **State** | Zustand |
| **Styling** | Tailwind CSS |
| **Routing** | React Router v7 |

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

## Environment Variables

Create a `.env` file for automation scripts:

```env
# Required for fix-screenshots.ts
ANTHROPIC_API_KEY=sk-ant-...
SERPAPI_API_KEY=...
```

**Note:** These are only needed for automation scripts, not for running the app.

---

## Design Philosophy

Every aspect of this project reflects Open Session's commitment to craft:

- **Brand-First Design** - Custom Aperol orange (#FE5102) and charcoal backgrounds
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
