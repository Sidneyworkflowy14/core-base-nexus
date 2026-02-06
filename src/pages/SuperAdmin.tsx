import { useEffect, useState } from 'react';
import { useRoles } from '@/hooks/useRoles';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
import { TenantDetailsModal } from '@/components/superadmin/TenantDetailsModal';
import { 
  NexusButton, 
  NexusCard, 
  NexusCardHeader, 
  NexusCardTitle, 
  NexusCardDescription, 
  NexusCardContent,
  NexusInput,
  NexusBadge,
  NexusTable,
  NexusTableHeader,
  NexusTableBody,
  NexusTableRow,
  NexusTableHead,
  NexusTableCell,
  NexusTabs,
  NexusTabsList,
  NexusTabsTrigger,
  NexusTabsContent,
} from '@/components/nexus';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tenant } from '@/types/auth';
import { Building2, Users, FileText, Activity, Shield, Sparkles, Eye } from 'lucide-react';

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

  const [selectedTenantForLogs, setSelectedTenantForLogs] = useState<string>('__all__');
  
  // Modal state
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(
        (data || []).map((tenant: any) => ({
          ...tenant,
          slug: tenant.slug || '',
        })) as Tenant[]
      );
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
    if (selectedTenantForLogs && selectedTenantForLogs !== '__all__') {
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
      const slugBase = newTenantName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      const slug = slugBase || `org-${Date.now()}`;

      const { data, error } = await supabase
        .from('tenants')
        .insert([{ name: newTenantName, slug }])
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

  const handleOpenDetails = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setDetailsModalOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsModalOpen(false);
    setSelectedTenant(null);
  };

  if (!isSuperAdmin) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <NexusCard className="text-center p-8">
            <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold">Acesso Negado</h2>
            <p className="text-muted-foreground">Apenas super admins podem acessar esta página.</p>
          </NexusCard>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <Shield className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-semibold">Super Admin</h1>
            <NexusBadge variant="beta">ADMIN</NexusBadge>
          </div>
          <p className="text-muted-foreground mt-1">Gerenciamento global do sistema</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <NexusCard>
            <NexusCardContent className="flex items-center gap-4 py-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Organizações</p>
                <p className="text-2xl font-bold">{stats.tenants}</p>
              </div>
            </NexusCardContent>
          </NexusCard>
          <NexusCard>
            <NexusCardContent className="flex items-center gap-4 py-4">
              <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Usuários</p>
                <p className="text-2xl font-bold">{stats.users}</p>
              </div>
            </NexusCardContent>
          </NexusCard>
          <NexusCard>
            <NexusCardContent className="flex items-center gap-4 py-4">
              <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Páginas</p>
                <p className="text-2xl font-bold">{stats.pages}</p>
              </div>
            </NexusCardContent>
          </NexusCard>
        </div>

        <NexusTabs defaultValue="tenants" className="space-y-4">
          <NexusTabsList>
            <NexusTabsTrigger value="tenants">
              <Building2 className="h-4 w-4 mr-2" />
              Organizações
            </NexusTabsTrigger>
            <NexusTabsTrigger value="logs">
              <Activity className="h-4 w-4 mr-2" />
              Logs de Auditoria
            </NexusTabsTrigger>
          </NexusTabsList>

          <NexusTabsContent value="tenants" className="space-y-4">
            {/* Create tenant */}
            <NexusCard>
              <NexusCardHeader>
                <NexusCardTitle>Nova organização</NexusCardTitle>
                <NexusCardDescription>Criar uma nova organização (tenant)</NexusCardDescription>
              </NexusCardHeader>
              <NexusCardContent>
                <form onSubmit={handleCreateTenant} className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <NexusInput
                      id="name"
                      value={newTenantName}
                      onChange={(e) => setNewTenantName(e.target.value)}
                      required
                      placeholder="Nome da organização"
                    />
                  </div>
                  <div className="flex items-end">
                    <NexusButton type="submit" loading={creating}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Criar
                    </NexusButton>
                  </div>
                </form>
                {error && (
                  <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
              </NexusCardContent>
            </NexusCard>

            {/* Tenants list */}
            <NexusCard>
              <NexusCardHeader>
                <NexusCardTitle>Organizações</NexusCardTitle>
                <NexusCardDescription>Todas as organizações do sistema</NexusCardDescription>
              </NexusCardHeader>
              <NexusCardContent>
                {loading ? (
                  <div className="text-muted-foreground py-8 text-center">Carregando...</div>
                ) : tenants.length === 0 ? (
                  <div className="text-muted-foreground py-8 text-center">
                    Nenhuma organização encontrada.
                  </div>
                ) : (
                  <NexusTable>
                    <NexusTableHeader>
                      <NexusTableRow>
                        <NexusTableHead>Nome</NexusTableHead>
                        <NexusTableHead>Status</NexusTableHead>
                        <NexusTableHead>Criado em</NexusTableHead>
                        <NexusTableHead>Ações</NexusTableHead>
                      </NexusTableRow>
                    </NexusTableHeader>
                    <NexusTableBody>
                      {tenants.map((tenant) => (
                        <NexusTableRow 
                          key={tenant.id} 
                          className="cursor-pointer hover:bg-accent/50"
                          onClick={() => handleOpenDetails(tenant)}
                        >
                          <NexusTableCell className="font-medium">{tenant.name}</NexusTableCell>
                          <NexusTableCell>
                            <NexusBadge
                              variant={
                                tenant.status === 'active' ? 'success' :
                                tenant.status === 'inactive' ? 'muted' : 'destructive'
                              }
                            >
                              {tenant.status}
                            </NexusBadge>
                          </NexusTableCell>
                          <NexusTableCell className="text-muted-foreground text-sm">
                            {new Date(tenant.created_at).toLocaleDateString('pt-BR')}
                          </NexusTableCell>
                          <NexusTableCell>
                            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                              <NexusButton
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleOpenDetails(tenant)}
                                title="Ver detalhes"
                              >
                                <Eye className="h-4 w-4" />
                              </NexusButton>
                              {tenant.status === 'active' ? (
                                <NexusButton
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusChange(tenant.id, 'suspended')}
                                >
                                  Suspender
                                </NexusButton>
                              ) : (
                                <NexusButton
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusChange(tenant.id, 'active')}
                                >
                                  Ativar
                                </NexusButton>
                              )}
                            </div>
                          </NexusTableCell>
                        </NexusTableRow>
                      ))}
                    </NexusTableBody>
                  </NexusTable>
                )}
              </NexusCardContent>
            </NexusCard>
          </NexusTabsContent>

          <NexusTabsContent value="logs" className="space-y-4">
            <NexusCard>
              <NexusCardHeader>
                <NexusCardTitle>Logs de Auditoria</NexusCardTitle>
                <NexusCardDescription>Atividades recentes do sistema</NexusCardDescription>
              </NexusCardHeader>
              <NexusCardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Label>Filtrar por tenant:</Label>
                  <Select value={selectedTenantForLogs} onValueChange={setSelectedTenantForLogs}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Todos os tenants" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Todos</SelectItem>
                      {tenants.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {logsLoading ? (
                  <div className="text-muted-foreground py-8 text-center">Carregando logs...</div>
                ) : logs.length === 0 ? (
                  <div className="text-muted-foreground py-8 text-center">
                    Nenhum log encontrado.
                  </div>
                ) : (
                  <div className="overflow-auto max-h-[500px]">
                    <NexusTable>
                      <NexusTableHeader>
                        <NexusTableRow>
                          <NexusTableHead>Data</NexusTableHead>
                          <NexusTableHead>Ação</NexusTableHead>
                          <NexusTableHead>Entidade</NexusTableHead>
                          <NexusTableHead>Detalhes</NexusTableHead>
                        </NexusTableRow>
                      </NexusTableHeader>
                      <NexusTableBody>
                        {logs.map((logEntry) => (
                          <NexusTableRow key={logEntry.id}>
                            <NexusTableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(logEntry.created_at).toLocaleString('pt-BR')}
                            </NexusTableCell>
                            <NexusTableCell>
                              <NexusBadge variant="outline">{logEntry.action}</NexusBadge>
                            </NexusTableCell>
                            <NexusTableCell className="font-mono text-xs">
                              {logEntry.entity}
                              {logEntry.entity_id && (
                                <span className="text-muted-foreground ml-1">
                                  ({logEntry.entity_id.slice(0, 8)}...)
                                </span>
                              )}
                            </NexusTableCell>
                            <NexusTableCell className="text-xs max-w-xs truncate">
                              {JSON.stringify(logEntry.metadata_json)}
                            </NexusTableCell>
                          </NexusTableRow>
                        ))}
                      </NexusTableBody>
                    </NexusTable>
                  </div>
                )}
              </NexusCardContent>
            </NexusCard>
          </NexusTabsContent>
        </NexusTabs>

        {/* Tenant Details Modal */}
        <TenantDetailsModal
          tenant={selectedTenant}
          open={detailsModalOpen}
          onClose={handleCloseDetails}
          onTenantUpdated={(updatedTenant) => {
            if (updatedTenant) {
              setSelectedTenant(updatedTenant);
            }
            fetchTenants();
            fetchStats();
          }}
        />
      </div>
    </AppLayout>
  );
}
