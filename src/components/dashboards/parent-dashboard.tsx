import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { DataLoading, ErrorBanner } from '@/components/ui/data-ui';
import {
  ActionButton,
  AppText,
  Card,
  EmptyState,
  PageScaffold,
  Pill,
  ProgressBar,
  SectionHeader,
  StatCard,
} from '@/components/ui/primitives';
import { Layout, Palette, Radius, Space } from '@/constants/design';
import { useAcademy } from '@/context/academy-context';
import { useAcademyData } from '@/context/academy-data-context';
import { formatDateTime } from '@/utils/format';

export function ParentDashboard() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [openedAt] = useState(() => Date.now());
  const compact = width < Layout.compactBreakpoint;
  const { enterChildArea } = useAcademy();
  const { data, isLoading, error, refresh } = useAcademyData();
  const upcomingSessions = data.liveSessions
    .filter((session) => new Date(session.ends_at).getTime() >= openedAt && session.status !== 'cancelled')
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const nextSession = upcomingSessions[0];
  const openConfirmations = data.lessonSteps.filter(
    (step) =>
      step.step_type === 'challenge' &&
      !data.submissions.some(
        (submission) => submission.lesson_step_id === step.id
      )
  ).length;

  function openChild(childId: number) {
    enterChildArea(childId);
    router.push('/dashboard');
  }

  return (
    <PageScaffold
      eyebrow="Elternbereich"
      title="Lernwege gemeinsam begleiten"
      description="Termine, Aufgaben und der persönliche Fortschritt deiner Kinder."
      action={<ActionButton label="Kind hinzufügen" icon="add" onPress={() => router.push('/kinder')} />}>
      {error && <ErrorBanner message={error} onRetry={() => void refresh()} />}
      <View style={styles.statsGrid}>
        <StatCard icon="children" value={String(data.children.length)} label="Kinderprofile" tone="mint" />
        <StatCard icon="calendar" value={String(upcomingSessions.length)} label="Anstehende Termine" tone="sky" />
        <StatCard icon="check" value={String(openConfirmations)} label="Offene Challenges" tone="sun" />
      </View>

      <View style={[styles.mainGrid, compact && styles.column]}>
        <Card style={styles.childrenCard}>
          <SectionHeader title="Meine Kinder" description="Profile und Lernstände" action={<ActionButton label="Alle ansehen" variant="quiet" compact onPress={() => router.push('/kinder')} />} />
          {isLoading && data.children.length === 0 ? (
            <DataLoading />
          ) : data.children.length === 0 ? (
            <EmptyState compact icon="children" title="Noch kein Kinderprofil" description="Lege ein Profil an, um Lernweg und Fortschritt zu begleiten." actionLabel="Profil anlegen" onAction={() => router.push('/kinder')} />
          ) : (
            <View style={styles.childList}>
              {data.children.slice(0, 4).map((child) => {
                const rows = data.lessonProgress.filter((progress) => progress.child_id === child.id);
                const percent = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.progress_percent, 0) / rows.length) : 0;
                return (
                  <View key={child.id} style={styles.childRow}>
                    <View style={styles.childAvatar}><AppText variant="bodyStrong">{child.display_name.charAt(0).toUpperCase()}</AppText></View>
                    <View style={styles.childCopy}>
                      <View style={styles.titleLine}><AppText variant="bodyStrong">{child.display_name}</AppText><Pill>{child.age_group}</Pill></View>
                      <ProgressBar value={percent} />
                      <AppText variant="small" color={Palette.muted}>{percent}% Fortschritt</AppText>
                    </View>
                    <ActionButton label="Öffnen" icon="arrow" compact variant="secondary" onPress={() => openChild(child.id)} />
                  </View>
                );
              })}
            </View>
          )}
        </Card>

        <Card tone="dark" style={styles.nextCard}>
          <View style={styles.nextTop}>
            <View style={styles.darkIcon}><AppIcon name="calendar" size={23} color={Palette.sun} /></View>
            <Pill tone="sun">Nächster Termin</Pill>
          </View>
          <View style={styles.nextCopy}>
            <AppText variant="heading" color={Palette.white}>{nextSession?.title || (nextSession ? data.lessons.find((lesson) => lesson.id === nextSession.lesson_id)?.title : 'Noch kein Unterricht geplant')}</AppText>
            <AppText color="#CDE0D7">{nextSession ? formatDateTime(nextSession.starts_at) : 'Sobald eine Gruppe einen Termin erhält, stehen hier Zeit und Zugang bereit.'}</AppText>
          </View>
          {nextSession?.meeting_url ? (
            <ActionButton label="Zoom öffnen" icon="external" variant="secondary" onPress={() => void Linking.openURL(nextSession.meeting_url!)} />
          ) : (
            <ActionButton label="Kalender öffnen" variant="secondary" onPress={() => router.push('/kalender')} />
          )}
        </Card>
      </View>

      <Card>
        <SectionHeader title="Aktuelle Wochenaufgaben" description="Challenges und Abgaben" />
        {data.lessonSteps.filter((step) => step.step_type === 'challenge').length === 0 ? (
          <View style={styles.inlineEmpty}>
            <View style={styles.inlineIcon}><AppIcon name="check" size={24} color={Palette.forest} /></View>
            <View style={styles.inlineCopy}><AppText variant="bodyStrong">Keine offenen Aufgaben</AppText><AppText color={Palette.inkSoft}>Veröffentlichte Challenges erscheinen hier.</AppText></View>
          </View>
        ) : (
          <View style={styles.challengeList}>
            {data.lessonSteps.filter((step) => step.step_type === 'challenge').slice(0, 5).map((step) => (
              <View key={step.id} style={styles.challengeRow}>
                <AppIcon name="trophy" size={20} color="#934E39" />
                <View style={styles.inlineCopy}>
                  <AppText variant="bodyStrong">{step.title || 'Wochen-Challenge'}</AppText>
                  <AppText variant="small" color={Palette.muted}>{data.lessons.find((lesson) => lesson.id === step.lesson_id)?.title}</AppText>
                </View>
              </View>
            ))}
          </View>
        )}
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
  darkIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  nextCopy: { gap: Space.sm, paddingVertical: Space.xl },
  childList: { gap: Space.sm, marginTop: Space.lg },
  childRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Space.md, borderBottomWidth: 1, borderBottomColor: Palette.line, paddingVertical: Space.md },
  childAvatar: { width: 42, height: 42, borderRadius: 15, backgroundColor: Palette.sun, alignItems: 'center', justifyContent: 'center' },
  childCopy: { flex: 1, minWidth: 190, gap: 5 },
  titleLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Space.sm },
  inlineEmpty: { marginTop: Space.xl, minHeight: 112, borderWidth: 1, borderStyle: 'dashed', borderColor: Palette.line, borderRadius: 18, backgroundColor: '#F9FAF7', padding: Space.lg, flexDirection: 'row', alignItems: 'center', gap: Space.lg },
  inlineIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: Palette.mint, alignItems: 'center', justifyContent: 'center' },
  inlineCopy: { flex: 1, gap: 3 },
  challengeList: { gap: Space.sm, marginTop: Space.lg },
  challengeRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: Space.md, borderWidth: 1, borderColor: Palette.line, borderRadius: Radius.medium, padding: Space.md },
});
