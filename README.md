# Islam-Kinderakademie

Web-first Lernplattform der Islam-Kinderakademie auf Basis von Expo 57, React Native, React Native Web und Supabase.

## Enthaltene Bereiche

- Kinderansicht mit Übersicht, Lernreisen, Kalender und Islam-Pass
- Elternbereich mit Kinderprofilen, Terminen und Mitteilungen
- Team-Bereich mit Curriculum, Lektionen, Zeitgruppen und Medien
- Lektionsablauf mit Einstiegstext, geschütztem PDF-Reader, geplanter Live-Zoom-Vorlesung und separatem Multiple-Choice-Quiz
- responsive Desktop- und Mobilnavigation
- öffentliche Werbe-Startseite sowie Registrierung und Anmeldung
- geschützte Akademie-Routen mit Expo Router
- Supabase-Sitzungsspeicherung für Web, iOS und Android
- Accountbereich mit Profil-, Passwort- und Abmeldefunktionen
- separates Admin-Dashboard mit Konten- und Rollenverwaltung
- Admins können mit demselben Konto zwischen Administration und einem auf die eigenen Kinder begrenzten Elternbereich wechseln
- durchsuchbare Themen- und Quizverwaltung im Admin-Dashboard zum Bearbeiten vorhandener Lektionen sowie zum Anlegen und Bearbeiten von Multiple-Choice-Fragen
- hierarchische Lektionsverwaltung nach Akademiejahr → Lernreise → Lektion mit Filtern sowie Admin-Sammelfreigabe
- frei verwaltbare Altersgruppen und anklickbare Akademiejahre; Lernreisen bleiben verborgen, bis ein Jahr ausgewählt wurde
- kalender- und zeitgestützte Planung von Live-Terminen
- zweistufige Admin-Freigabe für Lektionen und die Quizze nach beendetem Live-Termin
- Supabase-Datenschicht für CRUD, Lernfortschritt, Abgaben und Medien
- verpflichtende Zahlungsart und Name des verwendeten PayPal- oder Bankkontos bei der Registrierung sowie eine geschützte Admin-Zahlungsübersicht
- mehrere Zeitgruppen pro Altersgruppe mit verpflichtender Elternanfrage und Admin-Freigabe; Lernreisen sind sofort sichtbar, ihre Inhalte erst nach der Freigabe
- mehrere Admin-PDF-Uploads pro Lektion, die für berechtigte Kinder direkt in der Lektion als Reader erscheinen

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

- `academy_years`, `age_groups`, `learning_journeys`, `lessons` und `lesson_steps`
- `children`, `groups` und `group_members`
- `live_sessions`
- `lesson_quizzes`, `quiz_questions`, `quiz_options` und geschützte Lösungsschlüssel
- `quiz_attempts` und `quiz_attempt_answers`
- `child_lesson_progress`, `child_step_progress` und `submissions`
- `badges` und `child_badges`
- `media_assets`, `lesson_documents` und `messages`
- `payment_agreements` und `monthly_payments`

Alle Tabellen sind durch RLS geschützt. Familien sehen nur ihre eigenen Kinder- und Fortschrittsdaten sowie vom Admin freigegebene Inhalte; Lehrkräfte und Admins können Akademie-Inhalte vorbereiten. Dateien liegen im privaten Storage-Bucket `academy-media` und werden über kurzlebige signierte URLs geöffnet.

Die Migration `20260814065000_academy_2026_27_curriculum.sql` entfernt die früheren Beispieldaten und richtet das Akademiejahr 2026/27 ein. Enthalten sind zwei Altersgruppen, vier jährliche Lernreisen, ein 40-Wochen-Themengerüst je Altersgruppe, zwei Kursgruppen, sechs Abzeichen und eine Startmitteilung. Reale Zoom-Termine, Links und Lehrkraft-Zuordnungen werden anschließend im geschützten Team-Bereich gepflegt.

Die Migration `20260814070000_lesson_live_quizzes.sql` ergänzt den aktuellen Lektionsablauf aus Einstiegstext, geplantem Live-Unterricht und Multiple-Choice-Quiz. Richtige Antworten sind von den sichtbaren Antwortmöglichkeiten getrennt und werden ausschließlich durch eine geschützte Supabase-Funktion ausgewertet.

Die Migration `20260815080000_manual_lesson_quiz_release.sql` ergänzt den Freigabe-Workflow. Lektionen müssen den Status `published` haben und werden anschließend manuell durch einen Admin freigegeben. Das zugehörige Quiz kann erst separat freigegeben werden, wenn die Lektion sichtbar und mindestens ein Live-Termin als `completed` markiert ist. Wird eine Lektion gesperrt oder wieder zum Entwurf, wird auch ihr Quiz gesperrt.

