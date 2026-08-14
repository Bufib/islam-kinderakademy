import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppIcon, AppIconName } from '@/components/ui/app-icon';
import {
  ActionButton, AppText, Card, Field, PageScaffold, Pill, SegmentedControl, SectionHeader,
} from '@/components/ui/primitives';
import { Layout, Palette, Space } from '@/constants/design';
import { AgeGroup } from '@/types/academy';
import { showScaffoldNotice } from '@/utils/scaffold';

const lessonSteps: { number: string; title: string; description: string; icon: AppIconName; tone: string }[] = [
  { number: '01', title: 'Start', description: 'Einstiegsfrage oder erste Situation', icon: 'play', tone: Palette.sunSoft },
  { number: '02', title: 'Discover', description: 'Geschichte, Bilder und Erklärung', icon: 'journeys', tone: Palette.skySoft },
  { number: '03', title: 'Kinder erklären', description: 'Fragen, Denken und eigene Beispiele', icon: 'children', tone: Palette.mint },
  { number: '04', title: 'Mini-Quiz', description: 'Kurze interaktive Lernkontrolle', icon: 'check', tone: '#EEF1EF' },
  { number: '05', title: 'Wochen-Challenge', description: 'Aufgabe für den Alltag', icon: 'trophy', tone: Palette.coralSoft },
];

export default function NewLessonScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < Layout.compactBreakpoint;
  const [title, setTitle] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('5-8');

  return (
    <PageScaffold
      eyebrow="Lektionseditor"
      title="Neue Lektion"
      description="Die Struktur steht bereit. Inhalte und Medien können später ergänzt werden."
      action={
        <View style={[styles.headerActions, compact && styles.headerActionsCompact]}>
          <ActionButton label="Abbrechen" variant="secondary" onPress={() => router.back()} />
          <ActionButton label="Entwurf speichern" icon="check" onPress={() => showScaffoldNotice('Das Speichern der Lektion')} />
        </View>
      }>
      <View style={[styles.editorLayout, compact && styles.column]}>
        <View style={styles.mainColumn}>
          <Card>
            <SectionHeader title="Grunddaten" description="Zuordnung und Bezeichnung" />
            <View style={styles.formStack}>
              <Field label="Titel der Lektion" placeholder="Titel eingeben" value={title} onChangeText={setTitle} />
              <View style={styles.formRow}>
                <View style={styles.formFieldHalf}>
                  <AppText variant="label">Altersgruppe</AppText>
                  <SegmentedControl
                    value={ageGroup}
                    onChange={setAgeGroup}
                    options={[{ value: '5-8', label: '5–8 Jahre' }, { value: '9-12', label: '9–12 Jahre' }]}
                  />
                </View>
                <View style={styles.formFieldHalf}>
                  <Field label="Lernreise" placeholder="Noch keine Lernreise verfügbar" editable={false} />
                </View>
              </View>
              <Field label="Kurzbeschreibung" placeholder="Optionale Beschreibung" multiline />
            </View>
          </Card>

          <SectionHeader title="Unterrichtsschritte" description="Die feste Fünf-Schritte-Struktur der Akademie" />
          <View style={styles.stepsList}>
            {lessonSteps.map((step) => (
              <Pressable
                key={step.number}
                onPress={() => showScaffoldNotice(`Der Inhaltsbereich „${step.title}“`)}
                style={({ pressed }) => pressed && styles.pressed}>
                <Card style={styles.stepCard}>
                  <View style={[styles.stepIcon, { backgroundColor: step.tone }]}>
                    <AppIcon name={step.icon} size={22} color={Palette.forest} />
                  </View>
                  <View style={styles.stepCopy}>
                    <AppText variant="label" color={Palette.muted}>Schritt {step.number}</AppText>
                    <AppText variant="bodyStrong">{step.title}</AppText>
                    <AppText variant="small" color={Palette.inkSoft}>{step.description}</AppText>
                  </View>
                  <Pill>Leer</Pill>
                  <AppIcon name="arrow" size={18} color={Palette.muted} />
                </Card>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.sideColumn}>
          <Card style={styles.statusCard}>
            <SectionHeader title="Status" />
            <Pill tone="sun">Entwurf</Pill>
            <View style={styles.divider} />
            <Field label="Veröffentlichung" placeholder="Datum und Uhrzeit" />
            <ActionButton label="Vorschau" icon="play" variant="secondary" onPress={() => showScaffoldNotice('Die Lektionsvorschau')} />
          </Card>

          <Card tone="mint" style={styles.mediaCard}>
            <View style={styles.mediaIcon}><AppIcon name="video" size={25} color={Palette.forest} /></View>
            <AppText variant="heading">Lesson Replay</AppText>
            <AppText color={Palette.inkSoft}>Ein geschütztes Replay kann später mit dieser Lektion verknüpft werden.</AppText>
            <ActionButton label="Video auswählen" icon="add" variant="secondary" onPress={() => showScaffoldNotice('Die Medienauswahl')} />
          </Card>

          <Card>
            <SectionHeader title="Live-Unterricht" />
            <View style={styles.formStack}>
              <Field label="Termin" placeholder="Datum und Uhrzeit" />
              <Field label="Zoom-Zugang" placeholder="Geschützter Meeting-Link" />
            </View>
          </Card>
        </View>
      </View>
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', gap: Space.sm },
  headerActionsCompact: { flexDirection: 'column-reverse' },
  editorLayout: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.lg },
  column: { flexDirection: 'column' },
  mainColumn: { flex: 1.45, minWidth: 0, gap: Space.xl },
  sideColumn: { flex: 0.7, minWidth: 300, gap: Space.lg },
  formStack: { gap: Space.lg, marginTop: Space.xl },
  formRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.lg },
  formFieldHalf: { flex: 1, minWidth: 240, gap: Space.sm },
  stepsList: { gap: Space.sm },
  stepCard: { minHeight: 96, padding: Space.lg, flexDirection: 'row', alignItems: 'center', gap: Space.md },
  stepIcon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  stepCopy: { flex: 1, gap: 2 },
  statusCard: { gap: Space.lg },
  divider: { height: 1, backgroundColor: Palette.line },
  mediaCard: { gap: Space.md },
  mediaIcon: {
    width: 50, height: 50, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center', justifyContent: 'center',
  },
  pressed: { opacity: 0.68, transform: [{ scale: 0.995 }] },
});

