-- Lernreisen bleiben für Familien anhand der Altersgruppe sichtbar. Die
-- eigentlichen Lektionen, Live-Inhalte und Quizze benötigen dagegen eine
-- genehmigte Zeitgruppe im passenden aktiven Akademiejahr.

create or replace function public.can_child_access_learning_content(
  target_child_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_academy_staff()
    or exists (
      select 1
      from public.children as child
      join public.group_members as membership
        on membership.child_id = child.id
      join public.groups as time_group
        on time_group.id = membership.group_id
      join public.academy_years as academy_year
        on academy_year.id = time_group.academy_year_id
      where child.id = target_child_id
        and child.parent_profile_id = public.current_profile_id()
        and membership.membership_status = 'approved'
        and time_group.age_group_id = child.age_group_id
        and academy_year.is_active
    )
$$;

create or replace function public.can_access_age_group_learning_content(
  target_age_group_id bigint,
  target_academy_year_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_academy_staff()
    or exists (
      select 1
      from public.children as child
      join public.group_members as membership
        on membership.child_id = child.id
      join public.groups as time_group
        on time_group.id = membership.group_id
      join public.academy_years as academy_year
        on academy_year.id = time_group.academy_year_id
      where child.parent_profile_id = public.current_profile_id()
        and child.age_group_id = target_age_group_id
        and membership.membership_status = 'approved'
        and time_group.age_group_id = target_age_group_id
        and time_group.academy_year_id = target_academy_year_id
        and academy_year.is_active
    )
$$;

revoke all on function public.can_child_access_learning_content(bigint)
from public;
revoke all on function public.can_access_age_group_learning_content(bigint, bigint)
from public;

grant execute on function public.can_child_access_learning_content(bigint)
to authenticated;
grant execute on function public.can_access_age_group_learning_content(bigint, bigint)
to authenticated;

-- Die Lernreise selbst bleibt sichtbar. Erst ihre untergeordneten Inhalte
-- werden bis zur Zeitgruppenfreigabe ausgeblendet.
drop policy if exists "Members can read published lessons"
on public.lessons;

create policy "Members can read published lessons"
on public.lessons
for select
to authenticated
using (
  public.is_academy_staff()
  or (
    status = 'published'
    and is_released
    and exists (
      select 1
      from public.learning_journeys as journey
      join public.academy_years as academy_year
        on academy_year.id = journey.academy_year_id
      where journey.id = lessons.learning_journey_id
        and journey.is_published
        and academy_year.is_active
        and public.can_access_age_group_learning_content(
          journey.age_group_id,
          journey.academy_year_id
        )
    )
  )
);

drop policy if exists "Members can read steps of published lessons"
on public.lesson_steps;

create policy "Members can read steps of published lessons"
on public.lesson_steps
for select
to authenticated
using (
  public.is_academy_staff()
  or exists (
    select 1
    from public.lessons as lesson
    join public.learning_journeys as journey
      on journey.id = lesson.learning_journey_id
    join public.academy_years as academy_year
      on academy_year.id = journey.academy_year_id
    where lesson.id = lesson_steps.lesson_id
      and lesson.status = 'published'
      and lesson.is_released
      and journey.is_published
      and academy_year.is_active
      and public.can_access_age_group_learning_content(
        journey.age_group_id,
        journey.academy_year_id
      )
  )
);

drop policy if exists "Members can read accessible live sessions"
on public.live_sessions;

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
      from public.lessons as lesson
      join public.learning_journeys as journey
        on journey.id = lesson.learning_journey_id
      where lesson.id = live_sessions.lesson_id
        and lesson.status = 'published'
        and lesson.is_released
        and public.can_access_age_group_learning_content(
          journey.age_group_id,
          journey.academy_year_id
        )
    )
  )
);

drop policy if exists "Members can read published lesson quizzes"
on public.lesson_quizzes;

create policy "Members can read published lesson quizzes"
on public.lesson_quizzes
for select
to authenticated
using (
  public.is_academy_staff()
  or (
    is_published
    and exists (
      select 1
      from public.lessons as lesson
      join public.learning_journeys as journey
        on journey.id = lesson.learning_journey_id
      join public.academy_years as academy_year
        on academy_year.id = journey.academy_year_id
      where lesson.id = lesson_quizzes.lesson_id
        and lesson.status = 'published'
        and lesson.is_released
        and journey.is_published
        and academy_year.is_active
        and public.can_access_age_group_learning_content(
          journey.age_group_id,
          journey.academy_year_id
        )
    )
  )
);

drop policy if exists "Members can read published quiz questions"
on public.quiz_questions;

