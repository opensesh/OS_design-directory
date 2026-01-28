# Verification Before Completion

> This skill activates before ANY claim of completion, success, or task finish. Triggers on phrases like "done", "complete", "finished", "working", "fixed", "ready for review".

---

## The Iron Law

**NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE**

Bypassing verification is not efficiency—it's misrepresentation. Trust depends on accuracy. Every claim must be backed by concrete evidence gathered in THIS session.

---

## The Gate Function

Before asserting ANY positive status, execute this sequence:

```
1. IDENTIFY  → What command/check proves the claim?
2. RUN       → Execute it completely and freshly
3. READ      → Examine FULL output, not just success messages
4. VERIFY    → Does output actually confirm the claim?
5. CLAIM     → Only then make assertion with evidence
```

**Skipping ANY step = unverified claim = potential misrepresentation**

---

## Claim Types & Required Evidence

| Claim | Required Evidence |
|-------|-------------------|
| "Tests pass" | Fresh test output showing zero failures |
| "Lint clean" | Linter output with zero errors/warnings |
| "Build succeeds" | Build output + exit code 0 |
| "Bug fixed" | Original failing case now passes |
| "Feature complete" | Line-by-line requirement verification |
| "PR ready" | All checks pass + diff review |

---

## BOS-Specific Verification Checkpoints

For UI/frontend work, add these verification steps:

### Design System Compliance Check
```bash
# Search for hardcoded colors (should return empty)
grep -r "#[0-9A-Fa-f]\{6\}" --include="*.tsx" --include="*.css" | grep -v "var(--"

# Search for forbidden patterns
grep -r "border-white\|border-black\|bg-white\|bg-black" --include="*.tsx"
```

### Semantic Token Usage
```bash
# Verify CSS variable usage in new files
grep -r "var(--bg-\|var(--fg-\|var(--border-" components/
```

### React Aria Compliance
```tsx
// For interactive elements, verify React Aria usage
import { Button } from 'react-aria-components';  // ✅ Correct
import { button } from './button';               // ❌ Check if React Aria based
```

### Brand Color Audit
```
Aperol (#FE5102) should ONLY appear in:
- Primary CTA buttons
- Active/selected states
- Badge highlights
- Link hover states

NEVER in: borders, backgrounds, decorative elements
```

---

## Red Flags (Stop Immediately If...)

You catch yourself:
- Saying "should work" without running it
- Claiming "probably fine" without checking
- Expressing satisfaction before verification
- Trusting previous output instead of re-running
- Assuming a subagent completed correctly without inspecting

---

## Verification Patterns

### Pattern A: Test Verification
```
❌ WRONG:
"I wrote the tests. The component should work now."

✅ CORRECT:
"Let me run the tests to verify."
[Runs: npm test components/FeatureName.test.tsx]
[Output shows: PASS 3/3 tests]
"Tests pass. The component is verified working."
```

### Pattern B: Build Verification
```
❌ WRONG:
"I fixed the type error. Build should succeed."

✅ CORRECT:
"Let me verify the build succeeds."
[Runs: npm run build]
[Output shows: ✓ Compiled successfully]
"Build verified. Exit code 0, no errors."
```

### Pattern C: Design System Verification
```
❌ WRONG:
"I used the BOS design tokens throughout."

✅ CORRECT:
"Let me verify design system compliance."
[Runs: grep for hardcoded colors - none found]
[Runs: grep for CSS variables - confirms usage]
[Inspects: component uses var(--bg-secondary), var(--fg-primary)]
"Design system compliance verified. All colors use semantic tokens."
```

### Pattern D: Regression Verification
```
❌ WRONG:
"Fixed the bug. Moving on."

✅ CORRECT:
"Let me verify the original issue is resolved."
[Reproduces original failing case]
[Confirms it now passes]
[Runs full test suite for regressions]
"Bug fix verified. Original case passes, no regressions."
```

---

## Integration with Existing Plugins

### With feature-dev
- Verification required before transitioning from Build to Review phase
- Each phase gate requires evidence of phase completion

### With code-review
- Before requesting review: all tests must pass (verified)
- Before approving: all issues must be fixed (verified)

### With hookify
- Verification can be automated via hooks
- Create warn/block hooks for common verification failures

---

## When to Apply

**ALWAYS before:**
- Claiming any task is "done" or "complete"
- Expressing satisfaction with work
- Moving to the next task
- Committing code
- Creating pull requests
- Reporting progress to user
- Delegating to subagents and accepting their results

---

## Subagent Verification

When accepting work from subagents:

1. **Never trust the report alone** - subagents may have incomplete context
2. **Run verification yourself** - fresh test runs, build checks
3. **Inspect the actual code** - compare against requirements
4. **Check design system compliance** - subagents may not know BOS patterns

```
❌ "The subagent reports tests pass. Task complete."
✅ "The subagent reports tests pass. Let me verify."
   [Runs tests independently]
   [Confirms output matches claim]
   "Independently verified. Task complete."
```

---

## Evidence Documentation

When completing work, document evidence:

```markdown
## Verification Evidence

### Tests
- Command: `npm test`
- Result: 47 tests, 0 failures
- Time: 12.3s

### Build
- Command: `npm run build`
- Result: Exit code 0
- Warnings: 0

### Design System
- Hardcoded colors: 0 found
- CSS variable usage: Confirmed in all new files
- React Aria: Used for Button, Input, Select
```

---

## Supporting Files

### Examples
- **[Verification Scenarios](verification-scenarios.md)** — Real-world examples showing correct vs incorrect verification patterns for component implementation, bug fixes, design system compliance, subagent work, and PR readiness

---

*Adapted from obra/superpowers with BOS brand integration*
