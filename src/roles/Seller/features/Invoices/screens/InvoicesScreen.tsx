import { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import { EmptyState, ErrorState, LoadingState, OfflineBanner, PaginationFooter } from '@/components/states';
import { fileBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { getWebSellerInvoicesUrl } from '@/constants/config';
import StatusPills from '@/roles/Seller/components/StatusPills';
import {
  fetchSellerInvoiceCountsApi,
  fetchSellerInvoicesApi,
  SellerInvoice,
} from '@/roles/Seller/services/sellerApi';
import { downloadInvoicePdf } from '@/roles/Seller/utils/invoiceDownload';
import { formatDateTime, openWebsite } from '@/roles/Seller/utils/sellerUtils';
import { getStatusStyle, INVOICE_STATUS_STYLE } from '@/roles/Seller/utils/statusStyles';
import usePagedList from '@/roles/Seller/utils/usePagedList';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

const PAGE_SIZE = 10;

const FILTERS = [
  { id: '', get label() { return i18n.t('sellerAuto.all'); } },
  { id: 'submitted', get label() { return i18n.t('sellerAuto.underReview2'); } },
  { id: 'approved', get label() { return i18n.t('profile.status.approved'); } },
  { id: 'rejected', get label() { return i18n.t('chat.quoteStatus.rejected'); } },
];

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

export default function InvoicesScreen({ isActive = true }: any) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [status, setStatus] = useState('');
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [countsError, setCountsError] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertState>(HIDDEN_ALERT);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const loadCounts = useCallback(() => {
    setCountsError(false);
    fetchSellerInvoiceCountsApi()
      .then(result => mounted.current && setCounts(result))
      .catch(() => mounted.current && setCountsError(true));
  }, []);

  const fetchPage = useCallback(
    async (page: number) => {
      if (page === 1) loadCounts();
      const res = await fetchSellerInvoicesApi({ page, limit: PAGE_SIZE, status });
      return {
        items: res.invoices,
        totalPages: res.pagination.totalPages,
        totalItems: res.pagination.totalItems,
      };
    },
    [status, loadCounts],
  );

  const list = usePagedList<SellerInvoice>(fetchPage, isActive);

  const handleDownload = async (invoice: SellerInvoice) => {
    if (downloadingId) return;
    setDownloadingId(invoice.id);
    const result = await downloadInvoicePdf(invoice.pdfUrl, invoice.number);
    if (!mounted.current) return;
    setDownloadingId(null);
    setAlert({
      visible: true,
      type: result.ok ? 'success' : 'error',
      title: result.title,
      message: result.message,
    });
  };

  const openWeb = async () => {
    if (!(await openWebsite(getWebSellerInvoicesUrl()))) {
      setAlert({
        visible: true,
        type: 'error',
        title: i18n.t('sellerAuto.couldNotOpenTheWebsite'),
        message: i18n.t('sellerMsg.openUrlIn', { url: getWebSellerInvoicesUrl() }),
      });
    }
  };

  const renderInvoice = ({ item }: { item: SellerInvoice }) => {
    const badge = getStatusStyle(INVOICE_STATUS_STYLE, item.status);
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardTop}>
          <Text style={[styles.number, { color: colors.text }]}>{item.number || i18n.t('sellerMsg.invoiceFallback')}</Text>
          <View style={[styles.badge, { backgroundColor: badge.color + '20' }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>

        <DataRow label={i18n.t('sellerAuto.submitted')} value={formatDateTime(item.submittedAt) || '-'} />
        {item.approvedAt ? <DataRow label={i18n.t('profile.status.approved')} value={formatDateTime(item.approvedAt)} /> : null}
        {item.status === 'rejected' && item.rejectionReason ? (
          <Text style={[styles.note, { color: colors.error }]}>{i18n.t('sellerMsg.rejectedLine', { reason: item.rejectionReason })}</Text>
        ) : null}

        <View style={styles.actions}>
          {item.pdfUrl ? (
            <Button
              title={i18n.t('sellerAuto.downloadPdf')}
              size="sm"
              variant="outline"
              fullWidth={false}
              style={styles.action}
              loading={downloadingId === item.id}
              disabled={!!downloadingId}
              onPress={() => handleDownload(item)}
            />
          ) : (
            <Text style={[styles.note, { color: colors.textMuted }]}>{i18n.t('sellerAuto.noPdfUploadedYet')}</Text>
          )}
          {item.status === 'rejected' ? (
            <Button
              title={i18n.t('sellerAuto.reUploadOnTheWebsite')}
              size="sm"
              fullWidth={false}
              style={styles.action}
              onPress={openWeb}
            />
          ) : null}
        </View>
      </View>
    );
  };

  const pills = FILTERS.map(f => ({ ...f, count: counts ? counts[f.id] : undefined }));

  const header = (
    <View style={styles.headerWrap}>
      <View>
        <Text style={[styles.mainTitle, { color: colors.text }]}>{t('sellerTabs.invoices')}</Text>
        <Text style={[styles.mainSub, { color: colors.textMuted }]}>
          {t('sellerAuto.trackTheInvoicesYouSubmitted')}
        </Text>
      </View>
      <View style={[styles.infoBox, { backgroundColor: colors.primary + '12' }]}>
        <Text style={[styles.infoText, { color: colors.text }]}>
          {t('sellerAuto.invoicePdfsAreUploadedOn')}
        </Text>
        <Button title={t('sellerAuto.openInvoicesOnTheWebsite')} size="sm" variant="outline" onPress={openWeb} />
      </View>
      <StatusPills options={pills} selected={status} onSelect={setStatus} />
      {countsError ? (
        <Pressable onPress={loadCounts}>
          <Text style={[styles.infoText, { color: colors.error }]}>{t('seller.countsFailed')}</Text>
        </Pressable>
      ) : null}
    </View>
  );

  let body: ReactElement | null = null;
  if (list.loading && list.items.length === 0) {
    body = <LoadingState text={t('sellerAuto.loadingInvoices')} style={styles.stateWrap} />;
  } else if (list.error && list.items.length === 0) {
    body = <ErrorState error={list.error} onRetry={list.retry} style={styles.stateWrap} />;
  } else if (list.items.length === 0) {
    body = (
      <EmptyState
        icon={fileBold}
        title={t('sellerAuto.noInvoicesFound')}
        message={status ? t('sellerAuto.noInvoicesWithThisStatus') : t('sellerAuto.youHaveNotSubmittedAny')}
        style={styles.stateWrap}
      />
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <OfflineBanner />
      <FlatList
        data={list.items}
        keyExtractor={item => item.id}
        renderItem={renderInvoice}
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
        title={t('sellerAuto.couldNotLoadInvoices')}
        message={list.loadError || ''}
        onClose={list.clearLoadError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { paddingHorizontal: 16, paddingTop: 14, flexGrow: 1 },
  separator: { height: 12 },
  stateWrap: { paddingVertical: 40 },
  headerWrap: { gap: 12, marginBottom: 14 },
  mainTitle: { fontFamily: fonts.bold, fontSize: 26 },
  mainSub: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4, lineHeight: 19 },
  infoBox: { borderRadius: 14, padding: 12, gap: 10 },
  infoText: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  number: { flex: 1, fontFamily: fonts.bold, fontSize: 15 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontFamily: fonts.medium, fontSize: 12 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowLabel: { fontFamily: fonts.regular, fontSize: 13 },
  rowValue: { flexShrink: 1, textAlign: 'right', fontFamily: fonts.medium, fontSize: 13 },
  note: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 6 },
  action: { flexGrow: 1 },
});
