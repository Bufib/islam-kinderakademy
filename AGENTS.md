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

Das Projekt ist eine funktionierende Supabase-gestützte Lernplattform. Als fachliche Grundstruktur ist das ausdrücklich gelieferte Akademiekonzept 2026/27 hinterlegt; weitergehende Detailinhalte dürfen nicht ohne Auftrag ergänzt werden.

## 2. Technischer Stack

- Expo `~57.0.12`
- Expo Router `~57.0.12`
- React `19.2.3`
- React Native `0.86.2`
- React Native Web `~0.21.0`
- TypeScript mit aktiviertem Strict Mode
- Supabase für Auth, PostgreSQL und privaten Storage
- `@supabase/supabase-js`
- AsyncStorage für persistente native Supabase-Sitzungen
- `react-native-url-polyfill`
- `@react-native-community/datetimepicker` für native Datums- und Zeitauswahl

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

GitHub Pages:

- Repository: `Bufib/islam-kinderakademy`
- Produktions-URL: `https://bufib.github.io/islam-kinderakademy/`
- Expo-Unterpfad: `experiments.baseUrl = "/islam-kinderakademy"`
- Workflow: `.github/workflows/deploy-pages.yml`
- Deployment-Branch: `erweiterung` (ein Push auf diesen Branch veröffentlicht die aktuelle Web-App)
- Der Workflow erwartet die Repository-Secrets `EXPO_PUBLIC_SUPABASE_URL` und `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

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
- `/passwort-vergessen` – Passwort-Wiederherstellung

Geschützte Routen:

- `/dashboard` – rollenabhängige Übersicht
- `/account` – Kontodaten und Abmelden
- `/lernreisen`
- `/kalender`
- `/islam-pass`
- `/kinder`
- `/mitteilungen`
- `/mitteilung/[id]` – vollständige, geschützte Mitteilungsansicht
- `/curriculum`
- `/lektionen`
- `/lektion-neu`
- `/lektion/[id]`
- `/quiz/[lessonId]` – eigenständiges Multiple-Choice-Quiz für das ausgewählte Kind
- `/quiz-bearbeiten` – Quizverwaltung für Lehrkräfte und Admins
- `/gruppen`
- `/medien`
- `/abzeichen`
- `/abgaben`
- `/konten` – ausschließlich Admins

Die geschützten Seiten sind mit verschachtelten `Stack.Protected`-Bereichen aus Expo Router abgesichert. Nicht angemeldete Nutzer dürfen keine Akademieseite erreichen. Zusätzlich sind Kinder-, Eltern- und Teamrouten nach der aktiven UI-Rolle getrennt.

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
- Profilname und Passwort ändern
- Passwort-Wiederherstellungslink per E-Mail anfordern
- Fallback auf Metadaten des Auth-Nutzers, falls das Profil nicht geladen werden kann

Wiederholte Supabase-Auth-Ereignisse für denselben Nutzer, etwa `SIGNED_IN` oder `TOKEN_REFRESHED` beim Fokuswechsel eines Browser-Tabs, dürfen weder das React-Sessionobjekt ersetzen noch das Profil erneut laden. Dadurch darf die geschützte App beim Zurückwechseln nicht neu rendern oder in den globalen Ladebildschirm springen. Änderungen am Nutzer sowie Abmeldung und Kontowechsel werden weiterhin übernommen.

Der globale Ladebildschirm in `src/app/_layout.tsx` ist nur für die initiale Sitzung beziehungsweise das erste noch nicht vorhandene Profil vorgesehen. Eine spätere Profilaktualisierung läuft mit dem bestehenden Profil im Hintergrund und darf die aktuelle Route nicht ausblenden.

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

Die Kinderansicht wird vom Elternkonto aus über ein konkretes Kinderprofil geöffnet. Es gibt bewusst keinen eigenen Kinder-Login. Beim Verlassen der Kinderansicht wechselt die App zurück in den Elternbereich. Kinder werden fachlich über `children` einem Elternprofil zugeordnet.

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

#### `age_groups`

Frei verwaltbare Altersgruppen mit Titel, optionalem Altersbereich und Reihenfolge. Admins pflegen sie im Curriculum. Kinder, Lernreisen und Gruppen referenzieren sie über `age_group_id`; fest codierte Altersgruppenwerte dürfen im Frontend nicht wieder eingeführt werden.

#### `academy_years`

Kurs- beziehungsweise Akademiezeiträume mit Start, Ende und Aktivstatus.

#### `learning_journeys`

Lernreisen sind über das verpflichtende Fremdschlüsselfeld `academy_year_id` genau einem Akademiejahr und über `age_group_id` genau einer Altersgruppe zugeordnet. Die Oberfläche muss diese Zuordnung beim Anlegen vorauswählen, beim Bearbeiten änderbar machen und an der Lernreise sichtbar anzeigen. Außerdem enthält die Tabelle Reihenfolge und Veröffentlichungsstatus.

#### `lessons`

Lektionen innerhalb einer Lernreise. Statuswerte:

- `draft`
- `scheduled`
- `published`
- `archived`

`intro_text` enthält den verpflichtenden Einstieg vor der Live-Vorlesung.

`is_released`, `released_at` und `released_by_profile_id` bilden die manuelle Admin-Freigabe ab. Der fachliche Status `published` allein macht eine Lektion für Familien noch nicht sichtbar. Wird die Lektion wieder zu Entwurf, Planung oder Archiv, sperrt die Datenbank sie und das zugehörige Quiz automatisch.

#### `lesson_steps`

Interaktive Schritte einer Lektion. Typen:

- `start`
- `discover`
- `explain`
- `quiz`
- `challenge`

Strukturierte Schrittinhalte liegen im `jsonb`-Feld `content`. Die Tabelle bleibt für ältere interaktive Einheiten erhalten; der aktuelle Hauptablauf verwendet Einstiegstext, Live-Termin und separates Quiz.

### Multiple-Choice-Quizze

#### `lesson_quizzes`

Pro Lektion kann ein Quiz mit Titel, Beschreibung und Bestehensgrenze angelegt werden. `is_published`, `released_at` und `released_by_profile_id` bilden die separate Admin-Freigabe ab. Sie ist erst möglich, wenn die Lektion freigegeben und mindestens ein zugehöriger Live-Termin als `completed` markiert wurde.

#### `quiz_questions` und `quiz_options`

Enthalten geordnete Fragen und jeweils mindestens zwei Antwortmöglichkeiten.

#### `quiz_answer_keys`

Enthält die richtige Antwort und eine optionale Erklärung. Familien können diese Tabelle durch RLS nicht lesen.

#### `quiz_attempts` und `quiz_attempt_answers`

Speichern Versuche, ausgewählte Antworten, Prozentwert und Bestanden-Status. Die Auswertung erfolgt atomar über `submit_multiple_choice_quiz()`; bestandene Quizze schließen den Lektionsfortschritt ab.

### Familien und Gruppen

#### `children`

Kinderprofile eines Elternprofils mit einer Referenz `age_group_id` auf `age_groups`.

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

Die App erstellt derzeit keine Zoom-Meetings über die Zoom API und bettet keinen Zoom-Client ein. Ein Admin plant das echte Meeting außerhalb der App in Zoom und trägt ausschließlich den Teilnehmerlink im Feld `meeting_url` des Lektionseditors ein. Familien öffnen diesen externen Link aus der geschützten Lektionsansicht. Niemals Host-Key, Zoom-Kontopasswort oder andere Zoom-Secrets im Frontend beziehungsweise in `meeting_url` speichern. Ein im Teilnehmerlink codierter Meeting-Passcode ist davon nicht betroffen.

Die Terminstatus werden im Kalender manuell gepflegt. Nach dem Unterricht muss ein Termin auf `completed` gesetzt werden, bevor das zugehörige Quiz freigegeben werden kann. Eine spätere automatische Meeting-Erstellung benötigt eine serverseitige Zoom-OAuth-/Meetings-API-Integration, beispielsweise über eine geschützte Supabase Edge Function; Zoom-Secrets dürfen dabei nicht in den Expo-Client gelangen.

In der Oberfläche werden Terminzeiten nicht als kombinierter ISO-Text eingegeben. Web verwendet ein Kalenderfeld und native Uhrzeitfelder; iOS und Android verwenden den nativen DateTimePicker. Ein Live-Termin hat ein gemeinsames Datum sowie getrennte Felder für Beginn und Ende. Vor dem Schreiben werden diese lokalen Werte wieder in ISO-Zeitpunkte umgewandelt.

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

Dateien selbst gehören in Supabase Storage; die Tabelle speichert nur den Pfad. Die aktuelle Lernoberfläche unterstützt Textantworten und Bestätigungen. Audio- und Bildabgaben sind im Schema vorbereitet, aber noch nicht Teil der UI.

#### `badges`

Definition verfügbarer Abzeichen.

#### `child_badges`

Einem Kind verliehene Abzeichen.

### Medien und Kommunikation

#### `media_assets`

Metadaten für Bilder, Audio, Video oder Dokumente. Die eigentlichen Dateien liegen im privaten Storage-Bucket `academy-media`.

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
              ├── lesson_quizzes
              │     ├── quiz_questions ── quiz_options
              │     └── quiz_attempts ── quiz_attempt_answers
              ├── child_lesson_progress
              └── submissions

age_groups
  ├── children
  ├── groups
  └── learning_journeys
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
- `list_admin_accounts()`
- `set_profile_primary_role(profile_id, role)`
- `save_multiple_choice_quiz(...)`
- `submit_multiple_choice_quiz(...)`

RLS niemals zur Behebung eines Clientfehlers deaktivieren. Stattdessen Policy, Rolle und Abfrage gezielt prüfen.

## 10. Supabase-Migrationen

Aktueller relevanter Stand:

- `20260814015644_initial_academy_schema.sql` – historisch bereits leer ausgeführt
- `20260814050000_academy_learning_schema.sql` – Accountabgleich, Tabellen, Beziehungen, Indizes und Funktionen
- `20260814050100_academy_row_level_security.sql` – RLS-Policies und Grants
- `20260814061000_academy_media_storage.sql` – privater Medien-Bucket und Storage-Policies
- `20260814062000_ensure_account_profiles.sql` – Backfill und sichere Reparatur fehlender Auth-Profile
- `20260814063000_example_academy_data.sql` – historischer Beispiel-Seed ohne Auth-Nutzer
- `20260814064000_admin_account_management.sql` – Admin-Kontenübersicht und atomare Rollenwechsel
- `20260814065000_academy_2026_27_curriculum.sql` – entfernt den Beispiel-Seed und legt das echte Curriculum 2026/27 mit vier Lernreisen und 40 Wochen pro Altersgruppe an
- `20260814070000_lesson_live_quizzes.sql` – Einstiegstexte, normalisierte Multiple-Choice-Quizze, Versuche, RLS und serverseitige Auswertung
- `20260815080000_manual_lesson_quiz_release.sql` – getrennte manuelle Admin-Freigaben für Lektion und Quiz
- `20260815100000_dynamic_age_groups.sql` – frei verwaltbare Altersgruppen und Fremdschlüssel für Kinder, Gruppen und Lernreisen

Alle genannten Migrationen sind auf dem aktuell verknüpften Supabase-Projekt ausgeführt. Remote-Schema-Lint war danach fehlerfrei.

Weitere Seeds oder fachliche Beispieldaten nur auf ausdrücklichen Auftrag anlegen.

## 11. Aktueller Funktionsstand

Bereits funktional umgesetzt:

- responsive öffentliche Werbe-Startseite
- Registrierung und Login über Supabase
- persistente Sitzung
- E-Mail-Bestätigungsablauf
- Protected Routes nach Anmeldung und UI-Rolle
- rollenabhängiger Eltern-, Kinder- und Teambereich
- Accountansicht, Profilbearbeitung, Passwortänderung und Abmelden
- Passwort-Wiederherstellung per Supabase-E-Mail
- vollständiges leeres Datenbankschema mit RLS
- responsive App-Shell für Web und Mobile
- CRUD für Kinderprofile, Akademiejahre, Lernreisen, Lektionen, Gruppen und Live-Termine
- Admin-CRUD für frei verwaltbare Altersgruppen im Curriculum
- anklickbare Akademiejahre im Curriculum; beim Einstieg ist kein Jahr vorausgewählt und Lernreisen bleiben verborgen, bis ein Jahr bewusst geöffnet wurde. Danach werden sie nach geöffnetem Jahr und gewählter Altersgruppe gefiltert und direkt dort bearbeitet
- dreistufiger Lektionseditor für Einstiegstext, geplanten Live-Zoom-Termin und separates Multiple-Choice-Quiz
- kalendergestützte Datumswahl und getrennte Start-/Endzeit für Zoom-Termine auf Web, iOS und Android
- klar sichtbare Admin-Freigabe direkt im Lektionseditor und in der Lektionsübersicht
- Lektionsübersicht bildet die verpflichtende Hierarchie Akademiejahr → Lernreise → Lektion sichtbar ab und sortiert innerhalb der Lernreise nach `lessons.position`; filterbar nach Akademiejahr, Altersgruppe, Lernreise, Status und Suchtext
- Lernreisen sind in der Lektionsübersicht standardmäßig kompakt. Ein Chevron in jeder Lernreise-Kopfzeile blendet alle zugehörigen Lektionen gemeinsam ein oder aus. Innerhalb einer geöffneten Lernreise zeigt jede Lektion zunächst eine kompakte Zusammenfassung; ihr eigener Chevron öffnet Beschreibung, Freigaben sowie Bearbeiten-/Löschen-Aktionen
- Admin-Sammelfreigabe für alle aktuell gefilterten oder alle in einer Lernreise enthaltenen, veröffentlichten und noch gesperrten Lektionen. Entwürfe dürfen dabei nicht automatisch veröffentlicht werden
- Quiz-Editor mit beliebig vielen Fragen und Antwortmöglichkeiten, genau einer richtigen Antwort und einstellbarer Bestehensgrenze
- geschützte Quizseite für Kinder mit serverseitiger Auswertung und Wiederholungsversuchen
- Fortschritt pro Schritt und Lektion
- Textantworten und Challenge-Bestätigungen
- extern erstellte Zoom-Teilnehmerlinks und Replay-Links aus Supabase; keine automatische Zoom-Meeting-Erstellung und kein eingebetteter Zoom-Client
- Mitteilungen an alle, einzelne Profile oder Gruppen
- kompakte Mitteilungsübersicht mit Titel/erstem Satz und separater Detailansicht
- Abzeichenverwaltung und persönliche Verleihung
- Abgabenübersicht für das Akademieteam
- private Medien-Uploads, signierte Download-Links und Löschung in Supabase Storage
- datengetriebene Eltern-, Kinder- und Team-Dashboards
- separates Admin-Dashboard mit Systemkennzahlen und Admin-Schnellzugriffen
- durchsuchbare Themen- und Quizverwaltung im Admin-Dashboard mit direktem Einstieg in die Lektionsbearbeitung sowie das Anlegen und Bearbeiten von Multiple-Choice-Fragen
- geschützte Kontenübersicht mit E-Mail-Adressen und Rollenverwaltung

Noch nicht umgesetzt beziehungsweise bewusst auf später verschoben:

- ausformulierte Unterrichtsinhalte für die vorhandenen Themen- und Schrittgerüste
- Audio- und Bildabgaben aus Lernschritten
- Zahlungs- oder Mitgliedschaftssystem
- Push-Benachrichtigungen
- automatische Erstellung oder Änderung von Zoom-Meetings über die Zoom API

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
    lektion/[id].tsx       Kinder-Lektion und Interaktionen
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
    academy-context.tsx    Zuordnung der Accountrolle und Kinderprofil-Auswahl
    academy-data-context.tsx gemeinsamer Datenzustand und Aktualisierung
  lib/
    supabase.ts            Supabase-Clientkonfiguration
    academy-api.ts         Abfragen, CRUD, Lernfortschritt und Storage
  types/
    academy.ts             fachliche TypeScript-Modelle
    database.ts            Zeilentypen des Supabase-Datenmodells
  utils/
    auth-errors.ts         deutsche Auth-Fehlermeldungen
```

## 13. Design- und UX-Regeln

- Sprache der Oberfläche ist Deutsch.
- Web-first und responsive entwickeln; native Kompatibilität erhalten.
- Die gemeinsamen Breakpoints liegen in `src/constants/design.ts`: Unter `620 px` gelten kompakte Smartphone-Abstände, unter `1024 px` verwendet die geschützte App die Mobilnavigation und unter `1200 px` werden breite Inhalts-Spalten untereinander angeordnet.
- Keine Bildschirmbreite darf über feste Geräteprofile wie „iPhone 12“ behandelt werden. Layouts müssen fließend von kleinen Smartphones über Tablets bis zu großen Desktopfenstern funktionieren.
- Horizontale Inhaltsbereiche müssen umbrechen oder untereinander wechseln. Karten, Eingaben, Textblöcke und Aktionsleisten erhalten auf schmalen Ansichten `minWidth: 0` beziehungsweise höchstens `100%` Breite; feste Mindestbreiten benötigen immer eine kompakte Überschreibung.
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
