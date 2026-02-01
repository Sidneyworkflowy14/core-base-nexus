import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useViews } from '@/hooks/useViews';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash, Eye, EyeOff } from 'lucide-react';

export default function ViewsPage() {
  const { currentTenant } = useTenant();
  const { views, loading, createView, updateView, deleteView } = useViews();

  const [newView, setNewView] = useState({
    title: '',
    slug: '',
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newView.title || !newView.slug) return;

    setCreating(true);
    setError(null);

    try {
      const slug = newView.slug
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      await createView({
        title: newView.title,
        slug,
        content: {},
        is_published: false,
      });
      setNewView({ title: '', slug: '' });
    } catch (err: any) {
      if (err.message?.includes('duplicate')) {
        setError('Já existe uma view com esse slug.');
      } else {
        setError('Erro ao criar view.');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleTogglePublish = async (id: string, isPublished: boolean) => {
    await updateView(id, { is_published: !isPublished });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Remover esta view?')) {
      await deleteView(id);
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
          <h1 className="text-2xl font-semibold">Views</h1>
          <p className="text-muted-foreground">Páginas personalizadas do tenant</p>
        </div>

        {/* Create new view */}
        <Card>
          <CardHeader>
            <CardTitle>Nova View</CardTitle>
            <CardDescription>Crie uma nova página personalizada</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex gap-4 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={newView.title}
                  onChange={(e) => setNewView({ ...newView, title: e.target.value })}
                  placeholder="Minha Página"
                  required
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={newView.slug}
                  onChange={(e) => setNewView({ ...newView, slug: e.target.value })}
                  placeholder="minha-pagina"
                  required
                />
              </div>
              <Button type="submit" disabled={creating}>
                <Plus className="h-4 w-4 mr-2" />
                Criar
              </Button>
            </form>
            {error && (
              <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Views list */}
        <Card>
          <CardHeader>
            <CardTitle>Views Existentes</CardTitle>
            <CardDescription>Gerencie as páginas personalizadas</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-muted-foreground">Carregando...</div>
            ) : views.length === 0 ? (
              <div className="text-muted-foreground">Nenhuma view criada ainda.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Rota</TableHead>
                    <TableHead>Publicada</TableHead>
                    <TableHead>Atualizada</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {views.map((view) => (
                    <TableRow key={view.id}>
                      <TableCell className="font-medium">{view.title}</TableCell>
                      <TableCell className="font-mono text-sm">{view.slug}</TableCell>
                      <TableCell>
                        <Link
                          to={`/views/${view.slug}`}
                          className="text-primary hover:underline font-mono text-sm"
                        >
                          /views/{view.slug}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={view.is_published}
                            onCheckedChange={() => handleTogglePublish(view.id, view.is_published)}
                          />
                          {view.is_published ? (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(view.updated_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(view.id)}
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

        <Card>
          <CardHeader>
            <CardTitle>Como usar Views</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>1. Crie uma view com título e slug</p>
            <p>2. Vá em Configurações → Adicionar item ao menu</p>
            <p>3. Use a rota <code className="bg-muted px-1 rounded">/views/seu-slug</code></p>
            <p>4. Publique a view para que seja visível a todos os usuários</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
