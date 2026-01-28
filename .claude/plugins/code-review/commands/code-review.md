---
allowed-tools: Bash(gh issue view:*), Bash(gh search:*), Bash(gh issue list:*), Bash(gh pr comment:*), Bash(gh pr diff:*), Bash(gh pr view:*), Bash(gh pr list:*), mcp__github_inline_comment__create_inline_comment
description: Code review a pull request with BOS design system awareness
---

Provide a code review for the given pull request.

> For BOS-3.0 projects, this review includes **design system compliance** checking alongside bug detection.

**Agent assumptions:**
- All tools are functional. Do not test tools or make exploratory calls.
- Only call a tool if required. Every tool call should have a clear purpose.

---

## Step 1: Pre-check

Launch a sonnet agent to check if any of the following are true:
- The pull request is closed
- The pull request is a draft
- The pull request doesn't need code review (automated PR, trivial change)
- Claude has already commented on this PR

If any condition is true, stop.

---

## Step 2: Find Guidelines

Launch a sonnet agent to return a list of file paths for all relevant guideline files:
- Root CLAUDE.md file, if it exists
- Any CLAUDE.md files in directories containing modified files
- **For BOS projects**: Check for `BOS-DESIGN-SYSTEM.md` and `theme.css` references

---

## Step 3: Summarize Changes

Launch a sonnet agent to view the pull request and return a summary of the changes.

---

## Step 4: Parallel Review

Launch 4 agents in parallel to independently review. Each agent returns issues with descriptions and reasons.

### Agents 1 + 2: Guidelines Compliance (Sonnet)
Audit changes for CLAUDE.md compliance. Only consider CLAUDE.md files that share a path with the file.

**For BOS projects, also check:**
- Design token usage (CSS variables vs hardcoded colors)
- Border philosophy (40% opacity default, not harsh)
- Accessibility patterns (React Aria, focus states)
- Warm neutrals (Charcoal/Vanilla vs pure black/white)

### Agent 3: Bug Detection (Opus)
Scan for obvious bugs in the diff. Focus only on the diff itself. Flag significant bugs; ignore nitpicks.

### Agent 4: Logic Issues (Opus)
Look for security issues, incorrect logic in changed code only.

**We only want HIGH SIGNAL issues:**
- Code will fail to compile/parse (syntax, type errors, missing imports)
- Code will definitely produce wrong results (clear logic errors)
- Clear guideline violations you can quote exactly
- **For BOS**: Hardcoded colors that should use tokens, missing accessibility patterns

**Do NOT flag:**
- Code style or quality concerns
- Potential issues depending on specific inputs
- Subjective suggestions

If not certain, don't flag it. False positives erode trust.

---

## Step 5: Validation

For each issue from agents 3 and 4, launch parallel subagents to validate:
- Opus agents for bugs/logic issues
- Sonnet agents for guideline/design system violations

Each validator confirms the issue is real with high confidence.

---

## Step 6: Filter

Remove any issues that weren't validated. This gives us our high-signal issue list.

---

## Step 7: Post Results

**If no issues found** (and `--comment` flag provided):
```
gh pr comment
```

Post: "No issues found. Checked for bugs, CLAUDE.md compliance, and BOS design system patterns."

**If issues found**:
Post inline comments using `mcp__github_inline_comment__create_inline_comment`:
- Brief description of the issue
- For small fixes: include a committable suggestion block
- For larger fixes: describe issue and suggested fix without code block

**Post ONE comment per unique issue. No duplicates.**

---

## False Positives to Avoid

Do NOT flag:
- Pre-existing issues
- Apparent bugs that are actually correct
- Pedantic nitpicks a senior engineer wouldn't flag
- Issues a linter will catch
- General code quality unless required in CLAUDE.md
- Issues explicitly silenced in code (lint ignore comments)

---

## Notes

- Use `gh` CLI to interact with GitHub. Do not use web fetch.
- Create a todo list before starting.
- Cite and link each issue in comments.
- Link format: `https://github.com/owner/repo/blob/FULL_SHA/path/file.ext#L10-L15`
  - Full git SHA required
  - Line range: `L[start]-L[end]`
  - Include 1 line of context before and after

---

## BOS Design System Checklist

When reviewing BOS-3.0 code, specifically check:

| Pattern | Correct | Incorrect |
|---------|---------|-----------|
| Colors | `var(--fg-primary)` | `#000000` |
| Backgrounds | `var(--bg-secondary)` | `#ffffff` |
| Brand accent | `var(--brand-primary)` | `#FE5102` (hardcoded) |
| Borders | `border-[var(--border-primary)]/40` | `border-black` |
| Focus states | Uses React Aria | Custom focus handling |
| Dark/Light | Semantic tokens | Media query hacks |

---

*Adapted for BOS-3.0 design system awareness*
