import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import { FadeUp } from '@/animations';
import {
  calendarBold,
  checkCircleBold,
  chevronDownBold,
  searchBold,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import {
  fetchSellerOrdersApi,
  updateSellerOrderStatusApi,
  SellerOrderItem,
} from '@/roles/Seller/services/sellerApi';

const STATUS_OPTIONS = [
  'All Order',
  'Pending',
  'Processing',
  'Shipped',
];

const ORDERS = [
  {
    id: '1',
    trackingId: 'TRB-985836',
    orderNumber: 'ORD-20260701-8044XI - 7/1/2026',
    customer: 'Customer Abbasi',
    item: 'C.A ball',
    itemSku: 'PRD11284766WSTL',
    completedDate: '7/1/2026',
    total: '$38.00',
    status: 'Pending',
  },
  {
    id: '2',
    trackingId: 'TRB-985837',
    orderNumber: 'ORD-20260701-8045XI - 7/1/2026',
    customer: 'Customer Abbasi',
    item: 'Reebok workout ready tee',
    itemSku: 'PRD11284767WSTL',
    completedDate: '7/1/2026',
    total: '$209.00',
    status: 'Processing',
  },
  {
    id: '3',
    trackingId: 'TRB-985838',
    orderNumber: 'ORD-20260701-8046XI - 7/1/2026',
    customer: 'Customer Abbasi',
    item: 'Nike Air Max 270',
    itemSku: 'PRD11284768WSTL',
    completedDate: '7/1/2026',
    total: '$150.00',
    status: 'Shipped',
  },
  {
    id: '4',
    trackingId: 'TRB-985839',
    orderNumber: 'ORD-20260701-8047XI - 7/1/2026',
    customer: 'Customer Abbasi',
    item: 'Puma Training Shorts',
    itemSku: 'PRD11284769WSTL',
    completedDate: '7/1/2026',
    total: '$45.00',
    status: 'Delivered',
  },
];

export default function OrderManagementScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedStatus, setSelectedStatus] = useState('All statuses');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [orders, setOrders] = useState<SellerOrderItem[]>(ORDERS as any);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // AlertModal State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: AlertModalType;
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const loadOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetchSellerOrdersApi({
        status: selectedStatus !== 'All statuses' && selectedStatus !== 'All Order' ? selectedStatus : undefined,
        search: searchQuery.trim() || undefined,
      });

      if (res.orders && res.orders.length > 0) {
        setOrders(res.orders);
      } else if (!searchQuery && selectedStatus === 'All statuses') {
        setOrders(ORDERS as any);
      } else {
        setOrders([]);
      }
    } catch {
      setOrders(ORDERS as any);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedStatus]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleUpdateStatus = async (order: SellerOrderItem) => {
    const nextStatus =
      order.status.toLowerCase() === 'pending'
        ? 'Processing'
        : order.status.toLowerCase() === 'processing'
        ? 'Shipped'
        : order.status.toLowerCase() === 'shipped'
        ? 'Delivered'
        : 'Completed';

    if (nextStatus === 'Completed') {
      setAlertConfig({
        visible: true,
        type: 'info',
        title: 'Order Completed',
        message: `Order ${order.orderNumber} is already marked as Delivered.`,
      });
      return;
    }

    try {
      // Optimistic update
      setOrders(prev =>
        prev.map(o => (o.id === order.id ? { ...o, status: nextStatus } : o)),
      );

      await updateSellerOrderStatusApi(order.id, nextStatus);

      setAlertConfig({
        visible: true,
        type: 'success',
        title: 'Status Updated',
        message: `Order ${order.orderNumber} status changed to ${nextStatus}.`,
      });
    } catch (e: any) {
      loadOrders();
      setAlertConfig({
        visible: true,
        type: 'error',
        title: 'Update Failed',
        message: e?.response?.data?.message || 'Could not update order status right now.',
      });
    }
  };

  const getBadgeColors = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return { bg: '#FEF3C7', text: '#D97706' };
      case 'processing':
        return { bg: '#DBEAFE', text: '#2563EB' };
      case 'shipped':
        return { bg: '#EDE9FE', text: '#7C3AED' };
      case 'delivered':
      default:
        return { bg: '#ECFDF5', text: '#10B981' };
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.trackingId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatus === 'All statuses' ||
      selectedStatus === 'All Order' ||
      order.status.toLowerCase() === selectedStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadOrders(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
      {/* Title & Subtitle */}
      <FadeUp delay={20} duration={300}>
        <View style={styles.topHeader}>
          <Text style={[styles.mainTitle, { color: colors.text }]}>Order management</Text>
          <Text style={[styles.mainSub, { color: colors.textMuted }]}>
            Track and update all your orders
          </Text>

          {/* Top Action Buttons: [Cancelled Order] and [Return Order] */}
          <View style={styles.topBtnRow}>
            <Squeeze onPress={() => navigation?.navigate('CancelledOrders')} style={{ flex: 1 }}>
              <View style={[styles.topActionBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Text style={[styles.topActionText, { color: colors.text }]}>Cancelled Order</Text>
              </View>
            </Squeeze>

            <Squeeze onPress={() => navigation?.navigate('ReturnRequests')} style={{ flex: 1 }}>
              <View style={[styles.topActionBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Text style={[styles.topActionText, { color: colors.text }]}>Return Order</Text>
              </View>
            </Squeeze>
          </View>
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

        {/* Status Dropdown with All statuses (All Order, Pending, Processing, Shipped) */}
        <View style={styles.dropdownContainer}>
          <Squeeze onPress={() => setIsDropdownOpen(prev => !prev)}>
            <View
              style={[
                styles.dropdownBox,
                {
                  backgroundColor: colors.surfaceAlt,
                  borderColor: isDropdownOpen ? colors.primary : colors.border,
                },
              ]}>
              <Text style={[styles.dropdownText, { color: colors.text }]}>
                {selectedStatus}
              </Text>
              <Icon
                source={chevronDownBold}
                size={14}
                color={isDropdownOpen ? colors.primary : colors.textMuted}
                style={isDropdownOpen ? { transform: [{ rotate: '180deg' }] } : undefined}
              />
            </View>
          </Squeeze>

          {isDropdownOpen && (
            <View
              style={[
                styles.dropdownMenu,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              {STATUS_OPTIONS.map((status, index) => {
                const isSelected =
                  selectedStatus === status ||
                  (selectedStatus === 'All statuses' && status === 'All Order');
                return (
                  <Squeeze
                    key={status}
                    onPress={() => {
                      setSelectedStatus(status);
                      setIsDropdownOpen(false);
                    }}>
                    <View
                      style={[
                        styles.dropdownItem,
                        index < STATUS_OPTIONS.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: colors.border,
                        },
                        isSelected && { backgroundColor: colors.surfaceAlt },
                      ]}>
                      <Text
                        style={[
                          styles.dropdownItemText,
                          {
                            color: isSelected ? colors.primary : colors.text,
                            fontFamily: isSelected ? fonts.bold : fonts.regular,
                          },
                        ]}>
                        {status}
                      </Text>
                      {isSelected && (
                        <Icon source={checkCircleBold} size={14} color={colors.primary} />
                      )}
                    </View>
                  </Squeeze>
                );
              })}
            </View>
          )}
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

        {/* Orders List Heading */}
        <Text style={[styles.ordersHeading, { color: colors.text }]}>Orders</Text>
      </FadeUp>

      {/* Orders List matching Figma cards */}
      <View style={styles.ordersList}>
        {filteredOrders.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No orders found
            </Text>
          </View>
        ) : (
          filteredOrders.map((order, idx) => {
            const badge = getBadgeColors(order.status);
            return (
              <FadeUp key={order.id} delay={60 + idx * 40} duration={300}>
                <View style={[styles.orderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={[styles.trackingId, { color: colors.text }]}>{order.trackingId}</Text>
                    <TouchableOpacity
                      onPress={() => handleUpdateStatus(order)}
                      activeOpacity={0.7}
                      style={[styles.deliveredBadge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.deliveredBadgeText, { color: badge.text }]}>{order.status} ✎</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.orderSubNum, { color: colors.textMuted }]}>
                    {order.orderNumber}
                  </Text>

                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  <View style={styles.dataRow}>
                    <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Customer</Text>
                    <Text style={[styles.rowValue, { color: colors.text }]}>{order.customer}</Text>
                  </View>

                  <View style={styles.dataRow}>
                    <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Item</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.rowValue, { color: colors.text }]}>{order.item}</Text>
                      <Text style={[styles.rowSubSku, { color: colors.textMuted }]}>{order.itemSku}</Text>
                    </View>
                  </View>

                  <View style={styles.dataRow}>
                    <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Completed</Text>
                    <Text style={[styles.rowValue, { color: colors.text }]}>{order.completedDate}</Text>
                  </View>

                  <View style={styles.dataRow}>
                    <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Total</Text>
                    <Text style={styles.totalValue}>{order.total}</Text>
                  </View>
                </View>
              </FadeUp>
            );
          })
        )}
      </View>
    </ScrollView>

    {/* Alert Modal */}
    <AlertModal
      visible={alertConfig.visible}
      type={alertConfig.type}
      title={alertConfig.title}
      message={alertConfig.message}
      onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
    />
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 14,
  },
  topHeader: {
    gap: 6,
  },
  mainTitle: {
    fontFamily: fonts.bold,
    fontSize: 26,
  },
  mainSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  topBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  topActionBtn: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topActionText: {
    fontFamily: fonts.medium,
    fontSize: 13,
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
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    padding: 0,
  },

  dropdownContainer: {
    marginTop: 12,
    marginBottom: 12,
  },
  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 44,
  },
  dropdownText: {
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  dropdownMenu: {
    marginTop: 6,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownItemText: {
    fontSize: 13,
  },

  emptyBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  emptyText: {
    fontFamily: fonts.medium,
    fontSize: 13,
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

  ordersHeading: {
    fontFamily: fonts.bold,
    fontSize: 18,
    marginTop: 10,
  },
  ordersList: {
    gap: 14,
  },
  orderCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackingId: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  deliveredBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  deliveredBadgeText: {
    color: '#10B981',
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  orderSubNum: {
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: -4,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rowLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  rowValue: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  rowSubSku: {
    fontFamily: fonts.regular,
    fontSize: 11,
    marginTop: 2,
  },
  totalValue: {
    color: '#10B981',
    fontFamily: fonts.bold,
    fontSize: 15,
  },
});
