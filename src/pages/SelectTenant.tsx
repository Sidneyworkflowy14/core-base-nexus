import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SelectTenantPage() {
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

  // If user has only one tenant or has already selected one, go to dashboard
  if (userTenants.length === 1 || currentTenant) {
    return <Navigate to="/dashboard" replace />;
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
    setCurrentTenant(tenantId);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Selecionar organização</CardTitle>
          <CardDescription>
            Escolha a organização que deseja acessar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {userTenants.map((membership) => (
            <Button
              key={membership.id}
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleSelect(membership.tenant_id)}
            >
              <div className="flex flex-col items-start">
                <span>{membership.tenant?.name ?? 'Sem nome'}</span>
                <span className="text-xs text-muted-foreground">
                  {membership.role === 'superadmin' && 'Super Admin'}
                  {membership.role === 'tenant_admin' && 'Administrador'}
                  {membership.role === 'tenant_user' && 'Usuário'}
                </span>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
