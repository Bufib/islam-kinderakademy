-- Altersgruppenwechsel an Zeitgruppen und Lernreisen dürfen bestehende
-- Zuordnungen beziehungsweise gruppenspezifische Termine nicht inkonsistent
-- machen.

do $$
begin
  if exists (
    select 1
    from public.group_members as membership
    join public.children as child on child.id = membership.child_id
    join public.groups as time_group on time_group.id = membership.group_id
    where membership.membership_status in ('pending', 'approved')
      and child.age_group_id <> time_group.age_group_id
  ) then
    raise exception 'Active time group memberships with mismatching age groups must be corrected first';
  end if;

  if exists (
    select 1
    from public.live_sessions as live_session
    join public.groups as time_group on time_group.id = live_session.group_id
    join public.lessons as lesson on lesson.id = live_session.lesson_id
    join public.learning_journeys as journey
      on journey.id = lesson.learning_journey_id
    where journey.age_group_id <> time_group.age_group_id
       or journey.academy_year_id <> time_group.academy_year_id
  ) then
    raise exception 'Live sessions with mismatching lesson and time group ages must be corrected first';
  end if;
end;
$$;

create or replace function public.prevent_used_time_group_age_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.age_group_id is distinct from old.age_group_id
    or new.academy_year_id is distinct from old.academy_year_id then
    if exists (
      select 1
      from public.group_members as membership
      where membership.group_id = old.id
        and membership.membership_status in ('pending', 'approved')
    ) then
      raise exception 'A time group with active memberships cannot change its age group';
    end if;

    if exists (
      select 1
      from public.live_sessions as live_session
      where live_session.group_id = old.id
    ) then
      raise exception 'A time group with live sessions cannot change its age group';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_used_time_group_age_change
on public.groups;

create trigger prevent_used_time_group_age_change
before update of age_group_id, academy_year_id on public.groups
for each row execute procedure public.prevent_used_time_group_age_change();

create or replace function public.prevent_scheduled_journey_age_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (
    new.age_group_id is distinct from old.age_group_id
    or new.academy_year_id is distinct from old.academy_year_id
  )
    and exists (
      select 1
      from public.lessons as lesson
      join public.live_sessions as live_session
        on live_session.lesson_id = lesson.id
      join public.groups as time_group
        on time_group.id = live_session.group_id
      where lesson.learning_journey_id = old.id
        and (
          time_group.age_group_id <> new.age_group_id
          or time_group.academy_year_id <> new.academy_year_id
        )
    ) then
    raise exception 'A learning journey with incompatible time group sessions cannot change its age group';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_scheduled_journey_age_change
on public.learning_journeys;

create trigger prevent_scheduled_journey_age_change
before update of age_group_id, academy_year_id on public.learning_journeys
for each row execute procedure public.prevent_scheduled_journey_age_change();

-- Die Prüfung aus der vorigen Migration wird um das Akademiejahr ergänzt.
create or replace function public.validate_live_session_time_group_age()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  lesson_age_group_id bigint;
  lesson_academy_year_id bigint;
  time_group_age_group_id bigint;
  time_group_academy_year_id bigint;
begin
  if new.group_id is null then
    return new;
  end if;

  select journey.age_group_id, journey.academy_year_id
  into lesson_age_group_id, lesson_academy_year_id
  from public.lessons as lesson
  join public.learning_journeys as journey
    on journey.id = lesson.learning_journey_id
  where lesson.id = new.lesson_id;

  select time_group.age_group_id, time_group.academy_year_id
  into time_group_age_group_id, time_group_academy_year_id
  from public.groups as time_group
  where time_group.id = new.group_id;

  if lesson_age_group_id is null or time_group_age_group_id is null then
    raise exception 'Lesson or time group not found';
  end if;

  if lesson_age_group_id <> time_group_age_group_id
    or lesson_academy_year_id <> time_group_academy_year_id then
    raise exception 'Lesson and time group must use the same age group and academy year'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function public.prevent_used_time_group_age_change() from public;
revoke all on function public.prevent_scheduled_journey_age_change() from public;
revoke all on function public.validate_live_session_time_group_age() from public;
