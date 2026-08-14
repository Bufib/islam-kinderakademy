import { Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AuthField, AuthLayout, InlineNotice } from '@/components/auth/auth-layout';
import { ActionButton, AppText } from '@/components/ui/primitives';
import { Palette, Space } from '@/constants/design';
import { useAuth } from '@/context/auth-context';
import { translateAuthError } from '@/utils/auth-errors';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { requestPasswordReset, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Bitte gib deine E-Mail-Adresse ein.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await requestPasswordReset(normalizedEmail);
    setSubmitting(false);
    if (result.error) {
      setError(translateAuthError(result.error));
      return;
    }
    setSent(true);
  }

  return (
    <AuthLayout
      eyebrow="KONTO WIEDERHERSTELLEN"
      title="Passwort zurücksetzen"
      description="Du erhältst einen sicheren Supabase-Link, über den du im Account ein neues Passwort festlegen kannst."
      footer={
        <Pressable accessibilityRole="link" onPress={() => router.replace('/login' as Href)} style={({ pressed }) => pressed && styles.pressed}>
          <AppText variant="bodyStrong" color={Palette.forest}>Zurück zur Anmeldung</AppText>
        </Pressable>
      }>
      <View style={styles.form}>
        {!isConfigured && <InlineNotice tone="info">Supabase ist noch nicht konfiguriert.</InlineNotice>}
        {error && <InlineNotice>{error}</InlineNotice>}
        {sent ? (
          <>
            <InlineNotice tone="success">Wenn ein Konto für diese Adresse existiert, wurde der Link versendet. Bitte prüfe auch den Spam-Ordner.</InlineNotice>
            <ActionButton label="Zur Anmeldung" icon="arrow" onPress={() => router.replace('/login' as Href)} />
          </>
        ) : (
          <>
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
              returnKeyType="done"
              onSubmitEditing={() => void submit()}
            />
            <ActionButton
              label={submitting ? 'Wird versendet …' : 'Link anfordern'}
              icon="messages"
              disabled={submitting || !isConfigured}
              onPress={() => void submit()}
            />
          </>
        )}
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: Space.lg },
  pressed: { opacity: 0.7 },
});
