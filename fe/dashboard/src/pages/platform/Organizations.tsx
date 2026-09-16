import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { platformApi } from '@/lib/platformApi';

export default function PlatformOrganizationsPage() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => {
    const timer = setTimeout(() => { setDebounced(search.trim()); setPage(1); }, 250);
    return () => clearTimeout(timer);
  }, [search]);
  const organizations = useQuery({
    queryKey: ['platform-organizations', debounced, page],
    queryFn: () => platformApi.organizations(debounced, page),
  });
  const data = organizations.data;
  return (
    <div className="space-y-5 pt-4">
      <div><h1 className="text-3xl font-semibold tracking-tight">Organizaciones</h1><p className="text-muted-foreground mt-1">Todas las organizaciones registradas en Tsuru.</p></div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4"><CardTitle>{data ? `${data.total} organizaciones` : 'Directorio'}</CardTitle><Input className="max-w-xs" aria-label="Buscar organizaciones" placeholder="Buscar nombre o slug" value={search} onChange={(event) => setSearch(event.target.value)} /></CardHeader>
        <CardContent>
          {organizations.isLoading && <p className="text-sm text-muted-foreground">Cargando organizaciones…</p>}
          {organizations.isError && <p role="alert" className="text-sm text-destructive">No se pudo cargar el directorio.</p>}
          {!organizations.isLoading && !data?.items.length && <p className="text-sm text-muted-foreground">Sin resultados.</p>}
          {!!data?.items.length && <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b text-left text-muted-foreground"><th className="py-3 pr-4">Organización</th><th className="py-3 pr-4">Plan</th><th className="py-3 pr-4">Estado</th><th className="py-3 pr-4">Onboarding</th><th className="py-3 pr-4">Módulos</th><th className="py-3">Alta</th></tr></thead>
            <tbody>{data.items.map((org) => <tr key={org.id} className="border-b last:border-0">
              <td className="py-3 pr-4"><div className="font-medium">{org.name}</div><div className="text-muted-foreground">{org.slug}</div></td>
              <td className="py-3 pr-4">{org.plan}</td><td className="py-3 pr-4">{org.is_active ? 'Activa' : 'Inactiva'}</td>
              <td className="py-3 pr-4">Paso {org.onboarding_step}</td><td className="py-3 pr-4">{org.module_count}</td>
              <td className="py-3">{new Date(org.created_at).toLocaleDateString()}</td>
            </tr>)}</tbody>
          </table></div>}
          {data && data.total > data.page_size && <div className="flex items-center justify-end gap-3 mt-4">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
            <span className="text-sm text-muted-foreground">{page} / {Math.ceil(data.total / data.page_size)}</span>
            <Button variant="outline" size="sm" disabled={page * data.page_size >= data.total} onClick={() => setPage(page + 1)}>Siguiente</Button>
          </div>}
        </CardContent>
      </Card>
    </div>
  );
}
