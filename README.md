# Islam-Kinderakademie

Web-first Lernplattform der Islam-Kinderakademie auf Basis von Expo 57, React Native, React Native Web und Supabase.

## Enthaltene Bereiche

- Kinderansicht mit Übersicht, Lernreisen, Kalender und Islam-Pass
- Elternbereich mit Kinderprofilen, Terminen und Mitteilungen
- Team-Bereich mit Curriculum, Lektionen, Gruppen und Medien
- Lektionseditor und Kinderansicht mit der vorgesehenen Fünf-Schritte-Struktur
- responsive Desktop- und Mobilnavigation
- öffentliche Werbe-Startseite sowie Registrierung und Anmeldung
- geschützte Akademie-Routen mit Expo Router
- Supabase-Sitzungsspeicherung für Web, iOS und Android
- Accountbereich mit Profil-, Passwort- und Abmeldefunktionen
- separates Admin-Dashboard mit Konten- und Rollenverwaltung
- Supabase-Datenschicht für CRUD, Lernfortschritt, Abgaben und Medien

Eine kleine, klar als Beispiel markierte Datenbasis ist enthalten. Es werden dabei keine künstlichen Auth-Nutzer oder Passwörter angelegt.

## Supabase einrichten

1. Die Beispieldatei kopieren und die Werte aus **Supabase → Project Settings → API** eintragen:

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=DEIN_PUBLISHABLE_KEY
```

In der App darf nur der Publishable Key verwendet werden, niemals der `service_role`-Key.

2. Die Migration auf das verknüpfte Supabase-Projekt anwenden:

```bash
npx supabase db push
```

Die Migrationen gleichen `profiles` und `user_roles` ab, reparieren fehlende Profile älterer Auth-Konten, richten den Trigger für neue Elternkonten ein und legen das Akademie-Datenmodell an:

- `academy_years`, `learning_journeys`, `lessons` und `lesson_steps`
- `children`, `groups` und `group_members`
- `live_sessions`
- `child_lesson_progress`, `child_step_progress` und `submissions`
- `badges` und `child_badges`
- `media_assets` und `messages`

Alle Tabellen sind durch RLS geschützt. Familien sehen nur ihre eigenen Kinder- und Fortschrittsdaten sowie veröffentlichte Inhalte; Lehrkräfte und Admins können Akademie-Inhalte verwalten. Dateien liegen im privaten Storage-Bucket `academy-media` und werden über kurzlebige signierte URLs geöffnet.

Die Migration `20260814063000_example_academy_data.sql` ergänzt veröffentlichte Beispiel-Lernreisen, zwei Lektionen, Lernschritte, Gruppen, einen Termin, Abzeichen, eine Mitteilung und für bestehende reine Elternkonten ein `Beispielkind`.

3. Unter **Authentication → URL Configuration** die URLs freigeben:

- Site URL lokal: `http://localhost:8081`
- Redirect lokal: `http://localhost:8081/login`
- Redirect lokal Passwort: `http://localhost:8081/account`
- Redirect Produktion: `https://DEINE-DOMAIN/login`
- Redirect Produktion Passwort: `https://DEINE-DOMAIN/account`
- Redirect App: `islamkinderakademie://login`
- Redirect App Passwort: `islamkinderakademie://account`

## Starten

```bash
npm install
npm run web
```

Die öffentliche Seite liegt unter `/`. Nach der Anmeldung führt `/dashboard` abhängig von der Rolle in den Eltern-, Lehrkraft- oder Adminbereich. Neue Konten erhalten automatisch die Rolle `parent`; Admins können Konten anschließend geschützt unter `/konten` zu Lehrkräften oder weiteren Admins machen.

## Prüfungen

```bash
npm run lint
npx tsc --noEmit
npx expo export --platform web
```
