import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { DataLoading, ErrorBanner } from '@/components/ui/data-ui';
import { ActionButton, AppText, Card, EmptyState, Field, PageScaffold, Pill, ProgressBar } from '@/components/ui/primitives';
import { Palette, Radius, Space } from '@/constants/design';
import { useAcademy } from '@/context/academy-context';
import { useAcademyData } from '@/context/academy-data-context';
import { saveConfirmationSubmission, saveTextSubmission, setStepCompleted } from '@/lib/academy-api';
import { LessonStepRow, LessonStepType } from '@/types/database';
import { apiErrorMessage, formatDateTime } from '@/utils/format';

const stepMeta: Record<LessonStepType, { label: string; icon: 'play' | 'journeys' | 'lessons' | 'check' | 'trophy'; tone: 'mint' | 'sun' | 'sky' | 'coral' | 'neutral' }> = {
  start: { label: 'Start', icon: 'play', tone: 'mint' },
  discover: { label: 'Entdecken', icon: 'journeys', tone: 'sun' },
  explain: { label: 'Verstehen', icon: 'lessons', tone: 'sky' },
  quiz: { label: 'Quiz', icon: 'check', tone: 'mint' },
  challenge: { label: 'Challenge', icon: 'trophy', tone: 'coral' },
};

function contentText(step: LessonStepRow) {
  if (
    step.content &&
    typeof step.content === 'object' &&
    !Array.isArray(step.content) &&
    typeof step.content.text === 'string'
  ) {
    return step.content.text;
  }
  return '';
}

