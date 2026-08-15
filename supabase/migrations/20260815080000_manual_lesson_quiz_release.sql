-- Lektionen und Quizze werden getrennt und ausschließlich durch Admins freigegeben.
-- Eine Quizfreigabe ist erst nach einem als beendet markierten Live-Termin möglich.

alter table public.lessons
add column is_released boolean not null default false,
add column released_at timestamp without time zone,
add column released_by_profile_id bigint references public.profiles (id) on delete set null;

alter table public.lesson_quizzes
add column released_at timestamp without time zone,
add column released_by_profile_id bigint references public.profiles (id) on delete set null;

-- Vorhandene Inhalte beginnen bewusst wieder gesperrt und müssen geprüft werden.
update public.lesson_quizzes
set
  is_published = false,
  released_at = null,
  released_by_profile_id = null;

create index lessons_released_by_profile_id_idx
on public.lessons (released_by_profile_id);

create index lesson_quizzes_released_by_profile_id_idx
on public.lesson_quizzes (released_by_profile_id);

create or replace function public.guard_lesson_release()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Nicht veröffentlichte Lektionen dürfen niemals freigegeben bleiben.
  if new.status <> 'published' then
    new.is_released := false;
  end if;

  if tg_op = 'INSERT' then
    if new.is_released then
      if not public.has_account_role('admin') then
        raise exception 'Admin role required';
      end if;

      new.released_at := now()::timestamp without time zone;
      new.released_by_profile_id := public.current_profile_id();
    else
      new.released_at := null;
      new.released_by_profile_id := null;
    end if;

    return new;
  end if;

  if new.is_released is distinct from old.is_released then
    -- Das automatische Sperren bei Entwurf/Archiv ist auch für Lehrkräfte erlaubt.
    if new.is_released or new.status = 'published' then
      if not public.has_account_role('admin') then
        raise exception 'Admin role required';
      end if;
    end if;

    if new.is_released then
      new.released_at := now()::timestamp without time zone;
      new.released_by_profile_id := public.current_profile_id();
    else
      new.released_at := null;
      new.released_by_profile_id := null;
    end if;
  else
    -- Auditfelder können nicht unabhängig vom Freigabestatus manipuliert werden.
    new.released_at := old.released_at;
    new.released_by_profile_id := old.released_by_profile_id;
  end if;

  return new;
end;
$$;

create trigger guard_lesson_release_before_write
before insert or update on public.lessons
for each row execute function public.guard_lesson_release();

create or replace function public.guard_quiz_release()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  related_lesson_id bigint;
  related_lesson_released boolean;
  related_lesson_status text;
begin
  select lesson.id, lesson.is_released, lesson.status
  into related_lesson_id, related_lesson_released, related_lesson_status
  from public.lessons as lesson
  where lesson.id = new.lesson_id;

  if tg_op = 'INSERT' then
    if new.is_published then
      if not public.has_account_role('admin') then
        raise exception 'Admin role required';
      end if;

      if not coalesce(related_lesson_released, false)
        or related_lesson_status <> 'published' then
        raise exception 'Lesson must be released before quiz';
      end if;

      if not exists (
        select 1
        from public.live_sessions as session
        where session.lesson_id = new.lesson_id
          and session.status = 'completed'
      ) then
        raise exception 'Completed live session required before quiz release';
      end if;

      new.released_at := now()::timestamp without time zone;
      new.released_by_profile_id := public.current_profile_id();
    else
      new.released_at := null;
      new.released_by_profile_id := null;
    end if;

    return new;
  end if;

  if new.is_published is distinct from old.is_published then
    -- Beim Sperren einer Lektion darf das System auch das Quiz automatisch sperren.
    if new.is_published or coalesce(related_lesson_released, false) then
      if not public.has_account_role('admin') then
        raise exception 'Admin role required';
      end if;
    end if;

    if new.is_published then
      if not coalesce(related_lesson_released, false)
        or related_lesson_status <> 'published' then
        raise exception 'Lesson must be released before quiz';
      end if;

      if not exists (
        select 1
        from public.live_sessions as session
        where session.lesson_id = new.lesson_id
          and session.status = 'completed'
      ) then
        raise exception 'Completed live session required before quiz release';
      end if;

      new.released_at := now()::timestamp without time zone;
      new.released_by_profile_id := public.current_profile_id();
    else
      new.released_at := null;
      new.released_by_profile_id := null;
    end if;
  else
    new.released_at := old.released_at;
    new.released_by_profile_id := old.released_by_profile_id;
  end if;

  return new;
