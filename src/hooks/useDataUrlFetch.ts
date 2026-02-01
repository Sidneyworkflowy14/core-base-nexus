import { useState, useEffect, useRef } from 'react';

interface UseDataUrlFetchResult {
  data: unknown;
  loading: boolean;
  error: string | null;
}

export function useDataUrlFetch(dataUrl?: string): UseDataUrlFetchResult {
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!dataUrl) {
      setData(null);
      setError(null);
      fetchedUrlRef.current = null;
      return;
    }

    // Prevent duplicate fetches
    if (fetchedUrlRef.current === dataUrl) {
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(dataUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        
        if (!cancelled) {
          setData(normalizeData(result));
          fetchedUrlRef.current = dataUrl;
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
  }, [dataUrl]);

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
