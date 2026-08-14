import { Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { DataLoading, ErrorBanner, IconAction, RowActions } from '@/components/ui/data-ui';
import {
  ActionButton,
  AppText,
  Card,
  EmptyState,
  Field,
  PageScaffold,
  Pill,
  SegmentedControl,
} from '@/components/ui/primitives';
import { Palette, Radius, Space } from '@/constants/design';
import { useAcademyData } from '@/context/academy-data-context';
import { deleteRecord } from '@/lib/academy-api';
import { LessonRow } from '@/types/database';
import { confirmAction } from '@/utils/feedback';
import { apiErrorMessage, formatDate } from '@/utils/format';

type LessonFilter = 'all' | 'draft' | 'published';

export default function LessonsScreen() {
  const router = useRouter();
  const { data, isLoading, error, refresh, execute } = useAcademyData();
  const [filter, setFilter] = useState<LessonFilter>('all');
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredLessons = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('de-DE');
    return data.lessons.filter((lesson) => {
      const matchesFilter = filter === 'all' || lesson.status === filter;
      const matchesSearch =
        !query ||
        lesson.title.toLocaleLowerCase('de-DE').includes(query) ||
        lesson.description?.toLocaleLowerCase('de-DE').includes(query) ||
        lesson.intro_text.toLocaleLowerCase('de-DE').includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [data.lessons, filter, search]);

  function editLesson(lesson: LessonRow) {
    router.push(`/lektion-neu?lessonId=${lesson.id}` as Href);
  }

  function editQuiz(lesson: LessonRow) {
    router.push(`/quiz-bearbeiten?lessonId=${lesson.id}` as Href);
  }

  async function removeLesson(lesson: LessonRow) {
    const confirmed = await confirmAction(
      'Lektion löschen?',
      `„${lesson.title}“ sowie Schritte, Termine und Fortschrittsdaten werden gelöscht.`
    );
    if (!confirmed) return;
    try {
      await execute(() => deleteRecord('lessons', lesson.id));
    } catch (reason) {
      setActionError(apiErrorMessage(reason));
    }
  }

  return (
    <PageScaffold
      eyebrow="Team-Bereich"
      title="Lektionen"
      description="Entwürfe, geplante und veröffentlichte Unterrichtseinheiten."
      action={<ActionButton label="Neue Lektion" icon="add" onPress={() => router.push('/lektion-neu')} />}>
      {error && <ErrorBanner message={error} onRetry={() => void refresh()} />}
      {actionError && <ErrorBanner message={actionError} />}
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
          <Pill>{filteredLessons.length} Ergebnisse</Pill>
        </View>
      </Card>

      <Card style={styles.listCard}>
        {isLoading && data.lessons.length === 0 ? (
          <DataLoading />
        ) : filteredLessons.length === 0 ? (
          <EmptyState
            icon="lessons"
            title={data.lessons.length === 0 ? 'Noch keine Lektionen' : 'Keine Treffer'}
            description={
              data.lessons.length === 0
                ? 'Lege zuerst ein Akademiejahr und eine Lernreise an, anschließend kann die erste Lektion entstehen.'
                : 'Passe Suche oder Filter an.'
            }
            actionLabel={data.lessons.length === 0 ? 'Erste Lektion anlegen' : undefined}
            onAction={data.lessons.length === 0 ? () => router.push('/lektion-neu') : undefined}
          />
        ) : (
          <View style={styles.lessonList}>
            {filteredLessons.map((lesson) => {
              const journey = data.journeys.find((entry) => entry.id === lesson.learning_journey_id);
              const session = data.liveSessions.find((entry) => entry.lesson_id === lesson.id);
              const quiz = data.quizzes.find((entry) => entry.lesson_id === lesson.id);
              const questionCount = quiz
                ? data.quizQuestions.filter((question) => question.quiz_id === quiz.id).length
                : 0;
              return (
                <View key={lesson.id} style={styles.lessonRow}>
                  <View style={styles.lessonIcon}>
                    <AppIcon name={lesson.status === 'published' ? 'check' : 'lessons'} size={22} color={Palette.forest} />
                  </View>
                  <View style={styles.lessonCopy}>
                    <View style={styles.titleLine}>
                      <AppText variant="bodyStrong">{lesson.title}</AppText>
                      <Pill tone={lesson.status === 'published' ? 'mint' : lesson.status === 'scheduled' ? 'sky' : 'sun'}>
                        {lesson.status === 'published' ? 'Veröffentlicht' : lesson.status === 'scheduled' ? 'Geplant' : lesson.status === 'archived' ? 'Archiviert' : 'Entwurf'}
                      </Pill>
                    </View>
                    <AppText variant="small" color={Palette.inkSoft}>
                      {journey?.title ?? 'Unbekannte Lernreise'}
                      {session ? ` · Live am ${formatDate(session.starts_at)}` : ' · Live-Termin offen'}
                      {quiz ? ` · ${questionCount} Quizfragen` : ' · Quiz offen'}
                    </AppText>
                    {lesson.description && <AppText color={Palette.inkSoft} numberOfLines={2}>{lesson.description}</AppText>}
                  </View>
                  <RowActions
                    extra={<IconAction icon="check" label="Quiz bearbeiten" onPress={() => editQuiz(lesson)} />}
                    onEdit={() => editLesson(lesson)}
                    onDelete={() => void removeLesson(lesson)}
                  />
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
  toolbar: { padding: Space.lg },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: Space.lg },
  searchField: { flex: 1, minWidth: 240 },
  listCard: { minHeight: 480 },
  lessonList: { gap: Space.sm },
  lessonRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Space.md, borderBottomWidth: 1, borderBottomColor: Palette.line, paddingVertical: Space.lg },
  lessonIcon: { width: 46, height: 46, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center', backgroundColor: Palette.mint },
  lessonCopy: { flex: 1, minWidth: 240, gap: 4 },
  titleLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Space.sm },
});
