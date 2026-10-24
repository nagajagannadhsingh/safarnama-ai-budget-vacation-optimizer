import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF7F0] flex items-center justify-center p-6 font-sans">
          <div className="bg-white rounded-3xl border border-[#D8C3A5] p-8 sm:p-12 max-w-lg w-full text-center space-y-6 shadow-xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#C2185B]">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-[#C2185B]">
                Application Notice
              </span>
              <h2 className="text-2xl font-heading font-bold text-[#4B294F] mt-1">
                Something didn't load quite right
              </h2>
              <p className="text-xs sm:text-sm text-[#77717F] mt-2 leading-relaxed">
                An unexpected interface issue occurred. Your saved plans remain safe in your browser storage.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-[#FAF7F0] rounded-xl text-left font-mono text-[11px] text-[#77717F] border border-[#D8C3A5]/60 max-h-24 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#4B294F] hover:bg-[#3B1F3E] text-[#FAF7F0] text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#78C9D0]" />
                <span>Reload Application</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
