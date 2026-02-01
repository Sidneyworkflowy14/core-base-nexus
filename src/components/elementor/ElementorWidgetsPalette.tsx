import { useState } from 'react';
import { WIDGET_CATEGORIES, COLUMN_PRESETS, WidgetType, ColumnWidth } from '@/types/elementor';
import { DynamicIcon } from '@/components/DynamicIcon';
import { NexusButton } from '@/components/nexus';
import { Plus, Layers, LayoutGrid, Columns } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ElementorWidgetsPaletteProps {
  onAddSection: (columnWidths: ColumnWidth[]) => void;
  onWidgetDrag?: (widgetType: WidgetType) => void;
}

export function ElementorWidgetsPalette({ onAddSection, onWidgetDrag }: ElementorWidgetsPaletteProps) {
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);

  return (
    <div className="w-72 border-r border-border bg-card flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          Elementos
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Clique para adicionar ao canvas
        </p>
      </div>

      {/* Add Section Button */}
      <div className="p-3 border-b border-border">
        <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
          <DialogTrigger asChild>
            <NexusButton className="w-full" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Seção
            </NexusButton>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5" />
                Escolha a Estrutura
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 py-4">
              {COLUMN_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  className={cn(
                    "p-4 rounded-lg border-2 border-border hover:border-primary transition-colors",
                    "flex flex-col items-center gap-2"
                  )}
                  onClick={() => {
                    onAddSection(preset.columns as ColumnWidth[]);
                    setSectionDialogOpen(false);
                  }}
                >
                  <div className="flex gap-1 w-full h-8">
                    {preset.columns.map((width, idx) => (
                      <div
                        key={idx}
                        className="bg-primary/20 rounded h-full"
                        style={{ flex: width }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">{preset.label}</span>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Widgets List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-4">
        {WIDGET_CATEGORIES.map((category) => (
          <div key={category.name}>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              {category.name}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {category.widgets.map((widget) => (
                <button
                  key={widget.type}
                  className={cn(
                    "p-3 rounded-lg border border-border bg-background",
                    "hover:border-primary hover:bg-primary/5 transition-all",
                    "flex flex-col items-center gap-1.5 cursor-grab"
                  )}
                  onClick={() => onWidgetDrag?.(widget.type)}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('widgetType', widget.type);
                  }}
                >
                  <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                    <DynamicIcon name={widget.icon} className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-[10px] text-center leading-tight">{widget.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
