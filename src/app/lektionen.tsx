import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  ActionButton, Card, EmptyState, Field, PageScaffold, Pill, SegmentedControl,
} from '@/components/ui/primitives';
import { Space } from '@/constants/design';

type LessonFilter = 'all' | 'draft' | 'published';

export default function LessonsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<LessonFilter>('all');
  const [search, setSearch] = useState('');

  return (
    <PageScaffold
      eyebrow="Team-Bereich"
      title="Lektionen"
      description="Entwürfe, geplante und veröffentlichte Unterrichtseinheiten."
      action={<ActionButton label="Neue Lektion" icon="add" onPress={() => router.push('/lektion-neu')} />}>
      <Card style={styles.toolbar}>
        <View style={styles.filterRow}>
          <View style={styles.searchField}>
            <Field label="Suche" placeholder="Lektionen durchsuchen" value={search} onChangeText={setSearch} />
          </View>
          <SegmentedControl
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'Alle' },
              { value: 'draft', label: 'Entwürfe' },
              { value: 'published', label: 'Veröffentlicht' },
            ]}
          />
          <Pill>0 Ergebnisse</Pill>
        </View>
      </Card>

      <Card style={styles.listCard}>
        <EmptyState
          icon="lessons"
          title="Noch keine Lektionen"
          description="Neue Lektionen werden als Entwurf angelegt und später einer Lernreise zugeordnet."
          actionLabel="Erste Lektion anlegen"
          onAction={() => router.push('/lektion-neu')}
        />
      </Card>
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  toolbar: { padding: Space.lg },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: Space.lg },
  searchField: { flex: 1, minWidth: 240 },
  listCard: { minHeight: 480 },
});

