import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { ActionButton, AppText, Card, EmptyState, PageScaffold, Pill } from '@/components/ui/primitives';
import { Palette, Space } from '@/constants/design';
import { showScaffoldNotice } from '@/utils/scaffold';

export default function MediaScreen() {
  return (
    <PageScaffold
      eyebrow="Team-Bereich"
      title="Medien"
      description="Bilder, Audios, Dokumente und Lesson Replays werden geschützt verwaltet."
      action={<ActionButton label="Datei hochladen" icon="add" onPress={() => showScaffoldNotice('Der Datei-Upload')} />}>
      <Card tone="mint" style={styles.uploadCard}>
        <View style={styles.uploadIcon}><AppIcon name="media" size={31} color={Palette.forest} /></View>
        <View style={styles.uploadCopy}>
          <AppText variant="heading">Medien hier ablegen</AppText>
          <AppText color={Palette.inkSoft}>Der eigentliche Upload wird mit dem späteren Medienspeicher verbunden.</AppText>
        </View>
        <ActionButton label="Datei auswählen" variant="secondary" onPress={() => showScaffoldNotice('Der Datei-Upload')} />
      </Card>

      <View style={styles.filters}>
        <Pill tone="mint">Alle</Pill>
        <Pill>Bilder</Pill>
        <Pill>Videos</Pill>
        <Pill>Audio</Pill>
        <Pill>Dokumente</Pill>
      </View>

      <Card style={styles.libraryCard}>
        <EmptyState
          icon="media"
          title="Die Mediathek ist leer"
          description="Hochgeladene Dateien können später direkt in Lektionen ausgewählt werden."
        />
      </Card>
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  uploadCard: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Space.lg },
  uploadIcon: {
    width: 64, height: 64, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.68)',
    alignItems: 'center', justifyContent: 'center',
  },
  uploadCopy: { flex: 1, minWidth: 230, gap: 4 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  libraryCard: { minHeight: 430 },
});

