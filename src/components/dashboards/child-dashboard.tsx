import { useRouter } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import {
  ActionButton,
  AppText,
  Card,
  PageScaffold,
  Pill,
  ProgressBar,
  SectionHeader,
  StatCard,
} from '@/components/ui/primitives';
import { Layout, Palette, Space } from '@/constants/design';

export function ChildDashboard() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const stacked = width < 1080;
  const compact = width < Layout.compactBreakpoint;

  return (
    <PageScaffold eyebrow="Mein Bereich" title="Schön, dass du da bist!">
      <View style={[styles.heroGrid, stacked && styles.column]}>
        <Card tone="dark" style={[styles.heroCard, stacked && styles.fullWidth]}>
          <View style={styles.heroCopy}>
            <Pill tone="sun" icon="journeys">
              Deine Lernwoche
            </Pill>
            <View style={styles.heroText}>
              <AppText variant={compact ? 'title' : 'display'} color={Palette.white}>
                Deine nächste Entdeckung wartet hier.
              </AppText>
              <AppText color="#CDE0D7" style={styles.heroDescription}>
                Sobald eine Wochenlektion veröffentlicht ist, kannst du an dieser Stelle starten.
              </AppText>
            </View>
            <View style={[styles.heroActions, compact && styles.actionsColumn]}>
              <ActionButton label="Noch keine Lektion" icon="lock" disabled style={styles.heroButton} />
              <ActionButton
                label="Lernreisen ansehen"
                icon="arrow"
                variant="secondary"
                onPress={() => router.push('/lernreisen')}
                style={styles.heroButton}
              />
            </View>
          </View>
          {!compact && <JourneyOrnament />}
        </Card>

        <Card style={[styles.weekCard, stacked && styles.fullWidth]}>
          <View style={styles.weekCardHeader}>
            <View style={styles.roundIconMint}>
              <AppIcon name="check" size={23} color={Palette.forest} />
            </View>
            <Pill>0 von 5</Pill>
          </View>
          <View style={styles.weekCopy}>
            <AppText variant="heading">Mein Wochenweg</AppText>
            <AppText color={Palette.inkSoft}>Die Schritte erscheinen mit der ersten Lektion.</AppText>
          </View>
          <ProgressBar value={0} />
          <View style={styles.stepDots}>
            {[1, 2, 3, 4, 5].map((step) => (
              <View key={step} style={styles.stepDot}>
                <AppText variant="small" color={Palette.muted}>
                  {step}
                </AppText>
              </View>
            ))}
          </View>
        </Card>
      </View>

      <SectionHeader title="Diese Woche" description="Alles Wichtige auf einen Blick." />
      <View style={[styles.weekGrid, compact && styles.column]}>
        <Card style={styles.infoCard}>
          <View style={styles.infoCardTop}>
            <View style={[styles.infoIcon, { backgroundColor: Palette.skySoft }]}>
              <AppIcon name="video" size={23} color="#2E6474" />
            </View>
            <Pill tone="sky">Live-Unterricht</Pill>
          </View>
          <View style={styles.infoCardCopy}>
            <AppText variant="heading">Noch kein Termin</AppText>
            <AppText color={Palette.inkSoft}>
              Der nächste Termin wird hier mit dem Zoom-Zugang angezeigt.
            </AppText>
          </View>
          <ActionButton label="Zoom noch nicht verfügbar" icon="lock" variant="secondary" disabled />
        </Card>

        <Card style={styles.infoCard}>
          <View style={styles.infoCardTop}>
            <View style={[styles.infoIcon, { backgroundColor: Palette.coralSoft }]}>
              <AppIcon name="trophy" size={23} color="#934E39" />
            </View>
            <Pill tone="coral">Wochen-Challenge</Pill>
          </View>
          <View style={styles.infoCardCopy}>
            <AppText variant="heading">Noch keine Challenge</AppText>
            <AppText color={Palette.inkSoft}>
              Die Aufgabe für diese Woche erscheint nach Veröffentlichung der Lektion.
            </AppText>
          </View>
          <ActionButton label="Wartet auf Inhalt" icon="clock" variant="secondary" disabled />
        </Card>
      </View>

      <SectionHeader title="Mein Fortschritt" description="Nur dein eigener Lernweg zählt." />
      <View style={styles.statsGrid}>
        <StatCard icon="lessons" value="0" label="Lektionen" tone="mint" />
        <StatCard icon="pass" value="0" label="Abzeichen" tone="sun" />
        <StatCard icon="trophy" value="0" label="Wochensterne" tone="coral" />
      </View>
    </PageScaffold>
  );
}

