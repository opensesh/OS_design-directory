import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIFilterResponse } from '../AIFilterResponse';

// ── Mocks ────────────────────────────────────────────────────────────

vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => true,
}));

vi.mock('@/lib/motion-tokens', () => ({
  DURATION: { fast: 0.15, normal: 0.2, slow: 0.3 },
  EASING: { smooth: [0.4, 0, 0.2, 1] },
}));

// Mock framer-motion — render children immediately, no animations
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

// ── Setup / Teardown ─────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ── Test Suites ──────────────────────────────────────────────────────

describe('AIFilterResponse', () => {
  const defaultProps = {
    message: 'Found 5 design tools for prototyping.',
    isTyping: false,
    onDismiss: vi.fn(),
  };

  describe('rendering', () => {
    it('renders nothing when message is null', () => {
      const { container } = render(
        <AIFilterResponse {...defaultProps} message={null} />
      );
      // AnimatePresence with null message should produce nothing meaningful
      expect(container.textContent).toBe('');
    });

    it('renders when a message is provided', () => {
      render(<AIFilterResponse {...defaultProps} />);
      // The dismiss button is always present when message exists
      expect(screen.getByLabelText('Dismiss')).toBeInTheDocument();
    });
  });

  describe('typewriter effect', () => {
    it('starts with empty displayed text and types characters over time', async () => {
      render(
        <AIFilterResponse
          {...defaultProps}
          message="Hello"
          messageId={1}
        />
      );

      // Initially the component renders with empty text (300ms start delay)
      // After advancing timers, characters should appear
      await act(async () => {
        vi.advanceTimersByTime(300); // Start delay
      });

      // After the start delay, first character appears
      await act(async () => {
        vi.advanceTimersByTime(25); // First char delay
      });

      // At least the first character should be rendered
      const textContainer = screen.getByLabelText('Dismiss').parentElement;
      expect(textContainer?.textContent).toContain('H');
    });

    it('completes the full message after sufficient time', async () => {
      const message = 'Hi';
      render(
        <AIFilterResponse
          {...defaultProps}
          message={message}
          messageId={1}
        />
      );

      // Advance well past the time needed for a short message
      // 300ms start + 2 chars * ~25ms each + buffer
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByText(/Hi/)).toBeInTheDocument();
    });

    it('pauses longer at punctuation marks', async () => {
      // The effect uses 150ms for sentence-ending punctuation vs 25ms for normal chars
      // We just verify that the message eventually completes
      render(
        <AIFilterResponse
          {...defaultProps}
          message="OK."
          messageId={1}
        />
      );

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByText(/OK\./)).toBeInTheDocument();
    });
  });

  describe('auto-dismiss', () => {
    it('calls onDismiss after autoFadeDelay once typing completes', async () => {
      const onDismiss = vi.fn();
      const autoFadeDelay = 2000;

      render(
        <AIFilterResponse
          message="Hi"
          isTyping={false}
          onDismiss={onDismiss}
          messageId={1}
          autoFadeDelay={autoFadeDelay}
        />
      );

      // Let the typewriter complete
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // onDismiss should NOT have been called yet
      expect(onDismiss).not.toHaveBeenCalled();

      // Advance past the auto-fade delay
      await act(async () => {
        vi.advanceTimersByTime(autoFadeDelay + 100);
      });

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('uses default autoFadeDelay of 4000ms', async () => {
      const onDismiss = vi.fn();

      render(
        <AIFilterResponse
          message="Hi"
          isTyping={false}
          onDismiss={onDismiss}
          messageId={1}
        />
      );

      // Complete typing
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Before default 4000ms, should not dismiss
      await act(async () => {
        vi.advanceTimersByTime(3500);
      });
      expect(onDismiss).not.toHaveBeenCalled();

      // After 4000ms total
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      expect(onDismiss).toHaveBeenCalled();
    });

    it('does not auto-dismiss while typewriter is still running', async () => {
      const onDismiss = vi.fn();
      const longMessage = 'This is a longer message that takes a while to type out character by character.';

      render(
        <AIFilterResponse
          message={longMessage}
          isTyping={false}
          onDismiss={onDismiss}
          messageId={1}
          autoFadeDelay={500}
        />
      );

      // Advance less time than needed for the message to complete
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      // Even though 600ms > 500ms autoFadeDelay, typing isn't done so no dismiss
      expect(onDismiss).not.toHaveBeenCalled();
    });
  });

  describe('manual dismiss', () => {
    it('calls onDismiss when dismiss button is clicked', async () => {
      const onDismiss = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(
        <AIFilterResponse
          {...defaultProps}
          onDismiss={onDismiss}
        />
      );

      const dismissButton = screen.getByLabelText('Dismiss');
      await user.click(dismissButton);
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('match count badge', () => {
    it('shows match count badge after typing completes', async () => {
      render(
        <AIFilterResponse
          message="Hi"
          isTyping={false}
          onDismiss={vi.fn()}
          messageId={1}
          matchCount={42}
        />
      );

      // Let typewriter complete
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByText(/42 resources found/)).toBeInTheDocument();
    });

    it('uses singular "resource" for count of 1', async () => {
      render(
        <AIFilterResponse
          message="Hi"
          isTyping={false}
          onDismiss={vi.fn()}
          messageId={1}
          matchCount={1}
        />
      );

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByText(/1 resource found/)).toBeInTheDocument();
    });

    it('does not show match count badge when matchCount is undefined', async () => {
      render(
        <AIFilterResponse
          message="Hi"
          isTyping={false}
          onDismiss={vi.fn()}
          messageId={1}
        />
      );

      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.queryByText(/resource.* found/)).not.toBeInTheDocument();
    });
  });

  describe('timer cleanup', () => {
    it('cleans up timers on unmount without errors', async () => {
      const onDismiss = vi.fn();
      const { unmount } = render(
        <AIFilterResponse
          message="Testing cleanup"
          isTyping={false}
          onDismiss={onDismiss}
          messageId={1}
          autoFadeDelay={2000}
        />
      );

      // Start the typewriter
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      // Unmount while typewriter is still running
      unmount();

      // Advance time — onDismiss should NOT be called after unmount
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });

      expect(onDismiss).not.toHaveBeenCalled();
    });

    it('clears auto-fade timer when a new message arrives', async () => {
      const onDismiss = vi.fn();
      const { rerender } = render(
        <AIFilterResponse
          message="First"
          isTyping={false}
          onDismiss={onDismiss}
          messageId={1}
          autoFadeDelay={2000}
        />
      );

      // Complete typing of first message
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // New message arrives — should reset the timer
      rerender(
        <AIFilterResponse
          message="Second"
          isTyping={false}
          onDismiss={onDismiss}
          messageId={2}
          autoFadeDelay={2000}
        />
      );

      // Advance past what would have been the first message's dismiss time
      await act(async () => {
        vi.advanceTimersByTime(1500);
      });

      // Should not have dismissed (timer was reset for the new message)
      expect(onDismiss).not.toHaveBeenCalled();
    });
  });
});
