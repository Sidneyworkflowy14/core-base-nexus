import { useEffect, useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { useRoles } from '@/hooks/useRoles';
import { useAuditLog } from '@/hooks/useAuditLog';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';
import { AppRole, Membership } from '@/types/auth';

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
      
      // Format the data
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
      // Note: In a real app, you'd send an invite email via edge function
      // For now, we'll show a message that the user needs to sign up first
      setSuccess(`Para adicionar ${inviteEmail}, o usuário precisa criar uma conta primeiro. Use uma edge function para enviar convites.`);
      await log({
        action: 'invite_attempted',
        entity: 'membership',
        metadata: { email: inviteEmail, role: inviteRole },
      });
      setInviteEmail('');
    } catch (err) {
      setError('Erro ao enviar convite.');
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

  if (!currentTenant) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Selecione uma organização primeiro.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Usuários</h1>
            <p className="text-muted-foreground">{currentTenant.name}</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/dashboard">Voltar</Link>
          </Button>
        </div>

        {isTenantAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Convidar usuário</CardTitle>
              <CardDescription>Adicione novos membros à organização</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInvite} className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    placeholder="usuario@email.com"
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
                  <Button type="submit" disabled={inviting}>
                    {inviting ? 'Enviando...' : 'Convidar'}
                  </Button>
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
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Membros</CardTitle>
            <CardDescription>Usuários da organização</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-muted-foreground">Carregando...</div>
            ) : members.length === 0 ? (
              <div className="text-muted-foreground">Nenhum membro encontrado.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Data</TableHead>
                    {isTenantAdmin && <TableHead>Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-mono text-xs">
                        {member.user_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
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
                          <span>
                            {member.role === 'tenant_admin' && 'Admin'}
                            {member.role === 'tenant_user' && 'Usuário'}
                            {member.role === 'superadmin' && 'Super Admin'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(member.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      {isTenantAdmin && (
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemove(member.id, member.user_id)}
                          >
                            Remover
                          </Button>
                        </TableCell>
                      )}
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
