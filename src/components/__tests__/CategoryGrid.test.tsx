import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, act, fireEvent } from '@testing-library/react';
import { CategoryGrid } from '../card-view/CategoryGrid';
import type { NormalizedResource } from '../../types/resource';

// ── Mocks ────────────────────────────────────────────────────────────────

// Mock child components so we can test CategoryGrid in isolation
vi.mock('../card-view/CategoryCard', () => ({
  CategoryCard: ({ category, count, isExpanded, onClick }: any) => (
    <button
      data-testid={`category-card-${category}`}
      data-expanded={isExpanded}
      data-count={count}
      onClick={onClick}
    >
      {category} ({count})
    </button>
  ),
}));

vi.mock('../card-view/SubcategoryRow', () => {
  const React = require('react');
  return {
    SubcategoryRow: React.forwardRef(
      ({ category, columnIndex, columnCount, activeSubcategory }: any, ref: any) => (
        <div
          ref={ref}
          data-testid={`subcategory-row-${category}`}
          data-column-index={columnIndex}
          data-column-count={columnCount}
          data-active-subcategory={activeSubcategory}
        >
          Subcategories for {category}
        </div>
      ),
    ),
  };
});

// Mock framer-motion
vi.mock('framer-motion', () => {
  const React = require('react');
  const motion = new Proxy(
    {},
    {
      get: (_target: object, prop: string) =>
        React.forwardRef(({ children, ...rest }: any, ref: any) => {
          const {
            initial, animate, exit, transition, whileHover, whileTap,
            variants, layout, layoutId, onAnimationComplete, ...domProps
          } = rest;
          return React.createElement(prop, { ...domProps, ref }, children);
        }),
    },
  );
  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

// ── Helpers ──────────────────────────────────────────────────────────────

function makeResource(category: string, subCategory?: string): NormalizedResource {
  return {
    id: Math.random(),
    name: `${category} Resource`,
    url: 'https://example.com',
    description: null,
    category,
    subCategory: subCategory ?? null,
    pricing: null,
    featured: false,
    opensource: false,
    tags: null,
    count: null,
    tier: null,
    thumbnail: null,
    screenshot: null,
    gravityScore: 5,
  };
}

/**
 * Build a minimal resource set covering all six default categories.
 * Includes subcategories for Testing expansion behaviour.
 */
function makeResourceSet(): NormalizedResource[] {
  return [
    makeResource('Community', 'Forums'),
    makeResource('Community', 'Discord'),
    makeResource('Inspiration', 'Galleries'),
    makeResource('Inspiration', 'Portfolios'),
    makeResource('Learning', 'Courses'),
    makeResource('Learning', 'Tutorials'),
    makeResource('Templates', 'Landing Pages'),
    makeResource('Templates', 'Dashboards'),
    makeResource('Tools', 'Design'),
    makeResource('Tools', 'Dev'),
    makeResource('AI', 'Code Gen'),
    makeResource('AI', 'Image Gen'),
  ];
}

// ── Test Setup ───────────────────────────────────────────────────────────

describe('CategoryGrid', () => {
  const onCategoryClick = vi.fn();
  const onSubcategoryClick = vi.fn();
  let resources: NormalizedResource[];

  beforeEach(() => {
    vi.clearAllMocks();
    resources = makeResourceSet();
    // Default to desktop viewport
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
  });

  afterEach(cleanup);

  // ── Renders All Categories ─────────────────────────────────────────

  it('renders all six default categories', () => {
    render(
      <CategoryGrid
        resources={resources}
        expandedCategory={null}
        activeSubcategory={null}
        onCategoryClick={onCategoryClick}
        onSubcategoryClick={onSubcategoryClick}
      />,
    );

    expect(screen.getByTestId('category-card-Community')).toBeInTheDocument();
    expect(screen.getByTestId('category-card-Inspiration')).toBeInTheDocument();
    expect(screen.getByTestId('category-card-Learning')).toBeInTheDocument();
    expect(screen.getByTestId('category-card-Templates')).toBeInTheDocument();
    expect(screen.getByTestId('category-card-Tools')).toBeInTheDocument();
    expect(screen.getByTestId('category-card-AI')).toBeInTheDocument();
  });

  it('passes correct counts to CategoryCard', () => {
    render(
      <CategoryGrid
        resources={resources}
        expandedCategory={null}
        activeSubcategory={null}
        onCategoryClick={onCategoryClick}
        onSubcategoryClick={onSubcategoryClick}
      />,
    );

    // Each category has 2 resources in our test data
    const toolsCard = screen.getByTestId('category-card-Tools');
    expect(toolsCard).toHaveAttribute('data-count', '2');
  });

  // ── Category Sorting ───────────────────────────────────────────────

  it('sorts categories alphabetically with AI at the end', () => {
    render(
      <CategoryGrid
        resources={resources}
        expandedCategory={null}
        activeSubcategory={null}
        onCategoryClick={onCategoryClick}
        onSubcategoryClick={onSubcategoryClick}
      />,
    );

    const cards = screen.getAllByTestId(/^category-card-/);
    const names = cards.map((el) => el.textContent?.replace(/ \(\d+\)/, ''));

    // Alphabetical, but AI goes last
    expect(names).toEqual([
      'Community',
      'Inspiration',
      'Learning',
      'Templates',
      'Tools',
      'AI',
    ]);
  });

  // ── Expanding a Category ───────────────────────────────────────────

  it('calls onCategoryClick when a category card is clicked', () => {
    render(
      <CategoryGrid
        resources={resources}
        expandedCategory={null}
        activeSubcategory={null}
        onCategoryClick={onCategoryClick}
        onSubcategoryClick={onSubcategoryClick}
      />,
    );

    fireEvent.click(screen.getByTestId('category-card-Tools'));
    expect(onCategoryClick).toHaveBeenCalledWith('Tools');
  });

  it('shows SubcategoryRow when a category is expanded', () => {
    render(
      <CategoryGrid
        resources={resources}
        expandedCategory="Tools"
        activeSubcategory={null}
        onCategoryClick={onCategoryClick}
        onSubcategoryClick={onSubcategoryClick}
      />,
    );

    expect(screen.getByTestId('subcategory-row-Tools')).toBeInTheDocument();
    expect(screen.getByText('Subcategories for Tools')).toBeInTheDocument();
  });

  it('does not show SubcategoryRow when no category is expanded', () => {
    render(
      <CategoryGrid
        resources={resources}
        expandedCategory={null}
        activeSubcategory={null}
        onCategoryClick={onCategoryClick}
        onSubcategoryClick={onSubcategoryClick}
      />,
    );

    expect(screen.queryByTestId(/^subcategory-row-/)).toBeNull();
  });

  it('marks only the expanded card as expanded', () => {
    render(
      <CategoryGrid
        resources={resources}
        expandedCategory="Learning"
        activeSubcategory={null}
        onCategoryClick={onCategoryClick}
        onSubcategoryClick={onSubcategoryClick}
      />,
    );

    expect(screen.getByTestId('category-card-Learning')).toHaveAttribute('data-expanded', 'true');
    expect(screen.getByTestId('category-card-Tools')).toHaveAttribute('data-expanded', 'false');
    expect(screen.getByTestId('category-card-AI')).toHaveAttribute('data-expanded', 'false');
  });

  // ── SubcategoryRow Placement ───────────────────────────────────────

  it('places SubcategoryRow below the correct row (desktop, 3 cols)', () => {
    // Desktop: 3 columns
    // Row 0: Community, Inspiration, Learning
    // Row 1: Templates, Tools, AI
    render(
      <CategoryGrid
        resources={resources}
        expandedCategory="Tools"
        activeSubcategory={null}
        onCategoryClick={onCategoryClick}
        onSubcategoryClick={onSubcategoryClick}
      />,
    );

    const subRow = screen.getByTestId('subcategory-row-Tools');
    expect(subRow).toHaveAttribute('data-column-index', '1'); // Tools is index 1 in row 1
    expect(subRow).toHaveAttribute('data-column-count', '3');
  });

  it('places SubcategoryRow with correct index for first row items', () => {
    render(
      <CategoryGrid
        resources={resources}
        expandedCategory="Community"
        activeSubcategory={null}
        onCategoryClick={onCategoryClick}
        onSubcategoryClick={onSubcategoryClick}
      />,
    );

    const subRow = screen.getByTestId('subcategory-row-Community');
    expect(subRow).toHaveAttribute('data-column-index', '0'); // Community is first in row 0
  });

  // ── Responsive Column Count ────────────────────────────────────────

  it('updates to 1 column on mobile viewport', () => {
    // Start at mobile width
    Object.defineProperty(window, 'innerWidth', { value: 500, writable: true });

    render(
      <CategoryGrid
        resources={resources}
        expandedCategory="Tools"
        activeSubcategory={null}
        onCategoryClick={onCategoryClick}
        onSubcategoryClick={onSubcategoryClick}
      />,
    );

    // Trigger the resize handler
    act(() => { window.dispatchEvent(new Event('resize')); });

    const subRow = screen.getByTestId('subcategory-row-Tools');
    expect(subRow).toHaveAttribute('data-column-count', '1');
  });

  it('updates to 2 columns on tablet viewport', () => {
    Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });

    render(
      <CategoryGrid
        resources={resources}
        expandedCategory="Tools"
        activeSubcategory={null}
        onCategoryClick={onCategoryClick}
        onSubcategoryClick={onSubcategoryClick}
      />,
    );

    act(() => { window.dispatchEvent(new Event('resize')); });

    const subRow = screen.getByTestId('subcategory-row-Tools');
    expect(subRow).toHaveAttribute('data-column-count', '2');
  });

  it('recalculates row grouping when column count changes', () => {
    // Start desktop (3 cols): Row 0 [Community, Inspiration, Learning], Row 1 [Templates, Tools, AI]
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });

    const { rerender } = render(
      <CategoryGrid
        resources={resources}
        expandedCategory="Learning"
        activeSubcategory={null}
        onCategoryClick={onCategoryClick}
        onSubcategoryClick={onSubcategoryClick}
      />,
    );

    // Learning is in row 0, column 2 on desktop
    let subRow = screen.getByTestId('subcategory-row-Learning');
    expect(subRow).toHaveAttribute('data-column-index', '2');

    // Switch to tablet (2 cols): Row 0 [Community, Inspiration], Row 1 [Learning, Templates], ...
    Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });
    act(() => { window.dispatchEvent(new Event('resize')); });

    rerender(
      <CategoryGrid
        resources={resources}
        expandedCategory="Learning"
        activeSubcategory={null}
        onCategoryClick={onCategoryClick}
        onSubcategoryClick={onSubcategoryClick}
      />,
    );

    subRow = screen.getByTestId('subcategory-row-Learning');
    // Learning is now first in its row (index 0) on tablet
    expect(subRow).toHaveAttribute('data-column-index', '0');
    expect(subRow).toHaveAttribute('data-column-count', '2');
  });

  // ── Active Subcategory Passthrough ─────────────────────────────────

  it('passes activeSubcategory to SubcategoryRow', () => {
    render(
      <CategoryGrid
        resources={resources}
        expandedCategory="Tools"
        activeSubcategory="Design"
        onCategoryClick={onCategoryClick}
        onSubcategoryClick={onSubcategoryClick}
      />,
    );

    const subRow = screen.getByTestId('subcategory-row-Tools');
    expect(subRow).toHaveAttribute('data-active-subcategory', 'Design');
  });

  // ── Edge Cases ─────────────────────────────────────────────────────

  it('handles empty resource list gracefully', () => {
    render(
      <CategoryGrid
        resources={[]}
        expandedCategory={null}
        activeSubcategory={null}
        onCategoryClick={onCategoryClick}
        onSubcategoryClick={onSubcategoryClick}
      />,
    );

    // All categories should still render (with 0 counts)
    const cards = screen.getAllByTestId(/^category-card-/);
    expect(cards.length).toBe(6);

    // Each should have count 0
    cards.forEach(card => {
      expect(card).toHaveAttribute('data-count', '0');
    });
  });

  it('cleans up resize listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(
      <CategoryGrid
        resources={resources}
        expandedCategory={null}
        activeSubcategory={null}
        onCategoryClick={onCategoryClick}
        onSubcategoryClick={onSubcategoryClick}
      />,
    );

    unmount();
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    removeSpy.mockRestore();
  });
});
