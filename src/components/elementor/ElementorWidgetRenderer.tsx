import { Widget } from '@/types/elementor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DynamicIcon } from '@/components/DynamicIcon';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface ElementorWidgetRendererProps {
  widget: Widget;
  previewData?: unknown;
}

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d'];

export function ElementorWidgetRenderer({ widget, previewData }: ElementorWidgetRendererProps) {
  const { widgetType, settings } = widget;

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
        <Tag className={cn(sizeClass, alignClass, "py-2")}>
          {settings.text || 'Título'}
        </Tag>
      );
    }

    case 'text':
      return (
        <p className={cn("text-muted-foreground py-2", {
          'text-left': settings.align === 'left',
          'text-center': settings.align === 'center',
          'text-right': settings.align === 'right',
        })}>
          {settings.content || 'Digite seu texto aqui...'}
        </p>
      );

    case 'image':
      if (!settings.src) {
        return (
          <div className="bg-muted/50 rounded-lg h-40 flex items-center justify-center">
            <DynamicIcon name="image" className="h-10 w-10 text-muted-foreground" />
          </div>
        );
      }
      return (
        <img 
          src={settings.src} 
          alt={settings.alt || ''} 
          className={cn("rounded-lg max-w-full", {
            'w-full': settings.size === 'full',
          })}
        />
      );

    case 'button':
      return (
        <div className={cn("py-2", {
          'text-left': settings.align === 'left',
          'text-center': settings.align === 'center',
          'text-right': settings.align === 'right',
        })}>
          <Button variant={settings.variant === 'primary' ? 'default' : settings.variant as any}>
            {settings.label || 'Botão'}
          </Button>
        </div>
      );

    case 'spacer':
      return <div style={{ height: settings.height || 40 }} />;

    case 'divider':
      return (
        <div className={cn("py-4", {
          'w-full': settings.width === 'full',
          'w-1/2 mx-auto': settings.width === 'half',
          'w-1/3 mx-auto': settings.width === 'third',
        })}>
          <hr className={cn("border-border", {
            'border-solid': settings.style === 'solid',
            'border-dashed': settings.style === 'dashed',
            'border-dotted': settings.style === 'dotted',
          })} />
        </div>
      );

    case 'icon':
      return (
        <div className="flex justify-center py-4">
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
          <div className="bg-muted/50 rounded-lg h-40 flex items-center justify-center">
            <DynamicIcon name="play" className="h-10 w-10 text-muted-foreground" />
          </div>
        );
      }
      return (
        <div className="aspect-video rounded-lg overflow-hidden bg-black">
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
          className="py-2"
          dangerouslySetInnerHTML={{ __html: settings.html || '' }}
        />
      );

    case 'table': {
      const tableData = settings.dataBinding?.enabled && previewData
        ? (Array.isArray(previewData) ? previewData : [])
        : settings.staticData || [];

      return (
        <Card>
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
                    {(settings.columns || []).map((col) => (
                      <TableHead key={col.key}>{col.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.slice(0, 10).map((row: any, idx: number) => (
                    <TableRow key={idx}>
                      {(settings.columns || []).map((col) => (
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
      
      // Apply formatting
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        if (settings.format === 'currency') {
          value = numValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        } else if (settings.format === 'percent') {
          value = `${numValue.toFixed(1)}%`;
        } else {
          value = numValue.toLocaleString('pt-BR');
        }
      }

      return (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {settings.title || 'KPI'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {settings.prefix}{value}{settings.suffix}
            </div>
          </CardContent>
        </Card>
      );
    }

    case 'chart': {
      const chartData = settings.chartData || [];
      
      if (chartData.length === 0) {
        return (
          <Card>
            <CardContent className="py-8">
              <p className="text-muted-foreground text-center text-sm">
                Configure os dados do gráfico
              </p>
            </CardContent>
          </Card>
        );
      }

      return (
        <Card>
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
          </CardContent>
        </Card>
      );
    }

    default:
      return (
        <div className="p-4 bg-muted rounded-md text-center text-muted-foreground text-sm">
          Widget: {widgetType}
        </div>
      );
  }
}
