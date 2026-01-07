import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center flex-col gap-4 p-8 text-center bg-slate-50">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-500 text-2xl mb-2">
            <i className="fas fa-bug"></i>
          </div>
          <div className="text-slate-800 font-black text-xl">程序发生严重错误</div>
          <p className="text-slate-500 max-w-md leading-relaxed font-mono text-xs bg-slate-200 p-4 rounded text-left overflow-auto max-h-48">
            {this.state.error?.toString()}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200"
          >
            重新加载页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
