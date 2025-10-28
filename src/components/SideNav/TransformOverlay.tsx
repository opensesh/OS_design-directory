import { Globe, Atom, Grid3x3, List, LucideIcon } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

type ViewMode = 'sphere' | 'galaxy' | 'grid'

interface MenuItem {
  mode: ViewMode | 'list'
  label: string
  icon: LucideIcon
  disabled?: boolean
}

const menuItems: MenuItem[] = [
  { mode: 'sphere', label: 'Sphere', icon: Globe },
  { mode: 'galaxy', label: 'Galaxy', icon: Atom },
  { mode: 'grid', label: 'Grid', icon: Grid3x3 },
  { mode: 'list', label: 'List', icon: List, disabled: true },
]

/**
 * TransformOverlay Component
 *
 * Separate overlay panel that appears beside the minimal sidebar.
 * Shows Transform visualization options (Sphere, Galaxy, Grid, List).
 *
 * Design specs from Figma (node-id=540-17001):
 * - Position: Fixed, beside sidebar with 16px gap
 * - Left offset: 96px (24px sidebar left + 56px sidebar width + 16px gap)
 * - Width: 220px
 * - Background: rgba(255, 250, 238, 0.98) - Vanilla, nearly opaque
 * - Border: 1px solid rgba(25, 25, 25, 0.08)
 * - Border radius: 12px
 * - Padding: 16px
 * - Text color: #191919 (Charcoal)
 * - Font size: 14px
 * - Active state: 3px Aperol left border + Aperol icon/text color
 * - z-index: 99 (below sidebar 100, above everything else)
 */
export default function TransformOverlay() {
  const viewMode = useAppStore((state) => state.viewMode)
  const setViewMode = useAppStore((state) => state.setViewMode)
  const isTransitioning = useAppStore((state) => state.isTransitioning)

  const handleModeChange = (mode: ViewMode | 'list') => {
    // Don't allow mode changes during transitions or if disabled
    if (isTransitioning || mode === 'list') return

    setViewMode(mode as ViewMode)
    // Keep overlay open after selection so user can see active state
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: '96px', // 24px (sidebar left) + 56px (sidebar width) + 16px (gap)
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 99, // Below sidebar (100) but above everything else
        width: '220px',
        backgroundColor: 'rgba(255, 250, 238, 0.98)',
        border: '1px solid rgba(25, 25, 25, 0.08)',
        borderRadius: '12px',
        padding: '16px',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
      }}
    >
      {/* Header */}
      <div className="mb-3">
        <h2
          className="font-text font-medium"
          style={{
            fontSize: '12px',
            color: '#191919',
            opacity: 0.6,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Transform
        </h2>
      </div>

      {/* Menu Items */}
      <div className="flex flex-col gap-1">
        {menuItems.map(({ mode, label, icon: Icon, disabled }) => {
          const isActive = viewMode === mode && !disabled

          return (
            <button
              key={mode}
              onClick={() => handleModeChange(mode)}
              disabled={disabled || isTransitioning}
              className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150"
              style={{
                backgroundColor: isActive ? 'rgba(254, 81, 2, 0.1)' : 'transparent',
                borderLeft: isActive ? '3px solid #FE5102' : '3px solid transparent',
                opacity: disabled ? 0.4 : 1,
                cursor: disabled || isTransitioning ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!disabled && !isTransitioning) {
                  e.currentTarget.style.backgroundColor = isActive
                    ? 'rgba(254, 81, 2, 0.1)'
                    : 'rgba(0, 0, 0, 0.03)'
                }
              }}
              onMouseLeave={(e) => {
                if (!disabled) {
                  e.currentTarget.style.backgroundColor = isActive
                    ? 'rgba(254, 81, 2, 0.1)'
                    : 'transparent'
                }
              }}
              aria-label={`${label} view${disabled ? ' (coming soon)' : ''}`}
              aria-current={isActive ? 'true' : undefined}
            >
              {/* Icon */}
              <Icon
                className="w-4 h-4 shrink-0"
                style={{
                  color: isActive ? '#FE5102' : '#191919',
                }}
                strokeWidth={2}
              />

              {/* Label */}
              <span
                className="font-text font-medium"
                style={{
                  fontSize: '14px',
                  color: isActive ? '#FE5102' : '#191919',
                }}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
