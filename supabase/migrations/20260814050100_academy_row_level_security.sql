-- Row Level Security für Accounts, Familien und Akademie-Inhalte.

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.academy_years enable row level security;
alter table public.children enable row level security;
alter table public.learning_journeys enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_steps enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.live_sessions enable row level security;
alter table public.child_lesson_progress enable row level security;
alter table public.child_step_progress enable row level security;
alter table public.submissions enable row level security;
alter table public.badges enable row level security;
alter table public.child_badges enable row level security;
alter table public.media_assets enable row level security;
alter table public.messages enable row level security;

-- Bereits bekannte Account-Policies kontrolliert neu anlegen.
drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Admins can update profiles" on public.profiles;
drop policy if exists "Users can read their own roles" on public.user_roles;
drop policy if exists "Admins can insert roles" on public.user_roles;
drop policy if exists "Admins can update roles" on public.user_roles;
drop policy if exists "Admins can delete roles" on public.user_roles;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (
  auth_user_id = (select auth.uid())
  or public.is_academy_staff()
);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth_user_id = (select auth.uid()))
with check (auth_user_id = (select auth.uid()));

create policy "Admins can update profiles"
on public.profiles
for update
to authenticated
using (public.has_account_role('admin'))
with check (public.has_account_role('admin'));

create policy "Users can read their own roles"
on public.user_roles
for select
to authenticated
using (
  profile_id = public.current_profile_id()
  or public.has_account_role('admin')
);

create policy "Admins can insert roles"
on public.user_roles
for insert
to authenticated
with check (public.has_account_role('admin'));

create policy "Admins can update roles"
on public.user_roles
for update
to authenticated
using (public.has_account_role('admin'))
with check (public.has_account_role('admin'));

create policy "Admins can delete roles"
on public.user_roles
for delete
to authenticated
using (public.has_account_role('admin'));

-- Akademiejahre.
create policy "Members can read active academy years"
on public.academy_years
for select
to authenticated
using (is_active or public.is_academy_staff());

create policy "Staff can manage academy years"
on public.academy_years
for all
to authenticated
using (public.is_academy_staff())
with check (public.is_academy_staff());

-- Kinderprofile gehören einem Elternprofil; Teammitglieder dürfen sie betreuen.
create policy "Families and staff can read children"
on public.children
for select
to authenticated
using (
  parent_profile_id = public.current_profile_id()
  or public.is_academy_staff()
);

create policy "Families and staff can insert children"
on public.children
for insert
to authenticated
with check (
  parent_profile_id = public.current_profile_id()
  or public.is_academy_staff()
);

create policy "Families and staff can update children"
on public.children
for update
to authenticated
using (
  parent_profile_id = public.current_profile_id()
  or public.is_academy_staff()
)
with check (
  parent_profile_id = public.current_profile_id()
  or public.is_academy_staff()
);

create policy "Families and staff can delete children"
on public.children
for delete
to authenticated
using (
  parent_profile_id = public.current_profile_id()
  or public.is_academy_staff()
);

-- Lernreisen, Lektionen und Schritte: Familien sehen nur veröffentlichte Inhalte.
create policy "Members can read published journeys"
on public.learning_journeys
for select
to authenticated
using (
  public.is_academy_staff()
  or (
    is_published
    and exists (
      select 1
      from public.academy_years ay
      where ay.id = learning_journeys.academy_year_id
        and ay.is_active
    )
  )
);

create policy "Staff can manage journeys"
on public.learning_journeys
for all
to authenticated
using (public.is_academy_staff())
with check (public.is_academy_staff());

create policy "Members can read published lessons"
on public.lessons
for select
to authenticated
using (
  public.is_academy_staff()
  or (
    status = 'published'
    and exists (
      select 1
      from public.learning_journeys lj
      join public.academy_years ay on ay.id = lj.academy_year_id
      where lj.id = lessons.learning_journey_id
        and lj.is_published
        and ay.is_active
    )
  )
);

create policy "Staff can manage lessons"
on public.lessons
for all
to authenticated
using (public.is_academy_staff())
with check (public.is_academy_staff());

create policy "Members can read steps of published lessons"
on public.lesson_steps
for select
to authenticated
using (
  public.is_academy_staff()
  or exists (
    select 1
    from public.lessons l
    join public.learning_journeys lj on lj.id = l.learning_journey_id
    join public.academy_years ay on ay.id = lj.academy_year_id
    where l.id = lesson_steps.lesson_id
      and l.status = 'published'
      and lj.is_published
      and ay.is_active
  )
);

create policy "Staff can manage lesson steps"
on public.lesson_steps
for all
to authenticated
using (public.is_academy_staff())
with check (public.is_academy_staff());

-- Gruppen und Gruppenzuordnungen.
create policy "Families and staff can read accessible groups"
on public.groups
for select
to authenticated
using (public.can_access_group(id));

create policy "Staff can manage groups"
on public.groups
for all
to authenticated
using (public.is_academy_staff())
with check (public.is_academy_staff());

create policy "Families and staff can read group members"
on public.group_members
for select
to authenticated
using (public.can_access_group(group_id));

create policy "Staff can manage group members"
on public.group_members
for all
to authenticated
using (public.is_academy_staff())
with check (public.is_academy_staff());

-- Live-Termine sind entweder allgemein oder auf eine zugängliche Gruppe begrenzt.
create policy "Members can read accessible live sessions"
on public.live_sessions
for select
to authenticated
using (
  public.is_academy_staff()
  or (
    (group_id is null or public.can_access_group(group_id))
    and exists (
      select 1
      from public.lessons l
      where l.id = live_sessions.lesson_id
        and l.status = 'published'
    )
  )
);

