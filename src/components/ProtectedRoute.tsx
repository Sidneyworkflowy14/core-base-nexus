import { ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { useRoles } from '@/hooks/useRoles';
import { AppRole } from '@/types/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  requireTenant?: boolean;
  minRole?: AppRole;
}

export function ProtectedRoute({ children, requireTenant = false, minRole }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { currentTenant, userTenants, loading: tenantLoading } = useTenant();
  const { hasMinRole } = useRoles();
  const { orgSlug } = useParams<{ orgSlug?: string }>();

  if (authLoading || tenantLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If user has multiple tenants and no current tenant selected
  if (requireTenant && !currentTenant && userTenants.length > 1) {
    return <Navigate to="/select-tenant" replace />;
  }

  // If user has no tenants at all
  if (requireTenant && userTenants.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Sem acesso</h1>
          <p className="text-muted-foreground mt-2">
            Você não tem acesso a nenhuma organização.
          </p>
        </div>
      </div>
    );
  }

  // Check minimum role
  if (minRole && !hasMinRole(minRole)) {
    const slug = currentTenant?.slug || orgSlug;
    return <Navigate to={slug ? `/${slug}/dashboard` : "/dashboard"} replace />;
  }

  return <>{children}</>;
}
