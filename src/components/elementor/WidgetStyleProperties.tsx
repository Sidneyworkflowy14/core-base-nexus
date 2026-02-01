import { Widget, WidgetStyleSettings } from '@/types/elementor';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Link2, Link2Off, Move, Square, Maximize, Eye, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WidgetStylePropertiesProps {
  widget: Widget;
  onUpdate: (settings: Partial<Widget['settings']>) => void;
}

export function WidgetStyleProperties({ widget, onUpdate }: WidgetStylePropertiesProps) {
  const style = widget.settings.widgetStyle || {};
  
  const updateStyle = (updates: Partial<WidgetStyleSettings>) => {
    onUpdate({
      widgetStyle: { ...style, ...updates }
    });
  };

  return (
    <div className="space-y-6">
      {/* Alignment Section */}
      <StyleSection title="Alinhamento" icon={<AlignCenter className="h-4 w-4" />}>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Posição do Elemento</Label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => updateStyle({ alignSelf: 'start', justifyContent: 'start' })}
                className={cn(
                  "flex-1 p-2 rounded border transition-colors",
                  style.alignSelf === 'start' ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                )}
                title="Esquerda"
              >
                <AlignLeft className="h-4 w-4 mx-auto" />
              </button>
              <button
                type="button"
                onClick={() => updateStyle({ alignSelf: 'center', justifyContent: 'center' })}
                className={cn(
                  "flex-1 p-2 rounded border transition-colors",
                  style.alignSelf === 'center' ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                )}
                title="Centro"
              >
                <AlignCenter className="h-4 w-4 mx-auto" />
              </button>
              <button
                type="button"
                onClick={() => updateStyle({ alignSelf: 'end', justifyContent: 'end' })}
                className={cn(
                  "flex-1 p-2 rounded border transition-colors",
                  style.alignSelf === 'end' ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                )}
                title="Direita"
              >
                <AlignRight className="h-4 w-4 mx-auto" />
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs">Alinhamento do Texto</Label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => updateStyle({ textAlign: 'left' })}
                className={cn(
                  "flex-1 p-2 rounded border transition-colors",
                  style.textAlign === 'left' ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                )}
                title="Esquerda"
              >
                <AlignLeft className="h-4 w-4 mx-auto" />
              </button>
              <button
                type="button"
                onClick={() => updateStyle({ textAlign: 'center' })}
                className={cn(
                  "flex-1 p-2 rounded border transition-colors",
                  style.textAlign === 'center' ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                )}
                title="Centro"
              >
                <AlignCenter className="h-4 w-4 mx-auto" />
              </button>
              <button
                type="button"
                onClick={() => updateStyle({ textAlign: 'right' })}
                className={cn(
                  "flex-1 p-2 rounded border transition-colors",
                  style.textAlign === 'right' ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
                )}
                title="Direita"
              >
                <AlignRight className="h-4 w-4 mx-auto" />
              </button>
            </div>
          </div>
        </div>
      </StyleSection>

      {/* Sizing Section */}
      <StyleSection title="Dimensões" icon={<Maximize className="h-4 w-4" />}>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Largura</Label>
            <Select 
              value={style.width || 'auto'} 
              onValueChange={(v) => updateStyle({ width: v as any })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automática</SelectItem>
                <SelectItem value="full">100%</SelectItem>
                <SelectItem value="custom">Personalizada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {style.width === 'custom' && (
            <div className="flex gap-2">
              <Input
                type="number"
                value={style.customWidth || ''}
                onChange={(e) => updateStyle({ customWidth: Number(e.target.value) })}
                placeholder="100"
                className="h-8 text-xs"
              />
              <Select 
                value={style.widthUnit || 'px'} 
                onValueChange={(v) => updateStyle({ widthUnit: v as any })}
              >
                <SelectTrigger className="w-20 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="px">px</SelectItem>
                  <SelectItem value="%">%</SelectItem>
                  <SelectItem value="vw">vw</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="space-y-2">
            <Label className="text-xs">Altura</Label>
            <Select 
              value={style.height || 'auto'} 
              onValueChange={(v) => updateStyle({ height: v as any })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automática</SelectItem>
                <SelectItem value="custom">Personalizada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {style.height === 'custom' && (
            <div className="flex gap-2">
              <Input
                type="number"
                value={style.customHeight || ''}
                onChange={(e) => updateStyle({ customHeight: Number(e.target.value) })}
                placeholder="100"
                className="h-8 text-xs"
              />
              <Select 
                value={style.heightUnit || 'px'} 
                onValueChange={(v) => updateStyle({ heightUnit: v as any })}
              >
                <SelectTrigger className="w-20 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="px">px</SelectItem>
                  <SelectItem value="%">%</SelectItem>
                  <SelectItem value="vh">vh</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </StyleSection>

      {/* Margin Section */}
      <StyleSection title="Margem" icon={<Move className="h-4 w-4" />}>
        <SpacingControl
          values={{
            top: style.marginTop || 0,
            right: style.marginRight || 0,
            bottom: style.marginBottom || 0,
            left: style.marginLeft || 0,
          }}
          linked={style.marginLinked !== false}
          unit={style.marginUnit || 'px'}
          onValuesChange={(values) => updateStyle({
            marginTop: values.top,
            marginRight: values.right,
            marginBottom: values.bottom,
            marginLeft: values.left,
          })}
          onLinkedChange={(linked) => updateStyle({ marginLinked: linked })}
          onUnitChange={(unit) => updateStyle({ marginUnit: unit as any })}
        />
      </StyleSection>

      {/* Padding Section */}
      <StyleSection title="Padding" icon={<Square className="h-4 w-4" />}>
        <SpacingControl
          values={{
            top: style.paddingTop || 0,
            right: style.paddingRight || 0,
            bottom: style.paddingBottom || 0,
            left: style.paddingLeft || 0,
          }}
          linked={style.paddingLinked !== false}
          unit={style.paddingUnit || 'px'}
          onValuesChange={(values) => updateStyle({
            paddingTop: values.top,
            paddingRight: values.right,
            paddingBottom: values.bottom,
            paddingLeft: values.left,
          })}
          onLinkedChange={(linked) => updateStyle({ paddingLinked: linked })}
          onUnitChange={(unit) => updateStyle({ paddingUnit: unit as any })}
        />
      </StyleSection>

      {/* Border Section */}
      <StyleSection title="Borda">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label className="text-xs">Espessura</Label>
              <Input
                type="number"
                min={0}
                max={20}
                value={style.borderWidth || 0}
                onChange={(e) => updateStyle({ borderWidth: Number(e.target.value) })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Estilo</Label>
              <Select 
                value={style.borderStyle || 'none'} 
                onValueChange={(v) => updateStyle({ borderStyle: v as any })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  <SelectItem value="solid">Sólido</SelectItem>
                  <SelectItem value="dashed">Tracejado</SelectItem>
                  <SelectItem value="dotted">Pontilhado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label className="text-xs">Cor</Label>
              <Input
                type="color"
                value={style.borderColor || '#e5e7eb'}
                onChange={(e) => updateStyle({ borderColor: e.target.value })}
                className="h-8 p-1"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Arredondamento</Label>
              <Input
                type="number"
                min={0}
                max={50}
                value={style.borderRadius || 0}
                onChange={(e) => updateStyle({ borderRadius: Number(e.target.value) })}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>
      </StyleSection>

      {/* Background Section */}
      <StyleSection title="Fundo">
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Cor de Fundo</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={style.backgroundColor || '#ffffff'}
                onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                className="h-8 w-12 p-1"
              />
              <Input
                value={style.backgroundColor || ''}
                onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                placeholder="transparent"
                className="h-8 text-xs flex-1"
              />
            </div>
          </div>
        </div>
      </StyleSection>

      {/* Effects Section */}
      <StyleSection title="Efeitos">
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Opacidade</Label>
              <span className="text-xs text-muted-foreground">{Math.round((style.opacity ?? 1) * 100)}%</span>
            </div>
            <Slider
              value={[(style.opacity ?? 1) * 100]}
              min={0}
              max={100}
              step={5}
              onValueChange={([v]) => updateStyle({ opacity: v / 100 })}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs">Sombra</Label>
            <Select 
              value={style.boxShadow || 'none'} 
              onValueChange={(v) => updateStyle({ boxShadow: v as any })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                <SelectItem value="sm">Pequena</SelectItem>
                <SelectItem value="md">Média</SelectItem>
                <SelectItem value="lg">Grande</SelectItem>
                <SelectItem value="xl">Extra Grande</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </StyleSection>

      {/* Responsive Visibility */}
      <StyleSection title="Visibilidade Responsiva" icon={<Eye className="h-4 w-4" />}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Ocultar no Mobile</Label>
            <Switch
              checked={style.hideOnMobile || false}
              onCheckedChange={(v) => updateStyle({ hideOnMobile: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Ocultar no Tablet</Label>
            <Switch
              checked={style.hideOnTablet || false}
              onCheckedChange={(v) => updateStyle({ hideOnTablet: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Ocultar no Desktop</Label>
            <Switch
              checked={style.hideOnDesktop || false}
              onCheckedChange={(v) => updateStyle({ hideOnDesktop: v })}
            />
          </div>
        </div>
      </StyleSection>
    </div>
  );
}

function StyleSection({ 
  title, 
  icon, 
  children 
}: { 
  title: string; 
  icon?: React.ReactNode; 
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium border-b border-border pb-2">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

interface SpacingControlProps {
  values: { top: number; right: number; bottom: number; left: number };
  linked: boolean;
  unit: string;
  onValuesChange: (values: { top: number; right: number; bottom: number; left: number }) => void;
  onLinkedChange: (linked: boolean) => void;
  onUnitChange: (unit: string) => void;
}

function SpacingControl({
  values,
  linked,
  unit,
  onValuesChange,
  onLinkedChange,
  onUnitChange,
}: SpacingControlProps) {
  const handleChange = (side: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    if (linked) {
      onValuesChange({ top: value, right: value, bottom: value, left: value });
    } else {
      onValuesChange({ ...values, [side]: value });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onLinkedChange(!linked)}
          className={cn(
            "p-1 rounded transition-colors",
            linked ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
          )}
          title={linked ? "Valores vinculados" : "Valores independentes"}
        >
          {linked ? <Link2 className="h-4 w-4" /> : <Link2Off className="h-4 w-4" />}
        </button>
        <Select value={unit} onValueChange={onUnitChange}>
          <SelectTrigger className="w-16 h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="px">px</SelectItem>
            <SelectItem value="%">%</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-4 gap-1">
        <div className="text-center">
          <Label className="text-[10px] text-muted-foreground">Topo</Label>
          <Input
            type="number"
            min={0}
            value={values.top}
            onChange={(e) => handleChange('top', Number(e.target.value))}
            className="h-7 text-xs text-center px-1"
          />
        </div>
        <div className="text-center">
          <Label className="text-[10px] text-muted-foreground">Dir</Label>
          <Input
            type="number"
            min={0}
            value={values.right}
            onChange={(e) => handleChange('right', Number(e.target.value))}
            className="h-7 text-xs text-center px-1"
          />
        </div>
        <div className="text-center">
          <Label className="text-[10px] text-muted-foreground">Base</Label>
          <Input
            type="number"
            min={0}
            value={values.bottom}
            onChange={(e) => handleChange('bottom', Number(e.target.value))}
            className="h-7 text-xs text-center px-1"
          />
        </div>
        <div className="text-center">
          <Label className="text-[10px] text-muted-foreground">Esq</Label>
          <Input
            type="number"
            min={0}
            value={values.left}
            onChange={(e) => handleChange('left', Number(e.target.value))}
            className="h-7 text-xs text-center px-1"
          />
        </div>
      </div>
    </div>
  );
}
