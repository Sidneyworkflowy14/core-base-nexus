import { Block, HeadingBlock, TextBlock, TableBlock, KpiBlock, ChartBlock, HtmlBlock } from '@/types/builder';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useEffect, useRef, useMemo } from 'react';

interface BlockRendererProps {
  block: Block;
  data?: unknown;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d', '#ffc658'];

function HeadingRenderer({ block }: { block: HeadingBlock }) {
  const Tag = `h${block.props.level}` as keyof JSX.IntrinsicElements;
  const sizeClass = {
    1: 'text-3xl font-bold',
    2: 'text-2xl font-semibold',
    3: 'text-xl font-medium',
    4: 'text-lg font-medium',
  }[block.props.level];
  
  return <Tag className={sizeClass}>{block.props.text}</Tag>;
}

function TextRenderer({ block }: { block: TextBlock }) {
  return <p className="text-muted-foreground">{block.props.content}</p>;
}

function TableRenderer({ block, data }: { block: TableBlock; data?: unknown }) {
  const tableData = block.props.dataBinding?.enabled && data
    ? (Array.isArray(data) ? data : (data as any)?.[block.props.dataBinding.field || ''] || [])
    : block.props.staticData || [];

  if (!Array.isArray(tableData) || tableData.length === 0) {
    return (
      <Card>
        {block.props.title && (
          <CardHeader>
            <CardTitle>{block.props.title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <p className="text-muted-foreground">Sem dados para exibir.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {block.props.title && (
        <CardHeader>
          <CardTitle>{block.props.title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {block.props.columns.map((col) => (
                <TableHead key={col.key} style={{ width: col.width }}>
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.slice(0, 50).map((row: any, idx: number) => (
              <TableRow key={idx}>
                {block.props.columns.map((col) => (
                  <TableCell key={col.key}>{row[col.key] ?? '-'}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {tableData.length > 50 && (
          <p className="text-sm text-muted-foreground mt-2">
            Mostrando 50 de {tableData.length} registros.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function KpiRenderer({ block, data }: { block: KpiBlock; data?: unknown }) {
  let value = block.props.value || '0';
  
  if (block.props.dataBinding?.enabled && data) {
    const dataArray = Array.isArray(data) ? data : [data];
    const field = block.props.dataBinding.field;
    
    if (block.props.dataBinding.aggregation) {
      const values = dataArray.map((item: any) => Number(item[field || '']) || 0);
      switch (block.props.dataBinding.aggregation) {
        case 'count':
          value = String(dataArray.length);
          break;
        case 'sum':
          value = String(values.reduce((a, b) => a + b, 0));
          break;
        case 'avg':
          value = String(values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : 0);
          break;
        case 'min':
          value = String(Math.min(...values));
          break;
        case 'max':
          value = String(Math.max(...values));
          break;
      }
    } else if (field && dataArray[0]) {
      value = String(dataArray[0][field] ?? '0');
    }
  }

  // Format value
  let formattedValue = value;
  const numValue = parseFloat(value);
  if (!isNaN(numValue)) {
    if (block.props.format === 'currency') {
      formattedValue = numValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    } else if (block.props.format === 'percent') {
      formattedValue = `${numValue.toFixed(1)}%`;
    } else {
      formattedValue = numValue.toLocaleString('pt-BR');
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {block.props.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {block.props.prefix}{formattedValue}{block.props.suffix}
        </div>
      </CardContent>
    </Card>
  );
}

function ChartRenderer({ block, data }: { block: ChartBlock; data?: unknown }) {
  let chartData = block.props.staticData || [];
  
  if (block.props.dataBinding?.enabled && data) {
    const dataArray = Array.isArray(data) ? data : [];
    const labelField = block.props.dataBinding.labelField || 'label';
    const valueField = block.props.dataBinding.valueField || 'value';
    
    chartData = dataArray.map((item: any) => ({
      label: item[labelField] ?? '',
      value: Number(item[valueField]) || 0,
    }));
  }

  if (chartData.length === 0) {
    return (
      <Card>
        {block.props.title && (
          <CardHeader>
            <CardTitle>{block.props.title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <p className="text-muted-foreground">Sem dados para exibir.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {block.props.title && (
        <CardHeader>
          <CardTitle>{block.props.title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {block.props.chartType === 'bar' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            ) : block.props.chartType === 'line' ? (
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
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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

// Process template variables in HTML
function processTemplate(html: string, data: unknown): string {
  if (!data) return html;
  
  const dataObj = Array.isArray(data) ? data[0] : data;
  if (!dataObj || typeof dataObj !== 'object') return html;
  
  return html.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = (dataObj as Record<string, unknown>)[key];
    return value !== undefined ? String(value) : match;
  });
}

function HtmlRenderer({ block, data }: { block: HtmlBlock; data?: unknown }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const styleId = useMemo(() => `style-${block.id}`, [block.id]);
  
  // Process HTML with template variables
  const processedHtml = useMemo(() => {
    return processTemplate(block.props.html, data);
  }, [block.props.html, data]);
  
  // Inject scoped CSS
  useEffect(() => {
    if (!block.props.css) return;
    
    // Remove existing style if any
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Create scoped styles
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    // Scope CSS to this block's container
    const scopedCss = block.props.css
      .replace(/([^{}]+)({[^}]+})/g, (match, selector, rules) => {
        // Add container scope to each selector
        const scopedSelector = selector
          .split(',')
          .map((s: string) => `[data-block-id="${block.id}"] ${s.trim()}`)
          .join(', ');
        return `${scopedSelector}${rules}`;
      });
    styleElement.textContent = scopedCss;
    document.head.appendChild(styleElement);
    
    return () => {
      styleElement.remove();
    };
  }, [block.props.css, block.id, styleId]);
  
  // Execute scripts if enabled
  useEffect(() => {
    if (!block.props.enableScripts || !containerRef.current) return;
    
    // Find and execute script tags
    const scripts = containerRef.current.querySelectorAll('script');
    scripts.forEach((script) => {
      const newScript = document.createElement('script');
      newScript.textContent = script.textContent;
      script.parentNode?.replaceChild(newScript, script);
    });
  }, [processedHtml, block.props.enableScripts]);

  return (
    <Card>
      <CardContent className="p-4">
        <div
          ref={containerRef}
          data-block-id={block.id}
          dangerouslySetInnerHTML={{ __html: processedHtml }}
        />
      </CardContent>
    </Card>
  );
}

export function BlockRenderer({ block, data }: BlockRendererProps) {
  switch (block.type) {
    case 'heading':
      return <HeadingRenderer block={block} />;
    case 'text':
      return <TextRenderer block={block} />;
    case 'table':
      return <TableRenderer block={block} data={data} />;
    case 'kpi':
      return <KpiRenderer block={block} data={data} />;
    case 'chart':
      return <ChartRenderer block={block} data={data} />;
    case 'html':
      return <HtmlRenderer block={block} data={data} />;
    default:
      return <div className="text-muted-foreground">Bloco desconhecido</div>;
  }
}
