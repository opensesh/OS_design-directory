# Example: Debugging CSS Variable Issues

> A complete walkthrough of systematic debugging for a common BOS issue.

---

## The Bug Report

**Symptom**: Dark mode toggle works, but certain cards remain light-colored even in dark mode.

**Initial Observation**: The `MetricCard` component doesn't respond to theme changes.

---

## Phase 1: Root Cause Investigation

### Step 1: Read the Error Carefully

There's no console error, but the visual bug is clear:
- Most components switch to dark theme ✓
- `MetricCard` stays light ✗

### Step 2: Reproduce Consistently

```
1. Load dashboard in light mode
2. Click dark mode toggle
3. Observe: Header, sidebar, other cards → dark ✓
4. Observe: MetricCard → still light ✗
5. Refresh page in dark mode → MetricCard still light ✗

Reproduction: 100% consistent
```

### Step 3: Check Recent Changes

```bash
$ git log --oneline -10 -- components/dashboard/MetricCard.tsx

a1b2c3d refactor: extract MetricCard from DashboardGrid
f4e5d6c feat: add trend indicators to MetricCard
```

The refactor commit is suspicious. Let's check what changed:

```bash
$ git diff a1b2c3d~1..a1b2c3d -- components/dashboard/MetricCard.tsx
```

**Finding**: During extraction, hardcoded colors were introduced:
```tsx
// Before (in DashboardGrid)
className="bg-[var(--bg-secondary)]"

// After (in MetricCard)
className="bg-[#FFFAEE]"  // ← Hardcoded Vanilla!
```

### Step 4: Trace Data Flow

CSS Variable Chain:
```
app/theme.css
  → defines --bg-secondary for light/dark
    → Tailwind config maps to utility
      → Component should use var(--bg-secondary)
        → MetricCard uses HARDCODED #FFFAEE ✗
```

### Step 5: Gather Diagnostic Evidence

```javascript
// In browser console
const card = document.querySelector('.metric-card');
getComputedStyle(card).backgroundColor;
// Returns: "rgb(255, 250, 238)" ← Always Vanilla, ignores theme

// Compare with working component
const sidebar = document.querySelector('.sidebar');
getComputedStyle(sidebar).backgroundColor;
// Returns: "rgb(25, 25, 25)" ← Correctly Charcoal in dark mode
```

---

## Phase 2: Pattern Analysis

### Step 1: Find Working Examples

Look at a component that DOES respond to theme changes:

```tsx
// components/dashboard/StatsCard.tsx (works correctly)
<div className="bg-[var(--bg-secondary)]">
```

### Step 2: Study Reference Implementation

The working pattern uses CSS variables that change with theme:

```css
/* app/theme.css */
:root {
  --bg-secondary: #FFFAEE;  /* Light mode */
}

[data-theme="dark"] {
  --bg-secondary: #2A2A2A;  /* Dark mode */
}
```

### Step 3: Identify Differences

| Aspect | StatsCard (works) | MetricCard (broken) |
|--------|-------------------|---------------------|
| Background | `var(--bg-secondary)` | `#FFFAEE` |
| Border | `var(--border-primary)` | `border-gray-200` |
| Text | `var(--fg-primary)` | `text-gray-900` |

**Root Cause Identified**: MetricCard uses hardcoded colors instead of CSS variables.

---

## Phase 3: Hypothesis & Testing

### Hypothesis
> If I replace hardcoded colors with CSS variables, the component will respond to theme changes.

### Minimal Test

Change ONE thing first:

```tsx
// Test: Just the background
- className="bg-[#FFFAEE]"
+ className="bg-[var(--bg-secondary)]"
```

**Test Result**: Background now switches with theme ✓

### Expand Fix

```tsx
// Apply pattern to all colors
- className="bg-[#FFFAEE] border-gray-200 text-gray-900"
+ className="bg-[var(--bg-secondary)] border-[var(--border-primary)]/40 text-[var(--fg-primary)]"
```

