-- Read-only public member card; protect the private verification table.
-- An authenticated member can see ONLY a deliberately published, verified Instagram.
create or replace function danz_private.visible_instagram_card(p_user uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  member_id uuid := (select auth.uid());
  result jsonb;
begin
  if member_id is null or p_user is null then
    return null;
  end if;
  select jsonb_build_object(
      'userId', p.user_id,
      'name', p.display_name,
      'handle', l.handle
  ) into result
  from public.danz_profiles p
  join danz_private.instagram_links l on l.user_id = p.user_id
  where p.user_id = p_user
    and p.instagram_public is true
    and l.status = 'verified'
    and l.verified_at is not null
    and lower(coalesce(p.instagram_handle, '')) = l.handle
    and l.handle ~ '^[a-z0-9_.]{1,30}$'
  limit 1;
  return result;
end;
$$;

revoke all on function danz_private.visible_instagram_card(uuid) from public, anon;
grant execute on function danz_private.visible_instagram_card(uuid) to authenticated;

create or replace function public.danz_public_instagram_card(p_user uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$ select danz_private.visible_instagram_card(p_user) $$;

revoke all on function public.danz_public_instagram_card(uuid) from public, anon;
grant execute on function public.danz_public_instagram_card(uuid) to authenticated;
