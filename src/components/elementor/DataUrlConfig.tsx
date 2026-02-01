import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Link2, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface DataUrlConfigProps {
  dataUrl?: string;
  dataUrlFields?: string[];
  selectedValueField?: string;
  selectedLabelField?: string;
  showLabelField?: boolean;
  onUpdate: (settings: {
    dataUrl?: string;
    dataUrlFields?: string[];
    selectedValueField?: string;
    selectedLabelField?: string;
  }) => void;
}

export function DataUrlConfig({
  dataUrl,
  dataUrlFields = [],
  selectedValueField,
  selectedLabelField,
  showLabelField = false,
  onUpdate,
}: DataUrlConfigProps) {
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

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
      
      // Extract available fields from response
      const fields = extractFields(data);
      
      if (fields.length === 0) {
        toast.warning('Nenhum campo encontrado na resposta');
        setTestStatus('error');
      } else {
        onUpdate({ dataUrlFields: fields });
        toast.success(`${fields.length} campos encontrados!`);
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

  const extractFields = (data: unknown): string[] => {
    // Handle different response formats
    let sample: Record<string, unknown> | null = null;

    if (Array.isArray(data) && data.length > 0) {
      sample = data[0];
    } else if (typeof data === 'object' && data !== null) {
      // Check if it's an object with data array
      const obj = data as Record<string, unknown>;
      if (Array.isArray(obj.data) && obj.data.length > 0) {
        sample = obj.data[0];
      } else if (Array.isArray(obj.items) && obj.items.length > 0) {
        sample = obj.items[0];
      } else if (Array.isArray(obj.results) && obj.results.length > 0) {
        sample = obj.results[0];
      } else {
        // Use the object itself
        sample = obj;
      }
    }

    if (!sample || typeof sample !== 'object') {
      return [];
    }

    return Object.keys(sample).filter(key => {
      const value = sample![key];
      // Only include primitive types (string, number, boolean)
      return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
    });
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

      {dataUrlFields.length > 0 && (
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
    </div>
  );
}
