import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Link2, RefreshCw, Check, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface DataUrlConfigProps {
  dataUrl?: string;
  dataUrlFields?: string[];
  dataUrlMetrics?: string[];  // Metrics available when using label/value format
  selectedValueField?: string;
  selectedLabelField?: string;
  selectedMetric?: string;  // Which metric (label value) to use
  refreshInterval?: number;
  showLabelField?: boolean;
  onUpdate: (settings: {
    dataUrl?: string;
    dataUrlFields?: string[];
    dataUrlMetrics?: string[];
    selectedValueField?: string;
    selectedLabelField?: string;
    selectedMetric?: string;
    refreshInterval?: number;
  }) => void;
}

const REFRESH_OPTIONS = [
  { value: '0', label: 'Manual (sem atualização)' },
  { value: '10', label: 'A cada 10 segundos' },
  { value: '30', label: 'A cada 30 segundos' },
  { value: '60', label: 'A cada 1 minuto' },
  { value: '120', label: 'A cada 2 minutos' },
  { value: '300', label: 'A cada 5 minutos' },
  { value: 'custom', label: 'Personalizado...' },
];

export function DataUrlConfig({
  dataUrl,
  dataUrlFields = [],
  dataUrlMetrics = [],
  selectedValueField,
  selectedLabelField,
  selectedMetric,
  refreshInterval = 0,
  showLabelField = false,
  onUpdate,
}: DataUrlConfigProps) {
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showCustomInterval, setShowCustomInterval] = useState(
    refreshInterval > 0 && !REFRESH_OPTIONS.some(o => o.value === String(refreshInterval))
  );

  const handleIntervalChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomInterval(true);
      return;
    }
    setShowCustomInterval(false);
    onUpdate({ refreshInterval: parseInt(value, 10) });
  };

  const getCurrentIntervalValue = () => {
    if (showCustomInterval) return 'custom';
    const match = REFRESH_OPTIONS.find(o => o.value === String(refreshInterval));
    return match ? match.value : 'custom';
  };

  const handleTestUrl = async () => {
    if (!dataUrl) {
      toast.error('Insira uma URL primeiro');
      return;
    }

    setTesting(true);
    setTestStatus('idle');

    try {
      // Send a test POST request with sample context
      const testPayload = {
        user: { id: 'test-user-id', email: 'test@example.com', name: 'Test User' },
        tenant: { id: 'test-tenant-id', name: 'Test Tenant' },
        widget: { id: 'test-widget-id', type: 'test', title: 'Test Widget' },
        page: { id: 'test-page-id', slug: 'test-page', title: 'Test Page' },
        meta: {
          timestamp: new Date().toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          locale: navigator.language,
        },
      };

      const response = await fetch(dataUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Extract available fields and metrics from response
      const { fields, metrics, isLabelValueFormat } = extractFieldsAndMetrics(data);
      
      if (fields.length === 0 && metrics.length === 0) {
        toast.warning('Nenhum campo encontrado na resposta');
        setTestStatus('error');
      } else {
        if (isLabelValueFormat && metrics.length > 0) {
          // Data is in label/value format - show metrics
          onUpdate({ 
            dataUrlFields: fields, 
            dataUrlMetrics: metrics,
            selectedValueField: 'value',
            selectedLabelField: 'label',
          });
          toast.success(`${metrics.length} métricas encontradas!`);
        } else {
          // Standard format - show fields
          onUpdate({ dataUrlFields: fields, dataUrlMetrics: [] });
          toast.success(`${fields.length} campos encontrados!`);
        }
        setTestStatus('success');
      }
    } catch (error) {
      console.error('Error testing URL:', error);
      toast.error('Erro ao testar URL. Verifique se está acessível e aceita POST.');
      setTestStatus('error');
    } finally {
      setTesting(false);
    }
  };

  const extractFieldsAndMetrics = (data: unknown): { fields: string[]; metrics: string[]; isLabelValueFormat: boolean } => {
    let dataArray: Record<string, unknown>[] = [];

    // Normalize to array
    if (Array.isArray(data)) {
      dataArray = data;
    } else if (typeof data === 'object' && data !== null) {
      const obj = data as Record<string, unknown>;
      if (Array.isArray(obj.data)) dataArray = obj.data;
      else if (Array.isArray(obj.items)) dataArray = obj.items;
      else if (Array.isArray(obj.results)) dataArray = obj.results;
      else dataArray = [obj];
    }

    if (dataArray.length === 0) {
      return { fields: [], metrics: [], isLabelValueFormat: false };
    }

    const sample = dataArray[0];
    
    // Check if data is in label/value format
    const hasLabel = 'label' in sample && typeof sample.label === 'string';
    const hasValue = 'value' in sample && (typeof sample.value === 'number' || typeof sample.value === 'string');
    const isLabelValueFormat = hasLabel && hasValue && dataArray.length > 1;

    if (isLabelValueFormat) {
      // Extract unique label values as metrics
      const metrics = dataArray
        .map(item => String(item.label))
        .filter((label, index, arr) => arr.indexOf(label) === index);
      
      return { fields: ['label', 'value'], metrics, isLabelValueFormat: true };
    }

    // Standard format - extract field names
    const fields = Object.keys(sample).filter(key => {
      const value = sample[key];
      return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
    });

    return { fields, metrics: [], isLabelValueFormat: false };
  };

  return (
    <div className="space-y-3 p-3 bg-muted/50 rounded-lg border border-border">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Link2 className="h-4 w-4" />
        Dados via URL (POST)
      </div>
      
      <div className="text-xs text-muted-foreground bg-background/50 p-2 rounded">
        A requisição envia automaticamente: <strong>usuário</strong>, <strong>tenant</strong>, <strong>página</strong>, <strong>widget</strong> e <strong>metadados</strong>.
      </div>
      
      <div className="space-y-2">
        <Label className="text-xs">URL de Dados (n8n, API)</Label>
        <div className="flex gap-2">
          <Input
            value={dataUrl || ''}
            onChange={(e) => onUpdate({ dataUrl: e.target.value })}
            placeholder="https://seu-n8n.app/webhook/..."
            className="text-xs"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleTestUrl}
            disabled={testing || !dataUrl}
            className="shrink-0"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : testStatus === 'success' ? (
              <Check className="h-4 w-4 text-primary" />
            ) : testStatus === 'error' ? (
              <AlertCircle className="h-4 w-4 text-destructive" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Show metrics selector when using label/value format */}
      {dataUrlMetrics.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs">Métrica</Label>
          <Select
            value={selectedMetric || ''}
            onValueChange={(v) => onUpdate({ selectedMetric: v })}
          >
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Selecione a métrica" />
            </SelectTrigger>
            <SelectContent>
              {dataUrlMetrics.map((metric) => (
                <SelectItem key={metric} value={metric}>
                  {metric.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground">
            Métricas: {dataUrlMetrics.map(m => m.replace(/_/g, ' ')).join(', ')}
          </div>
        </div>
      )}

      {/* Show field selectors when using standard format */}
      {dataUrlFields.length > 0 && dataUrlMetrics.length === 0 && (
        <>
          <div className="space-y-2">
            <Label className="text-xs">Campo de Valor</Label>
            <Select
              value={selectedValueField || ''}
              onValueChange={(v) => onUpdate({ selectedValueField: v })}
            >
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Selecione o campo" />
              </SelectTrigger>
              <SelectContent>
                {dataUrlFields.map((field) => (
                  <SelectItem key={field} value={field}>
                    {field}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showLabelField && (
            <div className="space-y-2">
              <Label className="text-xs">Campo de Label</Label>
              <Select
                value={selectedLabelField || ''}
                onValueChange={(v) => onUpdate({ selectedLabelField: v })}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Selecione o campo" />
                </SelectTrigger>
                <SelectContent>
                  {dataUrlFields.map((field) => (
                    <SelectItem key={field} value={field}>
                      {field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Campos disponíveis: {dataUrlFields.join(', ')}
          </div>
        </>
      )}

      {dataUrl && (
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-xs font-medium">
            <Clock className="h-3 w-3" />
            Atualização Automática
          </div>
          
          <Select
            value={getCurrentIntervalValue()}
            onValueChange={handleIntervalChange}
          >
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Selecione o intervalo" />
            </SelectTrigger>
            <SelectContent>
              {REFRESH_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {showCustomInterval && (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={5}
                value={refreshInterval || ''}
                onChange={(e) => onUpdate({ refreshInterval: parseInt(e.target.value, 10) || 0 })}
                placeholder="Segundos"
                className="text-xs"
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">segundos</span>
            </div>
          )}

          {refreshInterval > 0 && (
            <div className="text-xs text-muted-foreground">
              Os dados serão atualizados a cada {refreshInterval} segundos automaticamente.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
