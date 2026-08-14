import { PropsWithChildren, ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { AppIcon, AppIconName } from '@/components/ui/app-icon';
import { ActionButton, AppText } from '@/components/ui/primitives';
import { Layout, Palette, Radius, Space } from '@/constants/design';

export function DataLoading({ label = 'Daten werden geladen …' }: { label?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={Palette.forest} />
      <AppText color={Palette.inkSoft}>{label}</AppText>
    </View>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.errorBanner}>
      <View style={styles.errorIcon}>
        <AppIcon name="close" size={18} color="#A43F2C" />
      </View>
      <AppText color="#87402F" style={styles.errorCopy}>
        {message}
      </AppText>
      {onRetry && <ActionButton label="Erneut laden" compact variant="secondary" onPress={onRetry} />}
    </View>
  );
}

export function FormDialog({
  visible,
  title,
  description,
  children,
  saveLabel = 'Speichern',
  saving = false,
  saveDisabled = false,
  onSave,
  onClose,
  secondaryAction,
}: PropsWithChildren<{
  visible: boolean;
  title: string;
  description?: string;
  saveLabel?: string;
  saving?: boolean;
  saveDisabled?: boolean;
  onSave: () => void;
  onClose: () => void;
  secondaryAction?: ReactNode;
}>) {
  const { width } = useWindowDimensions();
  const compact = width < Layout.compactBreakpoint;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.dialog, compact && styles.dialogCompact]}>
          <View style={styles.dialogHeader}>
            <View style={styles.dialogHeading}>
              <AppText variant="heading">{title}</AppText>
              {description && <AppText color={Palette.inkSoft}>{description}</AppText>}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dialog schließen"
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
              <AppIcon name="close" size={20} color={Palette.ink} />
            </Pressable>
          </View>
          <ScrollView
            style={styles.dialogScroll}
            contentContainerStyle={styles.dialogContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
          <View style={[styles.dialogFooter, compact && styles.dialogFooterCompact]}>
            {secondaryAction}
            <View style={styles.footerSpacer} />
            <ActionButton label="Abbrechen" variant="secondary" onPress={onClose} />
            <ActionButton
              label={saving ? 'Wird gespeichert …' : saveLabel}
              icon="check"
              disabled={saving || saveDisabled}
              onPress={onSave}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function ChoiceChips<T extends string | number>({
  label,
  options,
  value,
  onChange,
  allowEmpty = false,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T | null) => void;
  allowEmpty?: boolean;
}) {
  return (
    <View style={styles.choiceGroup}>
      <AppText variant="label">{label}</AppText>
      <View style={styles.choiceList}>
        {allowEmpty && (
          <ChoiceChip label="Keine" selected={value === null} onPress={() => onChange(null)} />
        )}
        {options.map((option) => (
          <ChoiceChip
            key={String(option.value)}
            label={option.label}
            selected={option.value === value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
    </View>
  );
}

export function MultiChoiceChips<T extends string | number>({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  values: T[];
  onChange: (values: T[]) => void;
}) {
  function toggle(value: T) {
    onChange(values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value]);
  }

  return (
    <View style={styles.choiceGroup}>
      <AppText variant="label">{label}</AppText>
      <View style={styles.choiceList}>
        {options.map((option) => (
          <ChoiceChip
            key={String(option.value)}
            label={option.label}
            selected={values.includes(option.value)}
            onPress={() => toggle(option.value)}
          />
        ))}
      </View>
    </View>
  );
}

function ChoiceChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        selected && styles.choiceSelected,
        pressed && styles.pressed,
      ]}>
      {selected && <AppIcon name="check" size={15} color={Palette.white} />}
      <AppText variant="small" color={selected ? Palette.white : Palette.inkSoft}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function RowActions({
  onEdit,
  onDelete,
  extra,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  extra?: ReactNode;
}) {
  return (
    <View style={styles.rowActions}>
      {extra}
      {onEdit && <IconAction icon="edit" label="Bearbeiten" onPress={onEdit} />}
      {onDelete && <IconAction icon="delete" label="Löschen" danger onPress={onDelete} />}
    </View>
  );
}

export function IconAction({
  icon,
  label,
  danger = false,
  onPress,
}: {
  icon: AppIconName;
  label: string;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.iconAction, danger && styles.iconActionDanger, pressed && styles.pressed]}>
      <AppIcon name={icon} size={18} color={danger ? '#A43F2C' : Palette.forest} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  loading: { minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: Space.md },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.md,
    borderWidth: 1,
    borderColor: '#F1B8A8',
    borderRadius: Radius.medium,
    backgroundColor: Palette.coralSoft,
    padding: Space.md,
  },
  errorIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  errorCopy: { flex: 1 },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.overlay,
    padding: Space.lg,
  },
  dialog: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '90%',
    overflow: 'hidden',
    borderRadius: Radius.xLarge,
    backgroundColor: Palette.paper,
    shadowColor: Palette.ink,
    shadowOpacity: 0.2,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 16 },
  },
  dialogCompact: { maxHeight: '96%' },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Space.lg,
    padding: Space.xl,
    borderBottomWidth: 1,
    borderBottomColor: Palette.line,
  },
  dialogHeading: { flex: 1, gap: 4 },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF1EF',
  },
  dialogScroll: { flexGrow: 0 },
  dialogContent: { padding: Space.xl, gap: Space.lg },
  dialogFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    padding: Space.lg,
    borderTopWidth: 1,
    borderTopColor: Palette.line,
    backgroundColor: '#FBFCF9',
  },
  dialogFooterCompact: { flexWrap: 'wrap' },
  footerSpacer: { flex: 1 },
  choiceGroup: { gap: Space.sm },
  choiceList: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  choice: {
    minHeight: 38,
    paddingHorizontal: Space.md,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Palette.white,
  },
  choiceSelected: { borderColor: Palette.forest, backgroundColor: Palette.forest },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconAction: {
    width: 38,
    height: 38,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.white,
  },
  iconActionDanger: { borderColor: '#F1C4B8', backgroundColor: '#FFF8F5' },
  pressed: { opacity: 0.68 },
});
