alter table public.pages
  add column if not exists icon text;

update public.pages
set icon = 'file'
where icon is null;
