import { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import { FadeUp } from '@/animations';
import { timesSquareBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

const STATEMENT_FILTERS = ['Today', 'Yeaterday', 'Last 7 Days', 'Last 14 Days'];

interface TransactionItem {
  orderId: string;
  customer: string;
  product: string;
  orderAmt: string;
  hold: string;
  earned: string;
  status: string;
}

interface TransactionGroup {
  date: string;
  orderCount: number;
  totalAmount: string;
  expanded: boolean;
  transactions: TransactionItem[];
}

const INITIAL_GROUPS: TransactionGroup[] = [
  {
    date: '01-07-2026',
    orderCount: 1,
    totalAmount: '$28.00',
    expanded: true,
    transactions: [
      {
        orderId: 'TRB-985836',
        customer: 'Customer Abasi',
        product: 'C.A ball',
        orderAmt: '$28.00',
        hold: '-',
        earned: '$25.00',
        status: 'Delivered',
      },
    ],
  },
];

export default function ReportsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedFilter, setSelectedFilter] = useState('Today');
  const [groups, setGroups] = useState<TransactionGroup[]>(INITIAL_GROUPS);
  const [isStatementModalVisible, setIsStatementModalVisible] = useState(false);

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

  const toggleGroup = (date: string) => {
    setGroups(prev =>
      prev.map(g => (g.date === date ? { ...g, expanded: !g.expanded } : g))
    );
  };

  const handleRequestStatement = () => {
    setIsStatementModalVisible(false);
    setAlertConfig({
      visible: true,
      type: 'success',
      title: 'Statement Requested',
      message: `Official account statement for ${selectedFilter} has been generated and sent to your registered email address.`,
    });
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}>
      {/* Top Header matching Reported screen.png */}
      <FadeUp delay={30} duration={300}>
        <View style={styles.topSection}>
          <Text style={[styles.mainTitle, { color: colors.text }]}>
            Reports & Account{'\n'}Statement
          </Text>
          <Text style={[styles.mainSub, { color: colors.textMuted }]}>
            View your transaction history, earnings, and order-based financial performance.
          </Text>

          {/* Full Width Big Orange Button: 📄 Request Statement */}
          <Squeeze onPress={() => setIsStatementModalVisible(true)} scale={0.98}>
            <View style={[styles.requestBtn, { backgroundColor: '#F97316' }]}>
              <Text style={{ fontSize: 16 }}>📄</Text>
              <Text style={styles.requestBtnText}>Request Statement</Text>
            </View>
          </Squeeze>
        </View>

        {/* Filter Pills: Today, Yeaterday, Last 7 Days, Last 14 Days */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsRow}>
          {STATEMENT_FILTERS.map(filter => {
            const isSelected = selectedFilter === filter;
            return (
              <Squeeze key={filter} onPress={() => setSelectedFilter(filter)}>
                <View
                  style={[
                    styles.pill,
                    {
                      backgroundColor: isSelected ? '#F97316' : colors.surfaceAlt,
                      borderColor: isSelected ? '#F97316' : 'transparent',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.pillText,
                      { color: isSelected ? '#FFFFFF' : colors.textMuted },
                      isSelected && { fontFamily: fonts.bold },
                    ]}>
                    {filter}
                  </Text>
                </View>
              </Squeeze>
            );
          })}
        </ScrollView>
      </FadeUp>

      {/* Section Title: Orange Undo/Curving Arrow + Transaction history */}
      <FadeUp delay={60} duration={300}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.arrowIconBox}>
            <Text style={styles.curvingArrow}>↩</Text>
          </View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Transaction history</Text>
        </View>

        {/* Card matching Reported screen.png */}
        <View style={styles.groupsList}>
          {groups.map(group => (
            <View
              key={group.date}
              style={[
                styles.groupCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              {/* Header Bar */}
              <TouchableOpacity
                onPress={() => toggleGroup(group.date)}
                activeOpacity={0.8}
                style={styles.groupHeader}>
                <View style={styles.groupHeaderLeft}>
                  <Text
                    style={[
                      styles.chevronIcon,
                      {
                        color: colors.textMuted,
                        transform: [{ rotate: group.expanded ? '0deg' : '-90deg' }],
                      },
                    ]}>
                    ⌄
                  </Text>
                  <Text style={[styles.groupDate, { color: colors.text }]}>{group.date}</Text>
                  <View style={styles.orderCountBadge}>
                    <Text style={styles.orderCountText}>{group.orderCount} Order</Text>
                  </View>
                </View>

                <Text style={[styles.groupTotal, { color: colors.textMuted }]}>
                  Total: {group.totalAmount}
                </Text>
              </TouchableOpacity>

              {/* Expanded Card Details matching exact 7 rows in Figma */}
              {group.expanded && (
                <View style={styles.transactionsContainer}>
                  {group.transactions.map(t => (
                    <View key={t.orderId} style={styles.tableBlock}>
                      <View style={[styles.divider, { backgroundColor: colors.border }]} />

                      {/* Row 1: Orderid */}
                      <View style={styles.dataRow}>
                        <Text style={[styles.dataLabel, { color: colors.textMuted }]}>Orderid</Text>
                        <Text style={[styles.dataValue, { color: colors.text }]}>{t.orderId}</Text>
                      </View>

                      <View style={[styles.divider, { backgroundColor: colors.border }]} />

                      {/* Row 2: Customer */}
                      <View style={styles.dataRow}>
                        <Text style={[styles.dataLabel, { color: colors.textMuted }]}>Customer</Text>
                        <Text style={[styles.dataValue, { color: colors.text }]}>{t.customer}</Text>
                      </View>

                      <View style={[styles.divider, { backgroundColor: colors.border }]} />

                      {/* Row 3: Product */}
                      <View style={styles.dataRow}>
                        <Text style={[styles.dataLabel, { color: colors.textMuted }]}>Product</Text>
                        <Text style={[styles.dataValue, { color: colors.text }]}>{t.product}</Text>
                      </View>

                      <View style={[styles.divider, { backgroundColor: colors.border }]} />

                      {/* Row 4: Order AMIT */}
                      <View style={styles.dataRow}>
                        <Text style={[styles.dataLabel, { color: colors.textMuted }]}>Order AMIT</Text>
                        <Text style={[styles.dataValue, { color: colors.text }]}>{t.orderAmt}</Text>
                      </View>

                      <View style={[styles.divider, { backgroundColor: colors.border }]} />

                      {/* Row 5: Hold (Pending) */}
                      <View style={styles.dataRow}>
                        <Text style={[styles.dataLabel, { color: colors.textMuted }]}>Hold (Pending)</Text>
                        <Text style={[styles.dataValue, { color: colors.textMuted }]}>{t.hold}</Text>
                      </View>

                      <View style={[styles.divider, { backgroundColor: colors.border }]} />

                      {/* Row 6: Earned (Avail) */}
                      <View style={styles.dataRow}>
                        <Text style={[styles.dataLabel, { color: colors.textMuted }]}>Earned (Avail)</Text>
                        <Text style={[styles.dataValue, { color: '#10B981' }]}>{t.earned}</Text>
                      </View>

                      <View style={[styles.divider, { backgroundColor: colors.border }]} />

                      {/* Row 7: Status */}
                      <View style={styles.dataRow}>
                        <Text style={[styles.dataLabel, { color: colors.textMuted }]}>Status</Text>
                        <View style={styles.statusPill}>
                          <Text style={styles.statusPillText}>{t.status}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </FadeUp>

      {/* Request Statement Modal */}
      <Modal visible={isStatementModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Request Statement</Text>
              <TouchableOpacity onPress={() => setIsStatementModalVisible(false)}>
                <Icon source={timesSquareBold} size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSub, { color: colors.textMuted }]}>
              Generate an official accounting statement including tax invoices, seller commissions, and net earnings for {selectedFilter}.
            </Text>

            <View style={styles.modalBtnRow}>
              <Button
                title="Download PDF & CSV"
                variant="primary"
                size="md"
                onPress={handleRequestStatement}
                style={{ flex: 1 }}
              />
              <Button
                title="Cancel"
                variant="outline"
                size="md"
                onPress={() => setIsStatementModalVisible(false)}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Alert Modal */}
      <AlertModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  topSection: { gap: 10 },
  mainTitle: { fontFamily: fonts.bold, fontSize: 26, letterSpacing: -0.5, lineHeight: 32 },
  mainSub: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },

  requestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 6,
    elevation: 2,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  requestBtnText: { color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 15 },

  filterPillsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
  },
  pillText: { fontFamily: fonts.medium, fontSize: 13 },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
    marginBottom: 10,
  },
  arrowIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  curvingArrow: { fontSize: 20, color: '#F97316', fontFamily: fonts.bold },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 18 },

  groupsList: { gap: 12 },
  groupCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  groupHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chevronIcon: { fontSize: 16, fontFamily: fonts.bold },
  groupDate: { fontFamily: fonts.bold, fontSize: 15 },
  orderCountBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  orderCountText: { fontFamily: fonts.medium, fontSize: 12, color: '#4B5563' },
  groupTotal: { fontFamily: fonts.regular, fontSize: 13 },

  transactionsContainer: { paddingHorizontal: 16, paddingBottom: 16 },
  tableBlock: { gap: 0 },
  divider: { height: 1, width: '100%' },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dataLabel: { fontFamily: fonts.regular, fontSize: 14 },
  dataValue: { fontFamily: fonts.bold, fontSize: 14 },

  statusPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  statusPillText: {
    color: '#10B981',
    fontFamily: fonts.medium,
    fontSize: 12,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: { fontFamily: fonts.bold, fontSize: 18 },
  modalSub: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
});
