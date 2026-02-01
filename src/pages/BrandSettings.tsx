import { useState, useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { useBranding, ThemeMode, BrandingTokens } from '@/hooks/useBranding';
import { AppLayout } from '@/components/AppLayout';
import { 
  NexusCard, 
  NexusCardHeader, 
  NexusCardTitle, 
  NexusCardDescription, 
  NexusCardContent,
  NexusButton,
  NexusInput,
  NexusBadge,
  NexusAvatar,
  NexusTabs,
  NexusTabsList,
  NexusTabsTrigger,
  NexusTabsContent,
} from '@/components/nexus';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Palette, RotateCcw, Save, Eye, Sun, Moon, Monitor, Type, Radius, Layers } from 'lucide-react';

export default function BrandSettingsPage() {
  const { currentTenant } = useTenant();
  const { branding, themeMode, tokens, saveBranding, resetToDefault, loading, FONT_OPTIONS } = useBranding();

  // Local state for form
  const [formThemeMode, setFormThemeMode] = useState<ThemeMode>('system');
  const [formTokens, setFormTokens] = useState<BrandingTokens>({});
  const [formLogo, setFormLogo] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Initialize form with current values
  useEffect(() => {
    setFormThemeMode(themeMode);
    setFormTokens(tokens);
    setFormLogo(branding?.logo_url || '');
  }, [themeMode, tokens, branding]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveBranding(formThemeMode, formTokens, formLogo || null);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Restaurar todas as configurações visuais ao padrão Nexus?')) {
      await resetToDefault();
      setFormThemeMode('system');
      setFormTokens({});
      setFormLogo('');
    }
  };

  const updateToken = (key: keyof BrandingTokens, value: string | boolean) => {
    setFormTokens(prev => ({ ...prev, [key]: value }));
  };

  if (!currentTenant) {
    return (
      <AppLayout>
        <div className="text-muted-foreground">Selecione uma organização primeiro.</div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="text-muted-foreground">Carregando configurações...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Palette className="h-6 w-6 text-primary" />
              Personalização Visual
            </h1>
            <p className="text-muted-foreground">
              Customize as cores, fonte e estilo do {currentTenant.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <NexusButton variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar Padrão
            </NexusButton>
            <NexusButton onClick={handleSave} loading={saving}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </NexusButton>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Settings Panel */}
          <div className="space-y-6">
            {/* Theme Mode */}
            <NexusCard>
              <NexusCardHeader>
                <NexusCardTitle className="flex items-center gap-2">
                  <Sun className="h-5 w-5" />
                  Modo do Tema
                </NexusCardTitle>
                <NexusCardDescription>
                  Escolha entre claro, escuro ou automático
                </NexusCardDescription>
              </NexusCardHeader>
              <NexusCardContent>
                <div className="flex gap-3">
                  {[
                    { value: 'light' as ThemeMode, icon: Sun, label: 'Claro' },
                    { value: 'dark' as ThemeMode, icon: Moon, label: 'Escuro' },
                    { value: 'system' as ThemeMode, icon: Monitor, label: 'Sistema' },
                  ].map(({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      onClick={() => setFormThemeMode(value)}
                      className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                        formThemeMode === value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </NexusCardContent>
            </NexusCard>

            {/* Colors */}
            <NexusCard>
              <NexusCardHeader>
                <NexusCardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Cores
                </NexusCardTitle>
                <NexusCardDescription>
                  Personalize as cores principais
                </NexusCardDescription>
              </NexusCardHeader>
              <NexusCardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cor Primária</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formTokens.primary || '#4F8CFF'}
                        onChange={(e) => updateToken('primary', e.target.value)}
                        className="h-10 w-14 rounded border border-input cursor-pointer"
                      />
                      <NexusInput
                        value={formTokens.primary || ''}
                        onChange={(e) => updateToken('primary', e.target.value)}
                        placeholder="#4F8CFF"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Cor Secundária</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formTokens.secondary || '#6D5EF7'}
                        onChange={(e) => updateToken('secondary', e.target.value)}
                        className="h-10 w-14 rounded border border-input cursor-pointer"
                      />
                      <NexusInput
                        value={formTokens.secondary || ''}
                        onChange={(e) => updateToken('secondary', e.target.value)}
                        placeholder="#6D5EF7"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Fundo</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formTokens.background || '#F7F8FB'}
                        onChange={(e) => updateToken('background', e.target.value)}
                        className="h-10 w-14 rounded border border-input cursor-pointer"
                      />
                      <NexusInput
                        value={formTokens.background || ''}
                        onChange={(e) => updateToken('background', e.target.value)}
                        placeholder="#F7F8FB"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Cards</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formTokens.card || '#FFFFFF'}
                        onChange={(e) => updateToken('card', e.target.value)}
                        className="h-10 w-14 rounded border border-input cursor-pointer"
                      />
                      <NexusInput
                        value={formTokens.card || ''}
                        onChange={(e) => updateToken('card', e.target.value)}
                        placeholder="#FFFFFF"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Bordas</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formTokens.border || '#EEF0F4'}
                        onChange={(e) => updateToken('border', e.target.value)}
                        className="h-10 w-14 rounded border border-input cursor-pointer"
                      />
                      <NexusInput
                        value={formTokens.border || ''}
                        onChange={(e) => updateToken('border', e.target.value)}
                        placeholder="#EEF0F4"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Texto Secundário</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formTokens.mutedForeground || '#6B7280'}
                        onChange={(e) => updateToken('mutedForeground', e.target.value)}
                        className="h-10 w-14 rounded border border-input cursor-pointer"
                      />
                      <NexusInput
                        value={formTokens.mutedForeground || ''}
                        onChange={(e) => updateToken('mutedForeground', e.target.value)}
                        placeholder="#6B7280"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </NexusCardContent>
            </NexusCard>

            {/* Typography & Style */}
            <NexusCard>
              <NexusCardHeader>
                <NexusCardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5" />
                  Tipografia e Estilo
                </NexusCardTitle>
              </NexusCardHeader>
              <NexusCardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Fonte</Label>
                    <Select
                      value={formTokens.fontFamily || 'Inter'}
                      onValueChange={(v) => updateToken('fontFamily', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            <span style={{ fontFamily: font.value }}>{font.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Radius className="h-4 w-4" />
                      Arredondamento
                    </Label>
                    <div className="flex gap-3">
                      {(['sm', 'md', 'lg'] as const).map((size) => (
                        <button
                          key={size}
                          onClick={() => updateToken('radiusScale', size)}
                          className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                            (formTokens.radiusScale || 'md') === size
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div
                            className={`h-8 w-full bg-primary/20 ${
                              size === 'sm' ? 'rounded' : size === 'md' ? 'rounded-lg' : 'rounded-2xl'
                            }`}
                          />
                          <span className="text-xs font-medium mt-2 block capitalize">{size}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        Sombras
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Adiciona profundidade aos cards e botões
                      </p>
                    </div>
                    <Switch
                      checked={formTokens.shadowEnabled !== false}
                      onCheckedChange={(v) => updateToken('shadowEnabled', v)}
                    />
                  </div>
                </div>
              </NexusCardContent>
            </NexusCard>

            {/* Logo */}
            <NexusCard>
              <NexusCardHeader>
                <NexusCardTitle>Logo</NexusCardTitle>
                <NexusCardDescription>
                  URL da imagem do logo (opcional)
                </NexusCardDescription>
              </NexusCardHeader>
              <NexusCardContent>
                <NexusInput
                  value={formLogo}
                  onChange={(e) => setFormLogo(e.target.value)}
                  placeholder="https://exemplo.com/logo.png"
                />
              </NexusCardContent>
            </NexusCard>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <NexusCard>
              <NexusCardHeader>
                <NexusCardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Preview ao Vivo
                </NexusCardTitle>
                <NexusCardDescription>
                  Veja como ficará o visual do seu app
                </NexusCardDescription>
              </NexusCardHeader>
              <NexusCardContent>
                {/* Mini preview */}
                <div 
                  className="rounded-lg border border-border overflow-hidden"
                  style={{
                    backgroundColor: formTokens.background || '#F7F8FB',
                  }}
                >
                  {/* Preview Header */}
                  <div 
                    className="h-12 border-b flex items-center justify-between px-4"
                    style={{
                      backgroundColor: formTokens.card || '#FFFFFF',
                      borderColor: formTokens.border || '#EEF0F4',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-6 w-6 rounded"
                        style={{
                          background: `linear-gradient(135deg, ${formTokens.primary || '#4F8CFF'}, ${formTokens.secondary || '#6D5EF7'})`,
                        }}
                      />
                      <span 
                        className="text-sm font-medium"
                        style={{ 
                          fontFamily: formTokens.fontFamily || 'Inter',
                          color: formTokens.foreground || '#111827',
                        }}
                      >
                        {currentTenant.name}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-6 w-6 rounded-full bg-muted" />
                      <NexusAvatar size="sm" gradient fallback="U" />
                    </div>
                  </div>

                  {/* Preview Content */}
                  <div className="p-4 space-y-4">
                    {/* Sample Card */}
                    <div 
                      className="p-4 rounded-lg border"
                      style={{
                        backgroundColor: formTokens.card || '#FFFFFF',
                        borderColor: formTokens.border || '#EEF0F4',
                        borderRadius: formTokens.radiusScale === 'sm' ? '8px' : formTokens.radiusScale === 'lg' ? '16px' : '12px',
                        boxShadow: formTokens.shadowEnabled !== false ? '0 8px 24px rgba(15,23,42,.06)' : 'none',
                      }}
                    >
                      <h3 
                        className="font-semibold mb-2"
                        style={{ 
                          fontFamily: formTokens.fontFamily || 'Inter',
                          color: formTokens.foreground || '#111827',
                        }}
                      >
                        Exemplo de Card
                      </h3>
                      <p 
                        className="text-sm mb-4"
                        style={{ color: formTokens.mutedForeground || '#6B7280' }}
                      >
                        Este é um exemplo de como os cards ficarão.
                      </p>
                      <div className="flex gap-2">
                        <button
                          className="px-4 py-2 rounded-md text-sm font-medium text-white"
                          style={{ 
                            backgroundColor: formTokens.primary || '#4F8CFF',
                            borderRadius: formTokens.radiusScale === 'sm' ? '6px' : formTokens.radiusScale === 'lg' ? '12px' : '8px',
                          }}
                        >
                          Primário
                        </button>
                        <button
                          className="px-4 py-2 rounded-md text-sm font-medium text-white"
                          style={{ 
                            backgroundColor: formTokens.secondary || '#6D5EF7',
                            borderRadius: formTokens.radiusScale === 'sm' ? '6px' : formTokens.radiusScale === 'lg' ? '12px' : '8px',
                          }}
                        >
                          Secundário
                        </button>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex gap-2 flex-wrap">
                      <NexusBadge>Ativo</NexusBadge>
                      <NexusBadge variant="success">Sucesso</NexusBadge>
                      <NexusBadge variant="warning">Aviso</NexusBadge>
                      <NexusBadge variant="beta">BETA</NexusBadge>
                    </div>

                    {/* Tabs Preview */}
                    <NexusTabs defaultValue="tab1">
                      <NexusTabsList>
                        <NexusTabsTrigger value="tab1">Aba 1</NexusTabsTrigger>
                        <NexusTabsTrigger value="tab2">Aba 2</NexusTabsTrigger>
                      </NexusTabsList>
                    </NexusTabs>
                  </div>
                </div>
              </NexusCardContent>
            </NexusCard>

            {/* Color Palette */}
            <NexusCard>
              <NexusCardHeader>
                <NexusCardTitle>Paleta Atual</NexusCardTitle>
              </NexusCardHeader>
              <NexusCardContent>
                <div className="grid grid-cols-6 gap-2">
                  {[
                    { label: 'Primary', color: formTokens.primary || '#4F8CFF' },
                    { label: 'Secondary', color: formTokens.secondary || '#6D5EF7' },
                    { label: 'Background', color: formTokens.background || '#F7F8FB' },
                    { label: 'Card', color: formTokens.card || '#FFFFFF' },
                    { label: 'Border', color: formTokens.border || '#EEF0F4' },
                    { label: 'Muted', color: formTokens.mutedForeground || '#6B7280' },
                  ].map(({ label, color }) => (
                    <div key={label} className="text-center">
                      <div
                        className="h-12 w-full rounded-lg border border-border mb-1"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </NexusCardContent>
            </NexusCard>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
