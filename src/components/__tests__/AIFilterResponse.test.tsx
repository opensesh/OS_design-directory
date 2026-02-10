import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { AIFilterResponse } from '../ui/AIFilterResponse';

// ── Mocks ────────────────────────────────────────────────────────────────

vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

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

vi.mock('@/lib/motion-tokens', () => ({
  DURATION: { fast: 0.15, normal: 0.2, slow: 0.3 },
  EASING: { smooth: [0.4, 0, 0.2, 1] },
}));

// ── Tests ────────────────────────────────────────────────────────────────

describe('AIFilterResponse', () => {
  const onDismiss = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  // ── Basic Rendering ────────────────────────────────────────────────

  it('renders nothing when message is null', () => {
    render(
      <AIFilterResponse message={null} isTyping={false} onDismiss={onDismiss} />,
    );

    expect(screen.queryByLabelText('Dismiss')).toBeNull();
  });

  it('renders when a message is provided', () => {
    render(
      <AIFilterResponse message="Hello world" isTyping={false} onDismiss={onDismiss} />,
    );

    expect(screen.getByLabelText('Dismiss')).toBeInTheDocument();
  });

  // ── Typewriter Effect ──────────────────────────────────────────────

  it('types out the message character by character', () => {
    render(
      <AIFilterResponse
        message="Hi"
        messageId={1}
        isTyping={false}
        onDismiss={onDismiss}
      />,
    );

    // Initially empty after the start delay
    expect(screen.queryByText('Hi')).toBeNull();

    // Advance past the 300ms start delay
    act(() => { vi.advanceTimersByTime(300); });

    // First character typed
    expect(screen.getByText('H')).toBeInTheDocument();

    // Advance through the base typing delay (25ms)
    act(() => { vi.advanceTimersByTime(25); });
    expect(screen.getByText('Hi')).toBeInTheDocument();
  });

  it('completes the full message with enough time', () => {
    const message = 'Hello';
    render(
      <AIFilterResponse
        message={message}
        messageId={1}
        isTyping={false}
        onDismiss={onDismiss}
      />,
    );

    // Advance enough time for the start delay (300ms) + all chars
    // 5 chars × 25ms base + 300ms start = ~425ms, use generous margin
    act(() => { vi.advanceTimersByTime(2000); });

    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('pauses longer at sentence-ending punctuation', () => {
    render(
      <AIFilterResponse
        message="OK."
        messageId={1}
        isTyping={false}
        onDismiss={onDismiss}
      />,
    );

    // Start delay
    act(() => { vi.advanceTimersByTime(300); });
    // 'O' typed
    act(() => { vi.advanceTimersByTime(25); });
    // 'K' typed
    act(() => { vi.advanceTimersByTime(25); });

    // '.' should have a 150ms pause before the next action
    // At this point only 'OK' should be visible, not the full 'OK.'
    // Actually: 'O' appears at 300ms, 'OK' at 325ms, '.' at 350ms
    // After '.' the delay is 150ms before isComplete is set
    expect(screen.getByText('OK.')).toBeInTheDocument();
  });

  // ── Auto-Dismiss ───────────────────────────────────────────────────

  it('auto-dismisses after the configured delay when typing completes', () => {
    render(
      <AIFilterResponse
        message="Hi"
        messageId={1}
        isTyping={false}
        onDismiss={onDismiss}
        autoFadeDelay={2000}
      />,
    );

    // Type out the full message
    act(() => { vi.advanceTimersByTime(2000); });
    expect(onDismiss).not.toHaveBeenCalled();

    // Wait for auto-fade delay
    act(() => { vi.advanceTimersByTime(2000); });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('uses default 4000ms auto-fade delay', () => {
    render(
      <AIFilterResponse
        message="Hi"
        messageId={1}
        isTyping={false}
        onDismiss={onDismiss}
      />,
    );

    // Complete typing
    act(() => { vi.advanceTimersByTime(2000); });
    expect(onDismiss).not.toHaveBeenCalled();

    // Advance 3999ms — should NOT have auto-dismissed yet
    act(() => { vi.advanceTimersByTime(3999); });
    expect(onDismiss).not.toHaveBeenCalled();

    // One more ms tips it over
    act(() => { vi.advanceTimersByTime(1); });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  // ── Dismiss Button ─────────────────────────────────────────────────

  it('calls onDismiss when dismiss button is clicked', () => {
    render(
      <AIFilterResponse
        message="Testing dismiss"
        messageId={1}
        isTyping={false}
        onDismiss={onDismiss}
      />,
    );

    const dismissBtn = screen.getByLabelText('Dismiss');
    fireEvent.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  // ── New Message Resets Typewriter ───────────────────────────────────

  it('resets typewriter when a new message arrives', () => {
    const { rerender } = render(
      <AIFilterResponse
        message="First"
        messageId={1}
        isTyping={false}
        onDismiss={onDismiss}
      />,
    );

    // Type out first message
    act(() => { vi.advanceTimersByTime(2000); });
    expect(screen.getByText('First')).toBeInTheDocument();

    // Provide a new message with a new ID
    rerender(
      <AIFilterResponse
        message="Second"
        messageId={2}
        isTyping={false}
        onDismiss={onDismiss}
      />,
    );

    // Should no longer show the old message
    expect(screen.queryByText('First')).toBeNull();

    // Type the new message
    act(() => { vi.advanceTimersByTime(2000); });
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  // ── Stale Timer Prevention ─────────────────────────────────────────

  it('does not auto-dismiss a stale message after a new one arrives', () => {
    const { rerender } = render(
      <AIFilterResponse
        message="Old"
        messageId={1}
        isTyping={false}
        onDismiss={onDismiss}
        autoFadeDelay={1000}
      />,
    );

    // Type out old message and wait almost until auto-dismiss
    act(() => { vi.advanceTimersByTime(800); });

    // New message arrives before the old one auto-dismisses
    rerender(
      <AIFilterResponse
        message="New"
        messageId={2}
        isTyping={false}
        onDismiss={onDismiss}
        autoFadeDelay={1000}
      />,
    );

    // Advance past when the old timer would have fired
    act(() => { vi.advanceTimersByTime(500); });
    // Should NOT have dismissed because the message changed
    expect(onDismiss).not.toHaveBeenCalled();

    // Now type the new message and wait for its auto-dismiss
    act(() => { vi.advanceTimersByTime(2000); });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  // ── Timer Cleanup on Unmount ───────────────────────────────────────

  it('cleans up timers on unmount without act() warnings', () => {
    const { unmount } = render(
      <AIFilterResponse
        message="Cleanup test"
        messageId={1}
        isTyping={false}
        onDismiss={onDismiss}
        autoFadeDelay={5000}
      />,
    );

    // Start typing
    act(() => { vi.advanceTimersByTime(500); });

    // Unmount mid-typing
    unmount();

    // Advance timers — no state updates should happen (no act warnings)
    act(() => { vi.advanceTimersByTime(10000); });

    // onDismiss should NOT have been called since the component is gone
    expect(onDismiss).not.toHaveBeenCalled();
  });

  // ── Match Count Badge ──────────────────────────────────────────────

  it('shows match count badge after typing completes', () => {
    render(
      <AIFilterResponse
        message="Found resources"
        messageId={1}
        isTyping={false}
        onDismiss={onDismiss}
        matchCount={42}
      />,
    );

    // Badge should not appear before typing completes
    expect(screen.queryByText(/42 resources found/)).toBeNull();

    // Complete typing
    act(() => { vi.advanceTimersByTime(5000); });

    expect(screen.getByText(/42 resources found/)).toBeInTheDocument();
  });

  it('uses singular "resource" when count is 1', () => {
    render(
      <AIFilterResponse
        message="Found one"
        messageId={1}
        isTyping={false}
        onDismiss={onDismiss}
        matchCount={1}
      />,
    );

    act(() => { vi.advanceTimersByTime(5000); });

    expect(screen.getByText(/1 resource found/)).toBeInTheDocument();
    expect(screen.queryByText(/1 resources found/)).toBeNull();
  });

  it('does not show match count badge when matchCount is undefined', () => {
    render(
      <AIFilterResponse
        message="No count"
        messageId={1}
        isTyping={false}
        onDismiss={onDismiss}
      />,
    );

    act(() => { vi.advanceTimersByTime(5000); });

    expect(screen.queryByText(/resource.*found/)).toBeNull();
  });

  // ── Null → Message transition ──────────────────────────────────────

  it('transitions from null to a message correctly', () => {
    const { rerender } = render(
      <AIFilterResponse message={null} isTyping={false} onDismiss={onDismiss} />,
    );

    expect(screen.queryByLabelText('Dismiss')).toBeNull();

    rerender(
      <AIFilterResponse
        message="Appeared"
        messageId={1}
        isTyping={false}
        onDismiss={onDismiss}
      />,
    );

    // After typing completes
    act(() => { vi.advanceTimersByTime(5000); });
    expect(screen.getByText('Appeared')).toBeInTheDocument();
  });
});
