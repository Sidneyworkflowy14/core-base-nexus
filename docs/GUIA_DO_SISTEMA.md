# 📚 Guia Completo do Sistema SaaS Multi-Tenant

Sistema de construção de dashboards e páginas dinâmicas com suporte a múltiplas organizações (tenants).

---

## 📋 Índice

1. [Arquitetura Geral](#arquitetura-geral)
2. [Primeiros Passos](#primeiros-passos)
3. [Gestão de Usuários e Roles](#gestão-de-usuários-e-roles)
4. [Gestão de Tenants](#gestão-de-tenants)
5. [Data Sources (Fontes de Dados)](#data-sources-fontes-de-dados)
6. [Views (Páginas Dinâmicas)](#views-páginas-dinâmicas)
7. [Dashboard e Widgets](#dashboard-e-widgets)
8. [Personalização Visual (Branding)](#personalização-visual-branding)
9. [Auditoria e Logs](#auditoria-e-logs)
10. [Referência Técnica](#referência-técnica)

---

## 🏗️ Arquitetura Geral

### Multi-Tenancy

O sistema utiliza isolamento total por `tenant_id`:
- Cada organização (tenant) tem seus próprios dados
- Row Level Security (RLS) garante que usuários só acessem dados do seu tenant
- Usuários podem pertencer a múltiplos tenants

### Hierarquia de Roles

| Role | Permissões |
|------|-----------|
| `superadmin` | Acesso global a todos os tenants, criar/suspender tenants |
| `tenant_admin` | Gerenciar usuários e configurações do seu tenant |
| `tenant_user` | Acesso básico às views publicadas |

### Tabelas Principais

```
tenants              → Organizações
memberships          → Vínculo usuário-tenant-role
data_sources         → Fontes de dados configuradas
pages                → Views/páginas criadas
page_versions        → Histórico de versões
dashboards           → Configuração do dashboard
widgets              → Componentes do dashboard
tenant_branding      → Personalização visual
audit_logs           → Logs de auditoria
```

---

## 🚀 Primeiros Passos

### 1. Criar Conta

1. Acesse `/auth`
2. Clique em "Criar conta"
3. Preencha email e senha
4. Confirme o email (se habilitado no Supabase)

### 2. Primeiro Acesso (Novo Usuário)

Se você é o primeiro usuário e precisa se tornar superadmin:

```sql
-- Execute no SQL Editor do Supabase

-- 1. Criar tenant inicial
INSERT INTO public.tenants (id, name, status)
VALUES ('00000000-0000-0000-0000-000000000001', 'Minha Organização', 'active');

-- 2. Vincular seu usuário (substitua SEU_USER_ID pelo seu ID)
INSERT INTO public.memberships (tenant_id, user_id, role)
VALUES (
  '00000000-0000-0000-0000-000000000001', 
  'SEU_USER_ID', 
  'superadmin'
);
```

> 💡 Para encontrar seu `user_id`, vá em **Supabase Dashboard > Authentication > Users**

### 3. Login e Seleção de Tenant

1. Faça login em `/auth`
2. Se pertencer a múltiplos tenants, será direcionado para `/select-tenant`
3. Escolha a organização desejada
4. Você será redirecionado ao Dashboard

---

## 👥 Gestão de Usuários e Roles

### Acessar Gestão de Usuários

1. No menu lateral, clique em **Usuários**
2. Apenas `tenant_admin` ou `superadmin` têm acesso

### Convidar Novo Usuário

1. Clique em **Adicionar Usuário**
2. Informe o email do usuário
3. Selecione o role desejado:
   - `tenant_user` - Acesso básico
   - `tenant_admin` - Administrador do tenant

> ⚠️ O usuário precisa criar uma conta primeiro em `/auth`. Depois você adiciona a membership.

### Adicionar Membership via SQL

```sql
-- Adicionar usuário existente a um tenant
INSERT INTO public.memberships (tenant_id, user_id, role)
VALUES (
  'ID_DO_TENANT',
  'ID_DO_USUARIO',
  'tenant_user'  -- ou 'tenant_admin'
);
```

### Alterar Role de Usuário

```sql
UPDATE public.memberships
SET role = 'tenant_admin'
WHERE tenant_id = 'ID_DO_TENANT' AND user_id = 'ID_DO_USUARIO';
```

### Remover Usuário do Tenant

```sql
DELETE FROM public.memberships
WHERE tenant_id = 'ID_DO_TENANT' AND user_id = 'ID_DO_USUARIO';
```

---

## 🏢 Gestão de Tenants

### Acessar Painel SuperAdmin

1. Apenas usuários com role `superadmin` têm acesso
2. Acesse `/superadmin` ou clique em **Super Admin** no menu

### Criar Novo Tenant

```sql
INSERT INTO public.tenants (name, status)
VALUES ('Nome da Nova Organização', 'active');
```

### Suspender Tenant

```sql
UPDATE public.tenants
SET status = 'suspended'
WHERE id = 'ID_DO_TENANT';
```

### Reativar Tenant

```sql
UPDATE public.tenants
SET status = 'active'
WHERE id = 'ID_DO_TENANT';
```

---

## 📊 Data Sources (Fontes de Dados)

Data Sources são as fontes de dados que alimentam suas views e widgets.

### Tipos Suportados

| Tipo | Descrição |
|------|-----------|
| `supabase_table` | Consulta direta a uma tabela do Supabase |
| `n8n_http` | Webhook/API externa (ex: n8n, Make, Zapier) |

### Acessar Data Sources

1. No menu lateral, clique em **Data Sources**
2. Você verá a lista de fontes configuradas

### Criar Data Source - Supabase Table

1. Clique em **Novo Data Source**
2. Preencha:
   - **Nome**: Nome descritivo (ex: "Vendas do Mês")
   - **Tipo**: Supabase Table
   - **Tabela**: Nome da tabela no banco (ex: "orders")
   - **Colunas**: Quais colunas buscar (deixe vazio para todas)

**Exemplo de configuração:**

```json
{
  "table_name": "orders",
  "columns": ["id", "customer_name", "total", "created_at"]
}
```

### Criar Data Source - HTTP/Webhook

1. Clique em **Novo Data Source**
2. Preencha:
   - **Nome**: Nome descritivo
   - **Tipo**: n8n HTTP
   - **URL**: URL do webhook
   - **Método**: GET ou POST
   - **Headers**: Headers customizados (opcional)

**Exemplo de configuração:**

```json
{
  "url": "https://seu-n8n.com/webhook/abc123",
  "method": "GET",
  "headers": {
    "Authorization": "Bearer seu-token"
  }
}
```

### Testar Data Source

1. Na lista de data sources, clique no botão de teste (ícone de play)
2. Verifique se os dados retornam corretamente
3. Se houver erro, revise a configuração

### Usar Parâmetros em Data Sources

Para data sources HTTP, você pode passar parâmetros dinâmicos:

```
URL base: https://api.exemplo.com/vendas
Com params: https://api.exemplo.com/vendas?mes=01&ano=2025
```

Configure filtros na página para passar esses parâmetros automaticamente.

---

## 📄 Views (Páginas Dinâmicas)

Views são páginas construídas visualmente que exibem dados do data source.

### Acessar Views

1. No menu lateral, clique em **Views**
2. Você verá a lista de páginas criadas

### Criar Nova View

1. Clique em **Nova Página**
2. Preencha:
   - **Título**: Nome da página
   - **Slug**: URL amigável (ex: "relatorio-vendas")
   - **Data Source**: Fonte de dados principal (opcional)
   - **Status**: Draft ou Published

### Editor de Views (Elementor-like)

O editor possui 3 colunas:

| Coluna | Função |
|--------|--------|
| **Esquerda** | Paleta de blocos disponíveis |
| **Centro** | Canvas onde você monta a página |
| **Direita** | Propriedades do bloco selecionado |

### Blocos Disponíveis

| Bloco | Descrição |
|-------|-----------|
| **Título (Heading)** | Títulos H1-H4 |
| **Texto (Text)** | Parágrafo de texto |
| **Tabela (Table)** | Tabela de dados com colunas configuráveis |
| **KPI** | Métrica única com agregação |
| **Gráfico (Chart)** | Gráficos de barra, linha ou pizza |

### Adicionar Bloco

1. Na paleta esquerda, clique no bloco desejado
2. O bloco será adicionado ao canvas
3. Clique no bloco para editar propriedades

### Configurar Data Binding

Para blocos que exibem dados (Tabela, KPI, Gráfico):

1. Selecione o bloco no canvas
2. No painel direito, ative **Data Binding**
3. Configure:
   - **Campo**: Qual campo do data source usar
   - **Agregação** (para KPI): sum, avg, count, min, max
   - **Label/Value Fields** (para gráfico)

**Exemplo - Tabela com Data Binding:**

```json
{
  "type": "table",
  "props": {
    "title": "Vendas",
    "columns": [
      { "key": "customer_name", "label": "Cliente" },
      { "key": "total", "label": "Valor" },
      { "key": "created_at", "label": "Data" }
    ],
    "dataBinding": {
      "enabled": true
    }
  }
}
```

**Exemplo - KPI com Agregação:**

```json
{
  "type": "kpi",
  "props": {
    "title": "Total de Vendas",
    "dataBinding": {
      "enabled": true,
      "field": "total",
      "aggregation": "sum"
    },
    "format": "currency",
    "prefix": "R$"
  }
}
```

### Configurar Filtros

Para páginas que precisam de parâmetros:

1. Ative **Filtros** nas configurações da página
2. Adicione parâmetros de filtro:
   - **Key**: Nome do parâmetro (ex: "mes")
   - **Label**: Rótulo exibido (ex: "Mês")
   - **Tipo**: text, date ou select
   - **Opções**: Para tipo select, liste as opções

Os filtros serão exibidos no topo da página e passados ao data source.

### Salvar e Publicar

1. Clique em **Salvar** para salvar como rascunho
2. Clique em **Publicar** para disponibilizar aos usuários
3. Apenas páginas publicadas aparecem no menu para `tenant_user`

### Visualizar Página

- **Preview no editor**: Veja o resultado no canvas
- **Acessar publicada**: Vá em Views e clique no ícone de visualizar
- **URL direta**: `/view/{slug}`

---

## 📈 Dashboard e Widgets

O Dashboard é a página inicial após login, composto por widgets.

### Acessar Dashboard

1. Faça login
2. Você será direcionado automaticamente ao `/dashboard`

### Tipos de Widget

| Tipo | Descrição |
|------|-----------|
| **KPI** | Métrica única com ícone e valor |
| **Table** | Tabela compacta de dados |
| **Chart** | Gráfico (bar, line, pie, area) |
| **List** | Lista de itens |

### Adicionar Widget

1. No dashboard, clique em **Adicionar Widget**
2. Preencha:
   - **Título**: Nome do widget
   - **Tipo**: KPI, Table, Chart ou List
   - **Data Source**: Fonte de dados
   - **Configuração**: Campos específicos do tipo

### Configurar Widget KPI

```json
{
  "valueField": "total",
  "aggregation": "sum",
  "prefix": "R$",
  "suffix": ""
}
```

### Configurar Widget Chart

```json
{
  "chartType": "bar",
  "xField": "month",
  "yField": "revenue"
}
```

### Configurar Widget Table

```json
{
  "columns": ["name", "email", "status"],
  "pageSize": 5
}
```

### Reordenar Widgets

1. Arraste os widgets para reordenar
2. A ordem é salva automaticamente

---

## 🎨 Personalização Visual (Branding)

Cada tenant pode personalizar as cores e fontes do sistema.

### Acessar Configurações de Marca

1. No menu, vá em **Configurações > Marca** ou acesse `/settings/brand`
2. Apenas `tenant_admin` ou superior tem acesso

### Opções de Personalização

| Opção | Descrição |
|-------|-----------|
| **Cor Primária** | Cor principal (botões, links, ícones ativos) |
| **Cor Secundária** | Cor de destaque |
| **Cor de Fundo** | Background das páginas |
| **Cor do Card** | Fundo dos cards e sidebar |
| **Cor de Texto** | Texto principal |
| **Cor Muted** | Texto secundário/desabilitado |
| **Cor de Borda** | Bordas de cards e inputs |
| **Fonte** | Família de fonte (Inter, Poppins, etc.) |
| **Arredondamento** | Raio das bordas (sm, md, lg) |
| **Sombra** | Ativar/desativar sombras |
| **Logo URL** | URL do logo do tenant |

### Usar o Preview

- À direita da página, veja um preview ao vivo das mudanças
- O preview mostra sidebar, header, cards e botões

### Salvar Personalização

1. Ajuste as cores e opções desejadas
2. Clique em **Salvar Branding**
3. As mudanças serão aplicadas imediatamente em todo o app

### Restaurar Padrão

1. Clique em **Restaurar Padrão Nexus**
2. Todas as customizações serão removidas
3. O tema voltará ao padrão do sistema

### Dark Mode

1. Use o toggle no header para alternar entre Light/Dark
2. A preferência é salva por tenant
3. Opções: Light, Dark ou System (segue preferência do navegador)

---

## 📝 Auditoria e Logs

O sistema registra ações importantes para auditoria.

### O que é Registrado

- Criação/atualização/exclusão de data sources
- Criação/atualização/exclusão de páginas
- Publicação de páginas
- Mudanças em widgets
- Alterações de branding
- Gestão de usuários

### Acessar Logs

Os logs podem ser consultados via SQL:

```sql
SELECT 
  al.created_at,
  al.action,
  al.entity,
  al.entity_id,
  al.metadata_json
FROM audit_logs al
WHERE al.tenant_id = 'SEU_TENANT_ID'
ORDER BY al.created_at DESC
LIMIT 100;
```

### Estrutura do Log

```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "actor_user_id": "uuid",
  "action": "page_published",
  "entity": "page",
  "entity_id": "uuid-da-pagina",
  "metadata_json": {
    "title": "Relatório de Vendas",
    "version": 3
  },
  "created_at": "2025-01-15T10:30:00Z"
}
```

---

## 🔧 Referência Técnica

### Estrutura de Pastas

```
src/
├── components/
│   ├── nexus/          # UI Kit Nexus
│   ├── builder/        # Componentes do editor de views
│   ├── dashboard/      # Componentes do dashboard
│   └── ui/             # Componentes base (shadcn)
├── contexts/
│   ├── AuthContext     # Autenticação
│   ├── TenantContext   # Tenant atual
│   └── ThemeContext    # Tema e branding
├── hooks/
│   ├── useRoles        # Verificação de permissões
│   ├── useDataSources  # CRUD de data sources
│   ├── usePages        # CRUD de views/páginas
│   ├── useDashboard    # Widgets do dashboard
│   └── useBranding     # Branding do tenant
├── pages/
│   ├── Auth            # Login/Signup
│   ├── Dashboard       # Página inicial
│   ├── Views           # Lista de views
│   ├── PageEditor      # Editor de views
│   ├── DataSources     # Gestão de data sources
│   ├── Users           # Gestão de usuários
│   ├── Settings        # Configurações
│   ├── BrandSettings   # Personalização visual
│   └── SuperAdmin      # Painel global
└── types/
    ├── auth.ts         # Tipos de autenticação
    ├── builder.ts      # Tipos do page builder
    └── dashboard.ts    # Tipos do dashboard
```

### Hooks Principais

#### useAuth
```typescript
const { user, session, loading, signIn, signUp, signOut } = useAuth();
```

#### useTenant
```typescript
const { 
  currentTenant,      // Tenant selecionado
  currentMembership,  // Membership do usuário
  userTenants,        // Todos os tenants do usuário
  setCurrentTenant,   // Trocar tenant
  refetchTenants      // Recarregar
} = useTenant();
```

#### useRoles
```typescript
const { 
  isSuperAdmin,   // boolean
  isTenantAdmin,  // boolean
  isTenantUser,   // boolean
  currentRole,    // 'superadmin' | 'tenant_admin' | 'tenant_user'
  hasRole,        // (role) => boolean
  hasMinRole      // (minRole) => boolean
} = useRoles();
```

#### useDataSources
```typescript
const {
  dataSources,       // Lista de data sources
  loading,
  createDataSource,  // (data) => Promise
  updateDataSource,  // (id, data) => Promise
  deleteDataSource,  // (id) => Promise
  testDataSource     // (ds) => Promise<{ data, error }>
} = useDataSources();
```

#### usePages
```typescript
const {
  pages,          // Lista de páginas
  loading,
  createPage,     // (data) => Promise
  updatePage,     // (id, data) => Promise
  deletePage,     // (id) => Promise
  publishPage     // (id) => Promise
} = usePages();
```

### Verificar Permissões no Código

```typescript
import { useRoles } from '@/hooks/useRoles';

function MeuComponente() {
  const { isTenantAdmin, hasMinRole } = useRoles();

  // Verificar se é admin
  if (!isTenantAdmin) {
    return <p>Acesso negado</p>;
  }

  // Verificar role mínima
  if (!hasMinRole('tenant_admin')) {
    return null;
  }

  return <div>Conteúdo restrito</div>;
}
```

### Proteger Rotas

```typescript
// Em App.tsx
<Route 
  path="/users" 
  element={
    <ProtectedRoute minRole="tenant_admin">
      <Users />
    </ProtectedRoute>
  } 
/>
```

### Schema de Página (schema_json)

```typescript
interface PageSchema {
  blocks: Block[];
}

interface Block {
  id: string;
  type: 'heading' | 'text' | 'table' | 'kpi' | 'chart';
  order: number;
  props: { ... };
}
```

### Tokens de Branding (tokens_json)

```typescript
interface BrandingTokens {
  primary?: string;      // Cor HEX
  secondary?: string;
  bg?: string;
  card?: string;
  text?: string;
  muted?: string;
  border?: string;
  font?: string;         // Nome da fonte
  radius?: 'sm' | 'md' | 'lg';
  shadow?: boolean;
}
```

---

## ❓ FAQ

### Como encontrar meu user_id?

1. Acesse o Supabase Dashboard
2. Vá em Authentication > Users
3. Copie o ID do seu usuário

### Minha página não aparece no menu

- Verifique se a página está **publicada** (status = 'published')
- Verifique se você tem permissão no tenant correto

### Data source retorna erro

1. Teste a conexão pelo botão de teste
2. Para Supabase Table: verifique se a tabela existe e tem RLS configurada
3. Para HTTP: verifique URL, método e headers

### Esqueci minha senha

1. Vá em `/auth`
2. Use a opção "Esqueci minha senha" (se implementada)
3. Ou peça ao admin resetar via Supabase Dashboard

### Como sair de um tenant?

Não é possível sair voluntariamente. Um `tenant_admin` ou `superadmin` precisa remover sua membership.

---

## 📞 Suporte

Para dúvidas técnicas ou problemas:

1. Verifique os logs de auditoria
2. Consulte o console do navegador para erros
3. Verifique os logs do Supabase Edge Functions
4. Entre em contato com o administrador do sistema

---

*Documentação atualizada em Fevereiro de 2026*
