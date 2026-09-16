import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { platformApi, type PlatformIncident } from '@/lib/platformApi';

function catalogCode(message: string): string | undefined {
  return message.match(/(?:^|:\s)([A-Z][A-Z0-9_]+|\d{3})$/)?.[1];
}

export default function PlatformIncidentsPage() {
  const incidents = useQuery({ queryKey: ['platform-incidents'], queryFn: platformApi.incidents });
  const catalog = useQuery({ queryKey: ['backend-error-catalog'], queryFn: platformApi.errorCatalog });
  const catalogEntry = (incident: PlatformIncident) => {
    const code = catalogCode(incident.error_message);
    if (!code) return undefined;
    return catalog.data?.find((entry) => entry.code === code && entry.service === incident.service)
      ?? catalog.data?.find((entry) => entry.code === code && entry.service === 'common');
  };
  return (
    <div className="space-y-5 pt-4">
      <div><h1 className="text-3xl font-semibold tracking-tight">Incidentes de la plataforma</h1><p className="text-muted-foreground mt-1">Errores de POS, landing y servicios backend. Los fallos previos al inicio de sesión aparecen como anónimos.</p></div>
      {incidents.isLoading && <p className="text-sm text-muted-foreground">Cargando incidentes…</p>}
      {incidents.isError && <p role="alert" className="text-sm text-destructive">No se pudieron cargar los incidentes.</p>}
      {!incidents.isLoading && !incidents.data?.length && <Card><CardContent className="pt-6 text-sm text-muted-foreground">Sin fallos reportados.</CardContent></Card>}
      {incidents.data?.map((incident) => {
        const resolved = catalogEntry(incident);
        return <Card key={incident.id}>
        <CardHeader><CardTitle className="text-base">{incident.surface === 'backend' || incident.status_code ? `${incident.service || 'Backend'} · ${incident.status_code || 'Crítico'}` : `${incident.module} · ${incident.error_name || 'Error'}`}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-muted-foreground">
            <span><strong className="text-foreground">Organización:</strong> {incident.organization_name || 'No identificada'}</span>
            <span><strong className="text-foreground">Usuario:</strong> {incident.user_email || 'Anónimo / no identificado'}</span>
            <span><strong className="text-foreground">Superficie:</strong> {incident.surface}</span>
            <span><strong className="text-foreground">Módulo:</strong> {incident.module}</span>
            <span><strong className="text-foreground">Origen:</strong> {incident.source}</span>
            <span><strong className="text-foreground">Repeticiones:</strong> {incident.occurrence_count}</span>
          </div>
          <p className="whitespace-pre-wrap break-words font-medium">{incident.error_message}</p>
          {resolved && <p className="rounded-md bg-muted px-3 py-2"><strong>Catálogo:</strong> {resolved.catalog_message} <span className="text-muted-foreground">({resolved.service}/{resolved.code})</span></p>}
          <p className="text-muted-foreground">Ruta: {incident.route || 'No disponible'} · Versión: {incident.app_version || 'No disponible'} · Último: {new Date(incident.last_seen_at).toLocaleString()}</p>
          {incident.stack_trace && <details className="rounded-lg border p-3"><summary className="cursor-pointer font-medium">Traza del error</summary><pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all text-xs text-muted-foreground">{incident.stack_trace}</pre></details>}
        </CardContent>
      </Card>;})}
      {!!incidents.data?.length && <p className="text-xs text-muted-foreground">Se muestran los 200 incidentes más recientes. Las repeticiones del mismo error dentro de un minuto se agrupan.</p>}
    </div>
  );
}
