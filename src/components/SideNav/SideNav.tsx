import { useState, useRef, useEffect } from 'react'
import { Shapes, Globe, Atom, Grid3x3, List, FolderOpen, BookOpenText, Settings, ChevronRight } from 'lucide-react'
import { useAppStore, ViewMode } from '@/store/useAppStore'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import Tooltip from './Tooltip'

/**
 * SideNav Component
 *
 * Single unified sidebar that expands inline from 64px → 260px.
 * Uses shadcn Collapsible for Transform section expansion.
 *
 * Design specs from Figma (node-id=540-8953, 540-15202, 540-17266):
 *
 * CLOSED STATE (64px):
 * - Width: 64px
 * - Background: #FFFAEE (Vanilla, fully opaque)
 * - Border: Right border only, 1px solid #E2E8F0
 * - Border radius: 4px
 * - Padding: 8px
 * - Icon size: 16px
 * - Button: min-height 40px, padding 16px/8px, border-radius 6px
 *
 * OPEN STATE (260px):
 * - Width: 260px
 * - Background: #FFFAEE (Vanilla, fully opaque)
 * - Border: Right border only, 1px solid #E2E8F0
 * - Border radius: 4px
 * - Padding: 16px
 * - Gap between sections: 63px
 *
 * TRANSFORM SECTION (when expanded):
 * - Header: Icon + "Transform" + chevron (rotated 180° when open)
 * - Active background: #F1F5F9
 * - Sub-items: Sphere, Galaxy, Grid, List
 * - Sub-item padding: 31px left
 * - Sub-item text: 12px (not 16px!)
 *
 * Interaction:
 * - Click Transform → Expands sidebar to 260px + opens Collapsible
 * - Click sub-item → Calls setViewMode, updates particle system
 * - Click outside → Collapses sidebar to 64px
 * - Hover closed icon → Shows tooltip
 */
