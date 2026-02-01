import { Section, Widget, WidgetType } from '@/types/elementor';
import { ElementorWidgetRenderer } from './ElementorWidgetRenderer';
import { cn } from '@/lib/utils';
import { NexusButton } from '@/components/nexus';
import { 
  Trash, 
  ArrowUp, 
  ArrowDown, 
  GripVertical, 
  Settings,
  Plus,
  Copy,
} from 'lucide-react';

interface SelectedElement {
  type: 'section' | 'column' | 'widget';
  sectionId: string;
  columnId?: string;
  widgetId?: string;
}

interface ElementorSectionRendererProps {
  section: Section;
  sectionIndex: number;
  totalSections: number;
  selectedElement: SelectedElement | null;
  previewData?: unknown;
  onSelectElement: (element: SelectedElement | null) => void;
  onDeleteSection: (sectionId: string) => void;
  onDeleteWidget: (sectionId: string, columnId: string, widgetId: string) => void;
  onMoveSection: (sectionId: string, direction: 'up' | 'down') => void;
  onMoveWidget: (sectionId: string, columnId: string, widgetId: string, direction: 'up' | 'down') => void;
  onDuplicateWidget: (sectionId: string, columnId: string, widgetId: string) => void;
  onDrop: (e: React.DragEvent, sectionId: string, columnId: string) => void;
}

export function ElementorSectionRenderer({
  section,
  sectionIndex,
  totalSections,
  selectedElement,
  previewData,
  onSelectElement,
  onDeleteSection,
  onDeleteWidget,
  onMoveSection,
  onMoveWidget,
  onDuplicateWidget,
  onDrop,
}: ElementorSectionRendererProps) {
  const isSectionSelected = selectedElement?.type === 'section' && selectedElement?.sectionId === section.id;
  
  const gapClass = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  }[section.settings.gap];

  const paddingClass = {
    none: 'p-0',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
  }[section.settings.padding];

  return (
    <div
      className={cn(
        "relative group border-2 rounded-lg transition-all",
        isSectionSelected 
          ? "border-primary bg-primary/5" 
          : "border-dashed border-border hover:border-primary/50"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelectElement({ type: 'section', sectionId: section.id });
      }}
    >
      {/* Section toolbar */}
      <div className={cn(
        "absolute -top-3 left-4 flex items-center gap-1 bg-card border border-border rounded-md px-1 py-0.5 z-10",
        "opacity-0 group-hover:opacity-100 transition-opacity",
        isSectionSelected && "opacity-100"
      )}>
        <GripVertical className="h-3 w-3 text-muted-foreground cursor-grab" />
        <span className="text-xs font-medium text-muted-foreground px-1">Seção</span>
        <NexusButton
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={(e) => { e.stopPropagation(); onMoveSection(section.id, 'up'); }}
          disabled={sectionIndex === 0}
        >
          <ArrowUp className="h-3 w-3" />
        </NexusButton>
        <NexusButton
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={(e) => { e.stopPropagation(); onMoveSection(section.id, 'down'); }}
          disabled={sectionIndex === totalSections - 1}
        >
          <ArrowDown className="h-3 w-3" />
        </NexusButton>
        <NexusButton
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-destructive"
          onClick={(e) => { e.stopPropagation(); onDeleteSection(section.id); }}
        >
          <Trash className="h-3 w-3" />
        </NexusButton>
      </div>

      {/* Columns */}
      <div className={cn("flex", gapClass, paddingClass)}>
        {section.children.map((column) => {
          const isColumnSelected = selectedElement?.type === 'column' && 
            selectedElement?.sectionId === section.id && 
            selectedElement?.columnId === column.id;

          const columnPaddingClass = {
            none: 'p-0',
            sm: 'p-2',
            md: 'p-4',
            lg: 'p-6',
          }[column.settings.padding];

          const alignClass = {
            start: 'justify-start',
            center: 'justify-center',
            end: 'justify-end',
          }[column.settings.verticalAlign];

          return (
            <div
              key={column.id}
              className={cn(
                "relative min-h-[80px] border rounded-md transition-all flex flex-col",
                alignClass,
                columnPaddingClass,
                isColumnSelected
                  ? "border-primary bg-primary/5"
                  : "border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/20"
              )}
              style={{ flex: column.settings.width }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectElement({ type: 'column', sectionId: section.id, columnId: column.id });
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, section.id, column.id)}
            >
              {/* Column indicator */}
              {column.children.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/50">
                  <div className="text-center">
                    <Plus className="h-6 w-6 mx-auto mb-1" />
                    <span className="text-xs">Arraste um widget</span>
                  </div>
                </div>
              )}

              {/* Widgets */}
              <div className="space-y-2 w-full relative z-10">
                {column.children.map((widget, widgetIndex) => {
                  const isWidgetSelected = selectedElement?.type === 'widget' &&
                    selectedElement?.sectionId === section.id &&
                    selectedElement?.columnId === column.id &&
                    selectedElement?.widgetId === widget.id;

                  return (
                    <div
                      key={widget.id}
                      className={cn(
                        "relative group/widget rounded-md transition-all",
                        isWidgetSelected
                          ? "ring-2 ring-primary ring-offset-2"
                          : "hover:ring-1 hover:ring-primary/50"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectElement({
                          type: 'widget',
                          sectionId: section.id,
                          columnId: column.id,
                          widgetId: widget.id,
                        });
                      }}
                    >
                      {/* Widget toolbar */}
                      <div className={cn(
                        "absolute -top-2 right-1 flex items-center gap-0.5 bg-card border border-border rounded-md px-0.5 py-0.5 z-20",
                        "opacity-0 group-hover/widget:opacity-100 transition-opacity",
                        isWidgetSelected && "opacity-100"
                      )}>
                        <NexusButton
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={(e) => { e.stopPropagation(); onMoveWidget(section.id, column.id, widget.id, 'up'); }}
                          disabled={widgetIndex === 0}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </NexusButton>
                        <NexusButton
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={(e) => { e.stopPropagation(); onMoveWidget(section.id, column.id, widget.id, 'down'); }}
                          disabled={widgetIndex === column.children.length - 1}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </NexusButton>
                        <NexusButton
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={(e) => { e.stopPropagation(); onDuplicateWidget(section.id, column.id, widget.id); }}
                        >
                          <Copy className="h-3 w-3" />
                        </NexusButton>
                        <NexusButton
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-destructive"
                          onClick={(e) => { e.stopPropagation(); onDeleteWidget(section.id, column.id, widget.id); }}
                        >
                          <Trash className="h-3 w-3" />
                        </NexusButton>
                      </div>

                      <ElementorWidgetRenderer widget={widget} previewData={previewData} />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
