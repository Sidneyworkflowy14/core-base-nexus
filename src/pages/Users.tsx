import { useEffect, useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { useRoles } from '@/hooks/useRoles';
import { useAuditLog } from '@/hooks/useAuditLog';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/AppLayout';
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
} from '@/components/nexus';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppRole, Membership } from '@/types/auth';
import { Users, UserPlus, Mail } from 'lucide-react';

interface MembershipWithEmail extends Membership {
  email?: string;
}

export default function UsersPage() {
  const { currentTenant, refetchTenants } = useTenant();
  const { isTenantAdmin } = useRoles();
  const { log } = useAuditLog();
  const [members, setMembers] = useState<MembershipWithEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AppRole>('tenant_user');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchMembers = async () => {
    if (!currentTenant) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('memberships')
        .select('*')
        .eq('tenant_id', currentTenant.id);

      if (error) throw error;
      
      const formattedMembers: MembershipWithEmail[] = (data || []).map((m) => ({
        id: m.id,
        tenant_id: m.tenant_id,
        user_id: m.user_id,
        role: m.role as AppRole,
        created_at: m.created_at,
      }));

      setMembers(formattedMembers);
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [currentTenant]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant || !isTenantAdmin) return;

    setInviting(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email: inviteEmail,
          role: inviteRole,
          tenantId: currentTenant.id,
          redirectTo: `${window.location.origin}/auth`,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.status === 'added_existing') {
        setSuccess(`Usuário ${inviteEmail} já tinha conta e foi adicionado à organização.`);
      } else {
        setSuccess(`Convite enviado para ${inviteEmail}.`);
      }

      await log({
        action: 'invite_sent',
        entity: 'membership',
        metadata: { email: inviteEmail, role: inviteRole, result: data?.status },
      });

      setInviteEmail('');
      await fetchMembers();
      await refetchTenants();
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: string }).message)
          : 'Erro ao enviar convite.';
      setError(message);
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (membershipId: string, userId: string) => {
    if (!isTenantAdmin) return;
    
    try {
      const { error } = await supabase
        .from('memberships')
        .delete()
        .eq('id', membershipId);

      if (error) throw error;

      await log({
        action: 'member_removed',
        entity: 'membership',
        entity_id: membershipId,
        metadata: { user_id: userId },
      });

      await fetchMembers();
      await refetchTenants();
    } catch (err) {
      console.error('Error removing member:', err);
    }
  };

  const handleRoleChange = async (membershipId: string, newRole: AppRole) => {
    if (!isTenantAdmin) return;

    try {
      const { error } = await supabase
        .from('memberships')
        .update({ role: newRole })
        .eq('id', membershipId);

      if (error) throw error;

      await log({
        action: 'role_changed',
        entity: 'membership',
        entity_id: membershipId,
        metadata: { new_role: newRole },
      });

      await fetchMembers();
    } catch (err) {
      console.error('Error updating role:', err);
    }
  };

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case 'superadmin': return 'destructive';
      case 'tenant_admin': return 'default';
      default: return 'muted';
    }
  };

  const getRoleLabel = (role: AppRole) => {
    switch (role) {
      case 'superadmin': return 'Super Admin';
      case 'tenant_admin': return 'Admin';
      default: return 'Usuário';
    }
  };

  if (!currentTenant) {
    return (
      <AppLayout>
        <div className="text-muted-foreground">Selecione uma organização primeiro.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <Users className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-semibold">Usuários</h1>
          </div>
          <p className="text-muted-foreground mt-1">{currentTenant.name}</p>
        </div>

        {/* Invite user */}
        {isTenantAdmin && (
          <NexusCard>
            <NexusCardHeader>
              <NexusCardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Convidar usuário
              </NexusCardTitle>
              <NexusCardDescription>Adicione novos membros à organização</NexusCardDescription>
            </NexusCardHeader>
            <NexusCardContent>
              <form onSubmit={handleInvite} className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <NexusInput
                    id="email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    placeholder="usuario@email.com"
                    icon={<Mail className="h-4 w-4" />}
                  />
                </div>
                <div className="w-40 space-y-2">
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tenant_user">Usuário</SelectItem>
                      <SelectItem value="tenant_admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <NexusButton type="submit" loading={inviting}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Convidar
                  </NexusButton>
                </div>
              </form>
              {error && (
                <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              {success && (
                <div className="mt-4 rounded-md bg-primary/10 p-3 text-sm text-primary">
                  {success}
                </div>
              )}
            </NexusCardContent>
          </NexusCard>
        )}

        {/* Members list */}
        <NexusCard>
          <NexusCardHeader>
            <NexusCardTitle>Membros</NexusCardTitle>
            <NexusCardDescription>Usuários da organização</NexusCardDescription>
          </NexusCardHeader>
          <NexusCardContent>
            {loading ? (
              <div className="text-muted-foreground py-8 text-center">Carregando...</div>
            ) : members.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                Nenhum membro encontrado.
              </div>
            ) : (
              <NexusTable>
                <NexusTableHeader>
                  <NexusTableRow>
                    <NexusTableHead>User ID</NexusTableHead>
                    <NexusTableHead>Role</NexusTableHead>
                    <NexusTableHead>Data</NexusTableHead>
                    {isTenantAdmin && <NexusTableHead>Ações</NexusTableHead>}
                  </NexusTableRow>
                </NexusTableHeader>
                <NexusTableBody>
                  {members.map((member) => (
                    <NexusTableRow key={member.id}>
                      <NexusTableCell className="font-mono text-xs">
                        {member.user_id.slice(0, 8)}...
                      </NexusTableCell>
                      <NexusTableCell>
                        {isTenantAdmin ? (
                          <Select
                            value={member.role}
                            onValueChange={(v) => handleRoleChange(member.id, v as AppRole)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tenant_user">Usuário</SelectItem>
                              <SelectItem value="tenant_admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <NexusBadge variant={getRoleBadgeVariant(member.role)}>
                            {getRoleLabel(member.role)}
                          </NexusBadge>
                        )}
                      </NexusTableCell>
                      <NexusTableCell className="text-muted-foreground text-sm">
                        {new Date(member.created_at).toLocaleDateString('pt-BR')}
                      </NexusTableCell>
                      {isTenantAdmin && (
                        <NexusTableCell>
                          <NexusButton
                            variant="danger"
                            size="sm"
                            onClick={() => handleRemove(member.id, member.user_id)}
                          >
                            Remover
                          </NexusButton>
                        </NexusTableCell>
                      )}
                    </NexusTableRow>
                  ))}
                </NexusTableBody>
              </NexusTable>
            )}
          </NexusCardContent>
        </NexusCard>
      </div>
    </AppLayout>
  );
}
