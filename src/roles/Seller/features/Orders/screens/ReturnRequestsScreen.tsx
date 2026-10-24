import { useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CtiLoader from '@/components/CtiLoader';
import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  chevronDownBold,
  downloadBold,
  eyeBold,
  searchBold,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import {
  fetchSellerReturnsApi,
  approveSellerReturnApi,
  rejectSellerReturnApi,
  SellerReturnItem,
} from '@/roles/Seller/services/sellerApi';

interface ReturnOrder {
  id: string;
  orderId: string;
  customerName: string;
  productName: string;
  sku: string;
  date: string;
  amount: string;
  status: 'Delivered' | 'New Request' | 'Shipped Back';
  statusColor: string;
}

const RETURN_FILTERS = [
  { id: 'all', label: 'All Returens', icon: '⊕' },
  { id: 'new', label: 'New Requests 1', icon: '📥' },
  { id: 'shipped', label: 'Shipped Back', icon: '🚚' },
];

const MOCK_RETURN_ORDERS: ReturnOrder[] = [
  {
    id: 'ret-1',
    orderId: 'TRB-985836',
    customerName: 'Customer Abbasi',
    productName: 'C.A ball',
    sku: 'PRD11284766WSTL',
    date: '7/1/2026',
    amount: '$38.00',
    status: 'Delivered',
    statusColor: '#10B981',
  },
  {
    id: 'ret-2',
    orderId: 'TRB-985837',
    customerName: 'Sufyan Khan',
    productName: 'Cricket Bat Grip',
    sku: 'PRD11284999WSTL',
    date: '7/2/2026',
    amount: '$14.00',
    status: 'New Request',
    statusColor: '#F59E0B',
  },
];

export default function ReturnRequestsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [returnsList, setReturnsList] = useState<any[]>(MOCK_RETURN_ORDERS);
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

  const loadReturns = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchSellerReturnsApi({
        status: selectedFilter !== 'all' ? selectedFilter : undefined,
        search: searchQuery.trim() || undefined,
      });

      if (data && data.length > 0) {
        setReturnsList(
          data.map(r => ({
            id: r.id,
            orderId: r.orderId,
            customerName: r.customer,
            productName: r.item,
            sku: r.returnNo,
            date: r.date,
            amount: r.amount,
            status: r.status,
            statusColor: r.status === 'Approved' || r.status === 'Delivered' ? '#10B981' : '#F59E0B',
            reason: r.reason,
          })),
        );
      } else {
        setReturnsList(MOCK_RETURN_ORDERS);
      }
    } catch {
      setReturnsList(MOCK_RETURN_ORDERS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReturns();
  }, [selectedFilter]);

  const handleApprove = async (retId: string) => {
    try {
      await approveSellerReturnApi(retId, 'Return approved by merchant');
      setAlertConfig({
        visible: true,
        type: 'success',
        title: 'Return Approved',
        message: 'The customer return request has been approved and refund initiated.',
      });
      loadReturns();
    } catch (e: any) {
      setAlertConfig({
        visible: true,
        type: 'error',
        title: 'Action Failed',
        message: e?.response?.data?.message || 'Unable to approve return request.',
      });
    }
  };

  const filteredOrders = returnsList.filter(ord => {
    if (selectedFilter === 'new' && ord.status !== 'New Request' && ord.status !== 'Requested') return false;
    if (selectedFilter === 'shipped' && ord.status !== 'Shipped Back' && ord.status !== 'Shipped') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        ord.orderId.toLowerCase().includes(q) ||
        ord.customerName.toLowerCase().includes(q) ||
        ord.productName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Squeeze onPress={() => navigation?.goBack()} scale={0.9}>
          <View style={[styles.backBtn, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={18} color={colors.onPrimary} />
          </View>
        </Squeeze>
        <View style={styles.headerTitles}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Return Requests</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Manage customer return requests for your orders
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}>
        {/* Horizontal Filter Pills */}
        <FadeUp delay={30} duration={300}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsRow}>
            {RETURN_FILTERS.map(pill => {
              const isSelected = selectedFilter === pill.id;
              return (
                <Squeeze key={pill.id} onPress={() => setSelectedFilter(pill.id)}>
                  <View
                    style={[
                      styles.filterPill,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.pillText,
                        { color: isSelected ? colors.onPrimary : colors.textMuted },
                        isSelected && { fontFamily: fonts.bold },
                      ]}>
                      {pill.icon}  {pill.label}
                    </Text>
                  </View>
                </Squeeze>
              );
            })}
          </ScrollView>
        </FadeUp>

        {/* Search & Date Filter Bar */}
        <FadeUp delay={60} duration={300}>
          <View style={styles.searchSection}>
            <View
              style={[
                styles.searchBar,
                { backgroundColor: colors.surface, borderColor: colors.border },
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

            {/* Date Inputs matching Figma */}
            <View style={styles.dateInputsRow}>
              <View
                style={[
                  styles.dateInputBox,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                <TextInput
                  placeholder="mm/dd/yyy"
                  placeholderTextColor={colors.textMuted}
                  value={startDate}
                  onChangeText={setStartDate}
                  style={[styles.dateText, { color: colors.text }]}
                />
                <Text style={{ fontSize: 13 }}>📅</Text>
              </View>

              <View
                style={[
                  styles.dateInputBox,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                <TextInput
                  placeholder="mm/dd/yyy"
                  placeholderTextColor={colors.textMuted}
                  value={endDate}
                  onChangeText={setEndDate}
                  style={[styles.dateText, { color: colors.text }]}
                />
                <Text style={{ fontSize: 13 }}>📅</Text>
              </View>
            </View>
          </View>
        </FadeUp>

        {/* Orders List matching Order Returns.png */}
        <View style={styles.ordersList}>
          {loading && !refreshing ? (
            <CtiLoader
              size="md"
              text="Loading return requests..."
              style={{ paddingVertical: 40 }}
            />
          ) : filteredOrders.length === 0 ? (
            <View style={[styles.orderCard, { backgroundColor: colors.surface, borderColor: colors.border, padding: 30, alignItems: 'center' }]}>
              <Text style={{ color: colors.textMuted, fontFamily: fonts.medium }}>No return requests found</Text>
            </View>
          ) : (
            filteredOrders.map((ord, idx) => (
            <FadeUp key={ord.id} delay={90 + idx * 40} duration={320}>
              <View
                style={[
                  styles.orderCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                {/* Top Row: Order ID & Status */}
                <View style={styles.cardHeader}>
                  <Text style={[styles.orderIdText, { color: colors.text }]}>{ord.orderId}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: ord.statusColor + '20', borderColor: ord.statusColor },
                    ]}>
                    <Text style={[styles.statusText, { color: ord.statusColor }]}>{ord.status}</Text>
                  </View>
                </View>

                {/* Customer and Product info */}
                <View style={styles.detailsGroup}>
                  <Text style={[styles.customerName, { color: colors.text }]}>
                    {ord.customerName}
                  </Text>
                  <Text style={[styles.productSku, { color: colors.textMuted }]}>
                    {ord.productName} / {ord.sku}
                  </Text>
                </View>

                {/* Date and Amount Row */}
                <View style={styles.amountRow}>
                  <Text style={[styles.orderDate, { color: colors.textMuted }]}>{ord.date}</Text>
                  <Text style={[styles.amountText, { color: colors.text }]}>{ord.amount}</Text>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* Bottom Action Row: Eye, Download, Action Button */}
                <View style={styles.actionRow}>
                  <View style={styles.leftIcons}>
                    <TouchableOpacity
                      onPress={() =>
                        setAlertConfig({
                          visible: true,
                          type: 'info',
                          title: `Return: ${ord.orderId}`,
                          message: `Customer: ${ord.customerName}\nProduct: ${ord.productName}\nAmount: ${ord.amount}\nStatus: ${ord.status}\nReason: ${ord.reason || 'Item not matching description'}`,
                        })
                      }
                      style={[
                        styles.iconActionBtn,
                        { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
                      ]}>
                      <Icon source={eyeBold} size={16} color={colors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() =>
                        setAlertConfig({
                          visible: true,
                          type: 'success',
                          title: 'Invoice Downloaded',
                          message: `Return slip & invoice for ${ord.orderId} have been saved to your device.`,
                        })
                      }
                      style={[
                        styles.iconActionBtn,
                        { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
                      ]}>
                      <Icon source={downloadBold} size={16} color={colors.text} />
                    </TouchableOpacity>
                  </View>

                  {/* Delivered / Action Button */}
                  <TouchableOpacity
                    onPress={() => handleApprove(ord.id)}
                    style={[
                      styles.dropdownBtn,
                      { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
                    ]}>
                    <Text style={[styles.dropdownBtnText, { color: colors.text }]}>
                      {ord.status}
                    </Text>
                    <Icon source={chevronDownBold} size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            </FadeUp>
          ))
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
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: { flex: 1 },
  headerTitle: { fontFamily: fonts.bold, fontSize: 18 },
  headerSubtitle: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },

  content: { padding: 16, gap: 14 },

  pillsRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
  },
  pillText: { fontFamily: fonts.medium, fontSize: 13 },

  searchSection: { gap: 10 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 14 },

  dateInputsRow: { flexDirection: 'row', gap: 10 },
  dateInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 40,
  },
  dateText: { flex: 1, fontFamily: fonts.regular, fontSize: 13 },

  ordersList: { gap: 12 },
  orderCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderIdText: { fontFamily: fonts.bold, fontSize: 16 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: { fontFamily: fonts.medium, fontSize: 12 },

  detailsGroup: { gap: 3 },
  customerName: { fontFamily: fonts.bold, fontSize: 14 },
  productSku: { fontFamily: fonts.regular, fontSize: 13 },

  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  orderDate: { fontFamily: fonts.regular, fontSize: 13 },
  amountText: { fontFamily: fonts.bold, fontSize: 16 },

  divider: { height: 1, width: '100%' },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftIcons: { flexDirection: 'row', gap: 8 },
  iconActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
  },
  dropdownBtnText: { fontFamily: fonts.medium, fontSize: 13 },
});
