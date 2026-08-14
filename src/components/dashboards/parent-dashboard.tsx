import { useRouter } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import {
  ActionButton, AppText, Card, EmptyState, PageScaffold, Pill, SectionHeader, StatCard,
} from '@/components/ui/primitives';
import { Layout, Palette, Space } from '@/constants/design';
import { showScaffoldNotice } from '@/utils/scaffold';

export function ParentDashboard() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < Layout.compactBreakpoint;

  return (
    <PageScaffold
      eyebrow="Elternbereich"
      title="Lernwege gemeinsam begleiten"
      description="Hier sehen Eltern später Termine, Aufgaben und den persönlichen Fortschritt ihrer Kinder."
      action={<ActionButton label="Kind hinzufügen" icon="add" onPress={() => showScaffoldNotice('Das Anlegen eines Kinderprofils')} />}>
      <View style={styles.statsGrid}>
        <StatCard icon="children" value="0" label="Kinderprofile" tone="mint" />
        <StatCard icon="calendar" value="0" label="Anstehende Termine" tone="sky" />
        <StatCard icon="check" value="0" label="Offene Bestätigungen" tone="sun" />
      </View>

      <View style={[styles.mainGrid, compact && styles.column]}>
        <Card style={styles.childrenCard}>
          <SectionHeader
            title="Meine Kinder"
            description="Profile und Lernstände"
            action={<ActionButton label="Alle ansehen" variant="quiet" compact onPress={() => router.push('/kinder')} />}
          />
          <EmptyState
            compact
            icon="children"
            title="Noch kein Kinderprofil"
            description="Nach dem Anlegen erscheinen hier Lernweg, Altersgruppe und Fortschritt."
            actionLabel="Profil anlegen"
            onAction={() => showScaffoldNotice('Das Anlegen eines Kinderprofils')}
          />
        </Card>

        <Card tone="dark" style={styles.nextCard}>
          <View style={styles.nextTop}>
            <View style={styles.darkIcon}>
              <AppIcon name="calendar" size={23} color={Palette.sun} />
            </View>
            <Pill tone="sun">Nächster Termin</Pill>
          </View>
          <View style={styles.nextCopy}>
            <AppText variant="heading" color={Palette.white}>Noch kein Unterricht geplant</AppText>
            <AppText color="#CDE0D7">Sobald eine Gruppe einen Termin erhält, stehen hier Zeit und Zugang bereit.</AppText>
          </View>
          <ActionButton label="Kalender öffnen" variant="secondary" onPress={() => router.push('/kalender')} />
        </Card>
      </View>

      <Card>
        <SectionHeader title="Aktuelle Wochenaufgaben" description="Aufgaben und Elternbestätigungen" />
        <View style={styles.inlineEmpty}>
          <View style={styles.inlineIcon}>
            <AppIcon name="check" size={24} color={Palette.forest} />
          </View>
          <View style={styles.inlineCopy}>
            <AppText variant="bodyStrong">Keine offenen Aufgaben</AppText>
            <AppText color={Palette.inkSoft}>Veröffentlichte Wochenaufgaben werden automatisch den Kinderprofilen zugeordnet.</AppText>
          </View>
        </View>
      </Card>
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: 'row', gap: Space.lg, flexWrap: 'wrap' },
  mainGrid: { flexDirection: 'row', gap: Space.lg, alignItems: 'stretch' },
  column: { flexDirection: 'column' },
  childrenCard: { flex: 1.6, minWidth: 0 },
  nextCard: { flex: 0.8, minWidth: 280, minHeight: 330, justifyContent: 'space-between' },
  nextTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  darkIcon: {
    width: 46, height: 46, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  nextCopy: { gap: Space.sm, paddingVertical: Space.xl },
  inlineEmpty: {
    marginTop: Space.xl, minHeight: 112, borderWidth: 1, borderStyle: 'dashed',
    borderColor: Palette.line, borderRadius: 18, backgroundColor: '#F9FAF7', padding: Space.lg,
    flexDirection: 'row', alignItems: 'center', gap: Space.lg,
  },
  inlineIcon: {
    width: 46, height: 46, borderRadius: 16, backgroundColor: Palette.mint,
    alignItems: 'center', justifyContent: 'center',
  },
  inlineCopy: { flex: 1, gap: 3 },
});

