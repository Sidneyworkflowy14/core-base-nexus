import { useState, useEffect } from 'react';
import { Widget, WidgetConfig, WidgetType } from '@/types/dashboard';
import { useDataSources } from '@/hooks/useDataSources';
import { usePages } from '@/hooks/usePages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface WidgetEditorProps {
  widget?: Widget | null;
  open: boolean;
  onClose: () => void;
  onSave: (title: string, type: WidgetType, config: WidgetConfig, pageId?: string, dataSourceId?: string) => void;
}

export function WidgetEditor({ widget, open, onClose, onSave }: WidgetEditorProps) {
  const { dataSources } = useDataSources();
  const { pages } = usePages();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<WidgetType>('kpi');
  const [dataSourceId, setDataSourceId] = useState<string>('');
  const [pageId, setPageId] = useState<string>('');
  const [config, setConfig] = useState<WidgetConfig>({});

  useEffect(() => {
    if (widget) {
      setTitle(widget.title);
      setType(widget.type);
      setDataSourceId(widget.data_source_id || '');
      setPageId(widget.page_id || '');
      setConfig(widget.config_json);
    } else {
      setTitle('');
      setType('kpi');
      setDataSourceId('');
      setPageId('');
      setConfig({});
    }
  }, [widget, open]);

  // When page is selected, copy its data source
  useEffect(() => {
    if (pageId) {
      const page = pages.find(p => p.id === pageId);
      if (page?.data_source_id) {
        setDataSourceId(page.data_source_id);
      }
    }
  }, [pageId, pages]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave(
      title,
      type,
      config,
      pageId || undefined,
      dataSourceId || undefined
    );
    onClose();
  };

  const updateConfig = (key: keyof WidgetConfig, value: string | number | string[]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{widget ? 'Editar Widget' : 'Novo Widget'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do widget"
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as WidgetType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kpi">KPI</SelectItem>
                <SelectItem value="table">Tabela</SelectItem>
                <SelectItem value="chart">Gráfico</SelectItem>
                <SelectItem value="list">Lista</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Reutilizar View (opcional)</Label>
            <Select value={pageId} onValueChange={setPageId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma view..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhuma</SelectItem>
                {pages.filter(p => p.status === 'published').map(page => (
                  <SelectItem key={page.id} value={page.id}>{page.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data Source</Label>
            <Select value={dataSourceId} onValueChange={setDataSourceId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhuma</SelectItem>
                {dataSources.map(ds => (
                  <SelectItem key={ds.id} value={ds.id}>{ds.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type-specific config */}
          {type === 'kpi' && (
            <>
              <div className="space-y-2">
                <Label>Campo de Valor</Label>
                <Input
                  value={config.valueField || ''}
                  onChange={(e) => updateConfig('valueField', e.target.value)}
                  placeholder="nome_do_campo"
                />
              </div>
              <div className="space-y-2">
                <Label>Agregação</Label>
                <Select 
                  value={config.aggregation || 'count'} 
                  onValueChange={(v) => updateConfig('aggregation', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="count">Contagem</SelectItem>
                    <SelectItem value="sum">Soma</SelectItem>
                    <SelectItem value="avg">Média</SelectItem>
                    <SelectItem value="min">Mínimo</SelectItem>
                    <SelectItem value="max">Máximo</SelectItem>
                    <SelectItem value="first">Primeiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prefixo</Label>
                  <Input
                    value={config.prefix || ''}
                    onChange={(e) => updateConfig('prefix', e.target.value)}
                    placeholder="R$"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sufixo</Label>
                  <Input
                    value={config.suffix || ''}
                    onChange={(e) => updateConfig('suffix', e.target.value)}
                    placeholder="%"
                  />
                </div>
              </div>
            </>
          )}

          {type === 'table' && (
            <>
              <div className="space-y-2">
                <Label>Colunas (separadas por vírgula)</Label>
                <Input
                  value={config.columns?.join(', ') || ''}
                  onChange={(e) => updateConfig('columns', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="id, nome, valor"
                />
              </div>
              <div className="space-y-2">
                <Label>Linhas por página</Label>
                <Input
                  type="number"
                  value={config.pageSize || 5}
                  onChange={(e) => updateConfig('pageSize', parseInt(e.target.value) || 5)}
                />
              </div>
            </>
          )}

          {type === 'chart' && (
            <>
              <div className="space-y-2">
                <Label>Tipo de Gráfico</Label>
                <Select 
                  value={config.chartType || 'bar'} 
                  onValueChange={(v) => updateConfig('chartType', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Barras</SelectItem>
                    <SelectItem value="line">Linhas</SelectItem>
                    <SelectItem value="area">Área</SelectItem>
                    <SelectItem value="pie">Pizza</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Campo X</Label>
                  <Input
                    value={config.xField || ''}
                    onChange={(e) => updateConfig('xField', e.target.value)}
                    placeholder="categoria"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Campo Y</Label>
                  <Input
                    value={config.yField || ''}
                    onChange={(e) => updateConfig('yField', e.target.value)}
                    placeholder="valor"
                  />
                </div>
              </div>
            </>
          )}

          {type === 'list' && (
            <>
              <div className="space-y-2">
                <Label>Campo de Label</Label>
                <Input
                  value={config.labelField || ''}
                  onChange={(e) => updateConfig('labelField', e.target.value)}
                  placeholder="nome"
                />
              </div>
              <div className="space-y-2">
                <Label>Campo de Valor (opcional)</Label>
                <Input
                  value={config.valueField2 || ''}
                  onChange={(e) => updateConfig('valueField2', e.target.value)}
                  placeholder="total"
                />
              </div>
              <div className="space-y-2">
                <Label>Limite de itens</Label>
                <Input
                  type="number"
                  value={config.limit || 5}
                  onChange={(e) => updateConfig('limit', parseInt(e.target.value) || 5)}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
