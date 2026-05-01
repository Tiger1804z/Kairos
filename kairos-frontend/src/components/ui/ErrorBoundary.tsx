import { Component } from "react";
import type { ReactNode } from "react";

export function RouteErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-white">
      <div className="mb-2 text-4xl">⚠️</div>
      <h1 className="mb-1 text-xl font-bold">Something went wrong</h1>
      <p className="mb-8 text-sm text-white/40">An unexpected error occurred. You can go back to safety.</p>
      <div className="flex gap-3">
        <a
          href="/dashboard"
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
        >
          Go to Dashboard
        </a>
        <a
          href="/auth?mode=login"
          className="rounded-xl bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/70 ring-1 ring-white/10 transition hover:bg-white/10"
        >
          Sign in again
        </a>
      </div>
    </div>
  );
}

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-white">
        <div className="mb-2 text-4xl">⚠️</div>
        <h1 className="mb-1 text-xl font-bold">Something went wrong</h1>
        <p className="mb-8 text-sm text-white/40">An unexpected error occurred. You can go back to safety.</p>
        <div className="flex gap-3">
          <a
            href="/dashboard"
            className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover"
          >
            Go to Dashboard
          </a>
          <a
            href="/auth?mode=login"
            className="rounded-xl bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/70 ring-1 ring-white/10 transition hover:bg-white/10"
          >
            Sign in again
          </a>
        </div>
      </div>
    );
  }
}
