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
   du -sh dist 2>/dev/null
   ```

3. **Remove cache directories:**
   ```bash
   rm -rf node_modules/.vite node_modules/.cache dist
   ```

4. **Report what was cleared** - inform the user how much space was freed.

5. **Verify critical assets exist:**
   ```bash
   ls public/textures/galaxy/skybox.hdr 2>/dev/null || echo "⚠️ Warning: skybox.hdr texture missing - 3D scene may fail to load"
   ```

6. **Remind user to clear browser cache:**
   Tell the user: "Clear your browser cache with Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux), or open DevTools → Network → check 'Disable cache'"

7. **Start the dev server:**
   ```bash
   bun dev
   ```

8. **Confirm startup** - let the user know the server is running on port 3001.

## Notes

- This command should be run from the project directory
- The Vite cache in `node_modules/.vite` can grow over time
- Clearing caches resolves most "stale build" issues
- If you see a white page after restart, try clearing browser cache - the 3D skybox texture may be cached as a failed request
