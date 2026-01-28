# Commit Commands Plugin

> Streamline your git workflow — commit, push, and PR in simple commands.

## What It Does

This plugin reduces the friction of git operations. Instead of running multiple commands, use one slash command to handle the entire workflow.

## Commands

### `/commit`

Creates a commit with an auto-generated message that matches your repo's style.

```bash
/commit
```

**What happens:**
1. Analyzes your changes (staged and unstaged)
2. Reads recent commit messages to match your style
3. Stages relevant files
4. Creates the commit

**Features:**
- Matches your existing commit message style
- Avoids committing sensitive files (.env, credentials)
- Includes Claude Code attribution

---

### `/commit-push-pr`

Complete workflow — commit, push, and create a PR in one step.

```bash
/commit-push-pr
```

**What happens:**
1. Creates a branch (if on main)
2. Commits your changes
3. Pushes to remote
4. Creates a PR with summary and test plan
5. Returns the PR URL

**PR format:**
```markdown
## Summary
- What changed (1-3 bullet points)

## Test plan
- [ ] How to verify it works

🤖 Generated with Claude Code
```

---

### `/clean_gone`

Removes stale local branches that were deleted from remote.

```bash
/clean_gone
```

Use this after merging PRs to keep your branch list clean.

## Designer-Friendly Workflow

For working on BOS-3.0 components:

```bash
# 1. Build your component
# ... make changes to BrandAssetCard.tsx ...

# 2. Quick commit
/commit

# 3. Continue working
# ... add tests, fix styling ...

# 4. Another commit
/commit

# 5. Ready for review? One command does it all
/commit-push-pr
```

## Tips for BOS Projects

When committing design system changes:
- The plugin respects `.gitignore` (won't commit node_modules, etc.)
- Commit messages follow conventional commits format
- PRs include clear summaries for design review

## Requirements

- Git installed and configured
- GitHub CLI (`gh`) for PRs: `brew install gh`
- Repository with a GitHub remote

## Troubleshooting

**Empty commit?**
- Check `git status` — you need actual changes

**PR creation fails?**
- Run `gh auth login` to authenticate GitHub CLI

**Branch cleanup not working?**
- Run `git fetch --prune` first to sync with remote

## Learn More

- [BOS Design System Reference](BOS-DESIGN-SYSTEM.md)

---

*Streamlined for efficient BOS-3.0 development*
