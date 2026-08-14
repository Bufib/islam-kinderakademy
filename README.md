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

Das gelieferte Akademiekonzept 2026/27 ist als strukturierter Lehrplan enthalten. Es werden keine künstlichen Auth-Nutzer, Kinderprofile oder Passwörter angelegt.

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

Die Migration `20260814065000_academy_2026_27_curriculum.sql` entfernt die früheren Beispieldaten und richtet das Akademiejahr 2026/27 ein. Enthalten sind zwei Altersgruppen, vier jährliche Lernreisen, ein 40-Wochen-Themengerüst je Altersgruppe, fünf vorbereitete Lernschritte pro Lektion, zwei Kursgruppen, sechs Abzeichen und eine Startmitteilung. Reale Zoom-Termine, Links und Lehrkraft-Zuordnungen werden anschließend im geschützten Team-Bereich gepflegt.

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

## Auf GitHub Pages veröffentlichen

Das Projekt ist für das Repository `Bufib/islam-kinderakademy` und damit für den Unterpfad `/islam-kinderakademy` konfiguriert. Der Workflow `.github/workflows/deploy-pages.yml` baut und veröffentlicht die Web-App automatisch bei jedem Push auf `main`. Während des Builds wird außerdem ein Pages-Fallback für direkt aufgerufene dynamische Lektions- und Mitteilungsrouten erzeugt.

Im GitHub-Repository müssen unter **Settings → Secrets and variables → Actions** diese Repository-Secrets angelegt werden:

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Nur den Publishable Key verwenden, niemals den `service_role`-Key. Unter **Settings → Pages → Build and deployment** anschließend als Quelle **GitHub Actions** auswählen.

In Supabase unter **Authentication → URL Configuration → Redirect URLs** ergänzen:

```text
https://bufib.github.io/islam-kinderakademy/login
https://bufib.github.io/islam-kinderakademy/account
```

Nach einem Push auf `main` ist die App unter `https://bufib.github.io/islam-kinderakademy/` erreichbar. Den Fortschritt zeigt GitHub im Tab **Actions** an.

## Prüfungen

```bash
npm run lint
npx tsc --noEmit
npx expo export --platform web
```
