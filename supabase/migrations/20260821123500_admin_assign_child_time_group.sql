-- Admins dürfen ein bereits freigeschaltetes Kind direkt in eine andere
-- passende Zeitgruppe verschieben. Die neue Zuordnung ist sofort genehmigt;
-- ältere Freigaben und noch offene Anfragen des Kindes werden beendet.

create or replace function public.admin_assign_child_time_group(
  target_child_id bigint,
  target_group_id bigint
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  reviewer_profile_id bigint;
  child_age_group_id bigint;
  target_group_age_group_id bigint;
  target_membership_id bigint;
begin
  if not public.has_account_role('admin') then
    raise exception 'Admin role required';
  end if;

  reviewer_profile_id := public.current_profile_id();

  perform pg_advisory_xact_lock(target_child_id);

  select child.age_group_id
  into child_age_group_id
  from public.children as child
  where child.id = target_child_id
  for share of child;

  if child_age_group_id is null then
    raise exception 'Child profile not found';
  end if;

  select time_group.age_group_id
  into target_group_age_group_id
  from public.groups as time_group
  join public.academy_years as academy_year
    on academy_year.id = time_group.academy_year_id
  where time_group.id = target_group_id
    and academy_year.is_active
  for share of time_group, academy_year;

  if target_group_age_group_id is null then
    raise exception 'Active time group not found';
  end if;

  if child_age_group_id <> target_group_age_group_id then
    raise exception 'Child and time group must use the same age group'
      using errcode = '23514';
  end if;

  select membership.id
  into target_membership_id
  from public.group_members as membership
  where membership.child_id = target_child_id
    and membership.group_id = target_group_id
  order by membership.requested_at desc, membership.id desc
  limit 1
  for update;

  update public.group_members
  set membership_status = 'cancelled',
      reviewed_at = now(),
      reviewed_by_profile_id = reviewer_profile_id
  where child_id = target_child_id
    and id is distinct from target_membership_id
    and membership_status in ('pending', 'approved');

  if target_membership_id is null then
    insert into public.group_members (
      group_id,
      child_id,
      membership_status,
      requested_at,
      reviewed_at,
      reviewed_by_profile_id
    )
    values (
      target_group_id,
      target_child_id,
      'approved',
      now(),
      now(),
      reviewer_profile_id
    )
    returning id into target_membership_id;
  else
    update public.group_members
    set membership_status = 'approved',
        requested_at = now(),
        reviewed_at = now(),
        reviewed_by_profile_id = reviewer_profile_id
    where id = target_membership_id;
  end if;

  return target_membership_id;
end;
$$;

revoke all on function public.admin_assign_child_time_group(bigint, bigint)
from public;

grant execute on function public.admin_assign_child_time_group(bigint, bigint)
to authenticated;
