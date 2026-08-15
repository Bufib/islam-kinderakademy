import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

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
  ProgressBar,
  SectionHeader,
} from '@/components/ui/primitives';
import { Layout, Palette, Radius, Space } from '@/constants/design';
import { useAcademy } from '@/context/academy-context';
import { useAcademyData } from '@/context/academy-data-context';
import { useAuth } from '@/context/auth-context';
import { createRecord, deleteRecord, ensureCurrentProfileId, updateRecord } from '@/lib/academy-api';
import { ChildRow } from '@/types/database';
import { apiErrorMessage } from '@/utils/format';
import { confirmAction } from '@/utils/feedback';

type ChildForm = {
  displayName: string;
  birthDate: string;
  ageGroupId: number | null;
};

const emptyForm: ChildForm = { displayName: '', birthDate: '', ageGroupId: null };

export default function ChildrenScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const compact = width < Layout.compactBreakpoint;
  const { profile, user, refreshProfile } = useAuth();
  const { enterChildArea } = useAcademy();
  const { data, isLoading, error: loadError, refresh, execute } = useAcademyData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ChildRow | null>(null);
  const [form, setForm] = useState<ChildForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, ageGroupId: data.ageGroups[0]?.id ?? null });
    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(child: ChildRow) {
    setEditing(child);
    setForm({
      displayName: child.display_name,
      birthDate: child.birth_date ?? '',
      ageGroupId: child.age_group_id,
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function save() {
    if (!form.displayName.trim() || !form.ageGroupId) {
      setFormError('Bitte gib einen Anzeigenamen ein und wähle eine Altersgruppe.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      let parentProfileId =
        profile?.id ?? data.profiles.find((entry) => entry.auth_user_id === user?.id)?.id ?? null;
      if (!parentProfileId) {
        parentProfileId = await ensureCurrentProfileId();
        await refreshProfile();
      }

      const values = {
        parent_profile_id: parentProfileId,
        display_name: form.displayName.trim(),
        birth_date: form.birthDate || null,
        age_group_id: form.ageGroupId,
        avatar_key: editing?.avatar_key ?? `avatar-${(data.children.length % 6) + 1}`,
      };
      await execute(() =>
        editing
          ? updateRecord('children', editing.id, values)
          : createRecord('children', values)
      );
      setDialogOpen(false);
    } catch (reason) {
      setFormError(apiErrorMessage(reason));
    } finally {
      setSaving(false);
    }
  }

  async function remove(child: ChildRow) {
    const confirmed = await confirmAction(
      'Kinderprofil löschen?',
      `Das Profil von ${child.display_name} und der zugehörige Fortschritt werden dauerhaft gelöscht.`
    );
    if (!confirmed) return;
    try {
      await execute(() => deleteRecord('children', child.id));
    } catch (reason) {
      setFormError(apiErrorMessage(reason));
    }
  }

  function openChildArea(child: ChildRow) {
    enterChildArea(child.id);
    router.push('/dashboard');
  }

  return (
    <PageScaffold
      eyebrow="Elternbereich"
      title="Meine Kinder"
      description="Kinderprofile und persönliche Lernstände werden vom Elternkonto aus verwaltet."
      action={<ActionButton label="Kind hinzufügen" icon="add" disabled={data.ageGroups.length === 0} onPress={openCreate} />}>
      {loadError && <ErrorBanner message={loadError} onRetry={() => void refresh()} />}
      {data.ageGroups.length === 0 && <ErrorBanner message="Das Akademie-Team muss zuerst eine Altersgruppe anlegen." />}
      <View style={[styles.layout, compact && styles.column]}>
        <Card style={styles.profilesCard}>
          <SectionHeader
            title="Kinderprofile"
            description={`${data.children.length} ${data.children.length === 1 ? 'Profil' : 'Profile'}`}
          />
          {isLoading && data.children.length === 0 ? (
            <DataLoading />
          ) : data.children.length === 0 ? (
            <EmptyState
              icon="children"
              title="Noch kein Profil angelegt"
              description="Lege ein Kinderprofil an, um Lernreisen, Fortschritt und Abzeichen zuzuordnen."
              actionLabel="Erstes Profil anlegen"
              onAction={openCreate}
            />
          ) : (
            <View style={styles.profileList}>
              {data.children.map((child) => {
                const ageGroup = data.ageGroups.find((entry) => entry.id === child.age_group_id);
                const progressRows = data.lessonProgress.filter((row) => row.child_id === child.id);
                const progress = progressRows.length
                  ? Math.round(
                      progressRows.reduce((sum, row) => sum + row.progress_percent, 0) /
                        progressRows.length
                    )
                  : 0;
                return (
                  <View key={child.id} style={styles.profileRow}>
                    <View style={styles.avatar}>
                      <AppText variant="heading">{child.display_name.charAt(0).toUpperCase()}</AppText>
                    </View>
                    <View style={styles.profileCopy}>
                      <View style={styles.profileTitleRow}>
                        <AppText variant="bodyStrong">{child.display_name}</AppText>
                        <Pill tone="mint">{ageGroup?.title ?? 'Unbekannte Altersgruppe'}</Pill>
                      </View>
                      <ProgressBar value={progress} />
                      <AppText variant="small" color={Palette.muted}>
                        {progress}% Gesamtfortschritt · {progressRows.filter((row) => row.status === 'completed').length} Lektionen abgeschlossen
                      </AppText>
                    </View>
                    <View style={styles.profileActions}>
                      <ActionButton
                        label="Kinderbereich"
                        icon="arrow"
                        compact
                        variant="secondary"
                        onPress={() => openChildArea(child)}
                      />
                      <RowActions onEdit={() => openEdit(child)} onDelete={() => void remove(child)} />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </Card>

        <Card tone="mint" style={styles.guideCard}>
          <View style={styles.guideIcon}>
            <AppIcon name="lock" size={24} color={Palette.forest} />
          </View>
          <AppText variant="heading">So funktioniert der Kinderbereich</AppText>
          <View style={styles.steps}>
            {[
              ['Profil anlegen', 'Anzeigename und Altersgruppe festlegen'],
              ['Gruppe zuordnen', 'Das Akademie-Team ordnet den passenden Kurs zu'],
              ['Kinderbereich öffnen', 'Lernreisen und persönlichen Fortschritt anzeigen'],
            ].map(([title, description], index) => (
              <View key={title} style={styles.step}>
                <View style={styles.stepNumber}>
                  <AppText variant="small" color={Palette.forest}>{index + 1}</AppText>
                </View>
                <View style={styles.stepCopy}>
                  <AppText variant="bodyStrong">{title}</AppText>
                  <AppText variant="small" color={Palette.inkSoft}>{description}</AppText>
                </View>
              </View>
            ))}
          </View>
        </Card>
      </View>

      <FormDialog
        visible={dialogOpen}
        title={editing ? 'Kinderprofil bearbeiten' : 'Kinderprofil anlegen'}
        description="Es werden nur die für den Lernbereich notwendigen Angaben gespeichert."
        saving={saving}
        onClose={() => setDialogOpen(false)}
        onSave={() => void save()}>
        {formError && <ErrorBanner message={formError} />}
        <Field
          label="Anzeigename"
          placeholder="Name des Kindes"
          value={form.displayName}
          onChangeText={(displayName) => setForm((current) => ({ ...current, displayName }))}
        />
        <ChoiceChips
          label="Altersgruppe"
          value={form.ageGroupId}
          onChange={(ageGroupId) => setForm((current) => ({ ...current, ageGroupId }))}
          options={data.ageGroups.map((ageGroup) => ({ value: ageGroup.id, label: ageGroup.title }))}
        />
        <Field
          label="Geburtsdatum (optional)"
          placeholder="JJJJ-MM-TT"
          value={form.birthDate}
          onChangeText={(birthDate) => setForm((current) => ({ ...current, birthDate }))}
          helper="Format: 2018-05-24"
        />
      </FormDialog>
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  layout: { flexDirection: 'row', gap: Space.lg, alignItems: 'flex-start' },
  column: { flexDirection: 'column' },
  profilesCard: { flex: 1.45, minWidth: 0 },
  guideCard: { flex: 0.75, minWidth: 280, gap: Space.lg },
  guideIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  steps: { gap: Space.lg, marginTop: Space.sm },
  step: { flexDirection: 'row', gap: Space.md },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: Palette.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCopy: { flex: 1, gap: 2 },
  profileList: { gap: Space.md, marginTop: Space.xl },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Space.md,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: Radius.medium,
    padding: Space.lg,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.sun,
  },
  profileCopy: { flex: 1, minWidth: 210, gap: Space.sm },
  profileTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Space.sm },
  profileActions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Space.sm },
});
