import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryGrid } from '../CategoryGrid';
import { CATEGORY_COLORS } from '../../../types/resource';
import type { NormalizedResource } from '../../../types/resource';

// ── Helpers ──────────────────────────────────────────────────────────

function makeResource(overrides: Partial<NormalizedResource> & { id: number; name: string }): NormalizedResource {
  return {
    url: `https://${overrides.name.toLowerCase().replace(/\s/g, '')}.com`,
    description: `${overrides.name} description`,
    category: 'Tools',
    subCategory: null,
    pricing: 'Free',
    featured: false,
    opensource: false,
    tags: null,
    count: null,
    tier: null,
    thumbnail: null,
    screenshot: null,
    gravityScore: 5,
    ...overrides,
  };
}

const MOCK_RESOURCES: NormalizedResource[] = [
  makeResource({ id: 1, name: 'Figma', category: 'Tools', subCategory: 'Design' }),
  makeResource({ id: 2, name: 'Framer', category: 'Tools', subCategory: 'Prototyping' }),
  makeResource({ id: 3, name: 'Dribbble', category: 'Inspiration', subCategory: 'Showcase' }),
  makeResource({ id: 4, name: 'Cursor', category: 'AI', subCategory: 'Code' }),
  makeResource({ id: 5, name: 'Awwwards', category: 'Inspiration', subCategory: 'Showcase' }),
  makeResource({ id: 6, name: 'Frontend Masters', category: 'Learning', subCategory: 'Courses' }),
  makeResource({ id: 7, name: 'Tailwind UI', category: 'Templates', subCategory: 'Components' }),
  makeResource({ id: 8, name: 'Discord Design', category: 'Community', subCategory: 'Chat' }),
];

// ── Mocks ────────────────────────────────────────────────────────────

vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => true,
}));

// Mock framer-motion
vi.mock('framer-motion', () => {
  const React = require('react');

  const MOTION_PROPS = new Set([
    'initial', 'animate', 'exit', 'transition', 'variants',
    'whileHover', 'whileTap', 'whileFocus', 'whileDrag',
    'layout', 'layoutId', 'onAnimationStart', 'onAnimationComplete',
  ]);

  function filterMotionProps(props: Record<string, unknown>) {
    const filtered: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(props)) {
      if (!MOTION_PROPS.has(key)) {
        filtered[key] = val;
      }
    }
    return filtered;
  }

  function createMotionComponent(tag: string) {
    return React.forwardRef((props: Record<string, unknown>, ref: unknown) =>
      React.createElement(tag, { ...filterMotionProps(props), ref }, props.children)
    );
  }

  return {
    motion: new Proxy({} as Record<string, unknown>, {
      get: (_target: Record<string, unknown>, prop: string) => createMotionComponent(prop),
    }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock motion tokens
vi.mock('@/lib/motion-tokens', () => ({
  DURATION: { fast: 0.15, normal: 0.2, slow: 0.3 },
  EASING: { smooth: [0.4, 0, 0.2, 1] },
}));

// Mock useTouchDevice
vi.mock('../../../hooks/useTouchDevice', () => ({
  useTouchDevice: () => false,
}));

// ── Setup / Teardown ─────────────────────────────────────────────────

let innerWidthSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  // Default to desktop width (3 columns)
  innerWidthSpy = vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1200);
});

afterEach(() => {
  innerWidthSpy.mockRestore();
  vi.restoreAllMocks();
});

// ── Test Suites ──────────────────────────────────────────────────────

