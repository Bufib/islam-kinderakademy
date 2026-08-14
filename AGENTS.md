# LLM- und Agenten-Kontext: Islam-Kinderakademie

Diese Datei ist die zentrale technische Projektdokumentation für alle Coding-LLMs und Agenten. Vor Änderungen am Projekt vollständig lesen. Sie beschreibt den aktuellen Stand, die beabsichtigte Architektur und verbindliche Sicherheitsregeln.

## 1. Produktziel

Die Islam-Kinderakademie ist eine web-first Lernplattform für islamischen Kinderunterricht. Sie verbindet:

- öffentliche Werbung und Erklärung des Angebots,
- geschützte Familien-, Kinder- und Teambereiche,
- Live-Unterricht über externe Zoom-Links,
- kleine interaktive Lerneinheiten,
- Kinderprofile, Gruppen und Lernfortschritt,
- Mitteilungen, Abgaben, Medien und Abzeichen.

Web ist die wichtigste Plattform. Die gemeinsame React-Native-Codebasis soll zusätzlich auf iOS und Android funktionieren.

Das Projekt ist aktuell ein funktionierendes Auth- und UI-Grundgerüst. Fachliche Kursinhalte und Beispieldaten dürfen nicht ohne ausdrücklichen Auftrag ergänzt werden.

## 2. Technischer Stack

- Expo `~57.0.12`
- Expo Router `~57.0.12`
- React `19.2.3`
- React Native `0.86.2`
- React Native Web `~0.21.0`
- TypeScript mit aktiviertem Strict Mode
- Supabase für Auth, PostgreSQL und später Storage
- `@supabase/supabase-js`
- AsyncStorage für persistente native Supabase-Sitzungen
- `react-native-url-polyfill`

Expo hat sich versionsabhängig stark verändert. Vor Expo- oder Expo-Router-Änderungen immer die exakten Expo-57-Dokumente unter `https://docs.expo.dev/versions/v57.0.0/` prüfen.

## 3. Wichtige Kommandos

Im Projektverzeichnis ausführen:

```bash
npm install
npm run web
npm run ios
npm run android
npm run lint
npx tsc --noEmit
npx expo export --platform web
```

Supabase:

```bash
npx supabase migration list --linked
npx supabase db push --dry-run
npx supabase db push
npx supabase db lint --linked --schema public --level warning
```

Migrationen niemals nachträglich verändern, wenn sie bereits remote ausgeführt wurden. Neue Datenbankänderungen gehören immer in eine neue Datei unter `supabase/migrations/`.

## 4. Umgebungsvariablen

Die App erwartet eine lokale `.env` mit:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Vorlage: `.env.example`.

Verbindliche Regeln:

- Nur den Supabase Publishable Key beziehungsweise alten `anon`-Key im Client verwenden.
- Niemals `service_role`, Secret Keys, Datenbankpasswörter oder andere Server-Secrets in Expo-Code oder Git speichern.
- `.env` ist absichtlich über `.gitignore` ausgeschlossen.
- Nach Änderungen an `.env` den Expo-Prozess vollständig neu starten.

## 5. Routing und Zugriffsschutz

Der Einstieg liegt in `src/app/_layout.tsx`.

Öffentliche Routen:

- `/` – reine Werbe-Startseite
- `/login` – Anmeldung
- `/register` – Registrierung

Geschützte Routen:

- `/dashboard` – rollenabhängige Übersicht
- `/account` – Kontodaten und Abmelden
- `/lernreisen`
- `/kalender`
- `/islam-pass`
- `/kinder`
- `/mitteilungen`
- `/curriculum`
- `/lektionen`
- `/lektion-neu`
- `/gruppen`
- `/medien`

Die geschützten Seiten sind mit `Stack.Protected` aus Expo Router abgesichert. Nicht angemeldete Nutzer dürfen keine Akademieseite erreichen.

Wichtig: Clientseitige Protected Routes ersetzen niemals Datenbanksicherheit. Jede Supabase-Tabelle benötigt weiterhin RLS.

## 6. Authentifizierung

Zentrale Dateien:

- `src/lib/supabase.ts` – Supabase-Client
- `src/context/auth-context.tsx` – Sitzung, Profil, Rollen und Auth-Aktionen
- `src/app/login.tsx` – Loginformular
- `src/app/register.tsx` – Registrierung
- `src/app/account.tsx` – Accountanzeige und Abmeldung

Unterstützte Abläufe:

- Registrierung mit Anzeigename, E-Mail und Passwort
- optionale E-Mail-Bestätigung über Supabase
- Anmeldung mit E-Mail und Passwort
- persistente Sitzung im Browser und auf nativen Geräten
- automatische Wiederherstellung der Sitzung beim Appstart
- Abmelden
- Fallback auf Metadaten des Auth-Nutzers, falls das Profil nicht geladen werden kann

Beim Registrieren schreibt die App `display_name` in `user_metadata`. Der Datenbanktrigger `handle_new_auth_user()` erstellt anschließend:

