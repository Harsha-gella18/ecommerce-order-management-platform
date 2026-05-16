import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy p-6">
          <div className="max-w-md w-full rounded-2xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-900 p-8 shadow-soft text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" aria-hidden />
            <h1 className="text-xl font-bold text-navy dark:text-white mb-2">Something went wrong</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              The UI hit an unexpected error. Refresh the page or return to the store home.
            </p>
            <button
              type="button"
              className="rounded-xl bg-brand-blue text-white px-5 py-2.5 text-sm font-semibold hover:bg-blue-600 transition-colors"
              onClick={() => window.location.assign('/')}
            >
              Go home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
