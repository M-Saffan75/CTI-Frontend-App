import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AlertModal, { AlertModalType } from '@/components/AlertModal';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Input from '@/components/Input';
import KeyboardSafeView from '@/components/KeyboardSafeView';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PaginationFooter,
} from '@/components/states';
import {
  checkCircleIcon,
  clockBold,
  creditCardBold,
  exclamationCircleBold,
  lockBold,
  returnOfInvestmentIcon,
  settingsBold,
  shoppingBasketBold,
  timesSquareBold,
} from '@/assets/icons';
import { getWebRepairmanEarningsUrl } from '@/constants/config';
import repairmanApi, {
  MIN_WITHDRAWAL,
  WithdrawRecord,
  WithdrawStatus,
} from '@/roles/Repairman/api/repairmanApi';
import {
  markOffersChanged,
  subscribeOffersChanged,
  useOffersChangedChecker,
} from '@/roles/Repairman/utils/offerEvents';
import useApiData from '@/roles/Repairman/utils/useApiData';
import { openWebsite } from '@/roles/Seller/utils/sellerUtils';
import usePagedList from '@/roles/Seller/utils/usePagedList';
import { normalizeApiError } from '@/services/apiError';
import { formatDate } from '@/utils/dateFormat';
import { formatMoney } from '@/utils/money';
import useRefreshOnActive from '@/utils/useRefreshOnActive';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import {
  maskValue,
  parseAmount,
  WITHDRAW_FILTERS,
  withdrawLabel,
  withdrawTone,
} from '../utils/earnings';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

// tab ids; the shown text is repairmanMsg.earnTab.<id>
type TabKey = 'overview' | 'withdraw' | 'history';
const SUB_TABS: TabKey[] = ['overview', 'withdraw', 'history'];
const HISTORY_PAGE = 10;

