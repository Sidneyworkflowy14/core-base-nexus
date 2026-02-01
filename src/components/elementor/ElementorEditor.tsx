import { useState, useCallback } from 'react';
import { Section, Widget, WidgetType, createSection, createWidget, COLUMN_PRESETS, ColumnWidth } from '@/types/elementor';
import { ElementorToolbar } from './ElementorToolbar';
import { ElementorCanvas } from './ElementorCanvas';
import { ElementorWidgetsPalette } from './ElementorWidgetsPalette';
import { ElementorPropertiesPanel } from './ElementorPropertiesPanel';
import { PageProvider } from '@/contexts/PageContext';
import { cn } from '@/lib/utils';

interface ElementorEditorProps {
  initialSections?: Section[];
  pageId?: string;
  pageSlug?: string;
  pageTitle: string;
  pageStatus: 'draft' | 'published';
  dataSourceFields?: string[];
  previewData?: unknown;
  onSave: (sections: Section[]) => Promise<void>;
  onPublish: (sections: Section[]) => Promise<void>;
  onBack: () => void;
  onTestData?: () => void;
  hasDataSource?: boolean;
}

export function ElementorEditor({
  initialSections = [],
  pageId,
  pageSlug,
  pageTitle,
  pageStatus,
  dataSourceFields = [],
  previewData,
  onSave,
  onPublish,
  onBack,
  onTestData,
  hasDataSource,
}: ElementorEditorProps) {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [selectedElement, setSelectedElement] = useState<{
    type: 'section' | 'column' | 'widget';
    sectionId: string;
    columnId?: string;
    widgetId?: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<'widgets' | 'properties'>('widgets');

  // Add section
  const handleAddSection = useCallback((columnWidths: ColumnWidth[]) => {
    const newSection = createSection(columnWidths);
    setSections([...sections, newSection]);
    setSelectedElement({ type: 'section', sectionId: newSection.id });
  }, [sections]);

  // Add widget to column
  const handleAddWidget = useCallback((widgetType: WidgetType, sectionId: string, columnId: string) => {
    const newWidget = createWidget(widgetType);
    setSections(sections.map(section => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        children: section.children.map(column => {
          if (column.id !== columnId) return column;
          return {
            ...column,
            children: [...column.children, newWidget],
          };
        }),
      };
    }));
    setSelectedElement({
      type: 'widget',
      sectionId,
      columnId,
      widgetId: newWidget.id,
    });
    setRightPanelTab('properties');
  }, [sections]);

  // Update section
  const handleUpdateSection = useCallback((sectionId: string, settings: Partial<Section['settings']>) => {
    setSections(sections.map(section => {
      if (section.id !== sectionId) return section;
      return { ...section, settings: { ...section.settings, ...settings } };
    }));
  }, [sections]);

  // Update column
  const handleUpdateColumn = useCallback((sectionId: string, columnId: string, settings: Partial<import('@/types/elementor').ColumnSettings>) => {
    setSections(sections.map(section => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        children: section.children.map(column => {
          if (column.id !== columnId) return column;
          return { ...column, settings: { ...column.settings, ...settings } };
        }),
      };
    }));
  }, [sections]);

  // Update widget
  const handleUpdateWidget = useCallback((sectionId: string, columnId: string, widgetId: string, settings: Partial<Widget['settings']>) => {
    setSections(sections.map(section => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        children: section.children.map(column => {
          if (column.id !== columnId) return column;
          return {
            ...column,
            children: column.children.map(widget => {
              if (widget.id !== widgetId) return widget;
              return { ...widget, settings: { ...widget.settings, ...settings } };
            }),
          };
        }),
      };
    }));
  }, [sections]);

  // Delete section
  const handleDeleteSection = useCallback((sectionId: string) => {
    setSections(sections.filter(s => s.id !== sectionId));
    if (selectedElement?.sectionId === sectionId) {
      setSelectedElement(null);
    }
  }, [sections, selectedElement]);

  // Delete widget
  const handleDeleteWidget = useCallback((sectionId: string, columnId: string, widgetId: string) => {
    setSections(sections.map(section => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        children: section.children.map(column => {
          if (column.id !== columnId) return column;
          return {
            ...column,
            children: column.children.filter(w => w.id !== widgetId),
          };
        }),
      };
    }));
    if (selectedElement?.widgetId === widgetId) {
      setSelectedElement(null);
    }
  }, [sections, selectedElement]);

  // Move section
  const handleMoveSection = useCallback((sectionId: string, direction: 'up' | 'down') => {
    const index = sections.findIndex(s => s.id === sectionId);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;
    
    const newSections = [...sections];
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    setSections(newSections);
  }, [sections]);

  // Move widget
  const handleMoveWidget = useCallback((sectionId: string, columnId: string, widgetId: string, direction: 'up' | 'down') => {
    setSections(sections.map(section => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        children: section.children.map(column => {
          if (column.id !== columnId) return column;
          
          const widgets = [...column.children];
          const index = widgets.findIndex(w => w.id === widgetId);
          if (index === -1) return column;
          
          const newIndex = direction === 'up' ? index - 1 : index + 1;
          if (newIndex < 0 || newIndex >= widgets.length) return column;
          
          [widgets[index], widgets[newIndex]] = [widgets[newIndex], widgets[index]];
          return { ...column, children: widgets };
        }),
      };
    }));
  }, [sections]);

  // Duplicate widget
  const handleDuplicateWidget = useCallback((sectionId: string, columnId: string, widgetId: string) => {
    setSections(sections.map(section => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        children: section.children.map(column => {
          if (column.id !== columnId) return column;
          
          const widgetIndex = column.children.findIndex(w => w.id === widgetId);
          if (widgetIndex === -1) return column;
          
          const originalWidget = column.children[widgetIndex];
          const duplicatedWidget: Widget = {
            ...originalWidget,
            id: crypto.randomUUID(),
            settings: { ...originalWidget.settings },
          };
          
          const newChildren = [...column.children];
          newChildren.splice(widgetIndex + 1, 0, duplicatedWidget);
          
          return { ...column, children: newChildren };
        }),
      };
    }));
  }, [sections]);

  // Save
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(sections);
    } finally {
      setSaving(false);
    }
  };

  // Publish
  const handlePublish = async () => {
    setPublishing(true);
    try {
      await onPublish(sections);
    } finally {
      setPublishing(false);
    }
  };

  // Get selected element data
  const getSelectedData = () => {
    if (!selectedElement) return null;
    
    const section = sections.find(s => s.id === selectedElement.sectionId);
    if (!section) return null;
    
    if (selectedElement.type === 'section') {
      return { type: 'section' as const, data: section };
    }
    
    const column = section.children.find(c => c.id === selectedElement.columnId);
    if (!column) return null;
    
    if (selectedElement.type === 'column') {
      return { type: 'column' as const, data: column, section };
    }
    
    const widget = column.children.find(w => w.id === selectedElement.widgetId);
    if (!widget) return null;
    
    return { type: 'widget' as const, data: widget, section, column };
  };

  return (
    <PageProvider pageId={pageId} pageSlug={pageSlug} pageTitle={pageTitle}>
      <div className="h-screen flex flex-col bg-background">
        {/* Toolbar */}
        <ElementorToolbar
          pageTitle={pageTitle}
          pageStatus={pageStatus}
          saving={saving}
          publishing={publishing}
          hasDataSource={hasDataSource}
          onBack={onBack}
          onSave={handleSave}
          onPublish={handlePublish}
          onTestData={onTestData}
        />

        {/* Main area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Widget Palette */}
          <ElementorWidgetsPalette
            onAddSection={handleAddSection}
            onWidgetDrag={(widgetType) => {
              // For now, if there's a selected column, add widget there
              if (selectedElement?.columnId && selectedElement?.sectionId) {
                handleAddWidget(widgetType, selectedElement.sectionId, selectedElement.columnId);
              }
            }}
          />

          {/* Center - Canvas */}
          <div className="flex-1 overflow-hidden bg-muted/30">
            <ElementorCanvas
              sections={sections}
              selectedElement={selectedElement}
              previewData={previewData}
              onSelectElement={setSelectedElement}
              onAddWidget={handleAddWidget}
              onDeleteSection={handleDeleteSection}
              onDeleteWidget={handleDeleteWidget}
              onMoveSection={handleMoveSection}
              onMoveWidget={handleMoveWidget}
              onDuplicateWidget={handleDuplicateWidget}
            />
          </div>

          {/* Right Panel - Properties */}
          <ElementorPropertiesPanel
            selectedData={getSelectedData()}
            selectedElement={selectedElement}
            dataSourceFields={dataSourceFields}
            onUpdateSection={(settings) => {
              if (selectedElement?.sectionId) {
                handleUpdateSection(selectedElement.sectionId, settings);
              }
            }}
            onUpdateColumn={(settings) => {
              if (selectedElement?.sectionId && selectedElement?.columnId) {
                handleUpdateColumn(selectedElement.sectionId, selectedElement.columnId, settings);
              }
            }}
            onUpdateWidget={(settings) => {
              if (selectedElement?.sectionId && selectedElement?.columnId && selectedElement?.widgetId) {
                handleUpdateWidget(selectedElement.sectionId, selectedElement.columnId, selectedElement.widgetId, settings);
              }
            }}
          />
        </div>
      </div>
    </PageProvider>
  );
}
