# BOS Component Patterns Reference

> Quick reference for common BOS component patterns to use in implementation plans.

---

## Card Patterns

### Standard Card
```tsx
<div className={cn(
  "bg-[var(--bg-secondary)]/30",
  "border border-[var(--border-primary)]/40",
  "rounded-xl p-6",
  "hover:bg-[var(--bg-secondary)]/60",
  "hover:border-[var(--border-primary)]",
  "transition-colors duration-150"
)}>
  {children}
</div>
```

### Elevated Card
```tsx
<div className={cn(
  "bg-[var(--bg-tertiary)]",
  "border border-[var(--border-primary)]/40",
  "rounded-xl p-6",
  "shadow-sm shadow-[rgb(25,25,25)]/10",  // Charcoal shadow, not black
  "hover:shadow-md"
)}>
  {children}
</div>
```

### Interactive Card (Clickable)
```tsx
import { Button } from 'react-aria-components';

<Button className={cn(
  "w-full text-left",
  "bg-[var(--bg-secondary)]/30",
  "border border-[var(--border-primary)]/40",
  "rounded-xl p-6",
  "hover:bg-[var(--bg-secondary)]/60",
  "focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)]",
  "pressed:bg-[var(--bg-tertiary)]"
)}>
  {children}
</Button>
```

---

## Button Patterns

### Primary Button (Aperol)
```tsx
import { Button } from 'react-aria-components';

<Button className={cn(
  "bg-[var(--bg-brand-solid)]",
  "text-white font-medium",
  "px-4 py-2 rounded-lg",
  "hover:bg-[var(--bg-brand-solid)]/90",
  "focus:outline-none focus:ring-2 focus:ring-[var(--bg-brand-solid)] focus:ring-offset-2",
  "pressed:bg-[var(--bg-brand-solid)]/80",
  "disabled:opacity-50 disabled:cursor-not-allowed"
)}>
  Primary Action
</Button>
```

### Secondary Button
```tsx
<Button className={cn(
  "bg-transparent",
  "border border-[var(--border-primary)]",
  "text-[var(--fg-primary)] font-medium",
  "px-4 py-2 rounded-lg",
  "hover:bg-[var(--bg-secondary)]/50",
  "focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)]",
  "pressed:bg-[var(--bg-secondary)]"
)}>
  Secondary Action
</Button>
```

### Ghost Button
```tsx
<Button className={cn(
  "bg-transparent",
  "text-[var(--fg-secondary)]",
  "px-4 py-2 rounded-lg",
  "hover:text-[var(--fg-primary)]",
  "hover:bg-[var(--bg-secondary)]/30",
  "focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)]"
)}>
  Ghost Action
</Button>
```

### Icon Button
```tsx
<Button
  aria-label="Close dialog"
  className={cn(
    "p-2 rounded-lg",
    "text-[var(--fg-tertiary)]",
    "hover:text-[var(--fg-primary)]",
    "hover:bg-[var(--bg-secondary)]/50",
    "focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)]"
  )}
>
  <XIcon className="w-5 h-5" aria-hidden="true" />
</Button>
```

---

## Input Patterns

### Text Input
```tsx
import { TextField, Label, Input } from 'react-aria-components';

<TextField className="flex flex-col gap-1">
  <Label className="text-sm font-medium text-[var(--fg-secondary)]">
    Email Address
  </Label>
  <Input
    className={cn(
      "bg-[var(--bg-tertiary)]",
      "border border-[var(--border-primary)]/40",
      "rounded-lg px-3 py-2",
      "text-[var(--fg-primary)]",
      "placeholder:text-[var(--fg-tertiary)]",
      "hover:border-[var(--border-primary)]",
      "focus:outline-none focus:border-[var(--border-primary)] focus:ring-1 focus:ring-[var(--border-primary)]",
      "disabled:opacity-50"
    )}
    placeholder="you@example.com"
  />
</TextField>
```

### Search Input
```tsx
<div className="relative">
  <SearchIcon className={cn(
    "absolute left-3 top-1/2 -translate-y-1/2",
    "w-4 h-4 text-[var(--fg-tertiary)]"
  )} />
  <Input
    className={cn(
      "w-full pl-10 pr-4 py-2",
      "bg-[var(--bg-tertiary)]",
      "border border-[var(--border-primary)]/40",
      "rounded-lg",
      // ... focus states
    )}
    placeholder="Search..."
  />
</div>
```

---

## List Patterns

