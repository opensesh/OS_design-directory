# BOS Design Token Mapping Reference

> Complete mapping of semantic tokens to their usage contexts.

---

## Background Tokens

| Token | CSS Variable | Usage | Light Value | Dark Value |
|-------|--------------|-------|-------------|------------|
| Primary | `--bg-primary` | Main page background | Vanilla (#FFFAEE) | Charcoal (#191919) |
| Secondary | `--bg-secondary` | Elevated surfaces, cards | #F5F0E6 | #2A2A2A |
| Tertiary | `--bg-tertiary` | Inputs, nested surfaces | #EDE8DE | #333333 |
| Quaternary | `--bg-quaternary` | Deep nesting | #E5E0D6 | #3D3D3D |
| Overlay | `--bg-overlay` | Modal backdrops | rgba(25,25,25,0.5) | rgba(0,0,0,0.7) |
| Brand Solid | `--bg-brand-solid` | Primary CTAs | Aperol (#FE5102) | Aperol (#FE5102) |

### Background Usage Patterns

```tsx
// Page background
<main className="bg-[var(--bg-primary)]">

// Card/panel
<div className="bg-[var(--bg-secondary)]/30">

// Form input
<input className="bg-[var(--bg-tertiary)]">

// Modal overlay
<div className="bg-[var(--bg-overlay)]">

// Primary button
<Button className="bg-[var(--bg-brand-solid)]">
```

---

## Foreground (Text) Tokens

| Token | CSS Variable | Usage | Light Value | Dark Value |
|-------|--------------|-------|-------------|------------|
| Primary | `--fg-primary` | Main text, headings | Charcoal (#191919) | Vanilla (#FFFAEE) |
| Secondary | `--fg-secondary` | Secondary text, labels | #4A4A4A | #B0B0B0 |
| Tertiary | `--fg-tertiary` | Muted text, placeholders | #767676 | #808080 |
| Brand Primary | `--fg-brand-primary` | Accent text, links | Aperol (#FE5102) | Aperol (#FE5102) |

### Text Usage Patterns

```tsx
// Headings, important text
<h1 className="text-[var(--fg-primary)]">

// Labels, secondary info
<label className="text-[var(--fg-secondary)]">

// Placeholders, captions
<span className="text-[var(--fg-tertiary)]">

// Links, accent text
<a className="text-[var(--fg-brand-primary)]">
```

---

## Border Tokens

| Token | CSS Variable | Usage | Light Value | Dark Value |
|-------|--------------|-------|-------------|------------|
| Primary | `--border-primary` | Default borders | #D4CFC5 | #404040 |
| Secondary | `--border-secondary` | Subtle dividers | #E5E0D6 | #333333 |

### Border Usage Patterns

```tsx
// Default border (40% opacity)
<div className="border border-[var(--border-primary)]/40">

// Hover state (full opacity)
<div className="hover:border-[var(--border-primary)]">

// Focus state (ring, not border)
<input className="focus:ring-2 focus:ring-[var(--border-primary)]">

// Divider
<hr className="border-[var(--border-secondary)]">
```

---

## State Colors

### Semantic Status Colors

| State | Token Pattern | Light Value | Dark Value |
|-------|---------------|-------------|------------|
| Success | `--success-*` | Emerald scale | Emerald scale |
| Warning | `--warning-*` | Amber scale | Amber scale |
| Error | `--error-*` | Red scale | Red scale |
| Info | `--info-*` | Blue scale | Blue scale |

### Status Usage Patterns

```tsx
// Success badge
<span className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">

// Warning alert
<div className="bg-amber-500/10 text-amber-600 border-amber-500/20">

// Error message
<p className="text-red-500">

// Info tooltip
<div className="bg-blue-500/10 text-blue-500">
```

---

## Common Patterns Quick Reference

### Card Pattern
```tsx
className={cn(
  "bg-[var(--bg-secondary)]/30",
  "border border-[var(--border-primary)]/40",
  "rounded-xl",
  "hover:bg-[var(--bg-secondary)]/60",
  "hover:border-[var(--border-primary)]",
  "transition-colors duration-150"
)}
```

### Button Primary
```tsx
className={cn(
  "bg-[var(--bg-brand-solid)]",
  "text-white",
  "hover:bg-[var(--bg-brand-solid)]/90",
  "focus:ring-2 focus:ring-[var(--bg-brand-solid)]",
  "disabled:opacity-50"
)}
```

### Button Secondary
```tsx
className={cn(
  "bg-transparent",
  "border border-[var(--border-primary)]",
  "text-[var(--fg-primary)]",
  "hover:bg-[var(--bg-secondary)]/50",
  "focus:ring-2 focus:ring-[var(--border-primary)]"
)}
```

### Input Field
```tsx
className={cn(
  "bg-[var(--bg-tertiary)]",
  "border border-[var(--border-primary)]/40",
  "text-[var(--fg-primary)]",
  "placeholder:text-[var(--fg-tertiary)]",
  "hover:border-[var(--border-primary)]",
  "focus:border-[var(--border-primary)]",
  "focus:ring-1 focus:ring-[var(--border-primary)]"
)}
```

### List Item
```tsx
className={cn(
  "text-[var(--fg-primary)]",
  "hover:bg-[var(--bg-secondary)]/50",
  "focus:bg-[var(--bg-secondary)]/50",
  "data-[selected]:bg-[var(--bg-tertiary)]"
)}
```

### Icon Button
```tsx
className={cn(
  "p-2 rounded-lg",
  "text-[var(--fg-tertiary)]",
  "hover:text-[var(--fg-primary)]",
  "hover:bg-[var(--bg-secondary)]/50",
  "focus:ring-2 focus:ring-[var(--border-primary)]"
)}
```

---

## Migration Guide: Common Replacements

When reviewing code, use this mapping:

| Hardcoded | Replace With |
|-----------|--------------|
| `bg-white` | `bg-[var(--bg-primary)]` or `bg-[var(--bg-secondary)]` |
| `bg-black` | `bg-[var(--bg-primary)]` (dark mode) |
| `bg-gray-50` | `bg-[var(--bg-secondary)]/30` |
| `bg-gray-100` | `bg-[var(--bg-tertiary)]` |
| `bg-gray-200` | `bg-[var(--bg-quaternary)]` |
| `text-black` | `text-[var(--fg-primary)]` |
| `text-white` | Context dependent - usually `text-[var(--fg-primary)]` |
| `text-gray-500` | `text-[var(--fg-secondary)]` |
| `text-gray-400` | `text-[var(--fg-tertiary)]` |
| `text-gray-900` | `text-[var(--fg-primary)]` |
| `border-gray-200` | `border-[var(--border-primary)]/40` |
| `border-gray-300` | `border-[var(--border-primary)]` |
| `bg-blue-500` | `bg-[var(--bg-brand-solid)]` (if CTA) |
| `text-blue-500` | `text-[var(--fg-brand-primary)]` (if accent) |

---

## Animation Tokens

| Animation | Duration | Easing | Usage |
|-----------|----------|--------|-------|
| Micro | 150ms | ease-out | Hover states, toggles |
| UI | 200ms | ease-out | Panel transitions |
| Page | 300ms | ease-in-out | Route changes |
| Emphasis | 500ms | spring | Attention-grabbing |

```tsx
// Micro interaction
className="transition-colors duration-150"

// UI transition
className="transition-all duration-200"

// Framer Motion page
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
```

---

## Spacing Reference

| Token | Value | Usage |
|-------|-------|-------|
| `p-1` | 4px | Tight padding (badges) |
| `p-2` | 8px | Small padding (icon buttons) |
| `p-3` | 12px | Medium padding (list items) |
| `p-4` | 16px | Standard padding (cards) |
| `p-6` | 24px | Generous padding (panels) |
| `gap-1` | 4px | Tight gap (badge groups) |
| `gap-2` | 8px | Small gap (button groups) |
| `gap-4` | 16px | Standard gap (form fields) |

---

## Border Radius Reference

| Token | Value | Usage |
|-------|-------|-------|
| `rounded` | 4px | Small elements |
| `rounded-md` | 6px | Buttons, inputs |
| `rounded-lg` | 8px | Cards, panels |
| `rounded-xl` | 12px | Large cards, modals |
| `rounded-2xl` | 16px | Feature cards |
| `rounded-full` | 9999px | Badges, avatars |
