import { ReactNode } from 'react'

interface TooltipProps {
  children: ReactNode
  label: string
  show: boolean
}

/**
 * Tooltip Component
 *
 * Displays a floating label next to sidebar icons on hover.
 * Used in collapsed state to show what each icon represents.
 *
 * Design specs from Figma:
 * - Background: Vanilla (#FFFAEE)
 * - Text: Charcoal (#191919)
 * - Font: 14px Neue Haas Grotesk Text Pro, medium weight
 * - Positioning: Absolute, offset left from trigger
 * - Shadow: Subtle elevation
 * - Transition: 150ms fade in/out
 */
export default function Tooltip({ children, label, show }: TooltipProps) {
  return (
    <div className="relative inline-flex">
      {children}
      {show && (
        <div
          className="absolute left-full ml-2 px-3 py-2 bg-brand-vanilla text-brand-charcoal font-text text-sm font-medium rounded-md shadow-lg whitespace-nowrap z-50 animate-in fade-in duration-150"
          style={{
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
          }}
        >
          {label}
        </div>
      )}
    </div>
  )
}
