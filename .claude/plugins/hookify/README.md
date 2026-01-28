# Hookify Plugin

> Create custom rules to prevent unwanted behaviors — no coding required.

## What It Does

Hookify lets you create guardrails that:
- **Warn** you about risky actions
- **Block** operations you never want
- **Enforce** patterns you always want

Perfect for maintaining design system consistency or preventing common mistakes.

## Quick Start

```bash
/hookify Warn me when hardcoding colors instead of using CSS variables
```

This creates a rule that triggers whenever hardcoded hex colors appear in code.

**No restart needed** — rules work immediately.

## BOS Design System Rules

Here are useful rules for maintaining BOS-3.0 consistency:

### Block Hardcoded Colors

```markdown
---
name: enforce-design-tokens
enabled: true
event: file
pattern: #[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}
action: warn
---

🎨 **Hardcoded color detected**

Use CSS variables instead:
- `var(--fg-primary)` not `#191919`
- `var(--bg-secondary)` not `#FFFAEE`
- `var(--brand-primary)` not `#FE5102`

See [BOS Design System](../BOS-DESIGN-SYSTEM.md) for the full token list.
```

### Warn About Pure Black/White

```markdown
---
name: warm-neutrals-only
enabled: true
event: file
pattern: (#000000|#ffffff|black|white)
action: warn
---

🌡️ **Pure black/white detected**

BOS uses warm neutrals:
- Charcoal (#191919) instead of black
- Vanilla (#FFFAEE) instead of white

This creates a more inviting, approachable feel.
```

### Require React Aria for Interactive Elements

```markdown
---
name: require-react-aria
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: \.(tsx|jsx)$
  - field: new_text
    operator: regex_match
    pattern: <button|<input|<select
action: warn
---

♿ **Native HTML element detected**

For accessibility, use React Aria components:
- `<Button>` from react-aria-components
- `<TextField>` from react-aria-components
- `<Select>` from react-aria-components

These include keyboard navigation and screen reader support.
```

## Commands

| Command | What It Does |
|---------|--------------|
| `/hookify [instruction]` | Create a rule from your description |
| `/hookify` | Analyze conversation for patterns to prevent |
| `/hookify:list` | See all active rules |
| `/hookify:configure` | Enable/disable rules interactively |
| `/hookify:help` | Get help |

## Actions

- **`warn`** — Shows message but allows the action (default)
- **`block`** — Prevents the action entirely

## Event Types

| Event | Triggers On |
|-------|-------------|
| `bash` | Terminal commands |
| `file` | File edits (Edit, Write) |
| `stop` | When Claude wants to stop |
| `prompt` | When you submit a prompt |
| `all` | Everything |

## Pattern Syntax

Uses Python regex:

| Pattern | Matches |
|---------|---------|
| `#[0-9a-fA-F]{6}` | Hex colors like `#FE5102` |
| `\.env$` | Files ending in `.env` |
| `border-black` | Literal string |
| `(eval\|exec)\(` | Either `eval(` or `exec(` |

## Managing Rules

**Enable/disable**: Edit the `.local.md` file in `.claude/`
```yaml
enabled: false  # Temporarily disable
```

**Delete**: Remove the file
```bash
rm .claude/hookify.my-rule.local.md
```

**View all**:
```bash
/hookify:list
```

## Designer-Friendly Tips

1. **Start with warnings** — Use `action: warn` until you're confident
2. **Be specific** — Narrow patterns catch fewer false positives
3. **Document why** — Your rule message should explain the reasoning
4. **Test incrementally** — Try the pattern before enabling

## Learn More

- [BOS Design System Reference](BOS-DESIGN-SYSTEM.md)

---

*Adapted for BOS-3.0 design system enforcement*
