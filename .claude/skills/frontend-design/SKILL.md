---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces aligned with BOS design principles. Generates polished code with intentional aesthetics that feel designed, not auto-generated.
license: Complete terms in LICENSE.txt
---

This skill guides creation of distinctive, production-grade frontend interfaces that feel genuinely designed. When working on BOS-3.0 projects, it automatically applies our warm neutrals philosophy and brand tokens.

> **Attribution**: Interaction patterns, animation timing, and form UX guidelines adapted from [Vercel's Web Interface Guidelines](https://vercel.com/design/guidelines), synthesized with BOS brand principles. Skill structure informed by [Claude Code](https://github.com/anthropics/claude-code).

### Source Files (Exact Specs)

For precise values, always reference these configuration files:

| File | Contains |
|------|----------|
| `tailwind.config.ts` | Colors, shadows, font families, animations, semantic tokens |
| `app/theme.css` | CSS custom properties, color scales, shadow definitions |
| `lib/motion.tsx` | Framer Motion variants, easing curves, timing constants |
| `lib/brand-styles/tokens.json` | Design token definitions |

**Best practice**: Use Tailwind classes mapped to CSS variables (e.g., `bg-bg-primary`, `text-fg-secondary`, `border-border-primary`) rather than arbitrary values. This ensures consistency across light/dark modes and future token updates.

---

## 1. Design Thinking

Before writing any code, establish your **design intent**:

### Purpose & Context
*What problem are we solving? Who uses this?*
Think about the user's emotional state, their goals, and what success looks like.

### Aesthetic Direction
Choose a clear visual direction:

| Direction | Feel | When to Use |
|-----------|------|-------------|
| **Warm Minimal** | Clean, inviting, focused | Dashboard UIs, tools, productivity |
| **Editorial** | Magazine-like, typographic | Content-heavy pages, portfolios |
| **Soft/Organic** | Rounded, gentle, approachable | Consumer apps, onboarding |
| **Industrial/Raw** | Utilitarian, honest, functional | Developer tools, technical docs |
| **Luxury/Refined** | Spacious, elegant, deliberate | Brand sites, premium products |

**Key insight**: Bold maximalism and refined minimalism both work — the magic is in **commitment**, not intensity.

### The Memorable Detail
Ask yourself: *What's the one thing someone will remember about this interface?*
Maybe it's a delightful hover state, an unexpected color choice, or how perfectly the typography flows.

---

## 2. BOS Design System Integration

When building for BOS-3.0, use our design tokens:

### Colors (Warm Neutrals)
```css
/* Primary Brand */
--brand-primary: #FE5102;  /* Aperol — CTAs, links, badges ONLY */

/* Warm Neutrals (NOT black/white) */
--charcoal: #191919;       /* Dark backgrounds, primary text */
--vanilla: #FFFAEE;        /* Light backgrounds, light text */

/* Semantic Usage */
--bg-primary, --bg-secondary, --bg-tertiary
--fg-primary, --fg-secondary, --fg-tertiary
--border-primary (at 40% opacity by default)
```

### Typography
| Category | Font | Tailwind Class | Usage |
|----------|------|----------------|-------|
| **Display** | Neue Haas Grotesk Display Pro | `font-display` | Headlines, titles, hero text |
| **Body** | Neue Haas Grotesk Text Pro | `font-sans` | Body text, paragraphs, inputs, tabs |
| **Small** | Neue Haas Grotesk Text Pro | `font-sans text-sm` | Labels, captions, hints, metadata |
| **Accent** | Offbit | `font-accent` | Digital/tech feel (max 2 per viewport) |

**Note**: We use Neue Haas Grotesk consistently across the entire interface—no separate code or monospace fonts.

> **Config reference**: Font families defined in `tailwind.config.ts` → `theme.extend.fontFamily`

### Border Philosophy
Borders should **support, not dominate**:
```jsx
// Default: nearly invisible
className="border border-[var(--border-primary)]/40"

// Hover: slightly more visible
className="hover:border-[var(--border-primary)]"

// Focus: full visibility, but NOT brand color
className="focus:border-[var(--border-primary)]"
```

---

## 3. Interaction Patterns

### Hit Targets & Touch
| Context | Minimum Size | Notes |
|---------|--------------|-------|
| **Desktop** | 24×24px | Visual can be smaller if hit area is expanded |
| **Mobile** | 44×44px | Apple HIG standard |
| **Input font** | ≥16px | Prevents iOS Safari auto-zoom |

```jsx
// Expand hit target beyond visual bounds
<button className="p-2 -m-2"> {/* Visual is 24px, hit area is 40px */}
  <Icon className="w-6 h-6" />
</button>
```

### Focus Management
- Use `:focus-visible` over `:focus` to avoid focus rings on click
- Use `:focus-within` for grouped controls (e.g., input with icon)
- Every focusable element requires a visible focus state
- Implement focus traps in modals/drawers per WAI-ARIA patterns

```jsx
// BOS focus pattern
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-primary)]"
```

### Loading States
| Timing | Value | Purpose |
|--------|-------|---------|
| **Show delay** | 150–300ms | Prevent flash on fast responses |
| **Minimum visible** | 300–500ms | Avoid jarring disappearance |

```jsx
// Don't: Show spinner immediately
{isLoading && <Spinner />}

// Do: Delay spinner appearance
const showSpinner = isLoading && loadingDuration > 200;
```

**During loading:**
- Keep original label text visible alongside indicator
- Menu options opening follow-ups end with ellipsis: "Rename…", "Loading…"

### State Persistence (URL Deep-linking)
Persist UI state in the URL so share, refresh, and Back/Forward work:
- Filters, search queries, pagination
- Selected tabs, expanded panels
- Any `useState` that affects what user sees

Use libraries like [nuqs](https://nuqs.47ng.com/) for type-safe URL state.

### Optimistic Updates
Update the UI immediately when success is likely:
1. Show change instantly
2. Send request to server
3. On success: confirm (subtle)
4. On failure: rollback + show error + offer retry

### Destructive Actions
Never execute destructive operations without safeguards:

| Pattern | When to Use |
|---------|-------------|
| **Confirmation dialog** | Permanent deletion, irreversible changes |
| **Undo with timeout** | Soft deletes, sends, publishes |
| **Type-to-confirm** | Account deletion, production deployments |

```jsx
// Undo pattern
toast("Message deleted", {
  action: { label: "Undo", onClick: restoreMessage }
});
```

### Touch Interactions
```css
/* Prevent double-tap zoom on controls */
touch-action: manipulation;

/* During drag: disable text selection and interactions */
[data-dragging] { user-select: none; }
[data-dragging] * { pointer-events: none; }
```

---

## 4. Motion & Animation

### When to Animate
Animate only when it serves a purpose:
- **Clarify cause/effect**: Show where something came from or went
- **Maintain context**: Help users track changes during transitions
- **Deliberate delight**: Reward interactions meaningfully

**Don't animate** for decoration or to fill silence.

### Motion Library Reference (`lib/motion.tsx`)
Use our pre-built Framer Motion variants:

| Variant | Use Case | Duration |
|---------|----------|----------|
| `fadeInUp` | Default for appearing content | 400ms |
| `fadeIn` | Subtle reveals, no positional change | 300ms |
| `scaleIn` | Modals, popovers, toasts | 300ms |
| `slideFromLeft` | Navigation drawers, panels | 200ms |
| `slideFromRight` | Mobile drawers, sheets | 300ms |
| `dropdownUp` | Dropdowns, menus | 200ms |
| `pageEnter` | Route transitions | 350ms |
| `staggerContainer` | Lists, grids (0.05s stagger) | — |

```jsx
import { PageTransition, MotionItem, fadeInUp } from '@/lib/motion';

<PageTransition>
  <MotionItem variants={fadeInUp}>Content</MotionItem>
</PageTransition>
```

### GSAP vs Framer Motion
| Library | Best For |
|---------|----------|
| **Framer Motion** | Component animations, gestures, layout animations |
| **GSAP** | Timeline sequences, scroll-triggered, SVG morphing |

```jsx
// Framer Motion: Component state
<motion.div whileHover={{ scale: 1.02 }} />

// GSAP: Complex timeline
gsap.timeline()
  .to(element, { opacity: 1, duration: 0.3 })
  .to(text, { y: 0, stagger: 0.05 });
```

### Performance Rules
**GPU-accelerated (prefer these):**
```css
transform: translate(), scale(), rotate()
opacity
filter
```

**Layout-triggering (avoid animating):**
```css
width, height, padding, margin
top, left, right, bottom
font-size, line-height
```

**Anti-patterns:**
```css
/* Never: Animates everything including layout */
transition: all 0.3s;

/* Do: Explicit properties only */
transition: transform 0.3s, opacity 0.3s;
```

### Accessibility (prefers-reduced-motion)
Always honor the user's motion preference:

```jsx
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

// In Framer Motion
<motion.div
  animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
/>
```

### Easing Selection
| Property Changing | Recommended Easing |
|-------------------|-------------------|
| **Opacity only** | `linear` or gentle ease |
| **Size/Scale** | `easeOut` (fast start, slow end) |
| **Position** | `easeOut` or spring |
| **Enter** | `easeOut` |
| **Exit** | `easeIn` (slow start, fast end) |

Our easing curves in `lib/motion.tsx`:
```js
easeOut: [0.4, 0, 0.2, 1]
easeIn: [0.4, 0, 1, 1]
spring: { type: 'spring', stiffness: 400, damping: 30 }
```

---

## 5. Form Design

### Submission Behavior
| Input Type | Enter Key Behavior |
|------------|-------------------|
| Single text input | Submits form |
| Multiple inputs | Submits on last field |
| `<textarea>` | Creates new line |
| `<textarea>` + Cmd/Ctrl+Enter | Submits form |

### Validation Patterns
| Timing | What to Validate |
|--------|-----------------|
| **On blur** | Format, required fields |
| **On submit** | All validation, server errors |
| **Real-time** | Only for character limits or live search |

**Rules:**
- Show errors **adjacent to the field**, not in a summary
- On submit error, focus the first invalid field
- Don't pre-disable submit—let users discover issues
- Keep submit enabled until submission starts

```jsx
// Error placement
<Input />
<span className="text-red-500 text-sm mt-1">Email is required</span>
```

### Autofill & Password Managers
- Set `autocomplete` attribute on all inputs
- Use meaningful `name` attributes
- Don't block paste on any field
- For non-auth fields, use `autocomplete="off"` to avoid password manager triggers
- Disable spellcheck on: emails, codes, usernames

```jsx
<input
  type="email"
  name="email"
  autoComplete="email"
  spellCheck={false}
/>
```

### Mobile Considerations
- Input font ≥16px prevents iOS auto-zoom
- Use correct `type` and `inputmode` for better keyboards:

| Data | type | inputmode |
|------|------|-----------|
| Email | `email` | — |
| Phone | `tel` | — |
| Number | `text` | `numeric` |
| Credit card | `text` | `numeric` |
| Search | `search` | — |

### Placeholder Patterns
- End with ellipsis for prompts: "Search…"
- Show example format: "+1 (123) 456-7890"
- Never use as the only label

---

## 6. Layout Principles

### Optical Alignment
Geometry lies. Adjust ±1–2px when perception beats math:
- Circles and triangles appear smaller than squares at same dimensions
- Text with descenders needs more bottom padding
- Icons may need nudging to appear centered

```jsx
// Play icon in circle button needs right offset
<Icon className="ml-0.5" /> {/* Optical correction */}
```

### Intentional Alignment
Every element should align with something:
- Grid columns
- Baseline of adjacent text
- Edge of parent container
- Optical center

**No accidental positioning.** If something looks unaligned, it should be fixed or intentionally offset.

### Nested Border Radius
Child radius must be ≤ parent radius, and curves should be concentric:

```
Outer radius: 16px
Gap (padding): 8px
Inner radius: 16px - 8px = 8px
```

```jsx
// Nested card pattern
<div className="rounded-2xl p-2">
  <div className="rounded-xl">Inner content</div>
</div>
```

### Layered Shadows
Use ≥2 shadow layers to mimic real light (ambient + direct):

```css
/* BOS layered shadow using Charcoal (25,25,25) */
box-shadow:
  0 1px 2px rgba(25, 25, 25, 0.06),    /* Tight, direct light */
  0 4px 12px rgba(25, 25, 25, 0.08);   /* Soft, ambient light */

/* Elevated state */
box-shadow:
  0 2px 4px rgba(25, 25, 25, 0.06),
  0 8px 24px rgba(25, 25, 25, 0.12);
```

### Safe Areas
Respect notches and home indicators on mobile:

```css
padding-bottom: env(safe-area-inset-bottom);
padding-left: env(safe-area-inset-left);
padding-right: env(safe-area-inset-right);
```

---

## 7. Accessibility

### Contrast Standards
- Prefer **APCA** over WCAG 2 for more accurate perceptual contrast
- BOS Vanilla on Charcoal: 18.5:1 (AAA compliant)
- Interactive states must have **more** contrast than rest state

```css
/* Rest state */
color: var(--fg-secondary);

/* Hover: increase contrast */
hover:color: var(--fg-primary);

/* Focus: highest contrast */
focus:color: var(--fg-primary);
```

### Color Independence
Never rely on color alone for meaning:
- Error states: color + icon + text
- Status indicators: color + label
- Charts: color + pattern or label

```jsx
// Bad: Color only
<div className="bg-red-500" />

// Good: Color + icon + text
<div className="bg-red-500 flex items-center gap-2">
  <AlertIcon />
  <span>Error: Invalid input</span>
</div>
```

### Screen Reader Support
- Icon-only buttons require `aria-label`
- Decorative elements get `aria-hidden="true"`
- Use native elements (`button`, `a`, `label`) before ARIA
- Maintain logical heading hierarchy (`h1` → `h2` → `h3`)
- Include "Skip to content" link

```jsx
// Icon button
<button aria-label="Close modal">
  <XIcon aria-hidden="true" />
</button>
```

### Motion Accessibility
- Honor `prefers-reduced-motion`
- Provide pause controls for any auto-playing content
- Avoid strobing or rapid flashing

---

## 8. Performance

### Response Time Targets
| Operation | Target |
|-----------|--------|
| UI response to input | <100ms |
| API mutations (POST/PATCH/DELETE) | <500ms |
| Page load (LCP) | <2.5s |

### Rendering Optimization
- Virtualize lists >100 items (use [virtua](https://github.com/inokawa/virtua) or similar)
- Use `content-visibility: auto` for off-screen content
- Minimize React re-renders (check with React DevTools)
- Move expensive computations to Web Workers

### Asset Loading
| Asset | Strategy |
|-------|----------|
| Above-fold images | Preload |
| Below-fold images | Lazy load |
| Fonts | Preload critical, subset via `unicode-range` |
| Third-party scripts | `defer` or `async` |

```jsx
// Prevent CLS: Always set dimensions
<img width={800} height={600} src="..." />

// Preconnect to CDNs
<link rel="preconnect" href="https://cdn.example.com" />
```

---

## 9. Content & Typography

### Tabular Numbers
Use fixed-width numbers for data that will be compared:

```css
font-variant-numeric: tabular-nums;
/* Neue Haas Grotesk supports tabular figures natively */
```

### Typographic Details
| Instead of | Use |
|------------|-----|
| `...` (three periods) | `…` (ellipsis character) |
| `"straight quotes"` | `"curly quotes"` |
| `10MB` | `10 MB` (non-breaking space) |
| `Cmd+K` | `⌘ K` (platform symbols) |

```jsx
// Non-breaking space for units
<span>10&nbsp;MB</span>
// Or use \u00A0 in JS strings
```

### Localization
- Format dates, times, numbers for user's locale
- Detect language via `Accept-Language` header, not IP
- Design for text expansion (German/Finnish ~30% longer)

---

## 10. What to Avoid

**Generic AI aesthetics:**
- Overused fonts (Inter, Roboto, Arial)
- Purple gradients on white backgrounds
- Predictable layouts without character
- Cookie-cutter component patterns

**Interaction anti-patterns:**
- `transition: all` (performance killer)
- Autoplay animations
- Disabled submit buttons before user tries
- Blocking paste on any input
- Color-only status indicators

**BOS-specific bans:**
- Never use the `Sparkles` icon from Lucide
- Never use brand colors (Aperol) for borders
- Never use pure black (#000) or white (#FFF)
- Never use `border-2` or thick borders

**Instead:**
- Make unexpected choices that feel genuinely designed
- Match implementation complexity to aesthetic vision
- Use warm neutrals (Charcoal/Vanilla) for backgrounds and text
- Keep borders subtle (40% opacity default)

---

## 11. Voice & Approach

When building interfaces, think like a **steward**:
- You're part of the team, not an external consultant
- Use "we" and "our" when discussing brand decisions
- Design choices should feel natural, not prescribed
- Explain reasoning in simple terms
- Be confident in aesthetic choices, but open to iteration

---

## 12. Examples

### Card with BOS Styling
```jsx
<div className="
  bg-[var(--bg-secondary)]/30
  border border-[var(--border-primary)]/40
  hover:bg-[var(--bg-secondary)]/60
  rounded-xl
  transition-colors duration-200
">
  {/* Content */}
</div>
```

### Animated Page with Stagger
```jsx
import { PageTransition, MotionItem, fadeInUp } from '@/lib/motion';

export default function Dashboard() {
  return (
    <PageTransition className="space-y-6">
      <MotionItem>
        <h1>Dashboard</h1>
      </MotionItem>
      <MotionItem>
        <StatsGrid />
      </MotionItem>
      <MotionItem>
        <ActivityFeed />
      </MotionItem>
    </PageTransition>
  );
}
```

### Form with Proper Validation
```jsx
<form onSubmit={handleSubmit}>
  <div className="space-y-4">
    <div>
      <Label htmlFor="email">Email</Label>
      <Input
        id="email"
        type="email"
        autoComplete="email"
        className={errors.email ? 'border-red-500' : ''}
      />
      {errors.email && (
        <span className="text-red-500 text-sm mt-1">{errors.email}</span>
      )}
    </div>

    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? (
        <>
          <Spinner className="w-4 h-4 mr-2" />
          Submitting…
        </>
      ) : (
        'Submit'
      )}
    </Button>
  </div>
</form>
```

### Layered Shadow Button
```jsx
<button className="
  bg-[var(--bg-brand-solid)]
  text-[var(--vanilla)]
  px-4 py-2 rounded-lg
  shadow-[0_1px_2px_rgba(25,25,25,0.1),0_4px_12px_rgba(25,25,25,0.15)]
  hover:shadow-[0_2px_4px_rgba(25,25,25,0.1),0_8px_24px_rgba(25,25,25,0.2)]
  transition-shadow duration-200
">
  Get Started
</button>
```

---

*Remember: You're capable of extraordinary creative work. Commit fully to your vision and execute with precision.*

---

**Sources & Attribution**
- Interaction patterns adapted from [Vercel Web Interface Guidelines](https://vercel.com/design/guidelines)
- Skill structure informed by [Claude Code](https://github.com/anthropics/claude-code)
- BOS design tokens: `tailwind.config.ts`, `app/theme.css`, `lib/motion.tsx`
