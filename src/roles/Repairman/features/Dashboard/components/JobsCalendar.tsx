import { monthLongName, weekdayShortName } from '@/utils/dateFormat';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Icon from '@/components/Icon';
import { arrowLeftBold, arrowRightBold } from '@/assets/icons';
import { CalendarJob, CalendarJobs } from '@/roles/Repairman/api/repairmanApi';
import { formatMoney } from '@/utils/money';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { statusLabel, statusTone } from '../utils/bookingStatus';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';


const pad = (n: number) => String(n).padStart(2, '0');

interface Props {
  month: number;
  year: number;
  data: CalendarJobs | null;
  onChangeMonth: (month: number, year: number) => void;
  onOpenJob?: (bookingId: string) => void;
}

// Month calendar like the web dashboard: a dot on days that have jobs, tap a day to see its jobs.
export default function JobsCalendar({
  month,
  year,
  data,
  onChangeMonth,
  onOpenJob,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [selected, setSelected] = useState<string | null>(null);

  const today = new Date();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const dateKey = (day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;
  const markers = new Set(data?.dateMarkers || []);
  const selectedJobs: CalendarJob[] = selected
    ? data?.jobsByDate?.[selected] || []
    : [];

  const move = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setSelected(null);
    onChangeMonth(next.getMonth(), next.getFullYear());
  };

  const isThisMonth =
    today.getMonth() === month && today.getFullYear() === year;

  return (
    <View>
      <View style={styles.nav}>
        <TouchableOpacity
          onPress={() => move(-1)}
          hitSlop={8}
          style={[styles.navBtn, { backgroundColor: colors.surfaceAlt }]}
        >
          <Icon source={arrowLeftBold} size={14} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.monthText, { color: colors.text }]}>
          {monthLongName(month)} {year}
        </Text>
        <TouchableOpacity
          onPress={() => move(1)}
          hitSlop={8}
          style={[styles.navBtn, { backgroundColor: colors.surfaceAlt }]}
        >
          <Icon source={arrowRightBold} size={14} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.week}>
        {Array.from({ length: 7 }, (_, index) => weekdayShortName(index)).map(day => (
          <Text key={day} style={[styles.weekday, { color: colors.textMuted }]}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, index) => {
          if (day === null)
            return <View key={`blank-${index}`} style={styles.cell} />;
          const key = dateKey(day);
          const hasJobs = markers.has(key);
          const isToday = isThisMonth && day === today.getDate();
          const isSelected = selected === key;

          return (
            <TouchableOpacity
              key={key}
              disabled={!hasJobs}
              onPress={() => setSelected(isSelected ? null : key)}
              style={[
                styles.cell,
                styles.day,
                isToday && [styles.today, { borderColor: colors.primary }],
                isSelected && { backgroundColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  { color: isSelected ? colors.onPrimary : colors.text },
                  hasJobs && { fontFamily: fonts.bold },
                ]}
              >
                {day}
              </Text>
              {hasJobs ? (
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: isSelected
                        ? colors.onPrimary
                        : colors.primary,
                    },
                  ]}
                />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          {i18n.t('repairmanMsg.jobsThisMonth', { count: data?.totalJobs ?? 0 })}
        </Text>
        {!isThisMonth && (
          <TouchableOpacity
            onPress={() => onChangeMonth(today.getMonth(), today.getFullYear())}
            hitSlop={8}
          >
            <Text
              style={[
                styles.footerText,
                { color: colors.primary, fontFamily: fonts.bold },
              ]}
            >
              {t('repairman.today')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {selectedJobs.map(item => {
        const tone = colors[statusTone(item.booking.status)];
        const device = [item.device.brand, item.device.model]
          .filter(Boolean)
          .join(' ');
        const amount = item.booking.pricing?.totalAmount;
        return (
          <TouchableOpacity
            key={item._id}
            activeOpacity={0.8}
            disabled={!onOpenJob}
            onPress={() => onOpenJob?.(item._id)}
            style={[
              styles.job,
              {
                backgroundColor: colors.surfaceAlt,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.jobHead}>
              <Text
                numberOfLines={1}
                style={[styles.jobTitle, { color: colors.text }]}
              >
                {item.job.title}
              </Text>
              <View style={[styles.pill, { backgroundColor: tone + '22' }]}>
                <Text style={[styles.pillText, { color: tone }]}>
                  {statusLabel(item.booking.status)}
                </Text>
              </View>
            </View>
            <Text style={[styles.jobText, { color: colors.textMuted }]}>
              {item.time}
              {device ? `  •  ${device}` : ''}
            </Text>
            <Text style={[styles.jobText, { color: colors.textMuted }]}>
              {item.customer.name || 'N/A'}
              {typeof amount === 'number'
                ? `  •  ${formatMoney(
                    amount,
                    item.booking.pricing?.currency || 'TRY',
                  )}`
                : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: { fontFamily: fonts.bold, fontSize: 15 },
  week: { flexDirection: 'row', marginBottom: 6 },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, height: 40 },
  day: { alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  today: { borderWidth: 1 },
  dayText: { fontFamily: fonts.regular, fontSize: 13 },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    marginTop: 10,
    paddingTop: 10,
  },
  footerText: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 12 },
  job: { borderRadius: 12, borderWidth: 1, padding: 12, marginTop: 10, gap: 2 },
  jobHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  jobTitle: { flex: 1, fontFamily: fonts.bold, fontSize: 13 },
  jobText: { fontFamily: fonts.regular, fontSize: 12 },
  pill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  pillText: { fontFamily: fonts.bold, fontSize: 11 },
});
