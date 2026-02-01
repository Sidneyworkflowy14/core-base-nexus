import { useEffect, useState } from 'react';
import { useRoles } from '@/hooks/useRoles';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tenant } from '@/types/auth';
import { Building2, Users, FileText, Activity } from 'lucide-react';

export default function SuperAdminPage() {
  const { isSuperAdmin } = useRoles();
  const { log } = useAuditLog();
  const { logs, loading: logsLoading, fetchLogs } = useAuditLogs();
  
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTenantName, setNewTenantName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Stats
  const [stats, setStats] = useState<{
    tenants: number;
    users: number;
    pages: number;
  }>({ tenants: 0, users: 0, pages: 0 });

  const [selectedTenantForLogs, setSelectedTenantForLogs] = useState<string>('');

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

  const fetchStats = async () => {
    try {
      const [tenantsRes, membershipsRes, pagesRes] = await Promise.all([
        supabase.from('tenants').select('id', { count: 'exact', head: true }),
        supabase.from('memberships').select('user_id', { count: 'exact', head: true }),
        supabase.from('pages').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        tenants: tenantsRes.count || 0,
        users: membershipsRes.count || 0,
        pages: pagesRes.count || 0,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchTenants();
      fetchStats();
      fetchLogs({ limit: 50 });
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (selectedTenantForLogs) {
      fetchLogs({ tenantId: selectedTenantForLogs, limit: 100 });
    } else {
      fetchLogs({ limit: 50 });
    }
  }, [selectedTenantForLogs]);

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
      await fetchStats();
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
      <AppLayout>
        <div className="text-destructive">Acesso negado. Apenas super admins.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Super Admin</h1>
          <p className="text-muted-foreground">Gerenciamento global do sistema</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Organizações</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tenants}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Páginas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pages}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tenants" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tenants">Organizações</TabsTrigger>
            <TabsTrigger value="logs">
              <Activity className="h-4 w-4 mr-2" />
              Logs de Auditoria
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tenants" className="space-y-4">
            {/* Create tenant */}
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

            {/* Tenants list */}
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
                            <Badge
                              variant={
                                tenant.status === 'active' ? 'default' :
                                tenant.status === 'inactive' ? 'secondary' : 'destructive'
                              }
                            >
                              {tenant.status}
                            </Badge>
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
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Logs de Auditoria</CardTitle>
                <CardDescription>Atividades recentes do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Label>Filtrar por tenant:</Label>
                  <Select value={selectedTenantForLogs} onValueChange={setSelectedTenantForLogs}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Todos os tenants" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      {tenants.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {logsLoading ? (
                  <div className="text-muted-foreground">Carregando logs...</div>
                ) : logs.length === 0 ? (
                  <div className="text-muted-foreground">Nenhum log encontrado.</div>
                ) : (
                  <div className="overflow-auto max-h-96">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Ação</TableHead>
                          <TableHead>Entidade</TableHead>
                          <TableHead>Detalhes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((logEntry) => (
                          <TableRow key={logEntry.id}>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(logEntry.created_at).toLocaleString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{logEntry.action}</Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {logEntry.entity}
                              {logEntry.entity_id && (
                                <span className="text-muted-foreground ml-1">
                                  ({logEntry.entity_id.slice(0, 8)}...)
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs max-w-xs truncate">
                              {JSON.stringify(logEntry.metadata_json)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
