import * as Linking from 'expo-linking';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { DataLoading, ErrorBanner } from '@/components/ui/data-ui';
import { ActionButton, AppText, Card, EmptyState, PageScaffold, Pill, ProgressBar } from '@/components/ui/primitives';
import { Palette, Radius, Space } from '@/constants/design';
import { useAcademy } from '@/context/academy-context';
import { useAcademyData } from '@/context/academy-data-context';
import { formatDateTime } from '@/utils/format';

const sessionLabels = {
  scheduled: 'Geplant',
  live: 'Jetzt live',
  completed: 'Abgeschlossen',
  cancelled: 'Abgesagt',
} as const;

const sessionPriority = {
  live: 0,
  scheduled: 1,
  completed: 2,
  cancelled: 3,
} as const;

export default function LessonDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const lessonId = Number(params.id);
  const { selectedChildId } = useAcademy();
  const { data, isLoading, error, refresh } = useAcademyData();
  const child = data.children.find((entry) => entry.id === selectedChildId) ?? null;
  const lesson = data.lessons.find((entry) => entry.id === lessonId && entry.status === 'published') ?? null;
  const journey = data.journeys.find((entry) => entry.id === lesson?.learning_journey_id) ?? null;
  const liveSession = data.liveSessions
    .filter((session) => session.lesson_id === lessonId && session.status !== 'cancelled')
    .sort((a, b) => sessionPriority[a.status] - sessionPriority[b.status] || a.starts_at.localeCompare(b.starts_at))[0] ?? null;
  const quiz = data.quizzes.find((entry) => entry.lesson_id === lessonId && entry.is_published) ?? null;
  const questionCount = quiz
    ? data.quizQuestions.filter((question) => question.quiz_id === quiz.id).length
    : 0;
  const progress = data.lessonProgress.find(
    (entry) => entry.child_id === child?.id && entry.lesson_id === lessonId
  );
  const attempts = quiz && child
    ? data.quizAttempts.filter((attempt) => attempt.quiz_id === quiz.id && attempt.child_id === child.id)
    : [];
  const bestScore = attempts.reduce((best, attempt) => Math.max(best, attempt.score_percent), 0);

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

  return (
    <PageScaffold
      eyebrow={journey?.title ?? 'Lernreise'}
      title={lesson.title}
      description={lesson.description ?? undefined}>
      {error && <ErrorBanner message={error} onRetry={() => void refresh()} />}

      <Card tone="dark" style={styles.progressCard}>
        <View style={styles.progressCopy}>
          <Pill tone={progress?.status === 'completed' ? 'sun' : 'mint'}>
            {progress?.status === 'completed' ? 'Lektion abgeschlossen' : 'Deine Lektion'}
          </Pill>
          <AppText variant="heading" color={Palette.white}>
            Lesen, live dabei sein und anschließend das Quiz lösen.
          </AppText>
          <ProgressBar
            value={progress?.progress_percent ?? 0}
            color={Palette.sun}
            trackColor="rgba(255,255,255,0.13)"
          />
        </View>
        <AppText variant="title" color={Palette.sun}>{progress?.progress_percent ?? 0} %</AppText>
      </Card>

      <View style={styles.flow}>
        <Card style={styles.flowCard}>
          <View style={styles.flowHeader}>
            <View style={[styles.stepNumber, styles.stepStart]}><AppText variant="bodyStrong">1</AppText></View>
            <View style={styles.flowHeading}>
              <AppText variant="label" color={Palette.muted}>Vorbereitung</AppText>
              <AppText variant="heading">Einstieg in das Thema</AppText>
            </View>
            <Pill tone="mint">Lesen</Pill>
          </View>
          {lesson.intro_text ? (
            <AppText color={Palette.inkSoft}>{lesson.intro_text}</AppText>
          ) : (
            <AppText color={Palette.muted}>Der Einstiegstext wird noch ergänzt.</AppText>
          )}
        </Card>

        <View style={styles.connector} />

        <Card tone="sky" style={styles.flowCard}>
          <View style={styles.flowHeader}>
            <View style={[styles.stepNumber, styles.stepLive]}><AppIcon name="video" size={20} color={Palette.forest} /></View>
            <View style={styles.flowHeading}>
              <AppText variant="label" color={Palette.muted}>Live-Unterricht</AppText>
              <AppText variant="heading">Zoom-Vorlesung</AppText>
            </View>
            {liveSession && <Pill tone={liveSession.status === 'live' ? 'coral' : 'sky'}>{sessionLabels[liveSession.status]}</Pill>}
          </View>
          {liveSession ? (
            <View style={styles.liveDetails}>
              <View style={styles.liveTime}>
                <AppIcon name="calendar" size={21} color={Palette.forest} />
                <View style={styles.liveTimeCopy}>
                  <AppText variant="bodyStrong">{formatDateTime(liveSession.starts_at)}</AppText>
                  <AppText variant="small" color={Palette.inkSoft}>Ende: {formatDateTime(liveSession.ends_at)}</AppText>
                </View>
              </View>
              <View style={styles.liveActions}>
                {liveSession.meeting_url && liveSession.status !== 'completed' && (
                  <ActionButton
                    label={liveSession.status === 'live' ? 'Jetzt Zoom öffnen' : 'Zoom-Zugang öffnen'}
                    icon="external"
                    onPress={() => void Linking.openURL(liveSession.meeting_url!)}
                  />
                )}
                {(lesson.replay_url || liveSession.replay_url) && (
                  <ActionButton
                    label="Aufzeichnung öffnen"
                    icon="play"
                    variant="secondary"
                    onPress={() => void Linking.openURL(lesson.replay_url || liveSession.replay_url!)}
                  />
                )}
              </View>
            </View>
          ) : (
            <EmptyState compact icon="clock" title="Termin folgt" description="Der nächste Zoom-Termin wird hier zeitlich geplant angezeigt." />
          )}
        </Card>

        <View style={styles.connector} />

        <Card tone="mint" style={styles.flowCard}>
          <View style={styles.flowHeader}>
            <View style={[styles.stepNumber, styles.stepQuiz]}><AppIcon name="check" size={20} color={Palette.white} /></View>
            <View style={styles.flowHeading}>
              <AppText variant="label" color={Palette.muted}>Abschluss</AppText>
              <AppText variant="heading">Multiple-Choice-Quiz</AppText>
            </View>
            {progress?.status === 'completed' && <Pill tone="sun">Bestanden</Pill>}
          </View>
          {quiz && questionCount > 0 ? (
            <View style={styles.quizDetails}>
              <View style={styles.quizCopy}>
                <AppText color={Palette.inkSoft}>{quiz.description ?? 'Überprüfe, was du aus der Vorlesung mitgenommen hast.'}</AppText>
                <AppText variant="small" color={Palette.muted}>
                  {questionCount} Fragen · Bestehensgrenze {quiz.passing_percent} %
                  {attempts.length > 0 ? ` · Bestes Ergebnis ${bestScore} %` : ''}
                </AppText>
              </View>
              <ActionButton
                label={attempts.length > 0 ? 'Quiz erneut öffnen' : 'Quiz starten'}
                icon="arrow"
                onPress={() => router.push(`/quiz/${lesson.id}` as Href)}
              />
            </View>
          ) : (
            <EmptyState compact icon="clock" title="Quiz wird vorbereitet" description="Das Quiz erscheint nach der Veröffentlichung auf einer eigenen Seite." />
          )}
        </Card>
      </View>
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  progressCard: { flexDirection: 'row', alignItems: 'center', gap: Space.xl },
  progressCopy: { flex: 1, alignItems: 'flex-start', gap: Space.md },
  flow: { alignItems: 'stretch' },
  flowCard: { gap: Space.xl },
  flowHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Space.md },
  flowHeading: { flex: 1, minWidth: 190, gap: 2 },
  stepNumber: { width: 46, height: 46, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  stepStart: { backgroundColor: Palette.sunSoft },
  stepLive: { backgroundColor: 'rgba(255,255,255,0.62)' },
  stepQuiz: { backgroundColor: Palette.forest },
  connector: { width: 2, height: 26, alignSelf: 'flex-start', marginLeft: 45, backgroundColor: Palette.line },
  liveDetails: { gap: Space.lg },
  liveTime: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  liveTimeCopy: { gap: 2 },
  liveActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  quizDetails: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Space.lg },
  quizCopy: { flex: 1, minWidth: 230, gap: Space.sm },
});
