import { useEffect, useRef, useState } from 'react';
import { formatMoney } from '@/utils/money';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CtiLoader from '@/components/CtiLoader';
import Icon from '@/components/Icon';
import Button from '@/components/Button';
import Squeeze from '@/components/Squeeze';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import { FadeUp } from '@/animations';
import {
  closeIcon,
  filterBold,
  heartExtra,
  heartFilled,
  menuBold,
  searchBold,
  shoppingCartExtra,
} from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useWishlist } from '../../../context/WishlistContext';
import { useCart } from '../../../context/CartContext';
import { fetchEcomProductsPage, MobileEcomProduct } from '../services/ecomApi';
import { normalizeApiError } from '@/services/apiError';
import {
  DEFAULT_FILTERS,
  PRICE_MAX,
  ProductFilters,
  subscribeProductFilters,
} from '../utils/productFilters';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

const PAGE_SIZE = 12;

function ProductCard({ product, navigation }: { product: MobileEcomProduct; navigation: any }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isSaved, toggle } = useWishlist();
  const saved = isSaved(product.id);

  const imageSource =
    typeof product.image === 'string'
      ? { uri: product.image }
      : product.image?.uri
      ? product.image
      : product.image;

  return (
    <Squeeze
      onPress={() => {
        if (typeof navigation.push === 'function') {
          navigation.push('ProductDetail', { productId: product.id, slug: product.slug, product });
        } else {
          navigation.navigate('ProductDetail', { productId: product.id, slug: product.slug, product });
        }
      }}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.photoWrap}>
        <Image source={imageSource} style={styles.photo} resizeMode="cover" />
        <Image source={ctiLogo} resizeMode="contain" style={styles.cardLogo} />

        <Squeeze
          onPress={() => toggle(product)}
          scale={0.85}
          style={[styles.saveWrap, { backgroundColor: colors.surface }]}>
          <Icon source={saved ? heartFilled : heartExtra} size={16} color={saved ? colors.error : colors.text} />
        </Squeeze>
      </View>

      <View style={styles.cardBody}>
        <Text style={[styles.brand, { color: colors.textMuted }]} numberOfLines={1}>
          {typeof product.brand === 'string' ? product.brand : (product.brand as any)?.title || (product.brand as any)?.name || t('customer.ctiStore')}
        </Text>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {typeof product.title === 'string' ? product.title : (product.title as any)?.title || (product.title as any)?.name || t('tabs.product')}
        </Text>
        <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={2}>
          {typeof product.description === 'string' ? product.description : ''}
        </Text>
        <Text style={[styles.reviews, { color: colors.textMuted }]}>
          {product.reviewCount ? t(product.reviewCount === 1 ? 'customerMsg.reviewsOne' : 'customerMsg.reviewsMany', { count: product.reviewCount }) : t('customer.noReviews')}
        </Text>

        <View style={styles.priceRow}>
          {!!product.discountPercent && (
            <View style={[styles.discountPill, { backgroundColor: colors.primary }]}>
              <Text style={styles.discountText}>-{product.discountPercent}%</Text>
            </View>
          )}
          <Text style={[styles.price, { color: colors.text }]}>{formatMoney(product.price)}</Text>
          {!!product.originalPrice && product.originalPrice > product.price && (
            <Text style={[styles.originalPrice, { color: colors.textMuted }]}>
              {formatMoney(product.originalPrice)}
            </Text>
          )}
          <Text style={[styles.stock, { color: product.inStock ? colors.success : colors.error }]}>
            {product.inStock ? t('customer.inStock') : t('customer.outOfStock')}
          </Text>
        </View>
      </View>
    </Squeeze>
  );
}

