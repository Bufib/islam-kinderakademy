import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { DataLoading, ErrorBanner } from '@/components/ui/data-ui';
import { ActionButton, AppText, Card, EmptyState, PageScaffold, Pill } from '@/components/ui/primitives';
import { Palette, Radius, Space } from '@/constants/design';
import { useAcademy } from '@/context/academy-context';
import { useAcademyData } from '@/context/academy-data-context';
import { useAuth } from '@/context/auth-context';
import { formatDateTime } from '@/utils/format';

export default function MessageDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const messageId = Number(params.id);
  const [openedAt] = useState(() => Date.now());
  const { activeRole } = useAcademy();
  const { profile } = useAuth();
  const { data, isLoading, error, refresh } = useAcademyData();
  const candidateMessage = data.messages.find((entry) => entry.id === messageId);
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
  const familyCanReadCandidate = Boolean(
    candidateMessage?.published_at &&
      new Date(candidateMessage.published_at).getTime() <= openedAt &&
      (candidateMessage.audience === 'all' ||
        (candidateMessage.audience === 'profile' &&
          candidateMessage.recipient_profile_id === profile?.id) ||
        (candidateMessage.audience === 'group' &&
          Boolean(candidateMessage.group_id) &&
          ownApprovedGroupIds.has(candidateMessage.group_id!)))
  );
  const message =
    activeRole === 'team' || familyCanReadCandidate
      ? candidateMessage
      : undefined;

  if (isLoading && !message) return <DataLoading label="Mitteilung wird geladen …" />;

  if (!message || !Number.isFinite(messageId)) {
    return (
      <PageScaffold
        eyebrow="Mitteilung"
        title="Mitteilung nicht verfügbar"
        action={<ActionButton label="Zurück zu den Mitteilungen" icon="arrow" variant="secondary" onPress={() => router.replace('/mitteilungen')} />}>
        <Card>
          <EmptyState
            icon="messages"
            title="Diese Mitteilung wurde nicht gefunden"
            description="Sie wurde möglicherweise gelöscht oder ist für dein Konto nicht freigegeben."
            actionLabel="Mitteilungen öffnen"
            onAction={() => router.replace('/mitteilungen')}
          />
        </Card>
      </PageScaffold>
    );
  }

  const sender = data.profiles.find((entry) => entry.id === message.sender_profile_id);
  const recipient = data.profiles.find((entry) => entry.id === message.recipient_profile_id);
  const group = data.groups.find((entry) => entry.id === message.group_id);
  const audience =
    message.audience === 'all'
      ? 'Alle Familien'
      : message.audience === 'group'
        ? group?.name ?? 'Zeitgruppe'
        : recipient?.display_name ?? 'Persönliche Mitteilung';

  return (
    <PageScaffold
      eyebrow={activeRole === 'team' ? 'Team-Mitteilung' : 'Mitteilungen'}
      title={message.subject}
      action={<ActionButton label="Zurück zu den Mitteilungen" icon="arrow" variant="secondary" onPress={() => router.back()} />}>
      {error && <ErrorBanner message={error} onRetry={() => void refresh()} />}
      <Card style={styles.messageCard}>
        <View style={styles.messageHeader}>
          <View style={styles.messageIcon}><AppIcon name="messages" size={25} color={Palette.forest} /></View>
          <View style={styles.metaCopy}>
            <AppText variant="small" color={Palette.muted}>Von {sender?.display_name ?? 'Akademie-Team'}</AppText>
            <AppText variant="small" color={Palette.muted}>
              {message.published_at ? formatDateTime(message.published_at) : 'Noch nicht veröffentlicht'}
            </AppText>
          </View>
          <Pill tone={message.published_at ? 'mint' : 'sun'}>{message.published_at ? audience : 'Entwurf'}</Pill>
        </View>
        <View style={styles.divider} />
        <AppText style={styles.body}>{message.body}</AppText>
      </Card>
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  messageCard: { minHeight: 360, gap: Space.xl },
  messageHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Space.md },
  messageIcon: { width: 50, height: 50, borderRadius: Radius.medium, backgroundColor: Palette.mint, alignItems: 'center', justifyContent: 'center' },
  metaCopy: { flex: 1, minWidth: 210, gap: 2 },
  divider: { height: 1, backgroundColor: Palette.line },
  body: { maxWidth: 780, fontSize: 17, lineHeight: 28, color: Palette.inkSoft },
});
