import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { AppText, Card, EmptyState, PageScaffold, Pill, SectionHeader } from '@/components/ui/primitives';
import { Layout, Palette, Radius, Space } from '@/constants/design';

const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export default function CalendarScreen() {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const { width } = useWindowDimensions();
  const compact = width < Layout.compactBreakpoint;
  const cells = useMemo(() => createMonthCells(visibleMonth), [visibleMonth]);
  const monthTitle = visibleMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

  function changeMonth(offset: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  return (
    <PageScaffold
      eyebrow="Planung"
      title="Kalender"
      description="Live-Unterricht, Abgaben und besondere Termine werden hier gebündelt.">
      <View style={[styles.layout, compact && styles.column]}>
        <Card style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Pressable accessibilityLabel="Vorheriger Monat" onPress={() => changeMonth(-1)} style={styles.arrowButton}>
              <View style={styles.arrowLeft}><AppIcon name="arrow" size={19} color={Palette.ink} /></View>
            </Pressable>
            <AppText variant="heading" style={styles.monthTitle}>{capitalize(monthTitle)}</AppText>
            <Pressable accessibilityLabel="Nächster Monat" onPress={() => changeMonth(1)} style={styles.arrowButton}>
              <AppIcon name="arrow" size={19} color={Palette.ink} />
            </Pressable>
          </View>

          <View style={styles.weekHeader}>
            {weekDays.map((day) => (
              <View key={day} style={styles.dayCell}>
                <AppText variant="label" color={Palette.muted}>{day}</AppText>
              </View>
            ))}
          </View>
          <View style={styles.monthGrid}>
            {cells.map((cell, index) => (
              <View key={`${cell.day}-${index}`} style={[styles.dateCell, cell.outside && styles.dateCellOutside]}>
                <AppText
                  variant="small"
                  color={cell.outside ? Palette.disabled : Palette.ink}
                  style={cell.today && styles.todayText}>
                  {cell.day}
                </AppText>
                {cell.today && <View style={styles.todayDot} />}
              </View>
            ))}
          </View>
        </Card>

        <View style={styles.agendaColumn}>
          <Card tone="mint" style={styles.agendaSummary}>
            <View style={styles.agendaSummaryTop}>
              <View style={styles.agendaIcon}><AppIcon name="calendar" size={24} color={Palette.forest} /></View>
              <Pill tone="mint">0 Termine</Pill>
            </View>
            <AppText variant="heading">Monatsübersicht</AppText>
            <AppText color={Palette.inkSoft}>Aktuell sind keine Termine eingetragen.</AppText>
          </Card>
          <Card style={styles.agendaList}>
            <SectionHeader title="Anstehend" />
            <EmptyState compact icon="clock" title="Keine Termine" description="Neue Termine erscheinen hier chronologisch." />
          </Card>
        </View>
      </View>
    </PageScaffold>
  );
}

function createMonthCells(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstWeekday = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const daysInPreviousMonth = new Date(year, monthIndex, 0).getDate();
  const today = new Date();

  return Array.from({ length: 42 }, (_, index) => {
    const relativeDay = index - firstWeekday + 1;
    if (relativeDay < 1) return { day: daysInPreviousMonth + relativeDay, outside: true, today: false };
    if (relativeDay > daysInMonth) return { day: relativeDay - daysInMonth, outside: true, today: false };
    return {
      day: relativeDay,
      outside: false,
      today: today.getFullYear() === year && today.getMonth() === monthIndex && today.getDate() === relativeDay,
    };
  });
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  layout: { flexDirection: 'row', gap: Space.lg, alignItems: 'stretch' },
  column: { flexDirection: 'column' },
  calendarCard: { flex: 1.45, minWidth: 0 },
  calendarHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Space.xl,
  },
  arrowButton: {
    width: 40, height: 40, borderRadius: Radius.small, backgroundColor: '#F0F3F1',
    alignItems: 'center', justifyContent: 'center',
  },
  arrowLeft: { transform: [{ rotate: '180deg' }] },
  monthTitle: { textAlign: 'center', flex: 1 },
  weekHeader: { flexDirection: 'row', paddingBottom: Space.sm },
  dayCell: { flex: 1, alignItems: 'center' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderLeftWidth: 1, borderColor: Palette.line },
  dateCell: {
    width: '14.2857%', aspectRatio: 1.05, minHeight: 42, borderRightWidth: 1, borderBottomWidth: 1,
    borderColor: Palette.line, padding: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: Palette.paper,
  },
  dateCellOutside: { backgroundColor: '#F7F8F5' },
  todayText: {
    color: Palette.white, backgroundColor: Palette.forest, width: 28, height: 28,
    borderRadius: 14, textAlign: 'center', lineHeight: 28, overflow: 'hidden',
  },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Palette.sun, marginTop: 3 },
  agendaColumn: { flex: 0.75, minWidth: 270, gap: Space.lg },
  agendaSummary: { gap: Space.md },
  agendaSummaryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  agendaIcon: {
    width: 48, height: 48, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center', justifyContent: 'center',
  },
  agendaList: { flex: 1 },
});

