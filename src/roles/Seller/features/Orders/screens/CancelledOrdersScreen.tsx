import { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CtiLoader from '@/components/CtiLoader';
import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  calendarBold,
  searchBold,
  timesSquareBold,
  userBold,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { fetchSellerOrdersApi, SellerOrderItem } from '@/roles/Seller/services/sellerApi';

const CANCEL_FILTERS = [
  { key: 'All', label: 'All Order' },
  { key: 'Customer', label: 'Customer Cancelled' },
  { key: 'My', label: 'My Cancelled' },
];

export default function CancelledOrdersScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cancelledOrders, setCancelledOrders] = useState<SellerOrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadCancelled = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetchSellerOrdersApi({
        status: 'cancelled',
        search: searchQuery.trim() || undefined,
      });
      setCancelledOrders(res.orders || []);
    } catch {
      setCancelledOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCancelled();
  }, [searchQuery, activeFilter]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}>
        {/* Header with yellow circular back button */}
        <FadeUp delay={20} duration={300}>
          <View style={styles.headerRow}>
            <Squeeze onPress={() => navigation?.goBack()} scale={0.9}>
              <View style={[styles.backBtnCircle, { backgroundColor: colors.primary }]}>
                <Icon source={arrowLeftBold} size={18} color="#fff" />
              </View>
            </Squeeze>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Cancel Order</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                View and analysis all cancellation records
              </Text>
            </View>
          </View>

          {/* Filter Pills */}
          <View style={styles.filterPillsRow}>
            {CANCEL_FILTERS.map(f => {
              const isSelected = activeFilter === f.key;
              return (
                <Squeeze key={f.key} onPress={() => setActiveFilter(f.key)}>
                  <View
                    style={[
                      styles.filterPill,
                      isSelected
                        ? { backgroundColor: colors.primary }
                        : { backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderWidth: 1 },
                    ]}>
                    <Text
                      style={[
                        styles.filterPillText,
                        { color: isSelected ? '#fff' : colors.text },
                      ]}>
                      {f.label}
                    </Text>
                  </View>
                </Squeeze>
              );
            })}
          </View>

          {/* Search Bar */}
          <View
            style={[
              styles.searchBar,
              { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
            ]}>
            <Icon source={searchBold} size={16} color={colors.textMuted} />
            <TextInput
              placeholder="Search order custom product"
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchInput, { color: colors.text }]}
            />
          </View>

          {/* Order Date Section */}
          <View style={styles.dateSection}>
            <Text style={[styles.dateSectionLabel, { color: colors.text }]}>Order Date</Text>
            <View style={styles.datePickersRow}>
              <View style={[styles.dateInputBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Text style={[styles.datePlaceholder, { color: colors.textMuted }]}>mm/dd/yyy</Text>
                <Icon source={calendarBold} size={16} color={colors.textMuted} />
              </View>
              <View style={[styles.dateInputBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Text style={[styles.datePlaceholder, { color: colors.textMuted }]}>mm/dd/yyy</Text>
                <Icon source={calendarBold} size={16} color={colors.textMuted} />
              </View>
            </View>
          </View>

          {/* Orders or Empty State */}
          {loading && !refreshing ? (
            <CtiLoader
              size="md"
              text="Loading cancelled orders..."
              style={{ paddingVertical: 40 }}
            />
          ) : cancelledOrders.length === 0 ? (
            <View style={[styles.emptyDashedBox, { borderColor: '#8B5CF6' }]}>
              <Text style={styles.emptyIcon}>⊘</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No cancelled orders</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                No orders match the current filters.
              </Text>
            </View>
          ) : (
            cancelledOrders.map((ord, idx) => (
              <View
                key={ord.id}
                style={[
                  styles.orderCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.trackingId, { color: colors.text }]}>{ord.trackingId}</Text>
                  <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}>
                    <Text style={{ color: '#EF4444', fontFamily: fonts.bold, fontSize: 12 }}>
                      Cancelled
                    </Text>
                  </View>
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>{ord.orderNumber}</Text>
                <Text style={{ color: colors.text, fontFamily: fonts.bold, fontSize: 14, marginTop: 4 }}>
                  {ord.customer} • {ord.item}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                  Total: {ord.total}
                </Text>
              </View>
            ))
          )}
        </FadeUp>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  backBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 24,
  },
  headerSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },

  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  filterPillText: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 14,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    padding: 0,
  },

  dateSection: {
    gap: 8,
    marginTop: 4,
  },
  dateSectionLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  datePickersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  datePlaceholder: {
    fontFamily: fonts.regular,
    fontSize: 13,
  },

  emptyDashedBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 32,
    color: '#9CA3AF',
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  emptySub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    textAlign: 'center',
  },
  orderCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 8,
    marginTop: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackingId: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
});
