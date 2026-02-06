import { motion } from 'framer-motion';
import { ChevronRight, LayoutGrid } from 'lucide-react';
import { getCategoryColor } from '../../types/resource';

interface CardViewBreadcrumbsProps {
  category: string | null;
  subcategory: string | null;
  resourceCount: number;
  onNavigateHome: () => void;
  onNavigateCategory: () => void;
}

export function CardViewBreadcrumbs({
  category,
  subcategory,
  resourceCount,
  onNavigateHome,
  onNavigateCategory
}: CardViewBreadcrumbsProps) {
  const categoryColor = category ? getCategoryColor(category) : null;

  return (
    <motion.nav
      className="flex items-center justify-between mb-6"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2 text-sm">
        {/* Home / All Categories */}
        <button
          onClick={onNavigateHome}
          className={`
            flex items-center gap-1.5 px-2 py-1 rounded-md
            transition-colors duration-200
            ${!category
              ? 'text-[var(--fg-primary)] bg-[var(--bg-secondary)]/40'
              : 'text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)]/30'
            }
          `}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>All Categories</span>
        </button>

        {/* Category breadcrumb */}
        {category && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-[var(--fg-secondary)]" />
            <button
              onClick={onNavigateCategory}
              className={`
                px-2 py-1 rounded-md transition-colors duration-200
                ${!subcategory
                  ? 'text-[var(--fg-primary)] bg-[var(--bg-secondary)]/40'
                  : 'text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-secondary)]/30'
                }
              `}
              style={{
                color: !subcategory && categoryColor ? categoryColor : undefined
              }}
            >
              {category}
            </button>
          </>
        )}

        {/* Subcategory breadcrumb */}
        {subcategory && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-[var(--fg-secondary)]" />
            <span
              className="px-2 py-1 rounded-md bg-[var(--bg-secondary)]/40"
              style={{ color: categoryColor || undefined }}
            >
              {subcategory}
            </span>
          </>
        )}
      </div>

      {/* Resource count */}
      <p className="text-sm text-[var(--fg-secondary)]">
        <span className="font-semibold text-brand-aperol">{resourceCount}</span>
        {' '}resource{resourceCount !== 1 ? 's' : ''}
      </p>
    </motion.nav>
  );
}
