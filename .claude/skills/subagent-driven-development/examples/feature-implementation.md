# Example: Subagent Feature Implementation

> Complete walkthrough of implementing a feature using subagent-driven development.

---

## The Task

Implement a **Notification Bell** component for the BOS dashboard header with:
- Bell icon showing unread count badge
- Dropdown with notification list
- Mark as read functionality
- BOS styling throughout

---

## Step 1: Prepare Task List

Extract from implementation plan into actionable tasks:

```markdown
## Notification Bell - Task List

- [ ] Task 1: Create NotificationBell component shell with types
- [ ] Task 2: Implement bell trigger with unread badge
- [ ] Task 3: Create NotificationItem subcomponent
- [ ] Task 4: Build notification list dropdown with React Aria
- [ ] Task 5: Add mark-as-read functionality
- [ ] Task 6: Write integration tests
```

---

## Step 2: Dispatch Implementer for Task 1

### Implementer Prompt

```markdown
## Task: Create NotificationBell component shell with types

### Context
We're building a notification bell for the BOS dashboard header.
This task creates the foundational types and component shell.

### Requirements
1. Create TypeScript interfaces for:
   - Notification (id, title, message, read, createdAt)
   - NotificationBellProps (notifications, onMarkAsRead)
2. Create component file at `components/header/NotificationBell.tsx`
3. Export empty component shell that returns null
4. Write basic render test

### BOS Design System Requirements
- Use semantic CSS variables (var(--bg-primary), etc.)
- Follow border pattern: border-[var(--border-primary)]/40
- Use React Aria Components for interactivity
- Warm neutrals only (no pure black/white)

### Pre-Implementation
Before starting, confirm:
- File path is correct
- Interface shape makes sense for the use case
- Test file location convention

### Expected Deliverables
1. `components/header/NotificationBell.tsx` with types and shell
2. `components/header/__tests__/NotificationBell.test.tsx` with render test
3. Commit: `feat(header): add NotificationBell types and shell`
```

### Implementer Response

```markdown
## Implementation Report

### Questions Before Starting
None - requirements are clear.

### Completed
Created NotificationBell component with:
- Notification interface with all required fields
- NotificationBellProps interface
- Empty component shell returning null
- Basic render test

### Tests
```
PASS components/header/__tests__/NotificationBell.test.tsx
  NotificationBell
    ✓ renders without crashing (8ms)
```

### Files Modified
- components/header/NotificationBell.tsx (new)
- components/header/__tests__/NotificationBell.test.tsx (new)

### BOS Compliance
- N/A for types only (styling in next task)

### Self-Review
- [x] Types complete and exported
- [x] Test passes
- [x] Committed with conventional format
```

---

## Step 3: Spec Compliance Review (Task 1)

### Review Process

```markdown
## Spec Compliance Review - Task 1

### Task Reference
Create NotificationBell component shell with types

### Verification (Code Inspection)

**Checking: components/header/NotificationBell.tsx**

✓ Notification interface present:
```tsx
export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}
```

✓ NotificationBellProps interface present:
```tsx
export interface NotificationBellProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
}
```

✓ Component shell exports correctly:
```tsx
export function NotificationBell({ notifications, onMarkAsRead }: NotificationBellProps) {
  return null;
}
```

**Checking: Test file**
✓ Test exists and passes
✓ Renders component without crashing

### Verdict
✅ **SPEC COMPLIANT**
- All required interfaces present with correct fields
- Component shell created at correct path
- Test passes
```

---

## Step 4: Code Quality Review (Task 1)

### Review Process

```markdown
## Code Quality Review - Task 1

### Changes Reviewed
- components/header/NotificationBell.tsx
- components/header/__tests__/NotificationBell.test.tsx

### Quality Checks

**TypeScript Quality**
- [x] Interfaces properly typed
- [x] No `any` types
- [x] Props interface exported for reuse

**Code Organization**
- [x] Clear interface definitions at top
- [x] Component follows file naming convention
- [x] Test co-located in __tests__ directory

**Documentation**
- [ ] Could add JSDoc comment to interfaces

### Issues Found
**Minor**: Consider adding JSDoc to Notification interface explaining field purposes.

### Verdict
✅ **APPROVED** - Minor suggestion noted for future, not blocking.
```

---

## Step 5: Continue with Task 2

### Implementer Prompt

```markdown
## Task: Implement bell trigger with unread badge

### Context
Building on Task 1's shell, implement the visual bell trigger.
Must show a badge with unread count when notifications exist.

### Requirements
1. Bell icon (use Lucide BellIcon)
2. Badge showing unread count (only if > 0)
3. Badge uses brand color (Aperol) per BOS guidelines
4. Button uses React Aria for accessibility
5. Hover and focus states per BOS patterns

### BOS Design System Requirements
- Icon: text-[var(--fg-secondary)], hover:text-[var(--fg-primary)]
- Badge: bg-[var(--bg-brand-solid)] text-white
- Button: transparent bg, focus ring on focus
- Transition: duration-150

### Code Pattern Reference
```tsx
// BOS Icon Button pattern
<Button
  aria-label="Notifications"
  className={cn(
    "relative p-2 rounded-lg",
    "text-[var(--fg-secondary)]",
    "hover:text-[var(--fg-primary)]",
    "hover:bg-[var(--bg-secondary)]/50",
    "focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)]"
  )}
