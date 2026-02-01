import { Widget } from '@/types/elementor';
import { useDataUrlFetch } from '@/hooks/useDataUrlFetch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DynamicIcon } from '@/components/DynamicIcon';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { getWidgetStyles, getWidgetClasses } from '@/lib/widgetStyles';

interface ElementorWidgetRendererProps {
  widget: Widget;
  previewData?: unknown;
}

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d'];

export function ElementorWidgetRenderer({ widget, previewData }: ElementorWidgetRendererProps) {
  const { widgetType, settings } = widget;
  
  // Fetch data from URL if configured
  const { data: urlData, loading: urlLoading, error: urlError } = useDataUrlFetch(settings.dataUrl);

  // Get custom styles
  const customStyles = getWidgetStyles(settings.widgetStyle);
  const customClasses = getWidgetClasses(settings.widgetStyle);

  switch (widgetType) {
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
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
      }[settings.align || 'left'];
      
      return (
        <Tag className={cn(sizeClass, alignClass, "py-2", customClasses)} style={customStyles}>
          {settings.text || 'Título'}
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

    case 'button':
      return (
        <div 
          className={cn("py-2", customClasses, {
            'text-left': settings.align === 'left',
            'text-center': settings.align === 'center',
            'text-right': settings.align === 'right',
          })}
          style={customStyles}
        >
          <Button variant={settings.variant === 'primary' ? 'default' : settings.variant as any}>
            {settings.label || 'Botão'}
          </Button>
        </div>
      );

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
      return (
        <div 
          className={cn("py-2", customClasses)}
          style={customStyles}
          dangerouslySetInnerHTML={{ __html: settings.html || '' }}
        />
      );

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
      
      // Use URL data if configured
      if (settings.dataUrl && urlData && settings.selectedValueField) {
        const dataArray = Array.isArray(urlData) ? urlData : [];
        if (dataArray.length > 0) {
          const firstItem = dataArray[0] as Record<string, unknown>;
          const urlValue = firstItem[settings.selectedValueField];
          if (urlValue !== undefined) {
            value = String(urlValue);
          }
        }
      }
      
      // Apply formatting
      const numValue = parseFloat(value);
      let formattedValue = value;
      if (!isNaN(numValue)) {
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

    default:
      return (
        <div 
          className={cn("p-4 bg-muted rounded-md text-center text-muted-foreground text-sm", customClasses)}
          style={customStyles}
        >
          Widget: {widgetType}
        </div>
      );
  }
}
