import { useAppStore } from '../../store/useAppStore'

type Category = 'UX' | 'Brand' | 'Art' | 'Code' | null

export default function CategoryFilters() {
  const activeCategory = useAppStore((state) => state.activeCategory)
  const setCategory = useAppStore((state) => state.setCategory)

  const categories: { value: Category; label: string; color: string }[] = [
    { value: null, label: 'All', color: '#FE5102' },
    { value: 'UX', label: 'UX', color: '#00D9FF' },
    { value: 'Brand', label: 'Brand', color: '#FF6B6B' },
    { value: 'Art', label: 'Art', color: '#A78BFA' },
    { value: 'Code', label: 'Code', color: '#34D399' },
  ]

  return (
    <div className="fixed bottom-8 left-8 z-50 flex gap-2">
      {categories.map(({ value, label, color }) => (
        <button
          key={label}
          onClick={() => setCategory(value)}
          className={`
            px-3 py-1.5 rounded-full font-medium text-xs
            transition-all duration-200
            ${
              activeCategory === value
                ? 'shadow-lg'
                : 'opacity-60 hover:opacity-100'
            }
            border
          `}
          style={{
            backgroundColor: activeCategory === value ? color : 'rgba(0,0,0,0.4)',
            borderColor: color,
            color: activeCategory === value ? 'white' : color,
            backdropFilter: 'blur(10px)',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
