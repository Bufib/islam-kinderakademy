# Islam-Kinderakademie

Responsive Grundgerüst für die Lernplattform der Islam-Kinderakademie. Das Projekt basiert auf Expo 57, React Native, React Native Web und Supabase Auth.

## Enthaltene Bereiche

- Kinderansicht mit Übersicht, Lernreisen, Kalender und Islam-Pass
- Elternbereich mit Kinderprofilen, Terminen und Mitteilungen
- Team-Bereich mit Curriculum, Lektionen, Gruppen und Medien
- leerer Lektionseditor mit der vorgesehenen Fünf-Schritte-Struktur
- responsive Desktop- und Mobilnavigation
- öffentliche Werbe-Startseite sowie Registrierung und Anmeldung
- geschützte Akademie-Routen mit Expo Router
- Supabase-Sitzungsspeicherung für Web, iOS und Android
- Accountbereich mit Rollenanzeige und Abmeldung
- leere, typisierte Domänenmodelle in `src/types/academy.ts`

Es sind bewusst noch keine fachlichen Lektionen, Medien, Nutzer oder Termine enthalten.

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

Die Migrationen gleichen `profiles` und `user_roles` ab, richten den Trigger für neue Elternkonten ein und legen das leere Akademie-Datenmodell an:

- `academy_years`, `learning_journeys`, `lessons` und `lesson_steps`
- `children`, `groups` und `group_members`
- `live_sessions`
- `child_lesson_progress`, `child_step_progress` und `submissions`
- `badges` und `child_badges`
- `media_assets` und `messages`

Alle Tabellen sind durch RLS geschützt. Familien sehen nur ihre eigenen Kinder- und Fortschrittsdaten sowie veröffentlichte Inhalte; Lehrkräfte und Admins können Akademie-Inhalte verwalten. Für echte Dateien werden später zusätzlich ein Supabase-Storage-Bucket und eigene Storage-Policies benötigt.

3. Unter **Authentication → URL Configuration** die URLs freigeben:

- Site URL lokal: `http://localhost:8081`
- Redirect lokal: `http://localhost:8081/login`
- Redirect Produktion: `https://DEINE-DOMAIN/login`
- Redirect App: `islamkinderakademie://login`

## Starten

```bash
npm install
npm run web
```

Die öffentliche Seite liegt unter `/`. Nach der Anmeldung führt `/dashboard` in den geschützten Akademiebereich. Neue Konten erhalten automatisch die Rolle `parent`; `teacher` und `admin` werden ausschließlich in Supabase vergeben.

## Prüfungen

```bash
npm run lint
npx tsc --noEmit
npx expo export --platform web
```
