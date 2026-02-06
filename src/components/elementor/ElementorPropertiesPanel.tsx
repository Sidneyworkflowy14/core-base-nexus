import { useMemo, useState } from 'react';
import { Section, Column, Widget, ColumnWidth, COLUMN_PRESETS, createColumn } from '@/types/elementor';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { NexusTabs, NexusTabsList, NexusTabsTrigger, NexusTabsContent } from '@/components/nexus';
import { Settings2, Palette, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DataUrlConfig } from './DataUrlConfig';
import { WidgetStyleProperties } from './WidgetStyleProperties';
import Editor from '@monaco-editor/react';
import { DynamicIcon, iconNames } from '@/components/DynamicIcon';
import { usePages } from '@/hooks/usePages';
import { useViewData } from '@/contexts/ViewDataContext';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SelectedElement {
  type: 'section' | 'column' | 'widget';
  sectionId: string;
  columnId?: string;
  widgetId?: string;
  containerWidgetId?: string;
  innerColumnId?: string;
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

const UI_KIT_SNIPPET = `<!-- UI Kit Nexus: exemplos de todos os elementos disponiveis -->
<section class="nexus-card space-y-4">
  <div class="flex items-center justify-between">
    <div>
      <div class="text-lg font-semibold">Titulo</div>
      <div class="text-sm text-muted-foreground">Descricao usando o UI Kit</div>
    </div>
    <span class="nexus-badge-blue">Badge</span>
  </div>

  <div class="flex flex-wrap items-center gap-2">
    <span class="nexus-badge-beta">Beta</span>
    <button class="nexus-pill">Pill</button>
    <button class="nexus-pill nexus-pill-active">Pill ativo</button>
  </div>

  <div class="grid gap-3">
    <input class="nexus-search" placeholder="Busca..." />
    <input class="nexus-search nexus-input-focus" placeholder="Input com foco" />
  </div>

  <div class="grid gap-2">
    <div class="nexus-section-label">Secao</div>
    <a class="nexus-menu-item" href="#">Item menu</a>
    <a class="nexus-menu-item nexus-menu-item-active" href="#">Item ativo</a>
  </div>

  <div class="nexus-workspace-pill">
    <div class="text-primary-foreground font-semibold">Workspace pill</div>
  </div>

  <div class="rounded-xl p-4 gradient-primary text-primary-foreground font-semibold">
    Gradiente primario
  </div>

  <div class="rounded-xl p-4 gradient-primary-soft text-foreground">
    Gradiente soft
  </div>

  <div class="h-24 overflow-auto rounded-xl border border-border p-3 scrollbar-thin">
    Scrollbar thin
    <div class="h-40"></div>
  </div>
</section>`;

const UI_KIT_CLASSES = new Set([
  'nexus-card',
  'nexus-input-focus',
  'gradient-primary',
  'gradient-primary-soft',
  'nexus-badge-blue',
  'nexus-badge-beta',
  'nexus-pill',
  'nexus-pill-active',
  'nexus-search',
  'nexus-menu-item',
  'nexus-menu-item-active',
  'nexus-section-label',
  'nexus-workspace-pill',
  'scrollbar-thin',
]);

const TAILWIND_BASIC = new Set([
  'flex',
  'grid',
  'block',
  'inline',
  'inline-block',
  'hidden',
  'relative',
  'absolute',
  'fixed',
  'sticky',
  'container',
  'contents',
  'table',
  'table-row',
  'table-cell',
  'sr-only',
  'not-sr-only',
  'dark',
]);

const getUnknownUiKitClasses = (html?: string) => {
  if (!html) return [];
  const matches = Array.from(html.matchAll(/class\s*=\s*["']([^"']+)["']/gi));
  const classes = new Set<string>();
  for (const match of matches) {
    const raw = match[1] || '';
    raw.split(/\s+/).forEach((cls) => {
      if (cls) classes.add(cls.trim());
    });
  }

  const unknown = Array.from(classes).filter((cls) => {
    if (UI_KIT_CLASSES.has(cls)) return false;
    if (TAILWIND_BASIC.has(cls)) return false;
    if (cls.includes(':') || cls.includes('/') || cls.includes('[') || cls.includes('-')) return false;
    return true;
  });

  return unknown.sort();
};

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
    <div className="w-80 border-l border-border bg-card flex flex-col overflow-hidden min-h-0">
      <NexusTabs defaultValue="content" className="flex-1 flex flex-col min-h-0">
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
            <NexusTabsTrigger value="custom" className="flex-1">
              <SlidersHorizontal className="h-4 w-4 mr-1" />
              Personalizado
            </NexusTabsTrigger>
          </NexusTabsList>
        </div>

        <NexusTabsContent value="content" className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4 space-y-4">
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

        <NexusTabsContent value="style" className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4 space-y-4">
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
        <NexusTabsContent value="custom" className="flex-1 min-h-0 overflow-y-auto scrollbar-thin p-4 space-y-4">
          {selectedData.type === 'widget' ? (
            <WidgetCustomProperties 
              widget={selectedData.data as Widget} 
              onUpdate={onUpdateWidget}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma configuração personalizada disponível.
            </p>
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
      <div className="space-y-2">
        <Label>Organização interna</Label>
        <Select
          value={column.settings.flow || 'stack'}
          onValueChange={(v) => onUpdate({ flow: v as any })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stack">Empilhado</SelectItem>
            <SelectItem value="row">Lado a lado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label>Altura total da tela</Label>
        <Switch
          checked={column.settings.fullHeight || false}
          onCheckedChange={(v) => onUpdate({ fullHeight: v })}
        />
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

function FiltersHeaderProperties({
  settings,
  onUpdate,
}: {
  settings: Widget['settings'];
  onUpdate: (updates: Partial<Widget['settings']>) => void;
}) {
  const fields = settings.filterFields || [];
  const [listText, setListText] = useState<Record<string, string>>({});
  const [optionsStatus, setOptionsStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [optionsMessage, setOptionsMessage] = useState('');
  const [endpointOpen, setEndpointOpen] = useState(false);

  const updateField = (index: number, updates: Partial<typeof fields[number]>) => {
    const next = [...fields];
    next[index] = { ...next[index], ...updates };
    onUpdate({ filterFields: next });
  };

  const addField = () => {
    if (fields.length >= 4) return;
    onUpdate({
      filterFields: [
        ...fields,
        { key: `campo${fields.length + 1}`, label: `Campo ${fields.length + 1}`, type: 'text' },
      ],
    });
  };

  const removeField = (index: number) => {
    const next = fields.filter((_, i) => i !== index);
    onUpdate({ filterFields: next });
  };

  const parseOptionsLines = (value: string) => {
    return value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const [labelPart, valuePart] = line.split('|').map((s) => s.trim());
        const label = valuePart ? labelPart : line;
        const val = valuePart ? valuePart : line;
        return { label, value: val };
      });
  };

  const serializeOptions = (options: { label: string; value: string }[] | string[] | undefined) => {
    if (!options || options.length === 0) return '';
    if (typeof options[0] === 'string') {
      return (options as string[]).join('\n');
    }
    return (options as { label: string; value: string }[])
      .map((opt) => (opt.label === opt.value ? opt.value : `${opt.label} | ${opt.value}`))
      .join('\n');
  };

  const normalizeOptionsMap = (data: unknown) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    const options = (data as { options?: unknown }).options;
    if (!options || typeof options !== 'object' || Array.isArray(options)) return null;
    const map: Record<string, { label: string; value: string }[]> = {};
    Object.entries(options as Record<string, unknown>).forEach(([key, value]) => {
      if (!Array.isArray(value)) return;
      const parsed = (value as Array<{ label?: unknown; value?: unknown }>).map((opt) => ({
        label: opt.label === undefined ? '' : String(opt.label),
        value: opt.value === undefined ? '' : String(opt.value),
      })).filter((opt) => opt.label.length > 0 && opt.value.length > 0);
      if (parsed.length > 0) {
        map[key] = parsed;
      }
    });
    return Object.keys(map).length > 0 ? map : null;
  };

  const applyOptionsMap = (optionsMap: Record<string, { label: string; value: string }[]>) => {
    const next = fields.map((field) =>
      optionsMap[field.key] ? { ...field, options: optionsMap[field.key] } : field
    );
    onUpdate({ filterFields: next });
  };

  const handleLoadOptions = async () => {
    const endpoint = settings.filtersEndpoint?.trim();
    if (!endpoint) {
      setOptionsStatus('error');
      setOptionsMessage('Informe o endpoint primeiro.');
      return;
    }

    setOptionsStatus('loading');
    setOptionsMessage('Carregando opções...');
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      const map = normalizeOptionsMap(data);
      if (!map) {
        setOptionsStatus('error');
        setOptionsMessage('Resposta sem "options" no padrão esperado.');
        return;
      }
      applyOptionsMap(map);
      setOptionsStatus('success');
      setOptionsMessage(`Opções carregadas: ${Object.keys(map).join(', ')}`);
    } catch (err) {
      setOptionsStatus('error');
      setOptionsMessage(err instanceof Error ? err.message : 'Erro ao carregar opções.');
    }
  };

  const handleLoadFieldOptions = async (index: number) => {
    const field = fields[index];
    if (!field?.optionsEndpoint) {
      setOptionsStatus('error');
      setOptionsMessage('Informe o endpoint do campo.');
      return;
    }
    setOptionsStatus('loading');
    setOptionsMessage(`Carregando opções de ${field.key}...`);
    try {
      const response = await fetch(field.optionsEndpoint);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      let list: { label: string; value: string }[] = [];
      if (typeof data === 'string') {
        list = data
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
          .map((item) => ({ label: item, value: item }));
      } else if (Array.isArray(data)) {
        list = (data as Array<{ label?: unknown; value?: unknown }>).map((opt) => ({
          label: opt.label === undefined ? '' : String(opt.label),
          value: opt.value === undefined ? '' : String(opt.value),
        })).filter((opt) => opt.label.length > 0 && opt.value.length > 0);
      } else if (data && typeof data === 'object') {
        if (typeof (data as any).options === 'string') {
          list = String((data as any).options)
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
            .map((item) => ({ label: item, value: item }));
        } else if (Array.isArray((data as any).options)) {
          list = ((data as any).options as Array<{ label?: unknown; value?: unknown }>).map((opt) => ({
            label: opt.label === undefined ? '' : String(opt.label),
            value: opt.value === undefined ? '' : String(opt.value),
          })).filter((opt) => opt.label.length > 0 && opt.value.length > 0);
        }
      }
      if (list.length === 0) {
        setOptionsStatus('error');
        setOptionsMessage('Resposta sem opções válidas.');
        return;
      }
      updateField(index, { options: list });
      setOptionsStatus('success');
      setOptionsMessage(`Opções carregadas para ${field.key}`);
    } catch (err) {
      setOptionsStatus('error');
      setOptionsMessage(err instanceof Error ? err.message : 'Erro ao carregar opções.');
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Ícone do título</Label>
          <Select
            value={settings.filtersTitleIcon ? settings.filtersTitleIcon : '__none__'}
            onValueChange={(v) => onUpdate({ filtersTitleIcon: v === '__none__' ? '' : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sem ícone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 flex items-center justify-center text-muted-foreground">Ø</span>
                  <span>Sem ícone</span>
                </div>
              </SelectItem>
              {iconNames.map((name) => (
                <SelectItem key={name} value={name}>
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 text-muted-foreground">
                      <DynamicIcon name={name} className="h-4 w-4" />
                    </span>
                    <span>{name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Posição do ícone</Label>
          <Select
            value={settings.filtersTitleIconPosition || 'left'}
            onValueChange={(v) => onUpdate({ filtersTitleIconPosition: v as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Esquerda</SelectItem>
              <SelectItem value="right">Direita</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setEndpointOpen(true)}
        >
          Configurar endpoint
        </Button>
      </div>
      <Dialog open={endpointOpen} onOpenChange={setEndpointOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Endpoint do cabeçalho</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs">Endpoint (GET)</Label>
            <Input
              value={settings.filtersEndpoint || ''}
              onChange={(e) => onUpdate({ filtersEndpoint: e.target.value })}
              placeholder="https://..."
            />
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="outline" onClick={handleLoadOptions}>
                Testar endpoint
              </Button>
            </div>
            {optionsStatus !== 'idle' && (
              <span
                className={cn(
                  "text-xs",
                  optionsStatus === 'error' ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {optionsMessage}
              </span>
            )}
            <p className="text-xs text-muted-foreground">
              Padrão esperado: {"{ \"options\": { \"campo1\": [{\"label\",\"value\"}] }, \"kpis\": [...] }"}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEndpointOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Layout</Label>
          <Select
            value={settings.filtersLayout || 'grid'}
            onValueChange={(v) => onUpdate({ filtersLayout: v as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grid">Grid</SelectItem>
              <SelectItem value="inline">Inline</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Colunas</Label>
          <Select
            value={String(settings.filtersColumns || 2)}
            onValueChange={(v) => onUpdate({ filtersColumns: Number(v) as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4].map((col) => (
                <SelectItem key={col} value={String(col)}>
                  {col}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Período</Label>
          <Select
            value={settings.filtersPeriodPlacement || 'right'}
            onValueChange={(v) => onUpdate({ filtersPeriodPlacement: v as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="right">Direita</SelectItem>
              <SelectItem value="below">Abaixo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Botão aplicar</Label>
          <Select
            value={settings.filtersButtonPlacement || 'right'}
            onValueChange={(v) => onUpdate({ filtersButtonPlacement: v as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="right">Direita</SelectItem>
              <SelectItem value="below">Abaixo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label>Mostrar período</Label>
        <Switch
          checked={settings.filtersShowPeriod ?? true}
          onCheckedChange={(v) => onUpdate({ filtersShowPeriod: v })}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label>Mostrar botão aplicar</Label>
        <Switch
          checked={settings.filtersShowApply ?? true}
          onCheckedChange={(v) => onUpdate({ filtersShowApply: v })}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>Disparar automaticamente</Label>
        <Switch
          checked={settings.filtersAutoApply ?? !(settings.filtersShowApply ?? true)}
          onCheckedChange={(v) => onUpdate({ filtersAutoApply: v })}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>Somente com todos preenchidos</Label>
        <Switch
          checked={settings.filtersAutoApplyRequireAll ?? false}
          onCheckedChange={(v) => onUpdate({ filtersAutoApplyRequireAll: v })}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>Usar card</Label>
        <Switch
          checked={settings.filtersUseCard ?? true}
          onCheckedChange={(v) => onUpdate({ filtersUseCard: v })}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Campos (até 4)</Label>
          <Button type="button" variant="outline" size="sm" onClick={addField} disabled={fields.length >= 4}>
            Adicionar
          </Button>
        </div>

        {fields.length === 0 && (
          <p className="text-xs text-muted-foreground">Nenhum campo configurado.</p>
        )}

        {fields.map((field, index) => (
          <div key={`${field.key}-${index}`} className="space-y-2 rounded-md border border-border p-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Label</Label>
                <Input
                  value={field.label}
                  onChange={(e) => updateField(index, { label: e.target.value })}
                  placeholder="Campo"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Key</Label>
                <Input
                  value={field.key}
                  onChange={(e) => updateField(index, { key: e.target.value })}
                  placeholder="campo1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Tipo</Label>
                <Select
                  value={field.type}
                  onValueChange={(v) => updateField(index, { type: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Texto</SelectItem>
                    <SelectItem value="number">Número</SelectItem>
                    <SelectItem value="list">Lista</SelectItem>
                    <SelectItem value="boolean">Booleano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={() => removeField(index)}>
                  Remover
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Depende de</Label>
                <Select
                  value={field.dependsOn || 'none'}
                  onValueChange={(v) => updateField(index, { dependsOn: v === 'none' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {fields
                      .filter((f) => f.key !== field.key)
                      .map((f) => (
                        <SelectItem key={f.key} value={f.key}>
                          {f.label || f.key}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Param (opcional)</Label>
                <Input
                  value={field.dependsParam || ''}
                  onChange={(e) => updateField(index, { dependsParam: e.target.value })}
                  placeholder={field.dependsOn || 'campoPai'}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Travar ao preencher</Label>
              <Switch
                checked={field.lockOnAutoFill ?? false}
                onCheckedChange={(v) => updateField(index, { lockOnAutoFill: v })}
              />
            </div>
            {field.type === 'list' && (
              <div className="space-y-1">
                <Label className="text-xs">Opções (label | value)</Label>
                <Input
                  value={field.optionsEndpoint || ''}
                  onChange={(e) => updateField(index, { optionsEndpoint: e.target.value })}
                  placeholder="https://... (endpoint do campo)"
                />
                <div className="flex items-center gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => handleLoadFieldOptions(index)}>
                    Carregar deste campo
                  </Button>
                  {optionsStatus !== 'idle' && (
                    <span className={cn(
                      "text-xs",
                      optionsStatus === 'error' ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {optionsMessage}
                    </span>
                  )}
                </div>
                <Textarea
                  value={listText[field.key] ?? serializeOptions(field.options)}
                  onChange={(e) => {
                    const value = e.target.value;
                    setListText((prev) => ({ ...prev, [field.key]: value }));
                    updateField(index, {
                      options: parseOptionsLines(value),
                    });
                  }}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="SUPORTE SMART - JOCKEY | sup_jockey\nSUPORTE SMART - BOQUEIRÃO | sup_boqueirao"
                  rows={4}
                />
              </div>
            )}
            {field.type === 'number' && (
              <div className="space-y-1">
                <Label className="text-xs">Formato do número</Label>
                <Select
                  value={field.numberFormat || 'number'}
                  onValueChange={(v) => updateField(index, { numberFormat: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="number">Número</SelectItem>
                    <SelectItem value="currency">Moeda (R$)</SelectItem>
                    <SelectItem value="percent">Porcentagem (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        ))}
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
  const { pages } = usePages();
  const { filterResults } = useViewData();
  const { widgetType, settings } = widget;
  const filterOptions = useMemo(() => {
    if (!settings.filterLabel) return [];
    const raw = filterResults[settings.filterLabel];
    if (!Array.isArray(raw)) return [];
    return raw
      .map((opt, index) => {
        if (typeof opt === 'string' || typeof opt === 'number') {
          const text = String(opt);
          return { label: text, value: text, index };
        }
        if (opt && typeof opt === 'object') {
          const obj = opt as { label?: unknown; value?: unknown };
          const label = obj.label === undefined ? '' : String(obj.label);
          const value = obj.value === undefined ? label : String(obj.value);
          return { label, value, index };
        }
        return { label: '', value: '', index };
      })
      .filter((opt) => opt.label.length > 0 && opt.value.length > 0);
  }, [filterResults, settings.filterLabel]);

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
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Ícone</Label>
              <Select
                value={settings.headingIcon ? settings.headingIcon : '__none__'}
                onValueChange={(v) => onUpdate({ headingIcon: v === '__none__' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sem ícone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sem ícone</SelectItem>
                  {iconNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Posição</Label>
              <Select
                value={settings.headingIconPosition || 'left'}
                onValueChange={(v) => onUpdate({ headingIconPosition: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Esquerda</SelectItem>
                  <SelectItem value="right">Direita</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
          <div className="space-y-2">
            <Label>Ação</Label>
            <Select
              value={settings.buttonAction || 'none'}
              onValueChange={(v) => onUpdate({ buttonAction: v as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                <SelectItem value="navigate">Abrir subview</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {settings.buttonAction === 'navigate' && (
            <div className="space-y-2">
              <Label>Subview</Label>
              <Select
                value={settings.buttonTargetPageId || ''}
                onValueChange={(v) => onUpdate({ buttonTargetPageId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a subview" />
                </SelectTrigger>
                <SelectContent>
                  {pages
                    .filter((p) => p.parent_page_id)
                    .map((page) => (
                      <SelectItem key={page.id} value={page.id}>
                        {page.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-center justify-between">
            <Label>Exigir filtros preenchidos</Label>
            <Switch
              checked={settings.buttonRequiresFilters ?? false}
              onCheckedChange={(v) => onUpdate({ buttonRequiresFilters: v })}
            />
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

    case 'icon':
      return (
        <>
          <div className="space-y-2">
            <Label>Ícone</Label>
            <Select
              value={settings.icon ? settings.icon : '__none__'}
              onValueChange={(v) => onUpdate({ icon: v === '__none__' ? '' : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um ícone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sem ícone</SelectItem>
                {iconNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tamanho (px)</Label>
            <Input
              type="number"
              min={8}
              value={settings.iconSize ?? 48}
              onChange={(e) => onUpdate({ iconSize: Number(e.target.value) })}
            />
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
      {
        const unknownClasses = getUnknownUiKitClasses(settings.html);

      return (
        <>
          <div className="space-y-2">
            <Label>HTML</Label>
            <div className="border border-border rounded-md overflow-hidden">
              <Editor
                height="280px"
                language="html"
                theme="vs-dark"
                value={settings.html || ''}
                onChange={(value) => onUpdate({ html: value || '' })}
                options={{
                  minimap: { enabled: false },
                  fontSize: 12,
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>JS</Label>
            <div className="border border-border rounded-md overflow-hidden">
              <Editor
                height="220px"
                language="javascript"
                theme="vs-dark"
                value={settings.htmlJs || ''}
                onChange={(value) => onUpdate({ htmlJs: value || '' })}
                options={{
                  minimap: { enabled: false },
                  fontSize: 12,
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Snippet UI Kit (copie e comece por aqui)</Label>
            <Textarea
              value={UI_KIT_SNIPPET}
              readOnly
              rows={6}
              className="font-mono text-xs"
            />
          </div>
          {unknownClasses.length > 0 && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              Classes possivelmente fora do UI Kit: {unknownClasses.join(', ')}
            </div>
          )}
        </>
      );
      }

    case 'iframe':
      return (
        <>
          <div className="space-y-2">
            <Label>URL do Iframe</Label>
            <Input
              value={settings.iframeUrl || ''}
              onChange={(e) => onUpdate({ iframeUrl: e.target.value })}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground">Se a URL estiver preenchida, o HTML abaixo será ignorado.</p>
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
              value={settings.iframeHeight ?? 320}
              onChange={(e) => onUpdate({ iframeHeight: Number(e.target.value) || 0 })}
              min={0}
            />
          </div>
          <div className="space-y-2">
            <Label>Enviar contexto</Label>
            <Select
              value={settings.iframeSendContext ? 'yes' : 'no'}
              onValueChange={(v) => onUpdate({ iframeSendContext: v === 'yes' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Sim</SelectItem>
                <SelectItem value="no">Não</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Envia usuário, tenant, página, widget e metadados na abertura do iframe.
            </p>
          </div>
          <div className="flex items-center justify-between">
            <Label>Injetar UI Kit</Label>
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

          <div className="flex items-center justify-between">
            <Label>Usar dados do cabeçalho</Label>
            <Switch
              checked={settings.useFilterResult || false}
              onCheckedChange={(v) => onUpdate({ useFilterResult: v })}
            />
          </div>

          {settings.useFilterResult && (
            <>
              <div className="space-y-2">
                <Label>Label do resultado</Label>
                <Input
                  value={settings.filterLabel || ''}
                  onChange={(e) => onUpdate({ filterLabel: e.target.value })}
                  placeholder="installments"
                />
              </div>
              <div className="space-y-2">
                <Label>Opção do resultado</Label>
                <Select
                  value={String(settings.kpiFilterOptionIndex ?? 0)}
                  onValueChange={(v) => onUpdate({ kpiFilterOptionIndex: Number(v) })}
                  disabled={filterOptions.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={filterOptions.length === 0 ? "Sem opções" : "Selecione uma opção"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.map((opt) => (
                      <SelectItem key={`${opt.index}-${opt.value}`} value={String(opt.index)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Exibir</Label>
                <Select
                  value={settings.kpiFilterDisplayMode || 'label'}
                  onValueChange={(v) => onUpdate({ kpiFilterDisplayMode: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="label">Label</SelectItem>
                    <SelectItem value="value">Value</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {settings.filterLabel && filterOptions.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Preencha os filtros e aplique para carregar as opções do retorno.
                </p>
              )}
            </>
          )}
          
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

    case 'filters_header':
      return <FiltersHeaderProperties settings={settings} onUpdate={onUpdate} />;
    case 'subsection': {
      const columns = settings.subsectionColumns || [];
      const gap = settings.subsectionGap || 'md';
      const padding = settings.subsectionPadding || 'sm';
      const useCard = settings.subsectionUseCard ?? false;

      const setColumns = (nextCount: number) => {
        const preset = COLUMN_PRESETS.find((p) => p.columns.length === nextCount);
        const widths = preset ? preset.columns : Array.from({ length: nextCount }, () => Math.floor(12 / nextCount));
        const nextColumns = widths.map((width, index) => {
          const existing = columns[index];
          if (existing) {
            return {
              ...existing,
              settings: { ...existing.settings, width: width as ColumnWidth },
            };
          }
          return createColumn(width as ColumnWidth);
        });
        onUpdate({ subsectionColumns: nextColumns });
      };

      return (
        <>
          <div className="space-y-2">
            <Label>Colunas internas</Label>
            <Select
              value={String(columns.length || 2)}
              onValueChange={(v) => setColumns(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((count) => (
                  <SelectItem key={count} value={String(count)}>
                    {count}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Gap</Label>
              <Select
                value={gap}
                onValueChange={(v) => onUpdate({ subsectionGap: v as any })}
              >
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
            <div className="space-y-1">
              <Label className="text-xs">Padding</Label>
              <Select
                value={padding}
                onValueChange={(v) => onUpdate({ subsectionPadding: v as any })}
              >
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
          </div>
          <div className="flex items-center justify-between">
            <Label>Usar card</Label>
            <Switch
              checked={useCard}
              onCheckedChange={(v) => onUpdate({ subsectionUseCard: v })}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Arraste widgets para dentro das colunas internas.
          </p>
        </>
      );
    }
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

    case 'filters_result_list':
      return (
        <>
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              value={settings.filtersResultTitle || ''}
              onChange={(e) => onUpdate({ filtersResultTitle: e.target.value })}
              placeholder="Opções de parcelamento"
            />
          </div>
          <div className="space-y-2">
            <Label>Chave do retorno</Label>
            <Input
              value={settings.filtersResultKey || ''}
              onChange={(e) => onUpdate({ filtersResultKey: e.target.value })}
              placeholder="installments"
            />
            <p className="text-xs text-muted-foreground">
              É o label que vem no array de KPIs do cabeçalho (ex: "installments").
            </p>
          </div>
          <div className="space-y-2">
            <Label>Salvar seleção em</Label>
            <Input
              value={settings.filtersResultTargetKey || ''}
              onChange={(e) => onUpdate({ filtersResultTargetKey: e.target.value })}
              placeholder="parcelamento"
            />
            <p className="text-xs text-muted-foreground">
              Campo de filtro que receberá o value selecionado.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Exibir</Label>
              <Select
                value={settings.filtersResultDisplayMode || 'label'}
                onValueChange={(v) => onUpdate({ filtersResultDisplayMode: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="label">Label</SelectItem>
                  <SelectItem value="value">Value</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Salvar</Label>
              <Select
                value={settings.filtersResultValueMode || 'value'}
                onValueChange={(v) => onUpdate({ filtersResultValueMode: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="value">Value</SelectItem>
                  <SelectItem value="label">Label</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Mensagem vazia</Label>
            <Input
              value={settings.filtersResultEmptyMessage || ''}
              onChange={(e) => onUpdate({ filtersResultEmptyMessage: e.target.value })}
              placeholder="Nenhuma opção disponível."
            />
          </div>
        </>
      );

    case 'input_text':
      return (
        <>
          <div className="space-y-2">
            <Label>Label</Label>
            <Input
              value={settings.inputLabel || ''}
              onChange={(e) => onUpdate({ inputLabel: e.target.value })}
              placeholder="Digite um valor"
            />
          </div>
          <div className="space-y-2">
            <Label>Placeholder</Label>
            <Input
              value={settings.placeholder || ''}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              placeholder="Ex: 123"
            />
          </div>
          <div className="space-y-2">
            <Label>Texto do Botão</Label>
            <Input
              value={settings.buttonLabel || ''}
              onChange={(e) => onUpdate({ buttonLabel: e.target.value })}
              placeholder="Enviar"
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
        </>
      );

    case 'input_select':
      return (
        <>
          <div className="space-y-2">
            <Label>Label</Label>
            <Input
              value={settings.inputLabel || ''}
              onChange={(e) => onUpdate({ inputLabel: e.target.value })}
              placeholder="Selecione uma opção"
            />
          </div>
          <div className="space-y-2">
            <Label>Opções (separadas por vírgula)</Label>
            <Input
              value={(settings.options || []).join(', ')}
              onChange={(e) =>
                onUpdate({
                  options: e.target.value
                    .split(',')
                    .map((v) => v.trim())
                    .filter(Boolean),
                })
              }
              placeholder="Opção A, Opção B, Opção C"
            />
          </div>
          <div className="space-y-2">
            <Label>Texto do Botão</Label>
            <Input
              value={settings.buttonLabel || ''}
              onChange={(e) => onUpdate({ buttonLabel: e.target.value })}
              placeholder="Enviar"
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
        </>
      );

    case 'input_boolean':
      return (
        <>
          <div className="space-y-2">
            <Label>Label</Label>
            <Input
              value={settings.inputLabel || ''}
              onChange={(e) => onUpdate({ inputLabel: e.target.value })}
              placeholder="Ativar?"
            />
          </div>
          <div className="space-y-2">
            <Label>Texto para Verdadeiro</Label>
            <Input
              value={settings.trueLabel || ''}
              onChange={(e) => onUpdate({ trueLabel: e.target.value })}
              placeholder="Sim"
            />
          </div>
          <div className="space-y-2">
            <Label>Texto para Falso</Label>
            <Input
              value={settings.falseLabel || ''}
              onChange={(e) => onUpdate({ falseLabel: e.target.value })}
              placeholder="Não"
            />
          </div>
          <div className="space-y-2">
            <Label>Texto do Botão</Label>
            <Input
              value={settings.buttonLabel || ''}
              onChange={(e) => onUpdate({ buttonLabel: e.target.value })}
              placeholder="Enviar"
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

function WidgetCustomProperties({
  widget,
  onUpdate,
}: {
  widget: Widget;
  onUpdate: (s: Partial<Widget['settings']>) => void;
}) {
  const fields = widget.settings.filterFields || [];
  const [mappingOpen, setMappingOpen] = useState(false);
  const [mappingDraft, setMappingDraft] = useState<Record<string, string>>({});

  if (widget.widgetType !== 'filters_header') {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma configuração personalizada disponível para este widget.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-1">
        <Label className="text-xs">Fallback sem opções</Label>
        <Select
          value={widget.settings.filtersOptionsFallback || 'field'}
          onValueChange={(v) => onUpdate({ filtersOptionsFallback: v as any })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="field">Por campo</SelectItem>
            <SelectItem value="block">Bloco inteiro</SelectItem>
            <SelectItem value="none">Nunca</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label>Carregar opções automaticamente</Label>
        <Switch
          checked={widget.settings.filtersAutoOptions ?? true}
          onCheckedChange={(v) => onUpdate({ filtersAutoOptions: v })}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>Enviar contexto</Label>
        <Switch
          checked={widget.settings.filtersSendContext ?? false}
          onCheckedChange={(v) => onUpdate({ filtersSendContext: v })}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label>Preencher campos pelo endpoint</Label>
        <Switch
          checked={widget.settings.filtersEndpointPrefill ?? false}
          onCheckedChange={(v) => onUpdate({ filtersEndpointPrefill: v })}
        />
      </div>
      {widget.settings.filtersEndpointPrefill && (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const baseMap = widget.settings.filtersEndpointPrefillMap || {};
              const draft: Record<string, string> = {};
              fields.slice(0, 4).forEach((field) => {
                draft[field.key] = baseMap[field.key] ?? field.key;
              });
              setMappingDraft(draft);
              setMappingOpen(true);
            }}
          >
            Mapear campos
          </Button>
          <p className="text-xs text-muted-foreground">
            Mapeie o nome do campo retornado pelo endpoint principal para cada campo da tela.
          </p>
        </div>
      )}
      <div className="flex items-center justify-between">
        <Label>Popup de pagamento</Label>
        <Switch
          checked={widget.settings.filtersPaymentPopup ?? false}
          onCheckedChange={(v) => onUpdate({ filtersPaymentPopup: v })}
        />
      </div>
      {widget.settings.filtersPaymentPopup && (
        <div className="space-y-1">
          <Label className="text-xs">Campo total (venda)</Label>
          <Select
            value={widget.settings.filtersPaymentTotalKey || 'none'}
            onValueChange={(v) => onUpdate({ filtersPaymentTotalKey: v === 'none' ? '' : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o campo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              {fields.map((f) => (
                <SelectItem key={f.key} value={f.key}>
                  {f.label || f.key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {widget.settings.filtersPaymentPopup && (
        <div className="space-y-2">
          <Label className="text-xs">Endpoint enviar venda (POST)</Label>
          <Input
            value={widget.settings.filtersPaymentSubmitEndpoint || ''}
            onChange={(e) => onUpdate({ filtersPaymentSubmitEndpoint: e.target.value })}
            placeholder="https://..."
          />
          <Label className="text-xs">Endpoint ticket (GET)</Label>
          <Input
            value={widget.settings.filtersPaymentTicketEndpoint || ''}
            onChange={(e) => onUpdate({ filtersPaymentTicketEndpoint: e.target.value })}
            placeholder="https://..."
          />
        </div>
      )}
      <Dialog open={mappingOpen} onOpenChange={setMappingOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mapear campos do endpoint</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {fields.slice(0, 4).map((field) => (
              <div key={field.key} className="grid grid-cols-[1fr,1fr] gap-2 items-center">
                <div className="text-sm font-medium">{field.label || field.key}</div>
                <Input
                  value={mappingDraft[field.key] || ''}
                  onChange={(e) =>
                    setMappingDraft((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                  placeholder="campo_retorno"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMappingOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => {
                onUpdate({ filtersEndpointPrefillMap: mappingDraft });
                setMappingOpen(false);
              }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
