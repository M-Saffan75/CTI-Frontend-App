import { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import ProductThumb from '@/components/ProductThumb';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import ConfirmModal from '@/components/ConfirmModal';
import { EmptyState, ErrorState, LoadingState, OfflineBanner, PaginationFooter } from '@/components/states';
import { tagBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { getWebSellerAdEditUrl } from '@/constants/config';
import StatusPills from '@/roles/Seller/components/StatusPills';
import {
  fetchSellerAdsSummaryApi,
  fetchSellerCampaignsApi,
  runSellerCampaignActionApi,
  SellerAdCampaign,
  SellerAdsSummary,
} from '@/roles/Seller/services/sellerApi';
import { consumeAdsDirty, formatDate, formatMoney, openWebsite } from '@/roles/Seller/utils/sellerUtils';
import { AD_STATUS_STYLE, getStatusStyle } from '@/roles/Seller/utils/statusStyles';
import usePagedList from '@/roles/Seller/utils/usePagedList';
import { getLocaleTag } from '@/i18n/locale';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

const PAGE_SIZE = 10;

const STATUS_FILTERS = [
  { id: '', get label() { return i18n.t('sellerAuto.all'); } },
  { id: 'active', get label() { return i18n.t('profile.status.active'); } },
  { id: 'pending_approval', get label() { return i18n.t('sellerAuto.underReview'); } },
  { id: 'paused', get label() { return i18n.t('sellerAuto.paused'); } },
  { id: 'draft', get label() { return i18n.t('sellerAuto.draft'); } },
  { id: 'rejected', get label() { return i18n.t('chat.quoteStatus.rejected'); } },
  { id: 'completed', get label() { return i18n.t('sellerAuto.completed'); } },
];

type AdAction = 'pause' | 'resume' | 'submit' | 'delete';

const ACTION_TEXT: Record<AdAction, { title: string; message: string; confirm: string; danger?: boolean }> = {
  pause: {
    get title() { return i18n.t('sellerAuto.pauseCampaign'); },
    get message() { return i18n.t('sellerAuto.yourAdsStopShowingUntil'); },
    confirm: 'Pause',
  },
  resume: {
    get title() { return i18n.t('sellerAuto.resumeCampaign'); },
    get message() { return i18n.t('sellerAuto.yourAdsStartShowingAgain'); },
    confirm: 'Resume',
  },
  submit: {
    get title() { return i18n.t('sellerAuto.submitForApproval'); },
    get message() { return i18n.t('sellerAuto.theCampaignGoesToThe'); },
    confirm: 'Submit',
  },
  delete: {
    get title() { return i18n.t('sellerAuto.deleteCampaign'); },
    get message() { return i18n.t('sellerAuto.thisRemovesTheCampaignThis'); },
    confirm: 'Delete',
    danger: true,
  },
};

const DONE_TITLE: Record<AdAction, string> = {
  get pause() { return i18n.t('sellerMsg.adDone.pause'); },
  get resume() { return i18n.t('sellerMsg.adDone.resume'); },
  get submit() { return i18n.t('sellerMsg.adDone.submit'); },
  get delete() { return i18n.t('sellerMsg.adDone.delete'); },
};

interface AlertState {
  visible: boolean;
  type: AlertModalType;
  title: string;
  message: string;
}

const HIDDEN_ALERT: AlertState = { visible: false, type: 'info', title: '', message: '' };

const ItemSeparator = () => <View style={styles.separator} />;

function DataRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  useTranslation();
  return (
    <View style={styles.dataRow}>
      <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

export default function AdsScreen({ navigation, isActive = true }: any) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [status, setStatus] = useState('');
  const [pending, setPending] = useState<{ ad: SellerAdCampaign; action: AdAction } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [summary, setSummary] = useState<SellerAdsSummary | null>(null);
  const [alert, setAlert] = useState<AlertState>(HIDDEN_ALERT);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const fetchPage = useCallback(
    async (page: number) => {
      const [res, totals] = await Promise.all([
        fetchSellerCampaignsApi({ page, limit: PAGE_SIZE, status }),
        page === 1 ? fetchSellerAdsSummaryApi().catch(() => null) : Promise.resolve(null),
      ]);
      if (totals && mounted.current) setSummary(totals);
      return {
        items: res.campaigns,
        totalPages: res.pagination.totalPages,
        totalItems: res.pagination.totalItems,
      };
    },
    [status],
  );

  const list = usePagedList<SellerAdCampaign>(fetchPage, isActive, true, consumeAdsDirty);

  const runAction = async () => {
    if (!pending || busyId) return;
    const { ad, action } = pending;
    setBusyId(ad.id);
    try {
      const res = await runSellerCampaignActionApi(ad.id, action);
      if (!mounted.current) return;
      setPending(null);
      if (action === 'delete') {
        list.removeItem(item => item.id === ad.id);
      } else if (res.campaign && status && res.campaign.status !== status) {
        list.removeItem(item => item.id === ad.id);
      } else if (res.campaign) {
        list.updateItem(item => item.id === ad.id, {
          status: res.campaign.status,
          rejectionReason: res.campaign.rejectionReason,
        });
      }
      fetchSellerAdsSummaryApi()
        .then(totals => mounted.current && setSummary(totals))
        .catch(() => {});
      setAlert({
        visible: true,
        type: 'success',
        title: DONE_TITLE[action],
        message: res.message || i18n.t('sellerMsg.done'),
      });
    } catch (err: any) {
      if (!mounted.current) return;
      setPending(null);
      list.silentReload();
      setAlert({
        visible: true,
        type: 'error',
        title: i18n.t('sellerAuto.actionFailed'),
        message: err?.message || i18n.t('sellerAuto.couldNotUpdateThisCampaign'),
      });
    } finally {
      if (mounted.current) setBusyId(null);
    }
  };

  const renderAd = ({ item }: { item: SellerAdCampaign }) => {
    const badge = getStatusStyle(AD_STATUS_STYLE, item.status);
    const busy = busyId === item.id;
    const canDelete = item.status !== 'active' && item.status !== 'pending_approval';
    const canSubmit = (item.status === 'draft' || item.status === 'rejected') && !!item.cardLabel;
    const canEdit = item.status === 'draft' || item.status === 'rejected';
    const canResume = item.status === 'paused' && item.remainingBudget > 0;

    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardTop}>
          <ProductThumb uri={item.bannerUrl} size={48} />
          <View style={styles.flex1}>
            <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
            <Text style={[styles.sub, { color: colors.textMuted }]}>
              {item.type === 'sponsored_store' ? i18n.t('sellerAuto.sponsoredStore') : i18n.t('sellerAuto.sponsoredProducts')}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: badge.color + '20' }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>

        <DataRow label={i18n.t('sellerAuto.runs')} value={`${formatDate(item.startDate)} - ${formatDate(item.endDate)}`} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <DataRow label={i18n.t('sellerAuto.totalBudget')} value={formatMoney(item.totalBudget)} />
        <DataRow label={i18n.t('sellerAuto.dailyBudget')} value={formatMoney(item.dailyBudget)} />
        <DataRow label={i18n.t('sellerAuto.spent')} value={formatMoney(item.spentBudget)} />
        <DataRow label={i18n.t('sellerAuto.remaining')} value={formatMoney(item.remainingBudget)} />
        <DataRow label={i18n.t('sellerAuto.bidding')} value={item.biddingType || '-'} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <DataRow label={i18n.t('sellerAuto.impressions')} value={item.impressions.toLocaleString(getLocaleTag())} />
        <DataRow label={i18n.t('sellerAuto.clicks')} value={item.clicks.toLocaleString(getLocaleTag())} />
        {item.cardLabel ? <DataRow label={i18n.t('sellerAuto.card')} value={item.cardLabel} /> : null}
        {item.products.length > 0 ? (
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            {i18n.t('sellerMsg.adProducts', { list: item.products.slice(0, 3).join(', ') })}
            {item.products.length > 3 ? i18n.t('sellerMsg.moreSuffix', { count: item.products.length - 3 }) : ''}
          </Text>
        ) : null}

        {item.status === 'rejected' && item.rejectionReason ? (
          <Text style={[styles.note, { color: colors.error }]}>{i18n.t('sellerMsg.rejectedLine', { reason: item.rejectionReason })}</Text>
        ) : null}
        {item.status === 'paused' && !canResume ? (
          <Text style={[styles.note, { color: colors.textMuted }]}>{i18n.t('sellerAuto.noBudgetLeftAddBudget')}</Text>
        ) : null}
        {canEdit && !item.cardLabel ? (
          <Text style={[styles.note, { color: colors.textMuted }]}>
            {i18n.t('sellerAuto.chooseACardOnThe')}
          </Text>
        ) : null}

        <View style={styles.actions}>
          {item.status === 'active' ? (
            <Button
              title={i18n.t('sellerAuto.pause')}
              size="sm"
              variant="outline"
              fullWidth={false}
              style={styles.action}
              disabled={busy}
              onPress={() => setPending({ ad: item, action: 'pause' })}
            />
          ) : null}
          {canResume ? (
            <Button
              title={i18n.t('sellerAuto.resume')}
              size="sm"
              fullWidth={false}
              style={styles.action}
              disabled={busy}
              onPress={() => setPending({ ad: item, action: 'resume' })}
            />
          ) : null}
          {canSubmit ? (
            <Button
              title={i18n.t('sellerAuto.submitForApproval2')}
              size="sm"
              fullWidth={false}
              style={styles.action}
              disabled={busy}
              onPress={() => setPending({ ad: item, action: 'submit' })}
            />
          ) : null}
          {canEdit ? (
            <Button
              title={i18n.t('repairman.editOnTheWebsite')}
              size="sm"
              variant="soft"
              fullWidth={false}
              style={styles.action}
              onPress={() => openWebsite(getWebSellerAdEditUrl(item.id))}
            />
          ) : null}
          {canDelete ? (
            <Button
              title={i18n.t('chat.delete')}
              size="sm"
              variant="outline"
              color={colors.error}
              fullWidth={false}
              style={styles.action}
              disabled={busy}
              onPress={() => setPending({ ad: item, action: 'delete' })}
            />
          ) : null}
        </View>
      </View>
    );
  };

  const summaryCards = summary
    ? [
        { label: t('sellerAuto.impressions'), value: summary.impressions.toLocaleString(getLocaleTag()) },
        { label: t('sellerAuto.clicks'), value: summary.clicks.toLocaleString(getLocaleTag()) },
        { label: t('sellerAuto.spend'), value: formatMoney(summary.spend) },
        { label: 'CTR', value: `${summary.ctr.toFixed(2)}%` },
      ]
    : [];

  const header = (
    <View style={styles.headerWrap}>
      <View>
        <Text style={[styles.mainTitle, { color: colors.text }]}>{t('sellerAuto.advertisementCampaigns')}</Text>
        <Text style={[styles.mainSub, { color: colors.textMuted }]}>
          {t('sellerAuto.promoteYourProductsAndStore')}
        </Text>
      </View>
      <Button title={t('sellerAuto.createCampaign')} size="md" onPress={() => navigation?.navigate('CreateCampaign')} />
      {summaryCards.length > 0 ? (
        <View style={styles.summaryGrid}>
          {summaryCards.map(card => (
            <View
              key={card.label}
              style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{card.label}</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{card.value}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <StatusPills options={STATUS_FILTERS} selected={status} onSelect={setStatus} />
    </View>
  );

  let body: ReactElement | null = null;
  if (list.loading && list.items.length === 0) {
    body = <LoadingState text={t('sellerAuto.loadingCampaigns')} style={styles.stateWrap} />;
  } else if (list.error && list.items.length === 0) {
    body = <ErrorState error={list.error} onRetry={list.retry} style={styles.stateWrap} />;
  } else if (list.items.length === 0) {
    body = (
      <EmptyState
        icon={tagBold}
        title={t('sellerAuto.noCampaignsFound')}
        message={status ? t('sellerAuto.noCampaignsWithThisStatus') : t('sellerAuto.createYourFirstCampaignTo')}
        style={styles.stateWrap}
      />
    );
  }

  const confirmText = pending ? ACTION_TEXT[pending.action] : null;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <OfflineBanner />
      <FlatList
        data={list.items}
        keyExtractor={item => item.id}
        renderItem={renderAd}
        ListHeaderComponent={header}
        ListEmptyComponent={body}
        ListFooterComponent={<PaginationFooter loading={list.loadingMore} hasMore={list.hasMore} />}
        ItemSeparatorComponent={ItemSeparator}
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
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

      <ConfirmModal
        visible={!!pending}
        title={confirmText?.title || ''}
        message={pending ? `${pending.ad.name}\n\n${confirmText?.message}` : ''}
        confirmText={busyId ? t('sellerAuto.pleaseWait') : confirmText?.confirm}
        danger={confirmText?.danger}
        onConfirm={runAction}
        onCancel={() => (busyId ? undefined : setPending(null))}
      />
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
        title={t('sellerAuto.couldNotLoadCampaigns')}
        message={list.loadError || ''}
        onClose={list.clearLoadError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex1: { flex: 1 },
  container: { paddingHorizontal: 16, paddingTop: 14, flexGrow: 1 },
  separator: { height: 12 },
  stateWrap: { paddingVertical: 40 },
  headerWrap: { gap: 12, marginBottom: 14 },
  mainTitle: { fontFamily: fonts.bold, fontSize: 24 },
  mainSub: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4, lineHeight: 19 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryCard: { flexGrow: 1, flexBasis: '45%', borderRadius: 14, borderWidth: 1, padding: 12 },
  summaryLabel: { fontFamily: fonts.regular, fontSize: 12 },
  summaryValue: { fontFamily: fonts.bold, fontSize: 16, marginTop: 4 },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  name: { fontFamily: fonts.bold, fontSize: 15 },
  sub: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontFamily: fonts.medium, fontSize: 12 },
  divider: { height: 1 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowLabel: { fontFamily: fonts.regular, fontSize: 13 },
  rowValue: { flexShrink: 1, textAlign: 'right', fontFamily: fonts.medium, fontSize: 13 },
  note: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  action: { flexGrow: 1 },
});
