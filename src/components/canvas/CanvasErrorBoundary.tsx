import { Component, ErrorInfo, ReactNode } from 'react';
import { LayoutGrid } from 'lucide-react';

interface Props {
  children: ReactNode;
  onError?: () => void;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary for 3D Canvas
 *
 * Catches WebGL/Three.js errors and provides graceful fallback.
 * Common failure causes:
 * - WebGL not supported
 * - GPU driver issues
 * - Memory exhaustion
 * - Shader compilation errors
 */
export class CanvasErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for debugging
    if (import.meta.env.DEV) {
      console.error('Canvas error:', error);
      console.error('Error info:', errorInfo);
    }

    // Notify parent to switch display mode
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="w-full h-full flex items-center justify-center bg-[var(--bg-primary)]">
          <div className="text-center max-w-md px-6">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-secondary)] flex items-center justify-center">
              <LayoutGrid className="w-8 h-8 text-[var(--fg-tertiary)]" />
            </div>

            <h2 className="text-xl font-medium text-[var(--fg-primary)] mb-2">
              3D View Unavailable
            </h2>

            <p className="text-[var(--fg-secondary)] mb-6">
              The 3D visualization couldn't load. This can happen if your browser
              doesn't support WebGL or if there's a GPU issue.
            </p>

            <button
              onClick={() => this.props.onError?.()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-brand-solid)] text-white rounded-lg hover:bg-[var(--bg-brand-solid_hover)] transition-colors"
            >
              <LayoutGrid className="w-4 h-4" />
              Switch to Card View
            </button>

            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-[var(--fg-tertiary)] cursor-pointer hover:text-[var(--fg-secondary)]">
                  Error details (dev only)
                </summary>
                <pre className="mt-2 p-3 text-xs bg-[var(--bg-tertiary)] rounded-lg overflow-x-auto text-[var(--fg-secondary)]">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
