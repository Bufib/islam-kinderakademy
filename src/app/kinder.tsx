import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";

import { AppIcon } from "@/components/ui/app-icon";
import {
  ChoiceChips,
  DataLoading,
  ErrorBanner,
  FormDialog,
  RowActions,
} from "@/components/ui/data-ui";
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
} from "@/components/ui/primitives";
import { Layout, Palette, Radius, Space } from "@/constants/design";
import { useAcademy } from "@/context/academy-context";
import { useAcademyData } from "@/context/academy-data-context";
import { useAuth } from "@/context/auth-context";
import {
  deleteRecord,
  ensureCurrentProfileId,
  saveChildWithTimeGroupRequest,
} from "@/lib/academy-api";
import type { ChildRow, GroupMemberRow } from "@/types/database";
import { apiErrorMessage } from "@/utils/format";
import { confirmAction } from "@/utils/feedback";

type Gender = "male" | "female";

type ChildForm = {
  displayName: string;
  birthDate: string;
  ageGroupId: number | null;
  timeGroupId: number | null;
  gender: Gender | null;
};

const emptyForm: ChildForm = {
  displayName: "",
  birthDate: "",
  ageGroupId: null,
  timeGroupId: null,
  gender: null,
};

export default function ChildrenScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const compact = width < Layout.compactBreakpoint;
  const stacked = width < Layout.contentStackBreakpoint;

  const { profile, user, refreshProfile } = useAuth();
  const { enterChildArea } = useAcademy();

  const {
    data,
    isLoading,
    error: loadError,
    refresh,
    execute,
  } = useAcademyData();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ChildRow | null>(null);
  const [form, setForm] = useState<ChildForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const activeAcademyYearIds = data.academyYears
    .filter((year) => year.is_active)
    .map((year) => year.id);
  const parentProfileId =
    profile?.id ??
    data.profiles.find((entry) => entry.auth_user_id === user?.id)?.id ??
    null;
  const ownChildren = data.children.filter(
    (child) => child.parent_profile_id === parentProfileId,
  );

  function timeGroupsForAgeGroup(ageGroupId: number | null) {
    if (!ageGroupId) return [];

    return data.groups
      .filter(
        (group) =>
          group.age_group_id === ageGroupId &&
          activeAcademyYearIds.includes(group.academy_year_id),
      )
      .sort((a, b) => a.name.localeCompare(b.name, "de"));
  }

  function currentMembership(childId: number): GroupMemberRow | undefined {
    const memberships = data.groupMembers
      .filter((member) => member.child_id === childId)
      .sort((a, b) => b.requested_at.localeCompare(a.requested_at));

    return (
      memberships.find((member) => member.membership_status === "approved") ??
      memberships.find((member) => member.membership_status === "pending") ??
      memberships[0]
    );
  }

  function openCreate() {
    setEditing(null);

    const defaultAgeGroupId =
      data.ageGroups.find(
        (ageGroup) => timeGroupsForAgeGroup(ageGroup.id).length > 0,
      )?.id ??
      data.ageGroups[0]?.id ??
      null;

    setForm({
      ...emptyForm,
      ageGroupId: defaultAgeGroupId,
      timeGroupId: timeGroupsForAgeGroup(defaultAgeGroupId)[0]?.id ?? null,
    });

    setFormError(null);
    setDialogOpen(true);
  }

  function openEdit(child: ChildRow) {
    setEditing(child);

    const membership = currentMembership(child.id);

    setForm({
      displayName: child.display_name,
      birthDate: child.birth_date ?? "",
      ageGroupId: child.age_group_id,
      timeGroupId: membership?.group_id ?? null,
      gender: child.gender ?? null,
    });

    setFormError(null);
    setDialogOpen(true);
  }

  async function save() {
    if (
      !form.displayName.trim() ||
      !form.ageGroupId ||
      !form.timeGroupId ||
      !form.gender
    ) {
      setFormError(
        "Bitte gib einen Anzeigenamen ein und wähle Altersgruppe, Zeitgruppe sowie Geschlecht.",
      );
      return;
    }

    const selectedTimeGroup = data.groups.find(
      (group) => group.id === form.timeGroupId,
    );

    if (
      !selectedTimeGroup ||
      selectedTimeGroup.age_group_id !== form.ageGroupId ||
      !activeAcademyYearIds.includes(selectedTimeGroup.academy_year_id)
    ) {
      setFormError("Bitte wähle eine verfügbare Zeitgruppe der Altersgruppe.");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      if (!parentProfileId) {
        await ensureCurrentProfileId();
        await refreshProfile();
      }

      await execute(() =>
        saveChildWithTimeGroupRequest({
          id: editing?.id,
          displayName: form.displayName,
          birthDate: form.birthDate || null,
          ageGroupId: form.ageGroupId!,
          timeGroupId: form.timeGroupId!,
          gender: form.gender!,
          avatarKey:
            editing?.avatar_key ??
            `avatar-${(ownChildren.length % 6) + 1}`,
        }),
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
      "Kinderprofil löschen?",
      `Das Profil von ${child.display_name} und der zugehörige Fortschritt werden dauerhaft gelöscht.`,
    );

    if (!confirmed) return;

    try {
      await execute(() => deleteRecord("children", child.id));
    } catch (reason) {
      setFormError(apiErrorMessage(reason));
    }
  }

  function openChildArea(child: ChildRow) {
    enterChildArea(child.id);
    router.push("/dashboard");
  }

  const selectedAgeGroup = data.ageGroups.find(
    (group) => group.id === form.ageGroupId,
  );
  const availableTimeGroups = timeGroupsForAgeGroup(form.ageGroupId);
  const selectedTimeGroup = availableTimeGroups.find(
    (group) => group.id === form.timeGroupId,
  );

  return (
    <PageScaffold
      eyebrow="Elternbereich"
      title="Meine Kinder"
      description="Kinderprofile und persönliche Lernstände werden vom Elternkonto aus verwaltet."
      action={
        <ActionButton
          label="Kind hinzufügen"
          icon="add"
          disabled={
            data.ageGroups.length === 0 ||
            !data.ageGroups.some(
              (ageGroup) => timeGroupsForAgeGroup(ageGroup.id).length > 0,
            )
          }
          onPress={openCreate}
        />
      }
    >
      {loadError && (
        <ErrorBanner message={loadError} onRetry={() => void refresh()} />
      )}

      {data.ageGroups.length === 0 && (
        <ErrorBanner message="Das Akademie-Team muss zuerst eine Altersgruppe anlegen." />
      )}

      {data.ageGroups.length > 0 &&
        !data.ageGroups.some(
          (ageGroup) => timeGroupsForAgeGroup(ageGroup.id).length > 0,
        ) && (
          <ErrorBanner message="Das Akademie-Team muss für das aktive Akademiejahr zuerst mindestens eine Zeitgruppe anlegen." />
        )}

      <View style={[styles.layout, stacked && styles.column]}>
        <Card style={[styles.profilesCard, stacked && styles.fullWidth]}>
          <SectionHeader
            title="Kinderprofile"
            description={`${ownChildren.length} ${
              ownChildren.length === 1 ? "Profil" : "Profile"
            }`}
          />

          {isLoading && ownChildren.length === 0 ? (
            <DataLoading />
          ) : ownChildren.length === 0 ? (
            <EmptyState
              icon="children"
              title="Noch kein Profil angelegt"
              description="Lege ein Kinderprofil an, um Lernreisen, Fortschritt und Abzeichen zuzuordnen."
              actionLabel="Erstes Profil anlegen"
              onAction={openCreate}
            />
          ) : (
            <View style={styles.profileList}>
              {ownChildren.map((child) => {
                const ageGroup = data.ageGroups.find(
                  (entry) => entry.id === child.age_group_id,
                );
                const membership = currentMembership(child.id);
                const timeGroup = data.groups.find(
                  (group) => group.id === membership?.group_id,
                );

                const progressRows = data.lessonProgress.filter(
                  (row) => row.child_id === child.id,
                );

                const progress = progressRows.length
                  ? Math.round(
                      progressRows.reduce(
                        (sum, row) => sum + row.progress_percent,
                        0,
                      ) / progressRows.length,
                    )
                  : 0;

                return (
                  <View
                    key={child.id}
                    style={[
                      styles.profileRow,
                      compact && styles.profileRowCompact,
                    ]}
                  >
                    <View style={styles.avatar}>
                      <AppText variant="heading">
                        {child.display_name.charAt(0).toUpperCase()}
                      </AppText>
                    </View>

                    <View
                      style={[
                        styles.profileCopy,
                        compact && styles.profileCopyCompact,
                      ]}
                    >
                      <View style={styles.profileTitleRow}>
                        <AppText variant="bodyStrong">
                          {child.display_name}
                        </AppText>

                        <Pill tone="mint">
                          {ageGroup?.title ?? "Unbekannte Altersgruppe"}
                        </Pill>

                        {child.gender && (
                          <Pill tone="mint">
                            {child.gender === "male" ? "Junge" : "Mädchen"}
                          </Pill>
                        )}

                        {membership && timeGroup && (
                          <Pill
                            tone={
                              membership.membership_status === "approved"
                                ? "mint"
                                : membership.membership_status === "pending"
                                  ? "sun"
                                  : "coral"
                            }
                          >
                            {timeGroup.name} ·{" "}
                            {membership.membership_status === "approved"
                              ? "freigeschaltet"
                              : membership.membership_status === "pending"
                                ? "angefragt"
                                : membership.membership_status === "rejected"
                                  ? "abgelehnt"
                                  : "nicht mehr aktiv"}
                          </Pill>
                        )}
                      </View>

                      <ProgressBar value={progress} />

                      <AppText variant="small" color={Palette.muted}>
                        {progress}% Gesamtfortschritt ·{" "}
                        {
                          progressRows.filter(
                            (row) => row.status === "completed",
                          ).length
                        }{" "}
                        Lektionen abgeschlossen
                      </AppText>
                    </View>

                    <View
                      style={[
                        styles.profileActions,
                        compact && styles.profileActionsCompact,
                      ]}
                    >
                      <ActionButton
                        label="Kinderbereich"
                        icon="arrow"
                        compact
                        variant="secondary"
                        onPress={() => openChildArea(child)}
                      />

                      <RowActions
                        onEdit={() => openEdit(child)}
                        onDelete={() => void remove(child)}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </Card>

        <Card
          tone="mint"
          style={[styles.guideCard, stacked && styles.fullWidth]}
        >
          <View style={styles.guideIcon}>
            <AppIcon name="lock" size={24} color={Palette.forest} />
          </View>

          <AppText variant="heading">
            So funktioniert der Kinderbereich
          </AppText>

          <View style={styles.steps}>
            {[
              [
                "Altersgruppe wählen",
                "Die passenden Lernreisen sind für das Kind sofort sichtbar",
              ],
              [
                "Zeitgruppe anfragen",
                "Wähle eine passende Unterrichtszeit aus mehreren Zeitgruppen",
              ],
              [
                "Admin-Freigabe",
                "Erst danach öffnen sich Lektionen, Quizze und Termine der Zeitgruppe",
              ],
            ].map(([title, description], index) => (
              <View key={title} style={styles.step}>
                <View style={styles.stepNumber}>
                  <AppText variant="small" color={Palette.forest}>
                    {index + 1}
                  </AppText>
                </View>

                <View style={styles.stepCopy}>
                  <AppText variant="bodyStrong">{title}</AppText>

                  <AppText variant="small" color={Palette.inkSoft}>
                    {description}
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        </Card>
      </View>

      <FormDialog
        visible={dialogOpen}
        title={editing ? "Kinderprofil bearbeiten" : "Kinderprofil anlegen"}
        description="Es werden nur die für den Lernbereich notwendigen Angaben gespeichert."
        saving={saving}
        onClose={() => setDialogOpen(false)}
        onSave={() => void save()}
      >
        {formError && <ErrorBanner message={formError} />}

        <Field
          label="Anzeigename"
          placeholder="Name des Kindes"
          value={form.displayName}
          onChangeText={(displayName) =>
            setForm((current) => ({
              ...current,
              displayName,
            }))
          }
        />

        <ChoiceChips
          label="Altersgruppe"
          value={form.ageGroupId}
          onChange={(ageGroupId) => {
            const nextTimeGroupId =
              timeGroupsForAgeGroup(ageGroupId)[0]?.id ?? null;

            setForm((current) => ({
              ...current,
              ageGroupId,
              timeGroupId: nextTimeGroupId,
            }));
          }}
          options={data.ageGroups.map((ageGroup) => ({
            value: ageGroup.id,
            label: ageGroup.title,
          }))}
        />

        {selectedAgeGroup && (
          <View style={styles.ageGroupInfo}>
            <View style={styles.ageGroupInfoHeader}>
              <View style={styles.ageGroupInfoIcon}>
                <AppIcon
                  name="calendar"
                  size={20}
                  color={Palette.forest}
                />
              </View>

              <View style={styles.ageGroupInfoTitle}>
                <AppText variant="bodyStrong">
                  {selectedAgeGroup.title}
                </AppText>

                <AppText variant="small" color={Palette.muted}>
                  Lerninhalte
                </AppText>
              </View>
            </View>

            <AppText
              variant="body"
              color={Palette.inkSoft}
              style={styles.ageGroupDateTime}
            >
              Die Lernreisen richten sich nach dieser Altersgruppe und sind sofort
              sichtbar. Ihre Lektionen öffnen sich nach der Freigabe. Alle
              Zeitgruppen dieser Altersgruppe verwenden dieselben Inhalte.
            </AppText>
          </View>
        )}

        <ChoiceChips
          label="Gewünschte Zeitgruppe"
          value={form.timeGroupId}
          onChange={(timeGroupId) =>
            setForm((current) => ({
              ...current,
              timeGroupId,
            }))
          }
          options={availableTimeGroups.map((group) => ({
            value: group.id,
            label: `${group.name} · ${group.schedule_label}`,
          }))}
        />

        {form.ageGroupId && availableTimeGroups.length === 0 && (
          <ErrorBanner message="Für diese Altersgruppe ist im aktiven Akademiejahr noch keine Zeitgruppe verfügbar." />
        )}

        {selectedTimeGroup && (
          <View style={styles.ageGroupInfo}>
            <View style={styles.ageGroupInfoHeader}>
              <View style={styles.ageGroupInfoIcon}>
                <AppIcon name="clock" size={20} color={Palette.forest} />
              </View>

              <View style={styles.ageGroupInfoTitle}>
                <AppText variant="bodyStrong">
                  {selectedTimeGroup.name}
                </AppText>
                <AppText variant="small" color={Palette.muted}>
                  {selectedTimeGroup.schedule_label}
                </AppText>
              </View>
            </View>

            <AppText variant="small" color={Palette.inkSoft}>
              Die Auswahl wird zunächst angefragt. Lektionen, Quizze, Termine und
              Zeitgruppenbereiche öffnen sich erst nach der Freigabe durch einen
              Admin.
            </AppText>
          </View>
        )}

        <ChoiceChips
          label="Geschlecht"
          value={form.gender}
          onChange={(gender) =>
            setForm((current) => ({
              ...current,
              gender: gender as Gender,
            }))
          }
          options={[
            {
              value: "male",
              label: "Junge",
            },
            {
              value: "female",
              label: "Mädchen",
            },
          ]}
        />

        <Field
          label="Geburtsdatum (optional)"
          placeholder="JJJJ-MM-TT"
          value={form.birthDate}
          onChangeText={(birthDate) =>
            setForm((current) => ({
              ...current,
              birthDate,
            }))
          }
          helper="Format: 2018-05-24"
        />
      </FormDialog>
    </PageScaffold>
  );
}

const styles = StyleSheet.create({
  layout: {
    flexDirection: "row",
    gap: Space.lg,
    alignItems: "flex-start",
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

  profilesCard: {
    flex: 1.45,
    minWidth: 0,
  },

  guideCard: {
    flex: 0.75,
    minWidth: 280,
    gap: Space.lg,
  },

  guideIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },

  steps: {
    gap: Space.lg,
    marginTop: Space.sm,
  },

  step: {
    flexDirection: "row",
    gap: Space.md,
  },

  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: Palette.paper,
    alignItems: "center",
    justifyContent: "center",
  },

  stepCopy: {
    flex: 1,
    gap: 2,
  },

  profileList: {
    gap: Space.md,
    marginTop: Space.xl,
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Space.md,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: Radius.medium,
    padding: Space.lg,
  },

  profileRowCompact: {
    alignItems: "flex-start",
    flexDirection: "column",
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Palette.sun,
  },

  profileCopy: {
    flex: 1,
    minWidth: 210,
    gap: Space.sm,
  },

  profileCopyCompact: {
    width: "100%",
    minWidth: 0,
  },

  profileTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Space.sm,
  },

  profileActions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Space.sm,
  },

  profileActionsCompact: {
    width: "100%",
  },

  ageGroupInfo: {
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: Radius.medium,
    padding: Space.lg,
    gap: Space.md,
    backgroundColor: Palette.paper,
  },

  ageGroupInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.md,
  },

  ageGroupInfoIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(143, 190, 159, 0.18)",
  },

  ageGroupInfoTitle: {
    flex: 1,
    gap: 2,
  },

  ageGroupDateTime: {
    lineHeight: 22,
  },
});
