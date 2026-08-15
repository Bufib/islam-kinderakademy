import { ChangeEvent, CSSProperties } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/primitives';
import { Palette, Radius } from '@/constants/design';

type DateTimeFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minimum?: string;
};

function WebPickerField({
  label,
  value,
  onChange,
  type,
  minimum,
}: DateTimeFieldProps & { type: 'date' | 'time' }) {
  return (
    <View style={{ gap: 7 }}>
      <AppText variant="label">{label}</AppText>
      <input
        aria-label={label}
        type={type}
        value={value}
        min={minimum}
        step={type === 'time' ? 300 : undefined}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.currentTarget.value)}
        style={inputStyle}
      />
    </View>
  );
}

export function DateField(props: DateTimeFieldProps) {
  return <WebPickerField {...props} type="date" />;
}

export function TimeField(props: DateTimeFieldProps) {
  return <WebPickerField {...props} type="time" />;
}

const inputStyle: CSSProperties = {
  width: '100%',
  minWidth: 0,
  minHeight: 52,
  boxSizing: 'border-box',
  border: `1px solid ${Palette.line}`,
  borderRadius: Radius.small,
  padding: '12px 14px',
  backgroundColor: Palette.paper,
  color: Palette.ink,
  fontFamily: 'system-ui',
  fontSize: 15,
  outlineColor: Palette.forest,
};
