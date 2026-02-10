# Visual Regression Checklist

Manual checklist for PR review. Every PR that touches UI components should be verified against the relevant sections below before merge.

---

## Theme Consistency

Test **both** light and dark mode for each item.

- [ ] SearchModal renders correctly in light mode
- [ ] SearchModal renders correctly in dark mode
- [ ] SideNav tooltip is readable in both themes
- [ ] AIFilterResponse is readable in both themes
- [ ] Category buttons contrast is sufficient
- [ ] Resource cards have proper borders
- [ ] Table view header is properly styled

## Responsive Breakpoints

Test at each breakpoint:

- [ ] **Mobile (375px)** — single column cards, mobile search button visible
- [ ] **Tablet (768px)** — two column grid, search bar visible
- [ ] **Desktop (1024px)** — three column grid, full header
- [ ] **Ultra-wide (2560px)** — 3D canvas frames content properly

## 3D Canvas States

- [ ] Initial load shows loader, then reveals universe
- [ ] Category filter zooms camera to cluster
- [ ] Search filter highlights matching nodes
- [ ] Hover shows tooltip following cursor
- [ ] Click navigates to resource detail
- [ ] Touch tap works on mobile devices
- [ ] Legend opens/closes properly
