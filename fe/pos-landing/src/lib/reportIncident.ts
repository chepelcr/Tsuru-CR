const API_BASE = import.meta.env.VITE_PLATFORM_API_URL || 'https://api.tsuru.jcampos.dev';

function sessionId(): string {
  try {
    const stored = sessionStorage.getItem('tsuru_landing_incident_session_id');
    if (stored) return stored;
    const value = crypto.randomUUID();
    sessionStorage.setItem('tsuru_landing_incident_session_id', value);
    return value;
  } catch { return crypto.randomUUID(); }
}

/** Public pages have no Cognito identity. The server deliberately records them as anonymous. */
export function reportLandingIncident(source: 'react-boundary' | 'window-error' | 'unhandled-rejection', value: unknown): void {
  try {
    const error = value instanceof Error ? value : new Error(String(value));
    void fetch(`${API_BASE}/api/public/support/incidents`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        surface: 'landing', session_id: sessionId(), module: 'landing', source,
        route: window.location.pathname, error_name: error.name,
        error_message: (error.message || 'Unknown landing error').slice(0, 2000),
        stack_trace: error.stack?.slice(0, 4000),
        app_version: import.meta.env.MODE,
      }),
    }).catch(() => undefined);
  } catch { /* Reporting must not crash the page. */ }
}
