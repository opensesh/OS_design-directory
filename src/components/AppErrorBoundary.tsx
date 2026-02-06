import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * App-Level Error Boundary
 *
 * Catches unhandled errors across the entire application and provides
 * a full-screen fallback with recovery options.
 *
 * Placement: Wrap around BrowserRouter in main.tsx to catch routing
 * and component errors while maintaining access to navigation.
 */
export class AppErrorBoundary extends Component<Props, State> {
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
      console.error('App error:', error);
      console.error('Error info:', errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] text-[var(--fg-primary)]">
          <div className="text-center max-w-md px-6">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-secondary)] flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>

            <h1 className="text-xl font-medium text-[var(--fg-primary)] mb-2">
              Something went wrong
            </h1>

            <p className="text-[var(--fg-secondary)] mb-6">
              An unexpected error occurred. You can try reloading the page
              or returning to the home page.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] text-[var(--fg-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reload Page
              </button>

              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-brand-solid)] text-white rounded-lg hover:bg-[var(--bg-brand-solid_hover)] transition-colors"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="mt-8 text-left">
                <summary className="text-xs text-[var(--fg-tertiary)] cursor-pointer hover:text-[var(--fg-secondary)]">
                  Error details (dev only)
                </summary>
                <pre className="mt-2 p-3 text-xs bg-[var(--bg-tertiary)] rounded-lg overflow-x-auto text-[var(--fg-secondary)] max-h-40">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
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
