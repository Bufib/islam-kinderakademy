-- Stellt sicher, dass jedes Auth-Konto ein fachliches Profil und mindestens eine Rolle besitzt.
-- Das schließt auch Konten ein, die vor dem Auth-Trigger angelegt wurden.

insert into public.profiles (auth_user_id, display_name)
select
  user_row.id,
  coalesce(
    nullif(trim(user_row.raw_user_meta_data ->> 'display_name'), ''),
    split_part(coalesce(user_row.email, 'Mein Konto'), '@', 1)
  )
from auth.users as user_row
where not exists (
  select 1
  from public.profiles as profile_row
  where profile_row.auth_user_id = user_row.id
);

insert into public.user_roles (profile_id, role)
select profile_row.id, 'parent'
from public.profiles as profile_row
where not exists (
  select 1
  from public.user_roles as role_row
  where role_row.profile_id = profile_row.id
)
on conflict (profile_id, role) do nothing;

create or replace function public.ensure_current_profile()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_auth_user auth.users%rowtype;
  ensured_profile_id bigint;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  select *
  into current_auth_user
  from auth.users
  where id = (select auth.uid());

  if current_auth_user.id is null then
    raise exception 'Auth user not found';
  end if;

  insert into public.profiles (auth_user_id, display_name)
  values (
    current_auth_user.id,
    coalesce(
      nullif(trim(current_auth_user.raw_user_meta_data ->> 'display_name'), ''),
      split_part(coalesce(current_auth_user.email, 'Mein Konto'), '@', 1)
    )
  )
  on conflict (auth_user_id) do update
  set auth_user_id = excluded.auth_user_id
  returning id into ensured_profile_id;

  if not exists (
    select 1
    from public.user_roles as role_row
    where role_row.profile_id = ensured_profile_id
  ) then
    insert into public.user_roles (profile_id, role)
    values (ensured_profile_id, 'parent')
    on conflict (profile_id, role) do nothing;
  end if;

  return ensured_profile_id;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_profile_id bigint;
begin
  insert into public.profiles (auth_user_id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(coalesce(new.email, 'Mein Konto'), '@', 1)
    )
  )
  on conflict (auth_user_id) do update
  set auth_user_id = excluded.auth_user_id
  returning id into new_profile_id;

  insert into public.user_roles (profile_id, role)
  values (new_profile_id, 'parent')
  on conflict (profile_id, role) do nothing;

  return new;
end;
$$;

revoke all on function public.ensure_current_profile() from public;
grant execute on function public.ensure_current_profile() to authenticated;
