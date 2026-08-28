type LovableEvents = {
  captureException?: (error: unknown, options?: { extra?: Record<string, unknown> }) => void;
};

declare global {
  interface Window {
    __lovableEvents?: LovableEvents;
    __lovableReportRuntimeError?: (payload: { error: unknown; context: Record<string, unknown> }) => void;
  }
}

export function reportLovableError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  window.__lovableEvents?.captureException?.(error, { extra: context });
  window.__lovableReportRuntimeError?.({ error, context });
}