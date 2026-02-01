import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useNavItems } from '@/hooks/useNavItems';
import { usePages } from '@/hooks/usePages';
import { AppLayout } from '@/components/AppLayout';
import { 
  NexusButton, 
  NexusCard, 
  NexusCardHeader, 
  NexusCardTitle, 
  NexusCardDescription, 
  NexusCardContent,
  NexusInput,
  NexusTable,
  NexusTableHeader,
  NexusTableBody,
  NexusTableRow,
  NexusTableHead,
  NexusTableCell,
} from '@/components/nexus';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AVAILABLE_ICONS, IconName } from '@/types/nav';
import { DynamicIcon } from '@/components/DynamicIcon';
import { ArrowUp, ArrowDown, Trash, Plus, Settings, Palette } from 'lucide-react';

export default function SettingsPage() {
  const { currentTenant } = useTenant();
  const { navItems, loading, createNavItem, updateNavItem, deleteNavItem, reorderNavItems } = useNavItems();
  const { pages } = usePages();

  const [newItem, setNewItem] = useState({
    title: '',
    icon: 'file' as IconName,
    route: '',
  });
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title || !newItem.route) return;

    setCreating(true);
    try {
      await createNavItem({
        title: newItem.title,
        icon: newItem.icon,
        route: newItem.route.startsWith('/') ? newItem.route : `/${newItem.route}`,
      });
      setNewItem({ title: '', icon: 'file', route: '' });
    } catch (error) {
      console.error('Error creating nav item:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const items = [...navItems];
    const current = items[index];
    const previous = items[index - 1];
    
    await reorderNavItems([
      { id: current.id, order: previous.order },
      { id: previous.id, order: current.order },
    ]);
  };

  const handleMoveDown = async (index: number) => {
    if (index === navItems.length - 1) return;
    const items = [...navItems];
    const current = items[index];
    const next = items[index + 1];
    
    await reorderNavItems([
      { id: current.id, order: next.order },
      { id: next.id, order: current.order },
    ]);
  };

  const handleToggleVisibility = async (id: string, isVisible: boolean) => {
    await updateNavItem(id, { is_visible: !isVisible });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Remover este item do menu?')) {
      await deleteNavItem(id);
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
            <Settings className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-semibold">Configurações</h1>
          </div>
          <p className="text-muted-foreground mt-1">{currentTenant.name}</p>
        </div>

        {/* Brand Settings Link */}
        <NexusCard>
          <NexusCardHeader>
            <NexusCardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Personalização Visual
            </NexusCardTitle>
            <NexusCardDescription>
              Customize cores, fonte e estilo do seu workspace
            </NexusCardDescription>
          </NexusCardHeader>
          <NexusCardContent>
            <NexusButton asChild>
              <Link to="/settings/brand">
                <Palette className="h-4 w-4 mr-2" />
                Abrir Brand Settings
              </Link>
            </NexusButton>
          </NexusCardContent>
        </NexusCard>

        {/* Add new nav item */}
        <NexusCard>
          <NexusCardHeader>
            <NexusCardTitle>Adicionar item ao menu</NexusCardTitle>
            <NexusCardDescription>Crie um novo item para a sidebar</NexusCardDescription>
          </NexusCardHeader>
          <NexusCardContent>
            <form onSubmit={handleCreate} className="flex gap-4 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="title">Título</Label>
                <NexusInput
                  id="title"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  placeholder="Minha Página"
                  required
                />
              </div>
              <div className="w-32 space-y-2">
                <Label>Ícone</Label>
                <Select
                  value={newItem.icon}
                  onValueChange={(v) => setNewItem({ ...newItem, icon: v as IconName })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {AVAILABLE_ICONS.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        <div className="flex items-center gap-2">
                          <DynamicIcon name={icon} className="h-4 w-4" />
                          <span>{icon}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="route">Rota</Label>
                <NexusInput
                  id="route"
                  value={newItem.route}
                  onChange={(e) => setNewItem({ ...newItem, route: e.target.value })}
                  placeholder="/views/minha-pagina"
                  required
                />
              </div>
              <NexusButton type="submit" loading={creating}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </NexusButton>
            </form>
            {pages.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Pages disponíveis: {pages.map((p) => `/views/${p.slug}`).join(', ')}
              </p>
            )}
          </NexusCardContent>
        </NexusCard>

        {/* Nav items list */}
        <NexusCard>
          <NexusCardHeader>
            <NexusCardTitle>Itens do Menu</NexusCardTitle>
            <NexusCardDescription>Gerencie os itens da sidebar do tenant</NexusCardDescription>
          </NexusCardHeader>
          <NexusCardContent>
            {loading ? (
              <div className="text-muted-foreground py-8 text-center">Carregando...</div>
            ) : navItems.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                Nenhum item personalizado ainda.
              </div>
            ) : (
              <NexusTable>
                <NexusTableHeader>
                  <NexusTableRow>
                    <NexusTableHead>Ordem</NexusTableHead>
                    <NexusTableHead>Ícone</NexusTableHead>
                    <NexusTableHead>Título</NexusTableHead>
                    <NexusTableHead>Rota</NexusTableHead>
                    <NexusTableHead>Visível</NexusTableHead>
                    <NexusTableHead>Ações</NexusTableHead>
                  </NexusTableRow>
                </NexusTableHeader>
                <NexusTableBody>
                  {navItems.map((item, index) => (
                    <NexusTableRow key={item.id}>
                      <NexusTableCell>
                        <div className="flex gap-1">
                          <NexusButton
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </NexusButton>
                          <NexusButton
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === navItems.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </NexusButton>
                        </div>
                      </NexusTableCell>
                      <NexusTableCell>
                        <DynamicIcon name={item.icon} className="h-4 w-4" />
                      </NexusTableCell>
                      <NexusTableCell className="font-medium">{item.title}</NexusTableCell>
                      <NexusTableCell className="font-mono text-sm text-muted-foreground">
                        {item.route}
                      </NexusTableCell>
                      <NexusTableCell>
                        <Switch
                          checked={item.is_visible}
                          onCheckedChange={() => handleToggleVisibility(item.id, item.is_visible)}
                        />
                      </NexusTableCell>
                      <NexusTableCell>
                        <NexusButton
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </NexusButton>
                      </NexusTableCell>
                    </NexusTableRow>
                  ))}
                </NexusTableBody>
              </NexusTable>
            )}
          </NexusCardContent>
        </NexusCard>

        {/* Tenant info */}
        <NexusCard>
          <NexusCardHeader>
            <NexusCardTitle>Informações do Tenant</NexusCardTitle>
          </NexusCardHeader>
          <NexusCardContent className="space-y-3">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">ID:</span>
              <span className="font-mono text-sm">{currentTenant.id}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Nome:</span>
              <span className="font-medium">{currentTenant.name}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium capitalize">{currentTenant.status}</span>
            </div>
          </NexusCardContent>
        </NexusCard>
      </div>
    </AppLayout>
  );
}
