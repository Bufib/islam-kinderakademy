import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppIcon, AppIconName } from '@/components/ui/app-icon';
import { ChoiceChips, DataLoading, ErrorBanner } from '@/components/ui/data-ui';
import {
  ActionButton,
  AppText,
  Card,
  Field,
  PageScaffold,
  Pill,
  SectionHeader,
} from '@/components/ui/primitives';
import { Layout, Palette, Space } from '@/constants/design';
import { useAcademyData } from '@/context/academy-data-context';
import { deleteRecord, saveLesson } from '@/lib/academy-api';
import {
  AcademyData,
  LessonRow,
  LessonStatus,
  LessonStepType,
  LiveSessionRow,
} from '@/types/database';
import { apiErrorMessage, parseDateTimeInput, toDateTimeInput } from '@/utils/format';

const stepDefinitions: {
  stepType: LessonStepType;
  title: string;
  description: string;
  icon: AppIconName;
  tone: string;
}[] = [
  { stepType: 'start', title: 'Start', description: 'Einstiegsfrage oder erste Situation', icon: 'play', tone: Palette.sunSoft },
  { stepType: 'discover', title: 'Entdecken', description: 'Geschichte, Bilder und Erklärung', icon: 'journeys', tone: Palette.skySoft },
  { stepType: 'explain', title: 'Kinder erklären', description: 'Fragen, Denken und eigene Beispiele', icon: 'children', tone: Palette.mint },
  { stepType: 'quiz', title: 'Mini-Quiz', description: 'Kurze interaktive Lernkontrolle', icon: 'check', tone: '#EEF1EF' },
  { stepType: 'challenge', title: 'Wochen-Challenge', description: 'Aufgabe für den Alltag', icon: 'trophy', tone: Palette.coralSoft },
];

type StepForm = { stepType: LessonStepType; title: string; text: string; position: number };

export default function LessonEditorScreen() {
  const params = useLocalSearchParams<{ lessonId?: string }>();
  const lessonId = params.lessonId ? Number(params.lessonId) : null;
  const { data, isLoading, error } = useAcademyData();
  const lesson = lessonId ? data.lessons.find((entry) => entry.id === lessonId) : null;

  if (lessonId && isLoading && !lesson) {
    return <PageScaffold title="Lektion laden"><Card><DataLoading /></Card></PageScaffold>;
  }

  if (lessonId && !lesson) {
    return (
      <PageScaffold title="Lektion nicht gefunden">
        <Card><ErrorBanner message={error ?? 'Die angeforderte Lektion ist nicht vorhanden oder nicht zugänglich.'} /></Card>
      </PageScaffold>
    );
  }

  return <LessonEditor key={lesson?.id ?? 'new'} data={data} initialLesson={lesson ?? null} />;
}

