import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { ChoiceChips, DataLoading, ErrorBanner } from '@/components/ui/data-ui';
import { ActionButton, AppText, Card, Field, PageScaffold, Pill, SectionHeader } from '@/components/ui/primitives';
import { Palette, Radius, Space } from '@/constants/design';
import { useAcademyData } from '@/context/academy-data-context';
import { deleteRecord, saveMultipleChoiceQuiz } from '@/lib/academy-api';
import { AcademyData, LessonQuizRow, LessonRow } from '@/types/database';
import { confirmAction } from '@/utils/feedback';
import { apiErrorMessage } from '@/utils/format';

type OptionForm = {
  optionText: string;
};

type QuestionForm = {
  questionText: string;
  explanation: string;
  correctOption: number;
  options: OptionForm[];
};

function emptyQuestion(): QuestionForm {
  return {
    questionText: '',
    explanation: '',
    correctOption: 0,
    options: [{ optionText: '' }, { optionText: '' }, { optionText: '' }, { optionText: '' }],
  };
}

export default function QuizEditorScreen() {
  const params = useLocalSearchParams<{ lessonId?: string; returnTo?: string }>();
  const lessonId = Number(params.lessonId);
  const returnPath = params.returnTo === 'dashboard' ? '/dashboard' : '/lektionen';
  const { data, isLoading, error } = useAcademyData();
  const lesson = data.lessons.find((entry) => entry.id === lessonId) ?? null;
  const quiz = data.quizzes.find((entry) => entry.lesson_id === lessonId) ?? null;

  if (isLoading && !lesson) return <DataLoading label="Quiz wird geladen …" />;

  if (!Number.isFinite(lessonId) || !lesson) {
    return (
      <PageScaffold title="Quiz nicht verfügbar">
        <Card><ErrorBanner message={error ?? 'Die zugehörige Lektion wurde nicht gefunden.'} /></Card>
      </PageScaffold>
    );
  }

  return (
    <QuizEditor
      key={`${lesson.id}-${quiz?.id ?? 'new'}`}
      data={data}
      lesson={lesson}
      quiz={quiz}
      returnPath={returnPath}
    />
  );
}

