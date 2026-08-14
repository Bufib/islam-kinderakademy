import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { AppText, Card, EmptyState, PageScaffold, Pill, ProgressBar, SectionHeader } from '@/components/ui/primitives';
import { Layout, Palette, Radius, Space } from '@/constants/design';

const journeySlots = [1, 2, 3, 4];

export default function LearningJourneysScreen() {
  const { width } = useWindowDimensions();
  const compact = width < Layout.compactBreakpoint;

  return (
    <PageScaffold
      eyebrow="Mein Lernweg"
      title="Lernreisen"
      description="Hier entsteht der aufeinander aufbauende Lernweg für das gesamte Akademiejahr.">
      <Card tone="dark" style={styles.overviewCard}>
        <View style={styles.overviewTop}>
          <View>
            <Pill tone="sun">Akademiejahr</Pill>
            <AppText variant="title" color={Palette.white} style={styles.overviewTitle}>
              Noch keine Lernreise veröffentlicht
            </AppText>
          </View>
          <View style={styles.overviewIcon}>
            <AppIcon name="journeys" size={28} color={Palette.sun} />
          </View>
        </View>
        <ProgressBar value={0} color={Palette.sun} trackColor="rgba(255,255,255,0.13)" />
        <View style={styles.overviewMeta}>
          <AppText variant="small" color="#CDE0D7">0 Lektionen abgeschlossen</AppText>
          <AppText variant="small" color="#CDE0D7">0 %</AppText>
        </View>
      </Card>

      <SectionHeader title="Deine Reise" description="Die Lernbereiche werden vom Akademie-Team freigeschaltet." />
      <View style={[styles.map, compact && styles.mapCompact]}>
        {journeySlots.map((slot, index) => (
          <View key={slot} style={[styles.mapItem, compact && styles.mapItemCompact]}>
            {index < journeySlots.length - 1 && (
              <View style={[styles.connector, compact && styles.connectorCompact]} />
            )}
            <Card style={styles.journeyCard}>
              <View style={styles.journeyNumber}>
                <AppText variant="bodyStrong" color={Palette.forest}>{slot}</AppText>
              </View>
              <View style={styles.journeyCopy}>
                <Pill>Gesperrt</Pill>
                <AppText variant="heading">Lernreise {slot}</AppText>
                <AppText color={Palette.inkSoft}>Titel, Beschreibung und Lektionen werden später eingepflegt.</AppText>
              </View>
              <View style={styles.lockIcon}>
                <AppIcon name="lock" size={19} color={Palette.muted} />
              </View>
            </Card>
          </View>
        ))}
      </View>

      <Card>
        <EmptyState
          compact
          icon="play"
          title="Noch nichts zum Nachholen"
          description="Veröffentlichte Lesson Replays erscheinen automatisch in diesem Bereich."
        />
      </Card>
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  overviewCard: { minHeight: 220, justifyContent: 'space-between' },
  overviewTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Space.lg },
  overviewTitle: { marginTop: Space.lg, maxWidth: 620 },
  overviewIcon: {
    width: 58, height: 58, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  overviewMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Space.sm },
  map: { flexDirection: 'row', gap: Space.lg },
  mapCompact: { flexDirection: 'column' },
  mapItem: { flex: 1, position: 'relative', minWidth: 0 },
  mapItemCompact: { width: '100%' },
  connector: {
    position: 'absolute', right: -Space.lg, top: 58, width: Space.lg, height: 2,
    backgroundColor: Palette.line, zIndex: -1,
  },
  connectorCompact: { left: 38, top: '100%', width: 2, height: Space.lg },
  journeyCard: { minHeight: 245, padding: Space.lg },
  journeyNumber: {
    width: 42, height: 42, borderRadius: 15, backgroundColor: Palette.mint,
    alignItems: 'center', justifyContent: 'center', marginBottom: Space.lg,
  },
  journeyCopy: { gap: Space.sm, flex: 1 },
  lockIcon: {
    position: 'absolute', right: Space.lg, top: Space.lg, width: 35, height: 35,
    borderRadius: Radius.small, backgroundColor: '#F0F3F1', alignItems: 'center', justifyContent: 'center',
  },
});
