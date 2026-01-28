# Learning Style Plugin

> Learn by doing — Claude guides you to write the meaningful parts yourself.

## What It Does

Instead of implementing everything automatically, Claude:
1. Sets up the context and structure
2. **Asks you to write 5-10 lines** of meaningful code
3. Explains the trade-offs involved
4. Provides educational insights along the way

## Why This Matters for Designers

You understand design decisions intuitively. This plugin helps you build the same intuition for code by having you make the implementation decisions that matter.

## What You'll Write

Claude asks you to implement:

| Type | Example |
|------|---------|
| **Design decisions** | "How should this component respond to hover?" |
| **Business logic** | "What happens when a user clicks this button?" |
| **Error handling** | "How should we handle a failed API call?" |
| **User experience** | "Should this animate in or appear instantly?" |

## What Claude Handles

Claude implements directly:
- Boilerplate and setup code
- Obvious implementations
- Configuration files
- Repetitive patterns

## Example Interaction

**Claude**: I've created the BrandAssetCard component structure. The hover interaction is a UX decision — should the card:

1. **Subtle lift** — Scale up slightly with shadow
2. **Border highlight** — Show the Aperol accent border
3. **Content reveal** — Show additional metadata on hover

In `components/brand-hub/BrandAssetCard.tsx`, implement the `handleHover` behavior.

**You**: *[Write your preferred approach]*

## Educational Insights

You also get insights as you work:

```
★ Insight ─────────────────────────────────────
• Framer Motion's `whileHover` handles the animation state cleanly
• Using `scale(1.02)` is subtle enough to feel intentional
• The shadow uses Charcoal (not black) for warmth
─────────────────────────────────────────────────
```

## BOS-Specific Guidance

For BOS projects, Claude guides you on:
- **Design token choices** — When to use which semantic token
- **Border philosophy** — How to implement subtle interactions
- **Animation decisions** — Framer Motion vs CSS transitions
- **Accessibility patterns** — React Aria integration points

## Usage

Once installed, activates automatically. No configuration needed.

**Note**: This adds interactivity and tokens to sessions. Great for learning, less efficient for quick tasks.

## Philosophy

Learning by doing beats watching. This plugin transforms "watch Claude code" into "build with Claude's guidance" — ensuring you develop practical skills through hands-on implementation of meaningful logic.

## Learn More

- [BOS Design System Reference](BOS-DESIGN-SYSTEM.md)

---

*Adapted for BOS-3.0 with designer-focused learning*
