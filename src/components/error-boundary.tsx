"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-2xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-200">
            <p className="font-medium">出了点问题</p>
            <p className="mt-1 text-xs text-red-300/70">{this.state.error?.message}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="mt-3 rounded-lg border border-red-800 px-3 py-1.5 text-xs text-red-200 transition hover:bg-red-900/30"
            >
              重试
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
