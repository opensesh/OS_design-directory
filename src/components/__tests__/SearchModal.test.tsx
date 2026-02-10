import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SearchModal } from '../search/SearchModal';
import type { SearchResult, GroupedSearchResults } from '../../hooks/useResourceSearch';
import type { NormalizedResource } from '../../types/resource';

// ── Helpers ──────────────────────────────────────────────────────────────

function makeResource(overrides: Partial<NormalizedResource> = {}): NormalizedResource {
  return {
    id: 1,
    name: 'Figma',
    url: 'https://figma.com',
    description: 'Collaborative design tool',
    category: 'Tools',
    subCategory: 'Design',
    pricing: 'Freemium',
    featured: false,
    opensource: false,
    tags: ['design'],
    count: null,
    tier: null,
    thumbnail: null,
    screenshot: null,
    gravityScore: 8,
    ...overrides,
  };
}

function makeSearchResult(overrides: Partial<NormalizedResource> = {}): SearchResult {
  return {
    resource: makeResource(overrides),
    score: 0.9,
    matchedField: 'name',
  };
}

// ── Mocks ────────────────────────────────────────────────────────────────

const mockSetQuery = vi.fn();
const mockClearSearch = vi.fn();

// Default mock return value — updated per-test when needed
let mockSearchReturn = {
  query: '',
  setQuery: mockSetQuery,
  results: [] as SearchResult[],
  groupedResults: {} as GroupedSearchResults,
  defaultResults: [] as SearchResult[],
  isSearching: false,
  clearSearch: mockClearSearch,
  metadata: null,
};

vi.mock('../../hooks/useResourceSearch', () => ({
  useResourceSearch: () => mockSearchReturn,
}));

vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

