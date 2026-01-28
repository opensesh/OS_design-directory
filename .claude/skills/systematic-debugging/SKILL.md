# Systematic Debugging

> This skill activates when encountering bugs, errors, unexpected behavior, or when phrases like "not working", "broken", "fix", "debug", or "investigate" appear. Also activates after 2+ failed fix attempts.

---

## The Iron Law

**NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST**

Proposing solutions before completing Phase 1 violates this process. Every fix attempt without understanding the root cause is a guess—and guesses compound complexity.

---

## The Four Phases

### Phase 1: Root Cause Investigation

**Never skip this phase.** Before any fix attempt:

1. **Read the error message thoroughly**
   - Full stack trace, not just the first line
   - Note file paths, line numbers, variable values
   - For BOS: Check if error relates to CSS variables, React Aria, or design tokens

2. **Reproduce consistently**
   - Document exact steps to trigger
   - Identify if it's deterministic or intermittent
   - For BOS UI bugs: Test in both light and dark themes

3. **Check recent changes**
   - `git diff HEAD~5` for recent modifications
   - Did we change design tokens, component props, or CSS?
   - Look for pattern: "It worked before X was changed"

4. **Trace data flow**
   - Follow the data from source to error
   - For BOS: CSS variable chain → Tailwind config → Component usage
   - For API: Request → Route → Service → Database → Response

5. **Gather diagnostic evidence**
   ```bash
   # For CSS/styling issues
   getComputedStyle(element).getPropertyValue('--bg-primary')

   # For state issues
   console.log('State:', JSON.stringify(state, null, 2))

   # For API issues
   curl -v endpoint | jq
   ```

### Phase 2: Pattern Analysis

1. **Find working examples**
   - What similar code works correctly?
   - For BOS: Check existing components using same tokens

2. **Study reference implementations**
   - Read the WHOLE working example, not just the relevant line
   - For React Aria: Check their docs for correct usage patterns

3. **Identify differences**
   - What's different between working and broken?
   - For BOS: Compare token usage, prop shapes, class patterns

4. **Map dependencies**
   - What does this code depend on?
   - For BOS: theme.css → tailwind.config → component → usage

### Phase 3: Hypothesis & Testing

1. **Form ONE clear hypothesis**
   ```
   ❌ "It might be the CSS or maybe the state or the API"
   ✅ "The --bg-secondary variable is undefined in this scope"
   ```

2. **Test minimally**
   - Change ONE thing at a time
   - Verify each change before moving on
   - For BOS: Test in isolation before full integration

3. **Record results**
   ```markdown
   Hypothesis: CSS variable not inheriting in portal
   Test: Added explicit variable to portal container
   Result: FAILED - variable still undefined
   Learning: Portal escapes CSS variable scope
   ```

### Phase 4: Implementation

1. **Write a failing test first**
   - Captures the bug so it can't regress
   - For BOS: Include design token verification

2. **Implement focused fix**
   - Single responsibility: fix THIS bug
   - Don't refactor "while you're in there"
   - For BOS: Maintain design system compliance

3. **Verify comprehensively**
   - Original bug test passes
   - No regression in related tests
   - Design system compliance maintained

---

## BOS-Specific Debugging Checklist

### CSS Variable Issues
```bash
# Check if variable is defined
grep -r "--bg-primary" app/theme.css tailwind.config.ts

# Check variable inheritance
# (Variables may not inherit into portals, iframes, shadow DOM)

# Verify Tailwind is processing correctly
npm run build -- --verbose | grep "var(--"
```

### React Aria Issues
```tsx
// Common issue: Missing Provider
// Fix: Wrap in <Provider> from react-aria-components

// Common issue: Focus management
// Check: Is focusScope configured correctly?

// Common issue: Keyboard handling
// Verify: Are all ARIA attributes present?
```

### Theme/Dark Mode Issues
```tsx
// Check: Is component reading from correct theme context?
// Check: Are CSS variables defined for both themes?
// Check: Is theme transition causing flash?
```

### Hydration Mismatches
```tsx
// Common in BOS: Dynamic content causing SSR/CSR mismatch
// Fix: Use useEffect for browser-only values
// Fix: Add suppressHydrationWarning where appropriate
```

---

## Escalation Trigger

**If 3+ fix attempts fail: STOP**

This pattern indicates:
- The bug is a symptom, not the root cause
- Architecture may need redesign
- Assumptions about the system are wrong

**Required action:**
1. Document all failed attempts
2. List current hypotheses (all disproven)
3. Step back and question the architecture
4. Ask: "What would have to be true for this bug to exist?"

---

## Red Flags (Abandon Process Warning)

Stop if you catch yourself:
- Trying random changes hoping one works
- Adding code without understanding why
- Skipping straight to "solutions"
- Saying "let me just try..." without a hypothesis
- Making the same type of fix repeatedly
- Adding workarounds instead of understanding

---

## Debug Log Template

```markdown
## Debug Session: [Issue Title]

### Symptom
[Exact error message and behavior]

### Reproduction Steps
1. [Step 1]
2. [Step 2]
3. [Expected vs Actual]

### Root Cause Investigation
- Error analysis: [findings]
- Recent changes: [relevant commits]
- Data flow trace: [source → error]

### Hypotheses Tested
| # | Hypothesis | Test | Result |
|---|------------|------|--------|
| 1 | [Theory] | [What I did] | PASS/FAIL |

### Root Cause
[Final determination]

### Fix
[What was changed and why]

### Verification
- [ ] Original bug test passes
- [ ] No regressions
- [ ] Design system compliant
- [ ] Builds successfully
```

---

## Integration with Existing Plugins

### With feature-dev
- Bugs found in Build phase trigger systematic debugging
- Complete debugging before returning to Build

### With code-review
- Review findings may reveal bugs requiring investigation
- Document root cause analysis in review responses

### With hookify
- Create hooks to catch common bug patterns
- Warn on patterns known to cause issues

---

## Defense in Depth for BOS

When debugging, verify at multiple layers:

1. **CSS Layer**: Variables defined, values correct
2. **Tailwind Layer**: Config processing correctly
3. **Component Layer**: Props passed, classes applied
4. **React Layer**: State updates, re-renders occurring
5. **Browser Layer**: Computed styles match expectations

```tsx
// Multi-layer verification example
console.log({
  cssVar: getComputedStyle(document.documentElement).getPropertyValue('--bg-primary'),
  computed: window.getComputedStyle(element).backgroundColor,
  className: element.className,
  props: component.props,
});
```

---

## Supporting Files

### Examples
- **[CSS Variable Debugging](css-variable-debugging.md)** — Complete walkthrough debugging dark mode/theming issues
- **[React Aria Debugging](react-aria-debugging.md)** — Debugging accessibility and interaction bugs with React Aria components

### References
- **[Common BOS Issues](common-bos-issues.md)** — Quick reference for frequently encountered issues with CSS variables, React Aria, layout, animations, TypeScript, and Supabase

---

*Adapted from obra/superpowers with BOS brand integration*