>
  <BellIcon className="w-5 h-5" />
  {/* Badge here */}
</Button>
```

### Expected Deliverables
1. Bell trigger with icon renders
2. Badge shows when unread > 0
3. Badge hidden when unread = 0
4. Tests for both states
5. Commit: `feat(header): implement NotificationBell trigger with badge`
```

### Implementer Response

```markdown
## Implementation Report

### Completed
Implemented bell trigger with:
- BellIcon from Lucide
- Unread count badge (Aperol background)
- React Aria Button for accessibility
- Proper hover/focus states

### Code Sample
```tsx
export function NotificationBell({ notifications, onMarkAsRead }: NotificationBellProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Button
      aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      className={cn(
        "relative p-2 rounded-lg",
        "text-[var(--fg-secondary)]",
        "hover:text-[var(--fg-primary)]",
        "hover:bg-[var(--bg-secondary)]/50",
        "focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)]",
        "transition-colors duration-150"
      )}
    >
      <BellIcon className="w-5 h-5" aria-hidden="true" />

      {unreadCount > 0 && (
        <span
          className={cn(
            "absolute -top-1 -right-1",
            "min-w-[18px] h-[18px] px-1",
            "flex items-center justify-center",
            "text-xs font-medium text-white",
            "bg-[var(--bg-brand-solid)]",
            "rounded-full"
          )}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Button>
  );
}
```

### Tests
```
PASS components/header/__tests__/NotificationBell.test.tsx
  NotificationBell
    ✓ renders bell icon (12ms)
    ✓ shows badge when unread notifications exist (8ms)
    ✓ hides badge when no unread notifications (5ms)
    ✓ displays correct unread count (6ms)
    ✓ caps badge at 99+ for large counts (4ms)
    ✓ includes unread count in aria-label (7ms)
```

### BOS Compliance
- [x] CSS variables used throughout
- [x] React Aria Button used
- [x] Brand color only for badge (appropriate CTA use)
- [x] Proper focus ring
- [x] Warm neutrals for icon states
```

---

## Step 6: Spec Review (Task 2)

```markdown
## Spec Compliance Review - Task 2

### Code Inspection

✓ Bell icon present (Lucide BellIcon)
✓ Badge shows unread count
✓ Badge only visible when count > 0
✓ Brand color (--bg-brand-solid) for badge
✓ React Aria Button used
✓ Hover states: fg-secondary → fg-primary
✓ Focus ring present
✓ Transition duration-150

### Verdict
✅ **SPEC COMPLIANT**
```

---

## Step 7: Quality Review (Task 2)

```markdown
## Code Quality Review - Task 2

### BOS-Specific Checks
- [x] CSS variables (no hardcoded colors)
- [x] Border opacity N/A (no borders in this component)
- [x] Brand color appropriately used (badge = CTA-like)
- [x] React Aria for accessibility

### Component Quality
- [x] aria-label dynamic with count
- [x] aria-hidden on decorative icon
- [x] Keyboard accessible (React Aria handles)

### Code Standards
- [x] TypeScript fully typed
- [x] No any types
- [x] Tests cover behavior

### Issues Found
None

### Verdict
✅ **APPROVED**
```

---

## Parallel Dispatch: Tasks 3 & 4

Since Task 3 (NotificationItem) and Task 4 (dropdown) are independent, dispatch both:

```markdown
### Dispatching in Parallel

Task 3: Create NotificationItem subcomponent
→ Agent A working...

Task 4: Build notification list dropdown with React Aria
→ Agent B working...

Both use same BOS patterns, no file conflicts.
```

---

## Final Code Review

After all tasks complete, run comprehensive review:

```markdown
## Final Code Review - NotificationBell Feature

### Files Changed
- components/header/NotificationBell.tsx
- components/header/NotificationItem.tsx
- components/header/__tests__/NotificationBell.test.tsx
- components/header/__tests__/NotificationItem.test.tsx
- components/header/index.ts

### BOS Compliance Summary
- [x] All colors use CSS variables
- [x] React Aria for all interactive elements
- [x] Brand color only for badge and unread indicator
- [x] Proper focus management
- [x] Keyboard navigation works

### Test Summary
```
PASS components/header/__tests__/NotificationBell.test.tsx (12 tests)
PASS components/header/__tests__/NotificationItem.test.tsx (6 tests)

18 tests passed, 0 failed
```

### Build Verification
```
$ npm run build
✓ Compiled successfully
```

### Verdict
✅ **APPROVED FOR MERGE**
```

---

## Key Takeaways

1. **Task boundaries matter** - Each task is small, focused, reviewable
2. **Reviews catch issues early** - Spec review before quality review
3. **Parallel execution speeds up** - Independent tasks run simultaneously
4. **BOS compliance is non-negotiable** - Every review checks design system
5. **Fresh agent context** - Each implementer starts clean, no pollution
