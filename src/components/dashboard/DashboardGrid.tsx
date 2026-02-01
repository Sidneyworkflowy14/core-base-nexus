import { useState } from 'react';
import { Widget, WidgetConfig, WidgetType } from '@/types/dashboard';
import { WidgetRenderer } from './WidgetRenderer';
import { WidgetEditor } from './WidgetEditor';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

interface DashboardGridProps {
  widgets: Widget[];
  isEditing: boolean;
  onAddWidget: (title: string, type: WidgetType, config: WidgetConfig, pageId?: string, dataSourceId?: string) => void;
  onUpdateWidget: (widgetId: string, updates: Partial<Pick<Widget, 'title' | 'config_json' | 'page_id' | 'data_source_id'>>) => void;
  onDeleteWidget: (widgetId: string) => void;
  onReorderWidgets: (widgetIds: string[]) => void;
  columns?: number;
}

export function DashboardGrid({
  widgets,
  isEditing,
  onAddWidget,
  onUpdateWidget,
  onDeleteWidget,
  onReorderWidgets,
  columns = 2,
}: DashboardGridProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);

  const handleAddClick = () => {
    setEditingWidget(null);
    setEditorOpen(true);
  };

  const handleEditClick = (widget: Widget) => {
    setEditingWidget(widget);
    setEditorOpen(true);
  };

  const handleSave = (title: string, type: WidgetType, config: WidgetConfig, pageId?: string, dataSourceId?: string) => {
    if (editingWidget) {
      onUpdateWidget(editingWidget.id, {
        title,
        config_json: config,
        page_id: pageId || null,
        data_source_id: dataSourceId || null,
      });
    } else {
      onAddWidget(title, type, config, pageId, dataSourceId);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...widgets];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    onReorderWidgets(newOrder.map(w => w.id));
  };

  const handleMoveDown = (index: number) => {
    if (index === widgets.length - 1) return;
    const newOrder = [...widgets];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    onReorderWidgets(newOrder.map(w => w.id));
  };

  return (
    <div className="space-y-4">
      {isEditing && (
        <div className="flex justify-end">
          <Button onClick={handleAddClick}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Widget
          </Button>
        </div>
      )}

      {widgets.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {isEditing ? (
            <>
              <p className="mb-4">Nenhum widget configurado</p>
              <Button onClick={handleAddClick}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Widget
              </Button>
            </>
          ) : (
            <p>Dashboard vazio</p>
          )}
        </div>
      ) : (
        <div 
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {widgets.map((widget, index) => (
            <div key={widget.id} className="relative group">
              <WidgetRenderer widget={widget} />
              
              {isEditing && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === widgets.length - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleEditClick(widget)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onDeleteWidget(widget.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <WidgetEditor
        widget={editingWidget}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
