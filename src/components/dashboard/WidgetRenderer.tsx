import { useEffect, useState } from 'react';
import { Widget } from '@/types/dashboard';
import { useDataSources, DataSourceRow } from '@/hooks/useDataSources';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, AlertCircle } from 'lucide-react';

interface WidgetRendererProps {
  widget: Widget;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d', '#ffc658'];

export function WidgetRenderer({ widget }: WidgetRendererProps) {
  const { testDataSource } = useDataSources();
  const [data, setData] = useState<DataSourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!widget.data_source_id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await testDataSource(widget.data_source_id, widget.config_json.filterParams);
        if (result && result.data) {
          setData(result.data);
        } else if (result?.error) {
          setError(result.error);
        }
      } catch (err) {
        setError('Erro ao carregar dados');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [widget.data_source_id, widget.config_json.filterParams, testDataSource]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-32 text-destructive gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      );
    }

    if (!widget.data_source_id) {
      return (
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          Configure uma data source
        </div>
      );
    }

    switch (widget.type) {
      case 'kpi':
        return <KPIContent data={data} config={widget.config_json} />;
      case 'table':
        return <TableContent data={data} config={widget.config_json} />;
      case 'chart':
        return <ChartContent data={data} config={widget.config_json} />;
      case 'list':
        return <ListContent data={data} config={widget.config_json} />;
      default:
        return <div>Tipo desconhecido</div>;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{widget.title}</CardTitle>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}

function KPIContent({ data, config }: { data: DataSourceRow[]; config: Widget['config_json'] }) {
  const { valueField, aggregation = 'count', prefix = '', suffix = '' } = config;

  let value: number | string = 0;

  if (aggregation === 'count') {
    value = data.length;
  } else if (valueField && data.length > 0) {
    const numbers = data
      .map(row => parseFloat(String(row[valueField] ?? 0)))
      .filter(n => !isNaN(n));

    switch (aggregation) {
      case 'sum':
        value = numbers.reduce((a, b) => a + b, 0);
        break;
      case 'avg':
        value = numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
        break;
      case 'min':
        value = numbers.length > 0 ? Math.min(...numbers) : 0;
        break;
      case 'max':
        value = numbers.length > 0 ? Math.max(...numbers) : 0;
        break;
      case 'first':
        value = data[0]?.[valueField] !== undefined ? String(data[0][valueField]) : '0';
        break;
    }
  }

  const displayValue = typeof value === 'number' 
    ? value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
    : value;

  return (
    <div className="flex flex-col items-center justify-center py-4">
      <span className="text-4xl font-bold text-primary">
        {prefix}{displayValue}{suffix}
      </span>
      {valueField && aggregation !== 'count' && (
        <span className="text-sm text-muted-foreground mt-1">
          {aggregation} de {valueField}
        </span>
      )}
    </div>
  );
}

function TableContent({ data, config }: { data: DataSourceRow[]; config: Widget['config_json'] }) {
  const { columns, pageSize = 5 } = config;
  
  const displayColumns = columns?.length 
    ? columns 
    : data.length > 0 
      ? Object.keys(data[0]).slice(0, 5) 
      : [];

  const displayData = data.slice(0, pageSize);

  if (displayColumns.length === 0) {
    return <div className="text-muted-foreground text-center py-4">Sem dados</div>;
  }

  return (
    <div className="overflow-auto max-h-64">
      <Table>
        <TableHeader>
          <TableRow>
            {displayColumns.map(col => (
              <TableHead key={col} className="text-xs">{col}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayData.map((row, idx) => (
            <TableRow key={idx}>
              {displayColumns.map(col => (
                <TableCell key={col} className="text-xs py-1">
                  {String(row[col] ?? '')}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ChartContent({ data, config }: { data: DataSourceRow[]; config: Widget['config_json'] }) {
  const { chartType = 'bar', xField, yField } = config;

  if (!xField || !yField || data.length === 0) {
    return <div className="text-muted-foreground text-center py-8">Configure os campos do gráfico</div>;
  }

  const chartData = data.slice(0, 20).map(row => ({
    name: String(row[xField] ?? ''),
    value: parseFloat(String(row[yField])) || 0,
  }));

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} />
          </LineChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );
      case 'area':
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip />
            <Area type="monotone" dataKey="value" fill="hsl(var(--primary))" fillOpacity={0.3} stroke="hsl(var(--primary))" />
          </AreaChart>
        );
      default:
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip />
            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
    }
  };

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}

function ListContent({ data, config }: { data: DataSourceRow[]; config: Widget['config_json'] }) {
  const { labelField, valueField2, limit = 5 } = config;
  
  const displayData = data.slice(0, limit);

  if (!labelField || displayData.length === 0) {
    return <div className="text-muted-foreground text-center py-4">Configure o campo de label</div>;
  }

  return (
    <div className="space-y-2">
      {displayData.map((row, idx) => (
        <div key={idx} className="flex justify-between items-center py-1 border-b border-border last:border-0">
          <span className="text-sm">{String(row[labelField] ?? '')}</span>
          {valueField2 && (
            <span className="text-sm font-medium text-primary">{String(row[valueField2] ?? '')}</span>
          )}
        </div>
      ))}
    </div>
  );
}
