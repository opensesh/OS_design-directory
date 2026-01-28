# Subagent-Driven Development

> This skill activates when executing implementation plans, handling multi-task work, or when parallel execution would be beneficial. Triggers on phrases like "implement the plan", "execute tasks", "dispatch agents", or when more than 3 independent tasks exist.

---

## Core Concept

Execute implementation plans by dispatching **independent subagents** for each task, with mandatory **two-stage reviews**: spec compliance first, then code quality.

**Fresh agent per task + BOS-aware reviews = high quality, fast iteration**

---

## When to Use

Apply this approach when you have:
- A completed implementation plan (see: writing-plans skill)
- Tasks that are mostly independent
- Intent to work in parallel within one session

**Decision Tree:**
```
Have an implementation plan?
├── No  → Use writing-plans skill first
└── Yes → Are tasks independent?
    ├── No  → Execute sequentially
    └── Yes → Use subagent-driven development ✓
```

---

## Process Flow

### 1. Preparation

Extract all tasks from plan into a tracking list:
```markdown
## Task List
- [ ] Task 1: Create component skeleton
- [ ] Task 2: Implement core logic
- [ ] Task 3: Add styling with BOS tokens
- [ ] Task 4: Write integration tests
```

### 2. Per-Task Cycle

For each task:

```
┌─────────────────────────────────────────────────────────────────┐
│  DISPATCH IMPLEMENTER                                           │
│  → Use implementer-prompt with full task context                │
│  → Include BOS design system requirements                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  ANSWER QUESTIONS                                               │
│  → Clarify requirements before work begins                      │
│  → Provide BOS pattern references if needed                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  SPEC COMPLIANCE REVIEW                                         │
│  → Did they build exactly what was requested?                   │
│  → Missing requirements? Extra features?                        │
│  → BOS tokens used correctly?                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  CODE QUALITY REVIEW                                            │
│  → Clean, tested, maintainable?                                 │
│  → React Aria patterns followed?                                │
│  → Design system compliance verified?                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  ITERATE IF ISSUES                                              │
│  → Fix flagged issues                                           │
│  → Re-review until approved                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
           Mark task complete, proceed to next
```

### 3. Completion

After all tasks:
1. Run final code review across all changes
2. Verify overall design system compliance
3. Use finishing-a-development-branch workflow

---

## Implementer Prompt Template

```markdown
## Task: [Task Name]

### Context
[Paste relevant plan section]

### Requirements
1. [Requirement 1]
2. [Requirement 2]

### BOS Design System Requirements
- Use semantic CSS variables (var(--bg-primary), etc.)
- Follow border pattern: border-[var(--border-primary)]/40
- Use React Aria Components for interactivity
- Warm neutrals only (no pure black/white)
- Brand color (Aperol) for CTAs only

### Pre-Implementation
Before starting:
- Clarify any uncertainties about requirements
- Ask about unclear design patterns
- Confirm understanding of BOS tokens needed

### Work Instructions
1. Implement exactly as specified
2. Write tests first (TDD)
3. Verify implementation works
4. Commit with conventional format
5. Self-review against checklist

### Self-Review Checklist
- [ ] Fully implemented spec requirements
- [ ] Tests verify actual behavior (not mocks)
- [ ] BOS design tokens used throughout
- [ ] No hardcoded colors
- [ ] React Aria for interactive elements
- [ ] Accessibility verified (focus, keyboard)

### Report Format
\`\`\`markdown
## Implementation Report

### Completed
- [What was built]

### Tests
- [Test results summary]

### Files Modified
- [List of files]

### BOS Compliance
- CSS variables: [Yes/No]
- React Aria: [Yes/No]
- Accessibility: [Verified/Needs review]

### Concerns
- [Any issues or uncertainties]
\`\`\`
```

---

## Spec Compliance Review Template

```markdown
## Spec Compliance Review

### Task Reference
[Link to task in plan]

### Implementer Report
[Paste their report]

### Review Approach
NEVER trust the report alone. Inspect actual code.

### Verification Checklist
- [ ] All requirements from spec implemented
- [ ] No extra/unrequested features added
- [ ] No misunderstandings of requirements
- [ ] BOS design tokens used (verify in code)
- [ ] File paths match spec

### Code Inspection
[For each requirement, verify in actual code]

### Verdict
- ✅ **SPEC COMPLIANT** - All requirements verified in code
- ❌ **ISSUES FOUND** - [List specific missing/extra items with file:line refs]
```

---

## Code Quality Review Template

```markdown
## Code Quality Review

**Prerequisite:** Spec compliance review must pass first

### Changes to Review
- Base SHA: [commit before task]
- Head SHA: [current commit]

### BOS-Specific Quality Checks

#### Design System Compliance
- [ ] Uses semantic CSS variables
- [ ] Border opacity pattern (40% default)
- [ ] Warm neutrals (no #000 or #FFF)
- [ ] Brand color only for CTAs/active states

#### Component Quality
- [ ] React Aria Components for interactivity
- [ ] Proper focus management
- [ ] Keyboard navigation works
- [ ] ARIA attributes present

#### Code Standards
- [ ] TypeScript types defined
- [ ] Props interface documented
- [ ] No any types without justification
- [ ] Tests cover behavior, not implementation

### Issue Categories
- **Critical**: Blocks merge (security, data loss, broken functionality)
- **Important**: Should fix before merge (design system violations, a11y issues)
- **Minor**: Nice to fix (style preferences, minor optimizations)

### Verdict
[Strengths, categorized issues, overall assessment]
```

---

## Critical Rules

1. **Never skip reviews** - Every task gets spec then quality review
2. **Spec before quality** - Code quality review only after spec compliance passes
3. **Fix before proceeding** - Don't start next task with open issues
4. **Answer questions completely** - Incomplete answers lead to incorrect implementations
5. **Keep implementer for fixes** - Don't manually fix; let the subagent iterate
6. **Verify BOS compliance** - Design system is non-negotiable

---

## Parallel Dispatch

For truly independent tasks, dispatch multiple implementers:

```
Tasks 1-3: Independent (no shared state/files)
→ Dispatch 3 implementers in parallel
→ Review each when complete
→ Merge all when approved

Tasks 4-5: Dependent on Tasks 1-3
→ Wait for 1-3 to complete
→ Then dispatch 4-5 sequentially or parallel
```

---

## Integration with Existing Plugins

### With writing-plans
- Plans provide the task list for subagent dispatch
- Plan quality determines implementation quality

### With feature-dev
- Subagent work happens in Build phase
- Reviews align with Review phase

### With code-review
- Quality review uses code-review methodology
- Final review before PR uses full code-review skill

### With verification-before-completion
- Every review requires verification evidence
- Subagent claims must be independently verified

---

## Anti-Patterns

- Skipping spec review "because we trust the implementer"
- Running quality review before spec compliance
- Manually fixing issues instead of having subagent iterate
- Accepting "it works" without test verification
- Allowing hardcoded colors "just this once"
- Proceeding with incomplete answers to subagent questions

---

## Supporting Files

### Examples
- **[Feature Implementation](feature-implementation.md)** — Complete walkthrough of implementing a NotificationBell component using subagent-driven development with all review stages

### References
- **[Prompt Templates](prompt-templates.md)** — Ready-to-use templates for Implementer, Spec Compliance Reviewer, and Code Quality Reviewer subagents

---

*Adapted from obra/superpowers with BOS brand integration*
