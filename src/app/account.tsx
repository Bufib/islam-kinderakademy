import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { ActionButton, AppText, Card, PageScaffold, Pill } from '@/components/ui/primitives';
import { Palette, Radius, Space } from '@/constants/design';
import { AccountRole, useAuth } from '@/context/auth-context';
import { translateAuthError } from '@/utils/auth-errors';

const roleLabels: Record<AccountRole, string> = {
  parent: 'Elternkonto',
  teacher: 'Lehrkraft',
  admin: 'Administration',
};

export default function AccountScreen() {
  const { user, profile, signOut, isProfileLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const displayName = profile?.displayName || user?.email?.split('@')[0] || 'Mein Konto';
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  async function handleSignOut() {
    setError(null);
    setSigningOut(true);
    const result = await signOut();
    setSigningOut(false);

    if (result.error) setError(translateAuthError(result.error));
  }

  return (
    <PageScaffold
      eyebrow="KONTO"
      title="Mein Account"
      description="Hier siehst du deine Kontodaten und verwaltest deine Anmeldung.">
      <View style={styles.layout}>
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <AppText variant="heading">{initials || 'IK'}</AppText>
            </View>
            <View style={styles.profileCopy}>
              <AppText variant="heading">{displayName}</AppText>
              <AppText color={Palette.inkSoft}>{user?.email || 'Keine E-Mail hinterlegt'}</AppText>
            </View>
            <Pill tone="mint">{roleLabels[profile?.role ?? 'parent']}</Pill>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailGrid}>
            <AccountDetail
              icon="profile"
              label="Anzeigename"
              value={isProfileLoading ? 'Wird geladen …' : displayName}
            />
            <AccountDetail icon="messages" label="E-Mail-Adresse" value={user?.email || '–'} />
            <AccountDetail
              icon="lock"
              label="Zugang"
              value={user ? 'Angemeldet' : 'Nicht angemeldet'}
            />
          </View>
        </Card>

        <Card style={styles.securityCard}>
          <View style={styles.securityIcon}>
            <AppIcon name="lock" size={23} color={Palette.forest} />
          </View>
          <AppText variant="heading">Sitzung</AppText>
          <AppText color={Palette.inkSoft}>
            Mit dem Abmelden wird die Supabase-Sitzung auf diesem Gerät beendet.
          </AppText>
          {error && (
            <View style={styles.errorBox}>
              <AppText variant="small" color="#A43F2C">
                {error}
              </AppText>
            </View>
          )}
          <ActionButton
            label={signingOut ? 'Wird abgemeldet …' : 'Abmelden'}
            variant="secondary"
            icon="arrow"
            disabled={signingOut}
            onPress={() => void handleSignOut()}
            style={styles.signOutButton}
          />
        </Card>
      </View>
    </PageScaffold>
  );
}

function AccountDetail({
  icon,
  label,
  value,
}: {
  icon: 'profile' | 'messages' | 'lock';
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detail}>
      <View style={styles.detailIcon}>
        <AppIcon name={icon} size={19} color={Palette.forest} />
      </View>
      <View style={styles.detailCopy}>
        <AppText variant="small" color={Palette.muted}>
          {label}
        </AppText>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layout: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.lg },
  profileCard: { flex: 2, minWidth: 300 },
  securityCard: { flex: 1, minWidth: 280, alignItems: 'flex-start', gap: Space.md },
  profileHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Space.lg },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.sun,
  },
  profileCopy: { flex: 1, minWidth: 170, gap: 3 },
  divider: { height: 1, backgroundColor: Palette.line, marginVertical: Space.xl },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.md },
  detail: {
    flex: 1,
    minWidth: 180,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: Radius.medium,
    padding: Space.md,
  },
  detailIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.mint,
  },
  detailCopy: { flex: 1, minWidth: 0, gap: 2 },
  securityIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.mint,
  },
  errorBox: {
    width: '100%',
    borderRadius: Radius.small,
    padding: Space.md,
    backgroundColor: Palette.coralSoft,
  },
  signOutButton: { width: '100%', marginTop: Space.sm },
});
