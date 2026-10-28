import { useEffect, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
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
  shoppingCartExtra,
} from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useWishlist } from '../../../context/WishlistContext';
import { useCart } from '../../../context/CartContext';
import { getEcomProducts, MobileEcomProduct } from '../services/ecomApi';

function ProductCard({ product, navigation }: { product: MobileEcomProduct; navigation: any }) {
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
          {typeof product.brand === 'string' ? product.brand : (product.brand as any)?.title || (product.brand as any)?.name || 'CTI Store'}
        </Text>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {typeof product.title === 'string' ? product.title : (product.title as any)?.title || (product.title as any)?.name || 'Product'}
        </Text>
        <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={2}>
          {typeof product.description === 'string' ? product.description : ''}
        </Text>
        <Text style={[styles.reviews, { color: colors.textMuted }]}>
          {product.reviewCount ? `${product.reviewCount} Reviews` : 'No Reviews'}
        </Text>

        <View style={styles.priceRow}>
          {!!product.discountPercent && (
            <View style={[styles.discountPill, { backgroundColor: colors.primary }]}>
              <Text style={styles.discountText}>-{product.discountPercent}%</Text>
            </View>
          )}
          <Text style={[styles.price, { color: colors.text }]}>${Number(product.price || 0).toFixed(2)}</Text>
          {!!product.originalPrice && product.originalPrice > product.price && (
            <Text style={[styles.originalPrice, { color: colors.textMuted }]}>
              ${Number(product.originalPrice).toFixed(2)}
            </Text>
          )}
          <Text style={[styles.stock, { color: product.inStock ? colors.success : colors.error }]}>
            {product.inStock ? 'In stock' : 'Out of stock'}
          </Text>
        </View>
      </View>
    </Squeeze>
  );
}

interface ProductFilters {
  categories: string[];
  color: string | null;
  storage: string | null;
  minPrice: number;
  maxPrice: number;
  minRating: number;
}

const DEFAULT_FILTERS: ProductFilters = {
  categories: [],
  color: null,
  storage: null,
  minPrice: 0,
  maxPrice: 2000,
  minRating: 0,
};

export default function ProductScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { ids } = useWishlist();

  const [filters, setFilters] = useState<ProductFilters>(DEFAULT_FILTERS);
  const [allProducts, setAllProducts] = useState<MobileEcomProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { cartCount, refreshCart } = useCart();

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

  const loadData = async (isRefresh = false, currentFilters = filters) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const queryParams: Record<string, any> = {};
      if (currentFilters.minPrice > 0) queryParams.minPrice = currentFilters.minPrice;
      if (currentFilters.maxPrice < 2000) queryParams.maxPrice = currentFilters.maxPrice;
      if (currentFilters.minRating > 0) queryParams.rating = currentFilters.minRating;
      if (currentFilters.categories.length > 0) queryParams.category = currentFilters.categories[0];

      const [fetchedProducts] = await Promise.all([
        getEcomProducts(queryParams),
        refreshCart(),
      ]);
      setAllProducts(fetchedProducts || []);
    } catch (err: any) {
      setAllProducts([]);
      setModal({
        visible: true,
        type: 'error',
        title: 'Error Loading Store',
        message: err?.message || 'Could not load products.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener?.('focus', () => {
      refreshCart();
    });
    return unsubscribe;
  }, [navigation, refreshCart]);

  const onRefresh = () => {
    loadData(true);
  };

  const filteredProducts = allProducts.filter(p => {
    const price = Number(p.price || 0);
    if (filters.minPrice > 0 && price < filters.minPrice) return false;
    if (filters.maxPrice < 2000 && price > filters.maxPrice) return false;
    if (filters.minRating > 0 && Number(p.rating || 0) < filters.minRating) return false;
    if (filters.categories.length > 0) {
      const catLower = (p.category || '').toLowerCase();
      const matchCat = filters.categories.some(c => catLower.includes(c.toLowerCase()));
      if (!matchCat) return false;
    }
    if (filters.storage) {
      const titleLower = (p.title || '').toLowerCase();
      const storageLower = (p.storage || '').toLowerCase();
      const target = filters.storage.toLowerCase();
      if (!titleLower.includes(target) && !storageLower.includes(target)) return false;
    }
    return true;
  });

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.color !== null ||
    filters.storage !== null ||
    filters.minPrice > 0 ||
    filters.maxPrice < 2000 ||
    filters.minRating > 0;

  let activeFilterCount = 0;
  if (filters.categories.length > 0) activeFilterCount += filters.categories.length;
  if (filters.color) activeFilterCount += 1;
  if (filters.storage) activeFilterCount += 1;
  if (filters.minPrice > 0 || filters.maxPrice < 2000) activeFilterCount += 1;
  if (filters.minRating > 0) activeFilterCount += 1;

  const openFilterScreen = () => {
    navigation.navigate('ProductFilter', {
      currentFilters: filters,
      onApply: (appliedFilters: ProductFilters) => {
        setFilters(appliedFilters);
        loadData(false, appliedFilters);
      },
    });
  };

  const removeCategory = (cat: string) => {
    const next = { ...filters, categories: filters.categories.filter(c => c !== cat) };
    setFilters(next);
    loadData(false, next);
  };

  const resetPrice = () => {
    const next = { ...filters, minPrice: 0, maxPrice: 2000 };
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
            {(filters.minPrice > 0 || filters.maxPrice < 2000) && (
              <View style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.filterChipText, { color: colors.text }]}>${filters.minPrice} - ${filters.maxPrice}</Text>
                <TouchableOpacity onPress={resetPrice} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon source={closeIcon} size={11} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            )}
            {filters.minRating > 0 && (
              <View style={[styles.filterChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.filterChipText, { color: colors.text }]}>{filters.minRating}+ Stars</Text>
                <TouchableOpacity onPress={resetRating} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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
              <Text style={[styles.clearAllText, { color: colors.error }]}>Clear All</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
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
            text="Loading marketplace products..."
            style={{ paddingVertical: 45 }}
          />
        ) : filteredProducts.length === 0 ? (
          <View style={{ paddingVertical: 50, alignItems: 'center', gap: 12 }}>
            <Text style={{ color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14 }}>
              {hasActiveFilters ? 'No products match the selected filters.' : 'No products available right now.'}
            </Text>
            {hasActiveFilters && (
              <Button title="Reset Filters" variant="soft" size="sm" onPress={clearAllFilters} />
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
