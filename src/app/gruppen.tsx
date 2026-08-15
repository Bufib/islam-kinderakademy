import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import {
  ChoiceChips,
  DataLoading,
  ErrorBanner,
  FormDialog,
  MultiChoiceChips,
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
  StatCard,
} from '@/components/ui/primitives';
import { Palette, Radius, Space } from '@/constants/design';
import { useAcademyData } from '@/context/academy-data-context';
import { createRecord, deleteRecord, replaceGroupMembers, updateRecord } from '@/lib/academy-api';
import { GroupRow } from '@/types/database';
import { confirmAction } from '@/utils/feedback';
import { apiErrorMessage } from '@/utils/format';

type GroupForm = {
  name: string;
  yearId: number | null;
  ageGroupId: number | null;
  teacherProfileId: number | null;
  childIds: number[];
};

export default function GroupsScreen() {
  const { data, isLoading, error: loadError, refresh, execute } = useAcademyData();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GroupRow | null>(null);
  const [form, setForm] = useState<GroupForm>({ name: '', yearId: null, ageGroupId: null, teacherProfileId: null, childIds: [] });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const teacherProfiles = useMemo(() => {
    const ids = new Set(
      data.userRoles
        .filter((role) => role.role === 'teacher' || role.role === 'admin')
        .map((role) => role.profile_id)
    );
    return data.profiles.filter((profile) => ids.has(profile.id));
  }, [data.profiles, data.userRoles]);

  function openGroup(group?: GroupRow) {
    setEditing(group ?? null);
    setForm(
      group
        ? {
            name: group.name,
            yearId: group.academy_year_id,
            ageGroupId: group.age_group_id,
            teacherProfileId: group.teacher_profile_id,
            childIds: data.groupMembers.filter((member) => member.group_id === group.id).map((member) => member.child_id),
          }
        : {
            name: '',
            yearId: data.academyYears.find((year) => year.is_active)?.id ?? data.academyYears[0]?.id ?? null,
            ageGroupId: data.ageGroups[0]?.id ?? null,
            teacherProfileId: null,
            childIds: [],
          }
    );
    setFormError(null);
    setDialogOpen(true);
  }

  async function save() {
    if (!form.name.trim() || !form.yearId || !form.ageGroupId) {
      setFormError('Name, Akademiejahr und Altersgruppe sind erforderlich.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await execute(async () => {
        const values = {
          name: form.name.trim(),
          academy_year_id: form.yearId!,
          age_group_id: form.ageGroupId!,
          teacher_profile_id: form.teacherProfileId,
        };
        const group = editing
          ? await updateRecord('groups', editing.id, values)
          : await createRecord('groups', values);
        await replaceGroupMembers(group.id, form.childIds);
        return group;
      });
      setDialogOpen(false);
    } catch (reason) {
      setFormError(apiErrorMessage(reason));
    } finally {
      setSaving(false);
    }
  }

  async function remove(group: GroupRow) {
    const confirmed = await confirmAction(
      'Gruppe löschen?',
      `Die Gruppe „${group.name}“ und alle Zuordnungen werden gelöscht. Kinderprofile bleiben erhalten.`
    );
    if (confirmed) await execute(() => deleteRecord('groups', group.id));
  }

  const scheduledSessions = data.liveSessions.filter((session) => session.status === 'scheduled').length;

  return (
    <PageScaffold
      eyebrow="Team-Bereich"
      title="Gruppen"
      description="Kinder, Lehrkräfte und Unterrichtstermine werden hier zugeordnet."
      action={<ActionButton label="Gruppe anlegen" icon="add" disabled={data.academyYears.length === 0 || data.ageGroups.length === 0} onPress={() => openGroup()} />}>
      {loadError && <ErrorBanner message={loadError} onRetry={() => void refresh()} />}
      {data.academyYears.length === 0 && <ErrorBanner message="Lege im Curriculum zuerst ein Akademiejahr an." />}
      {data.ageGroups.length === 0 && <ErrorBanner message="Lege im Curriculum zuerst eine Altersgruppe an." />}
      <View style={styles.statsGrid}>
        <StatCard icon="groups" value={String(data.groups.length)} label="Gruppen" tone="mint" />
        <StatCard icon="children" value={String(new Set(data.groupMembers.map((member) => member.child_id)).size)} label="Zugeordnete Kinder" tone="sun" />
        <StatCard icon="calendar" value={String(scheduledSessions)} label="Geplante Termine" tone="sky" />
      </View>
      <Card style={styles.listCard}>
        {isLoading && data.groups.length === 0 ? (
          <DataLoading />
        ) : data.groups.length === 0 ? (
          <EmptyState
            icon="groups"
            title="Noch keine Gruppen"
            description="Lege eine Gruppe an und ordne Altersstufe, Kinder und Lehrkraft zu."
            actionLabel="Erste Gruppe anlegen"
            onAction={() => openGroup()}
          />
        ) : (
          <View style={styles.groupList}>
            {data.groups.map((group) => {
              const year = data.academyYears.find((entry) => entry.id === group.academy_year_id);
              const teacher = data.profiles.find((entry) => entry.id === group.teacher_profile_id);
              const members = data.groupMembers.filter((member) => member.group_id === group.id);
              const sessions = data.liveSessions.filter((session) => session.group_id === group.id);
              const ageGroup = data.ageGroups.find((entry) => entry.id === group.age_group_id);
              return (
                <View key={group.id} style={styles.groupRow}>
                  <View style={styles.groupIcon}><AppIcon name="groups" size={23} color={Palette.forest} /></View>
                  <View style={styles.groupCopy}>
                    <View style={styles.titleLine}>
                      <AppText variant="bodyStrong">{group.name}</AppText>
                      <Pill tone="mint">{ageGroup?.title ?? 'Unbekannte Altersgruppe'}</Pill>
                    </View>
                    <AppText variant="small" color={Palette.inkSoft}>
                      {year?.title ?? 'Unbekanntes Jahr'} · {members.length} Kinder · {sessions.length} Termine
                    </AppText>
                    <AppText variant="small" color={Palette.muted}>
                      Lehrkraft: {teacher?.display_name ?? 'Noch nicht zugeordnet'}
                    </AppText>
                  </View>
                  <RowActions onEdit={() => openGroup(group)} onDelete={() => void remove(group)} />
                </View>
              );
            })}
          </View>
        )}
      </Card>

      <FormDialog
        visible={dialogOpen}
        title={editing ? 'Gruppe bearbeiten' : 'Gruppe anlegen'}
        saving={saving}
        onClose={() => setDialogOpen(false)}
        onSave={() => void save()}>
        {formError && <ErrorBanner message={formError} />}
        <Field label="Gruppenname" placeholder="Gruppe Mond" value={form.name} onChangeText={(name) => setForm((current) => ({ ...current, name }))} />
        <ChoiceChips
          label="Akademiejahr"
          value={form.yearId}
          onChange={(yearId) => setForm((current) => ({ ...current, yearId }))}
          options={data.academyYears.map((year) => ({ value: year.id, label: year.title }))}
        />
        <ChoiceChips
          label="Altersgruppe"
          value={form.ageGroupId}
          onChange={(ageGroupId) => setForm((current) => ({
            ...current,
            ageGroupId,
            childIds: current.childIds.filter(
              (id) => data.children.find((child) => child.id === id)?.age_group_id === ageGroupId
            ),
          }))}
          options={data.ageGroups.map((ageGroup) => ({ value: ageGroup.id, label: ageGroup.title }))}
        />
        <ChoiceChips
          label="Lehrkraft"
          value={form.teacherProfileId}
          allowEmpty
          onChange={(teacherProfileId) => setForm((current) => ({ ...current, teacherProfileId }))}
          options={teacherProfiles.map((profile) => ({ value: profile.id, label: profile.display_name }))}
        />
        <MultiChoiceChips
          label="Kinder"
          values={form.childIds}
          onChange={(childIds) => setForm((current) => ({ ...current, childIds }))}
          options={data.children.filter((child) => child.age_group_id === form.ageGroupId).map((child) => ({ value: child.id, label: child.display_name }))}
        />
        {data.children.filter((child) => child.age_group_id === form.ageGroupId).length === 0 && (
          <AppText color={Palette.muted}>Für diese Altersgruppe sind noch keine Kinderprofile vorhanden.</AppText>
        )}
      </FormDialog>
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: 'row', gap: Space.lg, flexWrap: 'wrap' },
  listCard: { minHeight: 470 },
  groupList: { gap: Space.sm },
  groupRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Space.md, borderBottomWidth: 1, borderBottomColor: Palette.line, paddingVertical: Space.lg },
  groupIcon: { width: 48, height: 48, borderRadius: Radius.medium, backgroundColor: Palette.mint, alignItems: 'center', justifyContent: 'center' },
  groupCopy: { flex: 1, minWidth: 240, gap: 4 },
  titleLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Space.sm },
});