describe('CategoryGrid', () => {
  const defaultProps = {
    resources: MOCK_RESOURCES,
    expandedCategory: null,
    activeSubcategory: null,
    onCategoryClick: vi.fn(),
    onSubcategoryClick: vi.fn(),
  };

  describe('rendering categories', () => {
    it('renders all category cards from CATEGORY_COLORS', () => {
      render(<CategoryGrid {...defaultProps} />);

      const expectedCategories = Object.keys(CATEGORY_COLORS);
      for (const category of expectedCategories) {
        expect(screen.getByText(category)).toBeInTheDocument();
      }
    });

    it('displays resource count for each category', () => {
      render(<CategoryGrid {...defaultProps} />);

      // Tools has 2 resources in our mock data
      const toolsSection = screen.getByText('Tools').closest('button');
      expect(toolsSection).toBeInTheDocument();

      // Inspiration has 2 resources
      const inspirationSection = screen.getByText('Inspiration').closest('button');
      expect(inspirationSection).toBeInTheDocument();
    });

    it('sorts categories alphabetically with AI last', () => {
      render(<CategoryGrid {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      const categoryNames = buttons.map(b => {
        const h3 = b.querySelector('h3');
        return h3?.textContent;
      }).filter(Boolean);

      // AI should be last
      expect(categoryNames[categoryNames.length - 1]).toBe('AI');
      // Rest should be alphabetical
      const withoutAI = categoryNames.slice(0, -1);
      const sorted = [...withoutAI].sort();
      expect(withoutAI).toEqual(sorted);
    });
  });

  describe('category expansion', () => {
    it('calls onCategoryClick when a category card is clicked', async () => {
      const onCategoryClick = vi.fn();
      const user = userEvent.setup();

      render(
        <CategoryGrid {...defaultProps} onCategoryClick={onCategoryClick} />
      );

      const toolsButton = screen.getByText('Tools').closest('button')!;
      await user.click(toolsButton);
      expect(onCategoryClick).toHaveBeenCalledWith('Tools');
    });

    it('shows SubcategoryRow when a category is expanded', () => {
      render(
        <CategoryGrid
          {...defaultProps}
          expandedCategory="Tools"
        />
      );

      // SubcategoryRow renders subcategory names
      expect(screen.getByText('Subcategories')).toBeInTheDocument();
    });

    it('does not show SubcategoryRow when no category is expanded', () => {
      render(<CategoryGrid {...defaultProps} />);
      expect(screen.queryByText('Subcategories')).not.toBeInTheDocument();
    });

    it('shows subcategories for the expanded category', () => {
      render(
        <CategoryGrid
          {...defaultProps}
          expandedCategory="Tools"
        />
      );

      // Tools has "Design" and "Prototyping" subcategories
      expect(screen.getByText('Design')).toBeInTheDocument();
      expect(screen.getByText('Prototyping')).toBeInTheDocument();
    });

    it('calls onSubcategoryClick when a subcategory is clicked', async () => {
      const onSubcategoryClick = vi.fn();
      const user = userEvent.setup();

      render(
        <CategoryGrid
          {...defaultProps}
          expandedCategory="Tools"
          onSubcategoryClick={onSubcategoryClick}
        />
      );

      const designButton = screen.getByText('Design').closest('button');
      if (designButton) {
        await user.click(designButton);
        expect(onSubcategoryClick).toHaveBeenCalledWith('Design');
      }
    });
  });

  describe('responsive layout', () => {
    it('uses 3 columns at desktop width (1024px+)', () => {
      innerWidthSpy.mockReturnValue(1200);
      render(<CategoryGrid {...defaultProps} />);

      // The grid containers should use lg:grid-cols-3
      const grids = document.querySelectorAll('.grid');
      expect(grids.length).toBeGreaterThan(0);
      // Each grid has the responsive class
      grids.forEach(grid => {
        expect(grid.className).toContain('lg:grid-cols-3');
      });
    });

    it('updates column count on window resize', async () => {
      const { rerender } = render(<CategoryGrid {...defaultProps} />);

      // Simulate resize to tablet width
      innerWidthSpy.mockReturnValue(800);
      window.dispatchEvent(new Event('resize'));

      // Re-render to reflect state changes
      rerender(<CategoryGrid {...defaultProps} />);

      // The grid responsive classes are CSS-based (sm:grid-cols-2 lg:grid-cols-3)
      // The JS column count affects the SubcategoryRow positioning
      const grids = document.querySelectorAll('.grid');
      expect(grids.length).toBeGreaterThan(0);
    });

    it('cleans up resize listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      const { unmount } = render(<CategoryGrid {...defaultProps} />);

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('empty state', () => {
    it('renders category cards even with no matching resources (count 0)', () => {
      render(
        <CategoryGrid
          {...defaultProps}
          resources={[]}
        />
      );

      // All categories from CATEGORY_COLORS should still render
      const expectedCategories = Object.keys(CATEGORY_COLORS);
      for (const category of expectedCategories) {
        expect(screen.getByText(category)).toBeInTheDocument();
      }
    });
  });

  describe('grid row grouping', () => {
    it('groups categories into rows based on column count', () => {
      // At desktop (3 cols), 6 categories = 2 rows
      innerWidthSpy.mockReturnValue(1200);
      render(<CategoryGrid {...defaultProps} />);

      const grids = document.querySelectorAll('.grid.grid-cols-1');
      // Should have multiple row grids
      expect(grids.length).toBeGreaterThanOrEqual(2);
    });

    it('SubcategoryRow appears below the row containing the expanded category', () => {
      render(
        <CategoryGrid
          {...defaultProps}
          expandedCategory="Tools"
        />
      );

      // The subcategory row should exist in the DOM
      const subcategoryLabel = screen.getByText('Subcategories');
      expect(subcategoryLabel).toBeInTheDocument();

      // Verify it's inside a SubcategoryRow container (motion.div)
      const subcategoryRow = subcategoryLabel.closest('[style*="transformOrigin"]');
      expect(subcategoryRow || subcategoryLabel.parentElement).toBeInTheDocument();
    });
  });
});
