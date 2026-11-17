import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { chevronLeftBold, chevronRightBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { getLocaleTag } from '@/i18n/locale';
import { useTranslation } from 'react-i18next';

interface Props {
  visible: boolean;
  title: string;
  value: string;
  minDate?: string;
  onSelect: (date: string) => void;
  onClose: () => void;
}

const WEEK_DAYS = ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'] as const;

const pad = (n: number) => String(n).padStart(2, '0');
// yyyy-mm-dd in the phone's own time zone
export const toDateText = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function parseDate(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

// Themed calendar for one day. Days before minDate cannot be picked.
export default function DatePickerModal({
  visible,
  title,
  value,
  minDate,
  onSelect,
  onClose,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [picked, setPicked] = useState('');
  const [month, setMonth] = useState(() => new Date());

  useEffect(() => {
    if (!visible) return;
    setPicked(value);
    setMonth(parseDate(value) || parseDate(minDate || '') || new Date());
  }, [visible, value, minDate]);

  const cells = useMemo(() => {
    const year = month.getFullYear();
    const m = month.getMonth();
    const offset = (new Date(year, m, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const list: Array<string | null> = Array(offset).fill(null);
    for (let day = 1; day <= daysInMonth; day++)
      list.push(toDateText(new Date(year, m, day)));
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [month]);

  const shiftMonth = (delta: number) =>
    setMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));

  const monthLabel = month.toLocaleDateString(getLocaleTag(), {
    month: 'long',
    year: 'numeric',
  });
  const rows: Array<Array<string | null>> = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
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
            <Text style={[styles.monthText, { color: colors.text }]}>
              {monthLabel}
            </Text>
            <Squeeze onPress={() => shiftMonth(1)} scale={0.85}>
              <View style={[styles.navBtn, { borderColor: colors.border }]}>
                <Icon source={chevronRightBold} size={14} color={colors.text} />
              </View>
            </Squeeze>
          </View>

          <View style={styles.weekRow}>
            {WEEK_DAYS.map(d => (
              <Text
                key={d}
                style={[styles.weekDay, { color: colors.textMuted }]}
              >
                {t(`common.weekdays.${d}`)}
              </Text>
            ))}
          </View>

          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.weekRow}>
              {row.map((day, colIndex) => {
                if (!day) return <View key={colIndex} style={styles.cell} />;
                const disabled = Boolean(minDate) && day < (minDate as string);
                const selected = day === picked;
                return (
                  <Pressable
                    key={colIndex}
                    disabled={disabled}
                    onPress={() => setPicked(day)}
                    style={[
                      styles.cell,
                      selected
                        ? [
                            styles.selectedCell,
                            { backgroundColor: colors.primary },
                          ]
                        : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        {
                          color: selected
                            ? colors.onPrimary
                            : disabled
                            ? colors.textMuted
                            : colors.text,
                        },
                        disabled && styles.disabledText,
                      ]}
                    >
                      {Number(day.slice(8))}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}

          <Text style={[styles.summary, { color: colors.textMuted }]}>
            {picked ? picked : t('common.selectDay')}
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
              title={t('common.select')}
              size="md"
              fullWidth={false}
              style={styles.action}
              disabled={!picked}
              onPress={() => onSelect(picked)}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
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
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: 12,
    paddingVertical: 6,
  },
  cell: { flex: 1, height: 36, alignItems: 'center', justifyContent: 'center' },
  selectedCell: { borderRadius: 18 },
  dayText: { fontFamily: fonts.medium, fontSize: 13 },
  disabledText: { opacity: 0.4 },
  summary: {
    fontFamily: fonts.regular,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  action: { flex: 1 },
});
