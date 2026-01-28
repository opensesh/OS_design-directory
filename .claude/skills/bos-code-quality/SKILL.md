# BOS Code Quality

> This skill activates during code review, PR review, quality checks, or when phrases like "check quality", "review code", "verify compliance", or "design system check" appear. Auto-activates after any UI component work.

---

## Core Purpose

Ensure all code meets BOS (Brand Operating System) standards for design system compliance, accessibility, and brand consistency. This skill integrates with code reviews to add BOS-specific quality gates.

---

## Quality Dimensions

### 1. Design System Compliance

#### Color Usage
```
✅ CORRECT                           ❌ WRONG
var(--bg-primary)                    bg-white
var(--fg-secondary)                  text-gray-500
var(--border-primary)                border-slate-200
```

**Verification Command:**
```bash
# Find hardcoded colors (should return empty)
grep -rE "#[0-9A-Fa-f]{3,6}|rgb\(|rgba\(" --include="*.tsx" --include="*.css" | grep -v "var(--"

# Find forbidden Tailwind classes
grep -rE "bg-white|bg-black|text-white|text-black|border-white|border-black" --include="*.tsx"
```

#### Border Patterns
```tsx
// ✅ CORRECT - Subtle, supportive
className="border border-[var(--border-primary)]/40 hover:border-[var(--border-primary)]"

// ❌ WRONG - Harsh, dominant
className="border-2 border-white"
className="border border-[var(--fg-brand-primary)]"  // Never brand color for borders
```

#### Brand Color (Aperol #FE5102) Usage
```
ALLOWED                              FORBIDDEN
─────────────────────────────────────────────────────
Primary CTA buttons                  Borders
Active/selected states               Backgrounds (except buttons)
Badge accents                        Decorative elements
Link hover states                    Large areas
```

### 2. Component Patterns

#### React Aria Requirement
All interactive elements MUST use React Aria Components:

```tsx
// ✅ CORRECT
import { Button, Input, Select } from 'react-aria-components';

// ❌ WRONG
<button onClick={...}>  // Missing accessibility
<input type="text" />   // Missing ARIA support
```

#### Card Pattern
```tsx
// ✅ Standard BOS Card
<div className={cn(
  "bg-[var(--bg-secondary)]/30",
  "border border-[var(--border-primary)]/40",
  "rounded-xl",
  "hover:bg-[var(--bg-secondary)]/60",
  "hover:border-[var(--border-primary)]",
  "transition-colors duration-150"
)}>

// ❌ Wrong patterns
<div className="bg-white rounded-lg shadow">  // Hardcoded
<div className="bg-gray-100 border-2">        // Wrong opacity
```

#### Button Variants
```tsx
// Primary (Aperol accent)
className="bg-[var(--bg-brand-solid)] text-white hover:bg-[var(--bg-brand-solid)]/90"

// Secondary (transparent)
className="bg-transparent border border-[var(--border-primary)] hover:bg-[var(--bg-secondary)]/50"

// Tertiary (text only)
className="text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] hover:underline"
```

### 3. Accessibility Standards

#### Focus Management
```tsx
// ✅ Focus visible and styled
className="focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)] focus:ring-offset-2"

// ✅ Skip link for keyboard users
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to content
</a>
```

#### Color Contrast
```
Minimum Requirements:
- Normal text: 4.5:1 ratio (AA)
- Large text: 3:1 ratio (AA)
- UI components: 3:1 ratio

BOS Palette Compliance:
- Vanilla on Charcoal: 18.5:1 ✅ AAA
- Charcoal on Vanilla: 18.5:1 ✅ AAA
- Aperol on Charcoal: 5.5:1 ✅ AA (large text)
```

#### Screen Reader Support
```tsx
// ✅ Descriptive labels
<Button aria-label="Close dialog">
  <XIcon aria-hidden="true" />
</Button>

// ✅ Live regions for dynamic content
<div role="status" aria-live="polite">
  {statusMessage}
</div>
```

### 4. Typography

#### Font Usage
```css
/* Headlines */
font-family: 'Neue Haas Grotesk Display Pro', system-ui, sans-serif;

/* Body */
font-family: 'Neue Haas Grotesk Text Pro', system-ui, sans-serif;

/* Accent/Display */
font-family: 'Offbit', monospace;

/* Code */
font-family: 'SF Mono', Consolas, Monaco, monospace;
```

#### Never Use
- Generic sans-serif for headlines
- System fonts where brand fonts should appear
- Offbit for body text (accent only)

### 5. Animation Standards

