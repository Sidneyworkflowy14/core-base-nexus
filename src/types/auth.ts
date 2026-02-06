import { User, Session } from '@supabase/supabase-js';

export type AppRole = 'superadmin' | 'tenant_admin' | 'tenant_user';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
}

export interface Membership {
  id: string;
  tenant_id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  tenant?: Tenant;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateProfile: (data: { full_name?: string; name?: string; avatar_url?: string }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

export interface TenantContextType {
  currentTenant: Tenant | null;
  currentMembership: Membership | null;
  userTenants: Membership[];
  loading: boolean;
  setCurrentTenant: (tenantId: string) => void;
  refetchTenants: () => Promise<void>;
}

export interface AuditLog {
  id: string;
  tenant_id: string | null;
  actor_user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  metadata_json: Record<string, unknown>;
  created_at: string;
}
