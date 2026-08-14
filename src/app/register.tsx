import { Href, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AuthField, AuthLayout, InlineNotice } from '@/components/auth/auth-layout';
import { ActionButton, AppText } from '@/components/ui/primitives';
import { Palette, Space } from '@/constants/design';
import { useAuth } from '@/context/auth-context';
import { translateAuthError } from '@/utils/auth-errors';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, isAuthenticated, isConfigured } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard' as Href);
  }, [isAuthenticated, router]);

  async function submit() {
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = displayName.trim();

    if (!normalizedName || !normalizedEmail || !password || !confirmPassword) {
      setError('Bitte fülle alle Felder aus.');
      return;
    }
    if (!normalizedEmail.includes('@')) {
      setError('Bitte gib eine gültige E-Mail-Adresse ein.');
      return;
    }
    if (password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }

    setSubmitting(true);
    const result = await signUp(normalizedName, normalizedEmail, password);
    setSubmitting(false);

    if (result.error) {
      setError(translateAuthError(result.error));
      return;
    }

    if (result.needsEmailConfirmation) setConfirmationSent(true);
  }

  if (confirmationSent) {
    return (
      <AuthLayout
        eyebrow="FAST GESCHAFFT"
        title="E-Mail bestätigen"
        description="Wir haben dir einen Bestätigungslink geschickt. Öffne ihn, bevor du dich anmeldest."
        footer={
          <Pressable
            accessibilityRole="link"
            onPress={() => router.replace('/login' as Href)}
            style={({ pressed }) => pressed && styles.pressed}>
            <AppText variant="bodyStrong" color={Palette.forest}>
              Zur Anmeldung
            </AppText>
          </Pressable>
        }>
        <InlineNotice tone="success">
          Das Konto wurde angelegt. Prüfe bitte auch deinen Spam-Ordner.
        </InlineNotice>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="NEUES FAMILIENKONTO"
      title="Registrieren"
      description="Erstelle ein Konto, um später auf Termine und Lernbereiche zuzugreifen."
      footer={
        <View style={styles.footerRow}>
          <AppText color={Palette.inkSoft}>Schon registriert?</AppText>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push('/login' as Href)}
            style={({ pressed }) => pressed && styles.pressed}>
            <AppText variant="bodyStrong" color={Palette.forest}>
              Anmelden
            </AppText>
          </Pressable>
        </View>
      }>
      <View style={styles.form}>
        {!isConfigured && (
          <InlineNotice tone="info">
            Supabase ist noch nicht verbunden. Trage zuerst URL und Publishable Key in deiner
            `.env`-Datei ein.
          </InlineNotice>
        )}
        {error && <InlineNotice>{error}</InlineNotice>}
        <AuthField
          label="Name"
          placeholder="Dein Name"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
        />
        <AuthField
          label="E-Mail-Adresse"
          placeholder="name@beispiel.de"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
        />
        <AuthField
          label="Passwort"
          placeholder="Mindestens 8 Zeichen"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
        />
        <AuthField
          label="Passwort wiederholen"
          placeholder="Passwort erneut eingeben"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={() => void submit()}
        />
        <ActionButton
          label={submitting ? 'Konto wird erstellt …' : 'Konto erstellen'}
          icon="arrow"
          disabled={submitting || !isConfigured}
          onPress={() => void submit()}
          style={styles.submitButton}
        />
        <AppText variant="small" color={Palette.muted} style={styles.legalCopy}>
          Mit der Registrierung wird zunächst nur dein geschützter Akademie-Account angelegt.
        </AppText>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: Space.lg },
  submitButton: { width: '100%', marginTop: Space.sm },
  footerRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  legalCopy: { textAlign: 'center' },
  pressed: { opacity: 0.7 },
});