### Selectable List Item
```tsx
import { ListBox, ListBoxItem } from 'react-aria-components';

<ListBox aria-label="Options" className="space-y-1">
  <ListBoxItem
    className={cn(
      "px-4 py-3 rounded-lg",
      "text-[var(--fg-primary)]",
      "hover:bg-[var(--bg-secondary)]/50",
      "focus:outline-none focus:bg-[var(--bg-secondary)]/50",
      "selected:bg-[var(--bg-tertiary)]",
      "cursor-pointer"
    )}
  >
    Option 1
  </ListBoxItem>
</ListBox>
```

### List with Dividers
```tsx
<ul className="divide-y divide-[var(--border-secondary)]">
  {items.map(item => (
    <li
      key={item.id}
      className={cn(
        "px-4 py-3",
        "hover:bg-[var(--bg-secondary)]/30",
        "transition-colors duration-150"
      )}
    >
      {item.content}
    </li>
  ))}
</ul>
```

---

## Modal/Dialog Patterns

### Dialog Container
```tsx
import { Dialog, DialogTrigger, Modal, ModalOverlay } from 'react-aria-components';

<DialogTrigger>
  <Button>Open Dialog</Button>
  <ModalOverlay className={cn(
    "fixed inset-0",
    "bg-[var(--bg-overlay)]",
    "flex items-center justify-center p-4"
  )}>
    <Modal className={cn(
      "bg-[var(--bg-primary)]",
      "border border-[var(--border-primary)]/40",
      "rounded-2xl p-6",
      "shadow-xl shadow-[rgb(25,25,25)]/20",
      "max-w-md w-full",
      "focus:outline-none"
    )}>
      <Dialog className="focus:outline-none">
        {({ close }) => (
          <>
            <Heading className="text-xl font-semibold text-[var(--fg-primary)]">
              Dialog Title
            </Heading>
            {/* Content */}
          </>
        )}
      </Dialog>
    </Modal>
  </ModalOverlay>
</DialogTrigger>
```

---

## Badge Patterns

### Status Badge
```tsx
const statusStyles = {
  active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  inactive: "bg-[var(--bg-tertiary)] text-[var(--fg-tertiary)] border-[var(--border-secondary)]",
};

<span className={cn(
  "inline-flex items-center px-2 py-0.5",
  "text-xs font-medium rounded-full",
  "border",
  statusStyles[status]
)}>
  {label}
</span>
```

### Brand Badge (Aperol)
```tsx
<span className={cn(
  "inline-flex items-center px-2 py-0.5",
  "text-xs font-medium rounded-full",
  "bg-[var(--bg-brand-solid)]/10",
  "text-[var(--fg-brand-primary)]",
  "border border-[var(--bg-brand-solid)]/20"
)}>
  Featured
</span>
```

---

## Loading States

### Skeleton
```tsx
<div className={cn(
  "animate-pulse rounded-lg",
  "bg-[var(--bg-secondary)]",
  "h-4 w-full"
)} />
```

### Spinner
```tsx
<div className={cn(
  "w-5 h-5 border-2 rounded-full animate-spin",
  "border-[var(--border-primary)]",
  "border-t-[var(--fg-brand-primary)]"  // Aperol accent
)} />
```

---

## Typography Classes

```tsx
// Headings
"text-3xl font-bold text-[var(--fg-primary)]"   // H1
"text-2xl font-semibold text-[var(--fg-primary)]" // H2
"text-xl font-medium text-[var(--fg-primary)]"   // H3
"text-lg font-medium text-[var(--fg-primary)]"   // H4

// Body
"text-base text-[var(--fg-primary)]"             // Body
"text-sm text-[var(--fg-secondary)]"             // Secondary text
"text-xs text-[var(--fg-tertiary)]"              // Muted/caption

// Links
"text-[var(--fg-brand-primary)] hover:underline" // Standard link
```

---

## Common Spacing Scale

```
p-1    = 4px
p-2    = 8px
p-3    = 12px
p-4    = 16px
p-5    = 20px
p-6    = 24px
p-8    = 32px

gap-1  = 4px
gap-2  = 8px
gap-3  = 12px
gap-4  = 16px

rounded-lg  = 8px
rounded-xl  = 12px
rounded-2xl = 16px
```

---

## Animation Presets

### Fade In
```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.2 }}
>
```

### Slide Up
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
```

### Scale In
```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.2 }}
>
```

### Stagger Children
```tsx
<motion.ul
  initial="hidden"
  animate="visible"
  variants={{
    visible: { transition: { staggerChildren: 0.05 } }
  }}
>
  {items.map(item => (
    <motion.li
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
      }}
    >
```
