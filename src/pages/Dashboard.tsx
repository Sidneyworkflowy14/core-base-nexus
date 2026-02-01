import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { useRoles } from '@/hooks/useRoles';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  const { currentRole } = useRoles();

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao {currentTenant?.name ?? 'sistema'}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Usuário</CardTitle>
              <CardDescription>Informações da conta</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{user?.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Role: {currentRole ?? 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organização</CardTitle>
              <CardDescription>Tenant atual</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{currentTenant?.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Status: {currentTenant?.status}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Início Rápido</CardTitle>
              <CardDescription>Próximos passos</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Use o menu lateral para navegar.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
