import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';

export interface DataUrlContext {
  widgetId?: string;
  widgetType?: string;
  widgetTitle?: string;
  pageId?: string;
  pageSlug?: string;
  pageTitle?: string;
  fieldName?: string;
}

interface UseDataUrlFetchResult {
  data: unknown;
  loading: boolean;
  error: string | null;
}

export function useDataUrlFetch(
  dataUrl?: string,
  context?: DataUrlContext
): UseDataUrlFetchResult {
  const { user } = useAuth();
  const { currentTenant } = useTenant();
  
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Create a stable key for the context to prevent unnecessary refetches
  const contextKey = JSON.stringify(context || {});
  const fetchedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!dataUrl) {
      setData(null);
      setError(null);
      fetchedKeyRef.current = null;
      return;
    }

    const currentKey = `${dataUrl}:${contextKey}`;
    
    // Prevent duplicate fetches
    if (fetchedKeyRef.current === currentKey) {
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Build the request body with all context
        const requestBody = {
          // User context
          user: user ? {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
          } : null,
          
          // Tenant context
          tenant: currentTenant ? {
            id: currentTenant.id,
            name: currentTenant.name,
          } : null,
          
          // Widget/element context
          widget: context ? {
            id: context.widgetId,
            type: context.widgetType,
            title: context.widgetTitle,
            fieldName: context.fieldName,
          } : null,
          
          // Page context
          page: context ? {
            id: context.pageId,
            slug: context.pageSlug,
            title: context.pageTitle,
          } : null,
          
          // Request metadata
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
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        
        if (!cancelled) {
          setData(normalizeData(result));
          fetchedKeyRef.current = currentKey;
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error fetching data URL:', err);
          setError(err instanceof Error ? err.message : 'Erro desconhecido');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [dataUrl, contextKey, user, currentTenant]);

  return { data, loading, error };
}

// Normalize different response formats to array
function normalizeData(data: unknown): unknown[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    
    // Common response wrappers
    if (Array.isArray(obj.data)) return obj.data;
    if (Array.isArray(obj.items)) return obj.items;
    if (Array.isArray(obj.results)) return obj.results;
    if (Array.isArray(obj.records)) return obj.records;
    if (Array.isArray(obj.rows)) return obj.rows;
    
    // Return as single-item array
    return [obj];
  }

  return [];
}
