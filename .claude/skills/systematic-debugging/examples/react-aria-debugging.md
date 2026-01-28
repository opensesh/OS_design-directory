# Example: Debugging React Aria Issues

> Systematic debugging walkthrough for accessibility and interaction bugs.

---

## The Bug Report

**Symptom**: Custom Select component doesn't open dropdown when clicked. Keyboard navigation also broken.

**User Report**: "The dropdown just doesn't work. Clicking does nothing."

---

## Phase 1: Root Cause Investigation

### Step 1: Read the Console

```javascript
// Browser console shows:
Warning: React Aria: ComboBox requires a <Popover> child to render the listbox.
```

This is a structural issue, not a styling problem.

### Step 2: Reproduce Consistently

```
Test 1: Click the Select trigger
- Expected: Dropdown opens
- Actual: Nothing happens ✗

Test 2: Press Space on focused trigger
- Expected: Dropdown opens
- Actual: Nothing happens ✗

Test 3: Press Arrow Down
- Expected: Open and select first item
- Actual: Nothing happens ✗

Reproduction: 100% consistent, all interaction methods fail
```

### Step 3: Check the Component Structure

```tsx
// Current implementation (broken)
import { Select, SelectValue, Button, ListBox, ListBoxItem } from 'react-aria-components';

export function BrandSelect({ options, ...props }) {
  return (
    <Select {...props}>
      <Button className="...">
        <SelectValue />
      </Button>
      <ListBox>  {/* ← Missing Popover wrapper! */}
        {options.map(opt => (
          <ListBoxItem key={opt.value}>{opt.label}</ListBoxItem>
        ))}
      </ListBox>
    </Select>
  );
}
```

### Step 4: Compare with Documentation

React Aria Select requires this structure:

```tsx
<Select>
  <Label>...</Label>
  <Button>
    <SelectValue />
  </Button>
  <Popover>       {/* ← Required! */}
    <ListBox>
      <ListBoxItem>...</ListBoxItem>
    </ListBox>
  </Popover>
</Select>
```

**Root Cause Identified**: Missing `<Popover>` wrapper around `<ListBox>`.

---

## Phase 2: Pattern Analysis

### Step 1: Find Working Examples

Check our other React Aria implementations:

```tsx
// components/ui/ComboBox.tsx (works correctly)
<ComboBox>
  <Label>Search</Label>
  <Input />
  <Button>▼</Button>
  <Popover>          {/* ← Has Popover */}
    <ListBox>
      {items.map(item => (
        <ListBoxItem key={item.id}>{item.name}</ListBoxItem>
      ))}
    </ListBox>
  </Popover>
</ComboBox>
```

### Step 2: Study React Aria Docs

From React Aria documentation:
> "The Popover component renders the popup that contains the listbox. It handles positioning, animations, and keyboard interactions."

Key insight: Popover provides the interaction handling, not just visual popup.

### Step 3: Map Dependencies

```
Select
├── Button (trigger) → onClick opens popover
├── SelectValue → displays current selection
└── Popover → REQUIRED for dropdown behavior
    └── ListBox → contains options
        └── ListBoxItem → individual options
```

Without Popover, the interaction chain is broken.

---

## Phase 3: Hypothesis & Testing

### Hypothesis
> Adding `<Popover>` wrapper around `<ListBox>` will restore all interaction behavior.

### Minimal Test

```tsx
// Add Popover, nothing else
import { Popover } from 'react-aria-components';

<Select>
  <Button>...</Button>
  <Popover>
    <ListBox>...</ListBox>
  </Popover>
</Select>
```

**Test Result**:
- Click trigger → Dropdown opens ✓
- Keyboard Space → Dropdown opens ✓
- Arrow keys → Navigation works ✓
- Escape → Closes dropdown ✓

Hypothesis confirmed!

---

## Phase 4: Implementation

### Step 1: Write Failing Test

```tsx
// components/ui/__tests__/BrandSelect.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrandSelect } from '../BrandSelect';

const options = [
  { value: 'red', label: 'Red' },
  { value: 'blue', label: 'Blue' },
];

describe('BrandSelect', () => {
  it('opens dropdown on click', async () => {
    const user = userEvent.setup();
    render(<BrandSelect options={options} label="Color" />);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('Red')).toBeVisible();
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<BrandSelect options={options} label="Color" />);

    const trigger = screen.getByRole('button');
    await user.tab(); // Focus trigger
    await user.keyboard('{Enter}'); // Open

    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.keyboard('{ArrowDown}'); // Select first
    await user.keyboard('{Enter}'); // Confirm

    expect(trigger).toHaveTextContent('Red');
  });
});
```

Run test to confirm it fails with current implementation:

```bash
$ npm test BrandSelect.test.tsx

FAIL  components/ui/__tests__/BrandSelect.test.tsx
  BrandSelect
    ✕ opens dropdown on click (234ms)
    ✕ supports keyboard navigation (156ms)

    Unable to find role="listbox"
```

