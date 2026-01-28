# Subagent Prompt Templates

> Ready-to-use templates for dispatching implementer, spec reviewer, and quality reviewer subagents.

---

## Implementer Prompt Template

Copy and customize for each task:

```markdown
## Task: [TASK NAME]

### Context
[Brief context about the feature/component being built]
[Reference to implementation plan if available]

### Requirements
1. [Specific requirement 1]
2. [Specific requirement 2]
3. [Specific requirement 3]

### BOS Design System Requirements
- Use semantic CSS variables (var(--bg-primary), var(--fg-secondary), etc.)
- Follow border pattern: border-[var(--border-primary)]/40
- Use React Aria Components for all interactive elements
- Warm neutrals only (no #000, #FFF, bg-white, bg-black)
- Brand color (Aperol/--bg-brand-solid) for CTAs and active states ONLY

### File Locations
- Component: `[exact/path/to/Component.tsx]`
- Test: `[exact/path/to/__tests__/Component.test.tsx]`
- Types: `[co-located or path/to/types.ts]`

### Code Pattern Reference
[Include relevant BOS pattern from component-patterns.md]

```tsx
// Example pattern for this task
[code snippet]
```

### Pre-Implementation
Before starting work, please clarify:
- [Any unclear requirements]
- [Any assumptions to validate]
- [Any dependencies to confirm]

### Work Instructions
1. Implement exactly as specified
2. Write tests first (TDD approach)
3. Verify implementation works (run tests)
4. Commit with conventional format: `[type](scope): description`
5. Run self-review checklist

### Self-Review Checklist
- [ ] Fully implemented all spec requirements
- [ ] Tests verify actual behavior (not mocks)
- [ ] BOS design tokens used throughout
- [ ] No hardcoded colors (grep verified)
- [ ] React Aria for interactive elements
- [ ] Accessibility verified (focus, keyboard, aria-labels)
- [ ] TypeScript types complete (no any)
- [ ] Code follows existing patterns in codebase

### Report Format
Please provide your report in this format:

\`\`\`markdown
## Implementation Report

### Questions Raised
- [Any questions you had before/during implementation]

### Completed
- [What was built]
- [Key implementation decisions]

### Tests
- [Test results summary]
- [Any tests that were challenging]

### Files Modified
- [List of files]

### BOS Compliance
- CSS variables: [Yes/No, any exceptions]
- React Aria: [Yes/No, components used]
- Accessibility: [Verified/Needs review]
- Hardcoded colors: [None/Found X]

### Concerns
- [Any issues, uncertainties, or tech debt introduced]

### Commit
- [Commit message used]
\`\`\`
```

---

## Spec Compliance Reviewer Template

```markdown
## Spec Compliance Review

### Task Being Reviewed
[Task name and brief description]

### Original Requirements
1. [Requirement 1 from implementer prompt]
2. [Requirement 2]
3. [Requirement 3]

### Implementer's Report
[Paste implementer's report here]

---

## IMPORTANT: Review Approach

**NEVER trust the implementer's report alone.**

The implementer may have:
- Misunderstood requirements
- Skipped steps "to save time"
- Made optimistic claims
- Introduced unintended changes

**Your job is to independently verify by inspecting actual code.**

---

### Verification Checklist

For each requirement, verify in the actual code:

**Requirement 1: [requirement]**
- [ ] Verified in code at [file:line]
- Finding: [PASS/FAIL - what you found]

**Requirement 2: [requirement]**
- [ ] Verified in code at [file:line]
- Finding: [PASS/FAIL - what you found]

**Requirement 3: [requirement]**
- [ ] Verified in code at [file:line]
- Finding: [PASS/FAIL - what you found]

### BOS Compliance Check
- [ ] CSS variables used (grep for hardcoded colors)
- [ ] React Aria for interactive elements
- [ ] Border opacity pattern followed (if applicable)
- [ ] Brand color used appropriately (if applicable)

### Extra/Unneeded Features Check
- [ ] No unrequested features added
- [ ] No over-engineering
- [ ] No scope creep

### Misunderstanding Check
- [ ] Requirement 1 implemented as intended
- [ ] Requirement 2 implemented as intended
- [ ] Requirement 3 implemented as intended

---

### Verdict

Choose ONE:

**✅ SPEC COMPLIANT**
All requirements verified in code. Proceed to code quality review.

**OR**

**❌ ISSUES FOUND**
| Issue | Severity | Location | Description |
|-------|----------|----------|-------------|
| Missing | Critical | - | [Requirement not implemented] |
| Extra | Important | file:line | [Unrequested feature added] |
| Wrong | Critical | file:line | [Misunderstood requirement] |

**Required Actions:**
1. [What needs to be fixed]
2. [What needs to be removed]
3. [What needs to be corrected]
```

