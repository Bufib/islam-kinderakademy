import { useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";

import { AppIcon } from "@/components/ui/app-icon";
import { ErrorBanner, FormDialog } from "@/components/ui/data-ui";
import {
  ActionButton,
  AppText,
  Card,
  Field,
  PageScaffold,
  Pill,
} from "@/components/ui/primitives";
import { Layout, Palette, Radius, Space } from "@/constants/design";
import { useAcademyData } from "@/context/academy-data-context";
import { AccountRole, useAuth } from "@/context/auth-context";
import { updateRecord } from "@/lib/academy-api";
import { supabase } from "@/lib/supabase";
import { translateAuthError } from "@/utils/auth-errors";
import { apiErrorMessage } from "@/utils/format";

const roleLabels: Record<AccountRole, string> = {
  parent: "Elternkonto",
  teacher: "Lehrkraft",
  admin: "Administration & Elternkonto",
};

type DeleteAccountResponse = {
  success?: boolean;
  error?: string;
};

export default function AccountScreen() {
  const { width } = useWindowDimensions();
  const compact = width < Layout.compactBreakpoint;

  const { user, profile, signOut, isProfileLoading, refreshProfile } =
    useAuth();

  const { execute } = useAcademyData();

  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const [profileDialog, setProfileDialog] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);

  const displayName =
    profile?.displayName || user?.email?.split("@")[0] || "Mein Konto";

  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  async function handleSignOut() {
    setError(null);
    setSigningOut(true);

    const result = await signOut();

    setSigningOut(false);

    if (result.error) {
      setError(translateAuthError(result.error));
    }
  }

  function openProfileDialog() {
    setName(displayName);
    setFormError(null);
    setProfileDialog(true);
  }

  function openPasswordDialog() {
    setPassword("");
    setPasswordRepeat("");
    setFormError(null);
    setPasswordDialog(true);
  }

  function openDeleteDialog() {
    setFormError(null);
    setDeleteDialog(true);
  }

  async function saveProfile() {
    const client = supabase;

    if (!profile?.id || !name.trim() || !client) {
      setFormError(
        "Das Profil ist noch nicht vollständig geladen oder der Name fehlt.",
      );
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      await execute(async () => {
        const { error: authError } = await client.auth.updateUser({
          data: {
            display_name: name.trim(),
          },
        });

        if (authError) {
          throw authError;
        }

        await updateRecord("profiles", profile.id!, {
          display_name: name.trim(),
        });
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
      setFormError("Das neue Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }

    if (password !== passwordRepeat) {
      setFormError("Die beiden Passwörter stimmen nicht überein.");
      return;
    }

    if (!supabase) {
      setFormError("Supabase ist noch nicht konfiguriert.");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const { error: authError } = await supabase.auth.updateUser({
        password,
      });

      if (authError) {
        throw authError;
      }

      setPassword("");
      setPasswordRepeat("");
      setPasswordDialog(false);
    } catch (reason) {
      setFormError(
        translateAuthError(
          reason instanceof Error ? reason.message : String(reason),
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount() {
    if (!supabase) {
      setFormError("Supabase ist noch nicht konfiguriert.");
      return;
    }

    if (!user) {
      setFormError("Es ist kein Benutzer angemeldet.");
      return;
    }

    setDeleting(true);
    setFormError(null);

    try {
      /*
       * Wir benötigen ausschließlich den Access Token.
       *
       * Die User-ID wird NICHT an die Edge Function geschickt.
       * Die Edge Function ermittelt die User-ID selbst aus
       * dem verifizierten Token.
       */
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        throw new Error(
          "Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.",
        );
      }

      const { data, error: functionError } =
        await supabase.functions.invoke<DeleteAccountResponse>(
          "delete-account",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            body: {},
          },
        );

      if (functionError) {
        console.error("delete-account function error:", functionError);

        /*
         * Wenn die Edge Function einen eigenen Fehlertext
         * zurückliefert, versuchen wir ihn auszulesen.
         */
        let message = "Der Account konnte nicht gelöscht werden.";

        try {
          const context = (
            functionError as unknown as {
              context?: Response;
            }
          ).context;

          if (context) {
            const responseBody = (await context.clone().json()) as {
              error?: string;
            };

            if (responseBody?.error) {
              message = responseBody.error;
            }
          }
        } catch {
          // Falls der Response-Body nicht gelesen werden kann,
          // verwenden wir die allgemeine Fehlermeldung.
        }

        throw new Error(message);
      }

      if (!data?.success) {
        throw new Error(
          data?.error ?? "Der Account konnte nicht gelöscht werden.",
        );
      }

      /*
       * Der Auth-User wurde jetzt serverseitig gelöscht.
       *
       * Anschließend entfernen wir die lokale
       * Supabase-Session auf diesem Gerät.
       */
      const { error: localSignOutError } = await supabase.auth.signOut({
        scope: "local",
      });

      if (localSignOutError) {
        /*
         * Der Account ist bereits gelöscht.
         * Ein eventuelles lokales Sign-out-Problem darf deshalb
         * nicht als fehlgeschlagene Account-Löschung angezeigt werden.
         */
        console.warn(
          "Local sign out after account deletion failed:",
          localSignOutError,
        );
      }

      setDeleteDialog(false);
    } catch (reason) {
      console.error("Account deletion failed:", reason);

      setFormError(
        reason instanceof Error
          ? reason.message
          : "Der Account konnte nicht gelöscht werden.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <PageScaffold
      eyebrow="KONTO"
      title="Mein Account"
      description="Hier siehst du deine Kontodaten und verwaltest deine Anmeldung."
    >
      <View style={[styles.layout, compact && styles.column]}>
        <Card style={[styles.profileCard, compact && styles.fullWidth]}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <AppText variant="heading">{initials || "IK"}</AppText>
            </View>

            <View style={styles.profileCopy}>
              <AppText variant="heading">{displayName}</AppText>

              <AppText color={Palette.inkSoft}>
                {user?.email || "Keine E-Mail hinterlegt"}
              </AppText>
            </View>

            <Pill tone="mint">{roleLabels[profile?.role ?? "parent"]}</Pill>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailGrid}>
            <AccountDetail
              icon="profile"
              label="Anzeigename"
              value={isProfileLoading ? "Wird geladen …" : displayName}
            />

            <AccountDetail
              icon="messages"
              label="E-Mail-Adresse"
              value={user?.email || "–"}
            />

            <AccountDetail
              icon="lock"
              label="Zugang"
              value={user ? "Angemeldet" : "Nicht angemeldet"}
            />
          </View>

          <View style={[styles.profileActions, compact && styles.column]}>
            <ActionButton
              label="Profil bearbeiten"
              icon="edit"
              variant="secondary"
              onPress={openProfileDialog}
              style={compact ? styles.fullButton : undefined}
            />

            <ActionButton
              label="Passwort ändern"
              icon="lock"
              variant="secondary"
              onPress={openPasswordDialog}
              style={compact ? styles.fullButton : undefined}
            />
          </View>
        </Card>

        <Card style={[styles.securityCard, compact && styles.fullWidth]}>
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
            label={signingOut ? "Wird abgemeldet …" : "Abmelden"}
            variant="secondary"
            icon="arrow"
            disabled={signingOut || deleting}
            onPress={() => void handleSignOut()}
            style={styles.signOutButton}
          />

          <View style={styles.dangerDivider} />

          <View style={styles.dangerArea}>
            <AppText variant="bodyStrong">Account löschen</AppText>

            <AppText variant="small" color={Palette.inkSoft}>
              Löscht deinen Account dauerhaft. Diese Aktion kann nicht
              rückgängig gemacht werden.
            </AppText>

            <ActionButton
              label={deleting ? "Account wird gelöscht …" : "Account löschen"}
              variant="secondary"
              disabled={deleting || signingOut}
              onPress={openDeleteDialog}
              style={styles.deleteButton}
              lableStyle={{color: "#fff"}}
            />
          </View>
        </Card>
      </View>

      {/* Profil bearbeiten */}

      <FormDialog
        visible={profileDialog}
        title="Profil bearbeiten"
        description="Der Anzeigename wird im Konto und im Akademiebereich verwendet."
        saving={saving}
        onClose={() => {
          if (!saving) {
            setProfileDialog(false);
            setFormError(null);
          }
        }}
        onSave={() => void saveProfile()}
      >
        {formError && <ErrorBanner message={formError} />}

        <Field
          label="Anzeigename"
          value={name}
          onChangeText={setName}
          placeholder="Dein Name"
        />

        <Field
          label="E-Mail-Adresse"
          value={user?.email ?? ""}
          editable={false}
          helper="Die E-Mail-Adresse kann hier nicht geändert werden."
        />
      </FormDialog>

      {/* Passwort ändern */}

      <FormDialog
        visible={passwordDialog}
        title="Passwort ändern"
        description="Das neue Passwort gilt sofort für die nächste Anmeldung."
        saveLabel="Passwort speichern"
        saving={saving}
        onClose={() => {
          if (!saving) {
            setPasswordDialog(false);
            setFormError(null);
            setPassword("");
            setPasswordRepeat("");
          }
        }}
        onSave={() => void savePassword()}
      >
        {formError && <ErrorBanner message={formError} />}

        <Field
          label="Neues Passwort"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Mindestens 8 Zeichen"
        />

        <Field
          label="Passwort wiederholen"
          value={passwordRepeat}
          onChangeText={setPasswordRepeat}
          secureTextEntry
          placeholder="Erneut eingeben"
        />
      </FormDialog>

      {/* Account löschen */}

      <FormDialog
        visible={deleteDialog}
        title="Account löschen"
        description="Möchtest du deinen Account wirklich dauerhaft löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        saveLabel="Account endgültig löschen"
        saving={deleting}
        onClose={() => {
          if (!deleting) {
            setDeleteDialog(false);
            setFormError(null);
          }
        }}
        onSave={() => void deleteAccount()}
      >
        {formError && <ErrorBanner message={formError} />}

        <View style={styles.deleteWarning}>
          <AppText variant="bodyStrong" color="#A43F2C">
            Achtung
          </AppText>

          <AppText variant="small" color={Palette.inkSoft}>
            Dein Account wird dauerhaft gelöscht. Danach kannst du dich mit
            diesem Account nicht mehr anmelden.
          </AppText>
        </View>
      </FormDialog>
    </PageScaffold>
  );
}

function AccountDetail({
  icon,
  label,
  value,
}: {
  icon: "profile" | "messages" | "lock";
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
  layout: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Space.lg,
  },

  column: {
    flexDirection: "column",
  },

  fullWidth: {
    width: "100%",
    minWidth: 0,
    maxWidth: "100%",
    flexBasis: "auto",
  },

  fullButton: {
    width: "100%",
  },

  profileCard: {
    flex: 2,
    minWidth: 300,
  },

  securityCard: {
    flex: 1,
    minWidth: 280,
    alignItems: "flex-start",
    gap: Space.md,
  },

  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Space.lg,
  },

  avatar: {
    width: 66,
    height: 66,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.sun,
  },

  profileCopy: {
    flex: 1,
    minWidth: 170,
    gap: 3,
  },

  divider: {
    height: 1,
    backgroundColor: Palette.line,
    marginVertical: Space.xl,
  },

  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Space.md,
  },

  profileActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Space.sm,
    marginTop: Space.xl,
  },

  detail: {
    flex: 1,
    minWidth: 180,
    flexDirection: "row",
    alignItems: "center",
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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.mint,
  },

  detailCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },

  securityIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.mint,
  },

  errorBox: {
    width: "100%",
    borderRadius: Radius.small,
    padding: Space.md,
    backgroundColor: Palette.coralSoft,
  },

  signOutButton: {
    width: "100%",
    marginTop: Space.sm,
  },

  dangerDivider: {
    width: "100%",
    height: 1,
    backgroundColor: Palette.line,
    marginVertical: Space.sm,
  },

  dangerArea: {
    width: "100%",
    gap: Space.sm,
  },

  deleteButton: {
    width: "100%",
    marginTop: Space.xs,
    backgroundColor: "rgba(255, 53, 17, 1)",
  },

  deleteWarning: {
    gap: Space.sm,
    borderRadius: Radius.medium,
    padding: Space.md,
    backgroundColor: Palette.coralSoft,
  },
});
