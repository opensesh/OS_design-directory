# BOS Skills Collection

> Skills adapted from [obra/superpowers](https://github.com/obra/superpowers) and customized for the Brand Operating System (BOS) workflow.

---

## Overview

These skills provide systematic workflows for development with deep BOS design system integration. Each skill:
- Auto-activates based on context (not manual commands)
- Enforces design system compliance at every checkpoint
- Integrates with existing BOS plugins (feature-dev, code-review, hookify)
- Uses "steward, not advisor" brand voice throughout

---

## Skills Inventory

### Development Workflow Skills
| Skill | Purpose | Triggers |
|-------|---------|----------|
| [writing-plans](claude%20config/Skills/writing-plans/SKILL.md) | Create detailed implementation roadmaps | "plan", "design", "architect", complex multi-file work |
| [verification-before-completion](claude%20config/Skills/verification-before-completion/SKILL.md) | Evidence-based completion claims | "done", "complete", "finished", "fixed", any completion claim |
| [systematic-debugging](claude%20config/Skills/systematic-debugging/SKILL.md) | Root cause investigation before fixes | "not working", "broken", "fix", "debug", 2+ failed fixes |
| [subagent-driven-development](claude%20config/Skills/subagent-driven-development/SKILL.md) | Parallel execution with reviews | "implement the plan", "execute tasks", 3+ independent tasks |
| [bos-code-quality](claude%20config/Skills/bos-code-quality/SKILL.md) | Design system quality gates | "check quality", "review code", after any UI work |

### Output & Behavior Skills
| Skill | Purpose | Triggers |
|-------|---------|----------|
| [explanatory-output-style](./explanatory-output-style/) | Get insights about implementation choices | Auto-activates during code explanation |
| [learning-output-style](./learning-output-style/) | Interactive learning — write the meaningful parts | Auto-activates during learning mode |
| [security-guidance](./security-guidance/) | Security warnings when editing code | Auto-activates on security-sensitive code |
| [frontend-design](./frontend-design/) | Create distinctive BOS-aligned interfaces | Auto-activates on frontend work |

### Supporting Files

Each skill includes examples and references for practical application:

| Skill | Examples | References |
|-------|----------|------------|
| writing-plans | Dashboard Widget Plan | Component Patterns |
| verification | Verification Scenarios | - |
| debugging | CSS Variable Debugging, React Aria Debugging | Common BOS Issues |
| subagent-dev | Feature Implementation | Prompt Templates |
| bos-code-quality | Review Walkthrough | Design Token Mapping |

---

## Workflow Integration

### Development Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    PLANNING PHASE                               │
│                                                                 │
│  writing-plans skill                                            │
│  ├── Create implementation roadmap                              │
│  ├── Specify BOS design tokens                                  │
│  └── Define task breakdown (2-5 min each)                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    EXECUTION PHASE                              │
│                                                                 │
│  subagent-driven-development skill                              │
│  ├── Dispatch implementers per task                             │
│  ├── Spec compliance review (did they build what was asked?)    │
│  └── Code quality review (is it well-built?)                    │
│                                                                 │
│  systematic-debugging skill (when issues arise)                 │
│  ├── Phase 1: Root cause investigation                          │
│  ├── Phase 2: Pattern analysis                                  │
│  ├── Phase 3: Hypothesis testing                                │
│  └── Phase 4: Focused implementation                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    VERIFICATION PHASE                           │
│                                                                 │
│  verification-before-completion skill                           │
│  ├── Run tests (fresh, not cached)                              │
│  ├── Verify build succeeds                                      │
│  └── Check design system compliance                             │
│                                                                 │
│  bos-code-quality skill                                         │
│  ├── CSS variable usage verified                                │
│  ├── React Aria compliance checked                              │
│  └── Brand color usage audited                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Plugin Integration Map

| Skill | feature-dev | code-review | hookify |
|-------|-------------|-------------|---------|
| writing-plans | Discovery/Define phases | Specifies what to review | - |
| verification | Build/Review gates | Pre-review verification | Automated checks |
| debugging | Build phase troubleshooting | Review findings investigation | - |
| subagent-dev | Build phase execution | Reviews per task | - |
| bos-code-quality | Review phase criteria | Quality dimension | Auto-enforcement |

---

## BOS Design System Integration

Every skill enforces these non-negotiable standards:

### Color System
```
Semantic Tokens (Always Use):
  --bg-primary, --bg-secondary, --bg-tertiary
  --fg-primary, --fg-secondary, --fg-tertiary
  --border-primary, --border-secondary

Brand Palette:
  Charcoal (#191919) — Warm dark
  Vanilla (#FFFAEE) — Warm light
  Aperol (#FE5102) — Accent (CTAs only)

Forbidden:
  #000, #FFF, bg-white, bg-black
  Brand color for borders
```

### Border Pattern
```css
/* Default: Nearly invisible */
border-[var(--border-primary)]/40

/* Hover: More visible */
hover:border-[var(--border-primary)]

/* Focus: Full visibility */
focus:border-[var(--border-primary)]
```

### Component Requirements
```
All interactive elements → React Aria Components
All focus states → Visible and styled
All text → Semantic tokens (no hardcoded colors)
All animations → Framer Motion / GSAP / Tailwind
```

---

## Quick Start

### Using a Skill

Skills auto-activate based on context. Examples:

```
You: "Let's plan the new dashboard feature"
→ writing-plans skill activates

You: "The button click handler isn't working"
→ systematic-debugging skill activates

You: "That looks done, let's move on"
→ verification-before-completion skill activates
```

### Manual Skill Reference

If you need to explicitly invoke skill behavior:

```
"Apply the writing-plans skill to create an implementation plan"
"Use systematic-debugging to investigate this issue"
"Run bos-code-quality checks on these changes"
```

---

## Skill Philosophy

These skills are adapted from obra/superpowers with these key principles:

1. **Evidence over claims** — Never trust reports; verify independently
2. **Root cause first** — No fixes without understanding why
3. **Fresh context** — New subagent per task prevents pollution
4. **Two-stage review** — Spec compliance, then code quality
5. **Design system is non-negotiable** — BOS standards always enforced

### Pressure Resistance

Skills include explicit language to resist shortcuts:
- "NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE"
- "NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST"
- "Skipping ANY step = unverified claim = misrepresentation"

---

## Attribution

Skills adapted from:
- **obra/superpowers** — [github.com/obra/superpowers](https://github.com/obra/superpowers)
- **BOS-3.0** — Brand Operating System design principles

Core patterns by Jesse Vincent (obra), adapted for BOS by Claude Code integration.

---

## Maintenance

To update skills:
1. Edit the relevant `SKILL.md` file
2. Test activation triggers
3. Verify plugin integrations still work
4. Update this README if triggers/purpose changes

---

*Last updated: 2026-01-12*
