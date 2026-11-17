import { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import ConfirmModal from '@/components/ConfirmModal';
import { EmptyState, ErrorState, LoadingState, OfflineBanner, PaginationFooter } from '@/components/states';
import { packageBold, searchBold, starBold, starFilled, trashBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import InitialsAvatar from '@/roles/Seller/components/InitialsAvatar';
import StatusPills from '@/roles/Seller/components/StatusPills';
import {
  deleteSellerReviewApi,
  fetchSellerReviewsApi,
  SellerReview,
} from '@/roles/Seller/services/sellerApi';
import { formatDate } from '@/roles/Seller/utils/sellerUtils';
import { AMBER } from '@/roles/Seller/utils/statusStyles';
import usePagedList from '@/roles/Seller/utils/usePagedList';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 500;

const RATING_FILTERS = [
  { id: '', get label() { return i18n.t('sellerAuto.all'); } },
  { id: '5', get label() { return i18n.t('sellerAuto.n5Stars'); } },
  { id: '4', get label() { return i18n.t('sellerAuto.n4Stars'); } },
  { id: '3', get label() { return i18n.t('sellerAuto.n3Stars'); } },
  { id: '2', get label() { return i18n.t('sellerAuto.n2Stars'); } },
  { id: '1', get label() { return i18n.t('sellerAuto.n1Star'); } },
];

interface AlertState {
  visible: boolean;
  type: AlertModalType;
  title: string;
  message: string;
}

const HIDDEN_ALERT: AlertState = { visible: false, type: 'info', title: '', message: '' };

const ItemSeparator = () => <View style={styles.separator} />;

export default function ReviewsScreen({ isActive = true }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [rating, setRating] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<SellerReview | null>(null);
  const [deleting, setDeleting] = useState(false);
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
      const res = await fetchSellerReviewsApi({ page, limit: PAGE_SIZE, rating, search });
      return {
        items: res.reviews,
        totalPages: res.pagination.totalPages,
        totalItems: res.pagination.totalItems,
      };
    },
    [rating, search],
  );

  const list = usePagedList<SellerReview>(fetchPage, isActive);
  const hasFilters = !!(rating || search);

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    const target = deleteTarget;
    setDeleting(true);
    try {
      const res = await deleteSellerReviewApi(target.id);
      if (!mounted.current) return;
      setDeleteTarget(null);
      list.removeItem(item => item.id === target.id);
      setAlert({
        visible: true,
        type: 'success',
        title: i18n.t('sellerAuto.reviewDeleted'),
        message: res?.message || i18n.t('sellerAuto.reviewDeletedSuccessfully'),
      });
    } catch (err: any) {
      if (!mounted.current) return;
      setDeleteTarget(null);
      setAlert({
        visible: true,
        type: 'error',
        title: i18n.t('sellerAuto.deleteFailed'),
        message: err?.message || i18n.t('sellerAuto.couldNotDeleteThisReview'),
      });
    } finally {
      if (mounted.current) setDeleting(false);
    }
  };

  const renderStars = (value: number | null) => {
    if (value === null) {
      return <Text style={[styles.meta, { color: colors.textMuted }]}>{i18n.t('sellerAuto.noRating')}</Text>;
    }
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map(star => (
          <Icon
            key={star}
            source={star <= value ? starFilled : starBold}
            size={14}
            color={star <= value ? AMBER : colors.textMuted}
          />
        ))}
      </View>
    );
  };

  const renderReview = ({ item }: { item: SellerReview }) => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardTop}>
        <InitialsAvatar name={item.customer || t('sellerMsg.anonymous')} photo={item.customerPhoto} size={42} />
        <View style={styles.flex1}>
          <Text style={[styles.name, { color: colors.text }]}>{item.customer || t('sellerMsg.anonymous')}</Text>
          {renderStars(item.rating)}
        </View>
        <Text style={[styles.meta, { color: colors.textMuted }]}>{formatDate(item.createdAt)}</Text>
      </View>

      <View style={[styles.productRow, { backgroundColor: colors.surfaceAlt }]}>
        {item.productImage ? (
          <Image source={{ uri: item.productImage }} style={[styles.productImage, { backgroundColor: colors.border }]} />
        ) : (
          <View style={[styles.productImage, styles.productPlaceholder, { backgroundColor: colors.border }]}>
            <Icon source={packageBold} size={16} color={colors.textMuted} />
          </View>
        )}
        <Text style={[styles.productTitle, { color: colors.text }]}>{item.productTitle || i18n.t('sellerMsg.productFallback')}</Text>
      </View>

      {item.comment ? <Text style={[styles.comment, { color: colors.text }]}>{item.comment}</Text> : null}

      {item.images.length > 0 || item.hasVideo ? (
        <View style={styles.mediaRow}>
          {item.images.map(uri => (
            <Image key={uri} source={{ uri }} style={[styles.media, { backgroundColor: colors.surfaceAlt }]} />
          ))}
          {item.hasVideo ? <Text style={[styles.meta, { color: colors.textMuted }]}>{i18n.t('sellerAuto.video')}</Text> : null}
        </View>
      ) : null}

      <Squeeze onPress={() => setDeleteTarget(item)} scale={0.95}>
        <View style={[styles.deleteBtn, { borderColor: colors.border }]}>
          <Icon source={trashBold} size={14} color={colors.error} />
          <Text style={[styles.deleteText, { color: colors.error }]}>{i18n.t('sellerAuto.deleteReview')}</Text>
        </View>
      </Squeeze>
    </View>
  );

  const header = (
    <View style={styles.headerWrap}>
      <View>
        <Text style={[styles.mainTitle, { color: colors.text }]}>{t('sellerAuto.productReviews')}</Text>
        <Text style={[styles.mainSub, { color: colors.textMuted }]}>
          {i18n.t('sellerMsg.viewManageReviews')}
          {!list.loading && !list.error ? ' ' + i18n.t(list.total === 1 ? 'sellerMsg.reviewsOne' : 'sellerMsg.reviewsMany', { count: list.total }) : ''}
        </Text>
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
        <Icon source={searchBold} size={16} color={colors.textMuted} />
        <TextInput
          placeholder={t('sellerAuto.searchCustomerCommentOrProduct')}
          placeholderTextColor={colors.textMuted}
          value={searchInput}
          onChangeText={setSearchInput}
          returnKeyType="search"
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      <StatusPills options={RATING_FILTERS} selected={rating} onSelect={setRating} />
    </View>
  );

  let body: ReactElement | null = null;
  if (list.loading && list.items.length === 0) {
    body = <LoadingState text={t('sellerAuto.loadingReviews')} style={styles.stateWrap} />;
  } else if (list.error && list.items.length === 0) {
    body = <ErrorState error={list.error} onRetry={list.retry} style={styles.stateWrap} />;
  } else if (list.items.length === 0) {
    body = (
      <EmptyState
        icon={starBold}
        title={t('sellerAuto.noReviewsFound')}
        message={hasFilters ? t('sellerAuto.noReviewsMatchYourSearch') : t('sellerAuto.yourProductsHaveNoReviews')}
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
        renderItem={renderReview}
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

      <ConfirmModal
        visible={!!deleteTarget}
        title={t('sellerAuto.deleteReview2')}
        message={t('sellerAuto.thisReviewIsRemovedFrom')}
        confirmText={deleting ? t('sellerAuto.deleting') : t('chat.delete')}
        danger
        onConfirm={handleDelete}
        onCancel={() => (deleting ? undefined : setDeleteTarget(null))}
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
        title={t('sellerAuto.couldNotLoadReviews')}
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
  mainSub: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4, lineHeight: 19 },
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
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontFamily: fonts.bold, fontSize: 14, marginBottom: 4 },
  meta: { fontFamily: fonts.regular, fontSize: 12 },
  starsRow: { flexDirection: 'row', gap: 2 },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 10, padding: 8 },
  productImage: { width: 36, height: 36, borderRadius: 8 },
  productPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  productTitle: { flex: 1, fontFamily: fonts.medium, fontSize: 12 },
  comment: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  mediaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  media: { width: 48, height: 48, borderRadius: 8 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  deleteText: { flexShrink: 1, fontFamily: fonts.medium, fontSize: 12, textAlign: 'center' },
});
