---
description: Clear cache and restart dev server
allowed-tools: Bash
---

Clear all caches and restart the development server for a fresh start.

## Steps

1. **Kill any running Vite processes:**
   ```bash
   pkill -f 'vite' 2>/dev/null
   ```

2. **Check cache sizes before clearing** (for reporting):
   ```bash
   du -sh node_modules/.vite 2>/dev/null
   du -sh node_modules/.cache 2>/dev/null
   ```

3. **Remove cache directories:**
   ```bash
   rm -rf node_modules/.vite node_modules/.cache
   ```

4. **Report what was cleared** - inform the user how much space was freed.

5. **Start the dev server:**
   ```bash
   bun dev
   ```

6. **Confirm startup** - let the user know the server is running (typically on port 5173).

## Notes

- This command should be run from the project directory
- The Vite cache in `node_modules/.vite` can grow over time
- Clearing caches resolves most "stale build" issues
