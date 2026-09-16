import { useLocation } from 'wouter';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from '@/components/ui/toaster';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Router } from '@/components/Router';
import { useAuth } from '@/hooks/useAuth';

/** The dashboard is the local Tsuru platform-administration console.
 * Organization-side workflows live exclusively in the POS app. */
export default function App() {
  const [location] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const authScreen = location === '/' || ['/login', '/forgot-password', '/reset-password']
    .some((path) => location.startsWith(path));

  return <ThemeProvider>
    {authScreen ? <div className="min-h-screen bg-gradient-to-br from-primary/10 to-background">
      <Router isAuthenticated={isAuthenticated} isLoading={isLoading} />
    </div> : <AdminLayout><Router isAuthenticated={isAuthenticated} isLoading={isLoading} /></AdminLayout>}
    <Toaster />
  </ThemeProvider>;
}
