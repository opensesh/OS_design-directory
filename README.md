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
git clone https://github.com/your-username/design-directory.git
cd design-directory

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
  "subCategory": "Design",
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
- **Recommended size:** 1200x800px or similar 3:2 ratio
- **Format:** JPG or PNG

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
├── docs/                        # Additional documentation
└── scripts/                     # Utility scripts
```

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 18 + TypeScript |
| **Build Tool** | Vite |
| **3D Rendering** | Three.js + React Three Fiber |
| **State** | Zustand |
| **Styling** | Tailwind CSS v4 |
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
