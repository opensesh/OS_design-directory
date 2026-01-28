# BOS Commands

> User-triggered slash commands for specific operations.

---

## What Are Commands?

Commands are:
- **User-triggered** via `/command-name` syntax
- **Single-purpose** — do one thing well
- **Explicit** — require user to initiate
- **Predictable** — same input produces same behavior

---

## Commands Inventory

| Command | What It Does | How to Use |
|---------|--------------|------------|
| [code-review](./code-review/) | PR review with BOS design system checks | `/code-review`, `/code-review --comment` |
| [commit-commands](./commit-commands/) | Streamlined git operations | `/commit`, `/commit-push-pr` |
| [feature-dev (command)](./feature-dev%20(command)/) | Manual feature development workflow | `/feature-dev` |
| [ralph-wiggum](./ralph-wiggum/) | Iterative AI loops for complex tasks | `/ralph-loop` |

---

## How Commands Differ from Agents

| Aspect | Commands | Agents |
|--------|----------|--------|
| **Trigger** | User types `/command` | Auto-activates on context |
| **Autonomy** | Follows explicit instructions | Makes decisions independently |
| **Scope** | Single operations | Multi-step workflows |
| **Control** | User stays in control | AI drives the process |

---

## Command Structure

```
command-name/
├── .claude-plugin/
│   └── plugin.json      # Command metadata
├── commands/
│   └── command.md       # Command definition
└── README.md            # Documentation
```

---

## Using Commands

Type the command in Claude Code:

```
/commit              # Quick commit
/code-review         # Review current changes
/ralph-loop          # Start iterative loop
```

---

## Naming Convention

When the same concept exists as both a command and an agent, use parentheses to distinguish:
- `feature-dev (command)` — User-triggered command
- `feature-dev (agent)` — Autonomous workflow

---

*Part of the BOS CONFIG system*
