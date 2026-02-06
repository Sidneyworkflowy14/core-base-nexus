import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';

export function OrgRootRedirect() {
  const { user, loading: authLoading } = useAuth();
  const { currentTenant, userTenants, setCurrentTenant, loading: tenantLoading } = useTenant();

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

  if (currentTenant?.slug) {
    return <Navigate to={`/${currentTenant.slug}/dashboard`} replace />;
  }

  if (userTenants.length === 1 && userTenants[0].tenant?.slug) {
    setCurrentTenant(userTenants[0].tenant_id);
    return <Navigate to={`/${userTenants[0].tenant.slug}/dashboard`} replace />;
  }

  return <Navigate to="/select-tenant" replace />;
}
