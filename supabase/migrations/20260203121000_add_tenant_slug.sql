alter table public.tenants
  add column if not exists slug text;

update public.tenants
set slug = lower(regexp_replace(name, '[^a-z0-9]+', '-', 'g')) || '-' || substr(id::text, 1, 6)
where slug is null or slug = '';
