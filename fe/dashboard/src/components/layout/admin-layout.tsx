import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { PlatformSidebar } from './platform-sidebar';
import { DashboardNavbar } from "./dashboard-navbar";
import { useSidebarStore } from "@/store/sidebar-store";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/ui/page-loader";
import { usePlatformSupportEvents } from '@/hooks/usePlatformSupportEvents';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { isCollapsed } = useSidebarStore();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  usePlatformSupportEvents(user?.role === 'platform_admin' ? user.id : undefined);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <PageLoader />;
  }

  // Don't render admin layout if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <PlatformSidebar />
      <SidebarInset>
        <DashboardNavbar />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
