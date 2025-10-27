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
    <div className="fixed top-8 right-8 z-50 flex gap-2">
      {buttons.map(({ mode, label }) => (
        <button
          key={mode}
          onClick={() => !isTransitioning && setViewMode(mode)}
          disabled={isTransitioning}
          className={`
            px-4 py-2 rounded-lg font-medium text-xs
            transition-all duration-200
            ${viewMode === mode ? 'bg-[#FE5102] text-white' : 'bg-black/40 text-gray-300 hover:bg-black/60'}
            ${isTransitioning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            border border-gray-700/30
          `}
          style={{ backdropFilter: 'blur(10px)' }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
