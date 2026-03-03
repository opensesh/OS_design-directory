# Customize This Project

You've cloned the Design Directory — here's what you can change and where to find it. Each section points to the exact file and variable names so you can jump straight in.

---

## Swap the Data (5 minutes)

**File:** `src/data/resources.json`

This single JSON file powers the entire app — the 3D universe, card grid, table, search, and detail pages all read from it. Replace or edit entries to make the directory your own.

Each resource looks like this:

```json
{
  "id": 1,
  "name": "Your Resource",
  "url": "https://example.com",
  "description": "A few sentences about what this is.",
  "category": "Tools",
  "subCategory": "Design",
  "pricing": "Free",
  "featured": false,
  "opensource": true,
  "tags": ["design", "prototyping"],
  "tier": 2,
  "screenshot": "/assets/screenshots/1-your-resource.jpg",
  "gravityScore": 7.5,
  "gravityRationale": "Why this score"
}
```

See the full schema reference in the [README](../README.md#resource-schema).

**Tips:**
- `gravityScore` (1.0-10.0) controls how close a resource appears to the center in the 3D universe. Higher = more prominent.
- `category` must match one of the defined categories (see next section).
- `screenshot` is a path relative to the `public/` folder.
- Run `node scripts/validate.cjs` after editing to check for issues.
- Use `npx tsx scripts/add-resources.ts` for bulk additions with automatic deduplication.

---

## Change the Categories (10 minutes)

**File:** `src/types/resource.ts`

Two exports control how categories appear everywhere in the app:

```typescript
// Ring order in the 3D universe (inner -> outer)
export const CATEGORY_ORDER = [
  'Community', 'Inspiration', 'Learning', 'Templates', 'Tools', 'AI',
] as const;

// Color for each category (used in filters, 3D nodes, legend, cards)
export const CATEGORY_COLORS: Record<string, string> = {
  'Community':   '#3B82F6',
  'Inspiration': '#FF5102',
  'Learning':    '#10B981',
  'Templates':   '#F59E0B',
  'Tools':       '#EC4899',
  'AI':          '#06B6D4',
};
```

To add or rename a category:
1. Update `CATEGORY_ORDER` and `CATEGORY_COLORS` in this file
2. Update the `category` field in your resources in `src/data/resources.json` to match
3. If you use AI search, also update the system prompt in `api/search/parse-query.ts`

---

## Retheme the Colors (10 minutes)

**File:** `src/styles/theme.css`

All colors are CSS custom properties with light and dark mode variants:

- **Light mode:** the `:root` block (starts with `--bg-primary: #faf8f5`)
- **Dark mode:** the `.dark` block (starts with `--bg-primary: #141414`)
- **Brand colors** (same in both modes): `--brand-charcoal`, `--brand-vanilla`, `--brand-aperol`

The three brand colors define the overall palette:

| Token | Default | Usage |
|-------|---------|-------|
| `--brand-charcoal` | `#191919` | Dark backgrounds |
| `--brand-vanilla` | `#FFFAEE` | Light/cream accents |
| `--brand-aperol` | `#FE5102` | Primary accent color |

You can also edit brand colors in **`tailwind.config.ts`** under the `brand` palette, which maps to Tailwind utility classes like `text-brand-aperol` and `bg-brand-charcoal`.

---

## Customize the Landing Page

The landing page is the first thing visitors see. Here's what you can tweak:

### Orbiting Logos

**File:** `src/components/landing/orbit-config.ts`

Change which resource logos orbit the center monogram:

```typescript
export const HANDPICKED_ORBIT_NAMES = [
  'Figma', 'Claude', 'GitHub', 'Midjourney', 'Framer', 'React Bits',
];
```

Replace these with names that match entries in your `resources.json`. The orbit has two rings — the first 2 names go on the inner ring, the next 4 on the outer ring.

You can also adjust ring speed, radius, and glow color in `RING_CONFIGS` in the same file.

### WebGL Background (PrismaticBurst)

**File:** `src/components/landing/LandingPage.tsx` (lines 78-85)

The landing page renders a full-screen WebGL shader effect. The props you can change:

```tsx
<PrismaticBurst
  colors={['#FE5102', '#FFFAEE', '#191919']}  // Gradient colors
  animationType="rotate3d"                       // "rotate", "rotate3d", or "hover"
  intensity={1.5}                                // Brightness multiplier
  speed={0.25}                                   // Animation speed
  distort={37.5}                                 // 0-50+, organic distortion
  rayCount={75}                                  // 0 = smooth, higher = visible rays
/>
```

Try `animationType="hover"` to make the effect follow your mouse, or set `distort={0}` and `rayCount={0}` for a clean smooth gradient.

### Starfield

**File:** `src/components/landing/LandingPage.tsx` (line 92)

```tsx
<Starfield speed={0.75} quantity={400} starColor="rgba(255,255,255,0.8)" />
```

Increase `quantity` for a denser star field, or change `starColor` to match your brand.

### Title Animation

**File:** `src/components/landing/LandingPage.tsx` (lines 107-114)

The title uses a character-scramble reveal animation. You can change:
- `text` — the display text
- `speed` — milliseconds per character reveal (lower = faster)
- `characters` — the scramble character set
- `revealDirection` — `"start"` (left to right), `"end"` (right to left), or `"center"` (spiral inward)

---

## Tweak Animations

**File:** `src/lib/motion-tokens.ts`

All animation timing is centralized in one file. Key presets:

| Export | What it controls |
|--------|-----------------|
| `DURATION` | Timing: `fast` (150ms), `normal` (200ms), `slow` (300ms), `cinematic` (800ms) |
| `EASING` | Curves: `smooth`, `spring`, `linear` |
| `SPRING` | Physics: `gentle` (counters), `normal` (modals), `snappy` (buttons) |
| `STAGGER` | Delay between list items: `fast` (30ms), `normal` (50ms), `slow` (100ms) |
| `INTERACTION` | Hover/tap presets: `cardLift`, `buttonLift`, `subtle` |

Change `DURATION.cinematic` to control how fast the 3D universe entrance feels. Change `SPRING.gentle` to affect how the flip counter rolls.

---

## Adjust Search Behavior

**File:** `src/lib/search/semantic-mappings.ts`

Search works client-side using synonym expansion and concept mapping. To teach the search engine new terms:

**Add synonyms** — words that should match each other:
```typescript
export const synonymGroups = {
  // existing entries...
  photo: ['photography', 'image', 'picture', 'photos'],
  // add your own:
  presentation: ['slides', 'deck', 'pitch', 'slideshow'],
};
```

**Add concept mappings** — abstract ideas that map to specific resources:
```typescript
export const conceptMappings = {
  // existing entries...
  // add your own:
  'presentation tools': {
    keywords: ['presentation', 'slides', 'deck'],
    resourceNames: ['Canva', 'Pitch'],
    categories: ['Tools'],
    description: 'Slide deck and presentation tools',
  },
};
```

---

## Change Site Metadata

**File:** `index.html`

Update these for your own deployment:
- `<title>` — page title
- `<meta name="description">` — search engine description
- `<meta property="og:title">` and `og:description` — social share preview text
- `<meta property="og:image">` — social share preview image (update the URL to your own domain)
- `<link rel="icon">` — favicon

---

## Change Fonts

**Config:** `tailwind.config.ts` (font family declarations)
**Files:** `public/fonts/` (woff2 font files)
**CSS:** `src/styles/fonts.css` (`@font-face` declarations)

This project uses two font families:
- **Neue Haas Grotesk Display** — headings and body text (`font-display` / `font-text`)
- **OffBit** — accent/monospace elements like the landing title (`font-accent` / `font-mono`)

**Important:** These are commercial fonts included for demonstration purposes. If you fork this project, you must either purchase your own license or replace them. Good open-source alternatives:

| Current Font | Alternative | Get it |
|-------------|-------------|--------|
| Neue Haas Grotesk | Inter or DM Sans | [Inter](https://rsms.me/inter/) / [Google Fonts](https://fonts.google.com/specimen/DM+Sans) |
| OffBit | Space Mono or JetBrains Mono | [Google Fonts](https://fonts.google.com/specimen/Space+Mono) / [JetBrains](https://www.jetbrains.com/lp/mono/) |

To swap fonts:
1. Replace the `.woff2` files in `public/fonts/`
2. Update the `@font-face` declarations in `src/styles/fonts.css`
3. Update font family names in `tailwind.config.ts`
