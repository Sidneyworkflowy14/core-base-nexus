import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useNavItems } from '@/hooks/useNavItems';
import { usePages } from '@/hooks/usePages';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AVAILABLE_ICONS, IconName } from '@/types/nav';
import { DynamicIcon } from '@/components/DynamicIcon';
import { ArrowUp, ArrowDown, Trash, Plus } from 'lucide-react';

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
        <div>
          <h1 className="text-2xl font-semibold">Configurações</h1>
          <p className="text-muted-foreground">{currentTenant.name}</p>
        </div>

        {/* Add new nav item */}
        <Card>
          <CardHeader>
            <CardTitle>Adicionar item ao menu</CardTitle>
            <CardDescription>Crie um novo item para a sidebar</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex gap-4 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
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
                <Input
                  id="route"
                  value={newItem.route}
                  onChange={(e) => setNewItem({ ...newItem, route: e.target.value })}
                  placeholder="/views/minha-pagina"
                  required
                />
              </div>
              <Button type="submit" disabled={creating}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </form>
            {pages.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Pages disponíveis: {pages.map((p) => `/views/${p.slug}`).join(', ')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Nav items list */}
        <Card>
          <CardHeader>
            <CardTitle>Itens do Menu</CardTitle>
            <CardDescription>Gerencie os itens da sidebar do tenant</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-muted-foreground">Carregando...</div>
            ) : navItems.length === 0 ? (
              <div className="text-muted-foreground">Nenhum item personalizado ainda.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ordem</TableHead>
                    <TableHead>Ícone</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Rota</TableHead>
                    <TableHead>Visível</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {navItems.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === navItems.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DynamicIcon name={item.icon} className="h-4 w-4" />
                      </TableCell>
                      <TableCell>{item.title}</TableCell>
                      <TableCell className="font-mono text-sm">{item.route}</TableCell>
                      <TableCell>
                        <Switch
                          checked={item.is_visible}
                          onCheckedChange={() => handleToggleVisibility(item.id, item.is_visible)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Tenant info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Tenant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID:</span>
              <span className="font-mono text-sm">{currentTenant.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nome:</span>
              <span>{currentTenant.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span>{currentTenant.status}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
