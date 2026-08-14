import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import {
  ChoiceChips,
  DataLoading,
  ErrorBanner,
  FormDialog,
  RowActions,
} from '@/components/ui/data-ui';
import {
  ActionButton,
  AppText,
  Card,
  EmptyState,
  Field,
  PageScaffold,
  Pill,
  SegmentedControl,
  SectionHeader,
} from '@/components/ui/primitives';
import { Palette, Space } from '@/constants/design';
import { useAcademyData } from '@/context/academy-data-context';
import { createRecord, deleteRecord, updateRecord } from '@/lib/academy-api';
import { AcademyYearRow, AgeGroup, LearningJourneyRow } from '@/types/database';
import { apiErrorMessage, formatDate } from '@/utils/format';
import { confirmAction } from '@/utils/feedback';

type YearForm = { title: string; startsOn: string; endsOn: string; active: boolean };
type JourneyForm = {
  title: string;
  description: string;
  yearId: number | null;
  ageGroup: AgeGroup;
  published: boolean;
};

const emptyYear: YearForm = { title: '', startsOn: '', endsOn: '', active: false };

export default function CurriculumScreen() {
  const router = useRouter();
  const { data, isLoading, error: loadError, refresh, execute } = useAcademyData();
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('5-8');
  const [yearDialog, setYearDialog] = useState(false);
  const [journeyDialog, setJourneyDialog] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademyYearRow | null>(null);
  const [editingJourney, setEditingJourney] = useState<LearningJourneyRow | null>(null);
  const [yearForm, setYearForm] = useState<YearForm>(emptyYear);
  const [journeyForm, setJourneyForm] = useState<JourneyForm>({
    title: '',
    description: '',
    yearId: null,
    ageGroup: '5-8',
    published: false,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const visibleJourneys = useMemo(
    () => data.journeys.filter((journey) => journey.age_group === ageGroup),
    [ageGroup, data.journeys]
  );

  function openYear(year?: AcademyYearRow) {
    setEditingYear(year ?? null);
    setYearForm(
      year
        ? { title: year.title, startsOn: year.starts_on, endsOn: year.ends_on, active: year.is_active }
        : emptyYear
    );
    setFormError(null);
    setYearDialog(true);
  }

  function openJourney(journey?: LearningJourneyRow) {
    setEditingJourney(journey ?? null);
    setJourneyForm(
      journey
        ? {
            title: journey.title,
            description: journey.description ?? '',
            yearId: journey.academy_year_id,
            ageGroup: journey.age_group,
            published: journey.is_published,
          }
        : {
            title: '',
            description: '',
            yearId: data.academyYears.find((year) => year.is_active)?.id ?? data.academyYears[0]?.id ?? null,
            ageGroup,
            published: false,
          }
    );
    setFormError(null);
    setJourneyDialog(true);
  }

  async function saveYear() {
    if (!yearForm.title.trim() || !yearForm.startsOn || !yearForm.endsOn) {
      setFormError('Titel, Startdatum und Enddatum sind erforderlich.');
      return;
    }
    if (yearForm.endsOn < yearForm.startsOn) {
      setFormError('Das Enddatum muss nach dem Startdatum liegen.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (yearForm.active) {
        await Promise.all(
          data.academyYears
            .filter((year) => year.is_active && year.id !== editingYear?.id)
            .map((year) => updateRecord('academy_years', year.id, { is_active: false }))
        );
      }
      const values = {
        title: yearForm.title.trim(),
        starts_on: yearForm.startsOn,
        ends_on: yearForm.endsOn,
        is_active: yearForm.active,
      };
      await execute(() =>
        editingYear
          ? updateRecord('academy_years', editingYear.id, values)
          : createRecord('academy_years', values)
      );
      setYearDialog(false);
    } catch (reason) {
      setFormError(apiErrorMessage(reason));
    } finally {
      setSaving(false);
    }
  }

  async function saveJourney() {
    if (!journeyForm.title.trim() || !journeyForm.yearId) {
      setFormError('Titel und Akademiejahr sind erforderlich.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const siblingCount = data.journeys.filter(
        (journey) =>
          journey.academy_year_id === journeyForm.yearId && journey.age_group === journeyForm.ageGroup
      ).length;
      const values = {
        academy_year_id: journeyForm.yearId,
        age_group: journeyForm.ageGroup,
        title: journeyForm.title.trim(),
        description: journeyForm.description.trim() || null,
        position: editingJourney?.position ?? siblingCount,
        is_published: journeyForm.published,
      };
      await execute(() =>
        editingJourney
          ? updateRecord('learning_journeys', editingJourney.id, values)
          : createRecord('learning_journeys', values)
      );
      setJourneyDialog(false);
    } catch (reason) {
      setFormError(apiErrorMessage(reason));
    } finally {
      setSaving(false);
    }
  }

  async function removeYear(year: AcademyYearRow) {
    const confirmed = await confirmAction(
      'Akademiejahr löschen?',
      'Alle zugehörigen Lernreisen, Lektionen, Gruppen und Fortschrittsdaten werden mitgelöscht.'
    );
    if (confirmed) await execute(() => deleteRecord('academy_years', year.id));
  }

  async function removeJourney(journey: LearningJourneyRow) {
    const confirmed = await confirmAction(
      'Lernreise löschen?',
      `„${journey.title}“ und alle enthaltenen Lektionen werden dauerhaft gelöscht.`
    );
    if (confirmed) await execute(() => deleteRecord('learning_journeys', journey.id));
  }

  return (
    <PageScaffold
      eyebrow="Team-Bereich"
      title="Curriculum"
      description="Akademiejahre, Lernreisen und Lektionen werden hier hierarchisch aufgebaut."
      action={
        <View style={styles.headerActions}>
          <ActionButton label="Akademiejahr" variant="secondary" icon="add" onPress={() => openYear()} />
          <ActionButton
            label="Lernreise anlegen"
            icon="add"
            disabled={data.academyYears.length === 0}
            onPress={() => openJourney()}
          />
        </View>
      }>
      {loadError && <ErrorBanner message={loadError} onRetry={() => void refresh()} />}
      <Card style={styles.toolbarCard}>
        <View style={styles.toolbarRow}>
          <View style={styles.toolbarCopy}>
            <AppText variant="bodyStrong">Altersgruppe</AppText>
            <AppText variant="small" color={Palette.inkSoft}>Inhalte werden getrennt gepflegt.</AppText>
          </View>
          <SegmentedControl
            value={ageGroup}
            onChange={setAgeGroup}
            options={[
              { value: '5-8', label: '5–8 Jahre' },
              { value: '9-12', label: '9–12 Jahre' },
            ]}
          />
        </View>
      </Card>

      <SectionHeader title="Akademiejahre" description={`${data.academyYears.length} Zeiträume`} />
      {isLoading && data.academyYears.length === 0 ? (
        <Card><DataLoading /></Card>
      ) : data.academyYears.length === 0 ? (
        <Card>
          <EmptyState
            icon="calendar"
            title="Noch kein Akademiejahr"
            description="Lege zuerst einen Zeitraum für das Curriculum und die Unterrichtsgruppen an."
            actionLabel="Akademiejahr anlegen"
            onAction={() => openYear()}
          />
        </Card>
      ) : (
        <View style={styles.yearList}>
          {data.academyYears.map((year) => (
            <Card key={year.id} style={styles.yearCard}>
              <View style={styles.nodeIcon}><AppIcon name="calendar" size={22} color={Palette.forest} /></View>
              <View style={styles.nodeCopy}>
                <View style={styles.titleLine}>
                  <AppText variant="bodyStrong">{year.title}</AppText>
                  <Pill tone={year.is_active ? 'mint' : 'neutral'}>{year.is_active ? 'Aktiv' : 'Inaktiv'}</Pill>
                </View>
                <AppText variant="small" color={Palette.inkSoft}>
                  {formatDate(year.starts_on)} – {formatDate(year.ends_on)}
                </AppText>
              </View>
              <RowActions onEdit={() => openYear(year)} onDelete={() => void removeYear(year)} />
            </Card>
          ))}
        </View>
      )}

      <SectionHeader
        title={`Lernreisen · ${ageGroup === '5-8' ? '5–8' : '9–12'} Jahre`}
        description={`${visibleJourneys.length} Lernreisen`}
      />
      <Card style={styles.treeCard}>
        {visibleJourneys.length === 0 ? (
          <EmptyState
            compact
            icon="curriculum"
            title="Noch keine Lernreisen"
            description="Lege eine Lernreise an und ordne anschließend Lektionen zu."
            actionLabel="Lernreise anlegen"
            onAction={() => openJourney()}
          />
        ) : (
          <View style={styles.journeyList}>
            {visibleJourneys.map((journey, index) => {
              const year = data.academyYears.find((entry) => entry.id === journey.academy_year_id);
              const lessonCount = data.lessons.filter((lesson) => lesson.learning_journey_id === journey.id).length;
              return (
                <View key={journey.id} style={styles.journeyRow}>
                  <View style={styles.journeyNumber}><AppText variant="bodyStrong">{index + 1}</AppText></View>
                  <View style={styles.nodeCopy}>
                    <View style={styles.titleLine}>
                      <AppText variant="bodyStrong">{journey.title}</AppText>
                      <Pill tone={journey.is_published ? 'mint' : 'sun'}>
                        {journey.is_published ? 'Veröffentlicht' : 'Entwurf'}
                      </Pill>
                    </View>
                    <AppText variant="small" color={Palette.inkSoft}>
                      {year?.title ?? 'Ohne Zeitraum'} · {lessonCount} Lektionen
                    </AppText>
                    {journey.description && <AppText color={Palette.inkSoft}>{journey.description}</AppText>}
                  </View>
                  <RowActions onEdit={() => openJourney(journey)} onDelete={() => void removeJourney(journey)} />
                </View>
              );
            })}
          </View>
        )}
      </Card>

      <Card tone="sun" style={styles.editorHint}>
        <View style={styles.hintIcon}><AppIcon name="lessons" size={23} color="#846211" /></View>
        <View style={styles.hintCopy}>
          <AppText variant="bodyStrong">Lektionseditor</AppText>
          <AppText color={Palette.inkSoft}>Erstellt Grunddaten, fünf Lernschritte und optional einen Live-Termin.</AppText>
        </View>
        <Pressable onPress={() => router.push('/lektion-neu')} style={({ pressed }) => pressed && styles.pressed}>
          <AppText variant="bodyStrong" color={Palette.forest}>Editor öffnen</AppText>
        </Pressable>
      </Card>

      <FormDialog
        visible={yearDialog}
        title={editingYear ? 'Akademiejahr bearbeiten' : 'Akademiejahr anlegen'}
        saving={saving}
        onClose={() => setYearDialog(false)}
        onSave={() => void saveYear()}>
        {formError && <ErrorBanner message={formError} />}
        <Field label="Bezeichnung" placeholder="Akademiejahr 2026/27" value={yearForm.title} onChangeText={(title) => setYearForm((form) => ({ ...form, title }))} />
        <View style={styles.formRow}>
          <View style={styles.formHalf}><Field label="Startdatum" placeholder="2026-09-01" value={yearForm.startsOn} onChangeText={(startsOn) => setYearForm((form) => ({ ...form, startsOn }))} /></View>
          <View style={styles.formHalf}><Field label="Enddatum" placeholder="2027-07-31" value={yearForm.endsOn} onChangeText={(endsOn) => setYearForm((form) => ({ ...form, endsOn }))} /></View>
        </View>
        <ChoiceChips
          label="Status"
          value={yearForm.active ? 'active' : 'inactive'}
          onChange={(value) => setYearForm((form) => ({ ...form, active: value === 'active' }))}
          options={[{ value: 'inactive', label: 'Inaktiv' }, { value: 'active', label: 'Aktiv' }]}
        />
      </FormDialog>

      <FormDialog
        visible={journeyDialog}
        title={editingJourney ? 'Lernreise bearbeiten' : 'Lernreise anlegen'}
        saving={saving}
        onClose={() => setJourneyDialog(false)}
        onSave={() => void saveJourney()}>
        {formError && <ErrorBanner message={formError} />}
        <Field label="Titel" placeholder="Titel der Lernreise" value={journeyForm.title} onChangeText={(title) => setJourneyForm((form) => ({ ...form, title }))} />
        <Field label="Beschreibung" placeholder="Optional" multiline value={journeyForm.description} onChangeText={(description) => setJourneyForm((form) => ({ ...form, description }))} />
        <ChoiceChips
          label="Akademiejahr"
          value={journeyForm.yearId}
          onChange={(yearId) => setJourneyForm((form) => ({ ...form, yearId }))}
          options={data.academyYears.map((year) => ({ value: year.id, label: year.title }))}
        />
        <ChoiceChips
          label="Altersgruppe"
          value={journeyForm.ageGroup}
          onChange={(value) => value && setJourneyForm((form) => ({ ...form, ageGroup: value }))}
          options={[{ value: '5-8', label: '5–8 Jahre' }, { value: '9-12', label: '9–12 Jahre' }]}
        />
        <ChoiceChips
          label="Sichtbarkeit"
          value={journeyForm.published ? 'published' : 'draft'}
          onChange={(value) => setJourneyForm((form) => ({ ...form, published: value === 'published' }))}
          options={[{ value: 'draft', label: 'Entwurf' }, { value: 'published', label: 'Veröffentlicht' }]}
        />
      </FormDialog>
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  toolbarCard: { padding: Space.lg },
  toolbarRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: Space.lg },
  toolbarCopy: { gap: 2 },
  yearList: { gap: Space.sm },
  yearCard: { flexDirection: 'row', alignItems: 'center', gap: Space.md, padding: Space.lg },
  nodeIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: Palette.mint, alignItems: 'center', justifyContent: 'center' },
  nodeCopy: { flex: 1, minWidth: 180, gap: 3 },
  titleLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Space.sm },
  treeCard: { minHeight: 300 },
  journeyList: { gap: Space.sm },
  journeyRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Space.md, borderBottomWidth: 1, borderBottomColor: Palette.line, paddingVertical: Space.md },
  journeyNumber: { width: 42, height: 42, borderRadius: 15, backgroundColor: Palette.sunSoft, alignItems: 'center', justifyContent: 'center' },
  editorHint: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Space.lg },
  hintIcon: { width: 48, height: 48, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.62)', alignItems: 'center', justifyContent: 'center' },
  hintCopy: { flex: 1, minWidth: 220, gap: 3 },
  formRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.md },
  formHalf: { flex: 1, minWidth: 200 },
  pressed: { opacity: 0.65 },
});
