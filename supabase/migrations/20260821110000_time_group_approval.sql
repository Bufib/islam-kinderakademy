-- Altersgruppen bestimmen die Inhalte. Zeitgruppen bestimmen ausschließlich
-- den konkreten Unterrichtstermin und werden für Kinder erst nach einer
-- Admin-Freigabe wirksam.

-- Das Feld existiert bereits im aktuellen Remote-Schema, fehlte bisher aber in
-- der lokalen Migrationshistorie. Es bleibt nur für die Übernahme bestehender
-- Zeitangaben erhalten und wird nicht mehr für neue Zuordnungen verwendet.
alter table public.age_groups
  add column if not exists date_time text;

alter table public.groups
  add column if not exists schedule_label text;

update public.groups as academy_group
set schedule_label = coalesce(
  nullif(trim(age_group.date_time), ''),
  academy_group.name
)
from public.age_groups as age_group
where age_group.id = academy_group.age_group_id
  and nullif(trim(academy_group.schedule_label), '') is null;

update public.groups
set schedule_label = name
where nullif(trim(schedule_label), '') is null;

alter table public.groups
  alter column schedule_label set not null;

alter table public.groups
  drop constraint if exists groups_schedule_label_check;

alter table public.groups
  add constraint groups_schedule_label_check
  check (char_length(trim(schedule_label)) between 2 and 160);

comment on column public.groups.schedule_label is
  'Wiederkehrende Unterrichtszeit der Zeitgruppe, zum Beispiel Freitag 17:00–17:45 Uhr.';

-- Bestehende Gruppenzuordnungen gelten weiterhin als genehmigt. Neue
-- Zuordnungen beginnen dagegen immer mit dem Status pending.
alter table public.group_members
  add column if not exists membership_status text;

update public.group_members
set membership_status = 'approved'
where membership_status is null;

alter table public.group_members
  alter column membership_status set default 'pending';

alter table public.group_members
  alter column membership_status set not null;

alter table public.group_members
  drop constraint if exists group_members_membership_status_check;

alter table public.group_members
  add constraint group_members_membership_status_check
  check (membership_status in ('pending', 'approved', 'rejected', 'cancelled'));

alter table public.group_members
  add column if not exists requested_at timestamp with time zone;

update public.group_members
set requested_at = created_at at time zone 'UTC'
where requested_at is null;

alter table public.group_members
  alter column requested_at set default now();

alter table public.group_members
  alter column requested_at set not null;

alter table public.group_members
  add column if not exists reviewed_at timestamp with time zone;

update public.group_members
set reviewed_at = requested_at
where membership_status = 'approved'
  and reviewed_at is null;

alter table public.group_members
  add column if not exists reviewed_by_profile_id bigint
    references public.profiles (id) on delete set null;

create index if not exists group_members_child_status_idx
on public.group_members (child_id, membership_status);

create index if not exists group_members_group_status_idx
on public.group_members (group_id, membership_status);

-- Ein Kind darf ausschließlich einer Zeitgruppe seiner eigenen Altersgruppe
-- zugeordnet werden.
create or replace function public.validate_time_group_membership_age()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  child_age_group_id bigint;
  time_group_age_group_id bigint;
begin
  select child.age_group_id
  into child_age_group_id
  from public.children as child
  where child.id = new.child_id;

  select time_group.age_group_id
  into time_group_age_group_id
  from public.groups as time_group
  where time_group.id = new.group_id;

  if child_age_group_id is null or time_group_age_group_id is null then
    raise exception 'Child or time group not found';
  end if;

  if child_age_group_id <> time_group_age_group_id then
    raise exception 'Child and time group must use the same age group'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_time_group_membership_age
on public.group_members;

create trigger validate_time_group_membership_age
before insert or update of child_id, group_id on public.group_members
for each row execute procedure public.validate_time_group_membership_age();

-- Wird die Altersgruppe eines Kindes direkt geändert, verlieren nicht mehr
-- passende Zeitgruppen ihre Wirkung. Die Altersgruppe selbst gilt sofort.
create or replace function public.cancel_incompatible_time_group_memberships()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.age_group_id is distinct from old.age_group_id then
    update public.group_members as membership
    set membership_status = 'cancelled',
        reviewed_at = now(),
        reviewed_by_profile_id = null
    from public.groups as time_group
    where membership.child_id = new.id
      and membership.group_id = time_group.id
      and time_group.age_group_id <> new.age_group_id
      and membership.membership_status in ('pending', 'approved');
  end if;

  return new;
end;
$$;

drop trigger if exists cancel_incompatible_time_group_memberships
on public.children;

create trigger cancel_incompatible_time_group_memberships
after update of age_group_id on public.children
for each row execute procedure public.cancel_incompatible_time_group_memberships();

