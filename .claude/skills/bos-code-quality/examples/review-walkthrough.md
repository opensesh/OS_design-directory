# BOS Code Quality Review Walkthrough

> Step-by-step example of conducting a code quality review using BOS standards.

---

## The Pull Request

**Title**: feat(dashboard): add FilterPanel component
**Files Changed**: 4 files, +187 lines

```
components/dashboard/FilterPanel.tsx      | +142
components/dashboard/FilterChip.tsx       |  +28
components/dashboard/__tests__/...        |  +12
components/dashboard/index.ts             |   +5
```

---

## Step 1: Initial Scan

Read through the changes to understand what was built.

```tsx
// FilterPanel.tsx (excerpt)
export function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Filters</h3>
      <div className="flex flex-wrap gap-2">
        {filters.map(filter => (
          <FilterChip
            key={filter.id}
            label={filter.label}
            active={filter.active}
            onClick={() => onFilterChange(filter.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

**Immediate Red Flags Spotted**:
- `bg-white` - hardcoded color
- `border-gray-200` - hardcoded color
- `text-gray-900` - hardcoded color

---

## Step 2: Design System Compliance Check

### Color Usage Audit

```bash
$ grep -E "bg-white|bg-black|bg-gray|text-gray|border-gray" components/dashboard/Filter*.tsx

FilterPanel.tsx:  <div className="bg-white rounded-lg p-4 border border-gray-200">
FilterPanel.tsx:  <h3 className="text-lg font-semibold text-gray-900 mb-3">
FilterChip.tsx:   className="bg-gray-100 text-gray-700 hover:bg-gray-200"
FilterChip.tsx:   className="bg-blue-500 text-white hover:bg-blue-600"  // active state
```

**Findings**:
| Issue | File | Line | Current | Should Be |
|-------|------|------|---------|-----------|
| Hardcoded bg | FilterPanel.tsx | 5 | `bg-white` | `bg-[var(--bg-secondary)]/30` |
| Hardcoded border | FilterPanel.tsx | 5 | `border-gray-200` | `border-[var(--border-primary)]/40` |
| Hardcoded text | FilterPanel.tsx | 6 | `text-gray-900` | `text-[var(--fg-primary)]` |
| Hardcoded bg | FilterChip.tsx | 8 | `bg-gray-100` | `bg-[var(--bg-tertiary)]` |
| Hardcoded text | FilterChip.tsx | 8 | `text-gray-700` | `text-[var(--fg-secondary)]` |
| Wrong brand color | FilterChip.tsx | 12 | `bg-blue-500` | `bg-[var(--bg-brand-solid)]` |

**Severity**: Critical - Breaks dark mode and brand consistency.

---

### Border Pattern Check

```tsx
// Current
className="border border-gray-200"

// Expected BOS pattern
className="border border-[var(--border-primary)]/40 hover:border-[var(--border-primary)]"
```

**Finding**: Missing opacity pattern and hover state.

---

### Brand Color Usage Check

```tsx
// FilterChip.tsx (active state)
className="bg-blue-500 text-white hover:bg-blue-600"
```

**Finding**: Using `blue-500` instead of brand color (Aperol).

**Correct Pattern**:
```tsx
className="bg-[var(--bg-brand-solid)] text-white hover:bg-[var(--bg-brand-solid)]/90"
```

---

## Step 3: Component Quality Check

### React Aria Compliance

```tsx
// Current: Native button
<button
  onClick={() => onFilterChange(filter.id)}
  className={...}
>
  {filter.label}
</button>

// Expected: React Aria Button
import { Button } from 'react-aria-components';

<Button
  onPress={() => onFilterChange(filter.id)}
  className={...}
>
  {filter.label}
</Button>
```

**Finding**: Using native `<button>` instead of React Aria `<Button>`.

**Why This Matters**:
- React Aria handles focus management
- Proper keyboard interaction
- Announcement for screen readers
- Consistent behavior across browsers

**Severity**: Important - Accessibility gap.

---

### Focus State Check

```tsx
// Current: No focus styles
className="bg-gray-100 text-gray-700 hover:bg-gray-200"

// Expected: Focus ring
className={cn(
  "...",
  "focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)]"
)}
```

**Finding**: No visible focus state.

**Severity**: Important - Keyboard users can't see focus.

---

## Step 4: TypeScript Quality Check

```tsx
// Current
interface FilterPanelProps {
  filters: any[];  // ❌ Using any
  onFilterChange: Function;  // ❌ Loose type
}

// Expected
interface Filter {
  id: string;
  label: string;
  active: boolean;
}

