import { createContext, useContext, useMemo, useState, useEffect } from 'react';

type FilterValue = string | number | boolean | null;

export interface FilterResultItem {
  label: string;
  value: unknown;
}

interface ViewDataContextType {
  filters: Record<string, FilterValue>;
  setFilters: (next: Record<string, FilterValue>) => void;
  filterResults: Record<string, unknown>;
  setFilterResults: (items: FilterResultItem[]) => void;
  lastResultList: FilterResultItem[];
  setLastResultList: (items: FilterResultItem[]) => void;
}

const ViewDataContext = createContext<ViewDataContextType | undefined>(undefined);

export function ViewDataProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<Record<string, FilterValue>>({});
  const [filterResults, setFilterResultsState] = useState<Record<string, unknown>>({});
  const [lastResultList, setLastResultList] = useState<FilterResultItem[]>([]);

  useEffect(() => {
    const raw = sessionStorage.getItem('viewData');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        filters?: Record<string, FilterValue>;
        lastResultList?: FilterResultItem[];
      };
      if (parsed.filters) setFilters(parsed.filters);
      if (parsed.lastResultList) {
        setLastResultList(parsed.lastResultList);
        const map: Record<string, unknown> = {};
        parsed.lastResultList.forEach((item) => {
          if (item?.label) map[item.label] = item.value;
        });
        setFilterResultsState(map);
      }
    } catch {
      // ignore invalid cache
    }
  }, []);

  const setFilterResults = (items: FilterResultItem[]) => {
    const map: Record<string, unknown> = {};
    items.forEach((item) => {
      if (item?.label) {
        map[item.label] = item.value;
      }
    });
    setFilterResultsState(map);
    setLastResultList(items);
  };

  useEffect(() => {
    const payload = JSON.stringify({ filters, lastResultList });
    sessionStorage.setItem('viewData', payload);
  }, [filters, lastResultList]);

  const value = useMemo<ViewDataContextType>(() => ({
    filters,
    setFilters,
    filterResults,
    setFilterResults,
    lastResultList,
    setLastResultList,
  }), [filters, filterResults, lastResultList]);

  return (
    <ViewDataContext.Provider value={value}>
      {children}
    </ViewDataContext.Provider>
  );
}

export function useViewData() {
  const context = useContext(ViewDataContext);
  if (!context) {
    throw new Error('useViewData must be used within a ViewDataProvider');
  }
  return context;
}
