# SaaS Multi-Tenant

Sistema SaaS multi-tenant com Supabase.

## Estrutura

- **Banco de dados**: Supabase Postgres com RLS
- **Auth**: Supabase Auth
- **Multi-tenancy**: Isolamento por `tenant_id` em todas as tabelas

## Tabelas

- `tenants`: Organizações
- `memberships`: Vínculo usuário-tenant com role
- `audit_logs`: Logs de auditoria

## Roles

- `superadmin`: Acesso global
- `tenant_admin`: Admin do tenant
- `tenant_user`: Usuário comum

## Rotas

- `/auth` - Login/Signup
- `/select-tenant` - Seleção de organização
- `/dashboard` - Dashboard principal
- `/users` - Gerenciamento de usuários (tenant_admin+)
- `/superadmin` - Painel global (superadmin only)

## Variáveis de Ambiente

```
SUPABASE_URL=https://xgpfgjseiogrghvbypqb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=<seu_service_role_key>
```

## Seed Inicial

Para criar o primeiro tenant e superadmin, execute no SQL Editor do Supabase:

```sql
-- 1. Primeiro, crie uma conta via /auth
-- 2. Depois, execute este SQL substituindo o USER_ID:

-- Criar tenant inicial
INSERT INTO public.tenants (id, name, status)
VALUES ('00000000-0000-0000-0000-000000000001', 'Organização Principal', 'active');

-- Vincular seu usuário como superadmin (substitua SEU_USER_ID)
INSERT INTO public.memberships (tenant_id, user_id, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'SEU_USER_ID', 'superadmin');
```

## RLS (Row Level Security)

Todas as tabelas têm RLS ativo com políticas que garantem:
- Usuário só vê dados dos tenants que pertence
- Superadmin tem acesso global
- tenant_admin pode gerenciar memberships do seu tenant
