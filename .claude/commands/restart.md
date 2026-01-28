---
description: Clear cache and restart dev server
allowed-tools: Bash
---

Clear all caches and restart the development server for a fresh start.

## Steps

1. **Kill any running Next.js processes:**
   ```bash
   pkill -f 'next-server' 2>/dev/null
   pkill -f 'next dev' 2>/dev/null
   ```

2. **Check cache sizes before clearing** (for reporting):
   ```bash
   du -sh .next 2>/dev/null
   du -sh node_modules/.cache 2>/dev/null
   ```

3. **Remove cache directories:**
   ```bash
   rm -rf .next node_modules/.cache
   ```

4. **Report what was cleared** - inform the user how much space was freed.

5. **Start the dev server:**
   ```bash
   bun dev
   ```

6. **Confirm startup** - let the user know the server is running and on which port.

## Notes

- This command should be run from the BOS-3.0 directory
- Use `/bos` first if you're not already there
- The `.next/` cache can grow to 600+ MB over time
- Clearing caches resolves most "stale build" issues
