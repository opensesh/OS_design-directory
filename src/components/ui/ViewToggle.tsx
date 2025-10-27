import { useAppStore } from '../../store/useAppStore'

type ViewMode = 'sphere' | 'galaxy' | 'grid'

export default function ViewToggle() {
  const viewMode = useAppStore((state) => state.viewMode)
  const setViewMode = useAppStore((state) => state.setViewMode)
  const isTransitioning = useAppStore((state) => state.isTransitioning)

  const buttons: { mode: ViewMode; label: string }[] = [
    { mode: 'sphere', label: 'Sphere' },
    { mode: 'galaxy', label: 'Galaxy' },
    { mode: 'grid', label: 'Grid' },
  ]

  return (
    <div className="fixed top-6 right-6 z-50 flex gap-3">
      {buttons.map(({ mode, label }) => (
        <button
          key={mode}
          onClick={() => !isTransitioning && setViewMode(mode)}
          disabled={isTransitioning}
          className={`
            px-6 py-3 rounded-lg font-medium text-sm
            transition-all duration-300
            ${
              viewMode === mode
                ? 'bg-[#FE5102] text-white shadow-lg shadow-[#FE5102]/50'
                : 'bg-[#1E293B] text-gray-300 hover:bg-[#2D3B52] hover:text-white'
            }
            ${isTransitioning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            border border-gray-700/50
          `}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