create policy "Members can read published quiz questions"
on public.quiz_questions
for select
to authenticated
using (
  public.is_academy_staff()
  or exists (
    select 1
    from public.lesson_quizzes as quiz
    join public.lessons as lesson on lesson.id = quiz.lesson_id
    join public.learning_journeys as journey
      on journey.id = lesson.learning_journey_id
    join public.academy_years as academy_year
      on academy_year.id = journey.academy_year_id
    where quiz.id = quiz_questions.quiz_id
      and quiz.is_published
      and lesson.status = 'published'
      and lesson.is_released
      and journey.is_published
      and academy_year.is_active
      and public.can_access_age_group_learning_content(
        journey.age_group_id,
        journey.academy_year_id
      )
  )
);

drop policy if exists "Members can read published quiz options"
on public.quiz_options;

create policy "Members can read published quiz options"
on public.quiz_options
for select
to authenticated
using (
  public.is_academy_staff()
  or exists (
    select 1
    from public.quiz_questions as question
    join public.lesson_quizzes as quiz on quiz.id = question.quiz_id
    join public.lessons as lesson on lesson.id = quiz.lesson_id
    join public.learning_journeys as journey
      on journey.id = lesson.learning_journey_id
    join public.academy_years as academy_year
      on academy_year.id = journey.academy_year_id
    where question.id = quiz_options.question_id
      and quiz.is_published
      and lesson.status = 'published'
      and lesson.is_released
      and journey.is_published
      and academy_year.is_active
      and public.can_access_age_group_learning_content(
        journey.age_group_id,
        journey.academy_year_id
      )
  )
);

-- Fortschritt und Abgaben dürfen für Familien erst nach Freigabe verändert
-- werden. Bestehende Historie bleibt weiterhin lesbar.
drop policy if exists "Families and staff can insert lesson progress"
on public.child_lesson_progress;
drop policy if exists "Families and staff can update lesson progress"
on public.child_lesson_progress;
drop policy if exists "Families and staff can delete lesson progress"
on public.child_lesson_progress;

create policy "Families and staff can insert lesson progress"
on public.child_lesson_progress
for insert
to authenticated
with check (public.can_child_access_learning_content(child_id));

create policy "Families and staff can update lesson progress"
on public.child_lesson_progress
for update
to authenticated
using (public.can_child_access_learning_content(child_id))
with check (public.can_child_access_learning_content(child_id));

create policy "Families and staff can delete lesson progress"
on public.child_lesson_progress
for delete
to authenticated
using (public.can_child_access_learning_content(child_id));

drop policy if exists "Families and staff can insert step progress"
on public.child_step_progress;
drop policy if exists "Families and staff can update step progress"
on public.child_step_progress;
drop policy if exists "Families and staff can delete step progress"
on public.child_step_progress;

create policy "Families and staff can insert step progress"
on public.child_step_progress
for insert
to authenticated
with check (public.can_child_access_learning_content(child_id));

create policy "Families and staff can update step progress"
on public.child_step_progress
for update
to authenticated
using (public.can_child_access_learning_content(child_id))
with check (public.can_child_access_learning_content(child_id));

create policy "Families and staff can delete step progress"
on public.child_step_progress
for delete
to authenticated
using (public.can_child_access_learning_content(child_id));

drop policy if exists "Families and staff can insert submissions"
on public.submissions;
drop policy if exists "Families and staff can update submissions"
on public.submissions;
drop policy if exists "Families and staff can delete submissions"
on public.submissions;

create policy "Families and staff can insert submissions"
on public.submissions
for insert
to authenticated
with check (public.can_child_access_learning_content(child_id));

create policy "Families and staff can update submissions"
on public.submissions
for update
to authenticated
using (public.can_child_access_learning_content(child_id))
with check (public.can_child_access_learning_content(child_id));

create policy "Families and staff can delete submissions"
on public.submissions
for delete
to authenticated
using (public.can_child_access_learning_content(child_id));

-- Security-Definer-Funktionen wie die Quiz-Auswertung umgehen RLS. Diese
-- Trigger setzen dieselbe Kind-Freigabe deshalb auch dort verbindlich durch.
create or replace function public.enforce_child_learning_content_access()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.can_child_access_learning_content(new.child_id) then
    raise exception 'Approved time group required for learning content'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_quiz_attempt_content_access
on public.quiz_attempts;
create trigger enforce_quiz_attempt_content_access
before insert or update of child_id on public.quiz_attempts
for each row execute procedure public.enforce_child_learning_content_access();

drop trigger if exists enforce_lesson_progress_content_access
on public.child_lesson_progress;
create trigger enforce_lesson_progress_content_access
before insert or update on public.child_lesson_progress
for each row execute procedure public.enforce_child_learning_content_access();

drop trigger if exists enforce_step_progress_content_access
on public.child_step_progress;
create trigger enforce_step_progress_content_access
before insert or update on public.child_step_progress
for each row execute procedure public.enforce_child_learning_content_access();

drop trigger if exists enforce_submission_content_access
on public.submissions;
create trigger enforce_submission_content_access
before insert or update on public.submissions
for each row execute procedure public.enforce_child_learning_content_access();

revoke all on function public.enforce_child_learning_content_access()
from public;
