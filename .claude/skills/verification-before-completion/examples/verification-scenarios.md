# Verification Scenarios

> Real-world examples of correct vs incorrect verification patterns.

---

## Scenario 1: Component Implementation Complete

### The Situation
You just implemented a new `Tooltip` component using React Aria and BOS styling.

### ❌ WRONG Approach
```
Me: "I've implemented the Tooltip component with React Aria and BOS styling.
     It should work correctly now. Moving on to the next task."
```

**Problems:**
- "Should work" = assumption, not evidence
- No test execution
- No visual verification
- No design system check

### ✅ CORRECT Approach
```
Me: "I've implemented the Tooltip component. Let me verify it works."

[Runs: npm test components/ui/Tooltip.test.tsx]

Output:
  PASS  components/ui/__tests__/Tooltip.test.tsx
    Tooltip
      ✓ renders trigger element (12ms)
      ✓ shows tooltip on hover (45ms)
      ✓ hides tooltip on blur (23ms)
      ✓ applies BOS styling (8ms)
      ✓ supports keyboard navigation (34ms)

  5 passed, 0 failed

[Runs: grep for hardcoded colors]
$ grep -rE "#[0-9A-Fa-f]{6}" components/ui/Tooltip.tsx
(no output - clean)

[Runs: npm run build]
✓ Compiled successfully in 12.3s

Me: "Verified:
     - All 5 tests pass
     - No hardcoded colors found
     - Build succeeds
     Component implementation complete."
```

---

## Scenario 2: Bug Fix Verification

### The Situation
The dark mode toggle wasn't persisting across page refreshes. You added localStorage persistence.

### ❌ WRONG Approach
```
Me: "Fixed the dark mode persistence bug by adding localStorage.
     The theme should now persist. Bug fixed!"
```

**Problems:**
- Didn't test the original failing case
- Didn't verify across page refresh
- "Should persist" = hope, not evidence

### ✅ CORRECT Approach
```
Me: "Let me verify the bug fix works."

[Manual test sequence:]
1. Open app in browser (light mode default)
2. Toggle to dark mode
3. Verify localStorage: localStorage.getItem('theme') → "dark" ✓
4. Refresh page (Cmd+R)
5. Check theme is still dark ✓
6. Check no flash of light mode during load ✓

[Runs: npm test hooks/useTheme.test.tsx]

Output:
  PASS  hooks/__tests__/useTheme.test.tsx
    useTheme
      ✓ defaults to system preference (15ms)
      ✓ persists theme to localStorage (12ms)
      ✓ restores theme from localStorage on mount (18ms)
      ✓ syncs across tabs via storage event (45ms)

  4 passed, 0 failed

Me: "Verified:
     - Original bug case (toggle + refresh) now works
     - localStorage correctly stores 'dark'
     - Theme persists across refresh
     - No flash of wrong theme
     - All 4 tests pass
     Bug fix complete."
```

---

## Scenario 3: Design System Compliance Check

### The Situation
You've updated several components and need to verify BOS compliance before PR.

### ❌ WRONG Approach
```
Me: "I used CSS variables throughout and followed the BOS patterns.
     Ready for code review!"
```

**Problems:**
- Self-reported compliance, not verified
- Didn't actually check the files
- Trust without evidence

### ✅ CORRECT Approach
```
Me: "Let me verify design system compliance across the changes."

[Runs: Check for hardcoded colors]
$ grep -rE "#[0-9A-Fa-f]{3,6}" components/dashboard/*.tsx | grep -v "var(--"
(no output - clean)

[Runs: Check for forbidden patterns]
$ grep -rE "bg-white|bg-black|text-white|text-black" components/dashboard/*.tsx
components/dashboard/MetricCard.tsx:42:  className="bg-white rounded-lg"

❌ Found violation!

[Fixes the violation]
- className="bg-white rounded-lg"
+ className="bg-[var(--bg-secondary)] rounded-xl"

[Re-runs check]
$ grep -rE "bg-white|bg-black" components/dashboard/*.tsx
(no output - clean)

[Runs: Check React Aria usage]
$ grep -rE "import.*from 'react-aria" components/dashboard/*.tsx
components/dashboard/FilterButton.tsx: import { Button } from 'react-aria-components';
components/dashboard/SortSelect.tsx: import { Select, SelectValue } from 'react-aria-components';

[Runs: npm run build]
✓ Compiled successfully

Me: "Verified:
     - Found and fixed 1 hardcoded 'bg-white' violation
     - No forbidden color patterns remaining
     - React Aria used for interactive elements
     - Build succeeds
     Design system compliance verified."
```

