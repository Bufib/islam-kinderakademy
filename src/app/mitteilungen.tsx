import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { AppText, Card, EmptyState, PageScaffold, Pill } from '@/components/ui/primitives';
import { Palette, Space } from '@/constants/design';

export default function MessagesScreen() {
  return (
    <PageScaffold
      eyebrow="Elternbereich"
      title="Mitteilungen"
      description="Hinweise des Akademie-Teams und automatische Erinnerungen erscheinen hier.">
      <View style={styles.filterRow}>
        <Pill tone="mint">Alle</Pill>
        <Pill>Unterricht</Pill>
        <Pill>Aufgaben</Pill>
        <Pill>Organisation</Pill>
      </View>
      <Card style={styles.inboxCard}>
        <View style={styles.inboxHeader}>
          <View style={styles.inboxTitle}>
            <View style={styles.inboxIcon}><AppIcon name="messages" size={22} color={Palette.forest} /></View>
            <AppText variant="heading">Postfach</AppText>
          </View>
          <AppText variant="small" color={Palette.muted}>0 Mitteilungen</AppText>
        </View>
        <EmptyState
          icon="messages"
          title="Noch keine Mitteilungen"
          description="Neue Nachrichten und Erinnerungen werden an dieser Stelle gesammelt."
        />
      </Card>
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  inboxCard: { minHeight: 500 },
  inboxHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: Space.lg, borderBottomWidth: 1, borderBottomColor: Palette.line,
  },
  inboxTitle: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  inboxIcon: {
    width: 42, height: 42, borderRadius: 15, backgroundColor: Palette.mint,
    alignItems: 'center', justifyContent: 'center',
  },
});