export default function SideNav() {
  const [isOpen, setIsOpen] = useState(false)
  const [isTransformOpen, setIsTransformOpen] = useState(false)
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null)
  const sidenavRef = useRef<HTMLDivElement>(null)

  const viewMode = useAppStore((state) => state.viewMode)
  const setViewMode = useAppStore((state) => state.setViewMode)
  const isTransitioning = useAppStore((state) => state.isTransitioning)

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidenavRef.current && !sidenavRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setIsTransformOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close sidebar on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setIsTransformOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const handleTransformClick = () => {
    if (!isOpen) {
      // Opening from closed state
      setIsOpen(true)
      setIsTransformOpen(true)
    } else {
      // Already open, just toggle Transform section
      setIsTransformOpen(!isTransformOpen)
    }
    setHoveredIcon(null)
  }

  const handleModeChange = (mode: ViewMode) => {
    if (isTransitioning) return
    setViewMode(mode)
  }

  // Check if Transform section is active
  const isTransformActive = ['sphere', 'galaxy', 'grid'].includes(viewMode)

  // Button base styles
  const buttonBaseClass = "flex items-center gap-0 w-full min-h-[40px] px-4 py-2 rounded-md transition-colors duration-150"

  return (
    <nav
      ref={sidenavRef}
      style={{
        position: 'fixed',
        left: '24px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 100,
        width: isOpen ? '260px' : '64px',
        backgroundColor: '#FFFAEE',
        borderRight: '1px solid var(--border-secondary)',
        borderRadius: '4px',
        padding: isOpen ? '16px' : '8px',
        transition: 'width 200ms ease-out, padding 200ms ease-out',
      }}
      aria-label="Main navigation"
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          gap: isOpen ? '63px' : '0',
        }}
      >
        {/* Top Section: Transform, Categories, Learn More */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Transform Section with Collapsible */}
          <Collapsible open={isTransformOpen} onOpenChange={setIsTransformOpen}>
            <Tooltip label="Transform" show={hoveredIcon === 'transform' && !isOpen}>
              <CollapsibleTrigger asChild>
                <button
                  onClick={handleTransformClick}
                  onMouseEnter={() => !isOpen && setHoveredIcon('transform')}
                  onMouseLeave={() => setHoveredIcon(null)}
                  className={buttonBaseClass}
                  style={{
                    backgroundColor: isTransformActive ? '#F1F5F9' : 'transparent',
                    justifyContent: isOpen ? 'space-between' : 'center',
                  }}
                  aria-label="Transform visualizations"
                  aria-expanded={isTransformOpen}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', paddingRight: isOpen ? 0 : 0 }}>
                      <Shapes
                        size={16}
                        color="#191919"
                        strokeWidth={2}
                      />
                    </div>
                    {isOpen && (
                      <span
                        style={{
                          fontFamily: "'Neue Haas Grotesk Text Pro', sans-serif",
                          fontSize: '16px',
                          fontWeight: 500,
                          color: '#191919',
                          lineHeight: 1.25,
                        }}
                      >
                        Transform
                      </span>
                    )}
                  </div>
                  {isOpen && (
                    <ChevronRight
                      size={6}
                      color="#020617"
                      strokeWidth={2}
                      style={{
                        transform: isTransformOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 150ms ease',
                      }}
                    />
                  )}
                </button>
              </CollapsibleTrigger>
            </Tooltip>

            <CollapsibleContent>
              {/* Transform Sub-items: Sphere, Galaxy, Grid, List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {/* Sphere */}
                <button
                  onClick={() => handleModeChange('sphere')}
                  disabled={isTransitioning}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    paddingLeft: '31px',
                    paddingRight: '16px',
                    paddingTop: '4px',
                    paddingBottom: '4px',
                    width: '100%',
                    background: viewMode === 'sphere' ? '#F1F5F9' : 'transparent',
                    border: 'none',
                    cursor: isTransitioning ? 'not-allowed' : 'pointer',
                    opacity: isTransitioning ? 0.5 : 1,
                  }}
                >
                  <Globe size={16} color="#191919" strokeWidth={2} />
                  <span
                    style={{
                      fontFamily: "'Neue Haas Grotesk Text Pro', sans-serif",
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#191919',
                      lineHeight: 1.25,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flex: '1 0 0',
                    }}
                  >
                    Sphere
                  </span>
                </button>

                {/* Galaxy */}
                <button
                  onClick={() => handleModeChange('galaxy')}
                  disabled={isTransitioning}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    paddingLeft: '31px',
                    paddingRight: '16px',
                    paddingTop: '4px',
                    paddingBottom: '4px',
                    width: '100%',
                    background: viewMode === 'galaxy' ? '#F1F5F9' : 'transparent',
                    border: 'none',
                    cursor: isTransitioning ? 'not-allowed' : 'pointer',
                    opacity: isTransitioning ? 0.5 : 1,
                  }}
                >
                  <Atom size={16} color="#191919" strokeWidth={2} />
                  <span
                    style={{
                      fontFamily: "'Neue Haas Grotesk Text Pro', sans-serif",
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#191919',
                      lineHeight: 1.25,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flex: '1 0 0',
                    }}
                  >
                    Galaxy
                  </span>
                </button>

                {/* Grid */}
                <button
                  onClick={() => handleModeChange('grid')}
                  disabled={isTransitioning}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    paddingLeft: '31px',
                    paddingRight: '16px',
                    paddingTop: '4px',
                    paddingBottom: '4px',
                    width: '100%',
                    background: viewMode === 'grid' ? '#F1F5F9' : 'transparent',
                    border: 'none',
                    cursor: isTransitioning ? 'not-allowed' : 'pointer',
                    opacity: isTransitioning ? 0.5 : 1,
                  }}
                >
                  <Grid3x3 size={16} color="#191919" strokeWidth={2} />
                  <span
                    style={{
                      fontFamily: "'Neue Haas Grotesk Text Pro', sans-serif",
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#191919',
                      lineHeight: 1.25,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flex: '1 0 0',
                    }}
                  >
                    Grid
                  </span>
                </button>

                {/* List (disabled) */}
                <button
                  disabled
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    paddingLeft: '31px',
                    paddingRight: '16px',
                    paddingTop: '4px',
                    paddingBottom: '4px',
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'not-allowed',
                    opacity: 0.5,
                  }}
                >
                  <List size={16} color="#191919" strokeWidth={2} />
                  <span
                    style={{
                      fontFamily: "'Neue Haas Grotesk Text Pro', sans-serif",
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#191919',
                      lineHeight: 1.25,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flex: '1 0 0',
                    }}
                  >
                    List
                  </span>
                </button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Categories Section */}
          <Tooltip label="Categories" show={hoveredIcon === 'categories' && !isOpen}>
            <button
              onMouseEnter={() => !isOpen && setHoveredIcon('categories')}
              onMouseLeave={() => setHoveredIcon(null)}
              onClick={() => setIsOpen(true)}
              className={buttonBaseClass}
              style={{
                backgroundColor: 'transparent',
                justifyContent: isOpen ? 'space-between' : 'center',
              }}
              disabled
              aria-label="Categories (coming soon)"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', paddingRight: isOpen ? 0 : 0 }}>
                  <FolderOpen size={16} color="#191919" strokeWidth={2} />
                </div>
                {isOpen && (
                  <span
                    style={{
                      fontFamily: "'Neue Haas Grotesk Text Pro', sans-serif",
                      fontSize: '16px',
                      fontWeight: 500,
                      color: '#191919',
                      lineHeight: 1.25,
                    }}
                  >
                    Categories
                  </span>
                )}
              </div>
              {isOpen && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    backgroundColor: '#191919',
                    borderRadius: '9999px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Neue Haas Grotesk Text Pro', sans-serif",
                      fontSize: '16px',
                      fontWeight: 500,
                      color: '#F8FAFC',
                      lineHeight: 1.25,
                      textAlign: 'center',
                    }}
                  >
                    4
                  </span>
                </div>
              )}
            </button>
          </Tooltip>

          {/* Learn More Section */}
          <Tooltip label="Learn More" show={hoveredIcon === 'learn-more' && !isOpen}>
            <button
              onMouseEnter={() => !isOpen && setHoveredIcon('learn-more')}
              onMouseLeave={() => setHoveredIcon(null)}
              onClick={() => setIsOpen(true)}
              className={buttonBaseClass}
              style={{
                backgroundColor: 'transparent',
                justifyContent: isOpen ? 'flex-start' : 'center',
              }}
              disabled
              aria-label="Learn More (coming soon)"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', paddingRight: isOpen ? 0 : 0 }}>
                  <BookOpenText size={16} color="#191919" strokeWidth={2} />
                </div>
                {isOpen && (
                  <span
                    style={{
                      fontFamily: "'Neue Haas Grotesk Text Pro', sans-serif",
                      fontSize: '16px',
                      fontWeight: 500,
                      color: '#191919',
                      lineHeight: 1.25,
                    }}
                  >
                    Learn More
                  </span>
                )}
              </div>
            </button>
          </Tooltip>
        </div>

        {/* Bottom Section: Settings */}
        <Tooltip label="Settings" show={hoveredIcon === 'settings' && !isOpen}>
          <button
            onMouseEnter={() => !isOpen && setHoveredIcon('settings')}
            onMouseLeave={() => setHoveredIcon(null)}
            className={buttonBaseClass}
            style={{
              backgroundColor: 'transparent',
              justifyContent: 'center',
            }}
            disabled
            aria-label="Settings (coming soon)"
          >
            <Settings size={16} color="#191919" strokeWidth={2} />
          </button>
        </Tooltip>
      </div>
    </nav>
  )
}
