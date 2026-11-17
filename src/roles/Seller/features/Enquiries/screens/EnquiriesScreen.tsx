import { ReactElement, useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import AlertModal from '@/components/AlertModal';
import { EmptyState, ErrorState, LoadingState, OfflineBanner, PaginationFooter } from '@/components/states';
import { commentDotsBold, searchBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import InitialsAvatar from '@/roles/Seller/components/InitialsAvatar';
import StatusPills from '@/roles/Seller/components/StatusPills';
import {
  fetchSellerQueriesApi,
  fetchSellerQueryCountsApi,
  fetchSellerQueryStatsApi,
  SellerQueryCounts,
  SellerEnquiry,
  SellerQueryType,
} from '@/roles/Seller/services/sellerApi';
import { consumeEnquiriesDirty, formatListTime } from '@/roles/Seller/utils/sellerUtils';
import usePagedList from '@/roles/Seller/utils/usePagedList';
import { queryStatusLabel } from '@/roles/Seller/utils/statusStyles';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

const PAGE_SIZE = 15;
const SEARCH_DEBOUNCE_MS = 500;

const STATUS_COLOR: Record<string, string> = {
  open: '#10B981',
  replied: '#3B82F6',
  closed: '#6B7280',
};

const ItemSeparator = () => <View style={styles.separator} />;

interface EnquiryExtra {
  type: SellerQueryType;
  counts?: SellerQueryCounts;
  unread?: number;
}

export default function EnquiriesScreen({ navigation, isActive = true, params }: any) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [type, setType] = useState<SellerQueryType>('customer');
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Dashboard shortcuts (Order Questions, Product Questions) pick the tab and the status
  const shortcutAt = params?.at;
  const shortcutType = params?.enquiryType;
  const shortcutStatus = params?.enquiryStatus;
  useEffect(() => {
    if (!shortcutAt || !shortcutType) return;
    setType(shortcutType === 'order' ? 'order' : 'customer');
    setStatus(shortcutStatus || '');
  }, [shortcutAt, shortcutType, shortcutStatus]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchPage = useCallback(
    async (page: number) => {
      const [res, counts, stats] = await Promise.all([
        fetchSellerQueriesApi({ page, limit: PAGE_SIZE, type, status, customerName: search }),
        page === 1 ? fetchSellerQueryCountsApi(type).catch(() => undefined) : Promise.resolve(undefined),
        page === 1 ? fetchSellerQueryStatsApi().catch(() => undefined) : Promise.resolve(undefined),
      ]);
      return {
        items: res.queries,
        totalPages: res.pagination.totalPages,
        totalItems: res.pagination.totalItems,
        extra: page === 1 ? { type, counts, unread: stats?.unread } : undefined,
      };
    },
    [type, status, search],
  );

  const list = usePagedList<SellerEnquiry, EnquiryExtra | undefined>(
    fetchPage,
    isActive,
    true,
    consumeEnquiriesDirty,
  );
  const extra = list.extra;
  const [lastExtra, setLastExtra] = useState<EnquiryExtra | undefined>(undefined);
  useEffect(() => {
    if (extra) setLastExtra(extra);
  }, [extra]);

  // Counts of the other tab are never shown on this tab
  const counts = lastExtra && lastExtra.type === type ? lastExtra.counts : undefined;
  const totalUnread = lastExtra?.unread || 0;

  const pills = [
    { id: '', label: t('sellerAuto.all'), count: counts?.all },
    { id: 'open', label: t('sellerAuto.open'), count: counts?.open },
    { id: 'replied', label: t('sellerAuto.replied'), count: counts?.replied },
    { id: 'closed', label: t('sellerAuto.closed'), count: counts?.closed },
  ];

  const renderEnquiry = ({ item }: { item: SellerEnquiry }) => {
    const color = STATUS_COLOR[item.status] || STATUS_COLOR.open;
    const unread = item.unread > 0;
    return (
      <Squeeze onPress={() => navigation?.navigate('SellerQueryDetail', { queryId: item.id })} scale={0.98}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: unread ? colors.primary + '10' : colors.surface,
              borderColor: colors.border,
            },
          ]}>
          <View style={styles.cardTop}>
            <InitialsAvatar name={item.customerName || i18n.t('glossary.customer')} size={42} />
            <View style={styles.flex1}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: colors.text }]}>{item.customerName || i18n.t('glossary.customer')}</Text>
                {unread ? (
                  <View style={[styles.newBadge, { backgroundColor: colors.primary + '25' }]}>
                    <Text style={[styles.newBadgeText, { color: colors.primary }]}>{i18n.t('sellerMsg.newCount', { count: item.unread })}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.subject, { color: colors.text }]}>{item.subject}</Text>
              {item.type === 'order' && item.orderNo ? (
                <Text style={[styles.meta, { color: colors.textMuted }]}>{i18n.t('sellerMsg.orderLine', { no: item.orderNo })}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.cardBottom}>
            <Text style={[styles.meta, { color: colors.textMuted }]}>
              {item.queryId}  |  {formatListTime(item.updatedAt)}
            </Text>
            <View style={[styles.badge, { backgroundColor: color + '20' }]}>
              <Text style={[styles.badgeText, { color }]}>{queryStatusLabel(item.status)}</Text>
            </View>
          </View>
        </View>
      </Squeeze>
    );
  };

  const header = (
    <View style={styles.headerWrap}>
      <View>
        <Text style={[styles.mainTitle, { color: colors.text }]}>{t('sellerAuto.customerEnquiries')}</Text>
        <Text style={[styles.mainSub, { color: colors.textMuted }]}>
          {i18n.t('sellerMsg.manageMessages')}
          {totalUnread > 0 ? i18n.t('sellerMsg.unreadSuffix', { count: totalUnread }) : ''}
        </Text>
      </View>

      <StatusPills
        options={[
          { id: 'customer', label: t('sellerAuto.productQueries') },
          { id: 'order', label: t('sellerAuto.orderQueries') },
        ]}
        selected={type}
        onSelect={id => {
          setType(id as SellerQueryType);
          setStatus('');
          setSearchInput('');
        }}
      />

      <View style={[styles.searchBar, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
        <Icon source={searchBold} size={16} color={colors.textMuted} />
        <TextInput
          placeholder={t('sellerAuto.searchCustomers')}
          placeholderTextColor={colors.textMuted}
          value={searchInput}
          onChangeText={setSearchInput}
          returnKeyType="search"
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      <StatusPills options={pills} selected={status} onSelect={id => setStatus(prev => (prev === id ? '' : id))} />
    </View>
  );

  let body: ReactElement | null = null;
  if (list.loading && list.items.length === 0) {
    body = <LoadingState text={t('sellerAuto.loadingEnquiries')} style={styles.stateWrap} />;
  } else if (list.error && list.items.length === 0) {
    body = <ErrorState error={list.error} onRetry={list.retry} style={styles.stateWrap} />;
  } else if (list.items.length === 0) {
    body = (
      <EmptyState
        icon={commentDotsBold}
        title={t('sellerAuto.noMessagesFound')}
        message={
          search || status
            ? t('sellerAuto.noConversationsMatchYourSearch')
            : i18n.t(type === 'order' ? 'sellerMsg.noOrderEnquiries' : 'sellerMsg.noProductEnquiries')
        }
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
        renderItem={renderEnquiry}
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

      <AlertModal
        visible={!!list.loadError}
        type="error"
        title={t('sellerAuto.couldNotLoadEnquiries')}
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
  mainTitle: { fontFamily: fonts.bold, fontSize: 26 },
  mainSub: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },
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
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  cardTop: { flexDirection: 'row', gap: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  name: { fontFamily: fonts.bold, fontSize: 14 },
  newBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  newBadgeText: { fontFamily: fonts.bold, fontSize: 10 },
  subject: { fontFamily: fonts.medium, fontSize: 13, marginTop: 4, lineHeight: 18 },
  meta: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontFamily: fonts.bold, fontSize: 11 },
});
