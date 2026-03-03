# Contributing

We'd love your help making the Design Directory better.

## Quick Contributions

- **Add a resource** — Edit `src/data/resources.json` and open a PR
- **Fix a typo** — Edit directly on GitHub
- **Report a bug** — [Open an issue](../../issues/new?template=bug_report.md)
- **Request a feature** — [Open an issue](../../issues/new?template=feature_request.md)

## Development Setup

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/OS_design-directory.git
cd OS_design-directory

# Install and run
bun install
bun dev
```

The dev server runs at `http://localhost:3001/`.

## Making Changes

1. Create a branch: `git checkout -b your-feature`
2. Make your changes
3. Run `bun run build` to verify nothing breaks
4. Commit with a descriptive message
5. Push and open a PR

## Code Style

- TypeScript strict mode
- Tailwind CSS for styling
- CSS variables from `src/styles/theme.css` for all colors
- Framer Motion with presets from `src/lib/motion-tokens.ts` for animations

## Adding Resources

See the [README](README.md#customizing-resources) for the resource schema and the full [customization guide](docs/START_HERE.md) for everything you can change.

## Questions?

Open an issue — we're happy to help.
