import { useCallback, useEffect, useState } from 'react';
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
import { useWishlist } from '../../../context/WishlistContext';
import { useCart } from '../../../context/CartContext';
import {
  getSellerStoreApi,
  MobileEcomProduct,
  resolveImageSource,
} from '../services/ecomApi';

export default function SellerStoreScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isSaved, toggle: toggleWishlist, ids: wishlistIds } = useWishlist();
  const { cartCount } = useCart();

  const sellerParam = route.params?.seller || {};
  const sellerId = route.params?.sellerId || sellerParam?.id || sellerParam?._id;
  const initialName = route.params?.sellerName || sellerParam?.name || sellerParam?.storeName || 'Seller Store';

  const [seller, setSeller] = useState<any>(sellerParam);
  const [products, setProducts] = useState<MobileEcomProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadStore = useCallback(async () => {
    if (!sellerId) {
      setLoading(false);
      return;
    }
    try {
      const res = await getSellerStoreApi(sellerId);
      if (res) {
        if (res.seller) setSeller(res.seller);
        if (Array.isArray(res.products)) setProducts(res.products);
      }
    } catch {
      // Graceful fallback
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

  const storeName = seller?.storeName || seller?.businessName || seller?.name || initialName;
  const storeLocation = seller?.address || seller?.city || seller?.location || 'Verified Seller';
  const storeBio = seller?.description || seller?.bio || 'Discover high-quality electronics, components, and gadgets from our verified storefront.';
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
        <View style={styles.imageWrap}>
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
            {item.brand}
          </Text>
          <Text style={[styles.productTitle, { color: colors.text }]} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.priceRow}>
            <Text style={[styles.productPrice, { color: colors.primary }]}>
              ${item.price.toFixed(2)}
            </Text>
            {item.originalPrice > item.price && (
              <Text style={[styles.originalPrice, { color: colors.textMuted }]}>
                ${item.originalPrice.toFixed(2)}
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
            <View style={[styles.avatarWrap, { borderColor: colors.border }]}>
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

              <View style={styles.storeMetaRow}>
                <Icon source={mapPinBold} size={13} color={colors.textMuted} />
                <Text style={[styles.storeLocation, { color: colors.textMuted }]} numberOfLines={1}>
                  {storeLocation}
                </Text>
              </View>

              <View style={styles.storeStatsRow}>
                <View style={[styles.statChip, { backgroundColor: colors.surfaceAlt }]}>
                  <Text style={[styles.statNumber, { color: colors.primary }]}>{products.length}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Products</Text>
                </View>
                <View style={[styles.statChip, { backgroundColor: colors.surfaceAlt }]}>
                  <Icon source={starBold} size={11} color="#F59E0B" />
                  <Text style={[styles.statNumber, { color: colors.text }]}>4.9</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Rating</Text>
                </View>
              </View>
            </View>
          </View>

          <Text style={[styles.storeBio, { color: colors.textMuted }]} numberOfLines={3}>
            {storeBio}
          </Text>
        </View>
      </FadeUp>

      {/* Products Search & Count Bar */}
      <View style={styles.searchSection}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Icon source={searchBold} size={18} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={`Search ${storeName}...`}
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        <View style={styles.sectionTitleRow}>
          <Text style={[styles.catalogTitle, { color: colors.text }]}>All Store Products</Text>
          <Text style={[styles.catalogCount, { color: colors.textMuted }]}>
            ({filteredProducts.length} items)
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
          <Text style={[styles.loaderText, { color: colors.textMuted }]}>Loading Store...</Text>
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
          ListEmptyComponent={
            <View style={[styles.emptyBox, { borderColor: colors.border }]}>
              <Icon source={storeBold} size={40} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No products found</Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                {search ? 'Try adjusting your search terms' : 'This seller has not listed any items yet.'}
              </Text>
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
  statLabel: { fontFamily: fonts.regular, fontSize: 11 },
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
  catalogTitle: { fontFamily: fonts.bold, fontSize: 16 },
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
  productBrand: { fontFamily: fonts.medium, fontSize: 11, textTransform: 'uppercase' },
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
