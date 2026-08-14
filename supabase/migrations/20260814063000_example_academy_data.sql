-- Kleine, klar benannte Beispieldaten für die leere Akademie.
-- Es werden keine Auth-Nutzer oder Passwörter erzeugt.

do $$
declare
  selected_year_id bigint;
  journey_younger_id bigint;
  journey_older_id bigint;
  lesson_younger_id bigint;
  lesson_older_id bigint;
  group_younger_id bigint;
  group_older_id bigint;
  first_badge_id bigint;
  next_position integer;
  session_start timestamptz;
begin
  select id
  into selected_year_id
  from public.academy_years
  where is_active
  order by starts_on desc, id desc
  limit 1;

  if selected_year_id is null then
    insert into public.academy_years (title, starts_on, ends_on, is_active)
    values ('Beispiel-Akademiejahr', current_date, current_date + 365, true)
    returning id into selected_year_id;
  end if;

  select id
  into journey_younger_id
  from public.learning_journeys
  where academy_year_id = selected_year_id
    and age_group = '5-8'
    and title = 'Beispiel: Gute Taten im Alltag'
  limit 1;

  if journey_younger_id is null then
    select coalesce(max(position), -1) + 1
    into next_position
    from public.learning_journeys
    where academy_year_id = selected_year_id and age_group = '5-8';

    insert into public.learning_journeys (
      academy_year_id,
      age_group,
      title,
      description,
      position,
      is_published
    )
    values (
      selected_year_id,
      '5-8',
      'Beispiel: Gute Taten im Alltag',
      'Eine kurze Beispiel-Lernreise, die später ersetzt oder bearbeitet werden kann.',
      next_position,
      true
    )
    returning id into journey_younger_id;
  end if;

  select id
  into journey_older_id
  from public.learning_journeys
  where academy_year_id = selected_year_id
    and age_group = '9-12'
    and title = 'Beispiel: Verantwortung im Alltag'
  limit 1;

  if journey_older_id is null then
    select coalesce(max(position), -1) + 1
    into next_position
    from public.learning_journeys
    where academy_year_id = selected_year_id and age_group = '9-12';

    insert into public.learning_journeys (
      academy_year_id,
      age_group,
      title,
      description,
      position,
      is_published
    )
    values (
      selected_year_id,
      '9-12',
      'Beispiel: Verantwortung im Alltag',
      'Eine veröffentlichte Beispiel-Lernreise für die ältere Altersgruppe.',
      next_position,
      true
    )
    returning id into journey_older_id;
  end if;

  select id
  into lesson_younger_id
  from public.lessons
  where learning_journey_id = journey_younger_id
    and title = 'Beispiellektion: Freundlich sein'
  limit 1;

  if lesson_younger_id is null then
    select coalesce(max(position), -1) + 1
    into next_position
    from public.lessons
    where learning_journey_id = journey_younger_id;

    insert into public.lessons (
      learning_journey_id,
      title,
      description,
      status,
      position,
      publish_at
    )
    values (
      journey_younger_id,
      'Beispiellektion: Freundlich sein',
      'Eine kurze Beispiellektion mit allen fünf Lernschritten.',
      'published',
      next_position,
      now()::timestamp without time zone
    )
    returning id into lesson_younger_id;
  end if;

  insert into public.lesson_steps (lesson_id, step_type, title, content, position)
  values
    (lesson_younger_id, 'start', 'Gemeinsam starten', '{"text":"Wann war heute jemand freundlich zu dir?"}'::jsonb, 0),
    (lesson_younger_id, 'discover', 'Eine Situation entdecken', '{"text":"Lies die kurze Beispielsituation und überlege, welche gute Tat du erkennst."}'::jsonb, 1),
    (lesson_younger_id, 'explain', 'Mit eigenen Worten', '{"text":"Erkläre, warum Freundlichkeit den Alltag schöner macht."}'::jsonb, 2),
    (lesson_younger_id, 'quiz', 'Mini-Quiz', '{"text":"Nenne eine freundliche Tat, die du selbst tun kannst."}'::jsonb, 3),
    (lesson_younger_id, 'challenge', 'Wochen-Challenge', '{"text":"Hilf heute jemandem und bestätige die Aufgabe danach hier."}'::jsonb, 4)
  on conflict (lesson_id, position) do nothing;

  select id
  into lesson_older_id
  from public.lessons
  where learning_journey_id = journey_older_id
    and title = 'Beispiellektion: Ehrlich handeln'
  limit 1;

  if lesson_older_id is null then
    select coalesce(max(position), -1) + 1
    into next_position
    from public.lessons
    where learning_journey_id = journey_older_id;

    insert into public.lessons (
      learning_journey_id,
      title,
      description,
      status,
      position,
      publish_at
    )
    values (
      journey_older_id,
      'Beispiellektion: Ehrlich handeln',
      'Eine Beispiellektion über Verantwortung und ehrliche Entscheidungen.',
      'published',
      next_position,
      now()::timestamp without time zone
    )
    returning id into lesson_older_id;
  end if;

  insert into public.lesson_steps (lesson_id, step_type, title, content, position)
  values
    (lesson_older_id, 'start', 'Erste Gedanken', '{"text":"Was bedeutet Ehrlichkeit für dich?"}'::jsonb, 0),
    (lesson_older_id, 'discover', 'Eine Entscheidung betrachten', '{"text":"Betrachte die Beispielsituation und sammle mögliche Entscheidungen."}'::jsonb, 1),
    (lesson_older_id, 'explain', 'Folgen erklären', '{"text":"Erkläre, welche Folgen eine ehrliche Entscheidung haben kann."}'::jsonb, 2),
    (lesson_older_id, 'quiz', 'Mini-Quiz', '{"text":"Beschreibe ein eigenes Beispiel für ehrliches Handeln."}'::jsonb, 3),
    (lesson_older_id, 'challenge', 'Wochen-Challenge', '{"text":"Achte diese Woche bewusst auf eine ehrliche Entscheidung und notiere sie."}'::jsonb, 4)
  on conflict (lesson_id, position) do nothing;

  select id
  into group_younger_id
  from public.groups
  where academy_year_id = selected_year_id and name = 'Beispielgruppe 5–8'
  limit 1;

  if group_younger_id is null then
    insert into public.groups (academy_year_id, name, age_group)
    values (selected_year_id, 'Beispielgruppe 5–8', '5-8')
    returning id into group_younger_id;
  end if;

  select id
  into group_older_id
  from public.groups
  where academy_year_id = selected_year_id and name = 'Beispielgruppe 9–12'
  limit 1;

  if group_older_id is null then
    insert into public.groups (academy_year_id, name, age_group)
    values (selected_year_id, 'Beispielgruppe 9–12', '9-12')
    returning id into group_older_id;
  end if;

  session_start := date_trunc('day', now()) + interval '7 days 17 hours';

  if not exists (
    select 1
    from public.live_sessions
    where lesson_id = lesson_younger_id and title = 'Beispiel: Live-Unterricht'
  ) then
    insert into public.live_sessions (
      lesson_id,
      group_id,
      title,
      starts_at,
      ends_at,
      status
    )
    values (
      lesson_younger_id,
      group_younger_id,
      'Beispiel: Live-Unterricht',
      session_start,
      session_start + interval '1 hour',
      'scheduled'
    );
  end if;

  insert into public.badges (title, description, icon_key)
  select 'Erste Lernschritte', 'Für den gelungenen Start in den persönlichen Lernweg.', 'trophy'
  where not exists (select 1 from public.badges where title = 'Erste Lernschritte');

  insert into public.badges (title, description, icon_key)
  select 'Alltagsheld', 'Für eine umgesetzte gute Tat im Alltag.', 'check'
  where not exists (select 1 from public.badges where title = 'Alltagsheld');

  select id into first_badge_id
  from public.badges
  where title = 'Erste Lernschritte'
  limit 1;

  if not exists (
    select 1
    from public.messages
    where subject = 'Willkommen bei den Beispieldaten'
  ) then
    insert into public.messages (
      audience,
      subject,
      body,
      published_at
    )
    values (
      'all',
      'Willkommen bei den Beispieldaten',
      'Diese Mitteilung zeigt beispielhaft, wie Informationen für alle Familien erscheinen.',
      now()::timestamp without time zone
    );
  end if;

  insert into public.children (
    parent_profile_id,
    display_name,
    age_group,
    avatar_key
  )
  select
    profile_row.id,
    'Beispielkind',
    '5-8',
    'example-seed'
  from public.profiles as profile_row
  where exists (
      select 1
      from public.user_roles as role_row
      where role_row.profile_id = profile_row.id and role_row.role = 'parent'
    )
    and not exists (
      select 1
      from public.user_roles as staff_role
      where staff_role.profile_id = profile_row.id and staff_role.role in ('teacher', 'admin')
    )
    and not exists (
      select 1
      from public.children as child_row
      where child_row.parent_profile_id = profile_row.id
        and child_row.avatar_key = 'example-seed'
    );

  insert into public.group_members (group_id, child_id)
  select group_younger_id, child_row.id
  from public.children as child_row
  where child_row.avatar_key = 'example-seed' and child_row.age_group = '5-8'
  on conflict (group_id, child_id) do nothing;

  insert into public.child_lesson_progress (
    child_id,
    lesson_id,
    status,
    progress_percent,
    last_opened_at
  )
  select
    child_row.id,
    lesson_younger_id,
    'in_progress',
    40,
    now()::timestamp without time zone
  from public.children as child_row
  where child_row.avatar_key = 'example-seed'
  on conflict (child_id, lesson_id) do nothing;

  insert into public.child_step_progress (child_id, lesson_step_id)
  select child_row.id, step_row.id
  from public.children as child_row
  cross join public.lesson_steps as step_row
  where child_row.avatar_key = 'example-seed'
    and step_row.lesson_id = lesson_younger_id
    and step_row.position in (0, 1)
  on conflict (child_id, lesson_step_id) do nothing;

  insert into public.child_badges (child_id, badge_id, lesson_id)
  select child_row.id, first_badge_id, lesson_younger_id
  from public.children as child_row
  where child_row.avatar_key = 'example-seed'
  on conflict (child_id, badge_id) do nothing;
end;
$$;
