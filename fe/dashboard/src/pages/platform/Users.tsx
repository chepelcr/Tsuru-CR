import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { platformApi } from '@/lib/platformApi';

export default function PlatformUsersPage() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);
  const users = useQuery({ queryKey: ['platform-users', debounced], queryFn: () => platformApi.users(debounced) });
  return (
    <div className="space-y-5 pt-4">
      <div><h1 className="text-3xl font-semibold tracking-tight">Usuarios registrados</h1><p className="text-muted-foreground mt-1">Cuentas de la plataforma, con estado y rol.</p></div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4"><CardTitle>Directorio de usuarios</CardTitle><Input className="max-w-xs" aria-label="Buscar usuarios" placeholder="Buscar correo o usuario" value={search} onChange={(event) => setSearch(event.target.value)} /></CardHeader>
        <CardContent>
          {users.isLoading && <p className="text-sm text-muted-foreground">Cargando usuarios…</p>}
          {users.isError && <p role="alert" className="text-sm text-destructive">No se pudo cargar el directorio.</p>}
          {!users.isLoading && !users.data?.length && <p className="text-sm text-muted-foreground">Sin resultados.</p>}
          {!!users.data?.length && <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b text-left text-muted-foreground"><th className="py-3 pr-4">Persona</th><th className="py-3 pr-4">Correo</th><th className="py-3 pr-4">Rol</th><th className="py-3 pr-4">Estado</th><th className="py-3">Registro</th></tr></thead>
            <tbody>{users.data.map((user) => <tr key={user.id} className="border-b last:border-0">
              <td className="py-3 pr-4"><div className="font-medium">{[user.first_name, user.last_name].filter(Boolean).join(' ') || user.username}</div><div className="text-muted-foreground">@{user.username}</div></td>
              <td className="py-3 pr-4">{user.email}</td><td className="py-3 pr-4">{user.role}</td>
              <td className="py-3 pr-4">{user.is_active ? 'Activa' : 'Inactiva'}</td><td className="py-3">{new Date(user.created_at).toLocaleDateString()}</td>
            </tr>)}</tbody>
          </table></div>}
          <p className="text-xs text-muted-foreground mt-4">Se muestran hasta 200 cuentas. Usa la búsqueda para localizar una persona.</p>
        </CardContent>
      </Card>
    </div>
  );
}
