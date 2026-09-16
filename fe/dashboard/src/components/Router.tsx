import { Route, Switch, Redirect } from 'wouter';
import { Suspense, lazy } from 'react';
import { PageLoader } from '@/components/ui/page-loader';

const Login = lazy(() => import('@/pages/Login'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const PlatformOverview = lazy(() => import('@/pages/platform/Overview'));
const PlatformOrganizations = lazy(() => import('@/pages/platform/Organizations'));
const PlatformUsers = lazy(() => import('@/pages/platform/Users'));
const PlatformTickets = lazy(() => import('@/pages/platform/Tickets'));
const PlatformIncidents = lazy(() => import('@/pages/platform/Incidents'));
const PlatformDataCatalogs = lazy(() => import('@/pages/platform/DataCatalogs'));

export function Router({ isAuthenticated, isLoading }: { isAuthenticated: boolean; isLoading: boolean }) {
  return <Suspense fallback={<PageLoader />}>
    <Switch>
      <Route path="/">{isLoading ? <PageLoader /> : <Redirect to={isAuthenticated ? '/admin' : '/login'} />}</Route>
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/admin/organizations" component={PlatformOrganizations} />
      <Route path="/admin/users" component={PlatformUsers} />
      <Route path="/admin/tickets" component={PlatformTickets} />
      <Route path="/admin/incidents" component={PlatformIncidents} />
      <Route path="/admin/data" component={PlatformDataCatalogs} />
      <Route path="/admin" component={PlatformOverview} />
      <Route>404 — Página no encontrada</Route>
    </Switch>
  </Suspense>;
}
