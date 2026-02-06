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
 * Design specs from Figma (node-id=540-15202):
 * - Background: White (#FFFFFF, not vanilla!)
 * - Border: 1px solid #E2E8F0
 * - Text: Charcoal (#020617, popover-foreground)
 * - Font: 16px Neue Haas Grotesk Text Pro, medium weight
 * - Padding: 12px horizontal, 6px vertical
 * - Border radius: 4px
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
          style={{
            position: 'absolute',
            left: '100%',
            marginLeft: '8px',
            paddingLeft: '12px',
            paddingRight: '12px',
            paddingTop: '6px',
            paddingBottom: '6px',
            backgroundColor: '#FFFFFF',
            color: '#020617',
            fontFamily: "'Neue Haas Grotesk Text Pro', sans-serif",
            fontSize: '16px',
            fontWeight: 500,
            lineHeight: 1.25,
            border: '1px solid var(--border-secondary)',
            borderRadius: '4px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
            whiteSpace: 'nowrap',
            zIndex: 50,
            animation: 'fadeIn 150ms ease-in',
          }}
        >
          {label}
        </div>
      )}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
