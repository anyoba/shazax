import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('Rendered error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    const { error, errorInfo } = this.state;
    if (error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
          <div className="max-w-2xl rounded-3xl border border-white/10 bg-slate-900/90 p-8 shadow-2xl">
            <h1 className="mb-4 text-3xl font-bold">Something went wrong</h1>
            <p className="mb-4 text-sm text-slate-300">
              The app encountered an error while rendering. This helps avoid a blank screen.
            </p>
            <div className="rounded-2xl bg-slate-800 p-4 text-sm text-slate-200">
              <p className="font-semibold">Error:</p>
              <pre className="whitespace-pre-wrap break-words text-xs">{error?.toString()}</pre>
            </div>
            {errorInfo ? (
              <div className="mt-4 rounded-2xl bg-slate-800 p-4 text-sm text-slate-300">
                <p className="font-semibold">Stack trace:</p>
                <pre className="whitespace-pre-wrap break-words text-xs">{errorInfo.componentStack}</pre>
              </div>
            ) : null}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
