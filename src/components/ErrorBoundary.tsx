/**
 * ErrorBoundary.tsx
 * 
 * Production-ready React Error Boundary with graceful fallback UI.
 * Isolates component failures (e.g. Quiz engine, Audio player) without crashing the full application.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitleEn?: string;
  fallbackTitleAr?: string;
  fallbackDescEn?: string;
  fallbackDescAr?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      const titleEn = this.props.fallbackTitleEn || 'Something went wrong in this section';
      const titleAr = this.props.fallbackTitleAr || 'حدث خطأ غير متوقع في هذا الجزء';
      const descEn = this.props.fallbackDescEn || 'Don’t worry! Your learning progress is safely saved locally.';
      const descAr = this.props.fallbackDescAr || 'لا تقلق! تقدمك في التعلم محفوظ بأمان محلياً.';

      return (
        <div className="p-6 my-4 bg-slate-900 border border-slate-800 rounded-[2rem] text-center shadow-xl max-w-lg mx-auto animate-in fade-in zoom-in-95">
          <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <h3 className="text-base font-black text-white mb-2">{titleAr}</h3>
          <p className="text-xs font-semibold text-slate-400 mb-6 leading-relaxed">{descAr}</p>

          <p className="text-[11px] font-mono text-slate-500 mb-6 dir-ltr opacity-70">
            {titleEn}
          </p>

          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={this.handleRetry}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 border-none cursor-pointer transition-all shadow-md shadow-indigo-600/20"
            >
              <RefreshCw className="w-4 h-4" />
              <span>إعادة التحميل</span>
            </button>

            <button
              type="button"
              onClick={this.handleGoHome}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs rounded-xl flex items-center gap-2 border-none cursor-pointer transition-all"
            >
              <Home className="w-4 h-4" />
              <span>الرئيسية</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
