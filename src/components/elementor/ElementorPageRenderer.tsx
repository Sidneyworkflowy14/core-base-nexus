import { Section } from '@/types/elementor';
import { ElementorWidgetRenderer } from './ElementorWidgetRenderer';
import { PageProvider } from '@/contexts/PageContext';
import { ViewDataProvider } from '@/contexts/ViewDataContext';
import { cn } from '@/lib/utils';

interface ElementorPageRendererProps {
  sections: Section[];
  previewData?: unknown;
  pageId?: string;
  pageSlug?: string;
  pageTitle?: string;
}

export function ElementorPageRenderer({ 
  sections, 
  previewData,
  pageId,
  pageSlug,
  pageTitle,
}: ElementorPageRendererProps) {
  if (!sections || sections.length === 0) {
    return null;
  }

  return (
    <PageProvider pageId={pageId} pageSlug={pageSlug} pageTitle={pageTitle}>
      <ViewDataProvider>
        <div className="space-y-6">
        {sections.map((section) => {
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
            <div key={section.id} className={cn("w-full", paddingClass)}>
              <div className={cn("flex flex-wrap", gapClass)}>
                {section.children.map((column) => {
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
                  const fullHeightClass = column.settings.fullHeight ? 'min-h-screen' : '';

                  return (
                    <div
                      key={column.id}
                      className={cn("flex flex-col", alignClass, columnPaddingClass, fullHeightClass)}
                      style={{ flex: column.settings.width, minWidth: 0 }}
                    >
                      {column.children.map((widget) => (
                        <ElementorWidgetRenderer
                          key={widget.id}
                          widget={widget}
                          previewData={previewData}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        </div>
      </ViewDataProvider>
    </PageProvider>
  );
}