function QuizEditor({
  data,
  lesson,
  quiz,
  returnPath,
}: {
  data: AcademyData;
  lesson: LessonRow;
  quiz: LessonQuizRow | null;
  returnPath: '/dashboard' | '/lektionen';
}) {
  const router = useRouter();
  const { execute } = useAcademyData();
  const existingQuestions = quiz
    ? data.quizQuestions
        .filter((question) => question.quiz_id === quiz.id)
        .sort((a, b) => a.position - b.position)
    : [];
  const initialQuestions = existingQuestions.map<QuestionForm>((question) => {
    const options = data.quizOptions
      .filter((option) => option.question_id === question.id)
      .sort((a, b) => a.position - b.position);
    const answerKey = data.quizAnswerKeys.find((key) => key.question_id === question.id);
    const correctOption = Math.max(0, options.findIndex((option) => option.id === answerKey?.correct_option_id));
    return {
      questionText: question.question_text,
      explanation: answerKey?.explanation ?? '',
      correctOption,
      options: options.map((option) => ({ optionText: option.option_text })),
    };
  });
  const [title, setTitle] = useState(quiz?.title ?? `${lesson.title} · Quiz`);
  const [description, setDescription] = useState(quiz?.description ?? '');
  const [passingPercent, setPassingPercent] = useState(String(quiz?.passing_percent ?? 70));
  const isPublished = quiz?.is_published ?? false;
  const [questions, setQuestions] = useState<QuestionForm[]>(
    initialQuestions.length > 0 ? initialQuestions : [emptyQuestion()]
  );
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function updateQuestion(index: number, changes: Partial<QuestionForm>) {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...changes } : question
      )
    );
  }

  function updateOption(questionIndex: number, optionIndex: number, optionText: string) {
    const question = questions[questionIndex];
    updateQuestion(questionIndex, {
      options: question.options.map((option, index) =>
        index === optionIndex ? { optionText } : option
      ),
    });
  }

  function addOption(questionIndex: number) {
    const question = questions[questionIndex];
    updateQuestion(questionIndex, { options: [...question.options, { optionText: '' }] });
  }

  function removeOption(questionIndex: number, optionIndex: number) {
    const question = questions[questionIndex];
    if (question.options.length <= 2) return;
    const options = question.options.filter((_, index) => index !== optionIndex);
    const correctOption =
      question.correctOption === optionIndex
        ? 0
        : question.correctOption > optionIndex
          ? question.correctOption - 1
          : question.correctOption;
    updateQuestion(questionIndex, { options, correctOption });
  }

  async function saveQuiz() {
    const percent = Number(passingPercent);
    if (!title.trim()) {
      setFormError('Ein Quiztitel ist erforderlich.');
      return;
    }
    if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
      setFormError('Die Bestehensgrenze muss zwischen 0 und 100 Prozent liegen.');
      return;
    }
    if (
      questions.length === 0 ||
      questions.some(
        (question) =>
          !question.questionText.trim() ||
          question.options.length < 2 ||
          question.options.some((option) => !option.optionText.trim()) ||
          question.correctOption < 0 ||
          question.correctOption >= question.options.length
      )
    ) {
      setFormError('Jede Frage benötigt einen Text, mindestens zwei ausgefüllte Antworten und genau eine richtige Antwort.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await execute(() =>
        saveMultipleChoiceQuiz({
          lessonId: lesson.id,
          title,
          description,
          passingPercent: percent,
          isPublished,
          questions: questions.map((question) => ({
            questionText: question.questionText,
            explanation: question.explanation,
            options: question.options.map((option, optionIndex) => ({
              optionText: option.optionText,
              isCorrect: optionIndex === question.correctOption,
            })),
          })),
        })
      );
      router.replace(returnPath);
    } catch (reason) {
      setFormError(apiErrorMessage(reason));
    } finally {
      setSaving(false);
    }
  }

  async function removeQuiz() {
    if (!quiz) return;
    const confirmed = await confirmAction(
      'Quiz löschen?',
      'Alle Fragen, Antworten und bisherigen Quizversuche dieser Lektion werden gelöscht.'
    );
    if (!confirmed) return;
    try {
      await execute(() => deleteRecord('lesson_quizzes', quiz.id));
      router.replace(returnPath);
    } catch (reason) {
      setFormError(apiErrorMessage(reason));
    }
  }

  return (
    <PageScaffold
      eyebrow="Quiz-Editor"
      title={lesson.title}
      description="Multiple-Choice-Fragen mit genau einer richtigen Antwort pro Frage."
      action={
        <View style={styles.headerActions}>
          <ActionButton label="Abbrechen" variant="secondary" onPress={() => router.back()} />
          <ActionButton
            label={saving ? 'Wird gespeichert …' : 'Quiz speichern'}
            icon="check"
            disabled={saving}
            onPress={() => void saveQuiz()}
          />
        </View>
      }>
      {formError && <ErrorBanner message={formError} />}

      <Card>
        <SectionHeader title="Quiz-Einstellungen" description="Titel und Bestehensgrenze" />
        <View style={styles.formStack}>
          <Field label="Quiztitel" value={title} onChangeText={setTitle} />
          <Field label="Beschreibung (optional)" multiline value={description} onChangeText={setDescription} />
          <Field
            label="Bestehensgrenze in Prozent"
            keyboardType="number-pad"
            value={passingPercent}
            onChangeText={setPassingPercent}
          />
          <View style={styles.releaseState}>
            <Pill tone={isPublished ? 'mint' : 'sun'}>
              {isPublished ? 'Vom Admin freigegeben' : 'Noch nicht freigegeben'}
            </Pill>
            <AppText variant="small" color={Palette.inkSoft} style={styles.releaseCopy}>
              Die Freigabe erfolgt durch einen Admin in der Lektionsübersicht, nachdem der Live-Termin als „Beendet“ markiert wurde.
            </AppText>
          </View>
          {quiz && (
            <AppText variant="small" color={Palette.muted}>
              Beim Ändern der Fragen werden frühere Quizversuche zurückgesetzt, damit Auswertungen konsistent bleiben.
            </AppText>
          )}
        </View>
      </Card>

      <SectionHeader
        title="Fragen"
        description={`${questions.length} ${questions.length === 1 ? 'Frage' : 'Fragen'}`}
        action={<ActionButton label="Frage hinzufügen" icon="add" compact onPress={() => setQuestions((current) => [...current, emptyQuestion()])} />}
      />

      <View style={styles.questionsList}>
        {questions.map((question, questionIndex) => (
          <Card key={`question-${questionIndex}`} style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <View style={styles.questionNumber}><AppText variant="bodyStrong">{questionIndex + 1}</AppText></View>
              <View style={styles.questionHeading}>
                <AppText variant="heading">Frage {questionIndex + 1}</AppText>
                <Pill tone="mint">Eine richtige Antwort</Pill>
              </View>
              {questions.length > 1 && (
                <ActionButton
                  label="Frage entfernen"
                  icon="delete"
                  compact
                  variant="quiet"
                  onPress={() => setQuestions((current) => current.filter((_, index) => index !== questionIndex))}
                />
              )}
            </View>

            <Field
              label="Frage"
              multiline
              placeholder="Frage formulieren …"
              value={question.questionText}
              onChangeText={(questionText) => updateQuestion(questionIndex, { questionText })}
            />

            <View style={styles.optionsList}>
              {question.options.map((option, optionIndex) => (
                <View key={`option-${optionIndex}`} style={styles.optionRow}>
                  <View style={[styles.optionMarker, question.correctOption === optionIndex && styles.optionMarkerCorrect]}>
                    <AppIcon name={question.correctOption === optionIndex ? 'check' : 'more'} size={17} color={question.correctOption === optionIndex ? Palette.white : Palette.muted} />
                  </View>
                  <View style={styles.optionField}>
                    <Field
                      label={`Antwort ${optionIndex + 1}`}
                      placeholder="Antwortmöglichkeit …"
                      value={option.optionText}
                      onChangeText={(value) => updateOption(questionIndex, optionIndex, value)}
                    />
                  </View>
                  {question.options.length > 2 && (
                    <ActionButton
                      label="Entfernen"
                      icon="delete"
                      compact
                      variant="quiet"
                      onPress={() => removeOption(questionIndex, optionIndex)}
                    />
                  )}
                </View>
              ))}
            </View>

            <ChoiceChips
              label="Richtige Antwort"
              value={question.correctOption}
              onChange={(value) => value !== null && updateQuestion(questionIndex, { correctOption: value })}
              options={question.options.map((_, optionIndex) => ({
                value: optionIndex,
                label: `Antwort ${optionIndex + 1}`,
              }))}
            />
            <Field
              label="Interne Erklärung zur richtigen Antwort (optional)"
              multiline
              placeholder="Warum ist diese Antwort richtig?"
              value={question.explanation}
              onChangeText={(explanation) => updateQuestion(questionIndex, { explanation })}
            />
            <ActionButton label="Antwort hinzufügen" icon="add" compact variant="secondary" onPress={() => addOption(questionIndex)} />
          </Card>
        ))}
      </View>

      <View style={styles.footerActions}>
        {quiz && <ActionButton label="Quiz löschen" icon="delete" variant="quiet" onPress={() => void removeQuiz()} />}
        <ActionButton
          label={saving ? 'Wird gespeichert …' : 'Quiz speichern'}
          icon="check"
          disabled={saving}
          onPress={() => void saveQuiz()}
        />
      </View>
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  formStack: { gap: Space.lg, marginTop: Space.xl },
  releaseState: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Space.sm },
  releaseCopy: { flex: 1, minWidth: 220 },
  questionsList: { gap: Space.lg },
  questionCard: { gap: Space.xl },
  questionHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Space.md },
  questionNumber: { width: 44, height: 44, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center', backgroundColor: Palette.sunSoft },
  questionHeading: { flex: 1, minWidth: 210, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Space.sm },
  optionsList: { gap: Space.md },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Space.md },
  optionMarker: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF1EF' },
  optionMarkerCorrect: { backgroundColor: Palette.forest },
  optionField: { flex: 1, minWidth: 180 },
  footerActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: Space.sm },
});
