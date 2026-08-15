import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import {
  checkCircleBold,
  clockBold,
  creditCardBold,
  exclamationCircleBold,
  lockBold,
  returnOfInvestmentIcon,
  settingsBold,
  shoppingBasketBold,
  timesSquareBold,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import TopUpWalletModal from '../components/TopUpWalletModal';
import { BALANCE, BANK_DETAILS_COMPLETE, WITHDRAW_HISTORY, WITHDRAW_STATS } from '../data/earnings';

const SUB_TABS = ['Overview', 'Withdraw', 'Withdraw History'];

function StatBox({ label, value, note }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.statBox, { backgroundColor: colors.surfaceAlt }]}>
      <View style={styles.statBoxHead}>
        <View style={[styles.statBoxIcon, { backgroundColor: colors.surface }]}>
          <Icon source={creditCardBold} size={16} color={colors.primary} />
        </View>
        <Text style={[styles.statBoxLabel, { color: colors.textMuted }]}>{label}</Text>
      </View>
      <Text style={[styles.statBoxValue, { color: colors.text }]}>TRY {value}</Text>
      {note && <Text style={[styles.statBoxNote, { color: colors.textMuted }]}>{note}</Text>}
    </View>
  );
}

function HistoryStat({ label, stat, icon, color }) {
  const { colors } = useTheme();
  const accent = color ?? colors.primary;
  return (
    <View style={[styles.historyStat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.historyStatHead}>
        <View style={[styles.historyStatIcon, { backgroundColor: accent + '18' }]}>
          <Icon source={icon} size={14} color={accent} />
        </View>
        <Text style={[styles.historyStatCount, { color: colors.text }]}>{stat.count}</Text>
      </View>
      <Text style={[styles.historyStatLabel, { color: colors.text }]}>{label}</Text>
      <Text style={[styles.historyStatAmount, { color: colors.textMuted }]}>TRY {stat.amount}</Text>
    </View>
  );
}

export default function EarningsContent({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('Overview');
  const [topUpOpen, setTopUpOpen] = useState(false);

  return (
    <>
      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>My Earnings</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Track your income, withdrawals, and performance in one place.
        </Text>

        {!BANK_DETAILS_COMPLETE && (
          <View style={[styles.warningCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Icon source={exclamationCircleBold} size={20} color={'#F5A524'} />
            <View style={styles.warningText}>
              <Text style={[styles.warningTitle, { color: colors.text }]}>Bank Details Required</Text>
              <Text style={[styles.warningBody, { color: colors.textMuted }]}>
                Please complete your bank account information in settings before you can request a
                withdrawal. This is required to process your payments securely.
              </Text>
            </View>
          </View>
        )}

        <View style={[styles.subTabs, { borderColor: colors.border }]}>
          {SUB_TABS.map(item => {
            const active = item === tab;
            return (
              <Squeeze key={item} onPress={() => setTab(item)}>
                <View style={[styles.subTab, active && { borderBottomColor: colors.primary }]}>
                  <Text
                    style={[
                      styles.subTabText,
                      { color: active ? colors.primary : colors.textMuted, fontFamily: active ? fonts.bold : fonts.regular },
                    ]}>
                    {item}
                  </Text>
                </View>
              </Squeeze>
            );
          })}
        </View>

        {tab === 'Overview' && (
          <FadeUp delay={60} duration={450}>
            <StatBox label="Available Balance" value={BALANCE.available} note={`TRY ${BALANCE.released}`} />
            <Button title="Top Up" color={colors.success} icon={creditCardBold} iconPosition="left" onPress={() => setTopUpOpen(true)} style={styles.topUpButton} />

            <View style={{ marginTop: 14 }}>
              <StatBox label="Pending Release" value={BALANCE.pendingRelease} note="Awaiting customer closure" />
            </View>
            <View style={{ marginTop: 14 }}>
              <StatBox label="Total Withdrawn" value={BALANCE.totalWithdrawn} note="All clear" />
            </View>

            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Icon source={shoppingBasketBold} size={18} color={colors.primary} />
              <Text style={[styles.infoTitle, { color: colors.text }]}>How Payouts Work</Text>
              <Text style={[styles.infoBody, { color: colors.textMuted }]}>
                Earnings are released when the customer closes the job. Once released, you can
                withdraw anytime.
              </Text>
            </View>

            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Icon source={clockBold} size={18} color={colors.primary} />
              <Text style={[styles.infoTitle, { color: colors.text }]}>Withdrawal Limit</Text>
              <Text style={[styles.infoBody, { color: colors.textMuted }]}>
                Minimum withdrawal amount is TRY 500. Processed within 3-5 business days.
              </Text>
            </View>
          </FadeUp>
        )}

        {tab === 'Withdraw' && (
          <FadeUp delay={60} duration={450}>
            {!BANK_DETAILS_COMPLETE ? (
              <View style={[styles.lockedCard, { backgroundColor: colors.surfaceAlt }]}>
                <View style={[styles.lockIcon, { backgroundColor: colors.error + '18' }]}>
                  <Icon source={lockBold} size={20} color={colors.error} />
                </View>
                <Text style={[styles.infoTitle, { color: colors.text }]}>Withdrawal Unavailable</Text>
                <Text style={[styles.infoBody, { color: colors.textMuted }]}>
                  You must complete your bank account information before requesting a withdrawal.
                  This ensures your payments can be processed securely and efficiently.
                </Text>
                <Button
                  title="Go to Settings & Add Bank"
                  color={colors.error}
                  icon={settingsBold}
                  iconPosition="left"
                  onPress={() => navigation.navigate('BankingInformation')}
                  style={styles.spaced}
                />
              </View>
            ) : null}

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Withdraw Funds</Text>
            <View style={[styles.balanceCard, { backgroundColor: colors.primary + '14' }]}>
              <Text style={[styles.balanceLabel, { color: colors.textMuted }]}>Available Balance</Text>
              <Text style={[styles.balanceValue, { color: colors.primary }]}>TRY {BALANCE.available}</Text>
              <View style={[styles.balanceDivider, { backgroundColor: colors.border }]} />
              <Text style={[styles.balanceNote, { color: colors.textMuted }]}>Released: TRY {BALANCE.released}</Text>
            </View>

            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>Withdrawal Process</Text>
              {['Request submitted for admin review', 'Approved within 24-48 hours', 'Transferred in 3-5 business days'].map(
                step => (
                  <View key={step} style={styles.processRow}>
                    <Icon source={settingsBold} size={14} color={colors.success} />
                    <Text style={[styles.processText, { color: colors.textMuted }]}>{step}</Text>
                  </View>
                ),
              )}
              <Button
                title="Request Withdrawal"
                variant="soft"
                disabled={!BANK_DETAILS_COMPLETE}
                onPress={() => {}}
                style={styles.spaced}
              />
            </View>
          </FadeUp>
        )}

        {tab === 'Withdraw History' && (
          <FadeUp delay={60} duration={450}>
            <View style={styles.historyGrid}>
              <HistoryStat label="Requested" stat={WITHDRAW_STATS.requested} icon={clockBold} color={colors.primary} />
              <HistoryStat label="Processing" stat={WITHDRAW_STATS.processing} icon={returnOfInvestmentIcon} color={'#448AFF'} />
              <HistoryStat label="Completed" stat={WITHDRAW_STATS.completed} icon={checkCircleBold} color={colors.success} />
              <HistoryStat label="Rejected" stat={WITHDRAW_STATS.rejected} icon={timesSquareBold} color={colors.error} />
            </View>

            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Icon source={clockBold} size={18} color={colors.primary} />
              <Text style={[styles.infoTitle, { color: colors.text }]}>Withdrawal History</Text>
              <Text style={[styles.infoBody, { color: colors.textMuted }]}>Track all your transactions</Text>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {WITHDRAW_HISTORY.length === 0 ? (
                <View style={styles.emptyState}>
                  <Icon source={creditCardBold} size={30} color={colors.textMuted} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No Withdrawal History</Text>
                  <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
                    Your withdrawal requests will appear here
                  </Text>
                </View>
              ) : null}
            </View>
          </FadeUp>
        )}
      </ScrollView>

      <TopUpWalletModal visible={topUpOpen} onClose={() => setTopUpOpen(false)} onSubmit={() => setTopUpOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 20, paddingTop: 16 },
  title: { fontFamily: fonts.bold, fontSize: 24 },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },

  warningCard: { flexDirection: 'row', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 16 },
  warningText: { flex: 1 },
  warningTitle: { fontFamily: fonts.bold, fontSize: 14 },
  warningBody: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, marginTop: 4 },

  subTabs: { flexDirection: 'row', borderBottomWidth: 1, marginTop: 18 },
  subTab: { paddingHorizontal: 4, marginRight: 20, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  subTabText: { fontSize: 13 },

  statBox: { borderRadius: 14, padding: 16, marginTop: 16 },
  statBoxHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statBoxIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statBoxLabel: { fontFamily: fonts.bold, fontSize: 14 },
  statBoxValue: { fontFamily: fonts.bold, fontSize: 22, marginTop: 10 },
  statBoxNote: { fontFamily: fonts.regular, fontSize: 12, marginTop: 4 },
  topUpButton: { marginTop: 12 },

  infoCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 16 },
  infoTitle: { fontFamily: fonts.bold, fontSize: 14, marginTop: 8 },
  infoBody: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, marginTop: 4 },

  lockedCard: { borderRadius: 14, padding: 16, marginTop: 16 },
  lockIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  spaced: { marginTop: 14 },

  sectionTitle: { fontFamily: fonts.bold, fontSize: 16, marginTop: 20 },
  balanceCard: { borderRadius: 14, padding: 16, marginTop: 12 },
  balanceLabel: { fontFamily: fonts.regular, fontSize: 13 },
  balanceValue: { fontFamily: fonts.bold, fontSize: 26, marginTop: 4 },
  balanceDivider: { height: 1, marginVertical: 12 },
  balanceNote: { fontFamily: fonts.regular, fontSize: 12 },

  processRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  processText: { fontFamily: fonts.regular, fontSize: 13 },

  historyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  historyStat: { width: '48%', borderRadius: 12, borderWidth: 1, padding: 14 },
  historyStatHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyStatIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  historyStatCount: { fontFamily: fonts.bold, fontSize: 18 },
  historyStatLabel: { fontFamily: fonts.bold, fontSize: 14, marginTop: 8 },
  historyStatAmount: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },

  divider: { height: 1, marginVertical: 14 },
  emptyState: { alignItems: 'center', paddingVertical: 20, gap: 6 },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 14, marginTop: 6 },
  emptyBody: { fontFamily: fonts.regular, fontSize: 12 },
});
