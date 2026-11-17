import { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import Icon from '@/components/Icon';
import ProductThumb from '@/components/ProductThumb';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import { EmptyState, ErrorState, LoadingState, OfflineBanner, PaginationFooter } from '@/components/states';
import { packageBold, searchBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import ReasonModal from '@/roles/Seller/components/ReasonModal';
import SellerScreenHeader from '@/roles/Seller/components/SellerScreenHeader';
import StatusPills from '@/roles/Seller/components/StatusPills';
import {
  approveSellerReturnApi,
  fetchSellerReturnsApi,
  rejectSellerReturnApi,
  SellerReturn,
  SellerReturnsPage,
} from '@/roles/Seller/services/sellerApi';
import { formatDate, formatMoney } from '@/roles/Seller/utils/sellerUtils';
import {
  getStatusStyle,
  PAYMENT_STATUS_STYLE,
  RETURN_STATUS_STYLE,
} from '@/roles/Seller/utils/statusStyles';
import { markSellerDataChanged } from '@/roles/Seller/utils/orderEvents';
import usePagedList from '@/roles/Seller/utils/usePagedList';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 500;

interface AlertState {
  visible: boolean;
  type: AlertModalType;
  title: string;
  message: string;
}

const HIDDEN_ALERT: AlertState = { visible: false, type: 'info', title: '', message: '' };

const ItemSeparator = () => <View style={styles.separator} />;

// Same numbers as the web approve box
function refundNumbers(ret: SellerReturn) {
  const amountToCut = Math.max(0, ret.sellerEarnings - ret.shippingDeduction);
  return { amountToCut, totalRefund: amountToCut + ret.platformFee };
}

export default function ReturnRequestsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [details, setDetails] = useState<SellerReturn | null>(null);
  const [approveTarget, setApproveTarget] = useState<SellerReturn | null>(null);
  const [rejectTarget, setRejectTarget] = useState<SellerReturn | null>(null);
  const [acting, setActing] = useState(false);
  const [alert, setAlert] = useState<AlertState>(HIDDEN_ALERT);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchPage = useCallback(
    async (page: number) => {
      const res = await fetchSellerReturnsApi({ page, limit: PAGE_SIZE, status, search });
      return {
        items: res.returns,
        totalPages: res.pagination.totalPages,
        totalItems: res.pagination.totalItems,
        extra: res.summary,
      };
    },
    [status, search],
  );

  const list = usePagedList<SellerReturn, SellerReturnsPage['summary']>(fetchPage);
  const summary = list.extra;

  const tabs = [
    { id: '', label: t('sellerAuto.allReturns'), count: summary?.total },
    { id: 'requested', label: t('sellerAuto.newRequests'), count: summary?.requested },
    { id: 'shipped', label: t('sellerAuto.shippedBack'), count: summary?.shipped },
    { id: 'approved', label: t('profile.status.approved'), count: summary?.approved },
    { id: 'rejected', label: t('chat.quoteStatus.rejected'), count: summary?.rejected },
  ];
  const hasFilters = !!(status || search);

  const showAlert = (type: AlertModalType, title: string, message: string) =>
    setAlert({ visible: true, type, title, message });

  const runAction = async (
    action: () => Promise<{ message?: string }>,
    successTitle: string,
    fallbackMessage: string,
    failTitle: string,
    onDone: () => void,
  ) => {
    setActing(true);
    try {
      const res = await action();
      if (!mounted.current) return;
      setApproveTarget(null);
      setRejectTarget(null);
      onDone();
      markSellerDataChanged();
      showAlert('success', successTitle, res?.message || fallbackMessage);
      list.silentReload();
    } catch (err: any) {
      if (!mounted.current) return;
      setApproveTarget(null);
      setRejectTarget(null);
      showAlert('error', failTitle, err?.message || i18n.t('sellerAuto.somethingWentWrongPleaseTry'));
      list.silentReload();
    } finally {
      if (mounted.current) setActing(false);
    }
  };

  // The card changes at once; a status filter that no longer matches drops it
  const showNewStatus = (id: string, next: string) => {
    if (status && status !== next) list.removeItem(item => item.id === id);
    else list.updateItem(item => item.id === id, { status: next });
  };

  const handleApprove = (note: string) => {
    if (!approveTarget) return;
    const id = approveTarget.id;
    runAction(() => approveSellerReturnApi(id, note), i18n.t('sellerMsg.ret.approved'), i18n.t('sellerMsg.ret.approved'), i18n.t('sellerMsg.ret.approveFailed'), () =>
      showNewStatus(id, 'approved'),
    );
  };

  const handleReject = (reason: string) => {
    if (!rejectTarget) return;
    const id = rejectTarget.id;
    runAction(() => rejectSellerReturnApi(id, reason), i18n.t('sellerMsg.ret.rejected'), i18n.t('sellerMsg.ret.rejected'), i18n.t('sellerMsg.ret.rejectFailed'), () =>
      showNewStatus(id, 'rejected'),
    );
  };

  const renderReturn = ({ item }: { item: SellerReturn }) => {
    const badge = getStatusStyle(RETURN_STATUS_STYLE, item.status);
    const canDecide = item.status === 'requested' || item.status === 'shipped';
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.flex1}>
            <Text style={[styles.returnNo, { color: colors.text }]}>{item.returnNo}</Text>
            <Text style={[styles.subText, { color: colors.textMuted }]}>
              {i18n.t('sellerMsg.ret.orderDate', { no: item.orderNo || '-', date: formatDate(item.createdAt) })}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: badge.color + '20' }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Row label={i18n.t('glossary.customer')} value={item.customer || '-'} />
        <Row label={i18n.t('tabs.product')} value={item.product || '-'} />
        <Row label={i18n.t('sellerAuto.reason')} value={item.reason || '-'} />
        <Row label={i18n.t('sellerAuto.price')} value={formatMoney(item.price)} />
        <Row label={i18n.t('sellerAuto.yourCut')} value={formatMoney(item.sellerEarnings)} />
        {item.status === 'rejected' && item.rejectionReason ? (
          <Row label={i18n.t('sellerAuto.rejectedBecause')} value={item.rejectionReason} />
        ) : null}

        <View style={styles.actions}>
          <Button
            title={i18n.t('sellerAuto.details')}
            size="sm"
            variant="outline"
            fullWidth={false}
            style={styles.actionBtn}
            onPress={() => setDetails(item)}
          />
          {canDecide ? (
            <>
              <Button
                title={i18n.t('sellerAuto.approve')}
                size="sm"
                fullWidth={false}
                style={styles.actionBtn}
                onPress={() => setApproveTarget(item)}
              />
              <Button
                title={i18n.t('sellerAuto.reject')}
                size="sm"
                variant="outline"
                color={colors.error}
                fullWidth={false}
                style={styles.actionBtn}
                onPress={() => setRejectTarget(item)}
              />
            </>
          ) : null}
        </View>
      </View>
    );
  };

  const header = (
    <View style={styles.headerWrap}>
      <SellerScreenHeader
        title={t('seller.dashboard.returnRequests')}
        subtitle={t('sellerAuto.reviewAndRespondToCustomer')}
        onBack={() => navigation?.goBack()}
      />

      <StatusPills options={tabs} selected={status} onSelect={setStatus} />

      <View style={[styles.searchBar, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
        <Icon source={searchBold} size={16} color={colors.textMuted} />
        <TextInput
          placeholder={t('sellerAuto.searchReturnOrderCustomerOr')}
          placeholderTextColor={colors.textMuted}
          value={searchInput}
          onChangeText={setSearchInput}
          returnKeyType="search"
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>
    </View>
  );

  let body: ReactElement | null = null;
  if (list.loading && list.items.length === 0) {
    body = <LoadingState text={t('sellerAuto.loadingReturns')} style={styles.stateWrap} />;
  } else if (list.error && list.items.length === 0) {
    body = <ErrorState error={list.error} onRetry={list.retry} style={styles.stateWrap} />;
  } else if (list.items.length === 0) {
    body = (
      <EmptyState
        icon={packageBold}
        title={t('sellerAuto.noReturnsFound')}
        message={hasFilters ? t('sellerAuto.noReturnsMatchYourSearch') : t('sellerAuto.youHaveNoReturnRequests')}
        style={styles.stateWrap}
      />
    );
  }

  const approveNumbers = approveTarget ? refundNumbers(approveTarget) : null;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
      <OfflineBanner />
      <FlatList
        data={list.items}
        keyExtractor={item => item.id}
        renderItem={renderReturn}
        ListHeaderComponent={header}
        ListEmptyComponent={body}
        ListFooterComponent={<PaginationFooter loading={list.loadingMore} hasMore={list.hasMore} />}
        ItemSeparatorComponent={ItemSeparator}
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onEndReached={list.onEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={list.refreshing}
            onRefresh={list.onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />

      <ReasonModal
        visible={!!approveTarget}
        title={t('sellerAuto.approveReturn')}
        message={
          approveNumbers
            ? i18n.t('sellerMsg.ret.approveNote', { cut: formatMoney(approveNumbers.amountToCut), refund: formatMoney(approveNumbers.totalRefund), fee: formatMoney(approveTarget?.platformFee) })
            : ''
        }
        placeholder={t('sellerAuto.notesOptional')}
        confirmText={t('sellerAuto.approve')}
        loading={acting}
        onConfirm={handleApprove}
        onCancel={() => setApproveTarget(null)}
      />

      <ReasonModal
        visible={!!rejectTarget}
        title={t('sellerAuto.rejectReturn')}
        message={t('sellerAuto.tellTheCustomerWhyThis')}
        placeholder={t('sellerAuto.explainWhyYouAreRejecting')}
        confirmText={t('sellerAuto.reject')}
        required
        danger
        loading={acting}
        onConfirm={handleReject}
        onCancel={() => setRejectTarget(null)}
      />

      <DetailsModal ret={details} onClose={() => setDetails(null)} />

      <AlertModal
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert(HIDDEN_ALERT)}
      />
      <AlertModal
        visible={!!list.loadError}
        type="error"
        title={t('sellerAuto.couldNotLoadReturns')}
        message={list.loadError || ''}
        onClose={list.clearLoadError}
      />
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  useTranslation();
  return (
    <View style={styles.dataRow}>
      <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function DetailsModal({ ret, onClose }: { ret: SellerReturn | null; onClose: () => void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  if (!ret) return null;
  const numbers = refundNumbers(ret);
  const payment = getStatusStyle(PAYMENT_STATUS_STYLE, ret.paymentStatus);
  const badge = getStatusStyle(RETURN_STATUS_STYLE, ret.status);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.modalBackdrop, { backgroundColor: colors.backdrop }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.modalCard, { backgroundColor: colors.surface, marginBottom: insets.bottom + 12 }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>{ret.returnNo}</Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
            <Row label={t('sellerAuto.status')} value={badge.label} />
            <Row label={t('glossary.order')} value={ret.orderNo || '-'} />
            <Row label={t('glossary.customer')} value={ret.customer || '-'} />
            <Row label={t('tabs.product')} value={ret.product || '-'} />
            {ret.barcode ? <Row label={t('sellerAuto.barcode')} value={ret.barcode} /> : null}
            <Row label={t('sellerAuto.quantity')} value={String(ret.quantity)} />
            <Row label={t('sellerAuto.price')} value={formatMoney(ret.price)} />
            <Row label={t('sellerAuto.platformFee')} value={formatMoney(ret.platformFee)} />
            <Row label={t('sellerAuto.netEarningsDeduction')} value={formatMoney(numbers.amountToCut)} />
            <Row label={t('sellerAuto.customerRefund')} value={formatMoney(numbers.totalRefund)} />
            <Row label={t('sellerAuto.refundStatus')} value={payment.label} />
            {ret.trackingNumber ? <Row label={t('sellerAuto.returnTracking')} value={ret.trackingNumber} /> : null}
            <Row label={t('sellerAuto.created')} value={formatDate(ret.createdAt)} />
            {ret.approvedAt ? <Row label={t('profile.status.approved')} value={formatDate(ret.approvedAt)} /> : null}
            {ret.rejectedAt ? <Row label={t('chat.quoteStatus.rejected')} value={formatDate(ret.rejectedAt)} /> : null}
            <Row label={t('sellerAuto.reason')} value={ret.reason || '-'} />
            {ret.adminNotes ? <Row label={t('sellerAuto.notes')} value={ret.adminNotes} /> : null}
            {ret.rejectionReason ? <Row label={t('sellerAuto.rejectionReason')} value={ret.rejectionReason} /> : null}

            {ret.images.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
                {ret.images.map(uri => (
                  <ProductThumb key={uri} uri={uri} size={80} />
                ))}
              </ScrollView>
            ) : null}
          </ScrollView>
          <Button title={t('common.close')} size="md" variant="soft" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex1: { flex: 1 },
  container: { paddingHorizontal: 16, paddingTop: 6, flexGrow: 1 },
  separator: { height: 14 },
  stateWrap: { paddingVertical: 40 },
  headerWrap: { gap: 12, marginBottom: 14 },
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
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  returnNo: { fontFamily: fonts.bold, fontSize: 15 },
  subText: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontFamily: fonts.bold, fontSize: 11 },
  divider: { height: 1 },
  dataRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  rowLabel: { fontFamily: fonts.regular, fontSize: 13 },
  rowValue: { flex: 1, textAlign: 'right', fontFamily: fonts.medium, fontSize: 13 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  actionBtn: { flexGrow: 1, flexBasis: 90 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', padding: 12 },
  modalCard: { maxHeight: '85%', borderRadius: 20, padding: 18, gap: 12 },
  modalTitle: { fontFamily: fonts.bold, fontSize: 17 },
  modalBody: { gap: 10 },
  imageRow: { gap: 8, paddingTop: 4 },
});
