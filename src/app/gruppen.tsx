import { StyleSheet, View } from 'react-native';

import { ActionButton, Card, EmptyState, PageScaffold, StatCard } from '@/components/ui/primitives';
import { Space } from '@/constants/design';
import { showScaffoldNotice } from '@/utils/scaffold';

export default function GroupsScreen() {
  return (
    <PageScaffold
      eyebrow="Team-Bereich"
      title="Gruppen"
      description="Altersgruppen, Kinder, Lehrkräfte und Unterrichtstermine werden hier zugeordnet."
      action={<ActionButton label="Gruppe anlegen" icon="add" onPress={() => showScaffoldNotice('Das Anlegen einer Gruppe')} />}>
      <View style={styles.statsGrid}>
        <StatCard icon="groups" value="0" label="Gruppen" tone="mint" />
        <StatCard icon="children" value="0" label="Zugeordnete Kinder" tone="sun" />
        <StatCard icon="calendar" value="0" label="Wöchentliche Termine" tone="sky" />
      </View>
      <Card style={styles.listCard}>
        <EmptyState
          icon="groups"
          title="Noch keine Gruppen"
          description="Lege eine Gruppe an und ordne ihr Altersstufe, Unterrichtszeit und Lehrkräfte zu."
          actionLabel="Erste Gruppe anlegen"
          onAction={() => showScaffoldNotice('Das Anlegen einer Gruppe')}
        />
      </Card>
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: 'row', gap: Space.lg, flexWrap: 'wrap' },
  listCard: { minHeight: 470 },
});

