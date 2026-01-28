# BOS Agents

> Autonomous workflows that make decisions and execute multi-step tasks independently.

---

## What Are Agents?

Agents are AI-powered workflows that:
- **Auto-activate** based on context (not manually triggered)
- **Make decisions** about how to proceed
- **Dispatch subagents** to handle subtasks
- **Work autonomously** with minimal user intervention

---

## Agents Inventory

| Agent | Purpose | When It Activates |
|-------|---------|-------------------|
| [feature-dev (agent)](./feature-dev%20(agent)/) | 7-phase development workflow with architectural decisions | Complex feature requests, multi-file changes |

---

## How Agents Differ from Commands

| Aspect | Agents | Commands |
|--------|--------|----------|
| **Trigger** | Auto-activates on context | User types `/command` |
| **Autonomy** | Makes decisions independently | Follows explicit instructions |
| **Scope** | Multi-step workflows | Single operations |
| **Subagents** | Can dispatch other agents | Typically doesn't |

---

## Agent Structure

```
agent-name/
├── .claude-plugin/
│   └── plugin.json      # Agent metadata
├── agents/
│   ├── agent-1.md       # Subagent definitions
│   └── agent-2.md
└── README.md            # Documentation
```

---

## Naming Convention

When the same concept exists as both an agent and a command, use parentheses to distinguish:
- `feature-dev (agent)` — Autonomous workflow
- `feature-dev (command)` — User-triggered command

---

*Part of the BOS CONFIG system*
