import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useAuditLog } from './useAuditLog';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface BrandingTokens {
  primary?: string;
  secondary?: string;
  background?: string;
  foreground?: string;
  card?: string;
  border?: string;
  muted?: string;
  mutedForeground?: string;
  radiusScale?: 'sm' | 'md' | 'lg';
  shadowEnabled?: boolean;
  fontFamily?: string;
}

export interface TenantBranding {
  id: string;
  tenant_id: string;
  theme_mode: ThemeMode;
  tokens_json: BrandingTokens;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_TOKENS: BrandingTokens = {};

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Sora', label: 'Sora' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
];

export function useBranding() {
  const { currentTenant } = useTenant();
  const { log } = useAuditLog();
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBranding = useCallback(async () => {
    if (!currentTenant) {
      setBranding(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tenant_branding')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setBranding({
          ...data,
          tokens_json: (data.tokens_json as unknown as BrandingTokens) || DEFAULT_TOKENS,
          theme_mode: data.theme_mode as ThemeMode,
        });
      } else {
        setBranding(null);
      }
    } catch (error) {
      console.error('Error fetching branding:', error);
    } finally {
      setLoading(false);
    }
  }, [currentTenant]);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  const saveBranding = useCallback(async (
    themeMode: ThemeMode,
    tokens: BrandingTokens,
    logoUrl?: string | null
  ) => {
    if (!currentTenant) return;

    try {
      const payload = {
        tenant_id: currentTenant.id,
        theme_mode: themeMode,
        tokens_json: tokens as unknown as Json,
        logo_url: logoUrl ?? null,
      };

      let savedRow: TenantBranding | null = null;

      if (branding) {
        // Update existing
        const { data, error } = await supabase
          .from('tenant_branding')
          .update(payload)
          .eq('id', branding.id)
          .select('*')
          .single();

        if (error) throw error;
        savedRow = data as TenantBranding;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('tenant_branding')
          .insert(payload)
          .select('*')
          .single();

        if (error) throw error;
        savedRow = data as TenantBranding;
      }

      await log({ 
        action: 'update', 
        entity: 'branding', 
        metadata: { themeMode, tokens: tokens as unknown as Json } as Record<string, Json>
      });
      if (savedRow) {
        setBranding({
          ...savedRow,
          tokens_json: (savedRow.tokens_json as unknown as BrandingTokens) || DEFAULT_TOKENS,
          theme_mode: savedRow.theme_mode as ThemeMode,
        });
      }
      await fetchBranding();
      toast.success('Branding salvo com sucesso!');
    } catch (error) {
      console.error('Error saving branding:', error);
      toast.error('Erro ao salvar branding');
      throw error;
    }
  }, [currentTenant, branding, log, fetchBranding]);

  const resetToDefault = useCallback(async () => {
    if (!currentTenant) return;

    try {
      if (branding) {
        const { error } = await supabase
          .from('tenant_branding')
          .delete()
          .eq('id', branding.id);

        if (error) throw error;
      }

      await log({ action: 'reset', entity: 'branding' });
      setBranding(null);
      toast.success('Branding restaurado ao padrão!');
    } catch (error) {
      console.error('Error resetting branding:', error);
      toast.error('Erro ao restaurar branding');
      throw error;
    }
  }, [currentTenant, branding, log]);

  return {
    branding,
    loading,
    themeMode: branding?.theme_mode ?? 'system',
    tokens: branding?.tokens_json ?? DEFAULT_TOKENS,
    logoUrl: branding?.logo_url ?? null,
    saveBranding,
    resetToDefault,
    refetch: fetchBranding,
    FONT_OPTIONS,
  };
}
