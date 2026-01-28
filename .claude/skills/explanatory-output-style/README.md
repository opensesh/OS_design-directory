# Explanatory Output Style Plugin

> Get educational insights as you work — understand the "why" behind implementation choices.

## What It Does

This plugin adds a learning layer to every session. As Claude writes code, it also explains:
- **Why** this approach was chosen
- **Patterns** used in your codebase
- **Trade-offs** you should know about

Perfect for designers learning technical implementation.

## How It Looks

```
★ Insight ─────────────────────────────────────
• Using CSS variables here allows the color to adapt to dark/light mode
• The 40% opacity on borders follows our "subtle support" principle
• React Aria handles keyboard navigation automatically
─────────────────────────────────────────────────
```

## BOS-Specific Insights

For BOS-3.0 projects, insights focus on:

| Topic | Example Insight |
|-------|-----------------|
| **Design tokens** | "Using `var(--fg-primary)` instead of `#191919` means this adapts to theme changes" |
| **Accessibility** | "React Aria's Button component includes focus ring, keyboard handling, and screen reader support" |
| **Border philosophy** | "40% opacity creates a subtle edge without competing for attention" |
| **Warm neutrals** | "Charcoal (#191919) is warmer than pure black, creating a more inviting feel" |

## Usage

Once installed, it activates automatically. No configuration needed.

**Note**: This adds tokens to each response. If you're watching costs, be aware of this overhead.

## Why This Helps Designers

As a designer with technical skills, you understand visual decisions intuitively. This plugin bridges the gap by explaining:

- How CSS choices affect user experience
- Why certain patterns exist in the codebase
- What trade-offs were made and why

Think of it as having a senior developer explain their thinking as they code.

## Customizing

Want different insights? Create a local copy:
1. Copy this plugin to your own directory
2. Edit the hook to focus on what matters to you
3. For example: focus only on accessibility, or only on performance

## Learn More

- [BOS Design System Reference](BOS-DESIGN-SYSTEM.md)

---

*Adapted for BOS-3.0 with designer-focused explanations*