interface FilterPanelProps {
  filters: Filter[];
  onFilterChange: (filterId: string) => void;
}
```

**Findings**:
- Using `any[]` for filters
- Using `Function` instead of typed callback

**Severity**: Important - Loses type safety benefits.

---

## Step 5: Test Coverage Check

```tsx
// Current test
describe('FilterPanel', () => {
  it('renders', () => {
    render(<FilterPanel filters={[]} onFilterChange={() => {}} />);
    expect(screen.getByRole('region')).toBeInTheDocument();
  });
});
```

**Findings**:
- Only one test
- Doesn't test filter display
- Doesn't test click handling
- Doesn't test accessibility

**Expected Tests**:
```tsx
describe('FilterPanel', () => {
  it('renders filter chips', () => {...});
  it('calls onFilterChange when chip clicked', () => {...});
  it('shows active state for active filters', () => {...});
  it('supports keyboard navigation', () => {...});
  it('uses BOS styling tokens', () => {...});
});
```

**Severity**: Important - Insufficient test coverage.

---

## Step 6: Write Review Summary

```markdown
## BOS Code Quality Review: FilterPanel

### Summary
New filter panel component with significant design system violations
that will break dark mode and accessibility.

### Critical Issues (2)

**1. Hardcoded colors throughout**
- Location: FilterPanel.tsx:5-6, FilterChip.tsx:8,12
- Impact: Breaks dark mode, brand consistency
- Fix: Replace with CSS variables

| Current | Replace With |
|---------|--------------|
| `bg-white` | `bg-[var(--bg-secondary)]/30` |
| `border-gray-200` | `border-[var(--border-primary)]/40` |
| `text-gray-900` | `text-[var(--fg-primary)]` |
| `bg-gray-100` | `bg-[var(--bg-tertiary)]` |
| `bg-blue-500` | `bg-[var(--bg-brand-solid)]` |

**2. Using generic blue instead of brand color**
- Location: FilterChip.tsx:12
- Impact: Inconsistent with brand identity
- Fix: Use `--bg-brand-solid` (Aperol)

### Important Issues (3)

**1. Not using React Aria for interactive elements**
- Location: FilterChip.tsx
- Impact: Reduced accessibility, inconsistent keyboard handling
- Fix: Import and use `Button` from react-aria-components

**2. Missing focus states**
- Location: FilterChip.tsx
- Impact: Keyboard users can't see focus
- Fix: Add `focus:ring-2 focus:ring-[var(--border-primary)]`

**3. Weak TypeScript types**
- Location: FilterPanel.tsx interfaces
- Impact: Lost type safety
- Fix: Define proper `Filter` interface, typed callback

### Minor Issues (1)

**1. Insufficient test coverage**
- Location: __tests__/FilterPanel.test.tsx
- Recommendation: Add tests for filter interaction and BOS compliance

### Corrected Code Example

```tsx
// FilterChip.tsx (corrected)
import { Button } from 'react-aria-components';
import { cn } from '@/lib/utils';

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

export function FilterChip({ label, active, onPress }: FilterChipProps) {
  return (
    <Button
      onPress={onPress}
      className={cn(
        "px-3 py-1.5 rounded-full text-sm font-medium",
        "transition-colors duration-150",
        "focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)]",
        active
          ? "bg-[var(--bg-brand-solid)] text-white"
          : cn(
              "bg-[var(--bg-tertiary)]",
              "text-[var(--fg-secondary)]",
              "hover:bg-[var(--bg-secondary)]",
              "hover:text-[var(--fg-primary)]"
            )
      )}
    >
      {label}
    </Button>
  );
}
```

### Verdict
❌ **CHANGES REQUESTED**

Please address Critical and Important issues before merge.
Re-review required after fixes.
```

---

## Step 7: Post-Fix Verification

After developer applies fixes, verify:

```bash
# Check no hardcoded colors remain
$ grep -rE "#[0-9A-Fa-f]{6}|bg-white|bg-black|bg-gray|text-gray" components/dashboard/Filter*.tsx
(no output - clean)

# Check React Aria imported
$ grep "from 'react-aria-components'" components/dashboard/Filter*.tsx
FilterChip.tsx: import { Button } from 'react-aria-components';

# Run tests
$ npm test components/dashboard/Filter
PASS (8 tests)

# Build
$ npm run build
✓ Compiled successfully
```

**Re-Review Verdict**: ✅ **APPROVED**

---

## Quick Checklist for Reviews

```markdown
## BOS Quality Checklist

### Colors
- [ ] No hardcoded hex colors
- [ ] No bg-white, bg-black, text-gray-*, border-gray-*
- [ ] CSS variables used (--bg-*, --fg-*, --border-*)
- [ ] Brand color only for CTAs/active states

### Borders
- [ ] Default: border-[var(--border-primary)]/40
- [ ] Hover: border-[var(--border-primary)]
- [ ] NO brand color for borders

### Components
- [ ] React Aria for interactive elements
- [ ] Focus states visible
- [ ] Keyboard accessible
- [ ] ARIA labels present

### TypeScript
- [ ] No `any` types
- [ ] Props interfaces defined
- [ ] Callbacks properly typed

### Tests
- [ ] Behavior tested
- [ ] Edge cases covered
- [ ] BOS compliance verified
```