end;
$$;

create trigger guard_quiz_release_before_write
before insert or update on public.lesson_quizzes
for each row execute function public.guard_quiz_release();

create or replace function public.lock_quiz_after_lesson_lock()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.is_released and not new.is_released then
    update public.lesson_quizzes
    set is_published = false
    where lesson_id = new.id
      and is_published;
  end if;

  return null;
end;
$$;

create trigger lock_quiz_after_lesson_lock
after update of is_released, status on public.lessons
for each row execute function public.lock_quiz_after_lesson_lock();

create or replace function public.set_lesson_release(
  target_lesson_id bigint,
  release_lesson boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_account_role('admin') then
    raise exception 'Admin role required';
  end if;

  if release_lesson and not exists (
    select 1
    from public.lessons
    where id = target_lesson_id
      and status = 'published'
  ) then
    raise exception 'Lesson must be published before release';
  end if;

  update public.lessons
  set is_released = release_lesson
  where id = target_lesson_id;

  if not found then
    raise exception 'Lesson not found';
  end if;
end;
$$;

create or replace function public.set_quiz_release(
  target_quiz_id bigint,
  release_quiz boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_account_role('admin') then
    raise exception 'Admin role required';
  end if;

  update public.lesson_quizzes
  set is_published = release_quiz
  where id = target_quiz_id;

  if not found then
    raise exception 'Quiz not found';
  end if;
end;
$$;

revoke all on function public.guard_lesson_release() from public;
revoke all on function public.guard_quiz_release() from public;
revoke all on function public.lock_quiz_after_lesson_lock() from public;
revoke all on function public.set_lesson_release(bigint, boolean) from public;
revoke all on function public.set_quiz_release(bigint, boolean) from public;

grant execute on function public.set_lesson_release(bigint, boolean) to authenticated;
grant execute on function public.set_quiz_release(bigint, boolean) to authenticated;

drop policy "Members can read published lessons" on public.lessons;
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
      join public.academy_years as academy_year on academy_year.id = journey.academy_year_id
      where journey.id = lessons.learning_journey_id
        and journey.is_published
        and academy_year.is_active
    )
  )
);

drop policy "Members can read steps of published lessons" on public.lesson_steps;
create policy "Members can read steps of published lessons"
on public.lesson_steps
for select
to authenticated
using (
  public.is_academy_staff()
  or exists (
    select 1
    from public.lessons as lesson
    join public.learning_journeys as journey on journey.id = lesson.learning_journey_id
    join public.academy_years as academy_year on academy_year.id = journey.academy_year_id
    where lesson.id = lesson_steps.lesson_id
      and lesson.status = 'published'
      and lesson.is_released
      and journey.is_published
      and academy_year.is_active
  )
);

drop policy "Members can read accessible live sessions" on public.live_sessions;
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
      where lesson.id = live_sessions.lesson_id
        and lesson.status = 'published'
        and lesson.is_released
    )
  )
);

drop policy "Members can read published lesson quizzes" on public.lesson_quizzes;
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
      join public.learning_journeys as journey on journey.id = lesson.learning_journey_id
      join public.academy_years as academy_year on academy_year.id = journey.academy_year_id
      where lesson.id = lesson_quizzes.lesson_id
        and lesson.status = 'published'
        and lesson.is_released
        and journey.is_published
        and academy_year.is_active
    )
  )
);

drop policy "Members can read published quiz questions" on public.quiz_questions;
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
    join public.learning_journeys as journey on journey.id = lesson.learning_journey_id
    join public.academy_years as academy_year on academy_year.id = journey.academy_year_id
    where quiz.id = quiz_questions.quiz_id
      and quiz.is_published
      and lesson.status = 'published'
      and lesson.is_released
      and journey.is_published
      and academy_year.is_active
  )
);

drop policy "Members can read published quiz options" on public.quiz_options;
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
    join public.learning_journeys as journey on journey.id = lesson.learning_journey_id
    join public.academy_years as academy_year on academy_year.id = journey.academy_year_id
    where question.id = quiz_options.question_id
      and quiz.is_published
      and lesson.status = 'published'
      and lesson.is_released
      and journey.is_published
      and academy_year.is_active
  )
);
