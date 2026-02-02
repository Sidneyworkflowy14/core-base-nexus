import { Section, Column, Widget, ColumnWidth } from '@/types/elementor';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { NexusTabs, NexusTabsList, NexusTabsTrigger, NexusTabsContent } from '@/components/nexus';
import { Settings2, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DataUrlConfig } from './DataUrlConfig';
import { WidgetStyleProperties } from './WidgetStyleProperties';

interface SelectedElement {
  type: 'section' | 'column' | 'widget';
  sectionId: string;
  columnId?: string;
  widgetId?: string;
}

interface SelectedData {
  type: 'section' | 'column' | 'widget';
  data: Section | Column | Widget;
  section?: Section;
  column?: Column;
}

interface ElementorPropertiesPanelProps {
  selectedData: SelectedData | null;
  selectedElement: SelectedElement | null;
  dataSourceFields?: string[];
  onUpdateSection: (settings: Partial<Section['settings']>) => void;
  onUpdateColumn: (settings: Partial<Column['settings']>) => void;
  onUpdateWidget: (settings: Partial<Widget['settings']>) => void;
}

export function ElementorPropertiesPanel({
  selectedData,
  selectedElement,
  dataSourceFields = [],
  onUpdateSection,
  onUpdateColumn,
  onUpdateWidget,
}: ElementorPropertiesPanelProps) {
  if (!selectedData || !selectedElement) {
    return (
      <div className="w-80 border-l border-border bg-card p-6 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Settings2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Nenhum elemento selecionado</p>
          <p className="text-sm mt-1">Clique em um elemento no canvas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col overflow-hidden">
      <NexusTabs defaultValue="content" className="flex-1 flex flex-col">
        <div className="border-b border-border px-2 shrink-0">
          <NexusTabsList className="w-full">
            <NexusTabsTrigger value="content" className="flex-1">
              <Settings2 className="h-4 w-4 mr-1" />
              Conteúdo
            </NexusTabsTrigger>
            <NexusTabsTrigger value="style" className="flex-1">
              <Palette className="h-4 w-4 mr-1" />
              Estilo
            </NexusTabsTrigger>
          </NexusTabsList>
        </div>

        <NexusTabsContent value="content" className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
          {selectedData.type === 'section' && (
            <SectionProperties 
              section={selectedData.data as Section} 
              onUpdate={onUpdateSection} 
            />
          )}
          {selectedData.type === 'column' && (
            <ColumnProperties 
              column={selectedData.data as Column} 
              onUpdate={onUpdateColumn} 
            />
          )}
          {selectedData.type === 'widget' && (
            <WidgetProperties 
              widget={selectedData.data as Widget} 
              onUpdate={onUpdateWidget}
              dataSourceFields={dataSourceFields}
            />
          )}
        </NexusTabsContent>

        <NexusTabsContent value="style" className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
          {selectedData.type === 'section' && (
            <SectionStyleProperties 
              section={selectedData.data as Section} 
              onUpdate={onUpdateSection} 
            />
          )}
          {selectedData.type === 'column' && (
            <ColumnStyleProperties 
              column={selectedData.data as Column} 
              onUpdate={onUpdateColumn} 
            />
          )}
          {selectedData.type === 'widget' && (
            <WidgetStyleProperties 
              widget={selectedData.data as Widget} 
              onUpdate={onUpdateWidget} 
            />
          )}
        </NexusTabsContent>
      </NexusTabs>
    </div>
  );
}

function SectionProperties({ section, onUpdate }: { section: Section; onUpdate: (s: Partial<Section['settings']>) => void }) {
  return (
    <>
      <div className="space-y-2">
        <Label>Layout</Label>
        <Select value={section.settings.layout} onValueChange={(v) => onUpdate({ layout: v as any })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="boxed">Boxed</SelectItem>
            <SelectItem value="full">Full Width</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

function SectionStyleProperties({ section, onUpdate }: { section: Section; onUpdate: (s: Partial<Section['settings']>) => void }) {
  return (
    <>
      <div className="space-y-2">
        <Label>Espaçamento entre colunas</Label>
        <Select value={section.settings.gap} onValueChange={(v) => onUpdate({ gap: v as any })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum</SelectItem>
            <SelectItem value="sm">Pequeno</SelectItem>
            <SelectItem value="md">Médio</SelectItem>
            <SelectItem value="lg">Grande</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Padding</Label>
        <Select value={section.settings.padding} onValueChange={(v) => onUpdate({ padding: v as any })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum</SelectItem>
            <SelectItem value="sm">Pequeno</SelectItem>
            <SelectItem value="md">Médio</SelectItem>
            <SelectItem value="lg">Grande</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

function ColumnProperties({ column, onUpdate }: { column: Column; onUpdate: (s: Partial<Column['settings']>) => void }) {
  return (
    <>
      <div className="space-y-2">
        <Label>Largura (12 colunas)</Label>
        <Select 
          value={String(column.settings.width)} 
          onValueChange={(v) => onUpdate({ width: Number(v) as ColumnWidth })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1,2,3,4,5,6,7,8,9,10,11,12].map((w) => (
              <SelectItem key={w} value={String(w)}>{w}/12</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Alinhamento Vertical</Label>
        <Select 
          value={column.settings.verticalAlign} 
          onValueChange={(v) => onUpdate({ verticalAlign: v as any })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="start">Topo</SelectItem>
            <SelectItem value="center">Centro</SelectItem>
            <SelectItem value="end">Base</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

function ColumnStyleProperties({ column, onUpdate }: { column: Column; onUpdate: (s: Partial<Column['settings']>) => void }) {
  return (
    <>
      <div className="space-y-2">
        <Label>Padding</Label>
        <Select value={column.settings.padding} onValueChange={(v) => onUpdate({ padding: v as any })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum</SelectItem>
            <SelectItem value="sm">Pequeno</SelectItem>
            <SelectItem value="md">Médio</SelectItem>
            <SelectItem value="lg">Grande</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

function WidgetProperties({ 
  widget, 
  onUpdate,
  dataSourceFields,
}: { 
  widget: Widget; 
  onUpdate: (s: Partial<Widget['settings']>) => void;
  dataSourceFields: string[];
}) {
  const { widgetType, settings } = widget;

  switch (widgetType) {
    case 'heading':
      return (
        <>
          <div className="space-y-2">
            <Label>Texto</Label>
            <Input
              value={settings.text || ''}
              onChange={(e) => onUpdate({ text: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Nível</Label>
            <Select 
              value={String(settings.level || 2)} 
              onValueChange={(v) => onUpdate({ level: Number(v) as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">H1</SelectItem>
                <SelectItem value="2">H2</SelectItem>
                <SelectItem value="3">H3</SelectItem>
                <SelectItem value="4">H4</SelectItem>
                <SelectItem value="5">H5</SelectItem>
                <SelectItem value="6">H6</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Alinhamento</Label>
            <Select 
              value={settings.align || 'left'} 
              onValueChange={(v) => onUpdate({ align: v as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Esquerda</SelectItem>
                <SelectItem value="center">Centro</SelectItem>
                <SelectItem value="right">Direita</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      );

    case 'text':
      return (
        <div className="space-y-2">
          <Label>Conteúdo</Label>
          <Textarea
            value={settings.content || ''}
            onChange={(e) => onUpdate({ content: e.target.value })}
            rows={5}
          />
        </div>
      );

    case 'button':
      return (
        <>
          <div className="space-y-2">
            <Label>Texto</Label>
            <Input
              value={settings.label || ''}
              onChange={(e) => onUpdate({ label: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Link</Label>
            <Input
              value={settings.link || ''}
              onChange={(e) => onUpdate({ link: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label>Variante</Label>
            <Select 
              value={settings.variant || 'primary'} 
              onValueChange={(v) => onUpdate({ variant: v as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primário</SelectItem>
                <SelectItem value="secondary">Secundário</SelectItem>
                <SelectItem value="outline">Outline</SelectItem>
                <SelectItem value="ghost">Ghost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      );

    case 'spacer':
      return (
        <div className="space-y-2">
          <Label>Altura (px)</Label>
          <Input
            type="number"
            value={settings.height || 40}
            onChange={(e) => onUpdate({ height: Number(e.target.value) })}
          />
        </div>
      );

    case 'divider':
      return (
        <>
          <div className="space-y-2">
            <Label>Estilo</Label>
            <Select 
              value={settings.dividerStyle || 'solid'} 
              onValueChange={(v) => onUpdate({ dividerStyle: v as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Sólido</SelectItem>
                <SelectItem value="dashed">Tracejado</SelectItem>
                <SelectItem value="dotted">Pontilhado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Largura</Label>
            <Select 
              value={settings.width || 'full'} 
              onValueChange={(v) => onUpdate({ width: v as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">100%</SelectItem>
                <SelectItem value="half">50%</SelectItem>
                <SelectItem value="third">33%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      );

    case 'image':
      return (
        <>
          <div className="space-y-2">
            <Label>URL da Imagem</Label>
            <Input
              value={settings.src || ''}
              onChange={(e) => onUpdate({ src: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label>Texto Alternativo</Label>
            <Input
              value={settings.alt || ''}
              onChange={(e) => onUpdate({ alt: e.target.value })}
            />
          </div>
        </>
      );

    case 'html':
      return (
        <>
          <div className="space-y-2">
            <Label>HTML</Label>
            <Textarea
              value={settings.html || ''}
              onChange={(e) => onUpdate({ html: e.target.value })}
              rows={8}
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-2">
            <Label>CSS</Label>
            <Textarea
              value={settings.css || ''}
              onChange={(e) => onUpdate({ css: e.target.value })}
              rows={5}
              className="font-mono text-xs"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Permitir Scripts</Label>
            <Switch
              checked={settings.enableScripts || false}
              onCheckedChange={(v) => onUpdate({ enableScripts: v })}
            />
          </div>
        </>
      );

    case 'iframe':
      return (
        <>
          <div className="space-y-2">
            <Label>URL do Iframe (opcional)</Label>
            <Input
              value={settings.iframeUrl || ''}
              onChange={(e) => onUpdate({ iframeUrl: e.target.value })}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground">
              Para importar o UI Kit automaticamente, use HTML abaixo (iframe srcdoc).
            </p>
          </div>
          <div className="space-y-2">
            <Label>HTML do Iframe</Label>
            <Textarea
              value={settings.iframeHtml || ''}
              onChange={(e) => onUpdate({ iframeHtml: e.target.value })}
              rows={8}
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-2">
            <Label>Altura (px)</Label>
            <Input
              type="number"
              value={settings.iframeHeight ?? 600}
              onChange={(e) => onUpdate({ iframeHeight: Number(e.target.value) || 0 })}
              min={0}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Importar UI Kit automaticamente</Label>
            <Switch
              checked={settings.iframeUseUiKit ?? true}
              onCheckedChange={(v) => onUpdate({ iframeUseUiKit: v })}
            />
          </div>
        </>
      );

    case 'kpi':
      return (
        <>
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={settings.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
            />
          </div>
          
          <DataUrlConfig
            dataUrl={settings.dataUrl}
            dataUrlFields={settings.dataUrlFields}
            dataUrlMetrics={settings.dataUrlMetrics}
            selectedValueField={settings.selectedValueField}
            selectedMetric={settings.selectedMetric}
            refreshInterval={settings.refreshInterval}
            onUpdate={onUpdate}
          />
          
          {!settings.dataUrl && (
            <div className="space-y-2">
              <Label>Valor Manual</Label>
              <Input
                value={settings.value || ''}
                onChange={(e) => onUpdate({ value: e.target.value })}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Formato</Label>
            <Select 
              value={settings.format || 'number'} 
              onValueChange={(v) => onUpdate({ format: v as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="number">Número</SelectItem>
                <SelectItem value="currency">Moeda</SelectItem>
                <SelectItem value="percent">Porcentagem</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Prefixo</Label>
              <Input
                value={settings.prefix || ''}
                onChange={(e) => onUpdate({ prefix: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Sufixo</Label>
              <Input
                value={settings.suffix || ''}
                onChange={(e) => onUpdate({ suffix: e.target.value })}
              />
            </div>
          </div>
        </>
      );

    case 'chart':
      return (
        <>
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={settings.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select 
              value={settings.chartType || 'bar'} 
              onValueChange={(v) => onUpdate({ chartType: v as any })}
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
          
          <DataUrlConfig
            dataUrl={settings.dataUrl}
            dataUrlFields={settings.dataUrlFields}
            dataUrlMetrics={settings.dataUrlMetrics}
            selectedValueField={settings.selectedValueField}
            selectedLabelField={settings.selectedLabelField}
            selectedMetric={settings.selectedMetric}
            refreshInterval={settings.refreshInterval}
            showLabelField={true}
            onUpdate={onUpdate}
          />
        </>
      );
    
    case 'table':
      return (
        <>
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={settings.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
            />
          </div>
          
          <DataUrlConfig
            dataUrl={settings.dataUrl}
            dataUrlFields={settings.dataUrlFields}
            dataUrlMetrics={settings.dataUrlMetrics}
            selectedValueField={settings.selectedValueField}
            selectedMetric={settings.selectedMetric}
            refreshInterval={settings.refreshInterval}
            onUpdate={onUpdate}
          />
          
          {settings.dataUrlFields && settings.dataUrlFields.length > 0 && (
            <div className="text-xs text-muted-foreground">
              As colunas serão geradas automaticamente dos campos da URL.
            </div>
          )}
        </>
      );

    default:
      return (
        <p className="text-sm text-muted-foreground">
          Propriedades do widget "{widgetType}" em desenvolvimento...
        </p>
      );
  }
}
