import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Widget } from '@/types/elementor';
import { useDataUrlFetch, DataUrlContext } from '@/hooks/useDataUrlFetch';
import { usePageContext } from '@/contexts/PageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useViewData } from '@/contexts/ViewDataContext';
import { usePages } from '@/hooks/usePages';
import { useOrgPath } from '@/hooks/useOrgPath';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { DynamicIcon } from '@/components/DynamicIcon';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { getWidgetStyles, getWidgetClasses } from '@/lib/widgetStyles';

interface ElementorWidgetRendererProps {
  widget: Widget;
  previewData?: unknown;
  interactive?: boolean;
}

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d'];

export function ElementorWidgetRenderer({ widget, previewData, interactive = true }: ElementorWidgetRendererProps) {
  const { widgetType, settings } = widget;
  const normalizedWidgetType =
    typeof widgetType === 'string' ? widgetType.trim() : widgetType;
  const pageContext = usePageContext();
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  const { theme, tokens } = useTheme();
  const { filterResults, setFilterResults, setFilters, filters } = useViewData();
  const { pages } = usePages();
  const { withOrg } = useOrgPath();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  
  // Build context for data URL fetch
  const dataUrlContext: DataUrlContext = {
    widgetId: widget.id,
    widgetType: widget.widgetType,
    widgetTitle: settings.title || settings.text || settings.label,
    pageId: pageContext.pageId,
    pageSlug: pageContext.pageSlug,
    pageTitle: pageContext.pageTitle,
    fieldName: settings.selectedValueField || settings.selectedLabelField,
  };
  
  // Fetch data from URL if configured (now sends POST with context)
  const { data: urlData, loading: urlLoading, error: urlError } = useDataUrlFetch(
    settings.dataUrl,
    settings.dataUrl ? dataUrlContext : undefined,
    settings.refreshInterval
  );

  // Get custom styles
  const customStyles = getWidgetStyles(settings.widgetStyle);
  const customClasses = getWidgetClasses(settings.widgetStyle);

  const [textValue, setTextValue] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const [booleanValue, setBooleanValue] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<unknown>(null);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [filtersError, setFiltersError] = useState<string | null>(null);
  const allowHtmlAutoHeight =
    widgetType === 'html' && (settings.widgetStyle?.height ?? 'auto') === 'auto';

  const extractBooleanResult = (result: unknown): boolean | null => {
    if (typeof result === 'boolean') return result;
    if (typeof result === 'string') {
      if (result.toLowerCase() === 'true') return true;
      if (result.toLowerCase() === 'false') return false;
      return null;
    }
    if (typeof result === 'object' && result !== null) {
      const obj = result as Record<string, unknown>;
      const candidates = ['result', 'valid', 'success', 'ok', 'value'];
      for (const key of candidates) {
        const value = obj[key];
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
          if (value.toLowerCase() === 'true') return true;
          if (value.toLowerCase() === 'false') return false;
        }
      }
    }
    return null;
  };

  useEffect(() => {
    setTextValue('');
    setSelectValue('');
    setBooleanValue(false);
    setActionLoading(false);
    setActionError(null);
    setActionResult(null);
  }, [widget.id]);

  const actionButtonLabel = settings.buttonLabel || 'Enviar';
  const selectOptions = useMemo(() => settings.options || [], [settings.options]);
  const booleanResult = useMemo(() => extractBooleanResult(actionResult), [actionResult]);
  const resultText = useMemo(() => {
    if (actionResult === null || actionResult === undefined) return null;
    if (typeof actionResult === 'string') return actionResult;
    if (typeof actionResult === 'number' || typeof actionResult === 'boolean') return String(actionResult);
    try {
      const text = JSON.stringify(actionResult);
      return text.length > 160 ? `${text.slice(0, 160)}...` : text;
    } catch {
      return 'Resultado recebido';
    }
  }, [actionResult]);

  const uiKitHead = useMemo(() => {
    if (typeof document === 'undefined') return '';

    const links = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))
      .map(link => link.href)
      .filter(Boolean)
      .map(href => `<link rel="stylesheet" href="${href}">`)
      .join('\n');

    const styles = Array.from(document.querySelectorAll<HTMLStyleElement>('style'))
      .map(style => style.textContent?.trim())
      .filter((text): text is string => Boolean(text))
      .map(text => `<style>${text}</style>`)
      .join('\n');

    return `${links}\n${styles}`.trim();
  }, []);

  const buildHtmlDocument = (rawHtml: string, headExtra: string, scriptContent?: string) => {
    const hasHtml = /<html[\s>]/i.test(rawHtml);
    const hasHead = /<head[\s>]/i.test(rawHtml);
    const hasHeadClose = /<\/head>/i.test(rawHtml);
    const hasBodyClose = /<\/body>/i.test(rawHtml);
    const scriptTag = scriptContent?.trim()
      ? `<script>
${scriptContent}
</script>`
      : '';

    if (hasHtml) {
      let output = rawHtml;
      if (headExtra) {
        if (hasHeadClose) {
          output = output.replace(/<\/head>/i, `${headExtra}\n</head>`);
        } else if (hasHead) {
          output = output.replace(/<head[^>]*>/i, (match) => `${match}\n${headExtra}`);
        } else {
          output = output.replace(/<html[^>]*>/i, (match) => `${match}\n<head>\n${headExtra}\n</head>`);
        }
      }
      if (scriptTag) {
        if (hasBodyClose) {
          output = output.replace(/<\/body>/i, `${scriptTag}\n</body>`);
        } else {
          output = `${output}\n${scriptTag}`;
        }
      }
      return output;
    }

    return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${headExtra}
    <style>
      body { margin: 0; padding: 16px; }
    </style>
  </head>
  <body>
    ${rawHtml}
    ${scriptTag}
  </body>
</html>`;
  };

  const themeBridgeScript = `
  (function () {
    function applyTheme(payload) {
      if (!payload || payload.type !== 'nexus-theme') return;
      var root = document.documentElement;
      if (payload.theme === 'dark' || payload.theme === 'light') {
        root.classList.remove('light', 'dark');
        root.classList.add(payload.theme);
      }
      if (payload.vars && typeof payload.vars === 'object') {
        Object.keys(payload.vars).forEach(function (key) {
          root.style.setProperty(key, payload.vars[key]);
        });
      }
      if (payload.fontFamily) {
        document.body.style.fontFamily = payload.fontFamily;
      }
    }
    window.addEventListener('message', function (event) {
      applyTheme(event.data);
    });
  })();
  `.trim();

  const themePayload = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const vars = [
      '--background',
      '--foreground',
      '--card',
      '--card-foreground',
      '--popover',
      '--popover-foreground',
      '--primary',
      '--primary-foreground',
      '--secondary',
      '--secondary-foreground',
      '--muted',
      '--muted-foreground',
      '--accent',
      '--accent-foreground',
      '--destructive',
      '--destructive-foreground',
      '--success',
      '--success-foreground',
      '--warning',
      '--warning-foreground',
      '--border',
      '--input',
      '--ring',
      '--sidebar-background',
      '--sidebar-foreground',
      '--sidebar-primary',
      '--sidebar-primary-foreground',
      '--sidebar-accent',
      '--sidebar-accent-foreground',
      '--sidebar-border',
      '--sidebar-ring',
      '--radius',
      '--radius-lg',
      '--radius-sm',
      '--shadow',
      '--shadow-lg',
      '--shadow-sm',
    ];
    const computed = getComputedStyle(document.documentElement);
    const payloadVars: Record<string, string> = {};
    vars.forEach((key) => {
      const value = computed.getPropertyValue(key).trim();
      if (value) payloadVars[key] = value;
    });
    return {
      type: 'nexus-theme',
      theme,
      vars: payloadVars,
      fontFamily: getComputedStyle(document.body).fontFamily,
    };
  }, [theme, tokens]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !themePayload) return;

    const sendTheme = () => {
      iframe.contentWindow?.postMessage(themePayload, '*');
    };

    sendTheme();
    iframe.addEventListener('load', sendTheme);
    return () => iframe.removeEventListener('load', sendTheme);
  }, [themePayload]);

  useEffect(() => {
    if (!allowHtmlAutoHeight) return;

    const handler = (event: MessageEvent) => {
      const payload = event.data as { type?: string; widgetId?: string; height?: number };
      if (!payload || payload.type !== 'nexus-iframe-height') return;
      if (payload.widgetId !== widget.id) return;
      const height = Number(payload.height);
      if (!height || !iframeRef.current) return;
      iframeRef.current.style.height = `${height}px`;
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [allowHtmlAutoHeight, widget.id]);

  const iframeSrcDoc = useMemo(() => {
    const rawHtml = settings.iframeHtml?.trim();
    if (!rawHtml) return '';
    const headExtra = settings.iframeUseUiKit ? uiKitHead : '';
    return buildHtmlDocument(rawHtml, headExtra, themeBridgeScript);
  }, [uiKitHead, settings.iframeHtml, settings.iframeUseUiKit]);

  const buildRequestBody = (value: unknown) => ({
    user: user
      ? {
          id: user.id,
          email: user.email,
          name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')[0],
        }
      : null,
    tenant: currentTenant
      ? {
          id: currentTenant.id,
          name: currentTenant.name,
        }
      : null,
    widget: {
      id: widget.id,
      type: widget.widgetType,
      title: settings.title || settings.text || settings.label || settings.inputLabel,
    },
    page: {
      id: pageContext.pageId,
      slug: pageContext.pageSlug,
      title: pageContext.pageTitle,
    },
    input: {
      value,
      type: widgetType,
    },
    meta: {
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: navigator.language,
    },
  });

  const encodeContext = (context: unknown) => {
    const json = JSON.stringify(context);
    return btoa(unescape(encodeURIComponent(json)));
  };

  const handleAction = async (value: unknown) => {
    if (!settings.dataUrl) {
      setActionError('URL não configurada');
      setActionResult(null);
      return;
    }

    setActionLoading(true);
    setActionError(null);

    try {
      const response = await fetch(settings.dataUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildRequestBody(value)),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      setActionResult(result);
    } catch (error) {
      console.error('Error sending input:', error);
      setActionError(error instanceof Error ? error.message : 'Erro desconhecido');
      setActionResult(null);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const payload = event.data as {
        type?: string;
        widgetId?: string;
        items?: { label: string; value: unknown }[];
        filters?: Record<string, string | number | boolean>;
      };
      if (!payload || payload.type !== 'nexus-filter-results') return;
      if (payload.widgetId && payload.widgetId !== widget.id) return;
      if (Array.isArray(payload.items)) {
        setFilterResults(payload.items);
      }
      if (payload.filters && typeof payload.filters === 'object') {
        setFilters(payload.filters);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [setFilterResults, setFilters, widget.id]);

  switch (normalizedWidgetType) {
    case 'heading': {
      const Tag = `h${settings.level || 2}` as keyof JSX.IntrinsicElements;
      const sizeClass = {
        1: 'text-4xl font-bold',
        2: 'text-3xl font-bold',
        3: 'text-2xl font-semibold',
        4: 'text-xl font-semibold',
        5: 'text-lg font-medium',
        6: 'text-base font-medium',
      }[settings.level || 2];
      const alignClass = {
        left: 'justify-start text-left',
        center: 'justify-center text-center',
        right: 'justify-end text-right',
      }[settings.align || 'left'];
      
      return (
        <Tag className={cn(sizeClass, alignClass, "py-2 flex items-center gap-2", customClasses)} style={customStyles}>
          {settings.headingIcon && settings.headingIconPosition !== 'right' && (
            <DynamicIcon name={settings.headingIcon} className="h-5 w-5 text-muted-foreground" />
          )}
          <span>{settings.text || 'Título'}</span>
          {settings.headingIcon && settings.headingIconPosition === 'right' && (
            <DynamicIcon name={settings.headingIcon} className="h-5 w-5 text-muted-foreground" />
          )}
        </Tag>
      );
    }

    case 'text':
      return (
        <p 
          className={cn("text-muted-foreground py-2", customClasses, {
            'text-left': settings.align === 'left',
            'text-center': settings.align === 'center',
            'text-right': settings.align === 'right',
          })}
          style={customStyles}
        >
          {settings.content || 'Digite seu texto aqui...'}
        </p>
      );

    case 'image':
      if (!settings.src) {
        return (
          <div 
            className={cn("bg-muted/50 rounded-lg h-40 flex items-center justify-center", customClasses)}
            style={customStyles}
          >
            <DynamicIcon name="image" className="h-10 w-10 text-muted-foreground" />
          </div>
        );
      }
      return (
        <img 
          src={settings.src} 
          alt={settings.alt || ''} 
          className={cn("rounded-lg max-w-full", customClasses, {
            'w-full': settings.size === 'full',
          })}
          style={customStyles}
        />
      );

    case 'button': {
      const requiresFilters = settings.buttonRequiresFilters ?? false;
      const relevantEntries = Object.entries(filters).filter(
        ([key]) => !['preset', 'from', 'to'].includes(key)
      );
      const missingRequired =
        requiresFilters &&
        relevantEntries.length > 0 &&
        relevantEntries.some(([, value]) => {
          if (value === null || value === undefined) return true;
          if (typeof value === 'string') return value.trim().length === 0;
          return false;
        });

      const handleButtonClick = () => {
        if (missingRequired) return;
        if (settings.buttonAction === 'navigate' && settings.buttonTargetPageId) {
          const target = pages.find((p) => p.id === settings.buttonTargetPageId);
          if (target?.slug) {
            navigate(withOrg(`/views/${target.slug}`));
          }
        }
      };

      return (
        <div 
          className={cn("py-2", customClasses, {
            'text-left': settings.align === 'left',
            'text-center': settings.align === 'center',
            'text-right': settings.align === 'right',
          })}
          style={customStyles}
        >
          <Button
            variant={settings.variant === 'primary' ? 'default' : settings.variant as any}
            disabled={missingRequired}
            onClick={handleButtonClick}
          >
            {settings.label || 'Botão'}
          </Button>
        </div>
      );
    }

    case 'spacer':
      return <div style={{ height: settings.height || 40, ...customStyles }} className={customClasses} />;

    case 'divider':
      return (
        <div 
          className={cn("py-4", customClasses, {
            'w-full': settings.width === 'full',
            'w-1/2 mx-auto': settings.width === 'half',
            'w-1/3 mx-auto': settings.width === 'third',
          })}
          style={customStyles}
        >
          <hr className={cn("border-border", {
            'border-solid': settings.dividerStyle === 'solid',
            'border-dashed': settings.dividerStyle === 'dashed',
            'border-dotted': settings.dividerStyle === 'dotted',
          })} />
        </div>
      );

    case 'icon':
      return (
        <div className={cn("flex justify-center py-4", customClasses)} style={customStyles}>
          <div style={{ width: settings.iconSize || 48, height: settings.iconSize || 48 }}>
            <DynamicIcon 
              name={settings.icon || 'star'} 
              className="text-primary w-full h-full"
            />
          </div>
        </div>
      );

    case 'video':
      if (!settings.videoUrl) {
        return (
          <div 
            className={cn("bg-muted/50 rounded-lg h-40 flex items-center justify-center", customClasses)}
            style={customStyles}
          >
            <DynamicIcon name="play" className="h-10 w-10 text-muted-foreground" />
          </div>
        );
      }
      return (
        <div 
          className={cn("aspect-video rounded-lg overflow-hidden bg-black", customClasses)}
          style={customStyles}
        >
          <iframe
            src={settings.videoUrl}
            className="w-full h-full"
            allowFullScreen
          />
        </div>
      );

    case 'html':
      {
        const htmlContent = settings.html?.trim();
        const htmlJs = settings.htmlJs?.trim();
        if (!htmlContent) {
          return (
            <div
              className={cn("bg-muted/40 rounded-lg border border-dashed h-40 flex items-center justify-center text-muted-foreground text-sm", customClasses)}
              style={customStyles}
            >
              Defina o HTML do widget
            </div>
          );
        }

        const htmlHeight =
          settings.widgetStyle?.height === 'custom' && settings.widgetStyle.customHeight
            ? settings.widgetStyle.customHeight
            : 320;

        const autoHeightScript = allowHtmlAutoHeight
          ? `(() => {
  const sendHeight = () => {
    const height = Math.max(
      document.documentElement.scrollHeight,
      document.body?.scrollHeight || 0
    );
    window.parent?.postMessage({ type: 'nexus-iframe-height', widgetId: '${widget.id}', height }, '*');
  };
  window.addEventListener('load', sendHeight);
  const observer = new ResizeObserver(sendHeight);
  observer.observe(document.documentElement);
  if (document.body) observer.observe(document.body);
})();`
          : '';

        const combinedJs = [themeBridgeScript, autoHeightScript, htmlJs]
          .filter(Boolean)
          .join('\n\n');
        const srcDoc = buildHtmlDocument(htmlContent, uiKitHead, combinedJs);

        return (
          <div className={cn("rounded-lg overflow-hidden border bg-background", customClasses)} style={customStyles}>
            <iframe
              ref={iframeRef}
              srcDoc={srcDoc}
              className="w-full"
              style={{ height: htmlHeight, pointerEvents: interactive ? 'auto' : 'none' }}
            />
          </div>
        );
      }

    case 'filters_header':
      return (
        <FiltersHeaderWidget
          settings={settings}
          customClasses={customClasses}
          customStyles={customStyles}
          filtersLoading={filtersLoading}
          filtersError={filtersError}
          setFiltersLoading={setFiltersLoading}
          setFiltersError={setFiltersError}
          setFilterResults={setFilterResults}
          setFilters={setFilters}
          formatDate={formatDate}
          user={user}
          currentTenant={currentTenant}
          pageContext={pageContext}
          widgetId={widget.id}
          widgetType={widget.widgetType}
        />
      );

    case 'filters_result_list': {
      const title = settings.filtersResultTitle ?? 'Opções de parcelamento';
      const resultKey = settings.filtersResultKey || 'installments';
      const targetKey = settings.filtersResultTargetKey || 'parcelamento';
      const emptyMessage = settings.filtersResultEmptyMessage || 'Nenhuma opção disponível.';
      const displayMode = settings.filtersResultDisplayMode || 'label';
      const valueMode = settings.filtersResultValueMode || 'value';
      const raw = filterResults[resultKey];
      const options = Array.isArray(raw)
        ? raw.map((opt, index) => {
            if (typeof opt === 'string' || typeof opt === 'number') {
              const text = String(opt);
              return { label: text, value: text, key: `${text}-${index}` };
            }
            if (opt && typeof opt === 'object') {
              const obj = opt as { label?: unknown; value?: unknown };
              const label = obj.label === undefined ? '' : String(obj.label);
              const value = obj.value === undefined ? label : String(obj.value);
              return { label, value, key: `${value || label}-${index}` };
            }
            return { label: '', value: '', key: `opt-${index}` };
          }).filter((opt) => opt.label.length > 0 && opt.value.length > 0)
        : [];

      const selectedValue = String(filters[targetKey] ?? '');

      return (
        <div className={cn("space-y-4", customClasses)} style={customStyles}>
          {title && <div className="text-2xl font-semibold">{title}</div>}
          {options.length === 0 ? (
            <div className="text-sm text-muted-foreground">{emptyMessage}</div>
          ) : (
            <RadioGroup
              value={selectedValue}
              onValueChange={(value) => setFilters({ ...filters, [targetKey]: value })}
              className="space-y-3"
            >
              {options.map((opt) => {
                const displayText = displayMode === 'value' ? opt.value : opt.label;
                const storedValue = valueMode === 'label' ? opt.label : opt.value;
                const isSelected = storedValue === selectedValue;
                return (
                  <label
                    key={opt.key}
                    className={cn(
                      "flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 transition-colors",
                      isSelected ? "border-primary ring-1 ring-primary/30" : "border-border"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value={storedValue} />
                    </div>
                    <div className="text-lg md:text-xl font-semibold">{displayText}</div>
                  </label>
                );
              })}
            </RadioGroup>
          )}
        </div>
      );
    }

    case 'subsection': {
      const columns = settings.subsectionColumns || [];
      const gapClass = {
        none: 'gap-0',
        sm: 'gap-2',
        md: 'gap-4',
        lg: 'gap-6',
      }[settings.subsectionGap || 'md'];
      const paddingClass = {
        none: 'p-0',
        sm: 'p-2',
        md: 'p-4',
        lg: 'p-6',
      }[settings.subsectionPadding || 'sm'];

      const useCard = settings.subsectionUseCard ?? false;
      return (
        <div
          className={cn(
            useCard ? "rounded-lg border border-border bg-card/60" : "rounded-lg",
            customClasses
          )}
          style={customStyles}
        >
          <div className={cn("flex", gapClass, paddingClass)}>
            {columns.map((col) => (
              <div
                key={col.id}
                className="flex flex-col gap-2 min-h-[40px]"
                style={{ flex: col.settings.width }}
              >
                {col.children.map((child) => (
                  <ElementorWidgetRenderer
                    key={child.id}
                    widget={child}
                    previewData={previewData}
                    interactive={false}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'iframe': {
      const iframeUrl = settings.iframeUrl?.trim();
      const iframeHtml = settings.iframeHtml?.trim();
      const iframeHeight = settings.iframeHeight || 320;
      const iframeContext = settings.iframeSendContext ? buildRequestBody(null) : null;

      if (!iframeUrl && !iframeHtml) {
        return (
          <div
            className={cn("bg-muted/40 rounded-lg border border-dashed h-40 flex items-center justify-center text-muted-foreground text-sm", customClasses)}
            style={customStyles}
          >
            Defina uma URL ou HTML para o iframe
          </div>
        );
      }

      if (iframeUrl) {
        let finalUrl = iframeUrl;
        if (iframeContext) {
          const encodedContext = encodeContext(iframeContext);
          const joiner = iframeUrl.includes('?') ? '&' : '?';
          finalUrl = `${iframeUrl}${joiner}ctx=${encodeURIComponent(encodedContext)}`;
        }

        return (
          <div className={cn("rounded-lg overflow-hidden border bg-background", customClasses)} style={customStyles}>
            <iframe
              ref={iframeRef}
              src={finalUrl}
              className="w-full"
              style={{ height: iframeHeight, pointerEvents: interactive ? 'auto' : 'none' }}
            />
          </div>
        );
      }

      let resolvedSrcDoc = iframeSrcDoc;
      if (iframeContext) {
        const contextJson = JSON.stringify(iframeContext);
        resolvedSrcDoc = iframeSrcDoc.replace(
          '</head>',
          `    <script>window.__ELEMENTOR_CONTEXT__ = ${contextJson};</script>\n  </head>`
        );
      }

      return (
        <div className={cn("rounded-lg overflow-hidden border bg-background", customClasses)} style={customStyles}>
          <iframe
            ref={iframeRef}
            srcDoc={resolvedSrcDoc}
            className="w-full"
            style={{ height: iframeHeight, pointerEvents: interactive ? 'auto' : 'none' }}
          />
        </div>
      );
    }

    case 'table': {
      // Use URL data if configured
      let tableData: Record<string, unknown>[] = [];
      
      if (settings.dataUrl && urlData) {
        tableData = Array.isArray(urlData) ? urlData : [];
      } else if (settings.dataBinding?.enabled && previewData) {
        tableData = Array.isArray(previewData) ? previewData : [];
      } else {
        tableData = settings.staticData || [];
      }

      // Auto-generate columns from URL fields or data
      let columns = settings.columns || [];
      if (settings.dataUrl && settings.dataUrlFields && settings.dataUrlFields.length > 0) {
        columns = settings.dataUrlFields.map(field => ({
          key: field,
          label: field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' '),
        }));
      } else if (tableData.length > 0 && columns.length === 0) {
        const firstRow = tableData[0];
        columns = Object.keys(firstRow).slice(0, 5).map(key => ({
          key,
          label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        }));
      }

      if (urlLoading) {
        return (
          <Card className={customClasses} style={customStyles}>
            <CardContent className="py-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        );
      }

      if (urlError) {
        return (
          <Card className={customClasses} style={customStyles}>
            <CardContent className="py-8">
              <p className="text-destructive text-sm text-center">Erro: {urlError}</p>
            </CardContent>
          </Card>
        );
      }

      return (
        <Card className={customClasses} style={customStyles}>
          {settings.title && (
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{settings.title}</CardTitle>
            </CardHeader>
          )}
          <CardContent className={settings.title ? '' : 'pt-4'}>
            {tableData.length === 0 ? (
              <p className="text-muted-foreground text-sm">Sem dados</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((col) => (
                      <TableHead key={col.key}>{col.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.slice(0, 10).map((row: any, idx: number) => (
                    <TableRow key={idx}>
                      {columns.map((col) => (
                        <TableCell key={col.key}>{row[col.key] ?? '-'}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      );
    }

    case 'kpi': {
      let value = settings.value || '0';
      const filterValue =
        settings.useFilterResult && settings.filterLabel
          ? filterResults[settings.filterLabel]
          : undefined;
      
      // Use URL data if configured
      if (settings.dataUrl && urlData) {
        const dataArray = Array.isArray(urlData) ? urlData : [];
        if (dataArray.length > 0) {
          // Check if using metric format (label/value with selectedMetric)
          if (settings.selectedMetric) {
            const metricItem = dataArray.find(
              (item: any) => item.label === settings.selectedMetric
            );
            if (metricItem && metricItem.value !== undefined) {
              value = String(metricItem.value);
            }
          } else if (settings.selectedValueField) {
            // Standard format - use selectedValueField
            const firstItem = dataArray[0] as Record<string, unknown>;
            const urlValue = firstItem[settings.selectedValueField];
            if (urlValue !== undefined) {
              value = String(urlValue);
            }
          }
        }
      }

      if ((filterValue === undefined || filterValue === null) && settings.useFilterResult && settings.filterLabel) {
        value = '';
      } else if (filterValue !== undefined && filterValue !== null) {
        if (Array.isArray(filterValue)) {
          const options = filterValue
            .map((opt) => {
              if (typeof opt === 'string' || typeof opt === 'number') {
                const text = String(opt);
                return { label: text, value: text };
              }
              if (opt && typeof opt === 'object') {
                const obj = opt as { label?: unknown; value?: unknown };
                const label = obj.label === undefined ? '' : String(obj.label);
                const value = obj.value === undefined ? label : String(obj.value);
                return { label, value };
              }
              return { label: '', value: '' };
            })
            .filter((opt) => opt.label.length > 0 || opt.value.length > 0);
          const index = Math.max(0, settings.kpiFilterOptionIndex ?? 0);
          const selected = options[index] || options[0];
          if (selected) {
            value =
              (settings.kpiFilterDisplayMode || 'label') === 'value'
                ? selected.value
                : selected.label;
          } else {
            value = '';
          }
        } else if (filterValue && typeof filterValue === 'object') {
          const obj = filterValue as { label?: unknown; value?: unknown };
          const label = obj.label === undefined ? '' : String(obj.label);
          const val = obj.value === undefined ? label : String(obj.value);
          value =
            (settings.kpiFilterDisplayMode || 'label') === 'value'
              ? val
              : label;
        } else {
          value = String(filterValue);
        }
      }
      
      // Apply formatting
      const numValue = parseFloat(value);
      let formattedValue = value;
      const numericOnly = /^[\d.,-]+$/.test(String(value).trim());
      if (!isNaN(numValue) && numericOnly) {
        if (settings.format === 'currency') {
          formattedValue = numValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        } else if (settings.format === 'percent') {
          formattedValue = `${numValue.toFixed(1)}%`;
        } else {
          formattedValue = numValue.toLocaleString('pt-BR');
        }
      }

      if (urlLoading) {
        return (
          <Card className={customClasses} style={customStyles}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {settings.title || 'KPI'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        );
      }

      return (
        <Card className={customClasses} style={customStyles}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {settings.title || 'KPI'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {settings.prefix}{formattedValue}{settings.suffix}
            </div>
            {urlError && (
              <p className="text-destructive text-xs mt-1">Erro ao carregar dados</p>
            )}
          </CardContent>
        </Card>
      );
    }

    case 'chart': {
      let chartData = settings.chartData || [];
      
      // Use URL data if configured
      if (settings.dataUrl && urlData && settings.selectedLabelField && settings.selectedValueField) {
        const dataArray = Array.isArray(urlData) ? urlData : [];
        chartData = dataArray.map((item: any) => ({
          label: String(item[settings.selectedLabelField!] || ''),
          value: Number(item[settings.selectedValueField!]) || 0,
        }));
      }

      if (urlLoading) {
        return (
          <Card className={customClasses} style={customStyles}>
            <CardContent className="py-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        );
      }
      
      if (chartData.length === 0) {
        return (
          <Card className={customClasses} style={customStyles}>
            <CardContent className="py-8">
              <p className="text-muted-foreground text-center text-sm">
                {settings.dataUrl ? 'Configure os campos de label e valor' : 'Configure os dados do gráfico'}
              </p>
            </CardContent>
          </Card>
        );
      }

      return (
        <Card className={customClasses} style={customStyles}>
          {settings.title && (
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{settings.title}</CardTitle>
            </CardHeader>
          )}
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                {settings.chartType === 'bar' ? (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" />
                  </BarChart>
                ) : settings.chartType === 'line' ? (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" />
                  </LineChart>
                ) : (
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {chartData.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>
            {urlError && (
              <p className="text-destructive text-xs mt-2 text-center">Erro ao carregar dados</p>
            )}
          </CardContent>
        </Card>
      );
    }

    case 'input_text': {
      return (
        <Card className={customClasses} style={customStyles}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {settings.inputLabel || 'Entrada de Texto'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder={settings.placeholder || 'Digite aqui'}
            />
            <Button onClick={() => handleAction(textValue)} disabled={actionLoading}>
              {actionLoading ? 'Enviando...' : actionButtonLabel}
            </Button>
            {actionError && (
              <p className="text-xs text-destructive">Erro: {actionError}</p>
            )}
            {booleanResult !== null && (
              <Badge variant={booleanResult ? 'default' : 'destructive'}>
                {booleanResult ? 'Verdadeiro' : 'Falso'}
              </Badge>
            )}
            {booleanResult === null && resultText && (
              <p className="text-xs text-muted-foreground">Retorno: {resultText}</p>
            )}
          </CardContent>
        </Card>
      );
    }

    case 'input_select': {
      return (
        <Card className={customClasses} style={customStyles}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {settings.inputLabel || 'Seleção'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Opção</Label>
              <Select value={selectValue} onValueChange={(v) => setSelectValue(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {selectOptions.length === 0 && (
                    <SelectItem value="__empty__" disabled>
                      Sem opções
                    </SelectItem>
                  )}
                  {selectOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => handleAction(selectValue)} disabled={actionLoading}>
              {actionLoading ? 'Enviando...' : actionButtonLabel}
            </Button>
            {actionError && (
              <p className="text-xs text-destructive">Erro: {actionError}</p>
            )}
            {booleanResult !== null && (
              <Badge variant={booleanResult ? 'default' : 'destructive'}>
                {booleanResult ? 'Verdadeiro' : 'Falso'}
              </Badge>
            )}
            {booleanResult === null && resultText && (
              <p className="text-xs text-muted-foreground">Retorno: {resultText}</p>
            )}
          </CardContent>
        </Card>
      );
    }

    case 'input_boolean': {
      return (
        <Card className={customClasses} style={customStyles}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {settings.inputLabel || 'Booleano'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {booleanValue ? settings.trueLabel || 'Sim' : settings.falseLabel || 'Não'}
              </span>
              <Switch checked={booleanValue} onCheckedChange={(v) => setBooleanValue(v)} />
            </div>
            <Button onClick={() => handleAction(booleanValue)} disabled={actionLoading}>
              {actionLoading ? 'Enviando...' : actionButtonLabel}
            </Button>
            {actionError && (
              <p className="text-xs text-destructive">Erro: {actionError}</p>
            )}
            {booleanResult !== null && (
              <Badge variant={booleanResult ? 'default' : 'destructive'}>
                {booleanResult ? 'Verdadeiro' : 'Falso'}
              </Badge>
            )}
            {booleanResult === null && resultText && (
              <p className="text-xs text-muted-foreground">Retorno: {resultText}</p>
            )}
          </CardContent>
        </Card>
      );
    }

    default:
      return (
        <div 
          className={cn("p-4 bg-muted rounded-md text-center text-muted-foreground text-sm", customClasses)}
          style={customStyles}
        >
          Widget: {String(normalizedWidgetType)}
        </div>
      );
  }
}

function FiltersHeaderWidget({
  settings,
  customClasses,
  customStyles,
  filtersLoading,
  filtersError,
  setFiltersLoading,
  setFiltersError,
  setFilterResults,
  setFilters,
  formatDate,
  user,
  currentTenant,
  pageContext,
  widgetId,
  widgetType,
}: {
  settings: Widget['settings'];
  customClasses: string;
  customStyles: CSSProperties;
  filtersLoading: boolean;
  filtersError: string | null;
  setFiltersLoading: (value: boolean) => void;
  setFiltersError: (value: string | null) => void;
  setFilterResults: (items: { label: string; value: unknown }[]) => void;
  setFilters: (next: Record<string, string | number | boolean>) => void;
  formatDate: (date: Date) => string;
  user: ReturnType<typeof useAuth>['user'];
  currentTenant: ReturnType<typeof useTenant>['currentTenant'];
  pageContext: ReturnType<typeof usePageContext>;
  widgetId: string;
  widgetType: Widget['widgetType'];
}) {
  const endpoint = settings.filtersEndpoint?.trim();
  const fields = settings.filterFields || [];
  const layout = settings.filtersLayout || 'grid';
  const columns = settings.filtersColumns || 2;
  const showPeriod = settings.filtersShowPeriod ?? true;
  const showApply = settings.filtersShowApply ?? true;
  const periodPlacement = settings.filtersPeriodPlacement || 'right';
  const buttonPlacement = settings.filtersButtonPlacement || 'right';
  const titleIcon = settings.filtersTitleIcon || '';
  const titleIconPosition = settings.filtersTitleIconPosition || 'left';
  const [fieldValues, setFieldValues] = useState<Record<string, string | number | boolean>>({});
  const [fieldOptions, setFieldOptions] = useState<Record<string, { label: string; value: string }[]>>({});
  const [preset, setPreset] = useState<'today' | 'yesterday' | 'last_7' | 'last_30' | 'custom'>('today');
  const [customFrom, setCustomFrom] = useState(formatDate(new Date()));
  const [customTo, setCustomTo] = useState(formatDate(new Date()));
  const autoApply = settings.filtersAutoApply ?? !showApply;
  const autoApplyRequireAll = settings.filtersAutoApplyRequireAll ?? false;
  const [validationError, setValidationError] = useState<string | null>(null);
  const [optionsResolved, setOptionsResolved] = useState(false);
  const [fieldOptionsResolved, setFieldOptionsResolved] = useState<Record<string, boolean>>({});
  const fallbackMode = settings.filtersOptionsFallback || 'field';
  const sendContext = settings.filtersSendContext ?? false;
  const paymentPopupEnabled = settings.filtersPaymentPopup ?? false;
  const paymentTotalKey = settings.filtersPaymentTotalKey || '';
  const autoOptions = settings.filtersAutoOptions ?? true;
  const endpointPrefill = settings.filtersEndpointPrefill ?? false;
  const endpointPrefillMap = settings.filtersEndpointPrefillMap || {};
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentItems, setPaymentItems] = useState<Array<{
    type: 'dinheiro' | 'cartao' | 'pix';
    amount: string;
    ticket: string;
    pixKey: string;
    pixDateTime: string;
    ticketStatus?: 'idle' | 'loading' | 'valid' | 'invalid';
  }>>([
    { type: 'dinheiro', amount: '', ticket: '', pixKey: '', pixDateTime: '', ticketStatus: 'idle' },
  ]);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSending, setPaymentSending] = useState(false);

  const parseMoney = (value: unknown) => {
    if (value === null || value === undefined) return NaN;
    const raw = String(value).trim();
    if (!raw) return NaN;
    const cleaned = raw.replace(/[^\d.,-]/g, '');
    if (!cleaned) return NaN;
    // If both comma and dot exist, assume dot is thousand separator and comma is decimal.
    if (cleaned.includes(',') && cleaned.includes('.')) {
      const normalized = cleaned.replace(/\./g, '').replace(',', '.');
      return Number(normalized);
    }
    // If only comma, treat it as decimal separator.
    if (cleaned.includes(',')) {
      return Number(cleaned.replace(',', '.'));
    }
    return Number(cleaned);
  };

  const formatDecimalString = (rawValue: string, decimals: number) => {
    const raw = rawValue.trim();
    if (!raw) return '';
    const cleaned = raw.replace(/[^\d.,-]/g, '');
    if (!cleaned) return '';
    const numeric = parseMoney(cleaned);
    if (!Number.isFinite(numeric)) return rawValue;
    return numeric.toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };
  const contextParams = useMemo(() => {
    if (!sendContext) return {};
    return {
      user_id: user?.id,
      user_email: user?.email,
      tenant_id: currentTenant?.id,
      tenant_slug: currentTenant?.slug,
      page_id: pageContext.pageId,
      page_slug: pageContext.pageSlug,
      page_title: pageContext.pageTitle,
      widget_id: widgetId,
      widget_type: widgetType,
    };
  }, [sendContext, user?.id, user?.email, currentTenant?.id, currentTenant?.slug, pageContext.pageId, pageContext.pageSlug, pageContext.pageTitle, widgetId, widgetType]);

  const appendContextParams = (baseUrl: string, extra?: Record<string, string | number | boolean>) => {
    try {
      const url = new URL(baseUrl, window.location.origin);
      const params = new URLSearchParams(url.search);
      const combined = { ...contextParams, ...extra };
      Object.entries(combined).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        params.set(key, String(value));
      });
      url.search = params.toString();
      return url.toString();
    } catch {
      return baseUrl;
    }
  };

  useEffect(() => {
    const initial: Record<string, string | number | boolean> = {};
    fields.slice(0, 4).forEach((field) => {
      if (field.type === 'boolean') {
        initial[field.key] = false;
      } else {
        initial[field.key] = '';
      }
    });
    setFieldValues(initial);
    setFieldOptions({});
    setOptionsResolved(false);
    setFieldOptionsResolved({});
  }, [fields]);

  const hasMissingRequired = useMemo(() => {
    return fields.slice(0, 4).some((field) => {
      if (field.type === 'boolean') return false;
      const value = fieldValues[field.key];
      return !String(value ?? '').trim();
    });
  }, [fields, fieldValues]);

  useEffect(() => {
    if (hasMissingRequired) {
      setFilterResults([]);
    }
  }, [hasMissingRequired, setFilterResults]);

  const resolvePeriod = () => {
    const now = new Date();
    if (preset === 'custom') {
      return { from: customFrom, to: customTo, preset };
    }
    if (preset === 'yesterday') {
      const date = new Date(now);
      date.setDate(now.getDate() - 1);
      const day = formatDate(date);
      return { from: day, to: day, preset };
    }
    if (preset === 'last_7') {
      const fromDate = new Date(now);
      fromDate.setDate(now.getDate() - 6);
      return { from: formatDate(fromDate), to: formatDate(now), preset };
    }
    if (preset === 'last_30') {
      const fromDate = new Date(now);
      fromDate.setDate(now.getDate() - 29);
      return { from: formatDate(fromDate), to: formatDate(now), preset };
    }
    const today = formatDate(now);
    return { from: today, to: today, preset: 'today' };
  };

  const normalizeResponseObject = (payload: unknown) => {
    if (!payload) return null;
    if (Array.isArray(payload)) {
      if (payload.length === 0) return null;
      const first = payload[0];
      if (first && typeof first === 'object' && !Array.isArray(first)) {
        return first as Record<string, unknown>;
      }
      return null;
    }
    if (typeof payload === 'object') {
      return payload as Record<string, unknown>;
    }
    return null;
  };
  const resolvePrefillValue = (responseObj: Record<string, unknown>, key: string) => {
    let value: unknown = responseObj[key];
    if (value === undefined && typeof responseObj.fields === 'object' && responseObj.fields !== null) {
      value = (responseObj.fields as Record<string, unknown>)[key];
    }
    if (value === undefined && typeof responseObj.data === 'object' && responseObj.data !== null) {
      value = (responseObj.data as Record<string, unknown>)[key];
    }
    if (value === undefined && typeof responseObj.options === 'object' && responseObj.options !== null) {
      value = (responseObj.options as Record<string, unknown>)[key];
    }
    if (Array.isArray(value)) {
      const first = value[0];
      if (typeof first === 'string' || typeof first === 'number') return first;
      if (first && typeof first === 'object') {
        const obj = first as { value?: unknown; label?: unknown };
        return obj.value ?? obj.label ?? '';
      }
      return '';
    }
    if (value && typeof value === 'object') {
      const obj = value as { value?: unknown; label?: unknown };
      if (obj.value !== undefined || obj.label !== undefined) {
        return obj.value ?? obj.label ?? '';
      }
    }
    return value;
  };

  const runRequest = async (options?: { skipValidation?: boolean; reason?: 'auto' | 'manual' }) => {
    if (!endpoint) {
      setFiltersError('URL do endpoint não configurada.');
      return;
    }

    if (!options?.skipValidation) {
      const missingList = fields
        .slice(0, 4)
        .filter((field) => field.type === 'list')
        .some((field) => !String(fieldValues[field.key] || '').trim());
      if (missingList) {
        setValidationError('Selecione uma opção em todos os campos de lista.');
        return;
      }
    }

    setFiltersLoading(true);
    setFiltersError(null);
    setValidationError(null);

    const { from, to, preset: currentPreset } = resolvePeriod();
    const params = new URLSearchParams();
    params.set('preset', currentPreset);
    params.set('from', from);
    params.set('to', to);
    if (options?.reason === 'auto') {
      params.set('auto', '1');
    }

    fields.slice(0, 4).forEach((field) => {
      const value = fieldValues[field.key];
      params.set(field.key, value === undefined ? '' : String(value));
    });
    Object.entries(contextParams).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      params.set(key, String(value));
    });

    try {
      const response = await fetch(`${endpoint}?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      let data: unknown = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }
      const responseObj = normalizeResponseObject(data);

      if (endpointPrefill && responseObj) {
        setFieldValues((prev) => {
          const next = { ...prev };
          fields.slice(0, 4).forEach((field) => {
            const current = String(prev[field.key] ?? '').trim();
            if (current) return;
            const responseKey = endpointPrefillMap[field.key] || field.key;
            const mappedValue = resolvePrefillValue(responseObj, responseKey);
            if (mappedValue === undefined || mappedValue === null || String(mappedValue).trim() === '') return;
            next[field.key] = String(mappedValue);
          });
          return next;
        });
      }

      if (responseObj && (responseObj as any).options && typeof (responseObj as any).options === 'object') {
        const nextOptions: Record<string, { label: string; value: string }[]> = {};
        Object.entries((responseObj as any).options as Record<string, unknown>).forEach(([key, value]) => {
          if (typeof value === 'string') {
            const parsed = value
              .split(',')
              .map((item) => item.trim())
              .filter((item) => item.length > 0)
              .map((item) => ({ label: item, value: item }));
            if (parsed.length > 0) {
              nextOptions[key] = parsed;
            }
            return;
          }
          if (Array.isArray(value)) {
            const parsed = (value as Array<{ label?: unknown; value?: unknown } | string>).map((opt) => {
              if (typeof opt === 'string') {
                const text = opt.trim();
                return { label: text, value: text };
              }
              return {
                label: opt.label === undefined ? '' : String(opt.label),
                value: opt.value === undefined ? '' : String(opt.value),
              };
            }).filter((opt) => opt.label.length > 0 && opt.value.length > 0);
            if (parsed.length > 0) {
              nextOptions[key] = parsed;
            }
            return;
          }
        });
        if (Object.keys(nextOptions).length > 0) {
          setFieldOptions(nextOptions);
          setFieldValues((prev) => {
            const next = { ...prev };
            Object.entries(nextOptions).forEach(([key, list]) => {
              const current = String(prev[key] ?? '').trim();
              if (!current && list.length > 0) {
                next[key] = list[0].value;
              }
            });
            return next;
          });
        }
      }

      if (responseObj && typeof (responseObj as any).message === 'string') {
        setFiltersError(String((responseObj as any).message));
      }

      if (responseObj && Array.isArray((responseObj as any).kpis)) {
        setFilterResults((responseObj as any).kpis as { label: string; value: unknown }[]);
      } else if (Array.isArray(data)) {
        setFilterResults(data);
      } else {
        setFilterResults([]);
      }
      setFilters({
        ...fieldValues,
        preset: currentPreset,
        from,
        to,
      } as Record<string, string | number | boolean>);
      if (paymentPopupEnabled && paymentTotalKey) {
        let totalCandidate: unknown = fieldValues[paymentTotalKey];
        if (!totalCandidate && responseObj && typeof responseObj === 'object') {
          const optionsMap = (responseObj as any).options;
          if (optionsMap && typeof optionsMap === 'object' && !Array.isArray(optionsMap)) {
            const list = (optionsMap as Record<string, unknown>)[paymentTotalKey];
            if (Array.isArray(list) && list.length > 0) {
              const first = list[0] as any;
              totalCandidate = typeof first === 'string' ? first : first?.value ?? first?.label;
            }
          }
        }

        const totalValue = parseMoney(totalCandidate);
        if (!Number.isFinite(totalValue) || totalValue <= 0) {
          if (!responseObj?.message) {
            setFiltersError(`Valor da venda inválido para abrir o popup (campo: ${paymentTotalKey}).`);
          }
        } else if (responseObj && typeof responseObj === 'object' && Object.keys(responseObj).length === 0) {
          if (!responseObj?.message) {
            setFiltersError('Resposta vazia. Verifique o endpoint.');
          }
        } else {
          setPaymentOpen(true);
          setPaymentError(null);
          setPaymentItems([{ type: 'dinheiro', amount: '', ticket: '', pixKey: '', pixDateTime: '', ticketStatus: 'idle' }]);
        }
      }
    } catch (err) {
      setFiltersError(err instanceof Error ? err.message : 'Erro ao buscar dados.');
      setOptionsResolved(true);
    } finally {
      setOptionsResolved(true);
      setFiltersLoading(false);
    }
  };

  const handleApply = async () => {
    await runRequest({ reason: 'manual' });
  };

  useEffect(() => {
    if (!endpoint || !autoApply) return;
    runRequest({ skipValidation: true, reason: 'auto' });
  }, [endpoint, autoApply]);

  const fieldEndpointsKey = fields
    .filter((field) => field.type === 'list' && field.optionsEndpoint)
    .map((field) => `${field.key}:${field.optionsEndpoint}:${field.dependsOn || ''}:${field.dependsParam || ''}`)
    .join('|');

  useEffect(() => {
    if (!fieldEndpointsKey || !autoOptions) return;
    if (fallbackMode === 'none') return;
    if (fallbackMode === 'field' && !optionsResolved) return;
    if (fallbackMode === 'block' && !optionsResolved) return;
    let cancelled = false;

    const loadFieldOptions = async (field: typeof fields[number]) => {
      if (!field.optionsEndpoint) return;
      if (fieldOptionsResolved[field.key]) return;
      if (Array.isArray(fieldOptions[field.key]) && fieldOptions[field.key].length > 0) {
        setFieldOptionsResolved((prev) => ({ ...prev, [field.key]: true }));
        return;
      }
      if (field.dependsOn) {
        const parentValue = fieldValues[field.dependsOn];
        if (parentValue === undefined || parentValue === null || String(parentValue).trim() === '') {
          // Clear options until parent is set
          setFieldOptions((prev) => {
            const next = { ...prev };
            delete next[field.key];
            return next;
          });
          setFieldOptionsResolved((prev) => ({ ...prev, [field.key]: true }));
          return;
        }
      }
      try {
        const extraParam =
          field.dependsOn && String(fieldValues[field.dependsOn] ?? '').trim()
            ? { [field.dependsParam || field.dependsOn]: String(fieldValues[field.dependsOn]) }
            : undefined;
        const response = await fetch(appendContextParams(field.optionsEndpoint, extraParam));
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        let data: unknown = null;
        try {
          data = await response.json();
        } catch {
          data = null;
        }
        let list: { label: string; value: string }[] = [];
        if (Array.isArray(data)) {
          list = (data as Array<{ label?: unknown; value?: unknown } | string>).map((opt) => {
            if (typeof opt === 'string') {
              const text = opt.trim();
              return { label: text, value: text };
            }
            return {
              label: opt.label === undefined ? '' : String(opt.label),
              value: opt.value === undefined ? '' : String(opt.value),
            };
          }).filter((opt) => opt.label.length > 0 && opt.value.length > 0);
        } else if (data && typeof data === 'object') {
          if (Array.isArray((data as any).options)) {
            list = ((data as any).options as Array<{ label?: unknown; value?: unknown } | string>).map((opt) => {
              if (typeof opt === 'string') {
                const text = opt.trim();
                return { label: text, value: text };
              }
              return {
                label: opt.label === undefined ? '' : String(opt.label),
                value: opt.value === undefined ? '' : String(opt.value),
              };
            }).filter((opt) => opt.label.length > 0 && opt.value.length > 0);
          } else if ((data as any).options && typeof (data as any).options === 'object') {
            const optionsMap = (data as any).options as Record<string, unknown>;
            const candidate =
              optionsMap[field.key] ??
              (Object.keys(optionsMap).length === 1 ? optionsMap[Object.keys(optionsMap)[0]] : undefined);
            if (Array.isArray(candidate)) {
              list = (candidate as Array<{ label?: unknown; value?: unknown } | string>).map((opt) => {
                if (typeof opt === 'string') {
                  const text = opt.trim();
                  return { label: text, value: text };
                }
                return {
                  label: opt.label === undefined ? '' : String(opt.label),
                  value: opt.value === undefined ? '' : String(opt.value),
                };
              }).filter((opt) => opt.label.length > 0 && opt.value.length > 0);
            } else if (typeof candidate === 'string') {
              const text = candidate.trim();
              if (text) list = [{ label: text, value: text }];
            }
          }
        }
        if (!cancelled && list.length > 0) {
          if (field.type === 'list') {
            setFieldOptions((prev) => ({ ...prev, [field.key]: list }));
          }
          setFieldValues((prev) => {
            const current = String(prev[field.key] ?? '').trim();
            if (current) return prev;
            return { ...prev, [field.key]: list[0].value };
          });
        }
        if (!cancelled) {
          setFieldOptionsResolved((prev) => ({ ...prev, [field.key]: true }));
        }
      } catch {
        // ignore field options errors to avoid blocking the UI
        if (!cancelled) {
          setFieldOptionsResolved((prev) => ({ ...prev, [field.key]: true }));
        }
      }
    };

    const listFieldsLocal = fields.slice(0, 4).filter((field) => field.type === 'list');
    fields.forEach((field) => {
      if (field.type !== 'list' || !field.optionsEndpoint) return;
      const hasOptions = Array.isArray(fieldOptions[field.key]) && fieldOptions[field.key].length > 0;
      const shouldLoad =
        fallbackMode === 'field'
          ? !hasOptions
          : fallbackMode === 'block'
            ? listFieldsLocal.every((f) => Array.isArray(fieldOptions[f.key]) && fieldOptions[f.key].length > 0) === false
            : false;
      if (shouldLoad) {
        loadFieldOptions(field);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [fieldEndpointsKey, fieldValues, autoOptions, fallbackMode, optionsResolved, fieldOptionsResolved, fieldOptions]);

  useEffect(() => {
    if (!autoApply) return;
    if (autoApplyRequireAll) {
      if (hasMissingRequired) {
        setValidationError(null);
        return;
      }
    } else {
      const missingList = fields
        .slice(0, 4)
        .filter((field) => field.type === 'list')
        .some((field) => !String(fieldValues[field.key] || '').trim());
      if (missingList) {
        setValidationError('Selecione uma opção em todos os campos de lista.');
        return;
      }
      setValidationError(null);
    }
    const timeout = setTimeout(() => {
      runRequest({ reason: 'auto' });
    }, 350);
    return () => clearTimeout(timeout);
  }, [autoApply, autoApplyRequireAll, fieldValues, preset, customFrom, customTo, fields, hasMissingRequired]);

  useEffect(() => {
    const { from, to, preset: currentPreset } = resolvePeriod();
    setFilters({
      ...fieldValues,
      preset: currentPreset,
      from,
      to,
    } as Record<string, string | number | boolean>);
  }, [fieldValues, preset, customFrom, customTo]);

  const gridColsClass =
    layout === 'grid'
      ? {
          1: 'grid-cols-1',
          2: 'grid-cols-1 md:grid-cols-2',
          3: 'grid-cols-1 md:grid-cols-3',
          4: 'grid-cols-1 md:grid-cols-4',
        }[columns]
      : 'grid-cols-1';

  const useCard = settings.filtersUseCard ?? true;
  const listFields = fields.slice(0, 4).filter((field) => field.type === 'list');
  const hasAnyListOptions = listFields.some((field) => {
    const rawOptions = fieldOptions[field.key] || (field.options as any) || [];
    return Array.isArray(rawOptions) && rawOptions.length > 0;
  });
  const blockResolved =
    listFields.length === 0
      ? true
      : listFields.every((field) =>
          field.optionsEndpoint ? fieldOptionsResolved[field.key] : optionsResolved
        );
  const body = (
    <>
      <div className={cn("grid gap-4", gridColsClass)}>
        {fields.slice(0, 4).map((field) => (
          <div key={field.key} className="space-y-2">
            <Label>{field.label}</Label>
            {field.type === 'boolean' ? (
              <div className="flex items-center gap-2">
                <Switch
                  checked={Boolean(fieldValues[field.key])}
                  onCheckedChange={(v) => setFieldValues({ ...fieldValues, [field.key]: v })}
                  disabled={Boolean(field.lockOnAutoFill && field.dependsOn && String(fieldValues[field.key] || '').trim())}
                />
                <span className="text-xs text-muted-foreground">
                  {fieldValues[field.key] ? 'Sim' : 'Não'}
                </span>
              </div>
            ) : field.type === 'list' ? (() => {
              const rawOptions = fieldOptions[field.key] || (field.options as any) || [];
              const options = Array.isArray(rawOptions)
                ? rawOptions.map((opt: any) => (typeof opt === 'string' ? { label: opt, value: opt } : opt))
                : [];
              const hasOptions = options.length > 0;
              const resolved = field.optionsEndpoint ? fieldOptionsResolved[field.key] : optionsResolved;
              const allowManual =
                fallbackMode !== 'none' &&
                ((fallbackMode === 'field' && resolved && !hasOptions) ||
                  (fallbackMode === 'block' && blockResolved && !hasAnyListOptions));

              const shouldLock = Boolean(field.lockOnAutoFill && field.dependsOn && String(fieldValues[field.key] || '').trim());
              if (allowManual) {
                return (
                  <Input
                    value={String(fieldValues[field.key] || '')}
                    onChange={(e) =>
                      setFieldValues({
                        ...fieldValues,
                        [field.key]: e.target.value,
                      })
                    }
                    placeholder="Digite..."
                    disabled={shouldLock}
                  />
                );
              }

              return (
                <Select
                  value={String(fieldValues[field.key] || '')}
                  onValueChange={(v) => setFieldValues({ ...fieldValues, [field.key]: v })}
                  disabled={shouldLock}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((opt: any) => (
                      <SelectItem key={`${field.key}-${opt.value}`} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            })() : (
              field.type === 'number' ? (
                <div className="relative">
                  {field.numberFormat === 'currency' && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                  )}
                  {field.numberFormat === 'percent' && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                  )}
                  <Input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9.,-]*"
                    value={String(fieldValues[field.key] || '')}
                    onChange={(e) =>
                      setFieldValues({
                        ...fieldValues,
                        [field.key]: e.target.value.replace(/[^\d,.-]/g, ''),
                      })
                    }
                    onBlur={(e) => {
                      const decimals = field.numberFormat === 'percent' ? 2 : 2;
                      const formatted = formatDecimalString(e.target.value, decimals);
                      setFieldValues({
                        ...fieldValues,
                        [field.key]: formatted,
                      });
                    }}
                    placeholder={field.numberFormat === 'currency' ? '0,00' : '0'}
                    className={cn(
                      field.numberFormat === 'currency' && 'pl-8',
                      field.numberFormat === 'percent' && 'pr-8'
                    )}
                    disabled={Boolean(field.lockOnAutoFill && field.dependsOn && String(fieldValues[field.key] || '').trim())}
                  />
                </div>
              ) : (
                <Input
                  type="text"
                  value={String(fieldValues[field.key] || '')}
                  onChange={(e) =>
                    setFieldValues({
                      ...fieldValues,
                      [field.key]: e.target.value,
                    })
                  }
                  placeholder="Digite..."
                  disabled={Boolean(field.lockOnAutoFill && field.dependsOn && String(fieldValues[field.key] || '').trim())}
                />
              )
            )}
          </div>
        ))}
      </div>

      {!showPeriod && showApply && buttonPlacement === 'right' && (
        <div className="flex justify-end">
          <Button type="button" onClick={handleApply} disabled={filtersLoading}>
            {filtersLoading ? 'Buscando...' : 'Aplicar'}
          </Button>
        </div>
      )}

      {showPeriod && (
        <div className={cn("flex flex-wrap gap-4", periodPlacement === 'right' ? 'items-center justify-between' : 'flex-col')}>
          <div className="space-y-2">
            <Label>Período</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'today', label: 'Hoje' },
                { key: 'yesterday', label: 'Ontem' },
                { key: 'last_7', label: 'Últimos 7' },
                { key: 'last_30', label: 'Últimos 30' },
                { key: 'custom', label: 'Personalizado' },
              ].map((item) => (
                <Button
                  key={item.key}
                  type="button"
                  variant={preset === item.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreset(item.key as typeof preset)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            {preset === 'custom' && (
              <div className="flex flex-wrap gap-2">
                <Input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-40"
                />
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-40"
                />
              </div>
            )}
          </div>
          {showApply && buttonPlacement === 'right' && (
            <Button type="button" onClick={handleApply} disabled={filtersLoading}>
              {filtersLoading ? 'Buscando...' : 'Aplicar'}
            </Button>
          )}
        </div>
      )}

      {showApply && buttonPlacement === 'below' && (
        <Button type="button" onClick={handleApply} disabled={filtersLoading}>
          {filtersLoading ? 'Buscando...' : 'Aplicar'}
        </Button>
      )}

      {validationError && (
        <span className="text-xs text-destructive">{validationError}</span>
      )}
      {!validationError && filtersError && (
        <span className="text-xs text-destructive">{filtersError}</span>
      )}
      {paymentPopupEnabled && (
        <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Formas de pagamento</DialogTitle>
            </DialogHeader>
            {(() => {
              const totalRaw = String(fieldValues[paymentTotalKey] ?? '').replace(',', '.');
              const totalValue = Number(totalRaw) || 0;
              const sum = paymentItems.reduce((acc, item) => acc + (Number(String(item.amount).replace(',', '.')) || 0), 0);
              const remaining = Math.max(totalValue - sum, 0);
              const lastItemComplete = paymentItems.every((item) => {
                const amountOk = Number(String(item.amount).replace(',', '.')) > 0;
                if (item.type === 'cartao' || item.type === 'pix') {
                  return amountOk && String(item.ticket || '').trim().length > 0;
                }
                return amountOk;
              });

              const updateItem = (index: number, patch: Partial<typeof paymentItems[number]>) => {
                setPaymentItems((prev) => {
                  const next = [...prev];
                  next[index] = { ...next[index], ...patch };
                  return next;
                });
              };

              const submitSale = async () => {
                const endpoint = settings.filtersPaymentSubmitEndpoint?.trim();
                if (!endpoint) {
                  setPaymentError('Endpoint de envio não configurado.');
                  return;
                }
                setPaymentSending(true);
                setPaymentError(null);
                try {
                  const payload = {
                    total: totalValue,
                    fields: fieldValues,
                    payments: paymentItems.map((item) => ({
                      type: item.type,
                      amount: parseMoney(item.amount),
                      ticket: item.ticket || null,
                      pix_key: item.pixKey || null,
                      pix_datetime: item.pixDateTime || null,
                    })),
                    context: contextParams,
                  };
                  const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                  });
                  if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                  }
                  setPaymentOpen(false);
                } catch (err) {
                  setPaymentError(err instanceof Error ? err.message : 'Erro ao enviar venda.');
                } finally {
                  setPaymentSending(false);
                }
              };

              const canAddAnother = () => {
                if (paymentItems.length >= 5) return false;
                if (sum >= totalValue) return false;
                return paymentItems.every((item) => {
                  const amountOk = parseMoney(item.amount) > 0;
                  if (item.type === 'cartao') {
                    return amountOk && String(item.ticket || '').trim().length === 14 && item.ticketStatus === 'valid';
                  }
                  if (item.type === 'pix') {
                    return amountOk && String(item.pixKey || '').trim() && String(item.pixDateTime || '').trim();
                  }
                  if (item.type === 'dinheiro') {
                    return amountOk;
                  }
                  return amountOk;
                });
              };

              const canSubmit = () => {
                if (sum !== totalValue) return false;
                return paymentItems.every((item) => {
                  const amountOk = parseMoney(item.amount) > 0;
                  if (item.type === 'dinheiro') return amountOk;
                  if (item.type === 'pix') {
                    return amountOk && String(item.pixKey || '').trim() && String(item.pixDateTime || '').trim();
                  }
                  if (item.type === 'cartao') {
                    return amountOk && String(item.ticket || '').trim().length === 14 && item.ticketStatus === 'valid';
                  }
                  return amountOk;
                });
              };

              const triggerTicketCheck = async (index: number, ticket: string) => {
                const endpoint = settings.filtersPaymentTicketEndpoint?.trim();
                if (!endpoint || ticket.length !== 14) return;
                updateItem(index, { ticketStatus: 'loading' });
                try {
                  const response = await fetch(appendContextParams(endpoint, { ticket }));
                  if (!response.ok) throw new Error(`HTTP ${response.status}`);
                  const data = await response.json();
                  const obj = normalizeResponseObject(data) || (data as any);
                  const ok = obj?.ok ?? obj?.valid ?? obj?.success ?? obj?.exists;
                  if (ok === false) {
                    updateItem(index, { ticketStatus: 'invalid' });
                    return;
                  }
                  const valueCandidate =
                    obj?.value ??
                    obj?.amount ??
                    obj?.total ??
                    (obj?.options && obj.options.valor ? (Array.isArray(obj.options.valor) ? obj.options.valor[0] : obj.options.valor) : undefined);
                  const parsedValue = parseMoney(valueCandidate);
                  updateItem(index, {
                    ticketStatus: 'valid',
                    amount: Number.isFinite(parsedValue) ? String(parsedValue.toFixed(2)).replace('.', ',') : paymentItems[index].amount,
                  });
                } catch {
                  updateItem(index, { ticketStatus: 'invalid' });
                }
              };

              return (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Total da venda: <strong>R$ {totalValue.toFixed(2)}</strong>
                  </div>
                  {paymentItems.map((item, index) => (
                    <div key={index} className="rounded-md border border-border p-3 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Tipo</Label>
                          <Select
                            value={item.type}
                            onValueChange={(v) => {
                              const nextType = v as 'dinheiro' | 'cartao' | 'pix';
                              updateItem(index, {
                                type: nextType,
                                ticket: nextType === 'cartao' ? item.ticket : '',
                                ticketStatus: nextType === 'cartao' ? item.ticketStatus : 'idle',
                                pixKey: nextType === 'pix' ? item.pixKey : '',
                                pixDateTime: nextType === 'pix' ? item.pixDateTime : '',
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="dinheiro">Dinheiro</SelectItem>
                              <SelectItem value="cartao">Cartão / Pix (ticket)</SelectItem>
                              <SelectItem value="pix">Pix direto</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Valor</Label>
                          <Input
                            value={item.amount}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const numeric = parseMoney(raw);
                              const othersSum = paymentItems.reduce((acc, row, idx) => {
                                if (idx === index) return acc;
                                return acc + (parseMoney(row.amount) || 0);
                              }, 0);
                              const maxAllowed = Math.max(totalValue - othersSum, 0);
                              if (Number.isFinite(numeric) && numeric > maxAllowed) {
                                updateItem(index, {
                                  amount: String(maxAllowed.toFixed(2)).replace('.', ','),
                                });
                              } else {
                                updateItem(index, { amount: raw });
                              }
                            }}
                            placeholder="0,00"
                          />
                        </div>
                      </div>
                      {(item.type === 'cartao') && (
                        <div className="space-y-1">
                          <Label className="text-xs">Ticket</Label>
                          <Input
                            value={item.ticket}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 14);
                              updateItem(index, { ticket: value });
                              if (value.length === 14) {
                                triggerTicketCheck(index, value);
                              } else {
                                updateItem(index, { ticketStatus: 'idle' });
                              }
                            }}
                            placeholder="Número do ticket"
                          />
                          {item.ticketStatus === 'loading' && (
                            <span className="text-xs text-muted-foreground">Validando ticket...</span>
                          )}
                          {item.ticketStatus === 'invalid' && (
                            <span className="text-xs text-destructive">Ticket inválido.</span>
                          )}
                        </div>
                      )}
                      {item.type === 'pix' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Chave Pix</Label>
                            <Input
                              value={item.pixKey}
                              onChange={(e) => updateItem(index, { pixKey: e.target.value })}
                              placeholder="Chave Pix"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Data/Hora</Label>
                            <Input
                              type="datetime-local"
                              value={item.pixDateTime}
                              onChange={(e) => updateItem(index, { pixDateTime: e.target.value })}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="text-xs text-muted-foreground">
                    Soma: R$ {sum.toFixed(2)} • Restante: R$ {remaining.toFixed(2)}
                  </div>
                  {sum > totalValue && (
                    <div className="text-xs text-destructive">
                      A soma não pode ultrapassar o total da venda.
                    </div>
                  )}
                  {paymentError && (
                    <div className="text-xs text-destructive">{paymentError}</div>
                  )}
                  <div className="flex items-center justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPaymentOpen(false)}
                    >
                      Fechar
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={() =>
                          setPaymentItems((prev) => [
                            ...prev,
                            { type: 'dinheiro', amount: '', ticket: '', pixKey: '', pixDateTime: '', ticketStatus: 'idle' },
                          ])
                        }
                        disabled={!canAddAnother()}
                      >
                        Adicionar forma
                      </Button>
                      <Button
                        type="button"
                        onClick={submitSale}
                        disabled={!canSubmit() || paymentSending}
                      >
                        {paymentSending ? 'Enviando...' : 'Enviar venda'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      )}
    </>
  );

  if (!useCard) {
    return (
      <div className={cn("space-y-4", customClasses)} style={customStyles}>
        <div className="text-base font-semibold flex items-center gap-2">
          {titleIcon && titleIconPosition === 'left' && (
            <DynamicIcon name={titleIcon} className="h-4 w-4 text-muted-foreground" />
          )}
          <span>{settings.title || 'Filtros'}</span>
          {titleIcon && titleIconPosition === 'right' && (
            <DynamicIcon name={titleIcon} className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        {body}
      </div>
    );
  }

  return (
    <Card className={customClasses} style={customStyles}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {titleIcon && titleIconPosition === 'left' && (
            <DynamicIcon name={titleIcon} className="h-4 w-4 text-muted-foreground" />
          )}
          <span>{settings.title || 'Filtros'}</span>
          {titleIcon && titleIconPosition === 'right' && (
            <DynamicIcon name={titleIcon} className="h-4 w-4 text-muted-foreground" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {body}
      </CardContent>
    </Card>
  );
}
