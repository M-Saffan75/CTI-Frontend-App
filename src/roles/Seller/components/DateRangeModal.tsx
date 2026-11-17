import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { chevronLeftBold, chevronRightBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { toApiDate } from '@/roles/Seller/utils/sellerUtils';
import { getLocaleTag } from '@/i18n/locale';
import { useTranslation } from 'react-i18next';

interface Props {
  visible: boolean;
  title: string;
  from: string;
  to: string;
  onApply: (from: string, to: string) => void;
  onClose: () => void;
}

const WEEK_DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function parseDate(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

// Themed calendar: tap a first day, then a last day. A single day is a valid range.
export default function DateRangeModal({ visible, title, from, to, onApply, onClose }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [month, setMonth] = useState(() => new Date());

  useEffect(() => {
    if (!visible) return;
    setStart(from);
    setEnd(to);
    setMonth(parseDate(from) || new Date());
  }, [visible, from, to]);

  const cells = useMemo(() => {
    const year = month.getFullYear();
    const m = month.getMonth();
    const offset = (new Date(year, m, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const list: Array<string | null> = Array(offset).fill(null);
    for (let day = 1; day <= daysInMonth; day++) list.push(toApiDate(new Date(year, m, day)));
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [month]);

  const shiftMonth = (delta: number) =>
    setMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));

  const pickDay = (day: string) => {
    if (!start || (start && end)) {
      setStart(day);
      setEnd('');
    } else if (day < start) {
      setStart(day);
    } else {
      setEnd(day);
    }
  };

  const rangeEnd = end || start;
  const monthLabel = month.toLocaleDateString(getLocaleTag(), { month: 'long', year: 'numeric' });
  const rows: Array<Array<string | null>> = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.center, { backgroundColor: colors.backdrop }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

          <View style={styles.monthRow}>
            <Squeeze onPress={() => shiftMonth(-1)} scale={0.85}>
              <View style={[styles.navBtn, { borderColor: colors.border }]}>
                <Icon source={chevronLeftBold} size={14} color={colors.text} />
              </View>
            </Squeeze>
            <Text style={[styles.monthText, { color: colors.text }]}>{monthLabel}</Text>
            <Squeeze onPress={() => shiftMonth(1)} scale={0.85}>
              <View style={[styles.navBtn, { borderColor: colors.border }]}>
                <Icon source={chevronRightBold} size={14} color={colors.text} />
              </View>
            </Squeeze>
          </View>

          <View style={styles.weekRow}>
            {WEEK_DAYS.map(d => (
              <Text key={d} style={[styles.weekDay, { color: colors.textMuted }]}>
                {d}
              </Text>
            ))}
          </View>

          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.weekRow}>
              {row.map((day, colIndex) => {
                if (!day) return <View key={colIndex} style={styles.cell} />;
                const selected = day === start || day === rangeEnd;
                const inRange = start && day > start && day < rangeEnd;
                return (
                  <Pressable
                    key={colIndex}
                    onPress={() => pickDay(day)}
                    style={[
                      styles.cell,
                      inRange ? { backgroundColor: colors.primary + '25' } : null,
                      selected ? [styles.selectedCell, { backgroundColor: colors.primary }] : null,
                    ]}>
                    <Text
                      style={[
                        styles.dayText,
                        { color: selected ? colors.onPrimary : colors.text },
                      ]}>
                      {Number(day.slice(8))}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}

          <Text style={[styles.summary, { color: colors.textMuted }]}>
            {start ? `${start}  to  ${rangeEnd}` : t('sellerAuto.selectAStartDayThen')}
          </Text>

          <View style={styles.actions}>
            <Button
              title={t('common.cancel')}
              variant="soft"
              size="md"
              fullWidth={false}
              style={styles.action}
              onPress={onClose}
            />
            <Button
              title={t('common.apply')}
              size="md"
              fullWidth={false}
              style={styles.action}
              disabled={!start}
              onPress={() => onApply(start, rangeEnd)}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 380, borderRadius: 20, padding: 18 },
  title: { fontFamily: fonts.bold, fontSize: 17, marginBottom: 12 },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: { fontFamily: fonts.bold, fontSize: 15 },
  weekRow: { flexDirection: 'row', marginBottom: 2 },
  weekDay: { flex: 1, textAlign: 'center', fontFamily: fonts.medium, fontSize: 12, paddingVertical: 6 },
  cell: { flex: 1, height: 36, alignItems: 'center', justifyContent: 'center' },
  selectedCell: { borderRadius: 18 },
  dayText: { fontFamily: fonts.medium, fontSize: 13 },
  summary: { fontFamily: fonts.regular, fontSize: 12, textAlign: 'center', marginTop: 10 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  action: { flex: 1 },
});
