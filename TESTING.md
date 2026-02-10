# Testing Guide

Manual checklists and automated test reference for contributors. Every PR that touches UI should be verified against the relevant sections before merge.

---

## Running Automated Tests

```bash
bun test           # Watch mode
bun run test:run   # Single run (CI)
bun run test:ui    # Visual dashboard
```

### Test File Locations

| File | Component | Coverage |
|------|-----------|----------|
| `src/lib/search/__tests__/fuzzy-match.test.ts` | Fuzzy matching | Distance, similarity, scoring |
| `src/lib/search/__tests__/query-classifier.test.ts` | Query classification | Complexity detection |
| `src/lib/search/__tests__/semantic-search.test.ts` | Semantic search | Category/pricing filters, synonyms |
| `src/lib/search/__tests__/semantic-mappings.test.ts` | Semantic mappings | Synonyms, concepts, category/pricing resolution |
| `src/components/search/__tests__/SearchModal.test.tsx` | SearchModal | Open/close, keyboard nav, results, a11y |
| `src/components/ui/__tests__/AIFilterResponse.test.tsx` | AIFilterResponse | Typewriter, auto-dismiss, timers |
| `src/components/card-view/__tests__/CategoryGrid.test.tsx` | CategoryGrid | Categories, expansion, responsive |

---

## Visual Regression Checklist

### Theme Consistency

Test **both** light and dark mode for each item.

- [ ] SearchModal renders correctly in light mode
- [ ] SearchModal renders correctly in dark mode
- [ ] SideNav tooltip is readable in both themes
- [ ] AIFilterResponse is readable in both themes
- [ ] Category buttons contrast is sufficient
- [ ] Resource cards have proper borders
- [ ] Table view header is properly styled

### Responsive Breakpoints

Test at each breakpoint:

- [ ] **Mobile (375px)** — single column cards, mobile search button visible
- [ ] **Tablet (768px)** — two column grid, search bar visible
- [ ] **Desktop (1024px)** — three column grid, full header
- [ ] **Ultra-wide (2560px)** — 3D canvas frames content properly

### 3D Canvas States

- [ ] Initial load shows loader, then reveals universe
- [ ] Category filter zooms camera to cluster
- [ ] Search filter highlights matching nodes
- [ ] Hover shows tooltip following cursor
- [ ] Click navigates to resource detail
- [ ] Touch tap works on mobile devices
- [ ] Legend opens/closes properly

---

## Performance Benchmarks

### Bundle Size

Check with `bun run build`:

- [ ] `vendor-three` chunk — monitor, currently largest chunk
- [ ] `vendor-react` chunk — should be under 200KB gzipped
- [ ] Total JS — log baseline for contributors to compare against

### 3D Canvas Performance

- [ ] Open Chrome DevTools Performance tab
- [ ] Record 5 seconds of normal interaction
- [ ] Verify no frame drops below 30fps on mid-range hardware
- [ ] Confirm no garbage collection spikes from object allocation (Bugs 2-5 fixes)

---

## Accessibility Checklist

### Keyboard Navigation

- [ ] Tab through all interactive elements in header
- [ ] `Cmd+K` opens search, `Escape` closes it
- [ ] Arrow keys navigate search results
- [ ] `Enter` selects a result
- [ ] Skip to main content link works on focus
- [ ] View mode buttons are keyboard accessible
- [ ] Legend button opens/closes with `Enter`/`Space`

### Screen Reader

- [ ] Search modal has proper `role="dialog"` and `aria-modal="true"`
- [ ] `aria-labelledby` connects to visible heading
- [ ] View toggle buttons have `aria-label` and `aria-current`
- [ ] Skip link is available
- [ ] Resource count is announced (`aria-live`)
- [ ] Category buttons announce selected state

---

## Cross-Browser Verification

### Required Browsers

- [ ] **Chrome (latest)** — primary target
- [ ] **Firefox (latest)** — CSS variable support, WebGL
- [ ] **Safari (latest)** — backdrop-filter, WebGL quirks
- [ ] **Mobile Safari (iOS)** — touch events, dvh units, viewport behavior
- [ ] **Chrome Android** — touch events

### Known Risk Areas

- `backdrop-blur-sm` / `backdrop-blur-xl` — Safari needs `-webkit-backdrop-filter`
- `h-dvh` — dynamic viewport height, needs fallback for older browsers
- WebGL/Three.js — shader compilation differences across GPU drivers
- Web Speech API — only Chrome has full support (used in InspoChat voice recognition)

---

## Critical User Flow Tests

