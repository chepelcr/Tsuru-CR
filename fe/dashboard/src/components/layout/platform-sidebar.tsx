import { useLocation } from 'wouter';
import { Activity, Building2, LayoutDashboard, LifeBuoy, LogOut, Users } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';

const navigation = [
  { path: '/admin', label: 'Resumen', icon: LayoutDashboard },
  { path: '/admin/organizations', label: 'Organizaciones', icon: Building2 },
  { path: '/admin/users', label: 'Usuarios', icon: Users },
  { path: '/admin/tickets', label: 'Tickets de soporte', icon: LifeBuoy },
  { path: '/admin/incidents', label: 'Incidentes', icon: Activity },
];

export function PlatformSidebar() {
  const [location, navigate] = useLocation();
  const { user, logout } = useAuth();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 p-2">
          <div className="rounded-lg bg-primary text-primary-foreground p-2"><Building2 className="size-5" /></div>
          <div className="min-w-0"><div className="font-semibold">Tsuru Admin</div><div className="text-xs text-muted-foreground">Operaciones de plataforma</div></div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map(({ path, label, icon: Icon }) => (
                <SidebarMenuItem key={path}>
                  <SidebarMenuButton asChild isActive={path === '/admin' ? location === path : location.startsWith(path)} tooltip={label}>
                    <a href={path} onClick={(event) => { event.preventDefault(); navigate(path); }}>
                      <Icon className="size-4" /><span>{label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-3">
        <div className="truncate text-xs text-muted-foreground" title={user?.email}>{user?.email}</div>
        <SidebarMenuButton onClick={() => { void logout().then(() => navigate('/login')); }} tooltip="Cerrar sesión">
          <LogOut className="size-4" /><span>Cerrar sesión</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
