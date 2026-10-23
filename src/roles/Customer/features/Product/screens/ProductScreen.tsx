import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import { FadeUp } from '@/animations';
import { heartExtra, heartFilled, menuBold, shoppingCartExtra } from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useWishlist } from '../../../context/WishlistContext';
import { PRODUCTS } from '../data/products';
import { getCartApi, getEcomProducts, MobileEcomProduct } from '../services/ecomApi';

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
      onPress={() => navigation.navigate('ProductDetail', { productId: product.id, product })}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.photoWrap}>
        <Image source={imageSource} style={styles.photo} resizeMode="cover" />
        <Image source={ctiLogo} resizeMode="contain" style={styles.cardLogo} />

        <Squeeze
          onPress={() => toggle(product.id)}
          scale={0.85}
          style={[styles.saveWrap, { backgroundColor: colors.surface }]}>
          <Icon source={saved ? heartFilled : heartExtra} size={16} color={saved ? colors.error : colors.text} />
        </Squeeze>
      </View>

      <View style={styles.cardBody}>
        <Text style={[styles.brand, { color: colors.textMuted }]} numberOfLines={1}>
          {product.brand || 'CTI Store'}
        </Text>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {product.title}
        </Text>
        <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={2}>
          {product.description}
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

export default function ProductScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { ids } = useWishlist();

  const [products, setProducts] = useState<MobileEcomProduct[]>(PRODUCTS as any);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cartCount, setCartCount] = useState(0);

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

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [fetchedProducts, cartData] = await Promise.all([
        getEcomProducts(),
        getCartApi().catch(() => ({ items: [] })),
      ]);

      if (fetchedProducts && fetchedProducts.length > 0) {
        setProducts(fetchedProducts);
      }
      if (cartData?.items) {
        const totalQty = (cartData.items as any[]).reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);
        setCartCount(totalQty);
      }
    } catch (err: any) {
      setModal({
        visible: true,
        type: 'error',
        title: 'Error Loading Store',
        message: err?.message || 'Could not load products. Showing cached products.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener?.('focus', () => {
      // Refresh cart count on screen focus
      getCartApi()
        .then(c => {
          if (c?.items) {
            const count = (c.items as any[]).reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);
            setCartCount(count);
          }
        })
        .catch(() => {});
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    loadData(true);
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
          <View style={{ paddingVertical: 50, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 12, color: colors.textMuted, fontFamily: fonts.regular }}>
              Loading marketplace products...
            </Text>
          </View>
        ) : products.length === 0 ? (
          <View style={{ paddingVertical: 50, alignItems: 'center' }}>
            <Text style={{ color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14 }}>
              No products available right now.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {products.map((product, index) => (
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
