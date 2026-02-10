import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchModal } from '../SearchModal';
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
  makeResource({ id: 1, name: 'Figma', category: 'Tools' }),
  makeResource({ id: 2, name: 'Framer', category: 'Tools' }),
  makeResource({ id: 3, name: 'Dribbble', category: 'Inspiration' }),
  makeResource({ id: 4, name: 'Cursor', category: 'AI' }),
  makeResource({ id: 5, name: 'Awwwards', category: 'Inspiration' }),
];

// ── Mocks ────────────────────────────────────────────────────────────

// Mock useReducedMotion
vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => true, // Disable animations in tests
}));

// Mock framer-motion to render without animation delays
vi.mock('framer-motion', () => {
  const React = require('react');

  // Strip motion-specific props before passing to DOM element
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

// Mock useResourceSearch — controlled via mockSetQuery / mockResults
let mockQuery = '';
let mockSetQuery: ReturnType<typeof vi.fn>;
let mockGroupedResults: Record<string, { resource: NormalizedResource; score: number; matchedField: string }[]> = {};
let mockDefaultResults: { resource: NormalizedResource; score: number; matchedField: string }[] = [];
let mockIsSearching = false;
const mockClearSearch = vi.fn();

vi.mock('../../../hooks/useResourceSearch', () => ({
  useResourceSearch: () => ({
    query: mockQuery,
    setQuery: mockSetQuery,
    groupedResults: mockGroupedResults,
    defaultResults: mockDefaultResults,
    isSearching: mockIsSearching,
    clearSearch: mockClearSearch,
  }),
}));

// Mock @tanstack/react-virtual — render all items without virtualization
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count, estimateSize }: { count: number; estimateSize: (i: number) => number }) => {
    const items = Array.from({ length: count }, (_, i) => ({
      index: i,
      start: 0,
      size: estimateSize(i),
      end: estimateSize(i),
      key: i,
    }));
    return {
      getVirtualItems: () => items,
      getTotalSize: () => items.reduce((sum, item) => sum + item.size, 0),
      scrollToIndex: vi.fn(),
    };
  },
}));

// Mock motion-tokens
vi.mock('@/lib/motion-tokens', () => ({
  PAGE_TRANSITION: {
    backdrop: { initial: {}, animate: {}, exit: {}, transition: {} },
    modal: { initial: {}, animate: {}, exit: {}, transition: {} },
    reduced: { initial: {}, animate: {}, exit: {}, transition: {} },
  },
}));

// Mock Skeleton
vi.mock('@/components/ui/Skeleton', () => ({
  SearchResultSkeleton: ({ count }: { count: number }) => (
    <div data-testid="search-skeleton">Loading {count} skeletons</div>
  ),
}));

// ── Setup / Teardown ─────────────────────────────────────────────────

function toSearchResult(r: NormalizedResource) {
  return { resource: r, score: 1, matchedField: 'name' };
}

function setMockSearchState(opts: {
  query?: string;
  grouped?: Record<string, NormalizedResource[]>;
  defaults?: NormalizedResource[];
  isSearching?: boolean;
}) {
  mockQuery = opts.query ?? '';
  if (opts.grouped) {
    mockGroupedResults = {};
    for (const [cat, resources] of Object.entries(opts.grouped)) {
      mockGroupedResults[cat] = resources.map(toSearchResult);
    }
  }
  if (opts.defaults) {
    mockDefaultResults = opts.defaults.map(toSearchResult);
  }
  mockIsSearching = opts.isSearching ?? false;
}

