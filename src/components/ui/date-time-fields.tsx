import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { ActionButton, AppText } from '@/components/ui/primitives';
import { Palette, Radius, Space } from '@/constants/design';

type DateTimeFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minimum?: string;
};

function PickerField({
  label,
  value,
  onChange,
  mode,
  minimum,
}: DateTimeFieldProps & { mode: 'date' | 'time' }) {
  const [open, setOpen] = useState(false);
  const pickerValue = mode === 'date' ? parseDate(value) : parseTime(value);
  const minimumDate = mode === 'date' && minimum ? parseDate(minimum) : undefined;

  function handleChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'dismissed' || !selected) return;
    onChange(mode === 'date' ? formatDate(selected) : formatTime(selected));
  }

  return (
    <View style={styles.group}>
      <AppText variant="label">{label}</AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} auswählen`}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.field, pressed && styles.pressed]}>
        <AppIcon name={mode === 'date' ? 'calendar' : 'clock'} size={19} color={Palette.forest} />
        <AppText color={value ? Palette.ink : Palette.muted} style={styles.value}>
          {value || (mode === 'date' ? 'Datum auswählen' : 'Uhrzeit auswählen')}
        </AppText>
      </Pressable>
      {open && (
        <View style={styles.pickerWrap}>
          <DateTimePicker
            value={pickerValue}
            mode={mode}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={minimumDate}
            minuteInterval={5}
            onChange={handleChange}
          />
          {Platform.OS === 'ios' && (
            <ActionButton label="Übernehmen" compact variant="secondary" onPress={() => setOpen(false)} />
          )}
        </View>
      )}
    </View>
  );
}

export function DateField(props: DateTimeFieldProps) {
  return <PickerField {...props} mode="date" />;
}

export function TimeField(props: DateTimeFieldProps) {
  return <PickerField {...props} mode="time" />;
}

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return year && month && day ? new Date(year, month - 1, day, 12) : new Date();
}

function parseTime(value: string) {
  const date = new Date();
  const [hours, minutes] = value.split(':').map(Number);
  if (Number.isFinite(hours) && Number.isFinite(minutes)) date.setHours(hours, minutes, 0, 0);
  return date;
}

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatTime(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  group: { gap: 7 },
  field: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: Radius.small,
    paddingHorizontal: 14,
    backgroundColor: Palette.paper,
  },
  value: { flex: 1 },
  pickerWrap: { alignItems: 'stretch', gap: Space.sm },
  pressed: { opacity: 0.75 },
});
