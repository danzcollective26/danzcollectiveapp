-- Minimal local-only platform fixture. Does not implement Supabase services.
-- Seven DANZ tables/policies/constraints come from baseline.sql unmodified.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create schema storage;
grant usage on schema public,auth,storage to anon,authenticated,service_role;

-- Only the auth.users foreign-key target is needed; no real accounts/emails.
create table auth.users (id uuid primary key);

-- Exact auth.uid definition inspected in the hosted project's pg_proc.
create or replace function auth.uid()
returns uuid language sql stable as $function$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$function$;

-- Storage service uses bucket_id/name; no real file bytes or HTTP API here.
create table storage.buckets (id text primary key, public boolean not null default false);
insert into storage.buckets values ('danz-event-photos',false);
create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null,
  name text not null,
  unique(bucket_id,name)
);
alter table storage.objects enable row level security;
-- Hosted metadata confirmed authenticated SELECT and storage USAGE.
-- All object privileges are granted here so missing write policies, rather
-- than absence of table privileges, deny object writes in the local tests.
grant all on storage.objects to anon,authenticated,service_role;
