import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { ErrorBanner, FormDialog } from '@/components/ui/data-ui';
import { ActionButton, AppText, Card, Field, PageScaffold, Pill } from '@/components/ui/primitives';
import { Palette, Radius, Space } from '@/constants/design';
import { useAcademyData } from '@/context/academy-data-context';
import { AccountRole, useAuth } from '@/context/auth-context';
import { updateRecord } from '@/lib/academy-api';
import { supabase } from '@/lib/supabase';
import { translateAuthError } from '@/utils/auth-errors';
import { apiErrorMessage } from '@/utils/format';

const roleLabels: Record<AccountRole, string> = {
  parent: 'Elternkonto',
  teacher: 'Lehrkraft',
  admin: 'Administration',
};

export default function AccountScreen() {
  const { user, profile, signOut, isProfileLoading, refreshProfile } = useAuth();
  const { execute } = useAcademyData();
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [profileDialog, setProfileDialog] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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

  function openProfileDialog() {
    setName(displayName);
    setFormError(null);
    setProfileDialog(true);
  }

  function openPasswordDialog() {
    setPassword('');
    setPasswordRepeat('');
    setFormError(null);
    setPasswordDialog(true);
  }

  async function saveProfile() {
    const client = supabase;
    if (!profile?.id || !name.trim() || !client) {
      setFormError('Das Profil ist noch nicht vollständig geladen oder der Name fehlt.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await execute(async () => {
        const { error: authError } = await client.auth.updateUser({ data: { display_name: name.trim() } });
        if (authError) throw authError;
        await updateRecord('profiles', profile.id!, { display_name: name.trim() });
      });
      await refreshProfile();
      setProfileDialog(false);
    } catch (reason) {
      setFormError(apiErrorMessage(reason));
    } finally {
      setSaving(false);
    }
  }

  async function savePassword() {
    if (password.length < 8) {
      setFormError('Das neue Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }
    if (password !== passwordRepeat) {
      setFormError('Die beiden Passwörter stimmen nicht überein.');
      return;
    }
    if (!supabase) {
      setFormError('Supabase ist noch nicht konfiguriert.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw authError;
      setPasswordDialog(false);
    } catch (reason) {
      setFormError(translateAuthError(reason instanceof Error ? reason.message : String(reason)));
    } finally {
      setSaving(false);
    }
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
          <View style={styles.profileActions}>
            <ActionButton label="Profil bearbeiten" icon="edit" variant="secondary" onPress={openProfileDialog} />
            <ActionButton label="Passwort ändern" icon="lock" variant="secondary" onPress={openPasswordDialog} />
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

      <FormDialog
        visible={profileDialog}
        title="Profil bearbeiten"
        description="Der Anzeigename wird im Konto und im Akademiebereich verwendet."
        saving={saving}
        onClose={() => setProfileDialog(false)}
        onSave={() => void saveProfile()}>
        {formError && <ErrorBanner message={formError} />}
        <Field label="Anzeigename" value={name} onChangeText={setName} placeholder="Dein Name" />
        <Field label="E-Mail-Adresse" value={user?.email ?? ''} editable={false} helper="Die E-Mail-Adresse kann hier nicht geändert werden." />
      </FormDialog>

      <FormDialog
        visible={passwordDialog}
        title="Passwort ändern"
        description="Das neue Passwort gilt sofort für die nächste Anmeldung."
        saveLabel="Passwort speichern"
        saving={saving}
        onClose={() => setPasswordDialog(false)}
        onSave={() => void savePassword()}>
        {formError && <ErrorBanner message={formError} />}
        <Field label="Neues Passwort" value={password} onChangeText={setPassword} secureTextEntry placeholder="Mindestens 8 Zeichen" />
        <Field label="Passwort wiederholen" value={passwordRepeat} onChangeText={setPasswordRepeat} secureTextEntry placeholder="Erneut eingeben" />
      </FormDialog>
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
  profileActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm, marginTop: Space.xl },
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
