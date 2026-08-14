import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { DataLoading, ErrorBanner, RowActions } from '@/components/ui/data-ui';
import { AppText, Card, EmptyState, PageScaffold, Pill } from '@/components/ui/primitives';
import { Palette, Radius, Space } from '@/constants/design';
import { useAcademy } from '@/context/academy-context';
import { useAcademyData } from '@/context/academy-data-context';
import { deleteRecord } from '@/lib/academy-api';
import { SubmissionType } from '@/types/database';
import { confirmAction } from '@/utils/feedback';
import { apiErrorMessage, formatDateTime } from '@/utils/format';

type Filter = 'all' | SubmissionType;

const filterOptions: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Alle' },
  { value: 'confirmation', label: 'Bestätigungen' },
  { value: 'text', label: 'Textantworten' },
  { value: 'audio', label: 'Audio' },
  { value: 'image', label: 'Bilder' },
];

export default function SubmissionsScreen() {
  const { activeRole } = useAcademy();
  const isTeam = activeRole === 'team';
  const { data, isLoading, error: loadError, refresh, execute } = useAcademyData();
  const [filter, setFilter] = useState<Filter>('all');
  const [actionError, setActionError] = useState<string | null>(null);
  const visible = useMemo(
    () => data.submissions.filter((submission) => filter === 'all' || submission.submission_type === filter),
    [data.submissions, filter]
  );

  async function remove(id: number) {
    const confirmed = await confirmAction('Abgabe zurücksetzen?', 'Die Abgabe wird gelöscht und kann vom Kind erneut eingereicht werden.');
    if (!confirmed) return;
    setActionError(null);
    try {
      await execute(() => deleteRecord('submissions', id));
    } catch (reason) {
      setActionError(apiErrorMessage(reason));
    }
  }

  return (
    <PageScaffold
      eyebrow={isTeam ? 'Team-Bereich' : 'Familienbereich'}
      title="Abgaben"
      description="Antworten und Bestätigungen aus den interaktiven Lernschritten.">
      {loadError && <ErrorBanner message={loadError} onRetry={() => void refresh()} />}
      {actionError && <ErrorBanner message={actionError} />}
      <View style={styles.filters}>
        {filterOptions.map((option) => (
          <Pressable key={option.value} onPress={() => setFilter(option.value)}>
            <Pill tone={filter === option.value ? 'mint' : 'neutral'}>{option.label}</Pill>
          </Pressable>
        ))}
      </View>
      <Card style={styles.listCard}>
        {isLoading && data.submissions.length === 0 ? (
          <DataLoading />
        ) : visible.length === 0 ? (
          <EmptyState icon="check" title="Noch keine Abgaben" description="Abgeschickte Quizantworten und Challenges erscheinen automatisch hier." />
        ) : (
          <View style={styles.list}>
            {visible.map((submission) => {
              const child = data.children.find((entry) => entry.id === submission.child_id);
              const lesson = data.lessons.find((entry) => entry.id === submission.lesson_id);
              const step = data.lessonSteps.find((entry) => entry.id === submission.lesson_step_id);
              return (
                <View key={submission.id} style={styles.row}>
                  <View style={styles.icon}><AppIcon name={submission.submission_type === 'confirmation' ? 'check' : 'messages'} size={20} color={Palette.forest} /></View>
                  <View style={styles.copy}>
                    <View style={styles.titleLine}>
                      <AppText variant="bodyStrong">{child?.display_name ?? 'Kinderprofil'}</AppText>
                      <Pill tone={submission.submission_type === 'confirmation' ? 'mint' : 'sky'}>
                        {submission.submission_type === 'confirmation' ? 'Challenge' : submission.submission_type === 'text' ? 'Textantwort' : submission.submission_type}
                      </Pill>
                    </View>
                    <AppText color={Palette.inkSoft}>{submission.text_value || 'Als erledigt bestätigt.'}</AppText>
                    <AppText variant="small" color={Palette.muted}>
                      {lesson?.title ?? 'Lektion'} · {step?.title ?? 'Lernschritt'} · {formatDateTime(submission.submitted_at)}
                    </AppText>
                  </View>
                  {isTeam && <RowActions onDelete={() => void remove(submission.id)} />}
                </View>
              );
            })}
          </View>
        )}
      </Card>
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  listCard: { minHeight: 430 },
  list: { gap: Space.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap', gap: Space.md, borderBottomWidth: 1, borderBottomColor: Palette.line, paddingVertical: Space.lg },
  icon: { width: 42, height: 42, borderRadius: Radius.medium, backgroundColor: Palette.mint, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 240, gap: Space.sm },
  titleLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Space.sm },
});
