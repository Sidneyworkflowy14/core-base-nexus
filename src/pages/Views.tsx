import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { usePages } from '@/hooks/usePages';
import { useDataSources } from '@/hooks/useDataSources';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash, Edit, Eye, Database } from 'lucide-react';
import { FilterParam } from '@/types/builder';

export default function ViewsPage() {
  const navigate = useNavigate();
  const { currentTenant } = useTenant();
  const { pages, loading, createPage, softDeletePage } = usePages();
  const { dataSources } = useDataSources();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPage, setNewPage] = useState({
    title: '',
    slug: '',
    has_filters: false,
    data_source_id: '',
  });
  const [filterParams, setFilterParams] = useState<FilterParam[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        has_filters: newPage.has_filters,
        filter_params: newPage.has_filters ? filterParams : [],
        data_source_id: newPage.data_source_id || null,
      });

      if (page) {
        setDialogOpen(false);
        setNewPage({ title: '', slug: '', has_filters: false, data_source_id: '' });
        setFilterParams([]);
        // Navigate to editor
        navigate(`/views/${page.id}/edit`);
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
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Views (Páginas)</h1>
            <p className="text-muted-foreground">Crie e edite páginas com o builder</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Página
              </Button>
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
                  <Label>Slug</Label>
                  <Input
                    value={newPage.slug}
                    onChange={(e) => setNewPage({ ...newPage, slug: e.target.value })}
                    placeholder="minha-pagina"
                  />
                  <p className="text-xs text-muted-foreground">
                    URL: /views/{newPage.slug || 'slug'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Data Source (opcional)</Label>
                  <Select
                    value={newPage.data_source_id}
                    onValueChange={(v) => setNewPage({ ...newPage, data_source_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um data source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
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
                      <Button size="sm" variant="outline" onClick={addFilterParam}>
                        <Plus className="h-3 w-3 mr-1" /> Adicionar
                      </Button>
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
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeFilterParam(idx)}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
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
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating ? 'Criando...' : 'Criar e Editar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Páginas</CardTitle>
            <CardDescription>
              Páginas criadas com o builder visual
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-muted-foreground">Carregando...</div>
            ) : pages.length === 0 ? (
              <div className="text-muted-foreground">Nenhuma página criada ainda.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Versão</TableHead>
                    <TableHead>Atualizada</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell className="font-medium">{page.title}</TableCell>
                      <TableCell className="font-mono text-sm">{page.slug}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            page.status === 'published'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {page.status === 'published' ? 'Publicada' : 'Rascunho'}
                        </span>
                      </TableCell>
                      <TableCell>v{page.version}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(page.updated_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => navigate(`/views/${page.id}/edit`)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            asChild
                            title="Visualizar"
                          >
                            <Link to={`/views/${page.slug}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(page.id)}
                            title="Excluir"
                          >
                            <Trash className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Link to Data Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Sources
            </CardTitle>
            <CardDescription>
              Configure fontes de dados para suas páginas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link to="/data-sources">Gerenciar Data Sources</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
