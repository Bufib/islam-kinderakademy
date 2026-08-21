import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { ChoiceChips, DataLoading, ErrorBanner, FormDialog, IconAction, RowActions } from '@/components/ui/data-ui';
import { ActionButton, AppText, Card, EmptyState, Field, PageScaffold, Pill } from '@/components/ui/primitives';
import { Palette, Radius, Space } from '@/constants/design';
import { useAcademy } from '@/context/academy-context';
import { useAcademyData } from '@/context/academy-data-context';
import { useAuth } from '@/context/auth-context';
import { createRecord, deleteRecord, updateRecord } from '@/lib/academy-api';
import { MessageAudience, MessageRow } from '@/types/database';
import { confirmAction } from '@/utils/feedback';
import { apiErrorMessage } from '@/utils/format';

type MessageFilter = 'any' | MessageAudience;
type MessageForm = { subject: string; body: string; audience: MessageAudience; recipientId: number | null; groupId: number | null; published: boolean };

export default function MessagesScreen() {
  const router = useRouter();
  const { activeRole } = useAcademy();
  const isTeam = activeRole === 'team';
  const { profile } = useAuth();
  const { data, isLoading, error: loadError, refresh, execute } = useAcademyData();
  const [filter, setFilter] = useState<MessageFilter>('any');
  const [openedAt] = useState(() => Date.now());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MessageRow | null>(null);
  const [form, setForm] = useState<MessageForm>({ subject: '', body: '', audience: 'all', recipientId: null, groupId: null, published: true });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const accessibleMessages = useMemo(() => {
    if (isTeam) return data.messages;

    const ownChildIds = new Set(
      data.children
        .filter((child) => child.parent_profile_id === profile?.id)
        .map((child) => child.id)
    );
    const ownApprovedGroupIds = new Set(
      data.groupMembers
        .filter(
          (membership) =>
            ownChildIds.has(membership.child_id) &&
            membership.membership_status === 'approved'
        )
        .map((membership) => membership.group_id)
    );
    return data.messages.filter(
      (message) =>
        Boolean(message.published_at) &&
        new Date(message.published_at!).getTime() <= openedAt &&
        (message.audience === 'all' ||
          (message.audience === 'profile' &&
            message.recipient_profile_id === profile?.id) ||
          (message.audience === 'group' &&
            Boolean(message.group_id) &&
            ownApprovedGroupIds.has(message.group_id!)))
    );
  }, [
    data.children,
    data.groupMembers,
    data.messages,
    isTeam,
    openedAt,
    profile?.id,
  ]);
  const visibleMessages = useMemo(
    () =>
      accessibleMessages.filter(
        (message) => filter === 'any' || message.audience === filter
      ),
    [accessibleMessages, filter]
  );

  function openMessage(message?: MessageRow) {
    setEditing(message ?? null);
    setForm(
      message
        ? {
            subject: message.subject,
            body: message.body,
            audience: message.audience,
            recipientId: message.recipient_profile_id,
            groupId: message.group_id,
            published: Boolean(message.published_at),
          }
        : { subject: '', body: '', audience: 'all', recipientId: null, groupId: null, published: true }
    );
    setFormError(null);
    setDialogOpen(true);
  }

  async function save() {
    if (!profile?.id || !form.subject.trim() || !form.body.trim()) {
      setFormError('Betreff und Nachricht sind erforderlich.');
      return;
    }
    if (form.audience === 'profile' && !form.recipientId) {
      setFormError('Wähle ein Empfängerprofil aus.');
      return;
    }
    if (form.audience === 'group' && !form.groupId) {
      setFormError('Wähle eine Zeitgruppe aus.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const values = {
        sender_profile_id: profile.id,
        recipient_profile_id: form.audience === 'profile' ? form.recipientId : null,
        group_id: form.audience === 'group' ? form.groupId : null,
        audience: form.audience,
        subject: form.subject.trim(),
        body: form.body.trim(),
        published_at: form.published ? editing?.published_at ?? new Date().toISOString() : null,
      };
      await execute(() =>
        editing ? updateRecord('messages', editing.id, values) : createRecord('messages', values)
      );
      setDialogOpen(false);
    } catch (reason) {
      setFormError(apiErrorMessage(reason));
    } finally {
      setSaving(false);
    }
  }

  async function remove(message: MessageRow) {
    const confirmed = await confirmAction('Mitteilung löschen?', `„${message.subject}“ wird dauerhaft gelöscht.`);
    if (confirmed) await execute(() => deleteRecord('messages', message.id));
  }

  return (
    <PageScaffold
      eyebrow={isTeam ? 'Team-Bereich' : 'Elternbereich'}
      title="Mitteilungen"
      description={isTeam ? 'Nachrichten an Familien, Profile oder Zeitgruppen veröffentlichen.' : 'Hinweise des Akademie-Teams und Erinnerungen erscheinen hier.'}
      action={isTeam ? <ActionButton label="Mitteilung verfassen" icon="add" onPress={() => openMessage()} /> : undefined}>
      {loadError && <ErrorBanner message={loadError} onRetry={() => void refresh()} />}
      <View style={styles.filterRow}>
        {([
          ['any', 'Alle'],
          ['all', 'An alle'],
          ['profile', 'Persönlich'],
          ['group', 'Zeitgruppen'],
        ] as const).map(([value, label]) => (
          <Pressable key={value} onPress={() => setFilter(value)}>
            <Pill tone={filter === value ? 'mint' : 'neutral'}>{label}</Pill>
          </Pressable>
        ))}
      </View>
      <Card style={styles.inboxCard}>
        <View style={styles.inboxHeader}>
          <View style={styles.inboxTitle}>
            <View style={styles.inboxIcon}><AppIcon name="messages" size={22} color={Palette.forest} /></View>
            <AppText variant="heading">Mitteilungen</AppText>
          </View>
          <AppText variant="small" color={Palette.muted}>{visibleMessages.length} Mitteilungen</AppText>
        </View>
        {isLoading && accessibleMessages.length === 0 ? (
          <DataLoading />
        ) : visibleMessages.length === 0 ? (
          <EmptyState icon="messages" title="Noch keine Mitteilungen" description="Neue Nachrichten und Erinnerungen werden an dieser Stelle gesammelt." />
        ) : (
          <View style={styles.messageList}>
            {visibleMessages.map((message) => {
              return (
                <View key={message.id} style={styles.messageRow}>
                  <View style={styles.messageIcon}><AppIcon name="messages" size={20} color={Palette.forest} /></View>
                  <View style={styles.messageCopy}>
                    <AppText variant="bodyStrong">{message.subject}</AppText>
                    <AppText color={Palette.inkSoft} numberOfLines={2}>{firstSentence(message.body)}</AppText>
                  </View>
                  {isTeam ? (
                    <RowActions
                      extra={<IconAction icon="arrow" label="Mitteilung öffnen" onPress={() => router.push(`/mitteilung/${message.id}`)} />}
                      onEdit={() => openMessage(message)}
                      onDelete={() => void remove(message)}
                    />
                  ) : (
                    <IconAction icon="arrow" label="Mitteilung öffnen" onPress={() => router.push(`/mitteilung/${message.id}`)} />
                  )}
                </View>
              );
            })}
          </View>
        )}
      </Card>

      <FormDialog visible={dialogOpen} title={editing ? 'Mitteilung bearbeiten' : 'Mitteilung verfassen'} saving={saving} onClose={() => setDialogOpen(false)} onSave={() => void save()}>
        {formError && <ErrorBanner message={formError} />}
        <Field label="Betreff" placeholder="Kurzer Betreff" value={form.subject} onChangeText={(subject) => setForm((current) => ({ ...current, subject }))} />
        <Field label="Nachricht" placeholder="Mitteilung schreiben" multiline value={form.body} onChangeText={(body) => setForm((current) => ({ ...current, body }))} />
        <ChoiceChips label="Empfängerkreis" value={form.audience} onChange={(audience) => audience && setForm((current) => ({ ...current, audience, recipientId: null, groupId: null }))} options={[{ value: 'all', label: 'Alle Familien' }, { value: 'profile', label: 'Ein Profil' }, { value: 'group', label: 'Eine Zeitgruppe' }]} />
        {form.audience === 'profile' && <ChoiceChips label="Profil" value={form.recipientId} onChange={(recipientId) => setForm((current) => ({ ...current, recipientId }))} options={data.profiles.filter((entry) => entry.id !== profile?.id).map((entry) => ({ value: entry.id, label: entry.display_name }))} />}
        {form.audience === 'group' && <ChoiceChips label="Zeitgruppe" value={form.groupId} onChange={(groupId) => setForm((current) => ({ ...current, groupId }))} options={data.groups.map((entry) => ({ value: entry.id, label: `${entry.name} · ${entry.schedule_label}` }))} />}
        <ChoiceChips label="Status" value={form.published ? 'published' : 'draft'} onChange={(value) => setForm((current) => ({ ...current, published: value === 'published' }))} options={[{ value: 'draft', label: 'Entwurf' }, { value: 'published', label: 'Sofort veröffentlichen' }]} />
      </FormDialog>
    </PageScaffold>
  );
}

function firstSentence(value: string) {
  const compact = value.trim().replace(/\s+/g, ' ');
  const match = compact.match(/^.*?[.!?](?:\s|$)/);
  return match?.[0].trim() || compact;
}

const styles = StyleSheet.create({
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  inboxCard: { minHeight: 500 },
  inboxHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: Space.lg, borderBottomWidth: 1, borderBottomColor: Palette.line },
  inboxTitle: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  inboxIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: Palette.mint, alignItems: 'center', justifyContent: 'center' },
  messageList: { gap: Space.sm, marginTop: Space.lg },
  messageRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: Space.md, borderBottomWidth: 1, borderBottomColor: Palette.line, paddingVertical: Space.lg },
  messageIcon: { width: 42, height: 42, borderRadius: Radius.medium, backgroundColor: Palette.skySoft, alignItems: 'center', justifyContent: 'center' },
  messageCopy: { flex: 1, flexBasis: 240, minWidth: 0, gap: Space.sm },
});
