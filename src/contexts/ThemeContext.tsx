import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useBranding, ThemeMode, BrandingTokens } from '@/hooks/useBranding';

interface ThemeContextType {
  theme: 'light' | 'dark';
  themeMode: ThemeMode;
  tokens: BrandingTokens;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// HSL color converter for CSS variables
function hexToHsl(hex: string): string {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse hex
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyTokens(tokens: BrandingTokens) {
  const root = document.documentElement;
  
  if (tokens.primary) {
    root.style.setProperty('--primary', hexToHsl(tokens.primary));
    root.style.setProperty('--sidebar-primary', hexToHsl(tokens.primary));
    root.style.setProperty('--ring', hexToHsl(tokens.primary));
  }
  
  if (tokens.secondary) {
    root.style.setProperty('--secondary', hexToHsl(tokens.secondary));
  }
  
  if (tokens.background) {
    root.style.setProperty('--background', hexToHsl(tokens.background));
  }
  
  if (tokens.foreground) {
    root.style.setProperty('--foreground', hexToHsl(tokens.foreground));
  }
  
  if (tokens.card) {
    root.style.setProperty('--card', hexToHsl(tokens.card));
    root.style.setProperty('--sidebar-background', hexToHsl(tokens.card));
    root.style.setProperty('--popover', hexToHsl(tokens.card));
  }
  
  if (tokens.border) {
    root.style.setProperty('--border', hexToHsl(tokens.border));
    root.style.setProperty('--input', hexToHsl(tokens.border));
    root.style.setProperty('--sidebar-border', hexToHsl(tokens.border));
  }
  
  if (tokens.muted) {
    root.style.setProperty('--muted', hexToHsl(tokens.muted));
    root.style.setProperty('--accent', hexToHsl(tokens.muted));
    root.style.setProperty('--sidebar-accent', hexToHsl(tokens.muted));
  }
  
  if (tokens.mutedForeground) {
    root.style.setProperty('--muted-foreground', hexToHsl(tokens.mutedForeground));
    root.style.setProperty('--sidebar-foreground', hexToHsl(tokens.mutedForeground));
  }
  
  // Radius scale
  if (tokens.radiusScale) {
    const radiusMap = {
      sm: { lg: '0.5rem', md: '0.375rem', sm: '0.25rem' },
      md: { lg: '1rem', md: '0.75rem', sm: '0.625rem' },
      lg: { lg: '1.5rem', md: '1rem', sm: '0.75rem' },
    };
    const radii = radiusMap[tokens.radiusScale];
    root.style.setProperty('--radius-lg', radii.lg);
    root.style.setProperty('--radius', radii.md);
    root.style.setProperty('--radius-sm', radii.sm);
  }
  
  // Shadow
  if (tokens.shadowEnabled === false) {
    root.style.setProperty('--shadow', 'none');
    root.style.setProperty('--shadow-lg', 'none');
    root.style.setProperty('--shadow-sm', 'none');
  }
  
  // Font family
  if (tokens.fontFamily) {
    document.body.style.fontFamily = `'${tokens.fontFamily}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
  }
}

function clearCustomTokens() {
  const root = document.documentElement;
  const customProps = [
    '--primary', '--secondary', '--background', '--foreground', 
    '--card', '--border', '--input', '--muted', '--muted-foreground',
    '--accent', '--ring', '--popover', '--sidebar-background', 
    '--sidebar-foreground', '--sidebar-primary', '--sidebar-accent',
    '--sidebar-border', '--radius-lg', '--radius', '--radius-sm',
    '--shadow', '--shadow-lg', '--shadow-sm'
  ];
  
  customProps.forEach(prop => root.style.removeProperty(prop));
  document.body.style.fontFamily = '';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { themeMode, tokens } = useBranding();
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');

  // Determine actual theme based on mode
  useEffect(() => {
    const determineTheme = () => {
      if (themeMode === 'system') {
        return getSystemTheme();
      }
      return themeMode;
    };

    setThemeState(determineTheme());

    // Listen for system theme changes
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => setThemeState(getSystemTheme());
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themeMode]);

  // Apply theme class
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  // Apply custom tokens
  useEffect(() => {
    if (Object.keys(tokens).length > 0) {
      applyTokens(tokens);
    } else {
      clearCustomTokens();
    }

    return () => clearCustomTokens();
  }, [tokens]);

  const setTheme = useCallback((newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, themeMode, tokens, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
