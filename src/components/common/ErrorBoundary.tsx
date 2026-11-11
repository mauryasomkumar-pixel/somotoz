import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[Somotoz ErrorBoundary] Uncaught application exception:', error, errorInfo);

    // Save client crash report to session for diagnostic recovery
    try {
      const crashLog = {
        message: error.message,
        stack: error.stack?.slice(0, 1000),
        componentStack: errorInfo.componentStack?.slice(0, 1000),
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      };
      sessionStorage.setItem('somotoz_last_crash', JSON.stringify(crashLog));
    } catch (e) {
      // Ignore storage errors in private browsing
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleResetToHome = () => {
    try {
      window.history.pushState(null, '', '/');
    } catch {}
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#070712] text-[#EDEDED] flex items-center justify-center p-4 font-sans select-none">
          <div className="max-w-md w-full bg-[#0E0E1B] border border-[#26263A] rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-fade-in">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Something went wrong
              </h1>
              <p className="text-xs text-[#A1A1B2] leading-relaxed">
                Somotoz encountered an unexpected issue while rendering this view. Your session and cached records are safe.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-black/50 border border-[#222232] text-left text-[11px] font-mono text-[#8E8EA0] overflow-x-auto max-h-24">
                <span className="text-rose-400 font-bold">Error:</span> {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="flex-1 py-3 px-4 rounded-xl bg-[#00F0FF] hover:bg-[#38BDF8] text-black font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition min-h-[44px]"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Application</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetToHome}
                className="py-3 px-4 rounded-xl border border-[#333348] hover:bg-[#1A1A2C] text-xs font-semibold text-[#D1D1DF] flex items-center justify-center gap-2 cursor-pointer transition min-h-[44px]"
              >
                <Home className="w-4 h-4 text-[#8E8EA0]" />
                <span>Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
