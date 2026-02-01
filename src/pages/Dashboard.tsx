import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { useRoles } from '@/hooks/useRoles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { signOut, user } = useAuth();
  const { currentTenant, userTenants } = useTenant();
  const { isSuperAdmin, isTenantAdmin, currentRole } = useRoles();

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-muted-foreground">
              {currentTenant?.name ?? 'Nenhuma organização selecionada'}
            </p>
          </div>
          <div className="flex gap-2">
            {userTenants.length > 1 && (
              <Button variant="outline" asChild>
                <Link to="/select-tenant">Trocar org</Link>
              </Button>
            )}
            <Button variant="outline" onClick={signOut}>
              Sair
            </Button>
          </div>
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

          {isTenantAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Usuários</CardTitle>
                <CardDescription>Gerenciar usuários do tenant</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/users">Gerenciar usuários</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {isSuperAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Super Admin</CardTitle>
                <CardDescription>Painel administrativo global</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/superadmin">Acessar painel</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
