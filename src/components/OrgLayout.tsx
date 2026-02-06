import { useEffect } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';

export function OrgLayout() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { user, loading: authLoading } = useAuth();
  const { userTenants, currentTenant, setCurrentTenant, loading: tenantLoading } = useTenant();

  const match = userTenants.find((m) => m.tenant?.slug === orgSlug);

  useEffect(() => {
    if (!match) return;
    if (!currentTenant || currentTenant.id !== match.tenant_id) {
      setCurrentTenant(match.tenant_id);
    }
  }, [match, currentTenant, setCurrentTenant]);

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

  if (!orgSlug) {
    return <Navigate to="/select-tenant" replace />;
  }

  if (!match) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Organização não encontrada ou sem acesso.</div>
      </div>
    );
  }

  if (!currentTenant || currentTenant.id !== match.tenant_id) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Carregando organização...</div>
      </div>
    );
  }

  return <Outlet />;
}
