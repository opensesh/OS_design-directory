# Common BOS Issues Reference

> Quick reference for frequently encountered issues and their solutions.

---

## CSS Variable Issues

### Issue: Variables Not Working in Tailwind

**Symptom**: `bg-[var(--bg-primary)]` shows no background

**Cause**: Variable not defined or wrong syntax

**Debug**:
```javascript
// Check if variable is defined
getComputedStyle(document.documentElement).getPropertyValue('--bg-primary')
// Should return a value like "#191919" or "25 25 25"
```

**Common Fixes**:
1. Check `app/theme.css` defines the variable
2. Ensure `theme.css` is imported in `app/layout.tsx`
3. Verify syntax: `var(--name)` not `var(name)` or `--name`

---

### Issue: Dark Mode Not Switching

**Symptom**: Theme toggle clicks but colors don't change

**Debug Checklist**:
```javascript
// Check theme attribute
document.documentElement.dataset.theme // Should be "light" or "dark"

// Check CSS variables change
getComputedStyle(document.documentElement).getPropertyValue('--bg-primary')
// Toggle theme, check again - value should change
```

**Common Causes**:
1. Hardcoded colors instead of CSS variables
2. Wrong selector in theme.css (use `[data-theme="dark"]`)
3. next-themes not configured correctly

---

### Issue: CSS Variables in Portals

**Symptom**: Modal/tooltip has wrong colors, doesn't match theme

**Cause**: Portals render outside CSS variable scope

**Fix**:
```tsx
// Ensure portal container inherits variables
<Popover portalContainer={document.body}>

// Or add variables to portal target
document.body.style.setProperty('--bg-primary', value);
```

---

## React Aria Issues

### Issue: Focus Ring Not Visible

**Symptom**: Can't see which element is focused

**Fix**: Add explicit focus styles:
```tsx
className={cn(
  "focus:outline-none",
  "focus:ring-2 focus:ring-[var(--border-primary)]",
  "focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]"
)}
```

---

### Issue: Hover States Conflict with Focus

**Symptom**: Hover and focus styles clash, look wrong together

**Fix**: Use data attributes for more control:
```tsx
className={cn(
  "hover:bg-[var(--bg-secondary)]/50",
  "focus:bg-[var(--bg-secondary)]/70",  // Slightly stronger than hover
  "data-[hovered]:data-[focused]:bg-[var(--bg-secondary)]/70"
)}
```

---

### Issue: Button Clicked But Nothing Happens

**Debug Checklist**:
1. Check `onPress` prop (not `onClick` for React Aria)
2. Check button isn't `disabled` or `isDisabled`
3. Check no overlay blocking clicks (z-index)
4. Check console for React Aria warnings

---

### Issue: Select/ComboBox Options Not Showing

**Common Causes**:
1. Missing `<Popover>` wrapper
2. ListBox has `display: none` or `opacity: 0`
3. Options array is empty
4. Key collision in option IDs

---

## Layout Issues

### Issue: Content Cut Off

**Symptom**: Text or elements truncated unexpectedly

**Debug**:
```css
/* Add visible outline to find culprit */
* { outline: 1px solid red !important; }
```

**Common Causes**:
1. `overflow: hidden` on parent
2. `max-height` or `max-width` constraint
3. `flex-shrink` on wrong element
4. Fixed height container with dynamic content

---

### Issue: Horizontal Scroll Appearing

**Debug**:
```javascript
// Find element causing overflow
[...document.querySelectorAll('*')].find(el =>
  el.scrollWidth > document.documentElement.clientWidth
)
```

**Common Causes**:
1. Element with `width: 100vw` (includes scrollbar)
2. Negative margin without matching positive padding
3. Absolute positioned element extending past viewport

---

### Issue: Z-Index Not Working

**Debug**:
```css
/* Check stacking context */
.element { position: relative; z-index: 9999; }
/* If still covered, check parent z-index */
```

**Remember**: Z-index only works within same stacking context. Parent with lower z-index blocks child from appearing above.

---

## Animation Issues

### Issue: Framer Motion Exit Animation Not Playing

**Symptom**: Element disappears instantly instead of animating out

**Fix**: Wrap in `<AnimatePresence>`:
```tsx
<AnimatePresence>
  {isOpen && (
    <motion.div
      exit={{ opacity: 0 }}
    >
```

---

### Issue: Animation Janky/Laggy

**Debug Checklist**:
1. Check for layout thrashing (animating `width`, `height`)
2. Use `transform` and `opacity` instead
3. Add `will-change: transform` for complex animations
4. Check for re-renders during animation

**Better Pattern**:
```tsx
// ❌ Janky
animate={{ width: isOpen ? 240 : 64 }}

// ✅ Smooth
animate={{ scale: isOpen ? 1 : 0.5 }}
```

---

### Issue: GSAP Not Triggering

**Debug**:
```javascript
// Check element exists
console.log(gsap.utils.toArray('.my-element'))

// Check timeline
const tl = gsap.timeline();
console.log(tl.progress()) // Should change over time
```

**Common Causes**:
1. Target element doesn't exist at GSAP call time
2. Wrong selector (class vs ID)
3. Duration is 0
4. `paused: true` without `.play()` call

---

## Build/Type Issues

### Issue: TypeScript Error on CSS Variables

**Symptom**: `"Type 'string' is not assignable to type 'Color'"`

**Fix**: Use template literal type:
```tsx
// In component
className={`bg-[var(--bg-primary)]` as const}

// Or in cn() function, types flow through
className={cn("bg-[var(--bg-primary)]")}
```

---

### Issue: Tailwind Classes Not Applying

**Debug Checklist**:
1. Check class is in `tailwind.config.ts` content paths
2. Check for typos in class name
3. Check if dynamic class needs safelist
4. Check CSS specificity (other styles overriding)

**Dynamic Class Safelist**:
```typescript
// tailwind.config.ts
safelist: [
  'bg-[var(--bg-primary)]',
  'bg-[var(--bg-secondary)]',
  // ... dynamic classes used
]
```

---

### Issue: Build Fails with ESM/CJS Error

**Symptom**: `require is not defined` or `Cannot use import statement`

**Common Fixes**:
1. Check package is ESM-only, needs dynamic import
2. Add to `transpilePackages` in next.config.js
3. Use `import()` instead of `require()`

---

## Supabase Issues

### Issue: Auth Session Lost on Refresh

**Debug**:
```javascript
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
```

**Common Causes**:
1. Cookies not persisting (check domain settings)
2. SSR/CSR mismatch in session handling
3. Auth callback not completing

---

### Issue: RLS Blocking Queries

**Symptom**: Query returns empty but data exists

**Debug**:
```sql
-- In Supabase SQL editor, as service role
SELECT * FROM your_table;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';
```

---

## Quick Debug Commands

```bash
# Find hardcoded colors
grep -rE "#[0-9A-Fa-f]{6}" --include="*.tsx"

# Find console.logs left in
grep -rE "console\.(log|debug|info)" --include="*.tsx" --include="*.ts"

# Find TODO comments
grep -rE "TODO|FIXME|HACK" --include="*.tsx" --include="*.ts"

# Check for unused imports
npx eslint --quiet --rule "no-unused-vars: error"

# Type check without building
npx tsc --noEmit

# Find large files
find . -name "*.tsx" -size +50k
```
