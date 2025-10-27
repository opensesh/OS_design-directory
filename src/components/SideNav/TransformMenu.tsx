import { useState } from 'react'
import { Circle, Sparkles, Grid3x3, List, ChevronRight, ChevronDown } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useAppStore } from '@/store/useAppStore'

type ViewMode = 'sphere' | 'galaxy' | 'grid'

interface MenuItem {
  mode: ViewMode | 'list'
  label: string
  icon: React.ComponentType<{ className?: string }>
  disabled?: boolean
}

const menuItems: MenuItem[] = [
  { mode: 'sphere', label: 'Sphere', icon: Circle },
  { mode: 'galaxy', label: 'Galaxy', icon: Sparkles },
  { mode: 'grid', label: 'Grid', icon: Grid3x3 },
  { mode: 'list', label: 'List', icon: List, disabled: true },
]

interface TransformMenuProps {
  isExpanded: boolean
}

export default function TransformMenu({ isExpanded }: TransformMenuProps) {
  const [isOpen, setIsOpen] = useState(true)
  const viewMode = useAppStore((state) => state.viewMode)
  const setViewMode = useAppStore((state) => state.setViewMode)
  const isTransitioning = useAppStore((state) => state.isTransitioning)

  const handleModeChange = (mode: ViewMode | 'list') => {
    // Don't allow mode changes during transitions or if disabled
    if (isTransitioning || mode === 'list') return

    setViewMode(mode as ViewMode)
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger
        className="flex w-full items-center justify-between px-4 py-3 text-brand-vanilla font-text text-[16px] hover:bg-brand-vanilla/[0.08] transition-colors duration-200"
        aria-label="Transform menu"
      >
        <span className={`transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
          Transform
        </span>
        {isExpanded && (
          isOpen ? (
            <ChevronDown className="h-4 w-4 transition-transform duration-200" />
          ) : (
            <ChevronRight className="h-4 w-4 transition-transform duration-200" />
          )
        )}
      </CollapsibleTrigger>

      <CollapsibleContent className="transition-all duration-200">
        <div className="flex flex-col">
          {menuItems.map(({ mode, label, icon: Icon, disabled }) => {
            const isActive = viewMode === mode && !disabled

            return (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                disabled={disabled || isTransitioning}
                className={`
                  relative flex items-center gap-3 px-4 py-3 text-[16px] font-text
                  transition-all duration-200
                  ${isActive ? 'text-brand-aperol' : 'text-brand-vanilla'}
                  ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-brand-vanilla/[0.08] cursor-pointer'}
                  ${isTransitioning && !disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                aria-label={`${label} view${disabled ? ' (coming soon)' : ''}`}
                aria-current={isActive ? 'true' : undefined}
              >
                {/* Active indicator - 3px left border */}
                {isActive && (
                  <div
                    className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand-aperol"
                    aria-hidden="true"
                  />
                )}

                {/* Icon */}
                <Icon
                  className={`h-5 w-5 flex-shrink-0 transition-colors duration-200 ${
                    isActive ? 'text-brand-aperol' : ''
                  }`}
                />

                {/* Label - only visible when expanded */}
                <span
                  className={`transition-opacity duration-200 ${
                    isExpanded ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {label}
                  {disabled && isExpanded && (
                    <span className="ml-2 text-xs text-brand-vanilla/40">(Soon)</span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
