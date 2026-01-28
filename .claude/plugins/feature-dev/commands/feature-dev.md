---
description: Guided feature development with design-first thinking and systematic architecture
argument-hint: Optional feature description
---

# Feature Development

> A systematic 7-phase workflow that helps you build features thoughtfully — from understanding to implementation to review.

You're helping build a new feature or component. Follow this approach: **understand first**, ask questions, design elegantly, then implement.

## For Designers

This workflow mirrors the design process you already know:
1. **Discovery** → Understand the brief
2. **Research** → Explore existing patterns
3. **Define** → Clarify requirements
4. **Design** → Choose an approach
5. **Build** → Implement with care
6. **Review** → Check quality
7. **Document** → Summarize the work

---

## Core Principles

- **Ask clarifying questions** — Don't assume. Ask specific, concrete questions and wait for answers before implementing.
- **Understand before acting** — Read and comprehend existing patterns first. For BOS projects, understand our design tokens and component patterns.
- **Simple and elegant** — Prioritize readable, maintainable code that follows our warm neutrals philosophy.
- **Use TodoWrite** — Track progress throughout so you can see where you are.

---

## Phase 1: Discovery

**Goal**: Understand what we're building

Initial request: $ARGUMENTS

**Actions**:
1. Create a todo list with all phases
2. If the feature is unclear, ask:
   - What problem are we solving? *Who is this for?*
   - What should this feature do? *What's the happy path?*
   - Any constraints? *Performance, accessibility, existing patterns to match?*
3. Summarize your understanding and confirm it's correct

**Designer tip**: Think of this like the creative brief. Get clear on the "why" before the "what."

---

## Phase 2: Codebase Exploration (Research)

**Goal**: Understand how similar things work in the codebase

**Actions**:
1. Launch 2-3 explorer agents to investigate:
   - Similar features or components
   - Overall architecture and patterns
   - UI patterns and styling approaches

   **Example prompts**:
   - "Find components similar to [feature] and trace how they're built"
   - "Map the design system patterns used in [area]"
   - "Analyze how [existing component] handles state and styling"

2. Read the key files the agents identify
3. Present a summary: *"Here's how we do things..."*

**For BOS projects**: Always check:
- `/Users/alexbouhdary/Documents/GitHub/BOS-3.0/app/theme.css` — Design tokens
- `/Users/alexbouhdary/Documents/GitHub/BOS-3.0/components/ui/` — Existing components
- `/Users/alexbouhdary/Documents/GitHub/BOS-3.0/.claude/CLAUDE.md` — Design guidelines

---

## Phase 3: Clarifying Questions

**Goal**: Fill in all the gaps before designing

**This is critical. Don't skip it.**

**Actions**:
1. Review what you learned and the original request
2. Identify what's not clear:
   - Edge cases and error states
   - How this connects to existing features
   - Design preferences (should it match existing patterns exactly?)
   - Accessibility requirements
   - Responsive behavior

3. **Present all questions in a clear list**
4. **Wait for answers before proceeding**

If you hear "whatever you think is best" — provide your recommendation and get explicit confirmation.

**Designer tip**: This is like the stakeholder Q&A. Better to ask now than redo later.

---

## Phase 4: Architecture Design

**Goal**: Explore different approaches and pick the best one

**Actions**:
1. Launch 2-3 architect agents with different focuses:
   - **Minimal changes** — Smallest possible change, reuse everything
   - **Clean architecture** — Best maintainability and structure
   - **Pragmatic balance** — Speed + quality middle ground

2. Review all approaches
3. Form your opinion on which fits best (consider: is this a quick fix or a major feature?)
4. Present options with trade-offs and your recommendation
5. **Ask which approach to use**

**Example output**:
```
I've explored 3 approaches:

Approach 1: Minimal
- Extend existing Card component with new props
- Add styling via Tailwind utilities
- Pros: Fast, low risk
- Cons: Card component gets more complex

Approach 2: Clean
- Create new dedicated component
- Use composition pattern
- Pros: Clear responsibility, reusable
- Cons: More files, more setup

Approach 3: Pragmatic
- Create thin wrapper around Card
- Add BOS-specific styling
- Pros: Best of both worlds
- Cons: Slight indirection

Recommendation: Approach 3 — gives you clean separation without
major refactoring, and follows our existing patterns.

Which approach would you like?
```

---

## Phase 5: Implementation

**Goal**: Build it

**Do not start without approval.**

**Actions**:
1. Wait for explicit "go ahead" or "let's do it"
2. Read relevant files identified earlier
3. Implement following the chosen approach
4. Follow BOS conventions:
   - Use CSS variables, not hardcoded colors
   - Apply 40% opacity borders by default
   - Use warm neutrals (Charcoal/Vanilla), not black/white
   - Build on React Aria for accessibility
5. Update todos as you progress

**Designer tip**: This is the build phase. Work methodically, component by component.

---

## Phase 6: Quality Review

**Goal**: Make sure it's solid

**Actions**:
1. Launch 3 reviewer agents:
   - **Simplicity & Elegance** — Is the code clean and readable?
   - **Bugs & Correctness** — Does it actually work?
   - **BOS Conventions** — Does it match our design system?

2. Consolidate findings and prioritize
3. **Present issues and ask what to do**:
   - Fix now
   - Fix later
   - Ship as-is

4. Address based on your decision

**For BOS projects**, reviewers check:
- Design token usage (CSS variables, not hardcoded)
- Accessibility (focus states, contrast, screen readers)
- Border philosophy (subtle, supportive, not harsh)
- Brand voice in any copy

---

## Phase 7: Summary

**Goal**: Document what we built

**Actions**:
1. Mark all todos complete
2. Summarize:
   - **What was built** — The feature/component
   - **Key decisions** — Why we went this direction
   - **Files changed** — What was touched
   - **Next steps** — What to do next

**Example**:
```
Feature Complete: Brand Asset Card

What was built:
- BrandAssetCard component with thumbnail, title, metadata
- Hover state with subtle elevation
- Loading skeleton state
- Responsive layout (2-col on mobile, 4-col on desktop)

Key decisions:
- Used pragmatic approach with existing Card as base
- Added BOS-specific styling via wrapper
- Used framer-motion for hover animation

Files modified:
- components/brand-hub/BrandAssetCard.tsx (new)
- components/brand-hub/BrandAssetCard.skeleton.tsx (new)
- components/brand-hub/index.ts (export added)

Next steps:
- Add unit tests
- Consider batch selection feature
- Update storybook
```

---

## When to Use This Workflow

**Use for**:
- New components or features
- Features touching multiple files
- Anything requiring design decisions
- Complex integrations

**Skip for**:
- Single-line fixes
- Trivial changes
- "Just change this color" type requests

---

*Adapted for BOS-3.0 design system and designer-friendly workflow*
