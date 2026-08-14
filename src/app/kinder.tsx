import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { ActionButton, AppText, Card, EmptyState, PageScaffold, SectionHeader } from '@/components/ui/primitives';
import { Layout, Palette, Space } from '@/constants/design';
import { showScaffoldNotice } from '@/utils/scaffold';

const setupSteps = [
  { title: 'Profil anlegen', description: 'Anzeigename, Altersgruppe und Avatar' },
  { title: 'Gruppe zuordnen', description: 'Passender Kurs und Unterrichtstermin' },
  { title: 'Kinder-PIN vergeben', description: 'Einfacher, geschützter Zugang' },
];

export default function ChildrenScreen() {
  const { width } = useWindowDimensions();
  const compact = width < Layout.compactBreakpoint;

  return (
    <PageScaffold
      eyebrow="Elternbereich"
      title="Meine Kinder"
      description="Kinderprofile werden vom Elternkonto aus verwaltet."
      action={<ActionButton label="Kind hinzufügen" icon="add" onPress={() => showScaffoldNotice('Das Anlegen eines Kinderprofils')} />}>
      <View style={[styles.layout, compact && styles.column]}>
        <Card style={styles.profilesCard}>
          <SectionHeader title="Kinderprofile" description="0 Profile" />
          <EmptyState
            icon="children"
            title="Noch kein Profil angelegt"
            description="Nach dem Anlegen kann das Kind über Avatar und persönliche PIN in seinen Lernbereich wechseln."
            actionLabel="Erstes Profil anlegen"
            onAction={() => showScaffoldNotice('Das Anlegen eines Kinderprofils')}
          />
        </Card>

        <Card tone="mint" style={styles.guideCard}>
          <View style={styles.guideIcon}><AppIcon name="lock" size={24} color={Palette.forest} /></View>
          <AppText variant="heading">So funktioniert der Kinderzugang</AppText>
          <View style={styles.steps}>
            {setupSteps.map((step, index) => (
              <View key={step.title} style={styles.step}>
                <View style={styles.stepNumber}><AppText variant="small" color={Palette.forest}>{index + 1}</AppText></View>
                <View style={styles.stepCopy}>
                  <AppText variant="bodyStrong">{step.title}</AppText>
                  <AppText variant="small" color={Palette.inkSoft}>{step.description}</AppText>
                </View>
              </View>
            ))}
          </View>
        </Card>
      </View>
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  layout: { flexDirection: 'row', gap: Space.lg, alignItems: 'flex-start' },
  column: { flexDirection: 'column' },
  profilesCard: { flex: 1.45, minWidth: 0 },
  guideCard: { flex: 0.75, minWidth: 280, gap: Space.lg },
  guideIcon: {
    width: 50, height: 50, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center', justifyContent: 'center',
  },
  steps: { gap: Space.lg, marginTop: Space.sm },
  step: { flexDirection: 'row', gap: Space.md },
  stepNumber: {
    width: 30, height: 30, borderRadius: 11, backgroundColor: Palette.paper,
    alignItems: 'center', justifyContent: 'center',
  },
  stepCopy: { flex: 1, gap: 2 },
});

