import { StyleSheet, Text, View } from 'react-native';

import { Palette, Radius } from '@/constants/design';

type BrandMarkProps = {
  compact?: boolean;
  inverse?: boolean;
};

export function BrandMark({ compact = false, inverse = false }: BrandMarkProps) {
  return (
    <View style={styles.row}>
      <View style={[styles.mark, inverse && styles.markInverse]}>
        <View style={styles.crescent} />
        <Text style={styles.star}>✦</Text>
      </View>
      {!compact && (
        <View>
          <Text style={[styles.eyebrow, inverse && styles.textInverse]}>ISLAM</Text>
          <Text style={[styles.name, inverse && styles.textInverse]}>Kinderakademie</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  mark: {
    width: 42,
    height: 42,
    borderRadius: Radius.medium,
    backgroundColor: Palette.forest,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  markInverse: {
    backgroundColor: Palette.sun,
  },
  crescent: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 5,
    borderColor: Palette.white,
    marginLeft: -4,
  },
  star: {
    position: 'absolute',
    right: 7,
    top: 6,
    color: Palette.sun,
    fontSize: 10,
    fontWeight: '800',
  },
  eyebrow: {
    color: Palette.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2.1,
    lineHeight: 12,
  },
  name: {
    color: Palette.ink,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 21,
    letterSpacing: -0.35,
  },
  textInverse: {
    color: Palette.white,
  },
});

