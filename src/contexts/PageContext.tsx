import { createContext, useContext, ReactNode } from 'react';

export interface PageContextData {
  pageId?: string;
  pageSlug?: string;
  pageTitle?: string;
}

const PageContext = createContext<PageContextData>({});

interface PageProviderProps {
  children: ReactNode;
  pageId?: string;
  pageSlug?: string;
  pageTitle?: string;
}

export function PageProvider({ children, pageId, pageSlug, pageTitle }: PageProviderProps) {
  return (
    <PageContext.Provider value={{ pageId, pageSlug, pageTitle }}>
      {children}
    </PageContext.Provider>
  );
}

export function usePageContext() {
  return useContext(PageContext);
}