### Step 2: Implement Fix

```tsx
// components/ui/BrandSelect.tsx
import {
  Select,
  Label,
  Button,
  SelectValue,
  Popover,
  ListBox,
  ListBoxItem,
} from 'react-aria-components';
import { cn } from '@/lib/utils';

interface BrandSelectProps {
  label: string;
  options: { value: string; label: string }[];
  className?: string;
}

export function BrandSelect({ label, options, className }: BrandSelectProps) {
  return (
    <Select className={cn("flex flex-col gap-1", className)}>
      <Label className="text-sm font-medium text-[var(--fg-secondary)]">
        {label}
      </Label>

      <Button
        className={cn(
          "flex items-center justify-between",
          "bg-[var(--bg-tertiary)]",
          "border border-[var(--border-primary)]/40",
          "rounded-lg px-3 py-2",
          "text-[var(--fg-primary)]",
          "hover:border-[var(--border-primary)]",
          "focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)]",
          "data-[pressed]:bg-[var(--bg-secondary)]"
        )}
      >
        <SelectValue className="flex-1 text-left" />
        <ChevronDownIcon className="w-4 h-4 text-[var(--fg-tertiary)]" />
      </Button>

      <Popover
        className={cn(
          "bg-[var(--bg-primary)]",
          "border border-[var(--border-primary)]/40",
          "rounded-lg shadow-lg",
          "mt-1 p-1",
          "entering:animate-in entering:fade-in entering:zoom-in-95",
          "exiting:animate-out exiting:fade-out exiting:zoom-out-95"
        )}
      >
        <ListBox className="outline-none">
          {options.map(option => (
            <ListBoxItem
              key={option.value}
              id={option.value}
              className={cn(
                "px-3 py-2 rounded-md cursor-pointer",
                "text-[var(--fg-primary)]",
                "hover:bg-[var(--bg-secondary)]/50",
                "focus:outline-none focus:bg-[var(--bg-secondary)]/50",
                "data-[selected]:bg-[var(--bg-tertiary)]"
              )}
            >
              {option.label}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </Select>
  );
}
```

### Step 3: Verify Fix

```bash
$ npm test BrandSelect.test.tsx

PASS  components/ui/__tests__/BrandSelect.test.tsx
  BrandSelect
    ✓ opens dropdown on click (89ms)
    ✓ supports keyboard navigation (123ms)

# Check for warnings
$ npm test BrandSelect.test.tsx 2>&1 | grep -i "warning\|error"
(no output - clean)

$ npm run build
✓ Compiled successfully

# Manual verification
1. Click trigger → Opens ✓
2. Arrow keys → Navigate options ✓
3. Enter → Selects option ✓
4. Escape → Closes ✓
5. Tab → Moves focus correctly ✓
6. Screen reader announces correctly ✓
```

---

## Debug Log

```markdown
## Debug Session: BrandSelect Broken Interactions

### Symptom
Select component doesn't respond to click or keyboard.
Console warning about missing Popover.

### Reproduction Steps
1. Click the select trigger
2. Expected: Dropdown opens
3. Actual: Nothing happens

### Root Cause Investigation
- Console warning: "ComboBox requires a <Popover> child"
- Component structure missing Popover wrapper
- ListBox rendered directly under Select (incorrect)

### Hypotheses Tested
| # | Hypothesis | Test | Result |
|---|------------|------|--------|
| 1 | CSS blocking clicks | Checked z-index/pointer-events | FAIL |
| 2 | Missing event handler | Checked Button props | FAIL |
| 3 | Missing Popover wrapper | Added Popover | PASS ✓ |

### Root Cause
React Aria Select requires ListBox to be wrapped in Popover.
Popover provides the interaction handling, positioning, and keyboard support.

### Fix
Wrapped ListBox in Popover with BOS styling:
- bg-[var(--bg-primary)]
- border-[var(--border-primary)]/40
- Animation for open/close

### Verification
- [x] Click opens dropdown
- [x] Keyboard navigation works
- [x] Tests pass
- [x] No console warnings
- [x] Build succeeds
```

---

## Common React Aria Debugging Patterns

### Missing Provider
```
Symptom: useContextSelector returned undefined
Fix: Wrap app in <Provider> from react-aria-components
```

### Focus Not Visible
```
Symptom: No focus ring on interactive elements
Fix: Add focus:ring-2 focus:ring-[var(--border-primary)]
```

### Popover Positioning Wrong
```
Symptom: Dropdown appears in wrong location
Fix: Check offset, crossOffset, placement props
```

### Keyboard Not Working
```
Symptom: Arrow keys, Enter, Escape don't work
Fix: Usually missing Popover or incorrect nesting
```

### Selection Not Updating
```
Symptom: Clicking option doesn't select it
Fix: Check selectedKey and onSelectionChange props
```
