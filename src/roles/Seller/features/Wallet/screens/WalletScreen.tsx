import { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import { timesSquareBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

interface PaymentItem {
  id: string;
  orderId: string;
  status: string;
  statusColor: string;
  grossAmount: string;
  platformFee: string;
  netEarned: string;
  deliveredDate: string;
  availableDate: string;
}

interface WithdrawalItem {
  id: string;
  refId: string;
  amount: string;
  bankInfo: string;
  processedDate: string;
  status: 'Completed' | 'Pending' | 'Rejected';
  statusText: string;
}

const MOCK_PAYMENTS: PaymentItem[] = [
  {
    id: 'pay-1',
    orderId: 'TRB-985836',
    status: 'On hold (10d left)',
    statusColor: '#F59E0B',
    grossAmount: 'R.s 28.00',
    platformFee: '-Rs. 3.00',
    netEarned: 'Rs. 25.00',
    deliveredDate: '01 Jul 2026',
    availableDate: '21 Jul 2026',
  },
  {
    id: 'pay-2',
    orderId: 'TRB-985835',
    status: 'Available',
    statusColor: '#10B981',
    grossAmount: 'R.s 50.00',
    platformFee: '-Rs. 5.00',
    netEarned: 'Rs. 45.00',
    deliveredDate: '28 Jun 2026',
    availableDate: '18 Jul 2026',
  },
];

const MOCK_WITHDRAWALS: WithdrawalItem[] = [
  {
    id: 'wd-1',
    refId: '445D596D',
    amount: 'RS. 70.00',
    bankInfo: 'Bank of America ****7890',
    processedDate: '30 Jun 2026, 04:39 PM',
    status: 'Completed',
    statusText: 'Approved and processed',
  },
  {
    id: 'wd-2',
    refId: '445D596E',
    amount: 'RS. 120.00',
    bankInfo: 'Habib Bank Limited ****4821',
    processedDate: '25 Jun 2026, 02:15 PM',
    status: 'Completed',
    statusText: 'Approved and processed',
  },
];

export default function WalletScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'Payment Summary' | 'Withdrawal Request'>('Payment Summary');
  const [payments, setPayments] = useState<PaymentItem[]>(MOCK_PAYMENTS);
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>(MOCK_WITHDRAWALS);

  // Request Withdrawal Modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('Bank of America ****7890');

  const handleCreateWithdrawal = () => {
    const num = parseFloat(withdrawAmount);
    if (isNaN(num) || num <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid withdrawal amount.');
      return;
    }

    const newItem: WithdrawalItem = {
      id: `wd-${Date.now()}`,
      refId: Math.random().toString(36).substring(2, 10).toUpperCase(),
      amount: `RS. ${num.toFixed(2)}`,
      bankInfo: bankAccount,
      processedDate: 'Just now',
      status: 'Pending',
      statusText: 'Under review by admin',
    };

    setWithdrawals(prev => [newItem, ...prev]);
    setIsModalVisible(false);
    setWithdrawAmount('');
    Alert.alert('Withdrawal Requested', 'Your payout request has been sent for approval.');
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}>
      {/* Top Title & Subtitle */}
      <FadeUp delay={30} duration={300}>
        <View style={styles.topSection}>
          <Text style={[styles.mainTitle, { color: colors.text }]}>Wallet & Payouts</Text>
          <Text style={[styles.mainSub, { color: colors.textMuted }]}>
            Your earnings, balance & withdrawal requests
          </Text>
        </View>

        {/* Tab Row matching Figma: Payment Summary & Withdrawal Request */}
        <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => setActiveTab('Payment Summary')}
            style={[
              styles.tabItem,
              activeTab === 'Payment Summary' && [
                styles.activeTabItem,
                { borderBottomColor: colors.primary },
              ],
            ]}>
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'Payment Summary' ? colors.primary : colors.textMuted },
                activeTab === 'Payment Summary' && { fontFamily: fonts.bold },
              ]}>
              📋  Payment Summary
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('Withdrawal Request')}
            style={[
              styles.tabItem,
              activeTab === 'Withdrawal Request' && [
                styles.activeTabItem,
                { borderBottomColor: colors.primary },
              ],
            ]}>
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'Withdrawal Request' ? colors.primary : colors.textMuted },
                activeTab === 'Withdrawal Request' && { fontFamily: fonts.bold },
              ]}>
              🏛  Withdrawal Request
            </Text>
          </TouchableOpacity>
        </View>
      </FadeUp>

      {/* Payment Summary Tab */}
      {activeTab === 'Payment Summary' && (
        <View style={styles.tabContent}>
          {payments.map((pay, idx) => (
            <FadeUp key={pay.id} delay={60 + idx * 40} duration={320}>
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                {/* Header: Order ID & Status */}
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardOrderId, { color: colors.text }]}>{pay.orderId}</Text>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: pay.statusColor + '20', borderColor: pay.statusColor },
                    ]}>
                    <Text style={[styles.statusPillText, { color: pay.statusColor }]}>
                      {pay.status}
                    </Text>
                  </View>
                </View>

                {/* 3 Metric Columns: Gross, Platform Fee, Net Earned */}
                <View style={[styles.metricsRow, { backgroundColor: colors.surfaceAlt }]}>
                  <View style={styles.metricCol}>
                    <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                      Gross Amount
                    </Text>
                    <Text style={[styles.metricVal, { color: colors.text }]}>
                      {pay.grossAmount}
                    </Text>
                  </View>

                  <View style={styles.metricCol}>
                    <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                      Platform fee
                    </Text>
                    <Text style={[styles.metricVal, { color: colors.error ?? '#EF4444' }]}>
                      {pay.platformFee}
                    </Text>
                  </View>

                  <View style={styles.metricCol}>
                    <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                      Net earned
                    </Text>
                    <Text style={[styles.metricValBold, { color: colors.text }]}>
                      {pay.netEarned}
                    </Text>
                  </View>
                </View>

                {/* Footer Dates */}
                <View style={styles.datesRow}>
                  <Text style={[styles.dateText, { color: colors.textMuted }]}>
                    Delivered: {pay.deliveredDate}
                  </Text>
                  <Text style={[styles.dateText, { color: colors.textMuted }]}>
                    Available at: {pay.availableDate}
                  </Text>
                </View>
              </View>
            </FadeUp>
          ))}
        </View>
      )}

      {/* Withdrawal Request Tab matching withdrawal Summary.png */}
      {activeTab === 'Withdrawal Request' && (
        <View style={styles.tabContent}>
          {/* Top Big Orange Button */}
          <FadeUp delay={50} duration={300}>
            <Button
              title="+ Request Withdrawal"
              variant="primary"
              size="lg"
              onPress={() => setIsModalVisible(true)}
              style={styles.withdrawBtn}
            />
          </FadeUp>

          {/* Blue Fidelity Banner */}
          <FadeUp delay={80} duration={300}>
            <View style={styles.blueBanner}>
              <Text style={styles.blueBannerIcon}>ℹ</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.blueBannerTitle}>Perfect round-trip fidelity</Text>
                <Text style={styles.blueBannerSub}>
                  Payout requests are processed twice weekly into your linked settlement account.
                </Text>
              </View>
            </View>
          </FadeUp>

          {/* Withdrawal Cards matching Figma */}
          {withdrawals.map((wd, idx) => (
            <FadeUp key={wd.id} delay={100 + idx * 40} duration={320}>
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                <View style={styles.wdCardRow}>
                  {/* Left Column: ID, Amount, Bank, Date */}
                  <View style={styles.wdLeftCol}>
                    <Text style={[styles.wdRefId, { color: colors.text }]}>{wd.refId}</Text>
                    <Text style={[styles.wdAmount, { color: colors.text }]}>{wd.amount}</Text>
                    <Text style={[styles.wdBank, { color: colors.textMuted }]}>{wd.bankInfo}</Text>
                    <Text style={[styles.wdDate, { color: colors.textMuted }]}>
                      {wd.processedDate}
                    </Text>
                  </View>

                  {/* Right Column: Status badge and status text */}
                  <View style={styles.wdRightCol}>
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor:
                            wd.status === 'Completed' ? '#10B98120' : colors.primary + '20',
                          borderColor:
                            wd.status === 'Completed' ? '#10B981' : colors.primary,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.statusPillText,
                          { color: wd.status === 'Completed' ? '#10B981' : colors.primary },
                        ]}>
                        {wd.status}
                      </Text>
                    </View>
                    <Text style={[styles.wdStatusDesc, { color: colors.textMuted }]}>
                      {wd.statusText}
                    </Text>
                  </View>
                </View>
              </View>
            </FadeUp>
          ))}
        </View>
      )}

      {/* Withdrawal Request Modal */}
      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Request Withdrawal</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Icon source={timesSquareBold} size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Withdrawal Amount (RS.)</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceAlt },
                ]}
                placeholder="e.g. 70.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
              />

              <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 12 }]}>
                Settlement Bank Account
              </Text>
              <View
                style={[
                  styles.bankSelector,
                  { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
                ]}>
                <Text style={[styles.bankSelectorText, { color: colors.text }]}>
                  {bankAccount}
                </Text>
              </View>

              <View style={styles.modalBtnRow}>
                <Button
                  title="Submit Payout"
                  variant="primary"
                  size="md"
                  onPress={handleCreateWithdrawal}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Cancel"
                  variant="outline"
                  size="md"
                  onPress={() => setIsModalVisible(false)}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  topSection: { gap: 4 },
  mainTitle: { fontFamily: fonts.bold, fontSize: 22 },
  mainSub: { fontFamily: fonts.regular, fontSize: 13 },

  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {
    borderBottomWidth: 2,
  },
  tabText: { fontFamily: fonts.medium, fontSize: 14 },

  tabContent: { gap: 14 },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardOrderId: { fontFamily: fonts.bold, fontSize: 16 },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusPillText: { fontFamily: fonts.medium, fontSize: 12 },

  metricsRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-between',
  },
  metricCol: { gap: 4 },
  metricLabel: { fontFamily: fonts.regular, fontSize: 11 },
  metricVal: { fontFamily: fonts.medium, fontSize: 14 },
  metricValBold: { fontFamily: fonts.bold, fontSize: 14 },

  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: { fontFamily: fonts.regular, fontSize: 12 },

  withdrawBtn: {
    borderRadius: 12,
  },
  blueBanner: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 12,
  },
  blueBannerIcon: { color: '#2563EB', fontSize: 16, fontFamily: fonts.bold },
  blueBannerTitle: { color: '#1E40AF', fontFamily: fonts.bold, fontSize: 13, marginBottom: 2 },
  blueBannerSub: { color: '#1E3A8A', fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 },

  wdCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  wdLeftCol: { gap: 4 },
  wdRefId: { fontFamily: fonts.bold, fontSize: 15 },
  wdAmount: { fontFamily: fonts.bold, fontSize: 17 },
  wdBank: { fontFamily: fonts.regular, fontSize: 13 },
  wdDate: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },

  wdRightCol: { alignItems: 'flex-end', gap: 6 },
  wdStatusDesc: { fontFamily: fonts.regular, fontSize: 11, maxWidth: 120, textAlign: 'right' },

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
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: { fontFamily: fonts.bold, fontSize: 18 },
  modalBody: { gap: 8 },
  fieldLabel: { fontFamily: fonts.medium, fontSize: 13 },
  modalInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  bankSelector: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: 'center',
  },
  bankSelectorText: { fontFamily: fonts.regular, fontSize: 13 },
  modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
});
