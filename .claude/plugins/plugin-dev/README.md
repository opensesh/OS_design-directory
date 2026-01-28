# Plugin Development Toolkit

> Build your own Claude Code plugins with expert guidance — no deep technical knowledge required.

## What It Does

This toolkit guides you through creating Claude Code plugins with 7 specialized skills:

| Skill | What It Helps With |
|-------|-------------------|
| **Hook Development** | Automate actions on events (file saves, commands, etc.) |
| **MCP Integration** | Connect to external services and APIs |
| **Plugin Structure** | Organize your plugin files correctly |
| **Plugin Settings** | Store and read configuration |
| **Command Development** | Create slash commands |
| **Agent Development** | Build autonomous AI agents |
| **Skill Development** | Create contextual skills |

## Getting Started: `/plugin-dev:create-plugin`

The easiest way to build a plugin:

```bash
/plugin-dev:create-plugin A plugin to enforce BOS design system patterns
```

This launches an **8-phase workflow**:
1. **Discovery** — What's your plugin for?
2. **Planning** — Which components do you need?
3. **Design** — Detailed specifications
4. **Structure** — Directory setup
5. **Implementation** — Build each piece
6. **Validation** — Check everything works
7. **Testing** — Verify in Claude Code
8. **Documentation** — Finish the README

## BOS Plugin Ideas

Some useful plugins you could build for BOS-3.0:

### Design System Enforcer
Hook that warns when code violates design token usage:
- Detects hardcoded colors
- Checks border opacity patterns
- Validates accessibility patterns

### Brand Asset Helper
Skills and commands for working with brand assets:
- Quick access to color tokens
- Typography reference
- Component pattern lookup

### Accessibility Checker
Review agent that validates accessibility:
- React Aria usage
- Focus state presence
- Contrast ratio compliance

## How Skills Work

The toolkit uses **progressive disclosure**:

1. **Ask a question** → Relevant skill loads automatically
2. **Core knowledge** → ~1,500-2,000 words of essentials
3. **Deep dive** → Reference docs and examples when needed

**Example:**
```
You: "How do I create a hook that validates file writes?"

Claude: [Loads hook-development skill automatically]
        "Here's how to create a PreToolUse hook..."
```

## Designer-Friendly Approach

This toolkit explains concepts in plain terms:

| Technical Term | What It Means |
|---------------|---------------|
| **Hook** | Code that runs automatically when something happens |
| **MCP Server** | A way to connect Claude to external tools |
| **Manifest** | A config file that describes your plugin |
| **Frontmatter** | Settings at the top of a file (between `---` lines) |
| **Agent** | An AI helper that can work independently |

## Quick Examples

### Simple Slash Command
```markdown
---
description: Show BOS color tokens
---

Display the BOS color palette:
- Aperol (#FE5102) — Primary accent
- Charcoal (#191919) — Dark neutral
- Vanilla (#FFFAEE) — Light neutral
```

### Simple Hook (warn on hardcoded colors)
```json
{
  "hooks": [{
    "event": "PreToolUse",
    "tools": ["Edit", "Write"],
    "script": "check-design-tokens.sh"
  }]
}
```

## Total Resources

- **7 Skills** — ~11,000 words of core guidance
- **12+ Examples** — Working code you can copy
- **6 Utilities** — Scripts to validate your work

## Learn More

- [BOS Design System Reference](BOS-DESIGN-SYSTEM.md)
- Ask Claude: "How do I create a plugin for [your idea]?"

---

*Adapted for BOS-3.0 with designer-friendly explanations*