Manual smoke tests to run before any release. Each flow covers a core user journey end-to-end.

### Flow 1: First Visit

> Load app → see loader → universe reveals → hover nodes → click resource → view detail → back to home

- [ ] Navigate to the app URL (fresh session, clear cache)
- [ ] Loading indicator appears immediately
- [ ] 3D universe reveals smoothly after assets load (no dark gap, no flash)
- [ ] Hovering a node shows a tooltip with resource name following the cursor
- [ ] Clicking a node navigates to the resource detail view
- [ ] Browser back button returns to the home view with state intact

### Flow 2: Search

> `Cmd+K` → type query → arrow down → `Enter` → navigate to resource

- [ ] Press `Cmd+K` (or `Ctrl+K` on Windows/Linux) — search modal opens
- [ ] Input field is focused automatically
- [ ] "Popular Resources" appear in the empty state
- [ ] Type a query (e.g. "figma") — results appear grouped by category
- [ ] Press `ArrowDown` — highlight moves to the next result
- [ ] Press `ArrowUp` — highlight moves to the previous result
- [ ] Arrow keys wrap around from last to first (and vice versa)
- [ ] Press `Enter` — selected resource opens
- [ ] Press `Escape` — modal closes, previous focus is restored
- [ ] Clicking the backdrop closes the modal
- [ ] Keyboard hints in footer are visible ("Enter to select", "arrows to navigate", "Esc to close")

### Flow 3: Category Filter

> Click category button → universe zooms → AI response appears → auto-dismisses → click "All" to reset

- [ ] Click a category button (e.g. "Tools") in the header/filter bar
- [ ] In 3D view: camera zooms to the category cluster
- [ ] AIFilterResponse appears with a typewriter effect describing the filter
- [ ] Blinking cursor shows while text is typing
- [ ] After typing completes, match count badge appears with pulse animation
- [ ] After ~4 seconds, the response auto-dismisses with a fade
- [ ] Dismiss button (X) immediately removes the response when clicked
- [ ] Click "All" to reset — camera returns to the full universe view
- [ ] Filtering works correctly in Card view (only matching category cards shown)
- [ ] Filtering works correctly in Table view (only matching rows shown)

### Flow 4: View Switching

> 3D → Card → Table → 3D (verify no stale state)

- [ ] Start in 3D view (default)
- [ ] Switch to Card view — resource cards render in a responsive grid
- [ ] Switch to Table view — table renders with sortable columns
- [ ] Switch back to 3D view — universe renders correctly, no stale overlays
- [ ] Active category filter persists across view switches
- [ ] Search query persists across view switches
- [ ] No console errors during transitions
- [ ] Animations between views are smooth (or instant if reduced motion is on)

### Flow 5: Theme Toggle

> Switch dark → light → dark (verify all components theme correctly)

- [ ] App starts in dark mode (default)
- [ ] Click the theme toggle — entire UI switches to light mode
- [ ] Verify in light mode:
  - [ ] SearchModal background, text, and borders are readable
  - [ ] SideNav tooltip has proper contrast
  - [ ] AIFilterResponse text and badge are visible
  - [ ] Category cards have appropriate borders and backgrounds
  - [ ] Resource cards/table rows have sufficient contrast
  - [ ] 3D canvas background adapts
- [ ] Switch back to dark mode — all components return to dark styling
- [ ] No flicker or flash of unstyled content during transition
- [ ] Theme preference persists on page reload

### Flow 6: URL Deep Link

> Navigate to `/?display=table&category=Tools` → verify table loads with Tools filter

- [ ] Open `/?display=table&category=Tools` directly in the browser
- [ ] Table view is active (not 3D or Card)
- [ ] Tools category filter is active (only Tools resources shown)
- [ ] Category filter button shows "Tools" as selected
- [ ] Switching to Card view preserves the Tools filter
- [ ] Switching to 3D view zooms to the Tools cluster
- [ ] Clearing the filter returns to showing all resources
- [ ] URL updates when filters change

---

## Verification Checklist

Run these end-to-end checks after all bug fixes are applied:

- [ ] `bun run build` — no TypeScript errors, build succeeds
- [ ] `bun test` — all existing + new tests pass
- [ ] `bun dev` — manual smoke test of all 6 critical user flows above
- [ ] Open DevTools Performance → record 5s in 3D view → no GC spikes, steady 60fps
- [ ] Toggle light/dark mode → every component themes correctly (SearchModal especially)
- [ ] Resize browser narrow → wide → verify responsive behavior
- [ ] Keyboard-only navigation → all interactive elements reachable
