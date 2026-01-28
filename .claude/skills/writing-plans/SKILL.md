# Writing Plans

> This skill activates when the user requests implementation planning, architecture design, feature roadmaps, or asks to "plan", "design", or "architect" a solution. Also activates when starting complex multi-file changes.

---

## Core Philosophy

Write comprehensive implementation plans assuming the reader has **zero context** for our codebase but deep development expertise. Plans should enable any skilled developer—or parallel agent—to execute independently with zero additional guidance.

**BOS Integration**: Every plan must account for our design system, component patterns, and brand voice requirements at the architecture level.

---

## Plan Structure (Required Sections)

### 1. Header Block

```markdown
# Implementation Plan: [Feature Name]

**Goal**: [One-sentence outcome statement]
**Architecture**: [High-level approach]
**Tech Stack**: Next.js 16+, React 19, TypeScript strict, Tailwind CSS, React Aria
**Design System**: BOS-3.0 (Charcoal/Vanilla/Aperol palette, semantic tokens)
**Created**: YYYY-MM-DD
```

### 2. Design System Checklist

Before any UI task, verify:
- [ ] Components use semantic CSS variables (`--bg-primary`, `--fg-secondary`, etc.)
- [ ] Borders follow 40% opacity pattern (`border-[var(--border-primary)]/40`)
- [ ] Brand color (Aperol) reserved for CTAs/active states only
- [ ] Interactive elements use React Aria Components
- [ ] Warm neutrals (Charcoal/Vanilla) instead of pure black/white

### 3. Task Breakdown

Each task represents **2-5 minutes of work**. Use this granularity:

```markdown
### Task 1: Create component skeleton

**File**: `components/feature/FeatureName.tsx`
**Type**: Component (React Aria base)
**Design Token Requirements**:
- Background: `var(--bg-secondary)/30`
- Border: `border-[var(--border-primary)]/40`
- Text: `var(--fg-primary)`

**Steps**:
1. Write failing test in `__tests__/FeatureName.test.tsx`
2. Verify test fails (RED)
3. Implement minimal component
4. Verify test passes (GREEN)
5. Commit: `feat(feature): add FeatureName component skeleton`

**Code**:
\`\`\`tsx
// __tests__/FeatureName.test.tsx
import { render, screen } from '@testing-library/react';
import { FeatureName } from '../FeatureName';

describe('FeatureName', () => {
  it('renders with BOS design tokens', () => {
    render(<FeatureName />);
    // Verify semantic token usage
    expect(screen.getByRole('region')).toHaveClass('bg-[var(--bg-secondary)]');
  });
});
\`\`\`

**Expected Output**:
\`\`\`
FAIL  __tests__/FeatureName.test.tsx
  FeatureName
    ✕ renders with BOS design tokens (5ms)
\`\`\`
```

### 4. Component Pattern Reference

For UI components, specify which BOS pattern applies:

| Pattern | Usage | Tokens |
|---------|-------|--------|
| **Card** | Containers, panels | `bg-secondary/30`, `border-primary/40`, `rounded-xl` |
| **Button Primary** | Main CTAs | `bg-brand-solid`, `text-white`, `hover:bg-brand-solid/90` |
| **Button Secondary** | Secondary actions | `bg-transparent`, `border-primary`, `hover:bg-secondary/50` |
| **Input** | Form fields | `bg-tertiary`, `border-primary/40`, `focus:border-primary` |
| **List Item** | Selectable rows | `hover:bg-secondary/50`, `text-fg-primary` |

### 5. Execution Handoff

After plan completion, offer these paths:

**Option A: Subagent-Driven (Recommended for parallel work)**
> Use `/subagent-driven-development` skill to dispatch fresh agents per task with spec/quality reviews.

**Option B: Sequential Execution**
> Execute tasks in order using feature-dev plugin phases.

**Option C: Parallel Agents**
> Dispatch multiple agents for independent tasks simultaneously.

---

## Quality Gates

Every plan must pass these checks:

1. **Completeness**: Can someone execute this with ZERO questions?
2. **Design System**: Are all UI elements mapped to BOS tokens?
3. **Testing**: Does every code task include test-first steps?
4. **Commits**: Is there a commit instruction after each completable unit?
5. **Dependencies**: Are file paths exact and dependencies clear?

---

## Integration with Existing Plugins

This skill complements:
- **feature-dev**: Plans feed into Discovery/Define/Design phases
- **code-review**: Plans specify what reviewers should verify
- **hookify**: Plans can specify guardrails to enforce

---

## Anti-Patterns (Never Do These)

- Writing plans without reading existing code first
- Specifying hardcoded colors instead of CSS variables
- Skipping test-first steps "to save time"
- Using generic placeholder paths like `src/components/MyComponent.tsx`
- Assuming the executor knows our codebase conventions
- Using pure black (`#000`) or pure white (`#FFF`) in any design spec

---

## Example: Minimal Plan

```markdown
# Implementation Plan: Add Loading Skeleton

**Goal**: Show loading state for data-dependent components
**Architecture**: Reusable Skeleton component with BOS styling
**Tech Stack**: React, Tailwind, CSS animations
**Design System**: BOS-3.0

## Design System Checklist
- [x] Uses `--bg-secondary` for skeleton base
- [x] Animation uses `pulse` keyframe (Tailwind)
- [x] No hardcoded colors

## Tasks

### Task 1: Create Skeleton component
**File**: `components/ui/Skeleton.tsx`
**Steps**:
1. Write test for basic render
2. Implement with BOS tokens
3. Verify animation works
4. Commit: `feat(ui): add Skeleton loading component`

**Code**:
\`\`\`tsx
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-[var(--bg-secondary)]",
        className
      )}
    />
  );
}
\`\`\`
```

---

## Supporting Files

### Examples
- **[Dashboard Widget Plan](dashboard-widget-plan.md)** — Complete example plan for a StatsWidget component with all BOS patterns

### References
- **[Component Patterns](claude%20config/Skills/writing-plans/references/component-patterns.md)** — Ready-to-use BOS component patterns (cards, buttons, inputs, modals, badges, animations)

---

*Adapted from obra/superpowers with BOS brand integration*
