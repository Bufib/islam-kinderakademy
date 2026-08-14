import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { AppText, Card, PageScaffold, Pill, ProgressBar, SectionHeader } from '@/components/ui/primitives';
import { Layout, Palette, Space } from '@/constants/design';

export default function IslamPassScreen() {
  const { width } = useWindowDimensions();
  const compact = width < Layout.compactBreakpoint;

  return (
    <PageScaffold
      eyebrow="Persönlicher Fortschritt"
      title="Mein Islam-Pass"
      description="Stempel und Abzeichen machen den eigenen Lernweg sichtbar – ohne Rangliste und Vergleich.">
      <Card tone="dark" style={[styles.passCard, compact && styles.passCardCompact]}>
        <View style={styles.passHeader}>
          <View style={styles.passBrand}>
            <View style={styles.passIcon}><AppIcon name="pass" size={29} color={Palette.ink} /></View>
            <View>
              <AppText variant="label" color={Palette.mintStrong}>Islam-Kinderakademie</AppText>
              <AppText variant="title" color={Palette.white}>Mein Lernpass</AppText>
            </View>
          </View>
          <Pill tone="sun">Level 0</Pill>
        </View>
        <View style={styles.passBody}>
          <View style={styles.avatarPlaceholder}><AppIcon name="profile" size={36} color={Palette.muted} /></View>
          <View style={styles.passDetails}>
            <View style={styles.blankLine} />
            <View style={[styles.blankLine, styles.shortLine]} />
            <View style={styles.passProgressRow}>
              <AppText variant="small" color="#CDE0D7">Gesamtfortschritt</AppText>
              <AppText variant="small" color={Palette.white}>0 %</AppText>
            </View>
            <ProgressBar value={0} color={Palette.sun} trackColor="rgba(255,255,255,0.13)" />
          </View>
        </View>
      </Card>

      <SectionHeader title="Meine Stempel" description="Jeder Lernbereich erhält später einen eigenen Stempel." />
      <Card>
        <View style={styles.stampGrid}>
          {Array.from({ length: 8 }, (_, index) => (
            <View key={index} style={styles.stampSlot}>
              <View style={styles.stampCircle}><AppIcon name="lock" size={20} color={Palette.disabled} /></View>
              <AppText variant="small" color={Palette.muted}>Stempel {index + 1}</AppText>
            </View>
          ))}
        </View>
      </Card>

      <SectionHeader title="Meine Abzeichen" description="Persönliche Erfolge werden hier gesammelt." />
      <Card tone="sun" style={styles.badgesEmpty}>
        <View style={styles.badgesIcon}><AppIcon name="trophy" size={29} color="#846211" /></View>
        <View style={styles.badgesCopy}>
          <AppText variant="heading">Noch keine Abzeichen</AppText>
          <AppText color={Palette.inkSoft}>Mit veröffentlichten Lektionen werden die ersten Ziele freigeschaltet.</AppText>
        </View>
      </Card>
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  passCard: { minHeight: 290, padding: Space.xxl },
  passCardCompact: { padding: Space.xl },
  passHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Space.lg },
  passBrand: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  passIcon: {
    width: 54, height: 54, borderRadius: 19, backgroundColor: Palette.sun,
    alignItems: 'center', justifyContent: 'center',
  },
  passBody: { flexDirection: 'row', alignItems: 'center', gap: Space.xl, marginTop: 54 },
  avatarPlaceholder: {
    width: 76, height: 76, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  passDetails: { flex: 1, gap: Space.md },
  blankLine: { height: 13, borderRadius: 7, width: '55%', backgroundColor: 'rgba(255,255,255,0.16)' },
  shortLine: { width: '34%' },
  passProgressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Space.sm },
  stampGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.xl, justifyContent: 'space-around' },
  stampSlot: { width: 100, alignItems: 'center', gap: Space.sm },
  stampCircle: {
    width: 74, height: 74, borderRadius: 37, borderWidth: 2, borderStyle: 'dashed',
    borderColor: Palette.line, backgroundColor: '#F5F7F4', alignItems: 'center', justifyContent: 'center',
  },
  badgesEmpty: { flexDirection: 'row', alignItems: 'center', gap: Space.lg },
  badgesIcon: {
    width: 58, height: 58, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  badgesCopy: { flex: 1, gap: 4 },
});

