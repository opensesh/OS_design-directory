import { useState } from 'react'
import TransformMenu from './TransformMenu'

/**
 * SideNav Component
 *
 * Main navigation sidebar that provides access to visualization controls.
 * Features:
 * - Collapses to 64px width (icon-only mode)
 * - Expands to 280px on hover (shows labels)
 * - Smooth transitions with cubic-bezier easing
 * - Position above three.js canvas (z-40) but below header (z-50)
 * - Responsive design works across all breakpoints
 *
 * Architecture decisions:
 * - Uses Zustand store for state management (no prop drilling)
 * - Hover-based expansion (not click-based)
 * - Keyboard accessible with proper ARIA labels
 * - Integrates with existing brand design tokens
 */
export default function SideNav() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <nav
      className="fixed left-0 top-0 h-screen z-40 transition-all duration-200 ease-out"
      style={{
        width: isExpanded ? '280px' : '64px',
        backgroundColor: 'rgba(25, 25, 25, 0.98)', // Charcoal 98% opacity
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      aria-label="Main navigation"
    >
      <div className="flex flex-col h-full py-6">
        {/* Transform Section - Active visualization controls */}
        <TransformMenu isExpanded={isExpanded} />

        {/* Spacer to push future sections down if needed */}
        <div className="flex-1" />

        {/*
          FUTURE SECTION: Categories
          Will contain category filters (UX, Brand, Art, Code)
          Uncommenting this section will add category navigation once data source is implemented
        */}
        {/*
        <div className="border-t border-brand-vanilla/10 pt-4">
          <CategoryMenu isExpanded={isExpanded} />
        </div>
        */}

        {/*
          FUTURE SECTION: Learn More
          Will contain links to documentation, help, about, etc.
          Uncommenting this section will add footer links
        */}
        {/*
        <div className="border-t border-brand-vanilla/10 pt-4 mt-auto">
          <LearnMoreMenu isExpanded={isExpanded} />
        </div>
        */}
      </div>
    </nav>
  )
}
