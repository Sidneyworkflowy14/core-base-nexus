import { useEffect, useState } from 'react';
import { useRoles } from '@/hooks/useRoles';
import { useAuditLog } from '@/hooks/useAuditLog';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';
import { Tenant } from '@/types/auth';

export default function SuperAdminPage() {
  const { isSuperAdmin } = useRoles();
  const { log } = useAuditLog();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTenantName, setNewTenantName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants((data || []) as Tenant[]);
    } catch (err) {
      console.error('Error fetching tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchTenants();
    }
  }, [isSuperAdmin]);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;

    setCreating(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('tenants')
        .insert([{ name: newTenantName }])
        .select()
        .single();

      if (error) throw error;

      await log({
        action: 'tenant_created',
        entity: 'tenant',
        entity_id: data.id,
        metadata: { name: newTenantName },
      });

      setNewTenantName('');
      await fetchTenants();
    } catch (err) {
      console.error('Error creating tenant:', err);
      setError('Erro ao criar organização.');
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (tenantId: string, newStatus: string) => {
    if (!isSuperAdmin) return;

    try {
      const { error } = await supabase
        .from('tenants')
        .update({ status: newStatus })
        .eq('id', tenantId);

      if (error) throw error;

      await log({
        action: 'tenant_status_changed',
        entity: 'tenant',
        entity_id: tenantId,
        metadata: { new_status: newStatus },
      });

      await fetchTenants();
    } catch (err) {
      console.error('Error updating tenant:', err);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-destructive">Acesso negado. Apenas super admins.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Super Admin</h1>
            <p className="text-muted-foreground">Gerenciamento global</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/dashboard">Voltar</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nova organização</CardTitle>
            <CardDescription>Criar uma nova organização (tenant)</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTenant} className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  required
                  placeholder="Nome da organização"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={creating}>
                  {creating ? 'Criando...' : 'Criar'}
                </Button>
              </div>
            </form>
            {error && (
              <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organizações</CardTitle>
            <CardDescription>Todas as organizações do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-muted-foreground">Carregando...</div>
            ) : tenants.length === 0 ? (
              <div className="text-muted-foreground">Nenhuma organização encontrada.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">{tenant.name}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            tenant.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : tenant.status === 'inactive'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {tenant.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(tenant.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {tenant.status === 'active' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(tenant.id, 'suspended')}
                            >
                              Suspender
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(tenant.id, 'active')}
                            >
                              Ativar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
