import { useState, useRef, useEffect } from 'react'
import { Shapes, FolderOpen, BookOpenText, Settings } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import TransformOverlay from './TransformOverlay'
import Tooltip from './Tooltip'

/**
 * SideNav Component
 *
 * Minimal icon-only sidebar with fixed 56px width.
 * Clicking Transform shows separate overlay panel beside sidebar.
 *
 * Design specs from Figma (node-id=540-17001):
 * - Width: Fixed 56px (never expands inline)
 * - Background: rgba(255, 250, 238, 0.05) - Nearly transparent Vanilla
 * - Border: 1px solid rgba(255, 250, 238, 0.1)
 * - Border radius: 16px
 * - Padding: 16px vertical, 8px horizontal
 * - Gap between icons: 12px
 * - Icon size: 24px (w-6 h-6)
 * - Icon color: #FFFAEE (Vanilla)
 * - Icon opacity: 0.6 default, 1.0 on hover/active
 * - Active state: Aperol background rgba(254, 81, 2, 0.15)
 * - Backdrop filter: blur(24px) saturate(180%)
 * - Position: Fixed, left 24px, vertically centered
 * - z-index: 100 (top of stack)
 *
 * Interaction:
 * - Hover icon: Shows tooltip
 * - Click Transform: Toggles overlay panel
 * - Click disabled items: No action (tooltip only)
 * - Click outside: Closes overlay
 * - Escape key: Closes overlay
 */
export default function SideNav() {
  const [showTransformOverlay, setShowTransformOverlay] = useState(false)
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null)
  const sidenavRef = useRef<HTMLDivElement>(null)
  const viewMode = useAppStore((state) => state.viewMode)

  // Close overlay when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidenavRef.current && !sidenavRef.current.contains(event.target as Node)) {
        setShowTransformOverlay(false)
      }
    }

    if (showTransformOverlay) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showTransformOverlay])

  // Close overlay on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showTransformOverlay) {
        setShowTransformOverlay(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showTransformOverlay])

  const handleTransformClick = () => {
    setShowTransformOverlay(!showTransformOverlay)
    setHoveredIcon(null) // Clear tooltip when opening overlay
  }

  // Icon button shared styles
  const iconButtonClass = "flex items-center justify-center w-full p-3 rounded-lg transition-all duration-150"

  // Check if Transform has active visualization (sphere, galaxy, or grid)
  const isTransformActive = ['sphere', 'galaxy', 'grid'].includes(viewMode)

  return (
    <>
      {/* Minimal Icon-Only Sidebar - Always 56px wide */}
      <nav
        ref={sidenavRef}
        style={{
          position: 'fixed',
          left: '24px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 100,
          width: '56px',
          backgroundColor: 'rgba(255, 250, 238, 0.05)', // Nearly transparent
          border: '1px solid rgba(255, 250, 238, 0.1)',
          borderRadius: '16px',
          padding: '16px 8px',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        }}
        aria-label="Main navigation"
      >
        <div className="flex flex-col gap-3">
          {/* Transform Icon - Opens overlay */}
          <Tooltip label="Transform" show={hoveredIcon === 'transform' && !showTransformOverlay}>
            <button
              onClick={handleTransformClick}
              onMouseEnter={() => setHoveredIcon('transform')}
              onMouseLeave={() => setHoveredIcon(null)}
              className={iconButtonClass}
              style={{
                backgroundColor: isTransformActive
                  ? 'rgba(254, 81, 2, 0.15)'
                  : 'transparent',
              }}
              aria-label="Transform visualizations"
              aria-expanded={showTransformOverlay}
            >
              <Shapes
                className="w-6 h-6 transition-all duration-150"
                style={{
                  color: isTransformActive ? '#FE5102' : '#FFFAEE',
                  opacity: isTransformActive ? 1.0 : 0.6,
                }}
                strokeWidth={2}
              />
            </button>
          </Tooltip>

          {/* Categories Icon - Disabled */}
          <Tooltip label="Categories" show={hoveredIcon === 'categories'}>
            <button
              onMouseEnter={() => setHoveredIcon('categories')}
              onMouseLeave={() => setHoveredIcon(null)}
              className={iconButtonClass}
              style={{ opacity: 0.6 }}
              disabled
              aria-label="Categories (coming soon)"
            >
              <FolderOpen className="w-6 h-6" color="#FFFAEE" strokeWidth={2} />
            </button>
          </Tooltip>

          {/* Learn More Icon - Disabled */}
          <Tooltip label="Learn More" show={hoveredIcon === 'learn-more'}>
            <button
              onMouseEnter={() => setHoveredIcon('learn-more')}
              onMouseLeave={() => setHoveredIcon(null)}
              className={iconButtonClass}
              style={{ opacity: 0.6 }}
              disabled
              aria-label="Learn More (coming soon)"
            >
              <BookOpenText className="w-6 h-6" color="#FFFAEE" strokeWidth={2} />
            </button>
          </Tooltip>

          {/* Separator Line */}
          <div className="flex justify-center my-3">
            <div
              style={{
                width: '32px',
                height: '1px',
                backgroundColor: 'rgba(255, 250, 238, 0.2)',
              }}
            />
          </div>

          {/* Settings Icon - Disabled */}
          <Tooltip label="Settings" show={hoveredIcon === 'settings'}>
            <button
              onMouseEnter={() => setHoveredIcon('settings')}
              onMouseLeave={() => setHoveredIcon(null)}
              className={iconButtonClass}
              style={{ opacity: 0.6 }}
              disabled
              aria-label="Settings (coming soon)"
            >
              <Settings className="w-6 h-6" color="#FFFAEE" strokeWidth={2} />
            </button>
          </Tooltip>
        </div>
      </nav>

      {/* Transform Overlay Panel - Appears beside sidebar when Transform is clicked */}
      {showTransformOverlay && <TransformOverlay />}
    </>
  )
}
