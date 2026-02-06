import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Tenant, Membership, AppRole } from '@/types/auth';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Building2, Users, UserPlus, Trash2, Edit, Check, ChevronsUpDown, Shield, Crown, User } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SystemUser {
  id: string;
  email: string;
  created_at: string;
}

interface TenantMember {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
  email?: string;
}

interface TenantDetailsModalProps {
  tenant: Tenant | null;
  open: boolean;
  onClose: () => void;
  onTenantUpdated?: (tenant?: Tenant) => void;
}

export function TenantDetailsModal({ tenant, open, onClose, onTenantUpdated }: TenantDetailsModalProps) {
  const { log } = useAuditLog();
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [allUsers, setAllUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingSlug, setEditingSlug] = useState(false);
  const [newSlug, setNewSlug] = useState('');
  
  // Add member state
  const [addingMember, setAddingMember] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [newMemberRole, setNewMemberRole] = useState<AppRole>('tenant_user');
  const [submitting, setSubmitting] = useState(false);
  const [userComboOpen, setUserComboOpen] = useState(false);

  useEffect(() => {
    if (tenant && open) {
      setNewName(tenant.name);
      setNewSlug(tenant.slug || '');
      fetchMembers();
      fetchAllUsers();
    }
  }, [tenant, open]);

  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_all_users');
      if (error) throw error;
      setAllUsers((data || []) as SystemUser[]);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchMembers = async () => {
    if (!tenant) return;
    
    setLoading(true);
    try {
      // Fetch memberships for this tenant
      const { data: memberships, error } = await supabase
        .from('memberships')
        .select('id, user_id, role, created_at')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Map with user emails from allUsers
      const formattedMembers: TenantMember[] = (memberships || []).map(m => {
        const user = allUsers.find(u => u.id === m.user_id);
        return {
          id: m.id,
          user_id: m.user_id,
          role: m.role as AppRole,
          created_at: m.created_at,
          email: user?.email,
        };
      });

      setMembers(formattedMembers);
    } catch (err) {
      console.error('Error fetching members:', err);
      toast.error('Erro ao carregar membros');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch members when allUsers changes to update emails
  useEffect(() => {
    if (allUsers.length > 0 && members.length > 0) {
      setMembers(prev => prev.map(m => ({
        ...m,
        email: allUsers.find(u => u.id === m.user_id)?.email,
      })));
    }
  }, [allUsers]);

  const handleUpdateName = async () => {
    if (!tenant || !newName.trim()) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('tenants')
        .update({ name: newName.trim() })
        .eq('id', tenant.id)
        .select('*')
        .single();

      if (error) throw error;

      await log({
        action: 'tenant_renamed',
        entity: 'tenant',
        entity_id: tenant.id,
        metadata: { old_name: tenant.name, new_name: newName.trim() },
      });

      toast.success('Nome atualizado');
      if (data) {
        onTenantUpdated?.(data as Tenant);
      } else {
        onTenantUpdated?.();
      }
      setEditingName(false);
    } catch (err) {
      console.error('Error updating tenant name:', err);
      toast.error('Erro ao atualizar nome');
    } finally {
      setSubmitting(false);
    }
  };

  const slugify = (value: string) => {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleUpdateSlug = async () => {
    if (!tenant || !newSlug.trim()) return;

    const cleaned = slugify(newSlug);
    if (!cleaned) {
      toast.error('Slug inválido');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('tenants')
        .update({ slug: cleaned })
        .eq('id', tenant.id)
        .select('*')
        .single();

      if (error) throw error;

      await log({
        action: 'tenant_slug_updated',
        entity: 'tenant',
        entity_id: tenant.id,
        metadata: { old_slug: tenant.slug, new_slug: cleaned },
      });

      toast.success('Slug atualizado');
      if (data) {
        onTenantUpdated?.(data as Tenant);
      } else {
        onTenantUpdated?.();
      }
      setEditingSlug(false);
    } catch (err: any) {
      console.error('Error updating tenant slug:', err);
      toast.error('Erro ao atualizar slug');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMember = async () => {
    if (!tenant || !selectedUserId) return;

    setSubmitting(true);
    try {
      // Check if membership already exists
      const { data: existing } = await supabase
        .from('memberships')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('user_id', selectedUserId)
        .single();

      if (existing) {
        toast.error('Este usuário já é membro desta organização');
        setSubmitting(false);
        return;
      }

      // Create membership
      const { error } = await supabase
        .from('memberships')
        .insert({
          tenant_id: tenant.id,
          user_id: selectedUserId,
          role: newMemberRole,
        });

      if (error) throw error;

      await log({
        action: 'member_added',
        entity: 'membership',
        metadata: { tenant_id: tenant.id, user_id: selectedUserId, role: newMemberRole },
      });

      toast.success('Membro adicionado');
      setSelectedUserId('');
      setNewMemberRole('tenant_user');
      setAddingMember(false);
      fetchMembers();
    } catch (err: any) {
      console.error('Error adding member:', err);
      toast.error('Erro ao adicionar membro');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (membership: TenantMember) => {
    if (!tenant) return;
    
    if (!confirm(`Remover este membro da organização?`)) return;

    try {
      const { error } = await supabase
        .from('memberships')
        .delete()
        .eq('id', membership.id);

      if (error) throw error;

      await log({
        action: 'member_removed',
        entity: 'membership',
        metadata: { tenant_id: tenant.id, user_id: membership.user_id, role: membership.role },
      });

      toast.success('Membro removido');
      fetchMembers();
    } catch (err) {
      console.error('Error removing member:', err);
      toast.error('Erro ao remover membro');
    }
  };

  const handleChangeRole = async (membership: TenantMember, newRole: AppRole) => {
    if (!tenant) return;

    try {
      const { error } = await supabase
        .from('memberships')
        .update({ role: newRole })
        .eq('id', membership.id);

      if (error) throw error;

      await log({
        action: 'member_role_changed',
        entity: 'membership',
        metadata: { tenant_id: tenant.id, user_id: membership.user_id, old_role: membership.role, new_role: newRole },
      });

      toast.success('Papel atualizado');
      fetchMembers();
    } catch (err) {
      console.error('Error changing role:', err);
      toast.error('Erro ao alterar papel');
    }
  };

  const getRoleIcon = (role: AppRole) => {
    switch (role) {
      case 'superadmin':
        return <Crown className="h-4 w-4 text-warning" />;
      case 'tenant_admin':
        return <Shield className="h-4 w-4 text-primary" />;
      default:
        return <User className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Get users that are not already members
  const availableUsers = allUsers.filter(
    user => !members.some(m => m.user_id === user.id)
  );

  const selectedUser = allUsers.find(u => u.id === selectedUserId);

  if (!tenant) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {tenant.name}
          </DialogTitle>
          <DialogDescription>
            Gerenciar organização e membros
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tenant Info */}
          <NexusCard>
            <NexusCardHeader>
              <NexusCardTitle className="text-base">Informações</NexusCardTitle>
            </NexusCardHeader>
            <NexusCardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-muted-foreground text-xs">Nome</Label>
                  {editingName ? (
                    <div className="flex items-center gap-2 mt-1">
                      <NexusInput
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-48"
                      />
                      <NexusButton size="sm" onClick={handleUpdateName} loading={submitting}>
                        Salvar
                      </NexusButton>
                      <NexusButton size="sm" variant="ghost" onClick={() => setEditingName(false)}>
                        Cancelar
                      </NexusButton>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{tenant.name}</p>
                      <NexusButton size="icon-sm" variant="ghost" onClick={() => setEditingName(true)}>
                        <Edit className="h-3 w-3" />
                      </NexusButton>
                    </div>
                  )}
                </div>
                <NexusBadge variant={tenant.status === 'active' ? 'success' : 'destructive'}>
                  {tenant.status}
                </NexusBadge>
              </div>

              <div>
                <Label className="text-muted-foreground text-xs">Slug (URL)</Label>
                {editingSlug ? (
                  <div className="flex items-center gap-2 mt-1">
                    <NexusInput
                      value={newSlug}
                      onChange={(e) => setNewSlug(e.target.value)}
                      className="w-48"
                    />
                    <NexusButton size="sm" onClick={handleUpdateSlug} loading={submitting}>
                      Salvar
                    </NexusButton>
                    <NexusButton size="sm" variant="ghost" onClick={() => { setEditingSlug(false); setNewSlug(tenant.slug || ''); }}>
                      Cancelar
                    </NexusButton>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-xs">{tenant.slug || '-'}</p>
                    <NexusButton size="icon-sm" variant="ghost" onClick={() => setEditingSlug(true)}>
                      <Edit className="h-3 w-3" />
                    </NexusButton>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Ex: iservice-solucoes
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground text-xs">ID</Label>
                  <p className="font-mono text-xs">{tenant.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Criado em</Label>
                  <p>{new Date(tenant.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            </NexusCardContent>
          </NexusCard>

          {/* Members */}
          <NexusCard>
            <NexusCardHeader className="flex flex-row items-center justify-between">
              <div>
                <NexusCardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Membros ({members.length})
                </NexusCardTitle>
                <NexusCardDescription>Usuários com acesso a esta organização</NexusCardDescription>
              </div>
              <NexusButton size="sm" onClick={() => setAddingMember(true)}>
                <UserPlus className="h-4 w-4 mr-1" />
                Adicionar
              </NexusButton>
            </NexusCardHeader>
            <NexusCardContent>
              {/* Add member form */}
              {addingMember && (
                <div className="mb-4 p-4 border rounded-lg bg-muted/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Adicionar novo membro</span>
                  </div>
                  <div className="grid gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Usuário</Label>
                      <Popover open={userComboOpen} onOpenChange={setUserComboOpen}>
                        <PopoverTrigger asChild>
                          <button
                            role="combobox"
                            aria-expanded={userComboOpen}
                            className={cn(
                              "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                              !selectedUserId && "text-muted-foreground"
                            )}
                          >
                            {selectedUser?.email || "Selecione um usuário..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Buscar usuário por email..." />
                            <CommandList>
                              <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
                              <CommandGroup>
                                {availableUsers.map((user) => (
                                  <CommandItem
                                    key={user.id}
                                    value={user.email}
                                    onSelect={() => {
                                      setSelectedUserId(user.id);
                                      setUserComboOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedUserId === user.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <span>{user.email}</span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Papel</Label>
                      <Select value={newMemberRole} onValueChange={(v) => setNewMemberRole(v as AppRole)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tenant_user">Usuário</SelectItem>
                          <SelectItem value="tenant_admin">Admin</SelectItem>
                          <SelectItem value="superadmin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <NexusButton size="sm" onClick={handleAddMember} loading={submitting} disabled={!selectedUserId}>
                        Adicionar
                      </NexusButton>
                      <NexusButton size="sm" variant="ghost" onClick={() => { setAddingMember(false); setSelectedUserId(''); }}>
                        Cancelar
                      </NexusButton>
                    </div>
                  </div>
                </div>
              )}

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
                      <NexusTableHead>Usuário</NexusTableHead>
                      <NexusTableHead>Papel</NexusTableHead>
                      <NexusTableHead>Desde</NexusTableHead>
                      <NexusTableHead>Ações</NexusTableHead>
                    </NexusTableRow>
                  </NexusTableHeader>
                  <NexusTableBody>
                    {members.map((member) => (
                      <NexusTableRow key={member.id}>
                        <NexusTableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{member.email || 'Email não disponível'}</span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {member.user_id.slice(0, 8)}...
                            </span>
                          </div>
                        </NexusTableCell>
                        <NexusTableCell>
                          <div className="flex items-center gap-2">
                            {getRoleIcon(member.role)}
                            <Select
                              value={member.role}
                              onValueChange={(v) => handleChangeRole(member, v as AppRole)}
                            >
                              <SelectTrigger className="w-32 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="tenant_user">Usuário</SelectItem>
                                <SelectItem value="tenant_admin">Admin</SelectItem>
                                <SelectItem value="superadmin">Super Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </NexusTableCell>
                        <NexusTableCell className="text-xs text-muted-foreground">
                          {new Date(member.created_at).toLocaleDateString('pt-BR')}
                        </NexusTableCell>
                        <NexusTableCell>
                          <NexusButton
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => handleRemoveMember(member)}
                            title="Remover membro"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </NexusButton>
                        </NexusTableCell>
                      </NexusTableRow>
                    ))}
                  </NexusTableBody>
                </NexusTable>
              )}
            </NexusCardContent>
          </NexusCard>
        </div>
      </DialogContent>
    </Dialog>
  );
}
