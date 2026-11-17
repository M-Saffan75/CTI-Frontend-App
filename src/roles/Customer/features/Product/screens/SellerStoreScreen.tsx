import { useCallback, useEffect, useState } from 'react';
import { formatMoney } from '@/utils/money';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  checkCircleIcon,
  heartExtra,
  heartFilled,
  mapPinBold,
  searchBold,
  shoppingCartExtra,
  starBold,
  storeBold,
} from '@/assets/icons';
import { ctiLogo, demoProductPhoto } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import Button from '@/components/Button';
import { normalizeApiError } from '@/services/apiError';
import { useWishlist } from '../../../context/WishlistContext';
import { useCart } from '../../../context/CartContext';
import {
  getSellerStoreApi,
  MobileEcomProduct,
  resolveImageSource,
} from '../services/ecomApi';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { upper } from '@/i18n/locale';

export default function SellerStoreScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isSaved, toggle: toggleWishlist, ids: wishlistIds } = useWishlist();
  const { cartCount } = useCart();

  const sellerParam = route.params?.seller || {};
  const sellerId = route.params?.sellerId || sellerParam?.id || sellerParam?._id;
  const initialName = route.params?.sellerName || sellerParam?.name || sellerParam?.storeName || t('customer.sellerStore');

  const [seller, setSeller] = useState<any>(sellerParam);
  const [products, setProducts] = useState<MobileEcomProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [loadError, setLoadError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadStore = useCallback(async () => {
    if (!sellerId) {
      setLoading(false);
      return;
    }
    try {
      setLoadError('');
      const res = await getSellerStoreApi(sellerId, 1);
      if (res) {
        if (res.seller) setSeller(res.seller);
        if (Array.isArray(res.products)) setProducts(res.products);
        setPage(1);
        setPages(res.pages);
      }
    } catch (err) {
      // a failed request is shown as an error with a retry, not as an empty store
      setLoadError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sellerId]);

  useEffect(() => {
    loadStore();
  }, [loadStore]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStore();
  };

  const loadMore = async () => {
    if (loadingMore || loading || loadError || page >= pages || !sellerId) return;
    setLoadingMore(true);
    try {
      const res = await getSellerStoreApi(sellerId, page + 1);
      if (res) {
        setProducts(prev => {
          const seen = new Set(prev.map(p => p.id));
          return [...prev, ...res.products.filter(p => !seen.has(p.id))];
        });
        setPage(page + 1);
        setPages(res.pages);
      }
    } catch {
      // the next scroll tries again
    } finally {
      setLoadingMore(false);
    }
  };

  const storeName = seller?.storeName || seller?.businessName || seller?.name || initialName;
  const storeLocation = seller?.storeAddress || seller?.address || seller?.city || seller?.location || '';
  const storeBio = seller?.storeDescription || seller?.description || seller?.bio || '';
  const productTotal = Number(seller?.productCount ?? products.length);
  const avgRating = Number(seller?.avgRating) > 0 ? Number(seller.avgRating) : 0;
  const storeAvatar = seller?.logo || seller?.avatar || seller?.profilePictureOrLogo;

  const filteredProducts = products.filter(p =>
    search.trim() ? p.title.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase()) : true,
  );

  const renderProductItem = ({ item }: { item: MobileEcomProduct }) => {
    const saved = isSaved(item.id);

    return (
      <Squeeze
        scale={0.97}
        onPress={() => {
          if (typeof navigation.push === 'function') {
            navigation.push('ProductDetail', { productId: item.id, product: item });
          } else {
            navigation.navigate('ProductDetail', { productId: item.id, product: item });
          }
        }}
        style={[styles.productCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.imageWrap, { backgroundColor: colors.surfaceAlt }]}>
          <Image
            source={resolveImageSource(item.image, demoProductPhoto)}
            resizeMode="cover"
            style={styles.productImage}
          />
          {item.discountPercent > 0 && (
            <View style={[styles.discountBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.discountText}>-{item.discountPercent}%</Text>
            </View>
          )}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => toggleWishlist(item.id, item)}
            style={[styles.wishlistBtn, { backgroundColor: colors.surface }]}>
            <Icon
              source={saved ? heartFilled : heartExtra}
              size={16}
              color={saved ? colors.error : colors.text}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.productBody}>
          <Text style={[styles.productBrand, { color: colors.textMuted }]} numberOfLines={1}>
            {upper(String(item.brand || ''))}
          </Text>
          <Text style={[styles.productTitle, { color: colors.text }]} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.priceRow}>
            <Text style={[styles.productPrice, { color: colors.primary }]}>
              {formatMoney(item.price)}
            </Text>
            {item.originalPrice > item.price && (
              <Text style={[styles.originalPrice, { color: colors.textMuted }]}>
                {formatMoney(item.originalPrice)}
              </Text>
            )}
          </View>

          <View style={styles.ratingRow}>
            <Icon source={starBold} size={12} color="#F59E0B" />
            <Text style={[styles.ratingText, { color: colors.text }]}>
              {item.rating.toFixed(1)}
            </Text>
            <Text style={[styles.reviewCountText, { color: colors.textMuted }]}>
              ({item.reviewCount})
            </Text>
          </View>
        </View>
      </Squeeze>
    );
  };

  const renderHeader = () => (
    <View style={styles.storeHeaderWrap}>
      {/* Store Profile Card */}
      <FadeUp duration={400}>
        <View style={[styles.storeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.storeTopRow}>
            <View style={[styles.avatarWrap, { borderColor: colors.avatarBorder }]}>
              {storeAvatar ? (
                <Image source={resolveImageSource(storeAvatar, demoProductPhoto)} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '15' }]}>
                  <Icon source={storeBold} size={28} color={colors.primary} />
                </View>
              )}
            </View>

            <View style={styles.storeMainInfo}>
              <View style={styles.titleRow}>
                <Text style={[styles.storeTitle, { color: colors.text }]} numberOfLines={1}>
                  {storeName}
                </Text>
                <Icon source={checkCircleIcon} size={16} color={colors.primary} />
              </View>

              {storeLocation ? (
                <View style={styles.storeMetaRow}>
                  <Icon source={mapPinBold} size={13} color={colors.textMuted} />
                  <Text style={[styles.storeLocation, { color: colors.textMuted }]} numberOfLines={1}>
                    {storeLocation}
                  </Text>
                </View>
              ) : null}

              <View style={styles.storeStatsRow}>
                <View style={[styles.statChip, { backgroundColor: colors.surfaceAlt }]}>
                  <Text style={[styles.statNumber, { color: colors.primary }]}>{productTotal}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>{i18n.t('customer.products')}</Text>
                </View>
                {avgRating > 0 ? (
                  <View style={[styles.statChip, { backgroundColor: colors.surfaceAlt }]}>
                    <Icon source={starBold} size={11} color="#F59E0B" />
                    <Text style={[styles.statNumber, { color: colors.text }]}>{avgRating.toFixed(1)}</Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>{i18n.t('customer.rating')}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {storeBio ? (
            <Text style={[styles.storeBio, { color: colors.textMuted }]} numberOfLines={3}>
              {storeBio}
            </Text>
          ) : null}
        </View>
      </FadeUp>

      {/* Products Search & Count Bar */}
      <View style={styles.searchSection}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Icon source={searchBold} size={18} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('customerMsg.searchStore', { name: storeName })}
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        <View style={styles.sectionTitleRow}>
          <Text style={[styles.catalogTitle, { color: colors.text }]}>{i18n.t('customer.allStoreProducts')}</Text>
          <Text style={[styles.catalogCount, { color: colors.textMuted }]}>
            ({search.trim() ? filteredProducts.length : productTotal} {(search.trim() ? filteredProducts.length : productTotal) === 1 ? 'item' : 'items'})
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Squeeze onPress={() => navigation.goBack()} scale={0.9} style={styles.backBtn}>
          <View style={[styles.backIconWrap, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={18} color={colors.onPrimary} />
          </View>
        </Squeeze>

        <Image source={ctiLogo} resizeMode="contain" style={styles.logo} />

        <View style={styles.headerIcons}>
          <Squeeze onPress={() => navigation.navigate('Wishlist')} scale={0.85}>
            <View>
              <Icon source={heartExtra} size={22} color={colors.text} />
              {wishlistIds.length > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.error }]}>
                  <Text style={styles.badgeText}>{wishlistIds.length}</Text>
                </View>
              )}
            </View>
          </Squeeze>

          <Squeeze onPress={() => navigation.navigate('Cart')} scale={0.85}>
            <View>
              <Icon source={shoppingCartExtra} size={22} color={colors.text} />
              {cartCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>{cartCount}</Text>
                </View>
              )}
            </View>
          </Squeeze>
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loaderText, { color: colors.textMuted }]}>{t('customer.loadingStore')}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 30 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListHeaderComponent={renderHeader}
          renderItem={renderProductItem}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} style={{ paddingVertical: 16 }} /> : null}
          ListEmptyComponent={
            <View style={[styles.emptyBox, { borderColor: colors.border }]}>
              <Icon source={storeBold} size={40} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {loadError ? t('customer.couldNotLoadTheStore') : t('customer.noProductsFound2')}
              </Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                {loadError || (search ? t('customer.tryAdjustingYourSearchTerms') : t('customer.thisSellerHasNotListed'))}
              </Text>
              {loadError ? <Button title={t('customer.tryAgain')} size="sm" onPress={() => { setLoading(true); loadStore(); }} style={{ marginTop: 12 }} /> : null}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  backBtn: { padding: 4 },
  backIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 105, height: 45 },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  badge: {
    position: 'absolute',
    top: -5,
    right: -6,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontFamily: fonts.bold, fontSize: 9, color: '#FFFFFF' },

  listContent: { paddingHorizontal: 16 },
  storeHeaderWrap: { marginBottom: 16, marginTop: 8 },
  storeCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  storeTopRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeMainInfo: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  storeTitle: { fontFamily: fonts.bold, fontSize: 17 },
  storeMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  storeLocation: { fontFamily: fonts.regular, fontSize: 12 },
  storeStatsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statNumber: { fontFamily: fonts.bold, fontSize: 12 },
  statLabel: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 11 },
  storeBio: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },

  searchSection: { marginTop: 4 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 13, padding: 0 },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 6,
  },
  catalogTitle: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 16 },
  catalogCount: { fontFamily: fonts.regular, fontSize: 12 },

  columnWrapper: { justifyContent: 'space-between', marginBottom: 14 },
  productCard: {
    width: '48.5%',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageWrap: {
    width: '100%',
    height: 140,
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  productImage: { width: '100%', height: '100%' },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: { fontFamily: fonts.bold, fontSize: 10, color: '#FFFFFF' },
  wishlistBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },

  productBody: { padding: 10 },
  productBrand: { fontFamily: fonts.medium, fontSize: 11 },
  productTitle: { fontFamily: fonts.bold, fontSize: 13, marginTop: 2, minHeight: 34 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  productPrice: { fontFamily: fonts.bold, fontSize: 14 },
  originalPrice: { fontFamily: fonts.regular, fontSize: 11, textDecorationLine: 'line-through' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  ratingText: { fontFamily: fonts.bold, fontSize: 11 },
  reviewCountText: { fontFamily: fonts.regular, fontSize: 10 },

  emptyBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 15 },
  emptySub: { fontFamily: fonts.regular, fontSize: 12, textAlign: 'center' },

  loaderCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loaderText: { fontFamily: fonts.regular, fontSize: 13 },
});