-- Ein gruppenspezifischer Live-Termin muss zur Altersgruppe der Lektion passen.
create or replace function public.validate_live_session_time_group_age()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  lesson_age_group_id bigint;
  time_group_age_group_id bigint;
begin
  if new.group_id is null then
    return new;
  end if;

  select journey.age_group_id
  into lesson_age_group_id
  from public.lessons as lesson
  join public.learning_journeys as journey
    on journey.id = lesson.learning_journey_id
  where lesson.id = new.lesson_id;

  select time_group.age_group_id
  into time_group_age_group_id
  from public.groups as time_group
  where time_group.id = new.group_id;

  if lesson_age_group_id is null or time_group_age_group_id is null then
    raise exception 'Lesson or time group not found';
  end if;

  if lesson_age_group_id <> time_group_age_group_id then
    raise exception 'Lesson and time group must use the same age group'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_live_session_time_group_age
on public.live_sessions;

create trigger validate_live_session_time_group_age
before insert or update of lesson_id, group_id on public.live_sessions
for each row execute procedure public.validate_live_session_time_group_age();

-- Nur genehmigte Zuordnungen geben Zugriff auf Termine, Links und
-- gruppenspezifische Mitteilungen.
create or replace function public.can_access_group(target_group_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_academy_staff()
    or exists (
      select 1
      from public.group_members as membership
      join public.children as child on child.id = membership.child_id
      where membership.group_id = target_group_id
        and membership.membership_status = 'approved'
        and child.parent_profile_id = public.current_profile_id()
    )
$$;

-- Eltern sehen die verfügbaren Zeitgruppen, aber von den Zuordnungen nur die
-- Anfragen ihrer eigenen Kinder. Ausschließlich Admins dürfen Status ändern.
drop policy if exists "Families and staff can read accessible groups"
on public.groups;
drop policy if exists "Authenticated users can read time groups"
on public.groups;

create policy "Authenticated users can read time groups"
on public.groups
for select
to authenticated
using (true);

drop policy if exists "Families and staff can read group members"
on public.group_members;
drop policy if exists "Families and staff can read time group memberships"
on public.group_members;

create policy "Families and staff can read time group memberships"
on public.group_members
for select
to authenticated
using (public.owns_child(child_id) or public.is_academy_staff());

drop policy if exists "Staff can manage group members"
on public.group_members;

drop policy if exists "Admins can manage time group memberships"
on public.group_members;

create policy "Admins can manage time group memberships"
on public.group_members
for all
to authenticated
using (public.has_account_role('admin'))
with check (public.has_account_role('admin'));

-- Kinderprofil und Zeitgruppenanfrage werden gemeinsam gespeichert. Eltern
-- können den Status dabei nicht selbst auf approved setzen.
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
    and academy_year.is_active;

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
  else
    update public.children
    set display_name = child_display_name,
        birth_date = child_birth_date,
        age_group_id = child_age_group_id,
        gender = child_gender,
        avatar_key = child_avatar_key
    where id = target_child_id
      and children.parent_profile_id = current_parent_profile_id
    returning id into saved_child_id;

    if saved_child_id is null then
      raise exception 'Child profile not found';
    end if;
  end if;

  perform pg_advisory_xact_lock(saved_child_id);

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
    and (group_id <> requested_group_id or id <> target_membership_id)
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

-- Nur ein Admin kann eine Anfrage genehmigen oder ablehnen. Bei einer
-- Genehmigung werden ältere aktive Zuordnungen desselben Kindes beendet.
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
begin
  if not public.has_account_role('admin') then
    raise exception 'Admin role required';
  end if;

  if review_decision is null or review_decision not in ('approved', 'rejected') then
    raise exception 'Review decision must be approved or rejected';
  end if;

  reviewer_profile_id := public.current_profile_id();

  select membership.child_id, child.age_group_id, time_group.age_group_id
  into requested_child_id, child_age_group_id, requested_group_age_group_id
  from public.group_members as membership
  join public.children as child on child.id = membership.child_id
  join public.groups as time_group on time_group.id = membership.group_id
  where membership.id = target_group_member_id
    and membership.membership_status = 'pending'
  for update of membership;

  if requested_child_id is null then
    raise exception 'Pending time group request not found';
  end if;

  perform pg_advisory_xact_lock(requested_child_id);

  if review_decision = 'approved' then
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
revoke all on function public.validate_time_group_membership_age() from public;
revoke all on function public.cancel_incompatible_time_group_memberships() from public;
revoke all on function public.validate_live_session_time_group_age() from public;

grant execute on function public.save_child_with_time_group_request(
  bigint, text, date, bigint, text, text, bigint
) to authenticated;
grant execute on function public.review_time_group_request(bigint, text)
to authenticated;
