import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../store/useAppStore'
import resourcesData from '../../data/resources.json'

export default function ResourceCard() {
  const selectedResource = useAppStore((state) => state.selectedResource)
  const setSelectedResource = useAppStore((state) => state.setSelectedResource)

  const { resources } = resourcesData
  const resource = resources.find((r) => r.id === selectedResource)

  if (!resource) return null

  const categoryColors: Record<string, string> = {
    UX: '#00D9FF',
    Brand: '#FF6B6B',
    Art: '#A78BFA',
    Code: '#34D399',
  }

  const borderColor = categoryColors[resource.category] || '#FE5102'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-6 right-6 z-50 w-96"
        style={{
          borderLeft: `4px solid ${borderColor}`,
        }}
      >
        <div className="bg-[#1E293B]/90 backdrop-blur-xl rounded-lg p-6 shadow-2xl border border-gray-700/50">
          {/* Close Button */}
          <button
            onClick={() => setSelectedResource(null)}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Category Badge */}
          <div
            className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-3"
            style={{
              backgroundColor: `${borderColor}20`,
              color: borderColor,
            }}
          >
            {resource.category}
          </div>

          {/* Resource Name */}
          <h3 className="text-xl font-bold text-white mb-2">{resource.name}</h3>

          {/* Description */}
          <p className="text-gray-300 text-sm mb-4">{resource.description}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {resource.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-800/50 rounded text-xs text-gray-400"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Visit Button */}
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-3 rounded-lg font-medium transition-all"
            style={{
              backgroundColor: borderColor,
              color: 'white',
            }}
          >
            Visit Resource →
          </a>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
