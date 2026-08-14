# Islam-Kinderakademie

Responsive Grundgerüst für die Lernplattform der Islam-Kinderakademie. Das Projekt basiert auf Expo 57, React Native und React Native Web.

## Enthaltene Bereiche

- Kinderansicht mit Übersicht, Lernreisen, Kalender und Islam-Pass
- Elternbereich mit Kinderprofilen, Terminen und Mitteilungen
- Team-Bereich mit Curriculum, Lektionen, Gruppen und Medien
- leerer Lektionseditor mit der vorgesehenen Fünf-Schritte-Struktur
- responsive Desktop- und Mobilnavigation
- leere, typisierte Domänenmodelle in `src/types/academy.ts`

Es sind bewusst noch keine fachlichen Lektionen, Medien, Nutzer oder Termine enthalten. Backend, Authentifizierung und Datenspeicherung sind noch nicht angebunden.

## Starten

```bash
npm install
npm run web
```

Die Ansichten können über den Rollenumschalter oben rechts beziehungsweise unten in der Desktop-Seitenleiste gewechselt werden.

## Prüfungen

```bash
npm run lint
npx tsc --noEmit
npx expo export --platform web
```
