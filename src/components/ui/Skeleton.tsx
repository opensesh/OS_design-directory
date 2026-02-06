import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const roundedClasses = {
  none: '',
  sm: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
};

/**
 * Base skeleton component for loading states
 * Uses CSS animate-pulse for performance
 */
export function Skeleton({ className, rounded = 'md' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-[var(--bg-secondary)]',
        roundedClasses[rounded],
        className
      )}
      aria-hidden="true"
    />
  );
}

/**
 * Category card skeleton matching CategoryCard layout
 */
export function CategoryCardSkeleton() {
  return (
    <div className="aspect-[4/3] sm:aspect-square rounded-xl overflow-hidden bg-[var(--bg-secondary)]/40 border border-[var(--border-secondary)] p-4 flex flex-col">
      {/* Video/image area */}
      <Skeleton className="flex-1 w-full mb-4" rounded="lg" />

      {/* Bottom content */}
      <div className="space-y-2">
        {/* Category name */}
        <Skeleton className="w-24 h-5" rounded="md" />
        {/* Count */}
        <Skeleton className="w-16 h-4" rounded="md" />
      </div>
    </div>
  );
}

/**
 * Resource card skeleton matching ResourceCard layout
 */
export function ResourceCardSkeleton() {
  return (
    <div className="aspect-square rounded-xl overflow-hidden bg-[var(--bg-secondary)]/40 border border-[var(--border-secondary)] p-3 flex flex-col">
      {/* Thumbnail area */}
      <Skeleton className="flex-1 w-full mb-3" rounded="lg" />

      {/* Bottom content */}
      <div className="space-y-2">
        {/* Resource name */}
        <Skeleton className="w-3/4 h-4" rounded="md" />
        {/* Subcategory */}
        <Skeleton className="w-1/2 h-3" rounded="md" />
      </div>
    </div>
  );
}

/**
 * Table row skeleton matching InspoTable row layout
 */
export function TableRowSkeleton() {
  return (
    <tr className="border-b border-[var(--border-secondary)]">
      {/* Thumbnail */}
      <td className="p-4">
        <Skeleton className="w-10 h-10" rounded="lg" />
      </td>
      {/* Name */}
      <td className="p-4">
        <Skeleton className="w-32 h-4" rounded="md" />
      </td>
      {/* Category */}
      <td className="p-4">
        <Skeleton className="w-20 h-4" rounded="md" />
      </td>
      {/* Subcategory (hidden on mobile) */}
      <td className="p-4 hidden lg:table-cell">
        <Skeleton className="w-24 h-4" rounded="md" />
      </td>
      {/* Pricing badge */}
      <td className="p-4">
        <Skeleton className="w-16 h-6" rounded="full" />
      </td>
      {/* Rating */}
      <td className="p-4">
        <Skeleton className="w-12 h-4" rounded="md" />
      </td>
      {/* External link */}
      <td className="p-4">
        <Skeleton className="w-8 h-8" rounded="lg" />
      </td>
    </tr>
  );
}

/**
 * Search result skeleton matching SearchModal result items
 */
export function SearchResultSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="py-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3">
          {/* Thumbnail */}
          <Skeleton className="w-9 h-9" rounded="lg" />

          {/* Content */}
          <div className="flex-1 space-y-2">
            {/* Name */}
            <Skeleton className="w-3/4 h-4" rounded="md" />
            {/* Description */}
            <Skeleton className="w-1/2 h-3" rounded="md" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Card view grid skeleton for initial load
 */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <CategoryCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Table skeleton for initial InspoTable load
 */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-[var(--border-secondary)]">
          <th className="p-4 text-left">
            <Skeleton className="w-20 h-4" rounded="md" />
          </th>
          <th className="p-4 text-left">
            <Skeleton className="w-16 h-4" rounded="md" />
          </th>
          <th className="p-4 text-left">
            <Skeleton className="w-20 h-4" rounded="md" />
          </th>
          <th className="p-4 text-left hidden lg:table-cell">
            <Skeleton className="w-24 h-4" rounded="md" />
          </th>
          <th className="p-4 text-left">
            <Skeleton className="w-16 h-4" rounded="md" />
          </th>
          <th className="p-4 text-left">
            <Skeleton className="w-12 h-4" rounded="md" />
          </th>
          <th className="p-4" />
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRowSkeleton key={i} />
        ))}
      </tbody>
    </table>
  );
}
