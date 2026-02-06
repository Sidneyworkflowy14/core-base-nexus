import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/AppLayout';
import {
  NexusButton,
  NexusCard,
  NexusCardContent,
  NexusCardDescription,
  NexusCardHeader,
  NexusCardTitle,
  NexusInput,
} from '@/components/nexus';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const currentName =
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      (user.email ? user.email.split('@')[0] : '');
    setName(currentName || '');
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await updateProfile({ full_name: name.trim(), name: name.trim() });
      if (error) {
        toast.error('Não foi possível salvar o perfil');
        return;
      }
      toast.success('Perfil atualizado');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações básicas</p>
        </div>

        <NexusCard>
          <NexusCardHeader>
            <NexusCardTitle>Dados do usuário</NexusCardTitle>
            <NexusCardDescription>Atualize seu nome de exibição</NexusCardDescription>
          </NexusCardHeader>
          <NexusCardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Nome</Label>
                <NexusInput
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <NexusInput
                  id="profile-email"
                  value={user?.email || ''}
                  readOnly
                />
              </div>
              <div className="flex items-center gap-3">
                <NexusButton type="submit" loading={saving}>
                  Salvar alterações
                </NexusButton>
              </div>
            </form>
          </NexusCardContent>
        </NexusCard>
      </div>
    </AppLayout>
  );
}
