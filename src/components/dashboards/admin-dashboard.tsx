import { Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppIcon, AppIconName } from '@/components/ui/app-icon';
import { DataLoading, ErrorBanner } from '@/components/ui/data-ui';
import { ActionButton, AppText, Card, EmptyState, Field, PageScaffold, Pill, ProgressBar, SectionHeader, StatCard } from '@/components/ui/primitives';
import { Layout, Palette, Radius, Space } from '@/constants/design';
import { useAcademyData } from '@/context/academy-data-context';
import { formatDateTime } from '@/utils/format';

const adminActions: { label: string; description: string; icon: AppIconName; href: string }[] = [
  { label: 'Konten & Rollen', description: 'Eltern, Lehrkräfte und Admins', icon: 'profile', href: '/konten' },
  { label: 'Curriculum & Altersgruppen', description: 'Altersgruppen, Jahre und Lernreisen', icon: 'curriculum', href: '/curriculum' },
  { label: 'Lektionen', description: 'Inhalte und Veröffentlichungen', icon: 'lessons', href: '/lektionen' },
  { label: 'Gruppen', description: 'Kinder und Lehrkräfte zuordnen', icon: 'groups', href: '/gruppen' },
  { label: 'Kalender', description: 'Live-Unterricht verwalten', icon: 'calendar', href: '/kalender' },
  { label: 'Mitteilungen', description: 'Familien informieren', icon: 'messages', href: '/mitteilungen' },
  { label: 'Medien', description: 'Privaten Storage verwalten', icon: 'media', href: '/medien' },
  { label: 'Abzeichen', description: 'Persönliche Ziele definieren', icon: 'trophy', href: '/abzeichen' },
  { label: 'Abgaben', description: 'Interaktionen kontrollieren', icon: 'check', href: '/abgaben' },
];

