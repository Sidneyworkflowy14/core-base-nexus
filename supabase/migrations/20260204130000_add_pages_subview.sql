alter table public.pages
  add column if not exists parent_page_id uuid references public.pages(id) on delete set null;

create index if not exists pages_parent_page_id_idx on public.pages(parent_page_id);
