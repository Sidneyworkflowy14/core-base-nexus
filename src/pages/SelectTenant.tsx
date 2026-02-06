import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Check, ArrowLeft } from 'lucide-react';
import { NexusBadge } from '@/components/nexus';

export default function SelectTenantPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { userTenants, currentTenant, setCurrentTenant, loading: tenantLoading } = useTenant();

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

  // If user has only one tenant and NO current selection, auto-select
  if (userTenants.length === 1 && !currentTenant) {
    setCurrentTenant(userTenants[0].tenant_id);
    if (userTenants[0].tenant?.slug) {
      return <Navigate to={`/${userTenants[0].tenant.slug}/dashboard`} replace />;
    }
    return <Navigate to="/select-tenant" replace />;
  }

  // If user has no tenants
  if (userTenants.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sem organizações</CardTitle>
            <CardDescription>
              Você ainda não faz parte de nenhuma organização.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Entre em contato com o administrador para receber um convite.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSelect = (tenantId: string) => {
    const membership = userTenants.find((m) => m.tenant_id === tenantId);
    setCurrentTenant(tenantId);
    if (membership?.tenant?.slug) {
      navigate(`/${membership.tenant.slug}/dashboard`);
    } else {
      navigate('/select-tenant');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superadmin':
        return <NexusBadge variant="beta" size="sm">Super Admin</NexusBadge>;
      case 'tenant_admin':
        return <NexusBadge variant="success" size="sm">Admin</NexusBadge>;
      default:
        return <NexusBadge variant="muted" size="sm">Usuário</NexusBadge>;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Selecionar organização</CardTitle>
              <CardDescription>
                Escolha a organização que deseja acessar
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {userTenants.map((membership) => {
            const isSelected = currentTenant?.id === membership.tenant_id;
            return (
              <Button
                key={membership.id}
                variant={isSelected ? "default" : "outline"}
                className="w-full justify-between h-auto py-3"
                onClick={() => handleSelect(membership.tenant_id)}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    {membership.tenant?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{membership.tenant?.name ?? 'Sem nome'}</span>
                    {getRoleBadge(membership.role)}
                  </div>
                </div>
                {isSelected && <Check className="h-4 w-4" />}
              </Button>
            );
          })}
          
          {currentTenant && (
            <Button
              variant="ghost"
              className="w-full mt-4"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
