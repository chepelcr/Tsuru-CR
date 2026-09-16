import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportLandingIncident } from '@/lib/reportIncident';

export class IncidentBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    reportLandingIncident('react-boundary', error);
  }

  render() {
    if (this.state.failed) return <main role="alert" className="min-h-screen grid place-items-center p-6 text-center">
      <div><h1 className="text-2xl font-semibold">Algo salió mal</h1><p className="mt-2">No pudimos cargar esta página. Intenta recargarla.</p>
        <button className="mt-4 underline" onClick={() => window.location.reload()}>Recargar</button></div>
    </main>;
    return this.props.children;
  }
}