create policy "Staff can manage live sessions"
on public.live_sessions
for all
to authenticated
using (public.is_academy_staff())
with check (public.is_academy_staff());

-- Fortschritt und Abgaben gehören dem jeweiligen Kind.
create policy "Families and staff can read lesson progress"
on public.child_lesson_progress
for select
to authenticated
using (public.owns_child(child_id) or public.is_academy_staff());

create policy "Families and staff can insert lesson progress"
on public.child_lesson_progress
for insert
to authenticated
with check (public.owns_child(child_id) or public.is_academy_staff());

create policy "Families and staff can update lesson progress"
on public.child_lesson_progress
for update
to authenticated
using (public.owns_child(child_id) or public.is_academy_staff())
with check (public.owns_child(child_id) or public.is_academy_staff());

create policy "Families and staff can delete lesson progress"
on public.child_lesson_progress
for delete
to authenticated
using (public.owns_child(child_id) or public.is_academy_staff());

create policy "Families and staff can read step progress"
on public.child_step_progress
for select
to authenticated
using (public.owns_child(child_id) or public.is_academy_staff());

create policy "Families and staff can insert step progress"
on public.child_step_progress
for insert
to authenticated
with check (public.owns_child(child_id) or public.is_academy_staff());

create policy "Families and staff can update step progress"
on public.child_step_progress
for update
to authenticated
using (public.owns_child(child_id) or public.is_academy_staff())
with check (public.owns_child(child_id) or public.is_academy_staff());

create policy "Families and staff can delete step progress"
on public.child_step_progress
for delete
to authenticated
using (public.owns_child(child_id) or public.is_academy_staff());

create policy "Families and staff can read submissions"
on public.submissions
for select
to authenticated
using (public.owns_child(child_id) or public.is_academy_staff());

create policy "Families and staff can insert submissions"
on public.submissions
for insert
to authenticated
with check (public.owns_child(child_id) or public.is_academy_staff());

create policy "Families and staff can update submissions"
on public.submissions
for update
to authenticated
using (public.owns_child(child_id) or public.is_academy_staff())
with check (public.owns_child(child_id) or public.is_academy_staff());

create policy "Families and staff can delete submissions"
on public.submissions
for delete
to authenticated
using (public.owns_child(child_id) or public.is_academy_staff());

-- Abzeichen.
create policy "Members can read badges"
on public.badges
for select
to authenticated
using (true);

create policy "Staff can manage badges"
on public.badges
for all
to authenticated
using (public.is_academy_staff())
with check (public.is_academy_staff());

create policy "Families and staff can read child badges"
on public.child_badges
for select
to authenticated
using (public.owns_child(child_id) or public.is_academy_staff());

create policy "Staff can manage child badges"
on public.child_badges
for all
to authenticated
using (public.is_academy_staff())
with check (public.is_academy_staff());

-- Medienmetadaten. Storage-Bucket-Policies werden separat eingerichtet.
create policy "Members can read academy media"
on public.media_assets
for select
to authenticated
using (true);

create policy "Staff can manage academy media"
on public.media_assets
for all
to authenticated
using (public.is_academy_staff())
with check (public.is_academy_staff());

-- Veröffentlichte Nachrichten nach Empfänger oder Gruppe.
create policy "Members can read accessible messages"
on public.messages
for select
to authenticated
using (
  public.is_academy_staff()
  or (
    published_at is not null
    and published_at <= now()::timestamp without time zone
    and (
      audience = 'all'
      or (audience = 'profile' and recipient_profile_id = public.current_profile_id())
      or (audience = 'group' and public.can_access_group(group_id))
    )
  )
);

create policy "Staff can manage messages"
on public.messages
for all
to authenticated
using (public.is_academy_staff())
with check (public.is_academy_staff());

-- Funktionen sind nur für angemeldete Nutzer direkt aufrufbar.
revoke all on function public.current_profile_id() from public;
revoke all on function public.has_account_role(text) from public;
revoke all on function public.is_academy_staff() from public;
revoke all on function public.owns_child(bigint) from public;
revoke all on function public.can_access_group(bigint) from public;

grant execute on function public.current_profile_id() to authenticated;
grant execute on function public.has_account_role(text) to authenticated;
grant execute on function public.is_academy_staff() to authenticated;
grant execute on function public.owns_child(bigint) to authenticated;
grant execute on function public.can_access_group(bigint) to authenticated;

-- Die öffentliche Werbeseite benötigt keinen Datenbankzugriff.
revoke all on table
  public.profiles,
  public.user_roles,
  public.academy_years,
  public.children,
  public.learning_journeys,
  public.lessons,
  public.lesson_steps,
  public.groups,
  public.group_members,
  public.live_sessions,
  public.child_lesson_progress,
  public.child_step_progress,
  public.submissions,
  public.badges,
  public.child_badges,
  public.media_assets,
  public.messages
from anon;

grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.user_roles to authenticated;

grant select, insert, update, delete on table
  public.academy_years,
  public.children,
  public.learning_journeys,
  public.lessons,
  public.lesson_steps,
  public.groups,
  public.group_members,
  public.live_sessions,
  public.child_lesson_progress,
  public.child_step_progress,
  public.submissions,
  public.badges,
  public.child_badges,
  public.media_assets,
  public.messages
to authenticated;

grant usage, select on all sequences in schema public to authenticated;