export default function LessonDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const lessonId = Number(params.id);
  const { selectedChildId } = useAcademy();
  const { data, isLoading, error: loadError, refresh, execute } = useAcademyData();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [savingStepId, setSavingStepId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const child = data.children.find((entry) => entry.id === selectedChildId);
  const lesson = data.lessons.find((entry) => entry.id === lessonId && entry.status === 'published');
  const journey = data.journeys.find((entry) => entry.id === lesson?.learning_journey_id);
  const steps = useMemo(
    () => data.lessonSteps.filter((entry) => entry.lesson_id === lessonId).sort((a, b) => a.position - b.position),
    [data.lessonSteps, lessonId]
  );
  const completedIds = useMemo(
    () => new Set(data.stepProgress.filter((row) => row.child_id === child?.id).map((row) => row.lesson_step_id)),
    [child?.id, data.stepProgress]
  );
  const progress = steps.length
    ? Math.round((steps.filter((step) => completedIds.has(step.id)).length / steps.length) * 100)
    : 0;
  const liveSession = data.liveSessions
    .filter((session) => session.lesson_id === lessonId && session.status !== 'cancelled')
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];

  if (isLoading && (!child || !lesson)) return <DataLoading label="Lektion wird geladen …" />;

  if (!child || !lesson || !Number.isFinite(lessonId)) {
    return (
      <PageScaffold eyebrow="Lektion" title="Lektion nicht verfügbar">
        <Card>
          <EmptyState
            icon="lock"
            title="Kein Zugriff auf diese Lektion"
            description="Wähle ein Kinderprofil und öffne eine veröffentlichte Lektion über die Lernreisen."
            actionLabel="Zu den Lernreisen"
            onAction={() => router.replace('/lernreisen')}
          />
        </Card>
      </PageScaffold>
    );
  }

  async function toggleStep(step: LessonStepRow) {
    if (!child || !lesson) return;
    const completed = completedIds.has(step.id);
    const storedAnswer = data.submissions.find(
      (submission) => submission.child_id === child.id && submission.lesson_step_id === step.id
    )?.text_value;
    const answer = (answers[step.id] ?? storedAnswer ?? '').trim();
    if (!completed && step.step_type === 'quiz' && !answer) {
      setActionError('Schreibe zuerst deine Antwort für das Quiz auf.');
      return;
    }

    setSavingStepId(step.id);
    setActionError(null);
    try {
      await execute(async () => {
        if (!completed && step.step_type === 'quiz') {
          await saveTextSubmission(child.id, lesson.id, step.id, answer);
        }
        if (!completed && step.step_type === 'challenge') {
          await saveConfirmationSubmission(child.id, lesson.id, step.id, answer);
        }
        await setStepCompleted(child.id, lesson.id, step.id, !completed);
      });
    } catch (reason) {
      setActionError(apiErrorMessage(reason));
    } finally {
      setSavingStepId(null);
    }
  }

  return (
    <PageScaffold
      eyebrow={journey?.title ?? 'Lernreise'}
      title={lesson.title}
      description={lesson.description ?? undefined}
      action={<ActionButton label="Zurück" icon="arrow" variant="secondary" onPress={() => router.back()} />}>
      {loadError && <ErrorBanner message={loadError} onRetry={() => void refresh()} />}
      {actionError && <ErrorBanner message={actionError} />}

      <Card tone="dark" style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <View style={styles.progressCopy}>
            <Pill tone={progress === 100 ? 'sun' : 'mint'}>{progress === 100 ? 'Geschafft' : 'Dein Fortschritt'}</Pill>
            <AppText variant="heading" color={Palette.white}>
              {steps.filter((step) => completedIds.has(step.id)).length} von {steps.length} Schritten abgeschlossen
            </AppText>
          </View>
          <AppText variant="title" color={Palette.sun}>{progress}%</AppText>
        </View>
        <ProgressBar value={progress} color={Palette.sun} trackColor="rgba(255,255,255,0.13)" />
        {(lesson.replay_url || liveSession) && (
          <View style={styles.linkRow}>
            {liveSession?.meeting_url && (
              <ActionButton label={`Zoom · ${formatDateTime(liveSession.starts_at)}`} icon="external" variant="secondary" onPress={() => void Linking.openURL(liveSession.meeting_url!)} />
            )}
            {(lesson.replay_url || liveSession?.replay_url) && (
              <ActionButton label="Aufzeichnung öffnen" icon="play" variant="secondary" onPress={() => void Linking.openURL(lesson.replay_url || liveSession!.replay_url!)} />
            )}
          </View>
        )}
      </Card>

      {steps.length === 0 ? (
        <Card><EmptyState icon="lessons" title="Noch keine Lernschritte" description="Das Akademie-Team ergänzt die Lernschritte später." /></Card>
      ) : (
        <View style={styles.stepsList}>
          {steps.map((step, index) => {
            const meta = stepMeta[step.step_type];
            const completed = completedIds.has(step.id);
            const interactive = step.step_type === 'quiz' || step.step_type === 'challenge';
            const storedAnswer = data.submissions.find(
              (submission) => submission.child_id === child.id && submission.lesson_step_id === step.id
            )?.text_value;
            return (
              <Card key={step.id} style={[styles.stepCard, completed && styles.stepCardDone]}>
                <View style={styles.stepHeader}>
                  <View style={[styles.stepIcon, completed && styles.stepIconDone]}>
                    <AppIcon name={completed ? 'check' : meta.icon} size={21} color={completed ? Palette.white : Palette.forest} />
                  </View>
                  <View style={styles.stepTitle}>
                    <View style={styles.stepMeta}>
                      <Pill tone={meta.tone}>{meta.label}</Pill>
                      <AppText variant="small" color={Palette.muted}>Schritt {index + 1}</AppText>
                    </View>
                    <AppText variant="heading">{step.title || meta.label}</AppText>
                  </View>
                </View>
                {contentText(step) ? <AppText color={Palette.inkSoft}>{contentText(step)}</AppText> : null}
                {interactive && (
                  <Field
                    label={step.step_type === 'quiz' ? 'Deine Antwort' : 'Deine Notiz (optional)'}
                    placeholder={step.step_type === 'quiz' ? 'Antwort aufschreiben …' : 'Was hast du gemacht oder gelernt?'}
                    multiline
                    editable={!completed}
                    value={answers[step.id] ?? storedAnswer ?? ''}
                    onChangeText={(value) => setAnswers((current) => ({ ...current, [step.id]: value }))}
                  />
                )}
                <View style={styles.stepFooter}>
                  <ActionButton
                    label={savingStepId === step.id ? 'Wird gespeichert …' : completed ? 'Als offen markieren' : interactive ? 'Antwort speichern & abschließen' : 'Schritt abschließen'}
                    icon={completed ? 'refresh' : 'check'}
                    variant={completed ? 'secondary' : 'primary'}
                    disabled={savingStepId !== null}
                    onPress={() => void toggleStep(step)}
                  />
                </View>
              </Card>
            );
          })}
        </View>
      )}

      {progress === 100 && (
        <Card tone="sun" style={styles.doneCard}>
          <View style={styles.doneIcon}><AppIcon name="trophy" size={28} color="#846211" /></View>
          <View style={styles.doneCopy}>
            <AppText variant="heading">MashaAllah, Lektion geschafft!</AppText>
            <AppText color={Palette.inkSoft}>Dein Fortschritt wurde in Supabase gespeichert.</AppText>
          </View>
          <ActionButton label="Weiter zu den Lernreisen" variant="secondary" onPress={() => router.replace('/lernreisen')} />
        </Card>
      )}
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  progressCard: { gap: Space.lg },
  progressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: Space.lg },
  progressCopy: { flex: 1, minWidth: 230, alignItems: 'flex-start', gap: Space.md },
  linkRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  stepsList: { gap: Space.lg },
  stepCard: { gap: Space.lg, borderWidth: 1, borderColor: Palette.line },
  stepCardDone: { borderColor: Palette.mintStrong, backgroundColor: '#FBFFFC' },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  stepIcon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: Palette.mint },
  stepIconDone: { backgroundColor: Palette.forest },
  stepTitle: { flex: 1, minWidth: 0, gap: 6 },
  stepMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Space.sm },
  stepFooter: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: Palette.line, paddingTop: Space.md },
  doneCard: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Space.lg },
  doneIcon: { width: 58, height: 58, borderRadius: Radius.large, backgroundColor: 'rgba(255,255,255,0.65)', alignItems: 'center', justifyContent: 'center' },
  doneCopy: { flex: 1, minWidth: 240, gap: 3 },
});
