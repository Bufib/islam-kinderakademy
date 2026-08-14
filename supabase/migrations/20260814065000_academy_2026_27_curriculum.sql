-- Ersetzt die frueheren Beispieldaten durch das Curriculum der
-- Islam-Kinderakademie 2026/27. Auth-Konten und echte Kinder bleiben erhalten.

do $$
declare
  target_year_id bigint;
  journey_id bigint;
  lesson_id bigint;
  younger_group_id bigint;
  older_group_id bigint;
  younger_position integer;
  older_position integer;
  journey_definition jsonb;
  lesson_title text;
  lesson_position integer;
  age_group_label text;
  challenge_duration text;
begin
  -- Ausschliesslich eindeutig markierte Datensaetze des alten Beispiel-Seeds entfernen.
  delete from public.children
  where avatar_key = 'example-seed';

  delete from public.messages
  where subject = 'Willkommen bei den Beispieldaten';

  delete from public.live_sessions
  where title = 'Beispiel: Live-Unterricht';

  delete from public.groups
  where name in ('Beispielgruppe 5–8', 'Beispielgruppe 9–12');

  delete from public.learning_journeys
  where title in (
    'Beispiel: Gute Taten im Alltag',
    'Beispiel: Verantwortung im Alltag'
  );

  delete from public.badges
  where title in ('Erste Lernschritte', 'Alltagsheld');

  -- Ein vom alten Seed erzeugtes Akademiejahr wird weiterverwendet. Existiert
  -- bereits ein echtes 2026/27-Jahr, bleibt dieses die Zielstruktur.
  select id
  into target_year_id
  from public.academy_years
  where title = 'Islam-Kinderakademie 2026/27'
  order by id
  limit 1;

  if target_year_id is null then
    select id
    into target_year_id
    from public.academy_years
    where title = 'Beispiel-Akademiejahr'
    order by id
    limit 1;

    if target_year_id is not null then
      update public.academy_years
      set
        title = 'Islam-Kinderakademie 2026/27',
        starts_on = date '2026-09-01',
        ends_on = date '2027-06-30'
      where id = target_year_id;
    else
      insert into public.academy_years (title, starts_on, ends_on, is_active)
      values ('Islam-Kinderakademie 2026/27', date '2026-09-01', date '2027-06-30', true)
      returning id into target_year_id;
    end if;
  end if;

  update public.academy_years
  set is_active = false
  where id <> target_year_id and is_active;

  update public.academy_years
  set
    starts_on = date '2026-09-01',
    ends_on = date '2027-06-30',
    is_active = true
  where id = target_year_id;

  -- Leere, eventuell uebrig gebliebene Beispieljahre koennen sicher entfernt werden.
  delete from public.academy_years as academy_year
  where academy_year.title = 'Beispiel-Akademiejahr'
    and academy_year.id <> target_year_id
    and not exists (
      select 1
      from public.learning_journeys as journey
      where journey.academy_year_id = academy_year.id
    )
    and not exists (
      select 1
      from public.groups as academy_group
      where academy_group.academy_year_id = academy_year.id
    );

  -- Bei einem erneuten lokalen Aufbau wird das von dieser Migration verwaltete
  -- Curriculum sauber neu angelegt, ohne andere Lernreisen zu beruehren.
  delete from public.learning_journeys
  where academy_year_id = target_year_id
    and title in (
      'Ich und mein Islam',
      'Die Helden der Ahlulbayt',
      'Ein Muslim im Alltag',
      'Meine Reise zu Imam Mahdi (a.)'
    );

  select coalesce(max(position), -1) + 1
  into younger_position
  from public.learning_journeys
  where academy_year_id = target_year_id and age_group = '5-8';

  select coalesce(max(position), -1) + 1
  into older_position
  from public.learning_journeys
  where academy_year_id = target_year_id and age_group = '9-12';

  for journey_definition in
    select value
    from jsonb_array_elements(
      $curriculum$
      [
        {
          "age_group": "5-8",
          "position": 0,
          "title": "Ich und mein Islam",
          "description": "September bis Oktober: Allah, der Prophet, der Qur'an, Islam, Glaube, die Imame, Ahlulbayt und gutes Verhalten.",
          "lessons": [
            "Wer bin ich als Muslim?",
            "Wer ist Allah und warum hat Er uns erschaffen?",
            "Allahs Schöpfung entdecken",
            "Was bedeutet Islam?",
            "Die Schahada",
            "Was macht einen Muslim aus?",
            "Der Qur'an",
            "Prophet Muhammad (s.)",
            "Die Imame und Ahlulbayt kennenlernen",
            "Gutes Verhalten im Islam"
          ]
        },
        {
          "age_group": "5-8",
          "position": 1,
          "title": "Die Helden der Ahlulbayt",
          "description": "November bis Januar: Geschichten, Wissen, eine moralische Botschaft und eine kleine Wochenaufgabe.",
          "lessons": [
            "Prophet Muhammad (s.)",
            "Sayyida Fatima (a.)",
            "Imam Ali (a.)",
            "Imam Hasan (a.)",
            "Imam Hussein (a.)",
            "Was in Karbala geschah",
            "Imam Sajjad (a.)",
            "Die weiteren Imame",
            "Imam Mahdi (a.)",
            "Was wir von den Ahlulbayt lernen"
          ]
        },
        {
          "age_group": "5-8",
          "position": 2,
          "title": "Ein Muslim im Alltag",
          "description": "Februar bis April: Eltern, Geschwister, Freunde, Ehrlichkeit, Geduld, Hilfsbereitschaft, Gebet und Dua.",
          "lessons": [
            "Respekt gegenüber den Eltern",
            "Ein gutes Miteinander mit Geschwistern",
            "Freundschaft",
            "Ehrlichkeit und Lügen",
            "Neid und Zufriedenheit",
            "Geduld und Selbstkontrolle",
            "Wut und Vergebung",
            "Hilfsbereitschaft und Verantwortung",
            "Gebet, Wudu und Reinheit",
            "Dua, Qur'an und Moschee"
          ]
        },
        {
          "age_group": "5-8",
          "position": 3,
          "title": "Meine Reise zu Imam Mahdi (a.)",
          "description": "April bis Juni: Imam Mahdi kennenlernen und durch gute Taten, Mut und Geduld ein guter Helfer werden.",
          "lessons": [
            "Wer ist Imam Mahdi (a.)?",
            "Was bedeutet Warten?",
            "Was erwartet Imam Mahdi (a.) von uns?",
            "Eigenschaften eines guten Helfers",
            "Gerechtigkeit",
            "Mut",
            "Wissen",
            "Geduld",
            "Gute Taten für Imam Mahdi (a.)",
            "Die große 50-Fragen-Challenge und das Zertifikat"
          ]
        },
        {
          "age_group": "9-12",
          "position": 0,
          "title": "Ich und mein Islam",
          "description": "September bis Oktober: Identität, Schahada, Usul ad-Din, Furu ad-Din, Qur'an und Prophet Muhammad (s.).",
          "lessons": [
            "Meine muslimische Identität",
            "Warum hat Allah uns erschaffen?",
            "Islam, Schahada und Muslimsein",
            "Usul ad-Din",
            "Furu ad-Din",
            "Der Qur'an als Wegbegleiter",
            "Prophet Muhammad (s.)",
            "Die Imame und ihre Aufgabe",
            "Ahlulbayt und schiitische Identität",
            "Glaube und gutes Verhalten"
          ]
        },
        {
          "age_group": "9-12",
          "position": 1,
          "title": "Die Helden der Ahlulbayt",
          "description": "November bis Januar: Ahlulbayt, Ghadir, Karbala, die Imame und ihre Bedeutung für die schiitische Identität.",
          "lessons": [
            "Prophet Muhammad (s.)",
            "Sayyida Fatima (a.)",
            "Imam Ali (a.) und Ghadir",
            "Imam Hasan (a.)",
            "Imam Hussein (a.)",
            "Karbala und seine Botschaft",
            "Imam Sajjad (a.)",
            "Die weiteren Imame der Ahlulbayt",
            "Imam Mahdi (a.)",
            "Wilayah und die Verbindung zu Ahlulbayt"
          ]
        },
        {
          "age_group": "9-12",
          "position": 2,
          "title": "Ein Muslim im Alltag",
          "description": "Februar bis April: Entscheidungen in Familie, Schule, Freundeskreis und digitalem Alltag bewusst islamisch gestalten.",
          "lessons": [
            "Freunde und Entscheidungen in der Schule",
            "Eltern und Geschwister",
            "Handy und verantwortungsvoller Umgang",
            "Ehrlichkeit, Lügen und Fehler",
            "Streit und Vergebung",
            "Mobbing und mutiges Handeln",
            "Respekt und Adab",
            "Wut, Geduld und Selbstkontrolle",
            "Hilfsbereitschaft und Verantwortung",
            "Gebet, Wudu, Fasten, Halal und Dua"
          ]
        },
        {
          "age_group": "9-12",
          "position": 3,
          "title": "Meine Reise zu Imam Mahdi (a.)",
          "description": "April bis Juni: Imamat, Wilayah, bewusstes Warten und die Eigenschaften eines verantwortungsvollen Helfers.",
          "lessons": [
            "Warum brauchen wir einen Imam?",
            "Imamat und Ghadir",
            "Ahlulbayt und Wilayah",
            "Wer ist Imam Mahdi (a.)?",
            "Bewusstes Warten",
            "Was erwartet Imam Mahdi (a.) von uns?",
            "Eigenschaften eines Helfers",
            "Gerechtigkeit, Mut und Wissen",
            "Geduld, Verantwortung und gute Taten",
            "Die große 50-Fragen-Challenge und das Zertifikat"
          ]
        }
      ]
      $curriculum$::jsonb
    )
  loop
    if journey_definition ->> 'age_group' = '5-8' then
      younger_position := younger_position + (journey_definition ->> 'position')::integer;
      age_group_label := '5–8 Jahre';
      challenge_duration := '5 Minuten';

      insert into public.learning_journeys (
        academy_year_id,
        age_group,
        title,
        description,
        position,
        is_published
      )
      values (
        target_year_id,
        '5-8',
        journey_definition ->> 'title',
        journey_definition ->> 'description',
        younger_position,
        true
      )
      returning id into journey_id;

      younger_position := younger_position - (journey_definition ->> 'position')::integer;
    else
      older_position := older_position + (journey_definition ->> 'position')::integer;
      age_group_label := '9–12 Jahre';
      challenge_duration := '5 bis 15 Minuten';

      insert into public.learning_journeys (
        academy_year_id,
        age_group,
        title,
        description,
        position,
        is_published
      )
      values (
        target_year_id,
        '9-12',
        journey_definition ->> 'title',
        journey_definition ->> 'description',
        older_position,
        true
      )
      returning id into journey_id;

      older_position := older_position - (journey_definition ->> 'position')::integer;
    end if;

    lesson_position := 0;

    for lesson_title in
      select value
      from jsonb_array_elements_text(journey_definition -> 'lessons')
    loop
      insert into public.lessons (
        learning_journey_id,
        title,
        description,
        status,
        position,
        publish_at
      )
      values (
        journey_id,
        lesson_title,
        format('Altersgerechte Online-Lektion für Kinder von %s mit Live-Unterricht und kurzer Vertiefung.', age_group_label),
        'published',
        lesson_position,
        now()::timestamp without time zone
      )
      returning id into lesson_id;

      insert into public.lesson_steps (lesson_id, step_type, title, content, position)
      values
        (
          lesson_id,
          'start',
          'Start',
          jsonb_build_object(
            'text',
            format('Einstiegsfrage oder kleine Alltagssituation zum Thema „%s“.', lesson_title)
          ),
          0
        ),
        (
          lesson_id,
          'discover',
          'Entdecken',
          jsonb_build_object(
            'text',
            format('Das Thema „%s“ mit einem Bild, einer Frage, einer Geschichte oder einer kurzen Erklärung entdecken.', lesson_title)
          ),
          1
        ),
        (
          lesson_id,
          'explain',
          'Mit eigenen Worten erklären',
          jsonb_build_object(
            'text',
            format('Das Gelernte zu „%s“ mit eigenen Worten erklären und ein eigenes Beispiel nennen.', lesson_title)
          ),
          2
        ),
        (
          lesson_id,
          'quiz',
          'Mini-Quiz',
          jsonb_build_object(
            'text',
            format('Eine kurze Verständnisfrage zum Thema „%s“ beantworten.', lesson_title)
          ),
          3
        ),
        (
          lesson_id,
          'challenge',
          'Wochen-Challenge',
          jsonb_build_object(
            'text',
            format('Eine kleine Aufgabe zu „%s“ im Alltag umsetzen. Dauer: etwa %s.', lesson_title, challenge_duration)
          ),
          4
        );

      lesson_position := lesson_position + 1;
    end loop;
  end loop;

  -- Zwei reale Kursgruppen, aber bewusst noch ohne erfundene Lehrkraft,
  -- Zoom-URL oder Unterrichtszeit.
  select id
  into younger_group_id
  from public.groups
  where academy_year_id = target_year_id
    and name = 'Gruppe 1 · 5–8 Jahre'
  order by id
  limit 1;

  if younger_group_id is null then
    insert into public.groups (academy_year_id, name, age_group)
    values (target_year_id, 'Gruppe 1 · 5–8 Jahre', '5-8')
    returning id into younger_group_id;
  end if;

  select id
  into older_group_id
  from public.groups
  where academy_year_id = target_year_id
    and name = 'Gruppe 2 · 9–12 Jahre'
  order by id
  limit 1;

  if older_group_id is null then
    insert into public.groups (academy_year_id, name, age_group)
    values (target_year_id, 'Gruppe 2 · 9–12 Jahre', '9-12')
    returning id into older_group_id;
  end if;

  -- Vorhandene echte Kinder werden passend zu ihrer Altersgruppe aufgenommen.
  insert into public.group_members (group_id, child_id)
  select younger_group_id, child.id
  from public.children as child
  where child.age_group = '5-8'
  on conflict (group_id, child_id) do nothing;

  insert into public.group_members (group_id, child_id)
  select older_group_id, child.id
  from public.children as child
  where child.age_group = '9-12'
  on conflict (group_id, child_id) do nothing;

  -- Die sechs im Konzept vorgesehenen Abzeichen.
  insert into public.badges (title, description, icon_key)
  select badge.title, badge.description, badge.icon_key
  from (
    values
      ('Qur''an-Entdecker', 'Für neugieriges Entdecken und Lernen mit dem Qur''an.', 'book'),
      ('Ahlulbayt-Entdecker', 'Für Wissen über die Familie des Propheten.', 'journeys'),
      ('Gebets-Profi', 'Für das Lernen und Üben rund um Gebet und Wudu.', 'check'),
      ('Wissens-Champion', 'Für besonderen Einsatz bei Quizfragen und Lernaufgaben.', 'trophy'),
      ('Hilfsbereiter Muslim', 'Für Hilfsbereitschaft und gute Taten im Alltag.', 'children'),
      ('Imam-Mahdi-Forscher', 'Für die abgeschlossene Reise zu Imam Mahdi (a.).', 'star')
  ) as badge(title, description, icon_key)
  where not exists (
    select 1
    from public.badges as existing_badge
    where existing_badge.title = badge.title
  );

  if not exists (
    select 1
    from public.messages
    where subject = 'Willkommen zur Islam-Kinderakademie 2026/27'
  ) then
    insert into public.messages (audience, subject, body, published_at)
    values (
      'all',
      'Willkommen zur Islam-Kinderakademie 2026/27',
      'Ein neues Lernjahr beginnt. Die Kinder entdecken ihren Glauben in altersgerechten Live-Zoom-Kursen und vertiefen das Gelernte mit kleinen interaktiven Lerneinheiten. Konkrete Termine und Zoom-Links werden im Kalender bekannt gegeben.',
      now()::timestamp without time zone
    );
  end if;
end;
$$;
