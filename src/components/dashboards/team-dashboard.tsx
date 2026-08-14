import { Href, useRouter } from 'expo-router';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppIcon, AppIconName } from '@/components/ui/app-icon';
import {
  ActionButton, AppText, Card, EmptyState, PageScaffold, Pill, SectionHeader, StatCard,
} from '@/components/ui/primitives';
import { Layout, Palette, Space } from '@/constants/design';
import { showScaffoldNotice } from '@/utils/scaffold';

const quickActions: { label: string; description: string; icon: AppIconName; href: string }[] = [
  { label: 'Curriculum', description: 'Lernreisen strukturieren', icon: 'curriculum', href: '/curriculum' },
  { label: 'Lektionen', description: 'Entwürfe verwalten', icon: 'lessons', href: '/lektionen' },
  { label: 'Gruppen', description: 'Altersgruppen organisieren', icon: 'groups', href: '/gruppen' },
  { label: 'Medien', description: 'Dateien bereitstellen', icon: 'media', href: '/medien' },
];

export function TeamDashboard() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < Layout.compactBreakpoint;

  return (
    <PageScaffold
      eyebrow="Team-Bereich"
      title="Akademie verwalten"
      description="Das Grundgerüst für Schuljahr, Curriculum, Unterricht und Lernfortschritt."
      action={<ActionButton label="Neue Lektion" icon="add" onPress={() => router.push('/lektion-neu')} />}>
      <View style={styles.statsGrid}>
        <StatCard icon="groups" value="0" label="Aktive Gruppen" tone="mint" />
        <StatCard icon="lessons" value="0" label="Lektionen" tone="sky" />
        <StatCard icon="children" value="0" label="Kinderprofile" tone="sun" />
        <StatCard icon="check" value="0" label="Offene Abgaben" tone="coral" />
      </View>

      <SectionHeader title="Schnellzugriff" description="Die wichtigsten Arbeitsbereiche" />
      <View style={styles.quickGrid}>
        {quickActions.map((item) => (
          <Pressable key={item.href} onPress={() => router.push(item.href as Href)} style={({ pressed }) => [styles.quickPressable, pressed && styles.pressed]}>
            <Card style={styles.quickCard}>
              <View style={styles.quickIcon}><AppIcon name={item.icon} size={23} color={Palette.forest} /></View>
              <View style={styles.quickCopy}>
                <AppText variant="bodyStrong">{item.label}</AppText>
                <AppText variant="small" color={Palette.inkSoft}>{item.description}</AppText>
              </View>
              <AppIcon name="arrow" size={18} color={Palette.muted} />
            </Card>
          </Pressable>
        ))}
      </View>

      <View style={[styles.lowerGrid, compact && styles.column]}>
        <Card style={styles.setupCard}>
          <SectionHeader title="Einrichtung" description="Vor dem ersten Unterricht" />
          <View style={styles.setupList}>
            {['Schuljahr anlegen', 'Gruppen einrichten', 'Lernreisen erstellen', 'Erste Lektion veröffentlichen'].map((label, index) => (
              <Pressable key={label} onPress={() => showScaffoldNotice(label)} style={({ pressed }) => [styles.setupRow, pressed && styles.pressed]}>
                <View style={styles.setupNumber}><AppText variant="small" color={Palette.forest}>{index + 1}</AppText></View>
                <AppText variant="bodyStrong" style={styles.setupLabel}>{label}</AppText>
                <Pill>Offen</Pill>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card style={styles.activityCard}>
          <SectionHeader title="Letzte Aktivität" />
          <EmptyState compact icon="clock" title="Noch keine Aktivität" description="Änderungen und Veröffentlichungen erscheinen später hier." />
        </Card>
      </View>
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: 'row', gap: Space.lg, flexWrap: 'wrap' },
  quickGrid: { flexDirection: 'row', gap: Space.md, flexWrap: 'wrap' },
  quickPressable: { flex: 1, minWidth: 220 },
  quickCard: { flexDirection: 'row', alignItems: 'center', gap: Space.md, padding: Space.lg, minHeight: 94 },
  quickIcon: {
    width: 44, height: 44, borderRadius: 15, backgroundColor: Palette.mint,
    alignItems: 'center', justifyContent: 'center',
  },
  quickCopy: { flex: 1 },
  lowerGrid: { flexDirection: 'row', gap: Space.lg },
  column: { flexDirection: 'column' },
  setupCard: { flex: 1.25, minWidth: 0 },
  activityCard: { flex: 0.8, minWidth: 270 },
  setupList: { marginTop: Space.xl, gap: Space.sm },
  setupRow: {
    minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: Space.md,
    borderBottomWidth: 1, borderBottomColor: Palette.line, paddingVertical: Space.sm,
  },
  setupNumber: {
    width: 32, height: 32, borderRadius: 11, backgroundColor: Palette.mint,
    alignItems: 'center', justifyContent: 'center',
  },
  setupLabel: { flex: 1 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
});