---

## Code Quality Reviewer Template

```markdown
## Code Quality Review

### Prerequisites
- [ ] Spec compliance review PASSED (required before this review)

### Changes to Review
- Base SHA: [commit hash before task]
- Head SHA: [current commit hash]
- Files changed: [list of files]

### Implementer's Report
[Paste relevant parts]

---

## BOS-Specific Quality Checks

### Design System Compliance

**Color Usage**
- [ ] All colors use CSS variables
- [ ] No hardcoded hex values (#XXXXXX)
- [ ] No forbidden classes (bg-white, bg-black, etc.)
- Verification: `grep -rE "#[0-9A-Fa-f]{6}" [files] | grep -v "var(--"`

**Border Pattern**
- [ ] Default borders use /40 opacity
- [ ] Hover increases to full opacity
- [ ] Focus uses ring pattern, not border color
- [ ] Brand color NEVER used for borders

**Brand Color Usage**
- [ ] Aperol (--bg-brand-solid) only for:
  - Primary CTA buttons
  - Active/selected states
  - Badges/indicators
- [ ] NOT used for:
  - Borders
  - Backgrounds (except buttons)
  - Decorative elements

### Component Quality

**React Aria**
- [ ] All interactive elements use React Aria
- [ ] Proper component choice (Button, Select, etc.)
- [ ] No raw <button>, <input>, <select>

**Accessibility**
- [ ] Focus states visible and styled
- [ ] aria-label on icon-only buttons
- [ ] aria-hidden on decorative elements
- [ ] Keyboard navigation works
- [ ] Color contrast meets AA minimum

**TypeScript**
- [ ] Interfaces defined for all props
- [ ] No `any` types without justification
- [ ] Types exported for reuse
- [ ] Proper generic usage where appropriate

### Code Standards

**Testing**
- [ ] Tests cover actual behavior
- [ ] Not mocking implementation details
- [ ] Edge cases considered
- [ ] Assertions meaningful

**Organization**
- [ ] File in correct location
- [ ] Exports from index file
- [ ] No circular dependencies
- [ ] Consistent with codebase patterns

**Cleanliness**
- [ ] No console.log statements
- [ ] No TODO comments (or tracked)
- [ ] No commented-out code
- [ ] No debug code

---

### Issue Categories

**Critical** (Must fix before merge)
- Security vulnerabilities
- Data loss potential
- Broken functionality
- Accessibility blockers

**Important** (Should fix before merge)
- Design system violations
- Missing tests for key paths
- TypeScript gaps
- A11y issues

**Minor** (Note for future)
- Style preferences
- Minor optimizations
- Documentation gaps

---

### Findings

**Strengths**
- [What was done well]

**Critical Issues**
| Issue | Location | Description | Fix |
|-------|----------|-------------|-----|
| [none or issue] | | | |

**Important Issues**
| Issue | Location | Description | Fix |
|-------|----------|-------------|-----|
| [none or issue] | | | |

**Minor Issues**
| Issue | Location | Description | Fix |
|-------|----------|-------------|-----|
| [none or issue] | | | |

---

### Verdict

Choose ONE:

**✅ APPROVED**
Code meets quality standards. Ready to merge.

**OR**

**⚠️ APPROVED WITH NOTES**
Approved, but please address minor issues in follow-up.

**OR**

**❌ CHANGES REQUESTED**
[Critical/Important issues must be fixed]

**Required Actions:**
1. [Fix required]
2. [Fix required]

Re-review required after fixes.
```

---

## Quick Reference: When to Use Each

| Subagent | Purpose | When to Dispatch |
|----------|---------|------------------|
| **Implementer** | Build the feature | For each task in plan |
| **Spec Reviewer** | Verify requirements met | After implementer completes |
| **Quality Reviewer** | Verify code quality | After spec review passes |

**Order is critical**: Spec → Quality, never skip or reverse.
