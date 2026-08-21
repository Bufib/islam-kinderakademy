-- Ein Adminprofil bleibt zusätzlich ein vollwertiges Elternprofil. Die
-- Administration ist eine zusätzliche Rolle und ersetzt die Elternrolle nicht.

insert into public.user_roles (profile_id, role)
select admin_role.profile_id, 'parent'
from public.user_roles as admin_role
where admin_role.role = 'admin'
on conflict (profile_id, role) do nothing;

create or replace function public.ensure_parent_role_for_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role = 'admin' then
    insert into public.user_roles (profile_id, role)
    values (new.profile_id, 'parent')
    on conflict (profile_id, role) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists ensure_parent_role_for_admin_after_write
on public.user_roles;

create trigger ensure_parent_role_for_admin_after_write
after insert or update of profile_id, role on public.user_roles
for each row execute procedure public.ensure_parent_role_for_admin();

-- Die bisherige Funktion setzte genau eine Rolle. Bei Admins werden nun
-- Eltern- und Adminrolle gemeinsam gespeichert. Die Kontenübersicht behandelt
-- admin weiterhin als die primäre Rolle.
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
    select 1
    from public.profiles as profile_row
    where profile_row.id = target_profile_id
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

  if next_role = 'admin' then
    insert into public.user_roles (profile_id, role)
    values
      (target_profile_id, 'parent'),
      (target_profile_id, 'admin')
    on conflict (profile_id, role) do nothing;
  else
    insert into public.user_roles (profile_id, role)
    values (target_profile_id, next_role);
  end if;
end;
$$;

revoke all on function public.ensure_parent_role_for_admin() from public;
revoke all on function public.set_profile_primary_role(bigint, text) from public;

grant execute on function public.set_profile_primary_role(bigint, text)
to authenticated;
