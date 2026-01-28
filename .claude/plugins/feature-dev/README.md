# Feature Development Plugin

> Build features systematically — from understanding to implementation to review.

## The 7-Phase Workflow

This plugin guides you through feature development the way designers think:

| Phase | Goal | Like in Design |
|-------|------|----------------|
| 1. Discovery | Understand the brief | Creative brief |
| 2. Research | Explore existing patterns | Reference gathering |
| 3. Define | Clarify requirements | Stakeholder Q&A |
| 4. Design | Choose an approach | Concept development |
| 5. Build | Implement | Production |
| 6. Review | Check quality | QA & critique |
| 7. Document | Summarize the work | Handoff |

## Usage

```bash
/feature-dev Add a brand asset card component
```

Or just:
```bash
/feature-dev
```

The workflow will guide you through each phase, asking questions and waiting for approval at key moments.

## What Makes It Designer-Friendly

- **Speaks your language** — References design thinking concepts you know
- **Shows the "why"** — Explains trade-offs in plain terms
- **Waits for approval** — You decide the direction at each step
- **Checks BOS conventions** — Automatically verifies design token usage, accessibility, border philosophy

## BOS Integration

For BOS-3.0 projects, the plugin automatically checks:

- **Design tokens** — Uses CSS variables, not hardcoded colors
- **Accessibility** — Focus states, contrast ratios, screen readers
- **Border philosophy** — Subtle 40% opacity, never harsh
- **Warm neutrals** — Charcoal/Vanilla instead of black/white

## When to Use

**Use for:**
- New components or features
- Multi-file changes
- Anything needing design decisions

**Skip for:**
- Quick fixes
- Single-line changes
- "Just change this color" requests

## Learn More

- [BOS Design System Reference](BOS-DESIGN-SYSTEM.md)
- See `commands/feature-dev.md` for full workflow details

---

*Adapted for BOS-3.0 design system and designer-friendly workflow*