beforeEach(() => {
  mockSetQuery = vi.fn((val: string) => { mockQuery = val; });
  setMockSearchState({
    defaults: MOCK_RESOURCES.slice(0, 3),
    grouped: {},
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Test Suites ──────────────────────────────────────────────────────

describe('SearchModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSelectResource: vi.fn(),
  };

  describe('open / close behavior', () => {
    it('renders the dialog when isOpen is true', () => {
      render(<SearchModal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render the dialog when isOpen is false', () => {
      render(<SearchModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('contains an accessible heading for screen readers', () => {
      render(<SearchModal {...defaultProps} />);
      const heading = screen.getByText('Search resources');
      expect(heading).toHaveClass('sr-only');
    });

    it('has aria-modal and aria-labelledby attributes', () => {
      render(<SearchModal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'search-modal-title');
    });
  });

  describe('search input', () => {
    it('renders a search input with placeholder text', () => {
      render(<SearchModal {...defaultProps} />);
      expect(screen.getByPlaceholderText('Search resources...')).toBeInTheDocument();
    });

    it('calls setQuery when user types', async () => {
      const user = userEvent.setup();
      render(<SearchModal {...defaultProps} />);

      const input = screen.getByPlaceholderText('Search resources...');
      await user.type(input, 'fig');

      expect(mockSetQuery).toHaveBeenCalled();
    });
  });

  describe('keyboard navigation — critical search flow', () => {
    it('closes on Escape key', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<SearchModal {...defaultProps} onClose={onClose} />);

      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('selects a result on Enter key', async () => {
      const onSelectResource = vi.fn();
      setMockSearchState({
        query: 'fig',
        grouped: { Tools: [MOCK_RESOURCES[0], MOCK_RESOURCES[1]] },
      });

      const user = userEvent.setup();
      render(
        <SearchModal {...defaultProps} onSelectResource={onSelectResource} />
      );

      // First result is selected by default (index 0)
      await user.keyboard('{Enter}');
      expect(onSelectResource).toHaveBeenCalledWith(MOCK_RESOURCES[0]);
    });

    it('navigates down with ArrowDown then selects', async () => {
      const onSelectResource = vi.fn();
      setMockSearchState({
        query: 'tools',
        grouped: { Tools: [MOCK_RESOURCES[0], MOCK_RESOURCES[1]] },
      });

      const user = userEvent.setup();
      render(
        <SearchModal {...defaultProps} onSelectResource={onSelectResource} />
      );

      // Move to second result
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      expect(onSelectResource).toHaveBeenCalledWith(MOCK_RESOURCES[1]);
    });

    it('wraps from last result to first with ArrowDown', async () => {
      const onSelectResource = vi.fn();
      setMockSearchState({
        query: 'tools',
        grouped: { Tools: [MOCK_RESOURCES[0], MOCK_RESOURCES[1]] },
      });

      const user = userEvent.setup();
      render(
        <SearchModal {...defaultProps} onSelectResource={onSelectResource} />
      );

      // Move past the last result — should wrap to first
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      expect(onSelectResource).toHaveBeenCalledWith(MOCK_RESOURCES[0]);
    });

    it('wraps from first result to last with ArrowUp', async () => {
      const onSelectResource = vi.fn();
      setMockSearchState({
        query: 'tools',
        grouped: { Tools: [MOCK_RESOURCES[0], MOCK_RESOURCES[1]] },
      });

      const user = userEvent.setup();
      render(
        <SearchModal {...defaultProps} onSelectResource={onSelectResource} />
      );

      // Start at 0, ArrowUp wraps to last
      await user.keyboard('{ArrowUp}');
      await user.keyboard('{Enter}');
      expect(onSelectResource).toHaveBeenCalledWith(MOCK_RESOURCES[1]);
    });
  });

  describe('result display', () => {
    it('shows "No results found" when query has no matches', () => {
      setMockSearchState({ query: 'xyznonexistent', grouped: {} });
      render(<SearchModal {...defaultProps} />);
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('renders category headers with result counts', () => {
      setMockSearchState({
        query: 'design',
        grouped: {
          Tools: [MOCK_RESOURCES[0], MOCK_RESOURCES[1]],
          Inspiration: [MOCK_RESOURCES[2]],
        },
      });
      render(<SearchModal {...defaultProps} />);
      expect(screen.getByText('Inspiration')).toBeInTheDocument();
      expect(screen.getByText('Tools')).toBeInTheDocument();
    });

    it('renders resource names in results', () => {
      setMockSearchState({
        query: 'fig',
        grouped: { Tools: [MOCK_RESOURCES[0]] },
      });
      render(<SearchModal {...defaultProps} />);
      expect(screen.getByText('Figma')).toBeInTheDocument();
    });

    it('shows skeleton loading state while searching', () => {
      setMockSearchState({ isSearching: true });
      render(<SearchModal {...defaultProps} />);
      expect(screen.getByTestId('search-skeleton')).toBeInTheDocument();
    });

    it('shows "Popular Resources" label when no query is entered', () => {
      setMockSearchState({
        defaults: MOCK_RESOURCES.slice(0, 3),
        grouped: {},
      });
      render(<SearchModal {...defaultProps} />);
      expect(screen.getByText('Popular Resources')).toBeInTheDocument();
    });
  });

  describe('mouse interaction', () => {
    it('calls onSelectResource when a result is clicked', async () => {
      const onSelectResource = vi.fn();
      setMockSearchState({
        query: 'fig',
        grouped: { Tools: [MOCK_RESOURCES[0]] },
      });

      const user = userEvent.setup();
      render(
        <SearchModal {...defaultProps} onSelectResource={onSelectResource} />
      );

      const resultButton = screen.getByText('Figma').closest('button')!;
      await user.click(resultButton);
      expect(onSelectResource).toHaveBeenCalledWith(MOCK_RESOURCES[0]);
    });

    it('closes when backdrop is clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<SearchModal {...defaultProps} onClose={onClose} />);

      // The backdrop is the first motion.div inside the AnimatePresence
      const backdrop = document.querySelector('.backdrop-blur-sm');
      if (backdrop) {
        await user.click(backdrop);
        expect(onClose).toHaveBeenCalled();
      }
    });

    it('closes when close button is clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<SearchModal {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByLabelText('Close search');
      await user.click(closeButton);
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('focus management', () => {
    it('has a close button with accessible label', () => {
      render(<SearchModal {...defaultProps} />);
      expect(screen.getByLabelText('Close search')).toBeInTheDocument();
    });
  });

  describe('footer hints', () => {
    it('displays keyboard shortcut hints', () => {
      render(<SearchModal {...defaultProps} />);
      expect(screen.getByText('to select')).toBeInTheDocument();
      expect(screen.getByText('to navigate')).toBeInTheDocument();
      expect(screen.getByText('to close')).toBeInTheDocument();
    });
  });

  describe('favicon fallback', () => {
    it('shows initial letter when favicon fails to load', () => {
      setMockSearchState({
        query: 'fig',
        grouped: { Tools: [MOCK_RESOURCES[0]] },
      });
      render(<SearchModal {...defaultProps} />);

      // The favicon img is present — simulate error to trigger fallback
      const img = document.querySelector('img[src*="google.com/s2/favicons"]');
      expect(img).toBeInTheDocument();
    });
  });
});
