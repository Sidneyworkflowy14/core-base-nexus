import { Section, Widget, WidgetType } from '@/types/elementor';
import { ElementorSectionRenderer } from './ElementorSectionRenderer';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface SelectedElement {
  type: 'section' | 'column' | 'widget';
  sectionId: string;
  columnId?: string;
  widgetId?: string;
  containerWidgetId?: string;
  innerColumnId?: string;
}

interface ElementorCanvasProps {
  sections: Section[];
  selectedElement: SelectedElement | null;
  previewData?: unknown;
  onSelectElement: (element: SelectedElement | null) => void;
  onAddWidget: (widgetType: WidgetType, sectionId: string, columnId: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onDeleteWidget: (sectionId: string, columnId: string, widgetId: string) => void;
  onMoveSection: (sectionId: string, direction: 'up' | 'down') => void;
  onMoveWidget: (sectionId: string, columnId: string, widgetId: string, direction: 'up' | 'down') => void;
  onDuplicateWidget: (sectionId: string, columnId: string, widgetId: string) => void;
  onMoveWidgetTo: (
    fromSectionId: string,
    fromColumnId: string,
    widgetId: string,
    toSectionId: string,
    toColumnId: string
  ) => void;
  onUpdateWidgetSettings: (sectionId: string, columnId: string, widgetId: string, settings: Partial<Widget['settings']>) => void;
  onAddSubWidget: (sectionId: string, columnId: string, containerWidgetId: string, innerColumnId: string, widgetType: WidgetType) => void;
  onDeleteSubWidget: (sectionId: string, columnId: string, containerWidgetId: string, innerColumnId: string, widgetId: string) => void;
  onMoveSubWidget: (sectionId: string, columnId: string, containerWidgetId: string, innerColumnId: string, widgetId: string, direction: 'up' | 'down') => void;
  onDuplicateSubWidget: (sectionId: string, columnId: string, containerWidgetId: string, innerColumnId: string, widgetId: string) => void;
  onMoveSubWidgetTo: (
    sectionId: string,
    columnId: string,
    containerWidgetId: string,
    fromInnerColumnId: string,
    widgetId: string,
    toInnerColumnId: string
  ) => void;
  onMoveWidgetToSubsection: (
    fromSectionId: string,
    fromColumnId: string,
    widgetId: string,
    toSectionId: string,
    toColumnId: string,
    containerWidgetId: string,
    innerColumnId: string
  ) => void;
}

export function ElementorCanvas({
  sections,
  selectedElement,
  previewData,
  onSelectElement,
  onAddWidget,
  onDeleteSection,
  onDeleteWidget,
  onMoveSection,
  onMoveWidget,
  onDuplicateWidget,
  onMoveWidgetTo,
  onUpdateWidgetSettings,
  onAddSubWidget,
  onDeleteSubWidget,
  onMoveSubWidget,
  onDuplicateSubWidget,
  onMoveSubWidgetTo,
  onMoveWidgetToSubsection,
}: ElementorCanvasProps) {
  const handleDrop = (e: React.DragEvent, sectionId: string, columnId: string) => {
    e.preventDefault();
    const widgetMove = e.dataTransfer.getData('widgetMove');
    if (widgetMove) {
      try {
        const payload = JSON.parse(widgetMove) as {
          sectionId: string;
          columnId: string;
          widgetId: string;
        };
        if (payload?.sectionId && payload?.columnId && payload?.widgetId) {
          onMoveWidgetTo(payload.sectionId, payload.columnId, payload.widgetId, sectionId, columnId);
          return;
        }
      } catch {
        // ignore invalid payload
      }
    }

    const widgetType = e.dataTransfer.getData('widgetType') as WidgetType;
    if (widgetType) {
      onAddWidget(widgetType, sectionId, columnId);
    }
  };

  if (sections.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Plus className="h-8 w-8" />
          </div>
          <p className="font-medium">Página vazia</p>
          <p className="text-sm mt-1">
            Clique em "Adicionar Seção" para começar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        {sections.map((section, sectionIndex) => (
          <ElementorSectionRenderer
            key={section.id}
            section={section}
            sectionIndex={sectionIndex}
            totalSections={sections.length}
            selectedElement={selectedElement}
            previewData={previewData}
            onSelectElement={onSelectElement}
            onDeleteSection={onDeleteSection}
            onDeleteWidget={onDeleteWidget}
            onMoveSection={onMoveSection}
            onMoveWidget={onMoveWidget}
            onDuplicateWidget={onDuplicateWidget}
            onDrop={handleDrop}
            onUpdateWidgetSettings={onUpdateWidgetSettings}
            onAddSubWidget={onAddSubWidget}
            onDeleteSubWidget={onDeleteSubWidget}
            onMoveSubWidget={onMoveSubWidget}
            onDuplicateSubWidget={onDuplicateSubWidget}
            onMoveSubWidgetTo={onMoveSubWidgetTo}
            onMoveWidgetToSubsection={onMoveWidgetToSubsection}
          />
        ))}
      </div>
    </div>
  );
}
