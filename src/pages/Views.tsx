import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { usePages } from '@/hooks/usePages';
import { useDataSources } from '@/hooks/useDataSources';
import { AppLayout } from '@/components/AppLayout';
import { useOrgPath } from '@/hooks/useOrgPath';
import { 
  NexusButton, 
  NexusCard, 
  NexusCardHeader, 
  NexusCardTitle, 
  NexusCardDescription, 
  NexusCardContent,
  NexusBadge,
  NexusTable,
  NexusTableHeader,
  NexusTableBody,
  NexusTableRow,
  NexusTableHead,
  NexusTableCell,
} from '@/components/nexus';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash, Edit, Eye, Database, FileText, Layout } from 'lucide-react';
import { FilterParam } from '@/types/builder';
import { AVAILABLE_ICONS, IconName } from '@/types/nav';
import { DynamicIcon } from '@/components/DynamicIcon';

export default function ViewsPage() {
  const navigate = useNavigate();
  const { currentTenant } = useTenant();
  const { pages, loading, createPage, softDeletePage, updatePage } = usePages();
  const { dataSources } = useDataSources();
  const { withOrg } = useOrgPath();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPage, setNewPage] = useState({
    title: '',
    slug: '',
    has_filters: false,
    data_source_id: '',
    icon: 'file' as IconName,
    parent_page_id: '',
  });
  const [filterParams, setFilterParams] = useState<FilterParam[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPage, setEditPage] = useState({
    title: '',
    slug: '',
    icon: 'file' as IconName,
    parent_page_id: '',
  });

  const handleCreate = async () => {
    if (!newPage.title || !newPage.slug) return;

    setCreating(true);
    setError(null);

    try {
      const slug = newPage.slug
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      const page = await createPage({
        title: newPage.title,
        slug,
        icon: newPage.icon,
        has_filters: newPage.has_filters,
        filter_params: newPage.has_filters ? filterParams : [],
        data_source_id: newPage.data_source_id || null,
        parent_page_id: newPage.parent_page_id || null,
      });

      if (page) {
        setDialogOpen(false);
        setNewPage({ title: '', slug: '', has_filters: false, data_source_id: '', icon: 'file', parent_page_id: '' });
        setFilterParams([]);
        navigate(withOrg(`/views/${page.id}/edit`));
      }
    } catch (err: any) {
      if (err.message?.includes('duplicate')) {
        setError('Já existe uma página com esse slug.');
      } else {
        setError('Erro ao criar página.');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Excluir esta página? (soft delete - pode ser restaurada)')) {
      await softDeletePage(id);
    }
  };

  const openEditDialog = (pageId: string) => {
    const target = pages.find((p) => p.id === pageId);
    if (!target) return;
    setError(null);
    setEditingId(pageId);
    setEditPage({
      title: target.title,
      slug: target.slug,
      icon: (target.icon || 'file') as IconName,
      parent_page_id: target.parent_page_id || '',
    });
    setEditOpen(true);
  };

  const handleUpdateMeta = async () => {
    if (!editingId) return;
    if (!editPage.title || !editPage.slug) {
      setError('Título e slug são obrigatórios.');
      return;
    }
    const cleanedSlug = editPage.slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    try {
      await updatePage(editingId, {
        title: editPage.title,
        slug: cleanedSlug,
        icon: editPage.icon,
        parent_page_id: editPage.parent_page_id || null,
      });
      setEditOpen(false);
      setEditingId(null);
    } catch (err: any) {
      setError('Erro ao atualizar página.');
    }
  };

  const addFilterParam = () => {
    setFilterParams([...filterParams, { key: '', label: '', type: 'text' }]);
  };

  const updateFilterParam = (index: number, field: keyof FilterParam, value: string) => {
    const updated = [...filterParams];
    updated[index] = { ...updated[index], [field]: value };
    setFilterParams(updated);
  };

  const removeFilterParam = (index: number) => {
    setFilterParams(filterParams.filter((_, i) => i !== index));
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
      <div className="max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <FileText className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-semibold">Views (Páginas)</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Crie e edite páginas com o builder visual
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <NexusButton>
                <Plus className="h-4 w-4 mr-2" />
                Nova Página
              </NexusButton>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Criar Nova Página</DialogTitle>
                <DialogDescription>
                  Configure os detalhes da nova página
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={newPage.title}
                    onChange={(e) => setNewPage({ ...newPage, title: e.target.value })}
                    placeholder="Minha Página"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ícone</Label>
                  <Select
                    value={newPage.icon}
                    onValueChange={(v) => setNewPage({ ...newPage, icon: v as IconName })}
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
                <div className="space-y-2">
                  <Label>Subview de</Label>
                  <Select
                    value={newPage.parent_page_id || 'none'}
                    onValueChange={(v) =>
                      setNewPage({ ...newPage, parent_page_id: v === 'none' ? '' : v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma (view principal)</SelectItem>
                      {pages
                        .filter((p) => !p.parent_page_id)
                        .map((page) => (
                          <SelectItem key={page.id} value={page.id}>
                            {page.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={newPage.slug}
                    onChange={(e) => setNewPage({ ...newPage, slug: e.target.value })}
                    placeholder="minha-pagina"
                  />
                  <p className="text-xs text-muted-foreground">
                    URL: {withOrg(`/views/${newPage.slug || 'slug'}`)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Data Source (opcional)</Label>
                  <Select
                    value={newPage.data_source_id || "__none__"}
                    onValueChange={(v) => setNewPage({ ...newPage, data_source_id: v === "__none__" ? "" : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um data source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhum</SelectItem>
                      {dataSources.map((ds) => (
                        <SelectItem key={ds.id} value={ds.id}>
                          {ds.name} ({ds.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Dados variáveis?</Label>
                    <p className="text-xs text-muted-foreground">
                      Adicionar filtros/parâmetros
                    </p>
                  </div>
                  <Switch
                    checked={newPage.has_filters}
                    onCheckedChange={(v) => setNewPage({ ...newPage, has_filters: v })}
                  />
                </div>

                {newPage.has_filters && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Parâmetros de Filtro</Label>
                      <NexusButton size="sm" variant="outline" onClick={addFilterParam}>
                        <Plus className="h-3 w-3 mr-1" /> Adicionar
                      </NexusButton>
                    </div>
                    {filterParams.map((param, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          placeholder="Chave"
                          value={param.key}
                          onChange={(e) => updateFilterParam(idx, 'key', e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          placeholder="Label"
                          value={param.label}
                          onChange={(e) => updateFilterParam(idx, 'label', e.target.value)}
                          className="flex-1"
                        />
                        <Select
                          value={param.type}
                          onValueChange={(v) => updateFilterParam(idx, 'type', v)}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Texto</SelectItem>
                            <SelectItem value="date">Data</SelectItem>
                            <SelectItem value="select">Select</SelectItem>
                          </SelectContent>
                        </Select>
                        <NexusButton
                          size="icon"
                          variant="ghost"
                          onClick={() => removeFilterParam(idx)}
                        >
                          <Trash className="h-3 w-3" />
                        </NexusButton>
                      </div>
                    ))}
                  </div>
                )}

                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
              </div>
              <DialogFooter>
                <NexusButton variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </NexusButton>
                <NexusButton onClick={handleCreate} loading={creating}>
                  Criar e Editar
                </NexusButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Pages Table */}
        <NexusCard>
          <NexusCardHeader>
            <NexusCardTitle>Páginas</NexusCardTitle>
            <NexusCardDescription>
              Páginas criadas com o builder visual
            </NexusCardDescription>
          </NexusCardHeader>
          <NexusCardContent>
            {loading ? (
              <div className="text-muted-foreground py-8 text-center">Carregando...</div>
            ) : pages.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                Nenhuma página criada ainda. Clique em "Nova Página" para começar.
              </div>
            ) : (
              <NexusTable>
                <NexusTableHeader>
                  <NexusTableRow>
                    <NexusTableHead>Título</NexusTableHead>
                    <NexusTableHead>Slug</NexusTableHead>
                    <NexusTableHead>Status</NexusTableHead>
                    <NexusTableHead>Versão</NexusTableHead>
                    <NexusTableHead>Atualizada</NexusTableHead>
                    <NexusTableHead>Ações</NexusTableHead>
                  </NexusTableRow>
                </NexusTableHeader>
                <NexusTableBody>
                  {pages.map((page) => (
                    <NexusTableRow key={page.id}>
                      <NexusTableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{page.title}</span>
                          {page.parent_page_id && (
                            <NexusBadge variant="muted">Subview</NexusBadge>
                          )}
                        </div>
                      </NexusTableCell>
                      <NexusTableCell className="font-mono text-sm text-muted-foreground">
                        /{page.slug}
                      </NexusTableCell>
                      <NexusTableCell>
                        <NexusBadge variant={page.status === 'published' ? 'success' : 'warning'}>
                          {page.status === 'published' ? 'Publicada' : 'Rascunho'}
                        </NexusBadge>
                      </NexusTableCell>
                      <NexusTableCell>
                        <NexusBadge variant="muted">v{page.version}</NexusBadge>
                      </NexusTableCell>
                      <NexusTableCell className="text-muted-foreground text-sm">
                        {new Date(page.updated_at).toLocaleDateString('pt-BR')}
                      </NexusTableCell>
                      <NexusTableCell>
                        <div className="flex gap-1">
                          <NexusButton
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => openEditDialog(page.id)}
                            title="Editar detalhes"
                          >
                            <Edit className="h-4 w-4" />
                          </NexusButton>
                          <NexusButton
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => navigate(withOrg(`/views/${page.id}/edit`))}
                            title="Editar conteúdo"
                          >
                            <Layout className="h-4 w-4" />
                          </NexusButton>
                          <NexusButton
                            size="icon-sm"
                            variant="ghost"
                            asChild
                            title="Visualizar"
                          >
                            <Link to={withOrg(`/views/${page.slug}`)}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </NexusButton>
                          <NexusButton
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => handleDelete(page.id)}
                            title="Excluir"
                          >
                            <Trash className="h-4 w-4 text-destructive" />
                          </NexusButton>
                        </div>
                      </NexusTableCell>
                    </NexusTableRow>
                  ))}
                </NexusTableBody>
              </NexusTable>
            )}
          </NexusCardContent>
        </NexusCard>

        {/* Link to Data Sources */}
        <NexusCard>
          <NexusCardHeader>
            <NexusCardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Data Sources
            </NexusCardTitle>
            <NexusCardDescription>
              Configure fontes de dados para suas páginas
            </NexusCardDescription>
          </NexusCardHeader>
          <NexusCardContent>
            <NexusButton variant="outline" asChild>
              <Link to={withOrg('/data-sources')}>Gerenciar Data Sources</Link>
            </NexusButton>
          </NexusCardContent>
        </NexusCard>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Página</DialogTitle>
            <DialogDescription>
              Atualize o nome, slug e ícone da página
            </DialogDescription>
          </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={editPage.title}
                onChange={(e) => setEditPage({ ...editPage, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Ícone</Label>
              <Select
                value={editPage.icon}
                onValueChange={(v) => setEditPage({ ...editPage, icon: v as IconName })}
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
                <div className="space-y-2">
                  <Label>Subview de</Label>
                  <Select
                    value={editPage.parent_page_id || 'none'}
                    onValueChange={(v) =>
                      setEditPage({ ...editPage, parent_page_id: v === 'none' ? '' : v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma (view principal)</SelectItem>
                      {pages
                        .filter((p) => !p.parent_page_id || p.id === editingId)
                        .map((page) => (
                          <SelectItem key={page.id} value={page.id}>
                            {page.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={editPage.slug}
                onChange={(e) => setEditPage({ ...editPage, slug: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                URL: {withOrg(`/views/${editPage.slug || 'slug'}`)}
              </p>
            </div>
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
          <DialogFooter>
            <NexusButton variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </NexusButton>
            <NexusButton onClick={handleUpdateMeta}>
              Salvar
            </NexusButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