export function AdminDashboard() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < Layout.compactBreakpoint;
  const { data, isLoading, error, refresh } = useAcademyData();
  const [quizSearch, setQuizSearch] = useState('');
  const adminIds = new Set(data.userRoles.filter((row) => row.role === 'admin').map((row) => row.profile_id));
  const teacherIds = new Set(data.userRoles.filter((row) => row.role === 'teacher').map((row) => row.profile_id));
  const staffIds = new Set([...adminIds, ...teacherIds]);
  const parentCount = data.profiles.filter((entry) => !staffIds.has(entry.id)).length;
  const activeYear = data.academyYears.find((year) => year.is_active);
  const publishedLessons = data.lessons.filter((lesson) => lesson.status === 'published').length;
  const scheduledSessions = data.liveSessions.filter(
    (session) => session.status === 'scheduled' || session.status === 'live'
  ).length;
  const completedProgress = data.lessonProgress.filter((row) => row.status === 'completed').length;
  const totalProgress = data.lessonProgress.length;
  const completionRate = totalProgress ? Math.round((completedProgress / totalProgress) * 100) : 0;
  const latestProfiles = [...data.profiles]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5);
  const checks = [
    { label: 'Aktives Akademiejahr', done: Boolean(activeYear), href: '/curriculum' },
    { label: 'Mindestens eine Lehrkraft', done: teacherIds.size > 0, href: '/konten' },
    { label: 'Veröffentlichte Lektionen', done: publishedLessons > 0, href: '/lektionen' },
    { label: 'Eingerichtete Gruppen', done: data.groups.length > 0, href: '/gruppen' },
    { label: 'Geplanter Live-Unterricht', done: scheduledSessions > 0, href: '/kalender' },
  ];
  const filteredQuizLessons = useMemo(() => {
    const query = quizSearch.trim().toLocaleLowerCase('de-DE');
    return [...data.lessons]
      .filter((lesson) => {
        if (!query) return true;
        const journey = data.journeys.find((entry) => entry.id === lesson.learning_journey_id);
        return (
          lesson.title.toLocaleLowerCase('de-DE').includes(query) ||
          journey?.title.toLocaleLowerCase('de-DE').includes(query)
        );
      })
      .sort((a, b) => {
        const aHasQuiz = data.quizzes.some((quiz) => quiz.lesson_id === a.id);
        const bHasQuiz = data.quizzes.some((quiz) => quiz.lesson_id === b.id);
        return Number(bHasQuiz) - Number(aHasQuiz) || a.position - b.position;
      });
  }, [data.journeys, data.lessons, data.quizzes, quizSearch]);
  const visibleQuizLessons = filteredQuizLessons.slice(0, 8);

  function openQuizEditor(lessonId: number) {
    router.push(`/quiz-bearbeiten?lessonId=${lessonId}&returnTo=dashboard` as Href);
  }

  function openTopicEditor(lessonId: number) {
    router.push(`/lektion-neu?lessonId=${lessonId}&returnTo=dashboard` as Href);
  }

  return (
    <PageScaffold
      eyebrow="Administration"
      title="Admin-Dashboard"
      description="Konten, Rollen, Akademiestruktur und Plattformaktivität an einem Ort."
      action={<ActionButton label="Konten verwalten" icon="profile" onPress={() => router.push('/konten')} />}>
      {error && <ErrorBanner message={error} onRetry={() => void refresh()} />}

      <View style={styles.statsGrid}>
        <StatCard icon="profile" value={String(data.profiles.length)} label="Konten" tone="mint" />
        <StatCard icon="groups" value={String(staffIds.size)} label="Teamkonten" tone="sky" />
        <StatCard icon="children" value={String(data.children.length)} label="Kinderprofile" tone="sun" />
        <StatCard icon="lessons" value={String(publishedLessons)} label="Veröffentlichte Lektionen" tone="coral" />
      </View>

      <SectionHeader title="Administration" description="Alle zentralen Arbeitsbereiche" />
      <View style={styles.quickGrid}>
        {adminActions.map((item) => (
          <Pressable
            key={item.href}
            onPress={() => router.push(item.href as Href)}
            style={({ pressed }) => [styles.quickPressable, pressed && styles.pressed]}>
            <Card style={styles.quickCard}>
              <View style={styles.quickIcon}><AppIcon name={item.icon} size={22} color={Palette.forest} /></View>
              <View style={styles.quickCopy}>
                <AppText variant="bodyStrong">{item.label}</AppText>
                <AppText variant="small" color={Palette.inkSoft}>{item.description}</AppText>
              </View>
              <AppIcon name="arrow" size={18} color={Palette.muted} />
            </Card>
          </Pressable>
        ))}
      </View>

      <Card>
        <SectionHeader
          title="Themen und Multiple-Choice-Quizze"
          description="Vorhandene Unterrichtsthemen bearbeiten und zu jeder Lektion ein Quiz anlegen."
          action={<ActionButton label="Alle Lektionen" compact variant="quiet" onPress={() => router.push('/lektionen')} />}
        />
        <View style={styles.quizToolbar}>
          <View style={styles.quizSearch}>
            <Field
              label="Thema suchen"
              placeholder="Titel oder Lernreise"
              value={quizSearch}
              onChangeText={setQuizSearch}
            />
          </View>
          <Pill>{filteredQuizLessons.length} Themen</Pill>
        </View>
        {isLoading && data.lessons.length === 0 ? (
          <DataLoading label="Lektionen werden geladen …" />
        ) : visibleQuizLessons.length === 0 ? (
          <EmptyState
            compact
            icon="lessons"
            title={data.lessons.length === 0 ? 'Noch keine Lektionen' : 'Keine Lektion gefunden'}
            description={
              data.lessons.length === 0
                ? 'Lege zuerst eine Lektion an, bevor du ein Quiz erstellst.'
                : 'Ändere den Suchbegriff.'
            }
            actionLabel={data.lessons.length === 0 ? 'Lektion anlegen' : undefined}
            onAction={data.lessons.length === 0 ? () => router.push('/lektion-neu') : undefined}
          />
        ) : (
          <View style={styles.quizList}>
            {visibleQuizLessons.map((lesson) => {
              const journey = data.journeys.find((entry) => entry.id === lesson.learning_journey_id);
              const quiz = data.quizzes.find((entry) => entry.lesson_id === lesson.id);
              const questionCount = quiz
                ? data.quizQuestions.filter((question) => question.quiz_id === quiz.id).length
                : 0;
              return (
                <View key={lesson.id} style={styles.quizRow}>
                  <View style={styles.quizIcon}>
                    <AppIcon name={quiz ? 'check' : 'add'} size={19} color={Palette.forest} />
                  </View>
                  <View style={styles.quizCopy}>
                    <AppText variant="bodyStrong">{lesson.title}</AppText>
                    <AppText variant="small" color={Palette.muted} numberOfLines={1}>
                      {journey?.title ?? 'Unbekannte Lernreise'}
                    </AppText>
                  </View>
                  <View style={styles.quizStatus}>
                    <Pill tone={quiz ? 'sky' : 'neutral'}>
                      {quiz ? `${questionCount} ${questionCount === 1 ? 'Frage' : 'Fragen'}` : 'Kein Quiz'}
                    </Pill>
                    {quiz && (
                      <Pill tone={quiz.is_published ? 'mint' : 'sun'}>
                        {quiz.is_published ? 'Freigegeben' : 'Gesperrt'}
                      </Pill>
                    )}
                  </View>
                  <View style={styles.topicActions}>
                    <ActionButton
                      label="Thema bearbeiten"
                      icon="edit"
                      compact
                      variant="secondary"
                      onPress={() => openTopicEditor(lesson.id)}
                    />
                    <ActionButton
                      label={quiz ? 'Quiz bearbeiten' : 'Quiz anlegen'}
                      icon={quiz ? 'edit' : 'add'}
                      compact
                      variant={quiz ? 'secondary' : 'primary'}
                      onPress={() => openQuizEditor(lesson.id)}
                    />
                  </View>
                </View>
              );
            })}
            {filteredQuizLessons.length > visibleQuizLessons.length && (
              <AppText variant="small" color={Palette.muted} style={styles.quizHint}>
                Weitere Lektionen findest du über die Suche oder unter „Alle Lektionen“.
              </AppText>
            )}
          </View>
        )}
      </Card>

      <View style={[styles.mainGrid, compact && styles.column]}>
        <Card style={styles.healthCard}>
          <SectionHeader title="Plattformstatus" description={`${checks.filter((item) => item.done).length} von ${checks.length} Punkten erfüllt`} />
          <View style={styles.checkList}>
            {checks.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => router.push(item.href as Href)}
                style={({ pressed }) => [styles.checkRow, pressed && styles.pressed]}>
                <View style={[styles.checkIcon, item.done && styles.checkIconDone]}>
                  <AppIcon name={item.done ? 'check' : 'clock'} size={18} color={item.done ? Palette.white : Palette.forest} />
                </View>
                <AppText variant="bodyStrong" style={styles.checkLabel}>{item.label}</AppText>
                <Pill tone={item.done ? 'mint' : 'sun'}>{item.done ? 'Bereit' : 'Offen'}</Pill>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card tone="dark" style={styles.systemCard}>
          <View style={styles.systemTop}>
            <View style={styles.systemIcon}><AppIcon name="settings" size={24} color={Palette.sun} /></View>
            <Pill tone="mint">Supabase verbunden</Pill>
          </View>
          <View style={styles.systemCopy}>
            <AppText variant="heading" color={Palette.white}>{activeYear?.title ?? 'Kein aktives Akademiejahr'}</AppText>
            <AppText color="#CDE0D7">{data.groups.length} Gruppen · {scheduledSessions} aktive Termine · {data.messages.length} Mitteilungen</AppText>
          </View>
          <View style={styles.progressCopy}>
            <View style={styles.progressLine}>
              <AppText variant="small" color="#CDE0D7">Abgeschlossene Lernstände</AppText>
              <AppText variant="small" color={Palette.white}>{completionRate}%</AppText>
            </View>
            <ProgressBar value={completionRate} color={Palette.sun} trackColor="rgba(255,255,255,0.13)" />
          </View>
        </Card>
      </View>

      <Card>
        <SectionHeader
          title="Neueste Konten"
          description={`${parentCount} Elternkonten · ${teacherIds.size} Lehrkräfte · ${adminIds.size} Admins`}
          action={<ActionButton label="Alle Konten" compact variant="quiet" onPress={() => router.push('/konten')} />}
        />
        {isLoading && latestProfiles.length === 0 ? (
          <DataLoading />
        ) : latestProfiles.length === 0 ? (
          <EmptyState compact icon="profile" title="Noch keine Konten" description="Registrierte Profile erscheinen automatisch hier." />
        ) : (
          <View style={styles.accountList}>
            {latestProfiles.map((account) => {
              const role = adminIds.has(account.id) ? 'Admin' : teacherIds.has(account.id) ? 'Lehrkraft' : 'Elternkonto';
              return (
                <View key={account.id} style={styles.accountRow}>
                  <View style={styles.accountAvatar}><AppText variant="bodyStrong">{account.display_name.charAt(0).toUpperCase()}</AppText></View>
                  <View style={styles.quickCopy}>
                    <AppText variant="bodyStrong">{account.display_name}</AppText>
                    <AppText variant="small" color={Palette.muted}>Erstellt am {formatDateTime(account.created_at)}</AppText>
                  </View>
                  <Pill tone={role === 'Admin' ? 'coral' : role === 'Lehrkraft' ? 'sky' : 'mint'}>{role}</Pill>
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
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.lg },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.md },
  quickPressable: { flex: 1, minWidth: 230 },
  quickCard: { minHeight: 94, flexDirection: 'row', alignItems: 'center', gap: Space.md, padding: Space.lg },
  quickIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: Palette.mint, alignItems: 'center', justifyContent: 'center' },
  quickCopy: { flex: 1, minWidth: 0, gap: 2 },
  quizToolbar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: Space.lg, marginTop: Space.lg },
  quizSearch: { flex: 1, minWidth: 240 },
  quizList: { marginTop: Space.lg },
  quizRow: { minHeight: 76, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Space.md, borderBottomWidth: 1, borderBottomColor: Palette.line, paddingVertical: Space.sm },
  quizIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: Palette.mint, alignItems: 'center', justifyContent: 'center' },
  quizCopy: { flex: 1, minWidth: 210, gap: 2 },
  quizStatus: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  topicActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  quizHint: { paddingTop: Space.md },
  mainGrid: { flexDirection: 'row', gap: Space.lg, alignItems: 'stretch' },
  column: { flexDirection: 'column' },
  healthCard: { flex: 1.25, minWidth: 0 },
  systemCard: { flex: 0.75, minWidth: 280, justifyContent: 'space-between', gap: Space.xl },
  systemTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space.md },
  systemIcon: { width: 48, height: 48, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  systemCopy: { gap: Space.sm },
  progressCopy: { gap: Space.sm },
  progressLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  checkList: { marginTop: Space.lg },
  checkRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: Space.md, borderBottomWidth: 1, borderBottomColor: Palette.line, paddingVertical: Space.sm },
  checkIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: Palette.mint, alignItems: 'center', justifyContent: 'center' },
  checkIconDone: { backgroundColor: Palette.forest },
  checkLabel: { flex: 1 },
  accountList: { marginTop: Space.lg },
  accountRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Space.md, borderBottomWidth: 1, borderBottomColor: Palette.line, paddingVertical: Space.sm },
  accountAvatar: { width: 42, height: 42, borderRadius: Radius.medium, backgroundColor: Palette.sun, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
});
