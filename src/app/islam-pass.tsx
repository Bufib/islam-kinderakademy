import { useRouter } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { DataLoading, ErrorBanner } from '@/components/ui/data-ui';
import { AppText, Card, EmptyState, PageScaffold, Pill, ProgressBar, SectionHeader } from '@/components/ui/primitives';
import { Layout, Palette, Radius, Space } from '@/constants/design';
import { useAcademy } from '@/context/academy-context';
import { useAcademyData } from '@/context/academy-data-context';
import { formatDate } from '@/utils/format';

export default function IslamPassScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < Layout.compactBreakpoint;
  const { selectedChildId } = useAcademy();
  const { data, isLoading, error, refresh } = useAcademyData();
  const child = data.children.find((entry) => entry.id === selectedChildId);

  if (isLoading && !child) return <DataLoading label="Islam-Pass wird geladen …" />;

  if (!child) {
    return (
      <PageScaffold eyebrow="Persönlicher Fortschritt" title="Mein Islam-Pass">
        <Card><EmptyState icon="children" title="Kein Kinderprofil ausgewählt" description="Öffne den Kinderbereich über „Meine Kinder“." actionLabel="Kinder auswählen" onAction={() => router.replace('/kinder')} /></Card>
      </PageScaffold>
    );
  }

  const activeYearIds = data.academyYears.filter((year) => year.is_active).map((year) => year.id);
  const journeys = data.journeys
    .filter((journey) => journey.age_group === child.age_group && journey.is_published && activeYearIds.includes(journey.academy_year_id))
    .sort((a, b) => a.position - b.position);
  const lessonRows = data.lessons.filter(
    (lesson) => lesson.status === 'published' && journeys.some((journey) => journey.id === lesson.learning_journey_id)
  );
  const progressRows = data.lessonProgress.filter((row) => row.child_id === child.id);
  const completedLessons = lessonRows.filter(
    (lesson) => progressRows.find((row) => row.lesson_id === lesson.id)?.status === 'completed'
  ).length;
  const overall = lessonRows.length ? Math.round((completedLessons / lessonRows.length) * 100) : 0;
  const awards = data.childBadges.filter((award) => award.child_id === child.id);
  const level = Math.floor(completedLessons / 3) + 1;

  return (
    <PageScaffold
      eyebrow="Persönlicher Fortschritt"
      title="Mein Islam-Pass"
      description="Stempel und Abzeichen machen deinen eigenen Lernweg sichtbar – ohne Vergleich.">
      {error && <ErrorBanner message={error} onRetry={() => void refresh()} />}
      <Card tone="dark" style={[styles.passCard, compact && styles.passCardCompact]}>
        <View style={styles.passHeader}>
          <View style={styles.passBrand}>
            <View style={styles.passIcon}><AppIcon name="pass" size={29} color={Palette.ink} /></View>
            <View>
              <AppText variant="label" color={Palette.mintStrong}>Islam-Kinderakademie</AppText>
              <AppText variant="title" color={Palette.white}>Mein Lernpass</AppText>
            </View>
          </View>
          <Pill tone="sun">Level {level}</Pill>
        </View>
        <View style={[styles.passBody, compact && styles.passBodyCompact]}>
          <View style={styles.avatar}><AppText variant="title">{child.display_name.charAt(0).toUpperCase()}</AppText></View>
          <View style={styles.passDetails}>
            <AppText variant="heading" color={Palette.white}>{child.display_name}</AppText>
            <AppText color="#CDE0D7">Altersgruppe {child.age_group === '5-8' ? '5–8 Jahre' : '9–12 Jahre'}</AppText>
            <View style={styles.passProgressRow}>
              <AppText variant="small" color="#CDE0D7">Gesamtfortschritt</AppText>
              <AppText variant="small" color={Palette.white}>{overall} %</AppText>
            </View>
            <ProgressBar value={overall} color={Palette.sun} trackColor="rgba(255,255,255,0.13)" />
          </View>
        </View>
      </Card>

      <SectionHeader title="Meine Stempel" description="Jede abgeschlossene Lernreise erhält ihren Stempel." />
      <Card>
        {journeys.length === 0 ? (
          <EmptyState compact icon="journeys" title="Noch keine Lernreisen" description="Die ersten Stempelplätze erscheinen mit den Lernreisen." />
        ) : (
          <View style={styles.stampGrid}>
            {journeys.map((journey) => {
              const journeyLessons = lessonRows.filter((lesson) => lesson.learning_journey_id === journey.id);
              const done = journeyLessons.length > 0 && journeyLessons.every(
                (lesson) => progressRows.find((row) => row.lesson_id === lesson.id)?.status === 'completed'
              );
              return (
                <View key={journey.id} style={styles.stampSlot}>
                  <View style={[styles.stampCircle, done && styles.stampCircleDone]}>
                    <AppIcon name={done ? 'check' : 'lock'} size={23} color={done ? Palette.white : Palette.disabled} />
                  </View>
                  <AppText variant="small" color={done ? Palette.forest : Palette.muted} numberOfLines={2}>{journey.title}</AppText>
                </View>
              );
            })}
          </View>
        )}
      </Card>

      <SectionHeader title="Meine Abzeichen" description="Deine persönlichen Erfolge aus Supabase." />
      {awards.length === 0 ? (
        <Card tone="sun" style={styles.badgesEmpty}>
          <View style={styles.badgesIcon}><AppIcon name="trophy" size={29} color="#846211" /></View>
          <View style={styles.badgesCopy}>
            <AppText variant="heading">Noch keine Abzeichen</AppText>
            <AppText color={Palette.inkSoft}>Das Akademie-Team kann dir persönliche Abzeichen verleihen.</AppText>
          </View>
        </Card>
      ) : (
        <View style={styles.badgeGrid}>
          {awards.map((award) => {
            const badge = data.badges.find((entry) => entry.id === award.badge_id);
            if (!badge) return null;
            return (
              <Card key={award.id} tone="sun" style={styles.badgeCard}>
                <View style={styles.badgesIcon}><AppIcon name="trophy" size={29} color="#846211" /></View>
                <View style={styles.badgesCopy}>
                  <AppText variant="heading">{badge.title}</AppText>
                  {badge.description && <AppText color={Palette.inkSoft}>{badge.description}</AppText>}
                  <AppText variant="small" color={Palette.muted}>Verliehen am {formatDate(award.awarded_at)}</AppText>
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  passCard: { minHeight: 290, padding: Space.xxl },
  passCardCompact: { padding: Space.xl },
  passHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: Space.lg },
  passBrand: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  passIcon: { width: 54, height: 54, borderRadius: 19, backgroundColor: Palette.sun, alignItems: 'center', justifyContent: 'center' },
  passBody: { flexDirection: 'row', alignItems: 'center', gap: Space.xl, marginTop: 54 },
  passBodyCompact: { alignItems: 'flex-start', flexDirection: 'column', marginTop: Space.xl },
  avatar: { width: 76, height: 76, borderRadius: 27, backgroundColor: Palette.sun, alignItems: 'center', justifyContent: 'center' },
  passDetails: { flex: 1, width: '100%', gap: Space.sm },
  passProgressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Space.sm },
  stampGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.xl },
  stampSlot: { width: 116, alignItems: 'center', gap: Space.sm },
  stampCircle: { width: 74, height: 74, borderRadius: 37, borderWidth: 2, borderStyle: 'dashed', borderColor: Palette.line, backgroundColor: '#F5F7F4', alignItems: 'center', justifyContent: 'center' },
  stampCircleDone: { borderStyle: 'solid', borderColor: Palette.forest, backgroundColor: Palette.forest },
  badgesEmpty: { flexDirection: 'row', alignItems: 'center', gap: Space.lg },
  badgesIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' },
  badgesCopy: { flex: 1, minWidth: 180, gap: 4 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.lg },
  badgeCard: { flex: 1, minWidth: 280, flexDirection: 'row', alignItems: 'center', gap: Space.lg, borderRadius: Radius.large },
});
