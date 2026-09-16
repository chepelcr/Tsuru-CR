import { fetchAuthSession } from 'aws-amplify/auth';

const ADMIN_API_URL = (import.meta.env.VITE_ADMIN_API_URL || 'https://admin-api.tsuru.jcampos.dev').replace(/\/+$/, '');

export interface PlatformOverview {
  organizations: number; users: number; open_tickets: number; incidents24h: number;
}
export interface PlatformOrganization {
  id: string; name: string; slug: string; subdomain: string | null;
  plan: string; is_active: boolean; onboarding_step: number;
  created_at: string; module_count: number;
}
export interface PlatformOrganizationsResult {
  items: PlatformOrganization[]; total: number; page: number; page_size: number;
}
export interface PlatformUser {
  id: string; username: string; email: string; first_name: string | null;
  last_name: string | null; role: string; is_active: boolean; created_at: string;
}
export interface PlatformTicket {
  id: string; organization_id: string; organization_name?: string;
  requester_user_id: string; requester_email?: string; subject: string;
  description: string; module: string | null; status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent'; created_at: string; updated_at: string;
  messages?: { id: string; author_user_id: string; is_staff: boolean; body: string; created_at: string }[];
}
export interface PlatformIncident {
  id: string; organization_id: string | null; organization_name: string | null;
  user_id: string | null; user_email: string | null; surface: string;
  service: string | null; status_code: number | null; module: string; source: string;
  route: string | null; error_name: string | null; error_message: string;
  stack_trace: string | null; app_version: string | null;
  occurrence_count: number; first_seen_at: string; last_seen_at: string;
}
export interface BackendErrorCatalogEntry {
  service: string; service_name: string; repository: string; code: string;
  enum_name: string; catalog_message: string; http_status: number;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) throw new Error('Authentication required');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(`${ADMIN_API_URL}${cleanPath}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.message || result.error || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export const platformApi = {
  overview: () => request<PlatformOverview>('GET', '/api/admin/overview'),
  organizations: (search = '', page = 1) => request<PlatformOrganizationsResult>('GET',
    `/api/admin/organizations?search=${encodeURIComponent(search)}&page=${page}&page_size=20`),
  users: (search = '') => request<PlatformUser[]>('GET', `/api/admin/users?search=${encodeURIComponent(search)}`),
  tickets: (status = '') => request<PlatformTicket[]>('GET', `/api/admin/support/tickets${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  ticket: (id: string) => request<PlatformTicket>('GET', `/api/admin/support/tickets/${encodeURIComponent(id)}`),
  updateTicket: (id: string, update: { status?: string; priority?: string }) =>
    request<PlatformTicket>('PATCH', `/api/admin/support/tickets/${encodeURIComponent(id)}`, update),
  reply: (id: string, body: string) => request('POST', `/api/admin/support/tickets/${encodeURIComponent(id)}/messages`, { body }),
  incidents: () => request<PlatformIncident[]>('GET', '/api/admin/support/incidents'),
  errorCatalog: () => request<BackendErrorCatalogEntry[]>('GET', '/api/admin/error-catalog'),
  data: <T = unknown>(method: string, path: string, body?: unknown) => request<T>(method, path, body),
};