1. einen Datensatz in `profiles`,
2. einen Datensatz in `user_roles` mit der Rolle `parent`.

Supabase verwaltet eigentliche Auth-Nutzer in `auth.users`. Niemals eine eigene Passworttabelle anlegen.

## 7. Rollenmodell

Datenbankrollen:

- `parent`
- `teacher`
- `admin`

UI-Rollen in `src/types/academy.ts`:

- `parent`
- `team`
- `child`

Zuordnung in `src/context/academy-context.tsx`:

- `parent` → Elternbereich
- `teacher` oder `admin` → Teambereich

Neue Konten sind immer Elternkonten. Lehrkraft- und Adminrollen dürfen nur über eine gesicherte Adminfunktion oder direkt im Supabase-Dashboard vergeben werden. Es darf keinen frei zugänglichen Rollenwechsel im Client geben.

Die Kinderansicht ist als UI-Grundgerüst vorhanden, wird aktuell aber nicht über einen eigenen Kinder-Login ausgewählt. Kinder werden fachlich über `children` einem Elternprofil zugeordnet.

## 8. Supabase-Datenmodell

Alle fachlichen Tabellen verwenden:

- `id bigint generated by default as identity primary key`
- `created_at timestamp without time zone not null default now()`

Ausnahme: absolute Live-Terminzeiten verwenden `timestamp with time zone`, damit Zeitzonen korrekt behandelt werden.

### Accounts

#### `profiles`

- `id`
- `auth_user_id` → `auth.users.id`
- `display_name`
- `avatar_url`
- `created_at`

#### `user_roles`

- `id`
- `profile_id` → `profiles.id`
- `role`
- `created_at`

### Akademiestruktur

#### `academy_years`

Kurs- beziehungsweise Akademiezeiträume mit Start, Ende und Aktivstatus.

#### `learning_journeys`

Lernreisen nach Akademiejahr und Altersgruppe. Enthält Reihenfolge und Veröffentlichungsstatus.

#### `lessons`

Lektionen innerhalb einer Lernreise. Statuswerte:

- `draft`
- `scheduled`
- `published`
- `archived`

#### `lesson_steps`

Interaktive Schritte einer Lektion. Typen:

- `start`
- `discover`
- `explain`
- `quiz`
- `challenge`

Strukturierte Schrittinhalte liegen später im `jsonb`-Feld `content`.

### Familien und Gruppen

#### `children`

Kinderprofile eines Elternprofils. Altersgruppen:

- `5-8`
- `9-12`

#### `groups`

Unterrichtsgruppen pro Akademiejahr und Altersgruppe, optional einer Lehrkraft zugeordnet.

#### `group_members`

Many-to-many-Zuordnung zwischen Gruppen und Kindern.

### Live-Unterricht

#### `live_sessions`

Zoom- oder andere Live-Termine pro Lektion und optional pro Gruppe. Enthält:

- `starts_at` und `ends_at` als `timestamp with time zone`
- `meeting_url`
- `replay_url`
- Status `scheduled`, `live`, `completed` oder `cancelled`

Meeting-URLs dürfen nur für berechtigte Gruppen beziehungsweise Mitarbeitende lesbar sein.

### Fortschritt und Interaktion

#### `child_lesson_progress`

Fortschritt eines Kindes pro Lektion mit Status und Prozentwert.

#### `child_step_progress`

Abgeschlossene einzelne Lernschritte.

#### `submissions`

Abgaben eines Kindes. Typen:

- `confirmation`
- `text`
- `audio`
- `image`

Dateien selbst gehören später in Supabase Storage; die Tabelle speichert nur den Pfad.

#### `badges`

Definition verfügbarer Abzeichen.

#### `child_badges`

Einem Kind verliehene Abzeichen.

### Medien und Kommunikation

#### `media_assets`

Metadaten für Bilder, Audio, Video oder Dokumente. Die eigentlichen Dateien liegen später im Storage-Bucket `academy-media`.

#### `messages`

Mitteilungen an alle, an ein bestimmtes Profil oder an eine Gruppe.

### Beziehungen

```text
auth.users
  └── profiles
        ├── user_roles
        └── children
              ├── group_members ── groups
              ├── child_lesson_progress
              ├── child_step_progress
              ├── submissions
              └── child_badges ── badges

academy_years
  ├── groups
  └── learning_journeys
        └── lessons
              ├── lesson_steps
              ├── live_sessions
              ├── child_lesson_progress
              └── submissions
```

## 9. RLS- und Sicherheitsmodell

Die RLS-Regeln liegen in:

- `supabase/migrations/20260814050100_academy_row_level_security.sql`

Grundprinzipien:

- Anonyme Besucher haben keinen Zugriff auf Akademietabellen.
- Eltern sehen und verändern nur ihre eigenen Kinderprofile und deren Fortschritt beziehungsweise Abgaben.
- Eltern sehen nur aktive und veröffentlichte Akademie-Inhalte.
- Eltern sehen Gruppentermine und Mitteilungen nur für zugängliche Gruppen.
- Lehrkräfte und Admins gelten als Akademieteam und können fachliche Inhalte verwalten.
- Nur Admins dürfen Rollen verändern.
- Die öffentliche Werbeseite liest keine geschützten Daten.

