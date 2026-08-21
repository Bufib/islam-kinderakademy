-- Elternänderungen und Admin-Freigaben werden pro Kind in derselben
-- Sperrreihenfolge serialisiert. So bleiben parallele Anfragen deterministisch
-- und können sich nicht gegenseitig blockieren.

create or replace function public.save_child_with_time_group_request(
  target_child_id bigint,
  child_display_name text,
  child_birth_date date,
  child_age_group_id bigint,
  child_gender text,
  child_avatar_key text,
  requested_group_id bigint
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_parent_profile_id bigint;
  saved_child_id bigint;
  requested_group_age_group_id bigint;
  target_membership_id bigint;
  target_membership_status text;
begin
  current_parent_profile_id := public.current_profile_id();

  if current_parent_profile_id is null or not public.has_account_role('parent') then
    raise exception 'A parent account is required';
  end if;

  child_display_name := nullif(trim(child_display_name), '');
  child_avatar_key := nullif(trim(child_avatar_key), '');

  if child_display_name is null or char_length(child_display_name) > 120 then
    raise exception 'A valid child display name is required';
  end if;

  if child_gender is null or child_gender not in ('male', 'female') then
    raise exception 'A valid child gender is required';
  end if;

  if not exists (
    select 1
    from public.age_groups as age_group
    where age_group.id = child_age_group_id
  ) then
    raise exception 'Age group not found';
  end if;

  select time_group.age_group_id
  into requested_group_age_group_id
  from public.groups as time_group
  join public.academy_years as academy_year
    on academy_year.id = time_group.academy_year_id
  where time_group.id = requested_group_id
    and academy_year.is_active
  for share of time_group, academy_year;

  if requested_group_age_group_id is null then
    raise exception 'Active time group not found';
  end if;

  if requested_group_age_group_id <> child_age_group_id then
    raise exception 'Child and time group must use the same age group';
  end if;

  if target_child_id is null then
    insert into public.children (
      parent_profile_id,
      display_name,
      birth_date,
      age_group_id,
      gender,
      avatar_key
    )
    values (
      current_parent_profile_id,
      child_display_name,
      child_birth_date,
      child_age_group_id,
      child_gender,
      child_avatar_key
    )
    returning id into saved_child_id;

    perform pg_advisory_xact_lock(saved_child_id);
  else
    select child.id
    into saved_child_id
    from public.children as child
    where child.id = target_child_id
      and child.parent_profile_id = current_parent_profile_id;

    if saved_child_id is null then
      raise exception 'Child profile not found';
    end if;

    perform pg_advisory_xact_lock(saved_child_id);

    update public.children as child
    set display_name = child_display_name,
        birth_date = child_birth_date,
        age_group_id = child_age_group_id,
        gender = child_gender,
        avatar_key = child_avatar_key
    where child.id = saved_child_id
      and child.parent_profile_id = current_parent_profile_id
    returning child.id into saved_child_id;

    if saved_child_id is null then
      raise exception 'Child profile not found';
    end if;
  end if;

  select membership.id, membership.membership_status
  into target_membership_id, target_membership_status
  from public.group_members as membership
  where membership.child_id = saved_child_id
    and membership.group_id = requested_group_id
  order by membership.requested_at desc, membership.id desc
  limit 1;

  update public.group_members
  set membership_status = 'cancelled',
      reviewed_at = now(),
      reviewed_by_profile_id = null
  where child_id = saved_child_id
    and (group_id <> requested_group_id or id is distinct from target_membership_id)
    and membership_status in ('pending', 'approved');

  if target_membership_status is distinct from 'approved' then
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
        requested_group_id,
        saved_child_id,
        'pending',
        now(),
        null,
        null
      );
    else
      update public.group_members
      set membership_status = 'pending',
          requested_at = now(),
          reviewed_at = null,
          reviewed_by_profile_id = null
      where id = target_membership_id;
    end if;
  end if;

  return saved_child_id;
end;
$$;

create or replace function public.review_time_group_request(
  target_group_member_id bigint,
  review_decision text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  reviewer_profile_id bigint;
  requested_child_id bigint;
  child_age_group_id bigint;
  requested_group_age_group_id bigint;
  requested_group_year_is_active boolean;
begin
  if not public.has_account_role('admin') then
    raise exception 'Admin role required';
  end if;

  if review_decision is null or review_decision not in ('approved', 'rejected') then
    raise exception 'Review decision must be approved or rejected';
  end if;

  reviewer_profile_id := public.current_profile_id();

  select membership.child_id
  into requested_child_id
  from public.group_members as membership
  where membership.id = target_group_member_id
    and membership.membership_status = 'pending';

  if requested_child_id is null then
    raise exception 'Pending time group request not found';
  end if;

  perform pg_advisory_xact_lock(requested_child_id);

  select
    membership.child_id,
    child.age_group_id,
    time_group.age_group_id,
    academy_year.is_active
  into
    requested_child_id,
    child_age_group_id,
    requested_group_age_group_id,
    requested_group_year_is_active
  from public.group_members as membership
  join public.children as child on child.id = membership.child_id
  join public.groups as time_group on time_group.id = membership.group_id
  join public.academy_years as academy_year
    on academy_year.id = time_group.academy_year_id
  where membership.id = target_group_member_id
    and membership.membership_status = 'pending'
  for update of membership
  for share of child, time_group, academy_year;

  if requested_child_id is null then
    raise exception 'Pending time group request not found';
  end if;

  if review_decision = 'approved' then
    if not requested_group_year_is_active then
      raise exception 'The time group academy year is not active';
    end if;

    if child_age_group_id <> requested_group_age_group_id then
      raise exception 'Child and time group must use the same age group';
    end if;

    update public.group_members
    set membership_status = 'cancelled',
        reviewed_at = now(),
        reviewed_by_profile_id = reviewer_profile_id
    where child_id = requested_child_id
      and id <> target_group_member_id
      and membership_status in ('pending', 'approved');
  end if;

  update public.group_members
  set membership_status = review_decision,
      reviewed_at = now(),
      reviewed_by_profile_id = reviewer_profile_id
  where id = target_group_member_id;

  return target_group_member_id;
end;
$$;

revoke all on function public.save_child_with_time_group_request(
  bigint, text, date, bigint, text, text, bigint
) from public;
revoke all on function public.review_time_group_request(bigint, text) from public;

grant execute on function public.save_child_with_time_group_request(
  bigint, text, date, bigint, text, text, bigint
) to authenticated;
grant execute on function public.review_time_group_request(bigint, text)
to authenticated;