#### Approved Libraries
```tsx
// Complex choreography
import { motion } from 'framer-motion';

// High-performance scroll/timeline
import gsap from 'gsap';

// Simple transitions
className="transition-colors duration-150"
```

#### Timing Guidelines
```css
/* Micro-interactions: 150ms */
transition-duration: 150ms;

/* UI transitions: 200-300ms */
transition-duration: 200ms;

/* Page transitions: 300-500ms */
transition-duration: 300ms;
```

---

## Quality Checklist

Use this checklist for every code review:

```markdown
## BOS Quality Review

### Design System
- [ ] All colors use CSS variables
- [ ] No hardcoded hex/rgb values
- [ ] Border opacity follows 40% pattern
- [ ] Brand color (Aperol) used appropriately
- [ ] Warm neutrals (Charcoal/Vanilla) not black/white

### Components
- [ ] Interactive elements use React Aria
- [ ] Card pattern matches BOS standard
- [ ] Button variants are correct
- [ ] Focus states visible and styled

### Accessibility
- [ ] Color contrast meets AA minimum
- [ ] Focus management implemented
- [ ] ARIA labels present
- [ ] Keyboard navigation works

### Typography
- [ ] Correct font families used
- [ ] Offbit only for accents
- [ ] Font sizes from scale

### Animation
- [ ] Uses approved libraries
- [ ] Timing follows guidelines
- [ ] No jarring transitions
```

---

## Automated Checks

### Pre-commit Hook (hookify integration)
```bash
# Block hardcoded colors
if grep -rE "#[0-9A-Fa-f]{6}" --include="*.tsx" | grep -v "var(--"; then
  echo "ERROR: Hardcoded colors found. Use CSS variables."
  exit 1
fi

# Warn on missing React Aria
if grep -rE "<button|<input|<select" --include="*.tsx" | grep -v "react-aria"; then
  echo "WARNING: Native elements found. Consider React Aria."
fi
```

### CI Quality Gate
```yaml
bos-quality-check:
  runs-on: ubuntu-latest
  steps:
    - name: Check Design System Compliance
      run: |
        # No hardcoded colors
        ! grep -rE "#[0-9A-Fa-f]{3,6}" --include="*.tsx" | grep -v "var(--"

    - name: Check Accessibility
      run: npx axe-core --include "src/**/*.tsx"
```

---

## Issue Severity Levels

### Critical (Must Fix Before Merge)
- Hardcoded colors bypassing design system
- Missing accessibility on interactive elements
- Pure black (#000) or white (#FFF) usage
- Brand color misuse (borders, decorative)

### Important (Should Fix Before Merge)
- Missing focus states
- Incorrect button variant
- Wrong font family
- Animation timing off

### Minor (Track for Future)
- Suboptimal class ordering
- Could use more semantic token
- Animation could be smoother

---

## Integration with Existing Plugins

### With code-review
- BOS quality is a dimension of code-review
- Add BOS checklist to review output

### With feature-dev
- Quality gates at Build and Review phases
- Block phase transition on Critical issues

### With hookify
- Create hooks for automated BOS checks
- Warn on deviations, block on violations

### With verification-before-completion
- BOS compliance is verification criterion
- Must pass quality check before "complete"

---

## Quick Reference Card

```
┌────────────────────────────────────────────────────────────┐
│  BOS CODE QUALITY QUICK CHECK                              │
├────────────────────────────────────────────────────────────┤
│  Colors:     var(--bg-*), var(--fg-*), var(--border-*)    │
│  Borders:    border-[var(--border-primary)]/40            │
│  Brand:      Aperol for CTAs/active ONLY                  │
│  Components: React Aria for all interactive               │
│  Cards:      bg-secondary/30, border-primary/40           │
│  Focus:      ring-2 ring-[var(--border-primary)]          │
│  Contrast:   18.5:1 Charcoal↔Vanilla (AAA)               │
├────────────────────────────────────────────────────────────┤
│  ❌ NEVER: #000, #FFF, bg-white, border-brand             │
│  ✅ ALWAYS: CSS vars, React Aria, focus states           │
└────────────────────────────────────────────────────────────┘
```

---

## Supporting Files

### Examples
- **[Review Walkthrough](review-walkthrough.md)** — Step-by-step example of conducting a code quality review on a FilterPanel PR, identifying issues and providing corrections

### References
- **[Design Token Mapping](design-token-mapping.md)** — Complete mapping of all BOS semantic tokens (backgrounds, text, borders, states) with usage patterns and migration guide

---

*BOS-specific skill for Brand Operating System quality enforcement*
