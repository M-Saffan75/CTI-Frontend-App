import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import { FadeUp } from '@/animations';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import EarningsLineChart from '../components/EarningsLineChart';
import JobDonutChart from '../components/JobDonutChart';
import { BOOKINGS, EARNINGS_CHART, JOB_DISTRIBUTION, JOB_DISTRIBUTION_TOTAL, STATS } from '../data/dashboard';

const STATUS_COLORS = {
  Confirmed: 'success',
  Pending: 'primary',
};

function StatCard({ label, value }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
      <View style={styles.statRow}>
        <Text style={[styles.statValue, { color: colors.primary }]}>{value}</Text>
        <View style={[styles.statBadge, { backgroundColor: colors.surfaceAlt }]}>
          <Text style={[styles.statBadgeText, { color: colors.primary }]}>$</Text>
        </View>
      </View>
    </View>
  );
}

function BookingCard({ booking }) {
  const { colors } = useTheme();
  const statusColor = colors[STATUS_COLORS[booking.status] ?? 'textMuted'];

  return (
    <View style={[styles.bookingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.bookingHead}>
        <Text style={[styles.bookingId, { color: colors.textMuted }]}>{booking.id}</Text>
        <View style={[styles.statusPill, { backgroundColor: statusColor + '22' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{booking.status}</Text>
        </View>
      </View>

      <Text style={[styles.bookingLabel, { color: colors.text }]}>Customer</Text>
      <Text style={[styles.bookingText, { color: colors.textMuted }]}>{booking.phone}</Text>

      <View style={styles.bookingMeta}>
        <View>
          <Text style={[styles.bookingLabel, { color: colors.text }]}>Device</Text>
          <Text style={[styles.bookingText, { color: colors.textMuted }]}>{booking.device}</Text>
        </View>
        <View>
          <Text style={[styles.bookingLabel, { color: colors.text }]}>Schedule</Text>
          <Text style={[styles.bookingText, { color: colors.textMuted }]}>{booking.schedule}</Text>
        </View>
      </View>

      <Button title="View" variant="soft" size="sm" style={styles.viewButton} />
    </View>
  );
}

// The Dashboard tab's content — rendered inside RepairmanHomeScreen below the
// shared header and tab bar, not a screen of its own.
export default function DashboardContent() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}>
        <FadeUp delay={60} duration={500}>
          <View style={styles.statsRow}>
            <StatCard label="Total Jobs" value={STATS.totalJobs} />
            <StatCard label="Active Jobs" value={STATS.activeJobs} />
          </View>
        </FadeUp>

        <FadeUp delay={110} duration={500}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHead}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Earnings Analytics</Text>
              <View style={[styles.pill, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={[styles.pillText, { color: colors.textMuted }]}>7 Days</Text>
              </View>
            </View>
            <EarningsLineChart data={EARNINGS_CHART} />
          </View>
        </FadeUp>

        <FadeUp delay={160} duration={500}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHead}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Job Distribution</Text>
              <View style={[styles.pill, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={[styles.pillText, { color: colors.textMuted }]}>Last Month</Text>
              </View>
            </View>

            <JobDonutChart data={JOB_DISTRIBUTION} total={JOB_DISTRIBUTION_TOTAL} label="Total Jobs" />

            <View style={styles.legend}>
              {JOB_DISTRIBUTION.map(slice => (
                <View key={slice.label} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
                  <Text style={[styles.legendText, { color: colors.textMuted }]}>{slice.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </FadeUp>

        <FadeUp delay={210} duration={500}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHead}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Bookings</Text>
              <View style={[styles.pill, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={[styles.pillText, { color: colors.textMuted }]}>{BOOKINGS.length} Total</Text>
              </View>
            </View>

            <View style={styles.bookingsList}>
              {BOOKINGS.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </View>
          </View>
        </FadeUp>
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingTop: 16 },

  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  statLabel: { fontFamily: fonts.regular, fontSize: 13 },
  statRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statValue: { fontFamily: fonts.bold, fontSize: 24 },
  statBadge: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statBadgeText: { fontFamily: fonts.bold, fontSize: 15 },

  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 16 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 16 },
  pill: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontFamily: fonts.medium, fontSize: 11 },

  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 16, justifyContent: 'center' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontFamily: fonts.regular, fontSize: 12 },

  bookingsList: { gap: 12 },
  bookingCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 4 },
  bookingHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bookingId: { fontFamily: fonts.regular, fontSize: 12 },
  statusPill: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontFamily: fonts.bold, fontSize: 11 },
  bookingLabel: { fontFamily: fonts.bold, fontSize: 13, marginTop: 6 },
  bookingText: { fontFamily: fonts.regular, fontSize: 12 },
  bookingMeta: { flexDirection: 'row', gap: 30, marginTop: 4 },
  viewButton: { marginTop: 12 },
});
