-- NOT APPLIED. No ejecutar en el proyecto alojado hasta que el propietario lo apruebe.
-- Guarda solo el dibujo del cabezón, en la fila del propio usuario. No hay columna para la foto original.

begin;

insert into storage.buckets (id, public)
values ('kart-heads', false)
on conflict (id) do update set public = false;

create table if not exists public.kart_heads (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 24),
  storage_path text not null check (storage_path = (user_id::text || '/' || id::text || '.png')),
  created_at timestamptz not null default now(),
  unique (storage_path)
);

alter table public.kart_heads enable row level security;
revoke all on public.kart_heads from public, anon;
grant select, insert, update, delete on public.kart_heads to authenticated;

create policy "own kart head read" on public.kart_heads
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "own kart head insert" on public.kart_heads
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own kart head update" on public.kart_heads
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own kart head delete" on public.kart_heads
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "own kart head objects read" on storage.objects
  for select to authenticated using (
    bucket_id = 'kart-heads'
    and name = ((select auth.uid())::text || '/' || split_part(name, '/', 2))
    and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.png$'
  );
create policy "own kart head objects insert" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'kart-heads'
    and name = ((select auth.uid())::text || '/' || split_part(name, '/', 2))
    and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.png$'
  );
create policy "own kart head objects update" on storage.objects
  for update to authenticated using (bucket_id = 'kart-heads' and name like ((select auth.uid())::text || '/%'))
  with check (bucket_id = 'kart-heads' and name = ((select auth.uid())::text || '/' || split_part(name, '/', 2)));
create policy "own kart head objects delete" on storage.objects
  for delete to authenticated using (
    bucket_id = 'kart-heads' and name like ((select auth.uid())::text || '/%')
  );

commit;
