# BOS Design System Reference

> This reference provides design system context for all Claude Code plugins in your workspace.
> Import this context when building or reviewing UI components.

---

## Brand Philosophy

**"Steward, not advisor"** — Act as a team member who speaks FROM within the brand, not an external consultant.

- Use "we" and "our" when discussing brand decisions
- Don't preface responses with "according to guidelines"
- Make brand-aligned choices feel natural, not prescriptive

---

## Core Colors (BRAND-OS)

The system uses **warm neutrals** instead of harsh black/white for an inviting, approachable feel.

| Token | Hex | Role |
|-------|-----|------|
| **Aperol** | `#FE5102` | Primary accent — CTAs, links, badges, alerts |
| **Charcoal** | `#191919` | Warm dark — Dark mode backgrounds, primary text |
| **Vanilla** | `#FFFAEE` | Warm light — Light mode backgrounds, light text |

### Color Usage Rules
- **Brand colors (Aperol)**: Use sparingly for primary CTAs, active states, badges
- **NEVER** use brand colors for borders or harsh outlines
- **Semantic colors**: Success (emerald-500), Warning (amber-500), Error (red-500)

### Contrast Ratios
- Vanilla on Charcoal: **18.5:1** (AAA compliant)
- Charcoal on Vanilla: **18.5:1** (AAA compliant)

---

## Typography

| Category | Font | Usage |
|----------|------|-------|
| **Display** | Neue Haas Grotesk Display Pro | Headlines, titles, hero text |
| **Body** | Neue Haas Grotesk Text Pro | Body text, paragraphs, inputs, tabs |
| **Small** | Neue Haas Grotesk Text Pro | Labels, captions, hints, metadata |
| **Accent** | Offbit | Digital/tech feel (max 2 per viewport) |

**Note**: We use Neue Haas Grotesk consistently—no separate code or monospace fonts.

---

## Border & Interaction Philosophy

Borders should **support, not dominate** the visual hierarchy.

### Border States
```css
/* Default: Nearly invisible */
border-[var(--border-primary)]/40

/* Hover: Slightly more visible */
hover:border-[var(--border-primary)]

/* Focus: Full visibility, but NOT brand color */
focus:border-[var(--border-primary)]
```

### Card Pattern
```jsx
className="bg-[var(--bg-secondary)]/30 border border-[var(--border-primary)]/40 hover:bg-[var(--bg-secondary)]/60"
```

---

## Component Patterns

### Buttons
- Built on React Aria for full WCAG compliance
- Primary: Aperol background, warm hover state
- Secondary: Transparent with subtle border
- Tertiary: Text-only with hover underline

### Form Inputs
- Subtle border at rest
- Brand accent on focus (but not harsh)
- Clear label hierarchy
- Helpful hint text below
- Input font ≥16px (prevents iOS auto-zoom)
- Show errors adjacent to fields, focus first error on submit
- Don't pre-disable submit—let users discover issues

> **Deep dive**: See `frontend-design` skill §5 "Form Design" for validation patterns, autofill compatibility, and mobile considerations.

### Cards & Containers
- Use `bg-secondary/30` for subtle layering
- Rounded corners: `rounded-lg` (8px) or `rounded-xl` (12px for brand)
- Shadows use Charcoal (25,25,25) not pure black
- Nested radii: child ≤ parent (e.g., outer 16px with 8px padding → inner 8px)
- Layered shadows: ≥2 layers (ambient + direct light)

---

## Interaction Patterns

### Hit Targets
| Context | Minimum |
|---------|---------|
| Desktop | 24×24px |
| Mobile | 44×44px |

### Loading States
- Show delay: 150–300ms (prevent flash)
- Minimum visible: 300–500ms (avoid jarring)
- Keep original label visible during load

### State Persistence
Persist UI state in URL for share/refresh/Back/Forward:
- Filters, pagination, selected tabs
- Use [nuqs](https://nuqs.47ng.com/) for type-safe URL state

### Destructive Actions
- Confirmation dialog for permanent deletes
- Undo with timeout for soft actions
- Type-to-confirm for critical operations

> **Deep dive**: See `frontend-design` skill §3 "Interaction Patterns" for optimistic updates, focus management, and touch interactions.

---

## Animation & Motion

| Library | Usage |
|---------|-------|
| **Framer Motion** | Component animations, gestures, layout animations |
| **GSAP** | Timeline sequences, scroll-triggered, SVG morphing |
| **Tailwind Animate** | Simple utility-based transitions |

### Motion Library (`lib/motion.tsx`)
Pre-built Framer Motion variants for consistent animations:
- `fadeInUp`, `fadeIn`, `scaleIn` — Content appearance
- `slideFromLeft`, `slideFromRight` — Drawers, panels
- `dropdownUp`, `staggerContainer` — Menus, lists
- `PageTransition`, `MotionItem` — Page-level wrappers

### Timing Guidelines
| Operation | Duration |
|-----------|----------|
| Micro-interactions | 150–200ms |
| Content transitions | 300–400ms |
| Page transitions | 350ms |
| Spinner show delay | 150–300ms |

### Animation Performance
- **Prefer**: `transform`, `opacity`, `filter` (GPU-accelerated)
- **Avoid animating**: `width`, `height`, `margin`, `padding` (layout-triggering)
- **Never**: `transition: all`
- **Always**: Honor `prefers-reduced-motion`

> **Deep dive**: See `frontend-design` skill §4 "Motion & Animation" for variant selection guide and GSAP vs Framer Motion decision tree.

---

## Accessibility (A11y) First

- All components use **React Aria Components**
- Focus states are always visible (`:focus-visible` over `:focus`)
- Color contrast meets AAA standards (prefer APCA over WCAG 2)
- Screen reader support built-in
- Never rely on color alone—always include text/icons
- Interactive states must have **more** contrast than rest state

> **Deep dive**: See `frontend-design` skill §7 "Accessibility" for APCA guidance, color independence patterns, and motion accessibility.

---

## Voice & Tone

| Quality | Description |
|---------|-------------|
| **Smart but not smug** | Expert knowledge without condescension |
| **Technical but accessible** | Explain concepts clearly |
| **Confident but humble** | State opinions, remain open |
| **Warm but professional** | Friendly without being casual |

**Formula**: Expert + Humble + Accessible + Community-focused = **Open Session**

---

## Quick Reference: Semantic Tokens

### Backgrounds
- `--bg-primary` — Main background
- `--bg-secondary` — Elevated surfaces
- `--bg-tertiary` — Cards, inputs
- `--bg-overlay` — Modal overlays

### Foregrounds (Text)
- `--fg-primary` — Main text
- `--fg-secondary` — Secondary text
- `--fg-tertiary` — Placeholder, muted

### Borders
- `--border-primary` — Default borders
- `--border-secondary` — Subtle dividers

---

## For Plugin Developers

When creating or reviewing code, always:

1. **Check design token usage** — Use CSS variables, not hardcoded colors
2. **Verify accessibility** — Focus states, contrast, screen readers
3. **Apply warm neutrals** — Avoid pure black/white
4. **Use subtle borders** — 40% opacity default, never brand color
5. **Match brand voice** — Steward, not advisor

---

*This reference is synced with BOS-3.0 at `/Users/alexbouhdary/Documents/GitHub/BOS-3.0`*