// Framer-motion mock — render children without animation
vi.mock('framer-motion', () => {
  const React = require('react');
  const motion = new Proxy(
    {},
    {
      get: (_target: object, prop: string) =>
        React.forwardRef(({ children, ...rest }: any, ref: any) => {
          // Strip framer-specific props
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

// Virtualizer mock — render all items directly without virtualisation
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count, estimateSize }: any) => {
    const items = Array.from({ length: count }, (_, i) => ({
      index: i,
      start: 0,
      size: estimateSize(i),
      end: estimateSize(i),
      key: i,
      lane: 0,
    }));
    return {
      getVirtualItems: () => items,
      getTotalSize: () => items.reduce((sum: number, item: any) => sum + item.size, 0),
      scrollToIndex: vi.fn(),
      measureElement: vi.fn(),
    };
  },
}));

// Mock the skeleton component
vi.mock('@/components/ui/Skeleton', () => ({
  SearchResultSkeleton: () => <div data-testid="search-skeleton">Loading...</div>,
}));

// Mock motion tokens
vi.mock('@/lib/motion-tokens', () => ({
  PAGE_TRANSITION: {
    backdrop: { initial: {}, animate: {}, exit: {}, transition: {} },
    modal: { initial: {}, animate: {}, exit: {}, transition: {} },
    reduced: { initial: {}, animate: {}, exit: {}, transition: {} },
  },
  DURATION: { fast: 0.15, normal: 0.2, slow: 0.3 },
  EASING: { smooth: [0.4, 0, 0.2, 1] },
}));

// ── Test Data ────────────────────────────────────────────────────────────

const toolResults: SearchResult[] = [
  makeSearchResult({ id: 1, name: 'Figma', category: 'Tools' }),
  makeSearchResult({ id: 2, name: 'Framer', category: 'Tools' }),
];
const learningResults: SearchResult[] = [
  makeSearchResult({ id: 3, name: 'Frontend Masters', category: 'Learning' }),
];

const defaultGrouped: GroupedSearchResults = {
  Tools: toolResults,
  Learning: learningResults,
};

const allDefaults: SearchResult[] = [...toolResults, ...learningResults];

// ── Tests ────────────────────────────────────────────────────────────────

describe('SearchModal', () => {
  const onClose = vi.fn();
  const onSelectResource = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchReturn = {
      query: '',
      setQuery: mockSetQuery,
      results: [],
      groupedResults: {},
      defaultResults: allDefaults,
      isSearching: false,
      clearSearch: mockClearSearch,
      metadata: null,
    };
  });

  afterEach(cleanup);

  // ── Rendering & Portal ─────────────────────────────────────────────

  it('renders at document.body level via portal', () => {
    render(
      <SearchModal isOpen={true} onClose={onClose} onSelectResource={onSelectResource} />,
    );

    // The modal should be a child of document.body, not nested inside a test wrapper
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog!.parentElement?.closest('[role="dialog"]')).toBeNull();
  });

  it('does not render when isOpen is false', () => {
    render(
      <SearchModal isOpen={false} onClose={onClose} onSelectResource={onSelectResource} />,
    );

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('has proper aria attributes for accessibility', () => {
    render(
      <SearchModal isOpen={true} onClose={onClose} onSelectResource={onSelectResource} />,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'search-modal-title');
    expect(screen.getByText('Search resources')).toBeInTheDocument();
  });

  // ── Close Behaviours ───────────────────────────────────────────────

  it('closes on Escape key', () => {
    render(
      <SearchModal isOpen={true} onClose={onClose} onSelectResource={onSelectResource} />,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when clicking the backdrop', () => {
    render(
      <SearchModal isOpen={true} onClose={onClose} onSelectResource={onSelectResource} />,
    );

    // The outer dialog wrapper acts as the backdrop click target
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalled();
  });

  it('closes when clicking the close button', () => {
    render(
      <SearchModal isOpen={true} onClose={onClose} onSelectResource={onSelectResource} />,
    );

    const closeBtn = screen.getByLabelText('Close search');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ── Search Input ───────────────────────────────────────────────────

  it('has a search input with correct placeholder', () => {
    render(
      <SearchModal isOpen={true} onClose={onClose} onSelectResource={onSelectResource} />,
    );

    const input = screen.getByPlaceholderText('Search resources...');
    expect(input).toBeInTheDocument();
  });

  it('calls setQuery when typing into the search input', () => {
    render(
      <SearchModal isOpen={true} onClose={onClose} onSelectResource={onSelectResource} />,
    );

    const input = screen.getByPlaceholderText('Search resources...');
    fireEvent.change(input, { target: { value: 'figma' } });
    expect(mockSetQuery).toHaveBeenCalledWith('figma');
  });

  // ── Keyboard Navigation ────────────────────────────────────────────

  it('Arrow Down moves selection forward and wraps around', () => {
    mockSearchReturn = {
      ...mockSearchReturn,
      defaultResults: allDefaults,
    };

    render(
      <SearchModal isOpen={true} onClose={onClose} onSelectResource={onSelectResource} />,
    );

    // All three results: sorted by category (Learning first, then Tools)
    // Index 0: Frontend Masters (Learning)
    // Index 1: Figma (Tools)
    // Index 2: Framer (Tools)
    expect(screen.getByText('Figma')).toBeInTheDocument();
    expect(screen.getByText('Framer')).toBeInTheDocument();
    expect(screen.getByText('Frontend Masters')).toBeInTheDocument();

    // Arrow down from index 0 -> 1 -> 2 -> wraps to 0
    fireEvent.keyDown(document, { key: 'ArrowDown' });
    fireEvent.keyDown(document, { key: 'ArrowDown' });
    fireEvent.keyDown(document, { key: 'ArrowDown' });

    // After wrapping back to 0, Enter selects Frontend Masters
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(onSelectResource).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Frontend Masters' }),
    );
  });

  it('Arrow Up moves selection backward and wraps around', () => {
    mockSearchReturn = {
      ...mockSearchReturn,
      defaultResults: allDefaults,
    };

    render(
      <SearchModal isOpen={true} onClose={onClose} onSelectResource={onSelectResource} />,
    );

    // Arrow up from index 0 wraps to last (index 2 = Framer)
    fireEvent.keyDown(document, { key: 'ArrowUp' });
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(onSelectResource).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Framer' }),
    );
  });

  it('Enter selects the highlighted result', () => {
    mockSearchReturn = {
      ...mockSearchReturn,
      defaultResults: allDefaults,
    };

    render(
      <SearchModal isOpen={true} onClose={onClose} onSelectResource={onSelectResource} />,
    );

    // Enter on default selection (index 0 = first result in sorted categories)
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(onSelectResource).toHaveBeenCalledTimes(1);
    expect(onSelectResource).toHaveBeenCalledWith(
      expect.objectContaining({ id: expect.any(Number) }),
    );
  });

  // ── Focus Trap ─────────────────────────────────────────────────────

  it('traps focus between input and close button', () => {
    render(
      <SearchModal isOpen={true} onClose={onClose} onSelectResource={onSelectResource} />,
    );

    const input = screen.getByPlaceholderText('Search resources...');
    const closeBtn = screen.getByLabelText('Close search');

    // Focus input, then Shift+Tab should move to close button
    input.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(closeBtn);

    // Tab from close button should wrap to input
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: false });
    expect(document.activeElement).toBe(input);
  });

  // ── Empty State ────────────────────────────────────────────────────

  it('displays "No results found" for a query with no matches', () => {
    mockSearchReturn = {
      ...mockSearchReturn,
      query: 'xyznonexistent',
      results: [],
      groupedResults: {},
      defaultResults: [],
    };

    render(
      <SearchModal isOpen={true} onClose={onClose} onSelectResource={onSelectResource} />,
    );

    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.getByText('Try a different search term')).toBeInTheDocument();
  });

  it('shows loading skeleton when searching', () => {
    mockSearchReturn = {
      ...mockSearchReturn,
      isSearching: true,
    };

    render(
      <SearchModal isOpen={true} onClose={onClose} onSelectResource={onSelectResource} />,
    );

    expect(screen.getByTestId('search-skeleton')).toBeInTheDocument();
  });

  // ── Default Results ────────────────────────────────────────────────

  it('shows "Popular Resources" label when query is empty', () => {
    mockSearchReturn = {
      ...mockSearchReturn,
      defaultResults: allDefaults,
    };

    render(
      <SearchModal isOpen={true} onClose={onClose} onSelectResource={onSelectResource} />,
    );

    expect(screen.getByText('Popular Resources')).toBeInTheDocument();
  });

  it('shows category headers for grouped results', () => {
    mockSearchReturn = {
      ...mockSearchReturn,
      defaultResults: allDefaults,
    };

    render(
      <SearchModal isOpen={true} onClose={onClose} onSelectResource={onSelectResource} />,
    );

    expect(screen.getByText('Learning')).toBeInTheDocument();
    expect(screen.getByText('Tools')).toBeInTheDocument();
  });

  // ── Result Click ───────────────────────────────────────────────────

  it('selects a resource when clicking a result', () => {
    mockSearchReturn = {
      ...mockSearchReturn,
      defaultResults: allDefaults,
    };

    render(
      <SearchModal isOpen={true} onClose={onClose} onSelectResource={onSelectResource} />,
    );

    fireEvent.click(screen.getByText('Framer'));
    expect(onSelectResource).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Framer' }),
    );
  });

  // ── Favicon Fallback ───────────────────────────────────────────────

  it('shows letter initial when favicon fails to load', () => {
    mockSearchReturn = {
      ...mockSearchReturn,
      defaultResults: [makeSearchResult({ id: 10, name: 'Zeplin', url: 'https://zeplin.io' })],
    };

    render(
      <SearchModal isOpen={true} onClose={onClose} onSelectResource={onSelectResource} />,
    );

    // Simulate favicon error
    const img = document.querySelector('img');
    if (img) {
      fireEvent.error(img);
    }

    // Should show fallback initial "Z"
    expect(screen.getByText('Z')).toBeInTheDocument();
  });

  // ── Reset on close ─────────────────────────────────────────────────

  it('clears search when modal closes', () => {
    const { rerender } = render(
      <SearchModal isOpen={true} onClose={onClose} onSelectResource={onSelectResource} />,
    );

    rerender(
      <SearchModal isOpen={false} onClose={onClose} onSelectResource={onSelectResource} />,
    );

    expect(mockClearSearch).toHaveBeenCalled();
  });

  // ── Footer Hints ───────────────────────────────────────────────────

  it('renders keyboard hint labels in the footer', () => {
    render(
      <SearchModal isOpen={true} onClose={onClose} onSelectResource={onSelectResource} />,
    );

    expect(screen.getByText('to select')).toBeInTheDocument();
    expect(screen.getByText('to navigate')).toBeInTheDocument();
    expect(screen.getByText('to close')).toBeInTheDocument();
  });
});
