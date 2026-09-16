import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { platformApi } from '@/lib/platformApi';

export default function PlatformTicketsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [notice, setNotice] = useState('');
  const queryClient = useQueryClient();
  const tickets = useQuery({ queryKey: ['platform-tickets', statusFilter], queryFn: () => platformApi.tickets(statusFilter) });
  const detail = useQuery({ queryKey: ['platform-ticket', selectedId], enabled: !!selectedId,
    queryFn: () => platformApi.ticket(selectedId!) });
  const selected = tickets.data?.find((ticket) => ticket.id === selectedId);
  const update = useMutation({
    mutationFn: (change: { status?: string; priority?: string }) => platformApi.updateTicket(selectedId!, change),
    onSuccess: () => {
      setNotice('Ticket actualizado.');
      void queryClient.invalidateQueries({ queryKey: ['platform-tickets'] });
      void queryClient.invalidateQueries({ queryKey: ['platform-ticket', selectedId] });
      void queryClient.invalidateQueries({ queryKey: ['platform-overview'] });
    },
    onError: () => setNotice('No se pudo actualizar el ticket.'),
  });
  const send = useMutation({
    mutationFn: () => platformApi.reply(selectedId!, reply.trim()),
    onSuccess: () => {
      setReply(''); setNotice('Respuesta enviada.');
      void queryClient.invalidateQueries({ queryKey: ['platform-tickets'] });
      void queryClient.invalidateQueries({ queryKey: ['platform-ticket', selectedId] });
    },
    onError: () => setNotice('No se pudo enviar la respuesta.'),
  });
  return (
    <div className="space-y-5 pt-4">
      <div><h1 className="text-3xl font-semibold tracking-tight">Tickets de soporte</h1><p className="text-muted-foreground mt-1">Responde a usuarios de cualquier organización y sigue el estado de cada caso.</p></div>
      {notice && <div role="status" className="rounded-lg border bg-muted p-3 text-sm">{notice}</div>}
      <div className="grid gap-4 xl:grid-cols-[minmax(320px,1fr)_minmax(420px,1.4fr)]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4"><CardTitle>Solicitudes</CardTitle>
            <select className="rounded-md border bg-background p-2 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtrar tickets por estado">
              <option value="">Todos</option><option value="open">Abiertos</option><option value="in_progress">En atención</option><option value="resolved">Resueltos</option><option value="closed">Cerrados</option>
            </select>
          </CardHeader>
          <CardContent className="space-y-2">
            {tickets.isLoading && <p className="text-sm text-muted-foreground">Cargando tickets…</p>}
            {tickets.isError && <p role="alert" className="text-sm text-destructive">No se pudieron cargar los tickets.</p>}
            {!tickets.isLoading && !tickets.data?.length && <p className="text-sm text-muted-foreground">Sin tickets con este filtro.</p>}
            {tickets.data?.map((ticket) => <button key={ticket.id} type="button" onClick={() => { setSelectedId(ticket.id); setNotice(''); }}
              className={`w-full rounded-lg border p-3 text-left text-sm hover:bg-muted ${selectedId === ticket.id ? 'border-primary' : ''}`}>
              <div className="font-medium">{ticket.subject}</div>
              <div className="text-muted-foreground mt-1">{ticket.organization_name} · {ticket.requester_email}</div>
              <div className="text-muted-foreground mt-1">{ticket.status} · {ticket.priority} · {new Date(ticket.updated_at).toLocaleString()}</div>
            </button>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{detail.data?.subject || 'Selecciona un ticket'}</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            {!selectedId && <p className="text-muted-foreground">Elige una solicitud para ver la conversación y responder.</p>}
            {detail.isLoading && <p className="text-muted-foreground">Cargando conversación…</p>}
            {detail.isError && <p role="alert" className="text-destructive">No se pudo cargar la conversación.</p>}
            {detail.data && <>
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-muted-foreground">
                <span><strong className="text-foreground">Org:</strong> {selected?.organization_name || detail.data.organization_id}</span>
                <span><strong className="text-foreground">Usuario:</strong> {selected?.requester_email || detail.data.requester_user_id}</span>
                <span><strong className="text-foreground">Módulo:</strong> {detail.data.module || 'General'}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="font-medium">Estado
                  <select className="mt-1 w-full rounded-md border bg-background p-2" value={detail.data.status} disabled={update.isPending}
                    onChange={(event) => update.mutate({ status: event.target.value })}>
                    <option value="open">Abierto</option><option value="in_progress">En atención</option><option value="resolved">Resuelto</option><option value="closed">Cerrado</option>
                  </select>
                </label>
                <label className="font-medium">Prioridad
                  <select className="mt-1 w-full rounded-md border bg-background p-2" value={detail.data.priority} disabled={update.isPending}
                    onChange={(event) => update.mutate({ priority: event.target.value })}>
                    <option value="low">Baja</option><option value="normal">Normal</option><option value="high">Alta</option><option value="urgent">Urgente</option>
                  </select>
                </label>
              </div>
              <div className="rounded-lg border bg-muted p-4 whitespace-pre-wrap">{detail.data.description}</div>
              <div className="space-y-2">
                {detail.data.messages?.map((message) => <div key={message.id} className={`rounded-lg border p-3 ${message.is_staff ? 'bg-primary/10' : ''}`}>
                  <div className="font-medium">{message.is_staff ? 'Soporte Tsuru' : 'Usuario'}</div>
                  <p className="whitespace-pre-wrap mt-1">{message.body}</p>
                  <div className="text-xs text-muted-foreground mt-1">{new Date(message.created_at).toLocaleString()}</div>
                </div>)}
              </div>
              {detail.data.status !== 'closed' && <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); if (reply.trim()) send.mutate(); }}>
                <label className="font-medium" htmlFor="support-reply">Responder al usuario</label>
                <textarea id="support-reply" className="w-full min-h-28 rounded-md border bg-background p-3" value={reply} onChange={(event) => setReply(event.target.value)} maxLength={10000} required />
                <Button type="submit" disabled={!reply.trim() || send.isPending}>Enviar respuesta</Button>
              </form>}
            </>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
