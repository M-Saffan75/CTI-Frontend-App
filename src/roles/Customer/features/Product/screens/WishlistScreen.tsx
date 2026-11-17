import { useEffect, useState } from 'react';
import { formatMoney } from '@/utils/money';
import { Image, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import AuthService from '@/services/authService';
import Squeeze from '@/components/Squeeze';
import CtiLoader from '@/components/CtiLoader';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import { FadeUp } from '@/animations';
import { arrowLeftBold, heartExtra, heartFilled, menuBold, shoppingCartExtra } from '@/assets/icons';
import { ctiLogo, demoProductPhoto } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useWishlist } from '../../../context/WishlistContext';
import { useCart } from '../../../context/CartContext';
import { resolveImageSource } from '../services/ecomApi';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { upper } from '@/i18n/locale';

function WishlistCard({ product, navigation, onRemove }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const productId = String(product.id || product._id || '');
  const imageSource = resolveImageSource(product.image || product.images?.[0], demoProductPhoto);

  const price = Number(product.price || product.sellingPrice || 0);
  const originalPrice = Number(product.originalPrice || product.mrp || price);
  const discountPercent = product.discountPercent || (originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);

  return (
    <Squeeze
      onPress={() => {
        if (product.isRefurbished) {
          const slug = product.slug || product.raw?.slug;
          if (typeof navigation.push === 'function') {
            navigation.push('RefurbishedProductDetail', { productId, slug, product });
          } else {
            navigation.navigate('RefurbishedProductDetail', { productId, slug, product });
          }
        } else {
          if (typeof navigation.push === 'function') {
            navigation.push('ProductDetail', { productId, product });
          } else {
            navigation.navigate('ProductDetail', { productId, product });
          }
        }
      }}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.photoWrap}>
        <Image source={imageSource} style={styles.photo} resizeMode="cover" />
        <Image source={ctiLogo} resizeMode="contain" style={styles.cardLogo} />

        <Squeeze
          onPress={onRemove}
          scale={0.85}
          style={[styles.saveWrap, { backgroundColor: colors.surface }]}>
          <Icon source={heartFilled} size={16} color={colors.error} />
        </Squeeze>
      </View>

      <View style={styles.cardBody}>
        {product.isRefurbished && (
          <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 4 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 9, color: '#92400E' }}>{upper(t('glossary.refurbished'))}</Text>
          </View>
        )}
        <Text style={[styles.brand, { color: colors.textMuted }]} numberOfLines={1}>
          {typeof product.brand === 'string' ? product.brand : (product.brand as any)?.title || (product.brand as any)?.name || t('customer.ctiStore')}
        </Text>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
          {typeof product.title === 'string' ? product.title : (product.title as any)?.title || (product.title as any)?.name || t('tabs.product')}
        </Text>
        <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={2}>
          {typeof product.description === 'string' ? product.description : ''}
        </Text>
        <Text style={[styles.reviews, { color: colors.textMuted }]}>
          {product.reviewCount ? t(product.reviewCount === 1 ? 'customerMsg.reviewsOne' : 'customerMsg.reviewsMany', { count: product.reviewCount }) : t('customer.noReviews')}
        </Text>

        <View style={styles.priceRow}>
          {discountPercent > 0 && (
            <View style={[styles.discountPill, { backgroundColor: colors.primary }]}>
              <Text style={styles.discountText}>-{discountPercent}%</Text>
            </View>
          )}
          <Text style={[styles.price, { color: colors.text }]}>{formatMoney(price)}</Text>
          {originalPrice > price && (
            <Text style={[styles.originalPrice, { color: colors.textMuted }]}>
              {formatMoney(originalPrice)}
            </Text>
          )}
        </View>
      </View>
    </Squeeze>
  );
}

