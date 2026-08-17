import { Href, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import {
  AuthField,
  AuthLayout,
  InlineNotice,
} from "@/components/auth/auth-layout";
import { ActionButton, AppText } from "@/components/ui/primitives";
import { Palette, Radius, Space } from "@/constants/design";
import { useAuth } from "@/context/auth-context";
import { translateAuthError } from "@/utils/auth-errors";

type PaymentMethod = "paypal" | "bank_transfer";

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, isAuthenticated, isConfigured } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [paymentAccepted, setPaymentAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(
    null,
  );

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard" as Href);
    }
  }, [isAuthenticated, router]);

  async function submit() {
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = displayName.trim();

    if (!normalizedName || !normalizedEmail || !password || !confirmPassword) {
      setError("Bitte fülle alle Felder aus.");
      return;
    }

    if (!normalizedEmail.includes("@")) {
      setError("Bitte gib eine gültige E-Mail-Adresse ein.");
      return;
    }

    if (password.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    if (!paymentAccepted) {
      setError(
        "Bitte bestätige, dass du mit dem monatlichen Beitrag von 14,99 € einverstanden bist.",
      );
      return;
    }

    if (!paymentMethod) {
      setError("Bitte wähle eine Zahlungsart aus.");
      return;
    }

    setSubmitting(true);

    const result = await signUp(normalizedName, normalizedEmail, password, {
      paymentMethod,
      paymentAccepted,
    });

    setSubmitting(false);

    if (result.error) {
      setError(translateAuthError(result.error));
      return;
    }

    if (result.needsEmailConfirmation) {
      setConfirmationSent(true);
    }
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
            onPress={() => router.replace("/login" as Href)}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <AppText variant="bodyStrong" color={Palette.forest}>
              Zur Anmeldung
            </AppText>
          </Pressable>
        }
      >
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
            onPress={() => router.push("/login" as Href)}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <AppText variant="bodyStrong" color={Palette.forest}>
              Anmelden
            </AppText>
          </Pressable>
        </View>
      }
    >
      <View style={styles.form}>
        {!isConfigured && (
          <InlineNotice tone="info">
            Supabase ist noch nicht verbunden. Trage zuerst URL und Publishable
            Key in deiner `.env`-Datei ein.
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
        />

        {/* Monatsbeitrag */}
        <View style={styles.paymentSection}>
          <View style={styles.paymentHeader}>
            <AppText variant="bodyStrong">Monatsbeitrag</AppText>

            <AppText variant="heading" color={Palette.forest}>
              14,99 €
            </AppText>
          </View>

          <AppText variant="small" color={Palette.inkSoft}>
            Der Beitrag beträgt 14,99 € pro Monat.
          </AppText>

          {/* Zahlungsart */}
          <View style={styles.paymentMethods}>
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{
                selected: paymentMethod === "paypal",
              }}
              onPress={() => setPaymentMethod("paypal")}
              style={({ pressed }) => [
                styles.paymentOption,
                paymentMethod === "paypal" && styles.paymentOptionSelected,
                pressed && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.radioOuter,
                  paymentMethod === "paypal" && styles.radioOuterSelected,
                ]}
              >
                {paymentMethod === "paypal" && (
                  <View style={styles.radioInner} />
                )}
              </View>

              <View style={styles.paymentOptionText}>
                <AppText variant="bodyStrong">PayPal</AppText>
                <AppText variant="small" color={Palette.muted}>
                  Monatliche Zahlung über PayPal
                </AppText>
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="radio"
              accessibilityState={{
                selected: paymentMethod === "bank_transfer",
              }}
              onPress={() => setPaymentMethod("bank_transfer")}
              style={({ pressed }) => [
                styles.paymentOption,
                paymentMethod === "bank_transfer" &&
                  styles.paymentOptionSelected,
                pressed && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.radioOuter,
                  paymentMethod === "bank_transfer" &&
                    styles.radioOuterSelected,
                ]}
              >
                {paymentMethod === "bank_transfer" && (
                  <View style={styles.radioInner} />
                )}
              </View>

              <View style={styles.paymentOptionText}>
                <AppText variant="bodyStrong">Banküberweisung</AppText>
                <AppText variant="small" color={Palette.muted}>
                  Monatliche Zahlung per Banküberweisung
                </AppText>
              </View>
            </Pressable>
          </View>

          {/* Zustimmung */}
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: paymentAccepted }}
            onPress={() => setPaymentAccepted((current) => !current)}
            style={({ pressed }) => [
              styles.checkboxRow,
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.checkbox,
                paymentAccepted && styles.checkboxChecked,
              ]}
            >
              {paymentAccepted && (
                <AppText variant="bodyStrong" color={Palette.paper}>
                  ✓
                </AppText>
              )}
            </View>

            <View style={styles.checkboxText}>
              <AppText color={Palette.inkSoft}>
                Ich bin mit einem monatlichen Beitrag von{" "}
                <AppText variant="bodyStrong">14,99 €</AppText> einverstanden
                und werde diesen monatlich über die gewählte Zahlungsart
                entrichten.
              </AppText>
            </View>
          </Pressable>
        </View>

        <ActionButton
          label={submitting ? "Konto wird erstellt …" : "Konto erstellen"}
          icon="arrow"
          disabled={
            submitting || !isConfigured || !paymentAccepted || !paymentMethod
          }
          onPress={() => void submit()}
          style={styles.submitButton}
        />

        <AppText variant="small" color={Palette.muted} style={styles.legalCopy}>
          Mit der Registrierung wird dein geschützter Akademie-Account angelegt.
        </AppText>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Space.lg,
  },

  submitButton: {
    width: "100%",
    marginTop: Space.sm,
  },

  footerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
  },

  legalCopy: {
    textAlign: "center",
  },

  pressed: {
    opacity: 0.7,
  },

  paymentSection: {
    gap: Space.md,
    padding: Space.lg,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: Radius.medium,
  },

  paymentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Space.md,
  },

  paymentMethods: {
    gap: Space.sm,
    marginTop: Space.sm,
  },

  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.md,
    padding: Space.md,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: Radius.medium,
  },

  paymentOptionSelected: {
    borderColor: Palette.forest,
  },

  paymentOptionText: {
    flex: 1,
    gap: 2,
  },

  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Palette.muted,
    alignItems: "center",
    justifyContent: "center",
  },

  radioOuterSelected: {
    borderColor: Palette.forest,
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Palette.forest,
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Space.md,
    marginTop: Space.sm,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Palette.muted,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },

  checkboxChecked: {
    backgroundColor: Palette.forest,
    borderColor: Palette.forest,
  },

  checkboxText: {
    flex: 1,
  },
});
