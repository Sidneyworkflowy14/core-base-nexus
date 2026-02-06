import { Block, BlockType, HeadingBlock, TextBlock, TableBlock, KpiBlock, ChartBlock, HtmlBlock } from '@/types/builder';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Plus, Trash, Code, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BlockPropertiesProps {
  block: Block | null;
  onUpdate: (block: Block) => void;
  dataSourceFields?: string[];
}

export function BlockProperties({ block, onUpdate, dataSourceFields = [] }: BlockPropertiesProps) {
  if (!block) {
    return (
      <div className="p-4 text-muted-foreground">
        Selecione um bloco para editar suas propriedades.
      </div>
    );
  }

  const updateProps = (props: Partial<Block['props']>) => {
    onUpdate({ ...block, props: { ...block.props, ...props } } as Block);
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold">Propriedades</h3>

      {block.type === 'heading' && (
        <HeadingProperties block={block} onUpdate={updateProps} />
      )}

      {block.type === 'text' && (
        <TextProperties block={block} onUpdate={updateProps} />
      )}

      {block.type === 'table' && (
        <TableProperties block={block} onUpdate={updateProps} dataSourceFields={dataSourceFields} />
      )}

      {block.type === 'kpi' && (
        <KpiProperties block={block} onUpdate={updateProps} dataSourceFields={dataSourceFields} />
      )}

      {block.type === 'chart' && (
        <ChartProperties block={block} onUpdate={updateProps} dataSourceFields={dataSourceFields} />
      )}

      {block.type === 'html' && (
        <HtmlProperties block={block} onUpdate={updateProps} dataSourceFields={dataSourceFields} />
      )}
    </div>
  );
}

