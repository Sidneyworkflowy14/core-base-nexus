import { useState } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { useDataSources } from '@/hooks/useDataSources';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash, Play, Database, Globe } from 'lucide-react';
import { DataSourceType, SupabaseTableConfig, N8nHttpConfig } from '@/types/builder';
import { toast } from 'sonner';

export default function DataSourcesPage() {
  const { currentTenant } = useTenant();
  const { dataSources, loading, createDataSource, deleteDataSource, testDataSource } = useDataSources();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDs, setNewDs] = useState<{
    name: string;
    type: DataSourceType;
    table_name: string;
    url: string;
    method: 'GET' | 'POST';
  }>({
    name: '',
    type: 'supabase_table',
    table_name: '',
    url: '',
    method: 'GET',
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ data: unknown; error: string | null } | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newDs.name) return;

    setCreating(true);
    setError(null);

    try {
      let config: SupabaseTableConfig | N8nHttpConfig;

      if (newDs.type === 'supabase_table') {
        if (!newDs.table_name) {
          setError('Informe o nome da tabela.');
          setCreating(false);
          return;
        }
        config = { table_name: newDs.table_name };
      } else {
        if (!newDs.url) {
          setError('Informe a URL do webhook.');
          setCreating(false);
          return;
        }
        config = { url: newDs.url, method: newDs.method };
      }

      await createDataSource({
        name: newDs.name,
        type: newDs.type,
        config,
      });

      setDialogOpen(false);
      setNewDs({ name: '', type: 'supabase_table', table_name: '', url: '', method: 'GET' });
      toast.success('Data source criado!');
    } catch (err: any) {
      if (err.message?.includes('duplicate')) {
        setError('Já existe um data source com esse nome.');
      } else {
        setError('Erro ao criar data source.');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Remover este data source?')) {
      await deleteDataSource(id);
      toast.success('Data source removido!');
    }
  };

  const handleTest = async (ds: typeof dataSources[0]) => {
    setTesting(ds.id);
    setTestResult(null);

    const result = await testDataSource(ds);
    setTestResult(result);
    setTesting(null);

    if (result.error) {
      toast.error(`Erro: ${result.error}`);
    } else {
      toast.success('Conexão OK!');
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Data Sources</h1>
            <p className="text-muted-foreground">
              Configure fontes de dados para suas páginas
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Data Source
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Data Source</DialogTitle>
                <DialogDescription>
                  Configure a fonte de dados
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={newDs.name}
                    onChange={(e) => setNewDs({ ...newDs, name: e.target.value })}
                    placeholder="Meu Data Source"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={newDs.type}
                    onValueChange={(v) => setNewDs({ ...newDs, type: v as DataSourceType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supabase_table">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          Tabela Supabase
                        </div>
                      </SelectItem>
                      <SelectItem value="n8n_http">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Webhook HTTP (n8n)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newDs.type === 'supabase_table' && (
                  <div className="space-y-2">
                    <Label>Nome da Tabela</Label>
                    <Input
                      value={newDs.table_name}
                      onChange={(e) => setNewDs({ ...newDs, table_name: e.target.value })}
                      placeholder="tenants"
                    />
                    <p className="text-xs text-muted-foreground">
                      A tabela deve existir e ter RLS configurado.
                    </p>
                  </div>
                )}

                {newDs.type === 'n8n_http' && (
                  <>
                    <div className="space-y-2">
                      <Label>URL do Webhook</Label>
                      <Input
                        value={newDs.url}
                        onChange={(e) => setNewDs({ ...newDs, url: e.target.value })}
                        placeholder="https://n8n.example.com/webhook/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Método</Label>
                      <Select
                        value={newDs.method}
                        onValueChange={(v) => setNewDs({ ...newDs, method: v as 'GET' | 'POST' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
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
                  {creating ? 'Criando...' : 'Criar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Data Sources</CardTitle>
            <CardDescription>
              Fontes de dados configuradas para este tenant
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-muted-foreground">Carregando...</div>
            ) : dataSources.length === 0 ? (
              <div className="text-muted-foreground">Nenhum data source criado ainda.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Configuração</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataSources.map((ds) => (
                    <TableRow key={ds.id}>
                      <TableCell className="font-medium">{ds.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {ds.type === 'supabase_table' ? (
                            <Database className="h-4 w-4" />
                          ) : (
                            <Globe className="h-4 w-4" />
                          )}
                          {ds.type === 'supabase_table' ? 'Tabela' : 'HTTP'}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {ds.type === 'supabase_table'
                          ? (ds.config as SupabaseTableConfig).table_name
                          : (ds.config as N8nHttpConfig).url?.slice(0, 40) + '...'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleTest(ds)}
                            disabled={testing === ds.id}
                            title="Testar"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(ds.id)}
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

        {/* Test result */}
        {testResult && (
          <Card>
            <CardHeader>
              <CardTitle>Resultado do Teste</CardTitle>
            </CardHeader>
            <CardContent>
              {testResult.error ? (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {testResult.error}
                </div>
              ) : (
                <pre className="bg-muted p-4 rounded-md text-sm overflow-auto max-h-64">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