function StatBox({
  label,
  value,
  note,
  children,
}: {
  label: string;
  value: string;
  note?: string;
  children?: ReactNode;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.statBox, { backgroundColor: colors.surfaceAlt }]}>
      <View style={styles.statBoxHead}>
        <View style={[styles.statBoxIcon, { backgroundColor: colors.surface }]}>
          <Icon source={creditCardBold} size={16} color={colors.primary} />
        </View>
        <Text style={[styles.statBoxLabel, { color: colors.textMuted }]}>
          {label}
        </Text>
      </View>
      <Text style={[styles.statBoxValue, { color: colors.text }]}>{value}</Text>
      {note ? (
        <Text style={[styles.statBoxNote, { color: colors.textMuted }]}>
          {note}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

function InfoCard({
  icon,
  title,
  body,
}: {
  icon: number;
  title: string;
  body: string;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.infoCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Icon source={icon} size={18} color={colors.primary} />
      <Text style={[styles.infoTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.infoBody, { color: colors.textMuted }]}>{body}</Text>
    </View>
  );
}

function HistoryStat({
  label,
  count,
  amount,
  icon,
  color,
  currency,
}: {
  label: string;
  count: number;
  amount: number;
  icon: number;
  color: string;
  currency: string;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.historyStat,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.historyStatHead}>
        <View
          style={[styles.historyStatIcon, { backgroundColor: color + '18' }]}
        >
          <Icon source={icon} size={14} color={color} />
        </View>
        <Text style={[styles.historyStatCount, { color: colors.text }]}>
          {count}
        </Text>
      </View>
      <Text style={[styles.historyStatLabel, { color: colors.text }]}>
        {label}
      </Text>
      <Text style={[styles.historyStatAmount, { color: colors.textMuted }]}>
        {formatMoney(amount, currency)}
      </Text>
    </View>
  );
}

function WithdrawRow({
  item,
  currency,
}: {
  item: WithdrawRecord;
  currency: string;
}) {
  const { colors } = useTheme();
  const tone = colors[withdrawTone(item.status)];

  return (
    <View
      style={[
        styles.historyRow,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.historyRowHead}>
        <Text style={[styles.historyAmount, { color: colors.text }]}>
          {formatMoney(item.amount, currency)}
        </Text>
        <View style={[styles.pill, { backgroundColor: tone + '22' }]}>
          <Text style={[styles.pillText, { color: tone }]}>
            {withdrawLabel(item.status)}
          </Text>
        </View>
      </View>
      <Text style={[styles.rowText, { color: colors.textMuted }]}>
        {i18n.t('repairmanMsg.requestedOn', { date: formatDate(item.requestedAt) })}
      </Text>
      {item.status === 'completed' && item.processedAt ? (
        <Text style={[styles.rowText, { color: colors.textMuted }]}>
          {i18n.t('repairmanMsg.paidOn', { date: formatDate(item.processedAt) })}
        </Text>
      ) : item.status !== 'rejected' && item.expectedReleaseDate ? (
        <Text style={[styles.rowText, { color: colors.textMuted }]}>
          {i18n.t('repairmanMsg.expectedBy', { date: formatDate(item.expectedReleaseDate) })}
        </Text>
      ) : null}
      {item.bankDetails ? (
        <Text style={[styles.rowText, { color: colors.textMuted }]}>
          {item.bankDetails.bankName} • {item.bankDetails.accountNumber}
        </Text>
      ) : null}
      {item.adminNote ? (
        <Text style={[styles.rowText, { color: colors.text }]}>
          {i18n.t('repairmanMsg.teamNote', { note: item.adminNote })}
        </Text>
      ) : null}
    </View>
  );
}

export default function EarningsContent({ navigation }: { navigation: any }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();

  const [tab, setTab] = useState<TabKey>('overview');
  const [historyOpened, setHistoryOpened] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<WithdrawStatus | ''>('');
  const [refreshing, setRefreshing] = useState(false);
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const busy = useRef(false);
  const [notice, setNotice] = useState<{
    type: AlertModalType;
    title: string;
    message: string;
  } | null>(null);

  const overview = useApiData(() => repairmanApi.getEarningsOverview(), []);

  const fetchHistory = useCallback(
    async (page: number) => {
      const data = await repairmanApi.getWithdrawHistory({
        page,
        limit: HISTORY_PAGE,
        status: historyFilter || undefined,
      });
      return {
        items: data.data,
        totalPages: data.meta.totalPages,
        totalItems: data.meta.total,
        extra: data.summary,
      };
    },
    [historyFilter],
  );
  const changed = useOffersChangedChecker();
  const history = usePagedList<
    WithdrawRecord,
    Record<WithdrawStatus, { count: number; amount: number }>
  >(fetchHistory, focused, historyOpened, changed);

  // Earnings change when a job is completed or confirmed, and the bank details change on the Banking screen:
  // reload the overview quietly when this tab is shown again (or at once if it is open)
  const overviewChanged = useOffersChangedChecker();
  const overviewReloadRef = useRef(overview.reload);
  overviewReloadRef.current = overview.reload;
  const focusedRef = useRef(focused);
  focusedRef.current = focused;
  const markLoaded = useRefreshOnActive(
    focused,
    () => {
      overviewReloadRef.current(true).then(markLoaded);
    },
    overviewChanged,
  );
  useEffect(() => {
    if (!overview.loading && overview.data) markLoaded();
  }, [overview.loading, overview.data, markLoaded]);
  useEffect(
    () =>
      subscribeOffersChanged(() => {
        if (focusedRef.current && overviewChanged())
          overviewReloadRef.current(true);
      }),
    [overviewChanged],
  );

  const wallet = overview.data?.wallet;
  const currency = wallet?.currency || 'TRY';
  const available = wallet?.availableBalance ?? 0;
  const bank = overview.data?.paymentInfo.bankDetails;
  const bankComplete = Boolean(
    overview.data?.paymentInfo.isPaymentInformationCompleted &&
      bank?.accountNumber,
  );
  const month = overview.data?.overview.thisMonth;
  const canWithdraw = bankComplete && available >= MIN_WITHDRAWAL;

  const openTab = (next: TabKey) => {
    setTab(next);
    if (next === 'history') setHistoryOpened(true);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const error = await overview.reload(true);
    if (tab === 'history') await history.onRefresh();
    setRefreshing(false);
    if (error)
      setNotice({
        type: 'error',
        title: i18n.t('customer.couldNotRefresh'),
        message: error.message,
      });
  };

  const openTopUp = async () => {
    if (!(await openWebsite(getWebRepairmanEarningsUrl()))) {
      setNotice({
        type: 'info',
        title: i18n.t('repairman.topUpOnTheWebsite'),
        message: i18n.t('settings.openAddress', { url: getWebRepairmanEarningsUrl() }),
      });
    }
  };

  const validateAmount = (): number | null => {
    const value = parseAmount(amount);
    if (!amount.trim() || !Number.isFinite(value) || value <= 0) {
      setAmountError(i18n.t('repairman.pleaseEnterAValidAmount'));
      return null;
    }
    if (value < MIN_WITHDRAWAL) {
      setAmountError(
        i18n.t('repairmanMsg.minWithdrawal', { amount: formatMoney(MIN_WITHDRAWAL, currency) }),
      );
      return null;
    }
    if (value > available) {
      setAmountError(
        i18n.t('repairmanMsg.insufficient', { amount: formatMoney(available, currency) }),
      );
      return null;
    }
    setAmountError('');
    return value;
  };

  const submitWithdraw = async () => {
    if (busy.current) return;
    const value = validateAmount();
    if (value === null) return;

    busy.current = true;
    setSubmitting(true);
    try {
      // Only the amount goes to the backend: it pays to the bank details saved on the Banking Information screen
      const { message } = await repairmanApi.requestWithdraw(value);
      setAmount('');
      setNotice({
        type: 'success',
        title: i18n.t('repairman.withdrawalRequested'),
        message: message || i18n.t('repairman.withdrawalRequestSubmittedSuccessfully'),
      });
      markOffersChanged();
      overview.reload(true);
      if (historyOpened) history.silentReload();
    } catch (e) {
      const error = normalizeApiError(e);
      setNotice({
        type: 'error',
        title: i18n.t('repairman.couldNotWithdraw'),
        message: error.message,
      });
      // the balance or the bank details may have changed: show the real numbers again
      overview.reload(true);
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  };

  const summary = history.extra;
  const historyStats = useMemo(
    () => [
      {
        label: i18n.t('repairman.requested'),
        key: 'requested' as const,
        icon: clockBold,
        color: colors.primary,
      },
      {
        label: i18n.t('repairman.processing'),
        key: 'processing' as const,
        icon: returnOfInvestmentIcon,
        color: colors.primary,
      },
      {
        label: i18n.t('repairman.completed'),
        key: 'completed' as const,
        icon: checkCircleIcon,
        color: colors.success,
      },
      {
        label: i18n.t('repairman.rejected'),
        key: 'rejected' as const,
        icon: timesSquareBold,
        color: colors.error,
      },
    ],
    [colors],
  );

  const header = (
    <View>
      <Text style={[styles.title, { color: colors.text }]}>{t('repairman.myEarnings')}</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        {t('repairman.trackYourIncomeWithdrawalsAnd')}
      </Text>

      {overview.data && !bankComplete ? (
        <View
          style={[
            styles.warningCard,
            { backgroundColor: colors.surface, borderColor: colors.primary },
          ]}
        >
          <Icon
            source={exclamationCircleBold}
            size={20}
            color={colors.primary}
          />
          <View style={styles.warningText}>
            <Text style={[styles.warningTitle, { color: colors.text }]}>
              {t('repairman.bankDetailsRequired')}
            </Text>
            <Text style={[styles.warningBody, { color: colors.textMuted }]}>
              {t('repairman.pleaseCompleteYourBankAccount')}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={[styles.subTabs, { borderColor: colors.border }]}>
        {SUB_TABS.map(item => {
          const active = item === tab;
          return (
            <TouchableOpacity key={item} onPress={() => openTab(item)}>
              <View
                style={[
                  styles.subTab,
                  active && { borderBottomColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.subTabText,
                    {
                      color: active ? colors.primary : colors.textMuted,
                      fontFamily: active ? fonts.bold : fonts.regular,
                    },
                  ]}
                >
                  {i18n.t(`repairmanMsg.earnTab.${item}`)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={[colors.primary]}
      tintColor={colors.primary}
    />
  );

  return (
    <KeyboardSafeView>
      {tab === 'history' ? (
        <FlatList
          data={history.items}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <WithdrawRow item={item} currency={currency} />
          )}
          ListHeaderComponent={
            <View>
              {header}
              <View style={styles.historyGrid}>
                {historyStats.map(stat => (
                  <HistoryStat
                    key={stat.key}
                    label={stat.label}
                    count={summary?.[stat.key]?.count ?? 0}
                    amount={summary?.[stat.key]?.amount ?? 0}
                    icon={stat.icon}
                    color={stat.color}
                    currency={currency}
                  />
                ))}
              </View>
              <View style={styles.filterRow}>
                {WITHDRAW_FILTERS.map(filter => {
                  const active = filter.value === historyFilter;
                  return (
                    <TouchableOpacity
                      key={filter.label}
                      onPress={() => setHistoryFilter(filter.value)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active
                            ? colors.primary
                            : colors.surfaceAlt,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: active ? colors.onPrimary : colors.textMuted,
                          },
                        ]}
                      >
                        {filter.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          }
          ListEmptyComponent={
            history.loading ? (
              <LoadingState
                fullScreen={false}
                text={t('repairman.loadingYourWithdrawals')}
              />
            ) : history.error ? (
              <ErrorState
                error={history.error}
                onRetry={history.retry}
                fullScreen={false}
              />
            ) : (
              <EmptyState
                fullScreen={false}
                title={t('repairman.noWithdrawalHistory')}
                message={t('repairman.yourWithdrawalRequestsWillAppear')}
                icon={creditCardBold}
              />
            )
          }
          ListFooterComponent={
            history.items.length > 0 ? (
              <PaginationFooter
                loading={history.loadingMore}
                hasMore={history.hasMore}
                endText={t('repairman.thatIsAll')}
              />
            ) : null
          }
          contentContainerStyle={[
            styles.body,
            { paddingBottom: insets.bottom + 30 },
          ]}
          showsVerticalScrollIndicator={false}
          onEndReached={history.onEndReached}
          onEndReachedThreshold={0.4}
          refreshControl={refreshControl}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.body,
            { paddingBottom: insets.bottom + 30 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
        >
          {header}

          {overview.loading && !overview.data ? (
            <LoadingState fullScreen={false} text={t('repairman.loadingYourEarnings')} />
          ) : overview.error && !overview.data ? (
            <ErrorState
              error={overview.error}
              onRetry={() => overview.reload()}
              fullScreen={false}
            />
          ) : tab === 'overview' ? (
            <View style={styles.section}>
              <StatBox
                label={t('repairman.availableBalance')}
                value={formatMoney(available, currency)}
                note={i18n.t('repairmanMsg.totalEarned', {
                  amount: formatMoney((wallet?.totalReleased ?? 0) + (wallet?.totalWithdrawn ?? 0), currency),
                })}
              >
                <View style={styles.buttons}>
                  <Button
                    title={t('repairman.topUp')}
                    color={colors.success}
                    icon={creditCardBold}
                    iconPosition="left"
                    onPress={openTopUp}
                    style={styles.flex}
                  />
                  {canWithdraw ? (
                    <Button
                      title={t('repairman.withdrawNow')}
                      variant="outline"
                      onPress={() => openTab('withdraw')}
                      style={styles.flex}
                    />
                  ) : null}
                </View>
                <Text style={[styles.hint, { color: colors.textMuted }]}>
                  {t('repairman.topUpIsDoneOn')}
                </Text>
              </StatBox>
              <StatBox
                label={t('repairman.pendingRelease')}
                value={formatMoney(wallet?.pendingAmount ?? 0, currency)}
                note="Awaiting customer closure"
              />
              <StatBox
                label={t('repairman.totalWithdrawn')}
                value={formatMoney(wallet?.totalWithdrawn ?? 0, currency)}
                note={
                  wallet && wallet.lockedAmount > 0
                    ? i18n.t('repairmanMsg.lockedAmount', { amount: formatMoney(wallet.lockedAmount, currency) })
                    : t('repairman.allClear')
                }
              />

              <View
                style={[
                  styles.monthCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.infoTitle, { color: colors.text }]}>
                  {t('repairman.thisMonthPerformance')}
                </Text>
                <View style={styles.monthRow}>
                  <View style={styles.monthItem}>
                    <Text style={[styles.monthValue, { color: colors.text }]}>
                      {formatMoney(month?.netEarning ?? 0, currency)}
                    </Text>
                    <Text
                      style={[styles.monthLabel, { color: colors.textMuted }]}
                    >
                      {t('repairman.netEarnings')}
                    </Text>
                  </View>
                  <View style={styles.monthItem}>
                    <Text style={[styles.monthValue, { color: colors.text }]}>
                      {month?.totalJobs ?? 0}
                    </Text>
                    <Text
                      style={[styles.monthLabel, { color: colors.textMuted }]}
                    >
                      {t('repairman.repairs')}
                    </Text>
                  </View>
                  <View style={styles.monthItem}>
                    <Text style={[styles.monthValue, { color: colors.text }]}>
                      {formatMoney(month?.avgPerJob ?? 0, currency)}
                    </Text>
                    <Text
                      style={[styles.monthLabel, { color: colors.textMuted }]}
                    >
                      {t('repairman.avgPerJob')}
                    </Text>
                  </View>
                </View>
              </View>

              <InfoCard
                icon={shoppingBasketBold}
                title={t('repairman.howPayoutsWork')}
                body="Earnings are released when the customer closes the job. Once released, you can withdraw anytime."
              />
              <InfoCard
                icon={clockBold}
                title={t('repairman.withdrawalLimit')}
                body={i18n.t('repairmanMsg.minProcessed', { amount: formatMoney(MIN_WITHDRAWAL, currency) })}
              />
            </View>
          ) : (
            <View style={styles.section}>
              {!bankComplete ? (
                <View
                  style={[
                    styles.lockedCard,
                    { backgroundColor: colors.surfaceAlt },
                  ]}
                >
                  <View
                    style={[
                      styles.lockIcon,
                      { backgroundColor: colors.error + '18' },
                    ]}
                  >
                    <Icon source={lockBold} size={20} color={colors.error} />
                  </View>
                  <Text style={[styles.infoTitle, { color: colors.text }]}>
                    {t('repairman.withdrawalUnavailable')}
                  </Text>
                  <Text style={[styles.infoBody, { color: colors.textMuted }]}>
                    {t('repairman.youMustCompleteYourBank')}
                  </Text>
                  <Button
                    title={t('repairman.addBankDetails')}
                    color={colors.error}
                    icon={settingsBold}
                    iconPosition="left"
                    onPress={() => navigation.navigate('BankingInformation')}
                    style={styles.spaced}
                  />
                </View>
              ) : null}

              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t('repairman.withdrawFunds')}
              </Text>
              <View
                style={[
                  styles.balanceCard,
                  { backgroundColor: colors.primary + '14' },
                ]}
              >
                <Text
                  style={[styles.balanceLabel, { color: colors.textMuted }]}
                >
                  {t('repairman.availableBalance')}
                </Text>
                <Text style={[styles.balanceValue, { color: colors.primary }]}>
                  {formatMoney(available, currency)}
                </Text>
                {bank?.accountNumber ? (
                  <Text
                    style={[styles.balanceNote, { color: colors.textMuted }]}
                  >
                    {i18n.t('repairmanMsg.toBank', { bank: bank.bankName, account: maskValue(bank.accountNumber, 0, 4) })}
                  </Text>
                ) : null}
              </View>

              <Input
                label={t('repairman.amount')}
                value={amount}
                onChangeText={text => {
                  setAmount(text);
                  setAmountError('');
                }}
                placeholder={i18n.t('repairmanMsg.minimumPlaceholder', { amount: MIN_WITHDRAWAL })}
                keyboardType="decimal-pad"
                editable={!submitting}
                error={amountError}
              />
              <TouchableOpacity
                disabled={available <= 0}
                onPress={() => {
                  setAmount(available.toFixed(2));
                  setAmountError('');
                }}
              >
                <Text style={[styles.link, { color: colors.primary }]}>
                  {i18n.t('repairmanMsg.withdrawAll', { amount: formatMoney(available, currency) })}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.hint, { color: colors.textMuted }]}>
                {i18n.t('repairmanMsg.minimumLine', { amount: formatMoney(MIN_WITHDRAWAL, currency) })}
              </Text>
              {bankComplete && available < MIN_WITHDRAWAL ? (
                <Text style={[styles.hint, { color: colors.error }]}>
                  {i18n.t('repairmanMsg.minimumRequired', { amount: formatMoney(MIN_WITHDRAWAL, currency) })}
                </Text>
              ) : null}

              <View
                style={[
                  styles.infoCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.infoTitle, { color: colors.text }]}>
                  {t('repairman.withdrawalProcess')}
                </Text>
                {[
                  i18n.t('repairmanMsg.payoutStep.submitted'),
                  i18n.t('repairmanMsg.payoutStep.approved'),
                  i18n.t('repairmanMsg.payoutStep.transferred'),
                ].map(step => (
                  <View key={step} style={styles.processRow}>
                    <Icon
                      source={checkCircleIcon}
                      size={14}
                      color={colors.success}
                    />
                    <Text
                      style={[styles.processText, { color: colors.textMuted }]}
                    >
                      {step}
                    </Text>
                  </View>
                ))}
              </View>

              <Button
                title={t('repairman.requestWithdrawal')}
                disabled={!canWithdraw}
                loading={submitting}
                onPress={submitWithdraw}
                style={styles.spaced}
              />
            </View>
          )}
        </ScrollView>
      )}

      <AlertModal
        visible={Boolean(notice) || Boolean(history.loadError)}
        type={notice?.type || 'error'}
        title={notice?.title || t('repairman.couldNotLoad')}
        message={notice?.message || history.loadError || ''}
        onClose={() => {
          setNotice(null);
          history.clearLoadError();
        }}
      />
    </KeyboardSafeView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { paddingHorizontal: 20, paddingTop: 16 },
  title: { fontFamily: fonts.bold, fontSize: 24 },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },
  section: { gap: 14, marginTop: 16 },
  warningCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 16,
  },
  warningText: { flex: 1, gap: 4 },
  warningTitle: { fontFamily: fonts.bold, fontSize: 14 },
  warningBody: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },
  subTabs: {
    flexDirection: 'row',
    gap: 18,
    borderBottomWidth: 1,
    marginTop: 20,
  },
  subTab: {
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabText: { fontSize: 13 },
  statBox: { borderRadius: 16, padding: 16, gap: 6 },
  statBoxHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statBoxIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBoxLabel: { fontFamily: fonts.medium, fontSize: 13 },
  statBoxValue: { fontFamily: fonts.bold, fontSize: 26 },
  statBoxNote: { fontFamily: fonts.regular, fontSize: 12 },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 10 },
  hint: { fontFamily: fonts.regular, fontSize: 11 },
  monthCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  monthRow: { flexDirection: 'row', gap: 8 },
  monthItem: { flex: 1, gap: 2 },
  monthValue: { fontFamily: fonts.bold, fontSize: 14 },
  monthLabel: { fontFamily: fonts.regular, fontSize: 11 },
  infoCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 6 },
  infoTitle: { fontFamily: fonts.bold, fontSize: 15 },
  infoBody: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  lockedCard: { borderRadius: 16, padding: 18, gap: 8, alignItems: 'center' },
  lockIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 18 },
  balanceCard: { borderRadius: 16, padding: 16, gap: 4 },
  balanceLabel: { fontFamily: fonts.regular, fontSize: 12 },
  balanceValue: { fontFamily: fonts.bold, fontSize: 26 },
  balanceNote: { fontFamily: fonts.regular, fontSize: 12 },
  link: { fontFamily: fonts.bold, fontSize: 13 },
  processRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  processText: { fontFamily: fonts.regular, fontSize: 13 },
  spaced: { marginTop: 4 },
  historyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  historyStat: {
    width: '47.5%',
    flexGrow: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  historyStatHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyStatIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyStatCount: { fontFamily: fonts.bold, fontSize: 18 },
  historyStatLabel: { fontFamily: fonts.medium, fontSize: 12 },
  historyStatAmount: { fontFamily: fonts.regular, fontSize: 11 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  chip: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { fontFamily: fonts.medium, fontSize: 12 },
  historyRow: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 12,
    gap: 3,
  },
  historyRowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyAmount: { fontFamily: fonts.bold, fontSize: 17 },
  pill: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontFamily: fonts.bold, fontSize: 11 },
  rowText: { fontFamily: fonts.regular, fontSize: 12 },
});