function HeadingProperties({ block, onUpdate }: { block: HeadingBlock; onUpdate: (props: any) => void }) {
  return (
    <>
      <div className="space-y-2">
        <Label>Texto</Label>
        <Input
          value={block.props.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Nível</Label>
        <Select
          value={String(block.props.level)}
          onValueChange={(v) => onUpdate({ level: Number(v) })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">H1 - Título Principal</SelectItem>
            <SelectItem value="2">H2 - Subtítulo</SelectItem>
            <SelectItem value="3">H3 - Seção</SelectItem>
            <SelectItem value="4">H4 - Subseção</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

function TextProperties({ block, onUpdate }: { block: TextBlock; onUpdate: (props: any) => void }) {
  return (
    <div className="space-y-2">
      <Label>Conteúdo</Label>
      <Textarea
        value={block.props.content}
        onChange={(e) => onUpdate({ content: e.target.value })}
        rows={5}
      />
    </div>
  );
}

function TableProperties({ block, onUpdate, dataSourceFields }: { block: TableBlock; onUpdate: (props: any) => void; dataSourceFields: string[] }) {
  const addColumn = () => {
    const columns = [...block.props.columns, { key: `col${Date.now()}`, label: 'Nova Coluna' }];
    onUpdate({ columns });
  };

  const removeColumn = (index: number) => {
    const columns = block.props.columns.filter((_, i) => i !== index);
    onUpdate({ columns });
  };

  const updateColumn = (index: number, field: 'key' | 'label', value: string) => {
    const columns = [...block.props.columns];
    columns[index] = { ...columns[index], [field]: value };
    onUpdate({ columns });
  };

  return (
    <>
      <div className="space-y-2">
        <Label>Título</Label>
        <Input
          value={block.props.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Data Binding</Label>
          <Switch
            checked={block.props.dataBinding?.enabled || false}
            onCheckedChange={(enabled) => onUpdate({ dataBinding: { ...block.props.dataBinding, enabled } })}
          />
        </div>
        {block.props.dataBinding?.enabled && dataSourceFields.length > 0 && (
          <Select
            value={block.props.dataBinding.field || '__root__'}
            onValueChange={(field) =>
              onUpdate({
                dataBinding: { ...block.props.dataBinding, field: field === '__root__' ? '' : field },
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Campo do data source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__root__">Root (array principal)</SelectItem>
              {dataSourceFields.map((f) => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Colunas</Label>
          <Button size="sm" variant="outline" onClick={addColumn}>
            <Plus className="h-3 w-3 mr-1" /> Coluna
          </Button>
        </div>
        {block.props.columns.map((col, idx) => (
          <div key={idx} className="flex gap-2">
            <Input
              placeholder="Chave"
              value={col.key}
              onChange={(e) => updateColumn(idx, 'key', e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Label"
              value={col.label}
              onChange={(e) => updateColumn(idx, 'label', e.target.value)}
              className="flex-1"
            />
            <Button size="icon" variant="ghost" onClick={() => removeColumn(idx)}>
              <Trash className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}

function KpiProperties({ block, onUpdate, dataSourceFields }: { block: KpiBlock; onUpdate: (props: any) => void; dataSourceFields: string[] }) {
  return (
    <>
      <div className="space-y-2">
        <Label>Título</Label>
        <Input
          value={block.props.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Data Binding</Label>
          <Switch
            checked={block.props.dataBinding?.enabled || false}
            onCheckedChange={(enabled) => onUpdate({ dataBinding: { ...block.props.dataBinding, enabled } })}
          />
        </div>
        {block.props.dataBinding?.enabled && (
          <>
            <Select
              value={block.props.dataBinding.field || ''}
              onValueChange={(field) => onUpdate({ dataBinding: { ...block.props.dataBinding, field } })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Campo" />
              </SelectTrigger>
              <SelectContent>
                {dataSourceFields.map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={block.props.dataBinding.aggregation || ''}
              onValueChange={(aggregation) => onUpdate({ dataBinding: { ...block.props.dataBinding, aggregation } })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Agregação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="count">Contagem</SelectItem>
                <SelectItem value="sum">Soma</SelectItem>
                <SelectItem value="avg">Média</SelectItem>
                <SelectItem value="min">Mínimo</SelectItem>
                <SelectItem value="max">Máximo</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {!block.props.dataBinding?.enabled && (
        <div className="space-y-2">
          <Label>Valor</Label>
          <Input
            value={block.props.value || ''}
            onChange={(e) => onUpdate({ value: e.target.value })}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Formato</Label>
        <Select
          value={block.props.format || 'number'}
          onValueChange={(format) => onUpdate({ format })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="number">Número</SelectItem>
            <SelectItem value="currency">Moeda (R$)</SelectItem>
            <SelectItem value="percent">Porcentagem</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label>Prefixo</Label>
          <Input
            value={block.props.prefix || ''}
            onChange={(e) => onUpdate({ prefix: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Sufixo</Label>
          <Input
            value={block.props.suffix || ''}
            onChange={(e) => onUpdate({ suffix: e.target.value })}
          />
        </div>
      </div>
    </>
  );
}

function ChartProperties({ block, onUpdate, dataSourceFields }: { block: ChartBlock; onUpdate: (props: any) => void; dataSourceFields: string[] }) {
  return (
    <>
      <div className="space-y-2">
        <Label>Título</Label>
        <Input
          value={block.props.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Tipo</Label>
        <Select
          value={block.props.chartType}
          onValueChange={(chartType) => onUpdate({ chartType })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bar">Barras</SelectItem>
            <SelectItem value="line">Linha</SelectItem>
            <SelectItem value="pie">Pizza</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Data Binding</Label>
          <Switch
            checked={block.props.dataBinding?.enabled || false}
            onCheckedChange={(enabled) => onUpdate({ dataBinding: { ...block.props.dataBinding, enabled } })}
          />
        </div>
        {block.props.dataBinding?.enabled && (
          <>
            <Select
              value={block.props.dataBinding.labelField || ''}
              onValueChange={(labelField) => onUpdate({ dataBinding: { ...block.props.dataBinding, labelField } })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Campo de Label" />
              </SelectTrigger>
              <SelectContent>
                {dataSourceFields.map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={block.props.dataBinding.valueField || ''}
              onValueChange={(valueField) => onUpdate({ dataBinding: { ...block.props.dataBinding, valueField } })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Campo de Valor" />
              </SelectTrigger>
              <SelectContent>
                {dataSourceFields.map((f) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
      </div>
    </>
  );
}

function HtmlProperties({ block, onUpdate, dataSourceFields }: { block: HtmlBlock; onUpdate: (props: any) => void; dataSourceFields: string[] }) {
  return (
    <>
      <Alert variant="default" className="border-warning/50 bg-warning/10">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <AlertDescription className="text-xs">
          Use variáveis como <code className="bg-muted px-1 rounded">{`{{campo}}`}</code> para dados dinâmicos.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Code className="h-4 w-4" />
          HTML
        </Label>
        <Textarea
          value={block.props.html}
          onChange={(e) => onUpdate({ html: e.target.value })}
          rows={10}
          className="font-mono text-xs"
          placeholder="<div>Seu HTML aqui...</div>"
        />
      </div>

      <div className="space-y-2">
        <Label>CSS (Estilos)</Label>
        <Textarea
          value={block.props.css || ''}
          onChange={(e) => onUpdate({ css: e.target.value })}
          rows={8}
          className="font-mono text-xs"
          placeholder=".classe { color: red; }"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label>Permitir Scripts</Label>
          <p className="text-xs text-muted-foreground">Executar JavaScript customizado</p>
        </div>
        <Switch
          checked={block.props.enableScripts || false}
          onCheckedChange={(enableScripts) => onUpdate({ enableScripts })}
        />
      </div>

      {dataSourceFields.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Campos disponíveis:</Label>
          <div className="flex flex-wrap gap-1">
            {dataSourceFields.map((field) => (
              <code
                key={field}
                className="text-xs bg-muted px-2 py-1 rounded cursor-pointer hover:bg-primary/20 transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(`{{${field}}}`);
                }}
                title="Clique para copiar"
              >
                {`{{${field}}}`}
              </code>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