Zentrale RLS-Helfer:

- `current_profile_id()`
- `has_account_role(role)`
- `is_academy_staff()`
- `owns_child(child_id)`
- `can_access_group(group_id)`

RLS niemals zur Behebung eines Clientfehlers deaktivieren. Stattdessen Policy, Rolle und Abfrage gezielt prüfen.

## 10. Supabase-Migrationen

Aktueller relevanter Stand:

- `20260814015644_initial_academy_schema.sql` – historisch bereits leer ausgeführt
- `20260814050000_academy_learning_schema.sql` – Accountabgleich, Tabellen, Beziehungen, Indizes und Funktionen
- `20260814050100_academy_row_level_security.sql` – RLS-Policies und Grants

Die beiden Akademiemigrationen sind auf dem aktuell verknüpften Supabase-Projekt ausgeführt. Remote-Schema-Lint war danach fehlerfrei.

Keine Seeds oder fachlichen Beispieldaten anlegen, solange der Nutzer dies nicht ausdrücklich verlangt.

## 11. Aktueller Funktionsstand

Bereits funktional umgesetzt:

- responsive öffentliche Werbe-Startseite
- Registrierung und Login über Supabase
- persistente Sitzung
- E-Mail-Bestätigungsablauf
- Protected Routes
- rollenabhängiger Eltern- beziehungsweise Teambereich
- Accountansicht und Abmelden
- vollständiges leeres Datenbankschema mit RLS
- responsive App-Shell für Web und Mobile

Noch nicht funktional angebunden:

- CRUD für Kinderprofile
- Laden und Bearbeiten von Lernreisen und Lektionen
- Speichern interaktiver Lernschritte
- Zoom-Termine aus `live_sessions`
- Gruppenverwaltung
- Fortschritt und Abgaben
- Badges
- Mitteilungen aus Supabase
- Supabase Storage und Uploads
- Passwort-zurücksetzen-Ablauf
- Profilbearbeitung
- Zahlungs- oder Mitgliedschaftssystem
- Push-Benachrichtigungen

Die vorhandenen Fachseiten sind momentan UI-Grundgerüste beziehungsweise Empty States. Eine existierende Tabelle bedeutet nicht automatisch, dass die Seite bereits Daten lädt.

## 12. Frontend-Struktur

```text
src/
  app/
    _layout.tsx            Root-Stack und Protected Routes
    index.tsx              öffentliche Werbe-Startseite
    login.tsx              Anmeldung
    register.tsx           Registrierung
    dashboard.tsx          rollenabhängiges Dashboard
    account.tsx            Account und Abmelden
    ...                    fachliche Akademieseiten
  components/
    app-shell.tsx          Sidebar, Topbar und Mobilnavigation
    brand-mark.tsx         Markenlogo
    auth/                  gemeinsame Auth-UI
    dashboards/            Eltern-, Kinder- und Teamübersichten
    ui/                    Icons und UI-Primitives
  constants/
    design.ts              Farben, Abstände, Radien und Breakpoints
  context/
    auth-context.tsx       Supabase-Sitzung und Accountprofil
    academy-context.tsx    Zuordnung der Accountrolle zur UI
  lib/
    supabase.ts            Supabase-Clientkonfiguration
  types/
    academy.ts             fachliche TypeScript-Modelle
  utils/
    auth-errors.ts         deutsche Auth-Fehlermeldungen
```

## 13. Design- und UX-Regeln

- Sprache der Oberfläche ist Deutsch.
- Web-first und responsive entwickeln; native Kompatibilität erhalten.
- Bestehende Farbpalette und Komponenten aus `src/constants/design.ts` und `src/components/ui/` wiederverwenden.
- Öffentliche Seiten dürfen die interne App-Shell nicht anzeigen.
- Geschützte Seiten verwenden die gemeinsame App-Shell.
- Leere Bereiche als klare Empty States darstellen, keine erfundenen Kursdaten einfügen.
- Eltern dürfen niemals durch einen Client-Schalter in die Teamrolle wechseln.
- Zoom-Links und Kinderdaten nie auf öffentlichen Routen rendern.

## 14. Vorgehen bei neuen Features

Bei jeder Erweiterung:

1. Prüfen, welcher Nutzer und welche Rolle das Feature verwenden darf.
2. Vorhandene Tabellen und RLS-Policies prüfen.
3. Datenbankänderungen ausschließlich als neue Migration erstellen.
4. Supabase-Abfragen in eine klar abgegrenzte Datenzugriffsschicht auslagern.
5. Lade-, Leer- und Fehlerzustände umsetzen.
6. Keine echten Secrets oder Service-Role-Clients im Frontend verwenden.
7. Web sowie sinnvolle mobile Breakpoints prüfen.
8. TypeScript, Lint und Web-Export ausführen.

Abschlussprüfungen:

```bash
npx tsc --noEmit
npm run lint
npx expo export --platform web
git diff --check
```
