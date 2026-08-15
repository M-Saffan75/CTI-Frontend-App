import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import { FadeUp } from '@/animations';
import { clockBold, packageBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import JobsFilterBar from '../../Jobs/components/JobsFilterBar';
import { PARTS_ORDER_STATS, PARTS_ORDERS } from '../data/partsOrders';

function StatCard({ label, value, prefix = '' }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.statHead}>
        <View style={[styles.statIcon, { backgroundColor: colors.surfaceAlt }]}>
          <Icon source={clockBold} size={14} color={colors.primary} />
        </View>
        <Text style={[styles.statValue, { color: colors.primary }]}>{value}</Text>
      </View>
      <Text style={[styles.statLabel, { color: colors.text }]}>{label}</Text>
      <Text style={[styles.statSub, { color: colors.textMuted }]}>{prefix}TRY 0</Text>
    </View>
  );
}

export default function PartsOrderContent() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const [city, setCity] = useState(null);
  const [priority, setPriority] = useState(null);

  const clearFilters = () => {
    setSearch('');
    setCity(null);
    setPriority(null);
  };

  return (
      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.text }]}>Parts Orders</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Manage and track parts orders</Text>

        <JobsFilterBar
          search={search}
          onSearch={setSearch}
          city={city}
          onCity={setCity}
          priority={priority}
          onPriority={setPriority}
          onClear={clearFilters}
          searchPlaceholder="Search by part or supplier"
        />

        <FadeUp delay={60} duration={450}>
          <View style={styles.statsGrid}>
            <StatCard label="Total Orders" value={PARTS_ORDER_STATS.totalOrders} />
            <StatCard label="Pending Orders" value={PARTS_ORDER_STATS.pendingOrders} />
            <StatCard label="Delivered Orders" value={PARTS_ORDER_STATS.deliveredOrders} />
            <StatCard label="Total Amount" value={PARTS_ORDER_STATS.totalAmount} />
          </View>
        </FadeUp>

        <View style={[styles.tableCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.tableHead}>
            <Text style={[styles.tableHeadText, { color: colors.textMuted }]}>ORDER #</Text>
            <Text style={[styles.tableHeadText, { color: colors.textMuted }]}>CUSTOMER</Text>
            <Text style={[styles.tableHeadText, { color: colors.textMuted }]}>AMOUNT</Text>
          </View>

          {PARTS_ORDERS.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon source={packageBold} size={30} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No orders found</Text>
              <Text style={[styles.emptyBody, { color: colors.textMuted }]}>No orders have been placed yet.</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 20, paddingTop: 16 },
  title: { fontFamily: fonts.bold, fontSize: 24 },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 20 },
  statCard: { width: '48%', borderRadius: 14, borderWidth: 1, padding: 14 },
  statHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontFamily: fonts.bold, fontSize: 18 },
  statLabel: { fontFamily: fonts.bold, fontSize: 14, marginTop: 10 },
  statSub: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },

  tableCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 16 },
  tableHead: { flexDirection: 'row', justifyContent: 'space-between' },
  tableHeadText: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.4 },
  emptyState: { alignItems: 'center', paddingVertical: 30, gap: 6 },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 15, marginTop: 8 },
  emptyBody: { fontFamily: fonts.regular, fontSize: 13 },
});