function JourneyOrnament() {
  return (
    <View style={styles.ornament} pointerEvents="none">
      <View style={styles.orbitOuter} />
      <View style={styles.orbitInner} />
      <View style={[styles.orbitNode, styles.nodeOne]} />
      <View style={[styles.orbitNode, styles.nodeTwo]} />
      <View style={styles.ornamentCenter}>
        <AppIcon name="journeys" size={37} color={Palette.ink} />
      </View>
      <AppText color={Palette.sun} style={styles.sparkleOne}>✦</AppText>
      <AppText color={Palette.mintStrong} style={styles.sparkleTwo}>✦</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  heroGrid: { flexDirection: 'row', gap: Space.lg, alignItems: 'stretch' },
  column: { flexDirection: 'column' },
  fullWidth: { width: '100%', flexBasis: 'auto' },
  heroCard: {
    minHeight: 330,
    flex: 1.72,
    flexDirection: 'row',
    position: 'relative',
    padding: Space.xxl,
  },
  heroCopy: { flex: 1, maxWidth: 610, zIndex: 1 },
  heroText: { gap: Space.md, marginTop: Space.xl, marginBottom: Space.xl },
  heroDescription: { maxWidth: 490 },
  heroActions: { flexDirection: 'row', gap: Space.sm, alignItems: 'center' },
  actionsColumn: { alignItems: 'stretch', flexDirection: 'column' },
  heroButton: { minWidth: 178 },
  ornament: { width: 230, height: 230, alignSelf: 'center', marginRight: -22 },
  orbitOuter: {
    position: 'absolute', width: 218, height: 218, borderRadius: 109, borderWidth: 1,
    borderStyle: 'dashed', borderColor: 'rgba(167,213,190,0.5)',
  },
  orbitInner: {
    position: 'absolute', left: 38, top: 38, width: 142, height: 142, borderRadius: 71,
    borderWidth: 1, borderColor: 'rgba(242,201,109,0.42)',
  },
  ornamentCenter: {
    position: 'absolute', left: 75, top: 75, width: 72, height: 72, borderRadius: 25,
    backgroundColor: Palette.sun, alignItems: 'center', justifyContent: 'center',
    transform: [{ rotate: '-6deg' }],
  },
  orbitNode: {
    position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: Palette.coral,
    borderWidth: 4, borderColor: Palette.forestDark,
  },
  nodeOne: { right: 14, top: 60 },
  nodeTwo: { left: 25, bottom: 35, backgroundColor: Palette.sky },
  sparkleOne: { position: 'absolute', right: 31, bottom: 25, fontSize: 21 },
  sparkleTwo: { position: 'absolute', left: 36, top: 23, fontSize: 15 },
  weekCard: { flex: 0.85, minWidth: 280, minHeight: 330, justifyContent: 'space-between' },
  weekCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roundIconMint: {
    width: 48, height: 48, borderRadius: 17, backgroundColor: Palette.mint,
    alignItems: 'center', justifyContent: 'center',
  },
  weekCopy: { gap: 6, marginVertical: Space.lg },
  stepDots: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Space.lg },
  stepDot: {
    width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: Palette.line,
    backgroundColor: '#F2F4F2', alignItems: 'center', justifyContent: 'center',
  },
  weekGrid: { flexDirection: 'row', gap: Space.lg },
  infoCard: { flex: 1, minWidth: 270, minHeight: 270 },
  infoCardTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space.md,
  },
  infoIcon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  infoCardCopy: { flex: 1, justifyContent: 'center', gap: Space.sm, paddingVertical: Space.xl },
  statsGrid: { flexDirection: 'row', gap: Space.lg, flexWrap: 'wrap' },
});

