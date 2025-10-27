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
    <div className="fixed top-6 left-6 z-50 flex gap-2">
      {categories.map(({ value, label, color }) => (
        <button
          key={label}
          onClick={() => setCategory(value)}
          className={`
            px-4 py-2 rounded-full font-medium text-sm
            transition-all duration-300
            ${
              activeCategory === value
                ? 'shadow-lg scale-105'
                : 'opacity-70 hover:opacity-100 hover:scale-105'
            }
            border-2
          `}
          style={{
            backgroundColor: activeCategory === value ? color : 'transparent',
            borderColor: color,
            color: activeCategory === value ? 'white' : color,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