---

## Scenario 4: Subagent Work Verification

### The Situation
A subagent reports completing a task. They claim tests pass and the feature works.

### ❌ WRONG Approach
```
Subagent: "Task complete. Implemented the search feature. Tests pass."

Me: "Great, marking task as complete and moving on."
```

**Problems:**
- Trusted subagent report without verification
- Didn't run tests independently
- Didn't inspect the actual code

### ✅ CORRECT Approach
```
Subagent: "Task complete. Implemented the search feature. Tests pass."

Me: "Thanks! Let me verify independently."

[Runs: npm test features/search]

Output:
  PASS  features/search/__tests__/SearchBar.test.tsx
    SearchBar
      ✓ renders input field (8ms)
      ✓ calls onSearch on enter (23ms)
      ✓ debounces input (156ms)
      ✓ shows loading state (12ms)

  4 passed, 0 failed

[Inspects: git diff to see actual changes]
$ git diff HEAD~1 --stat
 features/search/SearchBar.tsx    | 78 ++++++++++++++++++
 features/search/useSearch.ts     | 45 +++++++++++
 features/search/__tests__/...    | 92 +++++++++++++++++++++

[Reads: SearchBar.tsx]
- Confirms React Aria Input is used
- Confirms CSS variables for styling
- Confirms debounce logic matches spec

[Runs: npm run build]
✓ Compiled successfully

Me: "Independently verified:
     - 4 tests pass (ran myself)
     - Code uses React Aria and BOS tokens
     - Debounce implemented as specified
     - Build succeeds
     Task verified complete."
```

---

## Scenario 5: PR Ready Verification

### The Situation
You're about to create a PR for a new feature branch.

### ❌ WRONG Approach
```
Me: "Feature is done, tests pass, creating PR now."
[Creates PR without running anything]
```

### ✅ CORRECT Approach
```
Me: "Let me run the full verification suite before creating the PR."

[Runs: Full test suite]
$ npm test
...
Test Suites: 47 passed, 47 total
Tests:       312 passed, 312 total
Time:        34.2s

[Runs: Lint check]
$ npm run lint
✓ No ESLint warnings or errors

[Runs: Type check]
$ npx tsc --noEmit
✓ No TypeScript errors

[Runs: Build]
$ npm run build
✓ Compiled successfully in 45.2s

[Runs: Design system check]
$ grep -rE "#[0-9A-Fa-f]{6}" --include="*.tsx" | grep -v "var(--" | wc -l
0

[Reviews: git diff main...HEAD]
- All changes intentional
- No debug code left in
- No TODO comments remaining

Me: "Full verification complete:
     - 312 tests pass
     - 0 lint errors
     - 0 type errors
     - Build succeeds (45.2s)
     - 0 hardcoded colors
     - Diff reviewed, all changes intentional
     Ready for PR."

[Creates PR with verification evidence in description]
```

---

## Quick Reference: Verification Commands

| Claim | Verification Command |
|-------|---------------------|
| Tests pass | `npm test` or `npm test <path>` |
| Lint clean | `npm run lint` |
| Types clean | `npx tsc --noEmit` |
| Build succeeds | `npm run build` |
| No hardcoded colors | `grep -rE "#[0-9A-Fa-f]{6}" --include="*.tsx" \| grep -v "var(--"` |
| No forbidden patterns | `grep -rE "bg-white\|bg-black" --include="*.tsx"` |
| React Aria used | `grep -rE "from 'react-aria" --include="*.tsx"` |

---

## The Verification Mantra

Before ANY completion claim, ask yourself:

1. **What command proves my claim?**
2. **Did I run it just now (not earlier)?**
3. **Did I read the FULL output?**
4. **Does the output ACTUALLY confirm my claim?**

If you can't answer YES to all four, you haven't verified.