export default function WishlistScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { ids, items: contextItems, loading: wishlistLoading, toggle, refreshWishlist } = useWishlist();
  const { cartCount } = useCart();
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<{ type: AlertModalType; message: string } | null>(null);

  // Web: the wishlist page fetches the lists every time it opens
  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const handleRemove = async (product: any) => {
    try {
      await toggle(product);
    } catch {
      setNotice({ type: 'error', message: i18n.t('customer.failedToRemoveItem') });
    }
  };

  // Live items only from backend context - strictly no mock PRODUCTS
  const items = (contextItems || []).filter((product: any) =>
    ids.includes(String(product.id || product._id))
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshWishlist();
    setRefreshing(false);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Image source={ctiLogo} resizeMode="contain" style={styles.logo} />
        <View style={styles.headerIcons}>
          <View>
            <Icon source={heartExtra} size={22} color={colors.text} />
            {ids.length > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.error }]}>
                <Text style={styles.badgeText}>{ids.length}</Text>
              </View>
            )}
          </View>
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
        <Squeeze onPress={() => navigation.goBack()} scale={0.9} style={styles.backWrap}>
          <View style={[styles.back, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={20} color={colors.onPrimary} />
          </View>
        </Squeeze>

        <View style={styles.titleRow}>
          <Icon source={heartFilled} size={22} color={colors.error} />
          <Text style={[styles.title, { color: colors.text }]}>
            {t('customerMsg.myWishlist')}{' '}
            <Text style={{ color: colors.textMuted }}>
              {t(items.length === 1 ? 'customerMsg.itemsOne' : 'customerMsg.itemsMany', { count: items.length })}
            </Text>
          </Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {t('customer.itemsYouLoveSavedFor')}
        </Text>

        {wishlistLoading && !refreshing && items.length === 0 ? (
          <CtiLoader
            size="md"
            text={t('customer.loadingYourWishlist')}
            style={{ paddingVertical: 50 }}
          />
        ) : items.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 45, gap: 14 }}>
            <Icon source={heartExtra} size={48} color={colors.textMuted} />
            <Text style={[styles.empty, { color: colors.textMuted, marginTop: 0 }]}>
              {t('customer.nothingHereYetTapThe')}
            </Text>
            <Button
              title={t('customer.exploreProducts')}
              size="sm"
              onPress={() =>
                AuthService.getCachedRole() === 'customer'
                  ? navigation.navigate('Home', { screen: 'ProductTab' })
                  : navigation.navigate('Products')
              }
              style={{ marginTop: 6 }}
            />
          </View>
        ) : (
          <View style={styles.grid}>
            {items.map((product, index) => (
              <FadeUp
                key={`wishlist-${product.id || product._id || index}-${index}`}
                delay={60 + index * 40}
                duration={500}
                style={styles.gridItem}>
                <WishlistCard
                  product={product}
                  navigation={navigation}
                  onRemove={() => handleRemove(product)}
                />
              </FadeUp>
            ))}
          </View>
        )}

        <Button
          title={t('customer.continueShopping')}
          variant="soft"
          icon={arrowLeftBold}
          iconPosition="left"
          onPress={() => navigation.goBack()}
          style={styles.continueButton}
        />
      </ScrollView>

      <AlertModal
        visible={Boolean(notice)}
        type={notice?.type}
        title={t('glossary.wishlist')}
        message={notice?.message}
        onClose={() => setNotice(null)}
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
    paddingBottom: 10,
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

  body: { paddingHorizontal: 20 },
  backWrap: { alignSelf: 'flex-start' },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  title: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 24 },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },
  empty: { fontFamily: fonts.regular, fontSize: 14, marginTop: 40, textAlign: 'center' },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
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
  cardTitle: { fontFamily: fonts.bold, fontSize: 13, marginTop: 1 },
  description: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 15, marginTop: 2 },
  reviews: { fontFamily: fonts.regular, fontSize: 11, marginTop: 2 },

  priceRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 6 },
  discountPill: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  discountText: { fontFamily: fonts.bold, fontSize: 10, color: '#FFFFFF' },
  price: { fontFamily: fonts.bold, fontSize: 13 },
  originalPrice: { fontFamily: fonts.regular, fontSize: 11, textDecorationLine: 'line-through' },

  continueButton: { marginTop: 24 },
});