export default function ProductScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { ids } = useWishlist();

  const [filters, setFilters] = useState<ProductFilters>(DEFAULT_FILTERS);
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<MobileEcomProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const { cartCount, refreshCart } = useCart();
  const requestId = useRef(0);

  // AlertModal state
  const [modal, setModal] = useState<{
    visible: boolean;
    type: AlertModalType;
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  // Every filter is applied by the backend, so the list, the page count and the filters always agree
  const buildQuery = (currentFilters: ProductFilters, text: string, pageNo: number) => {
    const query: Record<string, any> = { page: pageNo, limit: PAGE_SIZE };
    if (text.trim()) query.q = text.trim();
    if (currentFilters.categoryIds.length > 0) query.categoryIds = currentFilters.categoryIds.join(',');
    if (currentFilters.color) query.colors = currentFilters.color;
    if (currentFilters.storage) query.dynamicFilters = JSON.stringify({ Storage: [currentFilters.storage] });
    if (currentFilters.minPrice > 0) query.minPrice = currentFilters.minPrice;
    if (currentFilters.maxPrice < PRICE_MAX) query.maxPrice = currentFilters.maxPrice;
    if (currentFilters.minRating > 0) query.rating = currentFilters.minRating;
    return query;
  };

  // A slow answer for an old filter is ignored (requestId), so the list always matches the filters shown
  const loadData = async (
    isRefresh = false,
    currentFilters: ProductFilters = filters,
    text: string = search,
  ) => {
    const myRequest = ++requestId.current;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setLoadError('');

    try {
      const result = await fetchEcomProductsPage(buildQuery(currentFilters, text, 1));
      if (myRequest !== requestId.current) return;
      setProducts(result.products);
      setPage(1);
      setPages(result.pages);
    } catch (err) {
      if (myRequest !== requestId.current) return;
      // never show "no products" when the request failed
      setProducts([]);
      setLoadError(normalizeApiError(err).message);
    } finally {
      if (myRequest === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  const loadMore = async () => {
    if (loadingMore || loading || loadError || page >= pages) return;
    const myRequest = requestId.current;
    setLoadingMore(true);
    try {
      const result = await fetchEcomProductsPage(buildQuery(filters, search, page + 1));
      if (myRequest !== requestId.current) return;
      setProducts(prev => {
        const seen = new Set(prev.map(p => p.id));
        return [...prev, ...result.products.filter(p => !seen.has(p.id))];
      });
      setPage(page + 1);
      setPages(result.pages);
    } catch (err) {
      setModal({
        visible: true,
        type: 'error',
        title: i18n.t('customer.couldNotLoadMoreProducts'),
        message: normalizeApiError(err).message,
      });
    } finally {
      setLoadingMore(false);
    }
  };

  // Runs on mount and when the cart refresher changes; always calls the latest loadData
  const loadDataRef = useRef(loadData);
  loadDataRef.current = loadData;

  useEffect(() => {
    loadDataRef.current();
    const unsubscribe = navigation.addListener?.('focus', () => {
      refreshCart({ silent: true });
    });
    return unsubscribe;
  }, [navigation, refreshCart]);

  // The filter screen applies its result here
  useEffect(
    () =>
      subscribeProductFilters(applied => {
        setFilters(applied);
        loadDataRef.current(false, applied);
      }),
    [],
  );

  // Typing in the search box waits a moment, then asks the backend
  const firstSearch = useRef(true);
  useEffect(() => {
    if (firstSearch.current) {
      firstSearch.current = false;
      return;
    }
    const timer = setTimeout(() => loadDataRef.current(false, filters, search), 450);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const onRefresh = () => {
    loadData(true);
  };

  const filteredProducts = products;

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.categoryIds.length > 0 ||
    filters.color !== null ||
    filters.storage !== null ||
    filters.minPrice > 0 ||
    filters.maxPrice < PRICE_MAX ||
    filters.minRating > 0;

  let activeFilterCount = 0;
  if (filters.categories.length > 0) activeFilterCount += filters.categories.length;
  else if (filters.categoryIds.length > 0) activeFilterCount += filters.categoryIds.length;
  if (filters.color) activeFilterCount += 1;
  if (filters.storage) activeFilterCount += 1;
  if (filters.minPrice > 0 || filters.maxPrice < PRICE_MAX) activeFilterCount += 1;
  if (filters.minRating > 0) activeFilterCount += 1;

  const openFilterScreen = () => {
    navigation.navigate('ProductFilter', { currentFilters: filters });
  };

  const removeCategory = (cat: string) => {
    const idx = filters.categories.indexOf(cat);
    const nextCategories = filters.categories.filter((_, i) => i !== idx);
    const nextCategoryIds = filters.categoryIds.filter((_, i) => i !== idx);
    const next = { ...filters, categories: nextCategories, categoryIds: nextCategoryIds };
    setFilters(next);
    loadData(false, next);
  };

  const resetColor = () => {
    const next = { ...filters, color: null };
    setFilters(next);
    loadData(false, next);
  };

  const resetPrice = () => {
    const next = { ...filters, minPrice: 0, maxPrice: PRICE_MAX };
    setFilters(next);
    loadData(false, next);
  };

  const resetRating = () => {
    const next = { ...filters, minRating: 0 };
    setFilters(next);
    loadData(false, next);
  };

  const resetStorage = () => {
    const next = { ...filters, storage: null };
    setFilters(next);
    loadData(false, next);
  };

  const clearAllFilters = () => {
    setFilters(DEFAULT_FILTERS);
    loadData(false, DEFAULT_FILTERS);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Image source={ctiLogo} resizeMode="contain" style={styles.logo} />

        <View style={styles.headerIcons}>
          <Squeeze onPress={() => navigation.navigate('Wishlist')} scale={0.85}>
            <View>
              <Icon source={heartExtra} size={22} color={colors.text} />
              {ids.length > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.error }]}>
                  <Text style={styles.badgeText}>{ids.length}</Text>
                </View>
              )}
            </View>
          </Squeeze>

          <Squeeze onPress={openFilterScreen} scale={0.85}>
            <View>
              <Icon source={filterBold} size={22} color={hasActiveFilters ? colors.primary : colors.text} />
              {activeFilterCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>{activeFilterCount}</Text>
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
          <Squeeze onPress={() => navigation.navigate('Settings')} scale={0.85}>
            <Icon source={menuBold} size={22} color={colors.text} />
          </Squeeze>
        </View>
      </View>

      <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}>
        <Icon source={searchBold} size={18} color={colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('customer.searchProducts')}
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      {hasActiveFilters && (
        <View style={styles.activeFiltersBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeFiltersScroll}>
            {filters.categories.map(cat => (
              <View key={cat} style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.filterChipText, { color: colors.text }]}>{cat}</Text>
                <TouchableOpacity onPress={() => removeCategory(cat)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon source={closeIcon} size={11} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
            {(filters.minPrice > 0 || filters.maxPrice < PRICE_MAX) && (
              <View style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.filterChipText, { color: colors.text }]}>{formatMoney(filters.minPrice)} - {formatMoney(filters.maxPrice)}</Text>
                <TouchableOpacity onPress={resetPrice} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon source={closeIcon} size={11} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            )}
            {filters.minRating > 0 && (
              <View style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.filterChipText, { color: colors.text }]}>{t('customerMsg.minStars', { rating: filters.minRating })}</Text>
                <TouchableOpacity onPress={resetRating} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon source={closeIcon} size={11} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            )}
            {filters.color && (
              <View style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.filterChipText, { color: colors.text }]}>{filters.color}</Text>
                <TouchableOpacity onPress={resetColor} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon source={closeIcon} size={11} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            )}
            {filters.storage && (
              <View style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.filterChipText, { color: colors.text }]}>{filters.storage}</Text>
                <TouchableOpacity onPress={resetStorage} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon source={closeIcon} size={11} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity onPress={clearAllFilters} style={styles.clearAllBtn}>
              <Text style={[styles.clearAllText, { color: colors.error }]}>{t('customer.clearAll')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={200}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 400) loadMore();
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        {loading && !refreshing ? (
          <CtiLoader
            size="md"
            text={t('customer.loadingMarketplaceProducts')}
            style={{ paddingVertical: 45 }}
          />
        ) : loadError ? (
          <View style={{ paddingVertical: 50, alignItems: 'center', gap: 12 }}>
            <Text style={{ color: colors.text, fontFamily: fonts.bold, fontSize: 16 }}>{t('customer.couldNotLoadProducts')}</Text>
            <Text style={{ color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14, textAlign: 'center' }}>
              {loadError}
            </Text>
            <Button title={t('customer.tryAgain')} size="sm" onPress={() => loadData()} />
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={{ paddingVertical: 50, alignItems: 'center', gap: 12 }}>
            <Text style={{ color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14 }}>
              {hasActiveFilters || search.trim() ? t('customer.noProductsMatchYourSearch') : t('customer.noProductsAvailableRightNow')}
            </Text>
            {hasActiveFilters && (
              <Button title={t('customer.resetFilters')} variant="soft" size="sm" onPress={clearAllFilters} />
            )}
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredProducts.map((product, index) => (
              <FadeUp
                key={product.id}
                delay={Math.min(300, 40 + index * 30)}
                duration={450}
                style={styles.gridItem}>
                <ProductCard product={product} navigation={navigation} />
              </FadeUp>
            ))}
          </View>
        )}
        {loadingMore ? (
          <CtiLoader size="sm" text={t('customer.loadingMoreProducts')} style={{ paddingVertical: 20 }} />
        ) : null}
      </ScrollView>

      <AlertModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  logo: { width: 110, height: 59 },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 14, padding: 0 },
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

  body: { paddingHorizontal: 20, paddingTop: 10 },
  activeFiltersBar: {
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#00000015',
  },
  activeFiltersScroll: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  filterChipText: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  clearAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    justifyContent: 'center',
  },
  clearAllText: {
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48%', marginBottom: 14 },

  card: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  photoWrap: { position: 'relative' },
  photo: { width: '100%', height: 130 },
  cardLogo: { position: 'absolute', top: 8, left: 8, width: 60, height: 26 },
  saveWrap: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardBody: { padding: 10, gap: 3 },
  brand: { fontFamily: fonts.regular, fontSize: 11 },
  title: { fontFamily: fonts.bold, fontSize: 13, marginTop: 1 },
  description: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 15, marginTop: 2 },
  reviews: { fontFamily: fonts.regular, fontSize: 11, marginTop: 2 },

  priceRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 6 },
  discountPill: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  discountText: { fontFamily: fonts.bold, fontSize: 10, color: '#FFFFFF' },
  price: { fontFamily: fonts.bold, fontSize: 13 },
  originalPrice: { fontFamily: fonts.regular, fontSize: 11, textDecorationLine: 'line-through' },
  stock: { fontFamily: fonts.regular, fontSize: 10 },
});