**Test Result**: Full component now responds to theme ✓

---

## Phase 4: Implementation

### Step 1: Write Failing Test

```tsx
// components/dashboard/__tests__/MetricCard.test.tsx

describe('MetricCard', () => {
  it('uses CSS variables for theming', () => {
    const { container } = render(<MetricCard title="Test" value={100} />);
    const card = container.firstChild as HTMLElement;

    // Should use CSS variables, not hardcoded colors
    expect(card.className).toContain('var(--bg-secondary)');
    expect(card.className).not.toMatch(/#[0-9A-Fa-f]{6}/);
  });
});
```

```bash
$ npm test MetricCard.test.tsx

FAIL  components/dashboard/__tests__/MetricCard.test.tsx
  MetricCard
    ✕ uses CSS variables for theming (15ms)

Expected: className to contain "var(--bg-secondary)"
Received: "bg-[#FFFAEE] border-gray-200..."
```

### Step 2: Implement Fix

```tsx
// components/dashboard/MetricCard.tsx

export function MetricCard({ title, value, trend }: MetricCardProps) {
  return (
    <div
      className={cn(
        // BOS Card Pattern - uses CSS variables
        "bg-[var(--bg-secondary)]/30",
        "border border-[var(--border-primary)]/40",
        "rounded-xl p-6",
        "hover:bg-[var(--bg-secondary)]/60",
        "transition-colors duration-150"
      )}
    >
      <h3 className="text-sm font-medium text-[var(--fg-secondary)]">
        {title}
      </h3>
      <p className="text-2xl font-bold text-[var(--fg-primary)]">
        {value.toLocaleString()}
      </p>
      {trend && (
        <span className={cn(
          "text-sm",
          trend > 0 ? "text-[var(--fg-brand-primary)]" : "text-[var(--fg-tertiary)]"
        )}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
  );
}
```

### Step 3: Verify Fix

```bash
$ npm test MetricCard.test.tsx

PASS  components/dashboard/__tests__/MetricCard.test.tsx
  MetricCard
    ✓ uses CSS variables for theming (12ms)

$ npm run build
✓ Compiled successfully

# Manual verification
1. Toggle dark mode → MetricCard now switches ✓
2. Refresh in dark mode → MetricCard stays dark ✓
3. Toggle back to light → MetricCard goes light ✓
```

---

## Debug Log

```markdown
## Debug Session: MetricCard Dark Mode

### Symptom
MetricCard component doesn't respond to dark mode toggle.
Other components work correctly.

### Reproduction Steps
1. Load dashboard
2. Toggle dark mode
3. Expected: All cards go dark
4. Actual: MetricCard stays light

### Root Cause Investigation
- Error: None (visual bug)
- Recent changes: Refactor extracted component from grid
- Data flow: CSS variables → Tailwind → Component (BROKEN)

### Hypotheses Tested
| # | Hypothesis | Test | Result |
|---|------------|------|--------|
| 1 | CSS variable not defined | Checked theme.css | FAIL - defined correctly |
| 2 | Hardcoded colors in component | grep for hex codes | PASS - found #FFFAEE |

### Root Cause
During refactor (commit a1b2c3d), hardcoded colors were introduced
instead of CSS variables when extracting MetricCard.

### Fix
Replace all hardcoded colors with CSS variables:
- #FFFAEE → var(--bg-secondary)
- border-gray-200 → var(--border-primary)/40
- text-gray-900 → var(--fg-primary)

### Verification
- [x] Test passes
- [x] Build succeeds
- [x] Manual theme toggle works
- [x] No hardcoded colors in component
```

---

## Key Lessons

1. **Refactors are dangerous** - Easy to lose CSS variable patterns when moving code
2. **Hardcoded colors break theming** - Always grep for hex codes in new components
3. **Visual bugs need visual verification** - Can't just run tests, must see the UI
4. **Check the diff** - Recent changes often reveal the culprit