function LessonEditor({ data, initialLesson }: { data: AcademyData; initialLesson: LessonRow | null }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < Layout.compactBreakpoint;
  const { execute } = useAcademyData();
  const existingSteps = initialLesson
    ? data.lessonSteps.filter((step) => step.lesson_id === initialLesson.id)
    : [];
  const existingSession = initialLesson
    ? data.liveSessions.find((session) => session.lesson_id === initialLesson.id) ?? null
    : null;
  const [title, setTitle] = useState(initialLesson?.title ?? '');
  const [description, setDescription] = useState(initialLesson?.description ?? '');
  const [journeyId, setJourneyId] = useState<number | null>(initialLesson?.learning_journey_id ?? null);
  const [status, setStatus] = useState<LessonStatus>(initialLesson?.status ?? 'draft');
  const [publishAt, setPublishAt] = useState(initialLesson?.publish_at?.slice(0, 16) ?? '');
  const [replayUrl, setReplayUrl] = useState(initialLesson?.replay_url ?? '');
  const [steps, setSteps] = useState<StepForm[]>(
    stepDefinitions.map((definition, position) => {
      const existing = existingSteps.find((step) => step.position === position);
      const content = existing?.content;
      const text =
        content && typeof content === 'object' && !Array.isArray(content) && typeof content.text === 'string'
          ? content.text
          : '';
      return {
        stepType: definition.stepType,
        title: existing?.title ?? definition.title,
        text,
        position,
      };
    })
  );
  const [hasLiveSession, setHasLiveSession] = useState(Boolean(existingSession));
  const [liveGroupId, setLiveGroupId] = useState<number | null>(existingSession?.group_id ?? null);
  const [liveTitle, setLiveTitle] = useState(existingSession?.title ?? '');
  const [liveStartsAt, setLiveStartsAt] = useState(toDateTimeInput(existingSession?.starts_at));
  const [liveEndsAt, setLiveEndsAt] = useState(toDateTimeInput(existingSession?.ends_at));
  const [meetingUrl, setMeetingUrl] = useState(existingSession?.meeting_url ?? '');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const effectiveJourneyId = journeyId ?? data.journeys[0]?.id ?? null;

  function updateStep(position: number, changes: Partial<StepForm>) {
    setSteps((current) => current.map((step) => (step.position === position ? { ...step, ...changes } : step)));
  }

  async function submit() {
    if (!title.trim() || !effectiveJourneyId) {
      setFormError('Titel und Lernreise sind erforderlich.');
      return;
    }

    let liveSession: LiveSessionRow | null | undefined = undefined;
    if (hasLiveSession) {
      const startsAt = parseDateTimeInput(liveStartsAt);
      const endsAt = parseDateTimeInput(liveEndsAt);
      if (!startsAt || !endsAt || endsAt <= startsAt) {
        setFormError('Für den Live-Termin werden eine gültige Start- und Endzeit benötigt.');
        return;
      }
      liveSession = {
        id: existingSession?.id ?? 0,
        lesson_id: initialLesson?.id ?? 0,
        group_id: liveGroupId,
        title: liveTitle || title,
        starts_at: startsAt,
        ends_at: endsAt,
        meeting_url: meetingUrl || null,
        replay_url: null,
        status: 'scheduled',
        created_at: existingSession?.created_at ?? '',
      };
    }

    setSaving(true);
    setFormError(null);
    try {
      await execute(async () => {
        if (!hasLiveSession && existingSession) {
          await deleteRecord('live_sessions', existingSession.id);
        }
        return saveLesson({
          id: initialLesson?.id,
          learningJourneyId: effectiveJourneyId,
          title,
          description,
          status,
          position:
            initialLesson?.position ??
            data.lessons.filter((lesson) => lesson.learning_journey_id === effectiveJourneyId).length,
          publishAt: publishAt || null,
          replayUrl,
          steps,
          liveSession: liveSession
            ? {
                id: existingSession?.id,
                groupId: liveSession.group_id,
                title: liveSession.title ?? undefined,
                startsAt: liveSession.starts_at,
                endsAt: liveSession.ends_at,
                meetingUrl: liveSession.meeting_url ?? undefined,
              }
            : null,
        });
      });
      router.replace('/lektionen');
    } catch (reason) {
      setFormError(apiErrorMessage(reason));
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageScaffold
      eyebrow="Lektionseditor"
      title={initialLesson ? 'Lektion bearbeiten' : 'Neue Lektion'}
      description="Grunddaten, Lernschritte, Veröffentlichung und Live-Unterricht werden gemeinsam gespeichert."
      action={
        <View style={[styles.headerActions, compact && styles.headerActionsCompact]}>
          <ActionButton label="Abbrechen" variant="secondary" onPress={() => router.back()} />
          <ActionButton
            label={saving ? 'Wird gespeichert …' : initialLesson ? 'Änderungen speichern' : 'Entwurf speichern'}
            icon="check"
            disabled={saving || data.journeys.length === 0}
            onPress={() => void submit()}
          />
        </View>
      }>
      {formError && <ErrorBanner message={formError} />}
      {data.journeys.length === 0 && (
        <ErrorBanner message="Lege im Curriculum zuerst ein Akademiejahr und eine Lernreise an." />
      )}
      <View style={[styles.editorLayout, compact && styles.column]}>
        <View style={styles.mainColumn}>
          <Card>
            <SectionHeader title="Grunddaten" description="Zuordnung und Bezeichnung" />
            <View style={styles.formStack}>
              <Field label="Titel der Lektion" placeholder="Titel eingeben" value={title} onChangeText={setTitle} />
              <ChoiceChips
                label="Lernreise"
                value={effectiveJourneyId}
                onChange={setJourneyId}
                options={data.journeys.map((journey) => ({
                  value: journey.id,
                  label: `${journey.title} · ${journey.age_group}`,
                }))}
              />
              <Field label="Kurzbeschreibung" placeholder="Optionale Beschreibung" multiline value={description} onChangeText={setDescription} />
            </View>
          </Card>

          <SectionHeader title="Unterrichtsschritte" description="Die feste Fünf-Schritte-Struktur" />
          <View style={styles.stepsList}>
            {steps.map((step, index) => {
              const definition = stepDefinitions[index];
              return (
                <Card key={step.stepType} style={styles.stepCard}>
                  <View style={styles.stepHeader}>
                    <View style={[styles.stepIcon, { backgroundColor: definition.tone }]}>
                      <AppIcon name={definition.icon} size={22} color={Palette.forest} />
                    </View>
                    <View style={styles.stepCopy}>
                      <AppText variant="label" color={Palette.muted}>Schritt {String(index + 1).padStart(2, '0')}</AppText>
                      <AppText variant="bodyStrong">{definition.title}</AppText>
                      <AppText variant="small" color={Palette.inkSoft}>{definition.description}</AppText>
                    </View>
                    <Pill tone={step.text.trim() ? 'mint' : 'neutral'}>{step.text.trim() ? 'Gefüllt' : 'Leer'}</Pill>
                  </View>
                  <Field label="Überschrift" value={step.title} onChangeText={(value) => updateStep(step.position, { title: value })} />
                  <Field label="Inhalt / Aufgabe" multiline placeholder="Text für diesen Lernschritt" value={step.text} onChangeText={(text) => updateStep(step.position, { text })} />
                </Card>
              );
            })}
          </View>
        </View>

        <View style={styles.sideColumn}>
          <Card style={styles.statusCard}>
            <SectionHeader title="Status" />
            <ChoiceChips
              label="Veröffentlichung"
              value={status}
              onChange={(value) => value && setStatus(value)}
              options={[
                { value: 'draft', label: 'Entwurf' },
                { value: 'scheduled', label: 'Geplant' },
                { value: 'published', label: 'Veröffentlicht' },
                { value: 'archived', label: 'Archiviert' },
              ]}
            />
            <Field label="Veröffentlichungszeit (optional)" placeholder="2026-09-01T08:00" value={publishAt} onChangeText={setPublishAt} />
          </Card>

          <Card tone="mint" style={styles.mediaCard}>
            <View style={styles.mediaIcon}><AppIcon name="video" size={25} color={Palette.forest} /></View>
            <AppText variant="heading">Lesson Replay</AppText>
            <Field label="Replay-URL" placeholder="https://…" value={replayUrl} onChangeText={setReplayUrl} autoCapitalize="none" />
          </Card>

          <Card>
            <SectionHeader title="Live-Unterricht" />
            <View style={styles.formStack}>
              <ChoiceChips
                label="Live-Termin"
                value={hasLiveSession ? 'yes' : 'no'}
                onChange={(value) => setHasLiveSession(value === 'yes')}
                options={[{ value: 'no', label: 'Kein Termin' }, { value: 'yes', label: 'Termin eintragen' }]}
              />
              {hasLiveSession && (
                <>
                  <Field label="Bezeichnung" placeholder={title || 'Live-Unterricht'} value={liveTitle} onChangeText={setLiveTitle} />
                  <ChoiceChips
                    label="Gruppe (optional)"
                    value={liveGroupId}
                    allowEmpty
                    onChange={setLiveGroupId}
                    options={data.groups.map((group) => ({ value: group.id, label: group.name }))}
                  />
                  <Field label="Beginn" placeholder="2026-09-10T17:00" value={liveStartsAt} onChangeText={setLiveStartsAt} />
                  <Field label="Ende" placeholder="2026-09-10T18:00" value={liveEndsAt} onChangeText={setLiveEndsAt} />
                  <Field label="Zoom-Zugang" placeholder="https://zoom.us/…" value={meetingUrl} onChangeText={setMeetingUrl} autoCapitalize="none" />
                </>
              )}
            </View>
          </Card>
        </View>
      </View>
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', gap: Space.sm },
  headerActionsCompact: { flexDirection: 'column-reverse' },
  editorLayout: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.lg },
  column: { flexDirection: 'column' },
  mainColumn: { flex: 1.45, minWidth: 0, gap: Space.xl },
  sideColumn: { flex: 0.7, minWidth: 300, gap: Space.lg },
  formStack: { gap: Space.lg, marginTop: Space.xl },
  stepsList: { gap: Space.md },
  stepCard: { gap: Space.lg, padding: Space.lg },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  stepIcon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  stepCopy: { flex: 1, gap: 2 },
  statusCard: { gap: Space.lg },
  mediaCard: { gap: Space.md },
  mediaIcon: { width: 50, height: 50, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.65)', alignItems: 'center', justifyContent: 'center' },
});
