import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Activity, Building2, LifeBuoy, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { platformApi } from '@/lib/platformApi';

const cards = [
  { key: 'organizations', title: 'Organizaciones', icon: Building2, path: '/admin/organizations' },
  { key: 'users', title: 'Usuarios registrados', icon: Users, path: '/admin/users' },
  { key: 'open_tickets', title: 'Tickets por atender', icon: LifeBuoy, path: '/admin/tickets' },
  { key: 'incidents24h', title: 'Incidentes (24 h)', icon: Activity, path: '/admin/incidents' },
] as const;

export default function PlatformOverviewPage() {
  const [, navigate] = useLocation();
  const summary = useQuery({ queryKey: ['platform-overview'], queryFn: platformApi.overview });
  const tickets = useQuery({ queryKey: ['platform-tickets', ''], queryFn: () => platformApi.tickets() });
  const incidents = useQuery({ queryKey: ['platform-incidents'], queryFn: platformApi.incidents });
  return (
    <div className="space-y-6 pt-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Centro de operaciones</h1>
        <p className="text-muted-foreground mt-1">Organizaciones, personas y soporte de Tsuru en un solo lugar.</p>
      </div>
      {summary.isError && <p role="alert" className="rounded-lg border border-destructive p-3 text-destructive">No se pudo cargar el resumen. Verifica el API local y tu cuenta de administrador.</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ key, title, icon: Icon, path }) => (
          <Card key={key} className="cursor-pointer hover:border-primary/50" onClick={() => navigate(path)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">{title}</CardTitle><Icon className="size-4 text-muted-foreground" /></CardHeader>
            <CardContent><div className="text-3xl font-semibold">{summary.isLoading ? '…' : summary.data?.[key] ?? '—'}</div></CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Tickets recientes</CardTitle><Button variant="outline" size="sm" onClick={() => navigate('/admin/tickets')}>Ver todos</Button></CardHeader>
          <CardContent className="space-y-3">
            {tickets.isError && <p className="text-sm text-destructive">No se pudieron cargar los tickets.</p>}
            {!tickets.isLoading && !tickets.data?.length && <p className="text-sm text-muted-foreground">Sin solicitudes todavía.</p>}
            {tickets.data?.slice(0, 5).map((ticket) => (
              <div key={ticket.id} className="rounded-lg border p-3 text-sm">
                <div className="font-medium">{ticket.subject}</div>
                <div className="text-muted-foreground">{ticket.organization_name} · {ticket.requester_email} · {ticket.status}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Fallos recientes</CardTitle><Button variant="outline" size="sm" onClick={() => navigate('/admin/incidents')}>Ver todos</Button></CardHeader>
          <CardContent className="space-y-3">
            {incidents.isError && <p className="text-sm text-destructive">No se pudieron cargar los incidentes.</p>}
            {!incidents.isLoading && !incidents.data?.length && <p className="text-sm text-muted-foreground">Sin fallos reportados.</p>}
            {incidents.data?.slice(0, 5).map((incident) => (
              <div key={incident.id} className="rounded-lg border p-3 text-sm">
                <div className="font-medium">{incident.service || incident.module}: {incident.status_code || incident.error_name || 'Error'}</div>
                <div className="text-muted-foreground truncate">{incident.organization_name || 'Sin org'} · {incident.user_email || 'Anónimo'} · {incident.error_message}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
