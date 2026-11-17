import { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import Icon from '@/components/Icon';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import ConfirmModal from '@/components/ConfirmModal';
import { EmptyState, ErrorState, LoadingState, OfflineBanner, PaginationFooter } from '@/components/states';
import { creditCardBold, searchBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import AuthService from '@/services/authService';
import StatusPills from '@/roles/Seller/components/StatusPills';
import WithdrawModal from '../components/WithdrawModal';
import {
  cancelSellerWithdrawRequestApi,
  fetchSellerBankDetailsApi,
  fetchSellerEarningsApi,
  fetchSellerTransactionsApi,
  fetchSellerWalletApi,
  fetchSellerWithdrawRequestsApi,
  requestSellerWithdrawalApi,
  SellerBankDetails,
  SellerEarning,
  SellerTransaction,
  SellerWalletOverview,
  SellerWithdrawRequest,
} from '@/roles/Seller/services/sellerApi';
import {
  formatDate,
  formatDateTime,
  formatMoney,
  openSellerTab,
} from '@/roles/Seller/utils/sellerUtils';
import {
  AMBER,
  EARNING_STATUS_STYLE,
  getStatusStyle,
  transactionTypeLabel,
  WITHDRAW_STATUS_STYLE,
} from '@/roles/Seller/utils/statusStyles';
import { useOrdersChangedChecker } from '@/roles/Seller/utils/orderEvents';
import usePagedList from '@/roles/Seller/utils/usePagedList';
import useRefreshOnActive from '@/utils/useRefreshOnActive';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { statusLabel } from '@/utils/labels';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 500;

type WalletTab = 'earnings' | 'transactions' | 'withdrawals';

const TABS = [
  { id: 'earnings', get label() { return i18n.t('sellerAuto.paymentSummary'); } },
  { id: 'transactions', get label() { return i18n.t('sellerAuto.transactions'); } },
  { id: 'withdrawals', get label() { return i18n.t('sellerAuto.withdrawals'); } },
];

const EARNING_FILTERS = [
  { id: '', get label() { return i18n.t('sellerAuto.all'); } },
  { id: 'pending_release', get label() { return i18n.t('sellerAuto.onHold'); } },
  { id: 'available', get label() { return i18n.t('sellerAuto.available'); } },
  { id: 'withdrawn', get label() { return i18n.t('sellerAuto.withdrawn'); } },
];

// Type values the backend stores (the web filter list, with the hold value fixed)
const TRANSACTION_FILTERS = [
  { id: '', get label() { return i18n.t('sellerAuto.allTypes'); } },
  { id: 'refund', get label() { return i18n.t('glossary.refund'); } },
  { id: 'seller_earning_hold', get label() { return i18n.t('sellerAuto.hold'); } },
  { id: 'seller_earning_release', get label() { return i18n.t('sellerAuto.release'); } },
  { id: 'withdrawal_request', get label() { return i18n.t('seller.txType.WITHDRAWAL'); } },
  { id: 'shipping_fee', get label() { return i18n.t('sellerAuto.shippingFee'); } },
  { id: 'platform_fee', get label() { return i18n.t('sellerAuto.platformFee'); } },
];

interface AlertState {
  visible: boolean;
  type: AlertModalType;
  title: string;
  message: string;
}

const HIDDEN_ALERT: AlertState = { visible: false, type: 'info', title: '', message: '' };

const ItemSeparator = () => <View style={styles.separator} />;

export default function WalletScreen({ navigation, isActive = true }: any) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [overview, setOverview] = useState<SellerWalletOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewRefreshing, setOverviewRefreshing] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [bank, setBank] = useState<SellerBankDetails | null | undefined>(undefined);
  const [bankCheckFailed, setBankCheckFailed] = useState(false);
  const [sellerId, setSellerId] = useState('');
  const [userLoaded, setUserLoaded] = useState(false);

  const [tab, setTab] = useState<WalletTab>('earnings');
  const [visited, setVisited] = useState<WalletTab[]>(['earnings']);
  const [earningStatus, setEarningStatus] = useState('');
  const [earningSearchInput, setEarningSearchInput] = useState('');
  const [earningSearch, setEarningSearch] = useState('');
  const [txType, setTxType] = useState('');
  const [txSearchInput, setTxSearchInput] = useState('');
  const [txSearch, setTxSearch] = useState('');

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<SellerWithdrawRequest | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertState>(HIDDEN_ALERT);
  const mounted = useRef(true);

  const showAlert = (type: AlertModalType, title: string, message: string) =>
    setAlert({ visible: true, type, title, message });

  const loadOverviewRef = useRef<(mode: 'initial' | 'refresh' | 'silent') => void>(() => {});
  const overviewChanged = useOrdersChangedChecker();
  const earningsChanged = useOrdersChangedChecker();
  const markLoaded = useRefreshOnActive(isActive, () => loadOverviewRef.current('silent'), overviewChanged);

  const loadOverview = useCallback(
    async (mode: 'initial' | 'refresh' | 'silent') => {
      if (mode === 'refresh') setOverviewRefreshing(true);
      else if (mode === 'initial') {
        setOverviewLoading(true);
        setOverviewError(null);
      }
      try {
        const [data, bankDetails] = await Promise.all([
          fetchSellerWalletApi(),
          fetchSellerBankDetailsApi().catch(() => undefined),
        ]);
        if (!mounted.current) return;
        setOverview(data);
        setBank(bankDetails);
        setOverviewError(null);
        markLoaded();
      } catch (err: any) {
        if (!mounted.current || mode === 'silent') return;
        const message = err?.message || i18n.t('sellerAuto.couldNotLoadYourWallet');
        if (mode === 'initial') setOverviewError(message);
        else showAlert('error', i18n.t('customer.couldNotRefresh'), message);
      } finally {
        if (mounted.current) {
          setOverviewLoading(false);
          setOverviewRefreshing(false);
        }
      }
    },
    [markLoaded],
  );

  useEffect(() => {
    mounted.current = true;
    loadOverviewRef.current = loadOverview;
    loadOverview('initial');
    AuthService.getStoredUser().then(user => {
      if (!mounted.current) return;
      setSellerId(String(user?.id || user?._id || ''));
      setUserLoaded(true);
    });
    return () => {
      mounted.current = false;
    };
  }, [loadOverview]);

  useEffect(() => {
    const timer = setTimeout(() => setEarningSearch(earningSearchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [earningSearchInput]);

  useEffect(() => {
    const timer = setTimeout(() => setTxSearch(txSearchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [txSearchInput]);

  const fetchEarnings = useCallback(
    async (page: number) => {
      const res = await fetchSellerEarningsApi({
        page,
        limit: PAGE_SIZE,
        status: earningStatus,
        search: earningSearch,
      });
      return { items: res.earnings, totalPages: res.pagination.totalPages, totalItems: res.pagination.totalItems };
    },
    [earningStatus, earningSearch],
  );

  const fetchTransactions = useCallback(
    async (page: number) => {
      const res = await fetchSellerTransactionsApi(sellerId, {
        page,
        limit: PAGE_SIZE,
        type: txType,
        search: txSearch,
      });
      return {
        items: res.transactions,
        totalPages: res.pagination.totalPages,
        totalItems: res.pagination.totalItems,
      };
    },
    [sellerId, txType, txSearch],
  );

  const fetchWithdrawals = useCallback(async (page: number) => {
    const res = await fetchSellerWithdrawRequestsApi({ page, limit: PAGE_SIZE });
    return { items: res.requests, totalPages: res.pagination.totalPages, totalItems: res.pagination.totalItems };
  }, []);

  const earnings = usePagedList<SellerEarning>(
    fetchEarnings,
    isActive,
    visited.includes('earnings'),
    earningsChanged,
  );
  const transactions = usePagedList<SellerTransaction>(
    fetchTransactions,
    isActive,
    visited.includes('transactions') && userLoaded,
  );
  const withdrawals = usePagedList<SellerWithdrawRequest>(
    fetchWithdrawals,
    isActive,
    visited.includes('withdrawals'),
  );

  const selectTab = (next: string) => {
    const value = next as WalletTab;
    setTab(value);
    setVisited(prev => (prev.includes(value) ? prev : [...prev, value]));
  };

  const active = tab === 'earnings' ? earnings : tab === 'transactions' ? transactions : withdrawals;
  const overviewLoadingFirst = overviewLoading && !overview;

  const refreshAll = () => {
    loadOverview('refresh');
    active.onRefresh();
  };

  // A failed check is shown in the withdraw box with a retry, never as "no bank saved"
  const checkBank = () => {
    setBankCheckFailed(false);
    fetchSellerBankDetailsApi()
      .then(details => {
        if (mounted.current) setBank(details);
      })
      .catch(() => {
        if (!mounted.current) return;
        setBank(undefined);
        setBankCheckFailed(true);
      });
  };

  const openWithdraw = () => {
    if (overview?.activeRequest) {
      showAlert(
        'warning',
        i18n.t('sellerAuto.withdrawalAlreadyPending'),
        i18n.t('sellerAuto.youAlreadyHaveAPending'),
      );
      return;
    }
    setWithdrawOpen(true);
    checkBank();
  };

  const handleWithdraw = async (amount: number) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await requestSellerWithdrawalApi(amount);
      if (!mounted.current) return;
      setWithdrawOpen(false);
      showAlert('success', i18n.t('sellerAuto.withdrawalRequested'), res?.message || i18n.t('repairman.withdrawalRequestSubmittedSuccessfully'));
      loadOverview('silent');
      if (visited.includes('withdrawals')) withdrawals.silentReload();
      selectTab('withdrawals');
    } catch (err: any) {
      if (!mounted.current) return;
      setWithdrawOpen(false);
      showAlert('error', i18n.t('sellerAuto.requestFailed'), err?.message || i18n.t('sellerAuto.couldNotSubmitTheWithdrawal'));
    } finally {
      if (mounted.current) setSubmitting(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!cancelTarget || cancellingId) return;
    const target = cancelTarget;
    setCancelTarget(null);
    setCancellingId(target.id);
    try {
      const res = await cancelSellerWithdrawRequestApi(target.id);
      if (!mounted.current) return;
      showAlert('success', i18n.t('sellerAuto.requestCancelled'), res?.message || i18n.t('sellerAuto.withdrawalRequestCancelled'));
      loadOverview('silent');
      withdrawals.silentReload();
    } catch (err: any) {
      if (!mounted.current) return;
      showAlert('error', i18n.t('sellerAuto.couldNotCancel'), err?.message || i18n.t('sellerAuto.couldNotCancelTheWithdrawal'));
    } finally {
      if (mounted.current) setCancellingId(null);
    }
  };

  const renderEarning = (item: SellerEarning) => {
    const badge = getStatusStyle(EARNING_STATUS_STYLE, item.status);
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{item.orderNo || i18n.t('sellerMsg.wallet.orderFallback')}</Text>
          <View style={[styles.pill, { backgroundColor: badge.color + '20', borderColor: badge.color }]}>
            <Text style={[styles.pillText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>

        <View style={[styles.metricsRow, { backgroundColor: colors.surfaceAlt }]}>
          <Metric label={i18n.t('sellerAuto.grossAmount')} value={formatMoney(item.grossAmount)} />
          <Metric label={i18n.t('sellerAuto.platformFee2')} value={`-${formatMoney(item.platformFee)}`} danger />
          <Metric label={i18n.t('sellerAuto.netEarned')} value={formatMoney(item.amount)} bold />
        </View>

        {item.shippingDeduction > 0 ? (
          <Text style={[styles.dateText, { color: colors.textMuted }]}>
            {i18n.t('sellerMsg.wallet.shipDeducted', { amount: formatMoney(item.shippingDeduction) })}
          </Text>
        ) : null}
        <View style={styles.dateRow}>
          <Text style={[styles.dateText, { color: colors.textMuted }]}>
            {i18n.t('sellerMsg.wallet.delivered', { date: formatDate(item.deliveredAt) })}
          </Text>
          <Text style={[styles.dateText, { color: colors.textMuted }]}>
            {item.status === 'pending_release' ? i18n.t('sellerAuto.holdEnds') : i18n.t('sellerAuto.availableSince')}: {formatDate(item.availableAt)}
          </Text>
        </View>
      </View>
    );
  };

  const renderTransaction = (item: SellerTransaction) => {
    const color = item.incoming ? colors.success : colors.error;
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.pill, { backgroundColor: color + '20', borderColor: color }]}>
            <Text style={[styles.pillText, { color }]}>{transactionTypeLabel(item.type)}</Text>
          </View>
          <Text style={[styles.txAmount, { color }]}>
            {item.incoming ? '+' : '-'}
            {formatMoney(item.amount)}
          </Text>
        </View>
        {item.orderNo ? (
          <Text style={[styles.dateText, { color: colors.text }]}>{i18n.t('sellerMsg.wallet.orderNo', { no: item.orderNo })}</Text>
        ) : null}
        {item.description ? (
          <Text style={[styles.description, { color: colors.textMuted }]}>{item.description}</Text>
        ) : null}
        <Text style={[styles.dateText, { color: colors.textMuted }]}>{formatDateTime(item.createdAt)}</Text>
      </View>
    );
  };

  const renderWithdrawal = (item: SellerWithdrawRequest) => {
    const badge = getStatusStyle(WITHDRAW_STATUS_STYLE, item.status);
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{item.id.slice(-8).toUpperCase()}</Text>
          <View style={[styles.pill, { backgroundColor: badge.color + '20', borderColor: badge.color }]}>
            <Text style={[styles.pillText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>
        <Text style={[styles.wdAmount, { color: colors.text }]}>{formatMoney(item.amount)}</Text>
        <Text style={[styles.dateText, { color: colors.textMuted }]}>
          {item.bankName ? `${item.bankName} ` : ''}
          {item.accountLast4 ? `****${item.accountLast4}` : ''}
        </Text>
        <Text style={[styles.dateText, { color: colors.textMuted }]}>
          {i18n.t('sellerMsg.wallet.requested', { date: formatDateTime(item.createdAt) })}
        </Text>
        {item.processedAt ? (
          <Text style={[styles.dateText, { color: colors.textMuted }]}>
            {i18n.t('sellerMsg.wallet.processed', { date: formatDateTime(item.processedAt) })}
          </Text>
        ) : null}
        {item.adminNote ? (
          <Text style={[styles.description, { color: colors.textMuted }]}>{i18n.t('sellerMsg.wallet.note', { note: item.adminNote })}</Text>
        ) : null}
        {item.status === 'pending' ? (
          <Button
            title={i18n.t('sellerAuto.cancelRequest')}
            size="sm"
            variant="outline"
            color={colors.error}
            loading={cancellingId === item.id}
            disabled={!!cancellingId}
            onPress={() => setCancelTarget(item)}
          />
        ) : null}
      </View>
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    if (tab === 'earnings') return renderEarning(item);
    if (tab === 'transactions') return renderTransaction(item);
    return renderWithdrawal(item);
  };

  const searchBox = (value: string, onChange: (text: string) => void, placeholder: string) => (
    <View style={[styles.searchBar, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
      <Icon source={searchBold} size={16} color={colors.textMuted} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChange}
        returnKeyType="search"
        style={[styles.searchInput, { color: colors.text }]}
      />
    </View>
  );

  const header = overview ? (
    <View style={styles.headerWrap}>
      <View>
        <Text style={[styles.mainTitle, { color: colors.text }]}>{t('sellerAuto.walletAndPayouts')}</Text>
        <Text style={[styles.mainSub, { color: colors.textMuted }]}>
          {t('sellerAuto.yourEarningsBalanceAndWithdrawal')}
        </Text>
      </View>

      {overview.activeRequest ? (
        <View style={[styles.banner, { backgroundColor: AMBER + '20', borderColor: AMBER }]}>
          <Text style={[styles.bannerTitle, { color: colors.text }]}>{t('sellerAuto.withdrawalPendingApproval')}</Text>
          <Text style={[styles.bannerText, { color: colors.textMuted }]}>
            {i18n.t('sellerMsg.wallet.activeLine', { amount: formatMoney(overview.activeRequest.amount), date: formatDate(overview.activeRequest.createdAt), status: statusLabel(overview.activeRequest.status) })}
          </Text>
        </View>
      ) : null}

      <View style={styles.statGrid}>
        <StatCard label={t('sellerAuto.availableBalance')} value={formatMoney(overview.availableBalance)} sub="Ready to withdraw" />
        <StatCard
          label={t('sellerAuto.onHold2')}
          value={formatMoney(overview.pendingBalance)}
          sub={
            overview.holdDays === 0
              ? t('sellerAuto.releasesInstantlyInTestMode')
              : overview.nextReleaseAt
              ? i18n.t('sellerMsg.wallet.nextRelease', { date: formatDate(overview.nextReleaseAt) })
              : i18n.t('sellerMsg.wallet.releasesAfter', { days: overview.holdDays })
          }
        />
        <StatCard label={t('sellerAuto.totalEarned')} value={formatMoney(overview.totalEarnings)} sub={i18n.t('sellerMsg.wallet.lifetime')} />
        <StatCard label={t('sellerAuto.totalWithdrawn')} value={formatMoney(overview.totalWithdrawn)} sub="Successfully transferred" />
        <StatCard
          label={t('sellerAuto.shippingFeesPaid')}
          value={formatMoney(overview.totalShippingFees)}
          sub="Deducted from earnings"
        />
      </View>

      <View style={[styles.banner, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}>
        <Text style={[styles.bannerText, { color: colors.text }]}>
          {i18n.t('sellerMsg.wallet.howItWorks', { days: overview.holdDays, fees: formatMoney(overview.totalPlatformFees) })}
        </Text>
      </View>

      {overview.pendingBalance > 0 ? (
        <View style={[styles.banner, { backgroundColor: AMBER + '20', borderColor: AMBER }]}>
          <Text style={[styles.bannerTitle, { color: colors.text }]}>{t('sellerAuto.actionRequiredUploadInvoices')}</Text>
          <Text style={[styles.bannerText, { color: colors.textMuted }]}>
            {i18n.t('sellerMsg.wallet.onHoldNote', { amount: formatMoney(overview.pendingBalance) })}
          </Text>
          <Button
            title={t('sellerAuto.goToOrders')}
            size="sm"
            variant="outline"
            onPress={() => openSellerTab(navigation, 'OrderManagement')}
          />
        </View>
      ) : null}

      <Button title={t('sellerAuto.requestWithdrawal2')} size="lg" onPress={openWithdraw} />

      <StatusPills options={TABS} selected={tab} onSelect={selectTab} />

      {tab === 'earnings' ? (
        <>
          {searchBox(earningSearchInput, setEarningSearchInput, i18n.t('sellerMsg.wallet.searchOrder'))}
          <StatusPills options={EARNING_FILTERS} selected={earningStatus} onSelect={setEarningStatus} />
        </>
      ) : null}
      {tab === 'transactions' ? (
        <>
          {searchBox(txSearchInput, setTxSearchInput, i18n.t('sellerMsg.wallet.searchOrderDesc'))}
          <StatusPills options={TRANSACTION_FILTERS} selected={txType} onSelect={setTxType} />
        </>
      ) : null}
    </View>
  ) : null;

  let body: ReactElement | null = null;
  if (active.loading && active.items.length === 0) {
    body = <LoadingState text={t('common.loading')} style={styles.stateWrap} />;
  } else if (active.error && active.items.length === 0) {
    body = <ErrorState error={active.error} onRetry={active.retry} style={styles.stateWrap} />;
  } else if (active.items.length === 0) {
    const emptyText: Record<WalletTab, [string, string]> = {
      earnings: [i18n.t('sellerMsg.wallet.emptyEarningsTitle'), i18n.t('sellerMsg.wallet.emptyEarningsBody')],
      transactions: [i18n.t('sellerMsg.wallet.emptyTxTitle'), i18n.t('sellerMsg.wallet.emptyTxBody')],
      withdrawals: [i18n.t('sellerMsg.wallet.emptyWdTitle'), i18n.t('sellerMsg.wallet.emptyWdBody')],
    };
    body = (
      <EmptyState
        icon={creditCardBold}
        title={emptyText[tab][0]}
        message={emptyText[tab][1]}
        style={styles.stateWrap}
      />
    );
  }

  if (overviewLoadingFirst) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <LoadingState text={t('sellerAuto.loadingWallet')} fullScreen />
      </View>
    );
  }

  if (!overview) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ErrorState
          error={overviewError || t('sellerAuto.couldNotLoadYourWallet2')}
          onRetry={() => loadOverview('initial')}
          fullScreen
        />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <OfflineBanner />
      <FlatList
        data={active.items as any[]}
        keyExtractor={(item: any) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={body}
        ListFooterComponent={<PaginationFooter loading={active.loadingMore} hasMore={active.hasMore} />}
        ItemSeparatorComponent={ItemSeparator}
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onEndReached={active.onEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={active.refreshing || overviewRefreshing}
            onRefresh={refreshAll}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />

      <WithdrawModal
        visible={withdrawOpen}
        available={overview.availableBalance}
        bank={bank}
        bankCheckFailed={bankCheckFailed}
        onRetryBank={checkBank}
        submitting={submitting}
        onSubmit={handleWithdraw}
        onClose={() => setWithdrawOpen(false)}
        onAddBank={() => {
          setWithdrawOpen(false);
          navigation?.navigate('Profile', { editSection: 'bank', at: Date.now() });
        }}
      />

      <ConfirmModal
        visible={!!cancelTarget}
        title={t('sellerAuto.cancelWithdrawal')}
        message={t('sellerAuto.cancelThisWithdrawalRequestThe')}
        confirmText={t('sellerAuto.yesCancelIt')}
        cancelText={t('sellerAuto.keepIt')}
        danger
        onConfirm={handleCancelRequest}
        onCancel={() => setCancelTarget(null)}
      />

      <AlertModal
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert(HIDDEN_ALERT)}
      />
      <AlertModal
        visible={!!active.loadError}
        type="error"
        title={t('sellerAuto.couldNotLoadTheList')}
        message={active.loadError || ''}
        onClose={active.clearLoadError}
      />
    </View>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  const { colors } = useTheme();
  useTranslation();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statSub, { color: colors.textMuted }]}>{sub}</Text>
    </View>
  );
}

function Metric({ label, value, bold, danger }: { label: string; value: string; bold?: boolean; danger?: boolean }) {
  const { colors } = useTheme();
  useTranslation();
  return (
    <View style={styles.metricCol}>
      <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text
        style={[
          bold ? styles.metricValBold : styles.metricVal,
          { color: danger ? colors.error : colors.text },
        ]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { paddingHorizontal: 16, paddingTop: 14, flexGrow: 1 },
  separator: { height: 14 },
  stateWrap: { paddingVertical: 40 },
  headerWrap: { gap: 12, marginBottom: 14 },
  mainTitle: { fontFamily: fonts.bold, fontSize: 26 },
  mainSub: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },
  banner: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  bannerTitle: { fontFamily: fonts.bold, fontSize: 14 },
  bannerText: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { flexGrow: 1, flexBasis: '45%', borderRadius: 14, borderWidth: 1, padding: 14, gap: 4 },
  statLabel: { fontFamily: fonts.medium, fontSize: 12 },
  statValue: { fontFamily: fonts.bold, fontSize: 17 },
  statSub: { fontFamily: fonts.regular, fontSize: 11 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 13, padding: 0 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 15 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  pillText: { fontFamily: fonts.medium, fontSize: 11 },
  metricsRow: { flexDirection: 'row', borderRadius: 12, padding: 12, gap: 8 },
  metricCol: { flex: 1, gap: 4 },
  metricLabel: { fontFamily: fonts.regular, fontSize: 11 },
  metricVal: { fontFamily: fonts.medium, fontSize: 13 },
  metricValBold: { fontFamily: fonts.bold, fontSize: 13 },
  dateRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 6 },
  dateText: { fontFamily: fonts.regular, fontSize: 12 },
  description: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },
  txAmount: { fontFamily: fonts.bold, fontSize: 15 },
  wdAmount: { fontFamily: fonts.bold, fontSize: 18 },
});
