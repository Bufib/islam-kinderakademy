-- Sichere Admin-Funktionen für Kontenübersicht und Rollenverwaltung.

create or replace function public.list_admin_accounts()
returns table (
  profile_id bigint,
  display_name text,
  email text,
  account_role text,
  profile_created_at timestamp without time zone
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_account_role('admin') then
    raise exception 'Admin role required';
  end if;

  return query
  select
    profile_row.id,
    profile_row.display_name,
    auth_user.email::text,
    case
      when exists (
        select 1 from public.user_roles as admin_role
        where admin_role.profile_id = profile_row.id and admin_role.role = 'admin'
      ) then 'admin'
      when exists (
        select 1 from public.user_roles as teacher_role
        where teacher_role.profile_id = profile_row.id and teacher_role.role = 'teacher'
      ) then 'teacher'
      else 'parent'
    end,
    profile_row.created_at
  from public.profiles as profile_row
  join auth.users as auth_user on auth_user.id = profile_row.auth_user_id
  order by profile_row.created_at desc, profile_row.id desc;
end;
$$;

create or replace function public.set_profile_primary_role(
  target_profile_id bigint,
  next_role text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_profile_id bigint;
  admin_count bigint;
begin
  if not public.has_account_role('admin') then
    raise exception 'Admin role required';
  end if;

  if next_role not in ('parent', 'teacher', 'admin') then
    raise exception 'Invalid account role';
  end if;

  if not exists (
    select 1 from public.profiles as profile_row where profile_row.id = target_profile_id
  ) then
    raise exception 'Profile not found';
  end if;

  caller_profile_id := public.current_profile_id();

  if caller_profile_id = target_profile_id
     and public.has_account_role('admin')
     and next_role <> 'admin' then
    select count(distinct role_row.profile_id)
    into admin_count
    from public.user_roles as role_row
    where role_row.role = 'admin';

    if admin_count <= 1 then
      raise exception 'The last admin cannot remove their own admin role';
    end if;
  end if;

  delete from public.user_roles as role_row
  where role_row.profile_id = target_profile_id;

  insert into public.user_roles (profile_id, role)
  values (target_profile_id, next_role);
end;
$$;

revoke all on function public.list_admin_accounts() from public;
revoke all on function public.set_profile_primary_role(bigint, text) from public;

grant execute on function public.list_admin_accounts() to authenticated;
grant execute on function public.set_profile_primary_role(bigint, text) to authenticated;