Die Migration `20260815100000_dynamic_age_groups.sql` überführt Altersgruppen in eine eigene Tabelle. Admins können sie unter **Curriculum & Altersgruppen** anlegen, bearbeiten und löschen, solange sie nicht von Kindern, Lernreisen oder Zeitgruppen verwendet werden.

Die Migration `20260821090000_payment_payer_names.sql` sichert den Zahlungsbereich ab. Neue Registrierungen müssen PayPal oder Banküberweisung sowie den Namen des verwendeten Zahlungskontos angeben. Der Monatsbeitrag wird serverseitig auf 14,99 Euro festgelegt; IBAN, Kontonummern und PayPal-Zugangsdaten werden nicht erfasst. Nur Admins können diese Zahlungsdaten lesen.

Die Migration `20260821110000_time_group_approval.sql` trennt Altersgruppen und Zeitgruppen fachlich. Beim Kinderprofil wird zuerst die Altersgruppe und anschließend eine passende Zeitgruppe des aktiven Akademiejahres ausgewählt. Altersgruppe und passende Lernreisen sind sofort sichtbar; die Zeitgruppe bleibt bis zur Admin-Freigabe angefragt. Erst danach werden Lektionen, Quizze, Termine, Links und gruppenspezifische Mitteilungen zugänglich.

Die Migration `20260821113000_time_group_age_integrity.sql` verhindert nachträgliche Änderungen, durch die Zeitgruppe, Akademiejahr und altersgruppenspezifische Lektion eines Termins auseinanderfallen würden.

Die Migration `20260821114500_time_group_request_serialization.sql` macht gleichzeitige Änderungen eines Kinderprofils und Admin-Entscheidungen konfliktfrei und verhindert neue Freigaben für inaktive Akademiejahre.

Die Migration `20260821121500_approved_time_group_content_access.sql` lässt Lernreisen der gewählten Altersgruppe sofort sichtbar, sperrt aber Lektionen, Videos, Live-Inhalte, Quizze und neue Fortschrittsdaten bis zur Admin-Freigabe der Zeitgruppe.

Die Migration `20260821123500_admin_assign_child_time_group.sql` erlaubt Admins, freigeschaltete Kinder direkt zwischen passenden aktiven Zeitgruppen derselben Altersgruppe zu verschieben. Die neue Zuordnung gilt sofort; alte Freigaben und offene Anfragen werden beendet.

Die Migration `20260821125500_admin_parent_accounts.sql` macht die Administration zu einer zusätzlichen Rolle: Admins behalten ein normales Elternkonto für ihre eigenen Kinder und können in der App zwischen Administration und Elternbereich wechseln.

Die Migration `20260821131500_lesson_pdf_documents.sql` ergänzt mehrere PDF-Dokumente pro Lektion. Nur Admins können sie einer Lektion zuordnen oder entfernen. Der private Storage-Pfad und die Metadaten sind für Familien nur lesbar, wenn auch die veröffentlichte Lektion freigegeben ist und eine passende genehmigte Zeitgruppe besteht. Die Lektionsseite zeigt die Dokumente über kurzlebige signierte URLs in einem eingebetteten Reader.

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

Eine Lektion wird im Lektionseditor unter **Status & Freigabe** zunächst auf **Veröffentlicht** gesetzt und gespeichert. Danach kann ein Admin sie dort mit **Lektion jetzt freigeben** für Familien sichtbar machen. PDFs werden nach dem ersten Speichern im Abschnitt **PDF-Lesematerial** hochgeladen. Live-Termine verwenden ein separates Kalenderfeld sowie Felder für Beginn und Ende.

## Auf GitHub Pages veröffentlichen

Das Projekt ist für das Repository `Bufib/islam-kinderakademy` und damit für den Unterpfad `/islam-kinderakademy` konfiguriert. Der Workflow `.github/workflows/deploy-pages.yml` baut und veröffentlicht die Web-App automatisch bei jedem Push auf `erweiterung`. Während des Builds wird außerdem ein Pages-Fallback für direkt aufgerufene dynamische Lektions- und Mitteilungsrouten erzeugt.

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

Nach einem Push auf `erweiterung` ist die App unter `https://bufib.github.io/islam-kinderakademy/` erreichbar. Den Fortschritt zeigt GitHub im Tab **Actions** an.

## Prüfungen

```bash
npm run lint
npx tsc --noEmit
npx expo export --platform web
```
