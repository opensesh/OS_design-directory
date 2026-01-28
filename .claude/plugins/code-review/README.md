# Code Review Plugin

> Automated PR review with BOS design system awareness and confidence-based filtering.

## What It Does

This plugin automates pull request review by running multiple agents in parallel. Each agent checks from a different angle, then uses confidence scoring to filter out false positives.

For BOS-3.0 projects, it also checks **design system compliance** — making sure we're using tokens, not hardcoded colors.

## Quick Start

```bash
/code-review              # Review current PR (output to terminal)
/code-review --comment    # Review and post as PR comment
```

## How It Works

1. **Pre-check** — Skip closed, draft, or already-reviewed PRs
2. **Gather guidelines** — Find CLAUDE.md and BOS design system files
3. **Summarize** — Quick overview of what changed
4. **Parallel review** — 4 independent agents check the PR:
   - **Agents 1 & 2**: CLAUDE.md and design system compliance
   - **Agent 3**: Bug detection in changes
   - **Agent 4**: Git history context analysis
5. **Score each issue** — Confidence from 0-100
6. **Filter** — Only keep issues with 80+ confidence
7. **Output** — Terminal or PR comment

## BOS Design System Checks

For BOS-3.0 projects, we check:

| Pattern | Correct | Incorrect |
|---------|---------|-----------|
| Colors | `var(--fg-primary)` | `#000000` |
| Backgrounds | `var(--bg-secondary)` | `#ffffff` |
| Brand accent | `var(--brand-primary)` | `#FE5102` (hardcoded) |
| Borders | `border-[var(--border-primary)]/40` | `border-black` |
| Focus states | React Aria components | Custom focus handlers |
| Themes | Semantic tokens | Media query hacks |

## Confidence Scoring

Each issue gets a confidence score:

| Score | Meaning |
|-------|---------|
| 0-25 | Probably not real — filtered out |
| 25-50 | Maybe real — filtered out |
| 50-75 | Likely real — filtered out |
| **75-100** | Confident — kept and reported |

Default threshold is **80**. We'd rather miss an edge case than cry wolf.

## What Gets Filtered Out

We don't flag:
- Pre-existing issues (not from this PR)
- Code that looks wrong but isn't
- Pedantic nitpicks
- Things a linter will catch
- General quality unless in CLAUDE.md
- Issues with lint-ignore comments

## Example Output

```markdown
## Code review

Found 2 issues:

1. **Hardcoded color instead of token** (BOS design system)
   Using `#191919` directly — should use `var(--charcoal)` or `var(--fg-primary)`

   https://github.com/owner/repo/blob/abc123.../components/Card.tsx#L45-L48

2. **Missing focus state** (Accessibility)
   Custom button without React Aria — missing keyboard accessibility

   https://github.com/owner/repo/blob/abc123.../components/Button.tsx#L12-L18
```

## When to Use

**Use for:**
- Any PR with meaningful changes
- PRs touching UI components
- PRs from multiple contributors
- When design system compliance matters

**Skip for:**
- Draft PRs (automatically skipped)
- Trivial automated PRs (automatically skipped)
- Urgent hotfixes

## Requirements

- Git repository with GitHub remote
- GitHub CLI (`gh`) installed and authenticated
- CLAUDE.md files (recommended for better compliance checking)

## Best Practices

1. **Keep CLAUDE.md clear** — Specific guidelines = better reviews
2. **Include PR context** — Helps agents understand intent
3. **Trust the 80+ threshold** — High-confidence issues are usually real
4. **Iterate on guidelines** — Update CLAUDE.md based on recurring patterns

## Learn More

- [BOS Design System Reference](BOS-DESIGN-SYSTEM.md)
- See `commands/code-review.md` for full technical details

---

*Adapted for BOS-3.0 design system awareness*
