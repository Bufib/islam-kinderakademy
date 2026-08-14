import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import {
  ActionButton, AppText, Card, EmptyState, PageScaffold, Pill, SegmentedControl, SectionHeader,
} from '@/components/ui/primitives';
import { Palette, Space } from '@/constants/design';
import { AgeGroup } from '@/types/academy';
import { showScaffoldNotice } from '@/utils/scaffold';

export default function CurriculumScreen() {
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('5-8');
  const router = useRouter();

  return (
    <PageScaffold
      eyebrow="Team-Bereich"
      title="Curriculum"
      description="Schuljahre, Lernreisen und Lektionen werden hier hierarchisch aufgebaut."
      action={<ActionButton label="Lernreise anlegen" icon="add" onPress={() => showScaffoldNotice('Das Anlegen einer Lernreise')} />}>
      <Card style={styles.toolbarCard}>
        <View style={styles.toolbarRow}>
          <View style={styles.toolbarCopy}>
            <AppText variant="bodyStrong">Altersgruppe</AppText>
            <AppText variant="small" color={Palette.inkSoft}>Inhalte werden getrennt gepflegt.</AppText>
          </View>
          <SegmentedControl
            value={ageGroup}
            onChange={setAgeGroup}
            options={[{ value: '5-8', label: '5–8 Jahre' }, { value: '9-12', label: '9–12 Jahre' }]}
          />
        </View>
      </Card>

      <SectionHeader title="Akademiejahr" description={`Curriculum für ${ageGroup === '5-8' ? '5–8' : '9–12'} Jahre`} />
      <Card style={styles.treeCard}>
        <View style={styles.yearNode}>
          <View style={styles.nodeIcon}><AppIcon name="calendar" size={22} color={Palette.forest} /></View>
          <View style={styles.nodeCopy}>
            <AppText variant="bodyStrong">Noch kein Schuljahr angelegt</AppText>
            <AppText variant="small" color={Palette.inkSoft}>Zeitraum und Bezeichnung fehlen</AppText>
          </View>
          <Pill>Entwurf</Pill>
        </View>
        <View style={styles.treeLine} />
        <EmptyState
          compact
          icon="curriculum"
          title="Noch keine Lernreisen"
          description="Lege zuerst ein Schuljahr und anschließend die Lernreisen für diese Altersgruppe an."
          actionLabel="Lernreise anlegen"
          onAction={() => showScaffoldNotice('Das Anlegen einer Lernreise')}
        />
      </Card>

      <Card tone="sun" style={styles.editorHint}>
        <View style={styles.hintIcon}><AppIcon name="lessons" size={23} color="#846211" /></View>
        <View style={styles.hintCopy}>
          <AppText variant="bodyStrong">Lektionsstruktur vorbereitet</AppText>
          <AppText color={Palette.inkSoft}>Der Editor enthält bereits die fünf vorgesehenen Unterrichtsschritte.</AppText>
        </View>
        <Pressable onPress={() => router.push('/lektion-neu')} style={({ pressed }) => pressed && styles.pressed}>
          <AppText variant="bodyStrong" color={Palette.forest}>Editor öffnen</AppText>
        </Pressable>
      </Card>
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  toolbarCard: { padding: Space.lg },
  toolbarRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: Space.lg },
  toolbarCopy: { gap: 2 },
  treeCard: { minHeight: 390 },
  yearNode: {
    flexDirection: 'row', alignItems: 'center', gap: Space.md, borderWidth: 1,
    borderColor: Palette.line, backgroundColor: '#F9FAF7', borderRadius: 16, padding: Space.lg,
  },
  nodeIcon: {
    width: 44, height: 44, borderRadius: 15, backgroundColor: Palette.mint,
    alignItems: 'center', justifyContent: 'center',
  },
  nodeCopy: { flex: 1 },
  treeLine: { width: 2, height: 34, backgroundColor: Palette.line, marginLeft: 37 },
  editorHint: { flexDirection: 'row', alignItems: 'center', gap: Space.lg },
  hintIcon: {
    width: 48, height: 48, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.62)',
    alignItems: 'center', justifyContent: 'center',
  },
  hintCopy: { flex: 1, gap: 3 },
  pressed: { opacity: 0.65 },
});

