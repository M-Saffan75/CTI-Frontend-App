import { useEffect, useState } from 'react';
import { formatMoney } from '@/utils/money';
import {
  Dimensions,
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

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  desktopBold,
  heartExtra,
  heartFilled,
  mobileBold,
  packageBold,
  searchBold,
  starFilled,
  tagBold,
} from '@/assets/icons';
import { ctiLogo, demoProductPhoto } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import RefurbishedHeader from '../components/RefurbishedHeader';
import RefurbishedFilterModal from '../components/RefurbishedFilterModal';
import CtiLoader from '@/components/CtiLoader';
import LoadErrorBox from '../components/LoadErrorBox';
import { normalizeApiError } from '@/services/apiError';
import {
  RefurbishedProduct,
} from '../data/refurbishedData';
import {
  getTopSellingProducts,
  fetchAllRefurbishedProducts,
} from '../services/refurbishedApi';
import { useWishlist } from '@/roles/Customer/context/WishlistContext';
import { upper } from '@/i18n/locale';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 44) / 2;

export default function BuyRefurbishedScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { ids: wishlistIds, toggle: toggleWishlistContext, refreshWishlist } = useWishlist();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [productsList, setProductsList] = useState<RefurbishedProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);

  const [loadError, setLoadError] = useState('');
  const [topSelling, setTopSelling] = useState<RefurbishedProduct[]>([]);

  const loadLiveData = async () => {
    try {
      setLoadError('');
      const [allProducts, top] = await Promise.all([
        fetchAllRefurbishedProducts(),
        getTopSellingProducts().catch(() => []),
      ]);
      setProductsList(allProducts);
      setTopSelling(Array.isArray(top) ? top : []);
    } catch (err) {
      setProductsList([]);
      setLoadError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLiveData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadLiveData(), refreshWishlist()]);
    setRefreshing(false);
  };

  // The heart flips at once and goes back by itself if the request fails.
  const toggleWishlist = async (product: RefurbishedProduct) => {
    try {
      await toggleWishlistContext(product, product.defaultVariantId);
    } catch {}
  };

  // Sections show only devices that really belong to them (nothing is borrowed from another category)
  const has = (p: RefurbishedProduct, words: string[]) =>
    words.some(w => (p?.category || '').toLowerCase().includes(w) || (p?.name || '').toLowerCase().includes(w));
  const sectionDefs = [
    { title: t('customer.phones'), category: 'Sell Phone', limit: 4, match: (p: RefurbishedProduct) => has(p, ['phone', 'mobile']) },
    { title: t('customer.laptops'), category: 'Laptop', limit: 4, match: (p: RefurbishedProduct) => has(p, ['laptop', 'notebook']) },
    { title: t('customer.smartwatches'), category: 'Smartwatches', limit: 4, match: (p: RefurbishedProduct) => has(p, ['watch']) },
    { title: t('customer.gaming'), category: 'Gaming Console', limit: 4, match: (p: RefurbishedProduct) => has(p, ['gaming', 'console']) },
  ];
  const searchResults = searchQuery.trim()
    ? productsList.filter(p =>
        [p?.name, p?.brand, p?.category].some(v => (v || '').toLowerCase().includes(searchQuery.trim().toLowerCase())),
      )
    : [];

  const handleProductPress = (product: RefurbishedProduct) => {
    const slug = product.slug || product.raw?.slug;
    const pId = String(product.rawId || product.id);
    if (typeof navigation.push === 'function') {
      navigation.push('RefurbishedProductDetail', { productId: pId, slug, product });
    } else {
      navigation.navigate('RefurbishedProductDetail', { productId: pId, slug, product });
    }
  };

  const renderProductCard = (product: RefurbishedProduct, index: number) => {
    const pId = String(product.rawId || product.id);
    const isWished = wishlistIds.includes(pId) || wishlistIds.includes(String(product.id));
    return (
      <FadeUp key={product.id + index} delay={index * 40}>
        <Squeeze
          onPress={() => handleProductPress(product)}
          style={[
            styles.productCard,
            {
              width: CARD_WIDTH,
              backgroundColor: colors.surface,
              borderColor: colors.border + '44',
            },
          ]}>
          {/* Top badges & icons */}
          <View style={styles.cardHeader}>
            <Image source={ctiLogo} style={styles.miniLogo} resizeMode="contain" />
            <TouchableOpacity
              onPress={() => toggleWishlist(product)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Icon
                source={isWished ? heartFilled : heartExtra}
                size={18}
                color={isWished ? '#EF4444' : colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Discount Ribbon: only when the backend has a discount */}
          {Number(product?.discountPercent) > 0 ? (
            <View style={styles.ribbonWrapper}>
              <View style={styles.ribbonBadge}>
                <Text style={styles.ribbonText}>{product.discountPercent}%</Text>
              </View>
            </View>
          ) : null}

          {/* Product Image */}
          <View style={styles.imageBox}>
            <Image
              source={product?.image || demoProductPhoto}
              style={styles.productImg}
              resizeMode="contain"
            />
          </View>

          {/* Product Info */}
          <View style={styles.infoBox}>
            <Text style={[styles.brandText, { color: colors.textMuted }]} numberOfLines={1}>
              {upper(product?.brand || '')} {upper(product?.category || '')}
            </Text>
            <Text style={[styles.nameText, { color: colors.text }]} numberOfLines={1}>
              {product?.name || ''}
            </Text>
            <Text style={[styles.subtitleText, { color: colors.textMuted }]} numberOfLines={2}>
              {product?.subtitle || ''}
            </Text>

            {/* Badges Row */}
            <View style={styles.tagsRow}>
              <View style={[styles.refurbishedTag, { backgroundColor: colors.primary }]}>
                <Text style={styles.refurbishedTagText}>{i18n.t('glossary.refurbished')}</Text>
              </View>

              {Number(product?.rating) > 0 ? (
                <View style={styles.ratingBadge}>
                  <Text style={[styles.ratingText, { color: colors.text }]}>{Number(product.rating).toFixed(1)}</Text>
                  <Icon source={starFilled} size={12} color="#F59E0B" style={{ marginLeft: 2 }} />
                </View>
              ) : null}

              {Number(product?.saveAmount) > 0 ? (
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>{t('customerMsg.saveAmount', { amount: formatMoney(product.saveAmount) })}</Text>
                </View>
              ) : null}
            </View>

            {/* Price Row */}
            <View style={styles.priceRow}>
              <Text style={[styles.priceText, { color: colors.text }]}>{formatMoney(product?.price)}</Text>
              {Number(product?.originalPrice) > Number(product?.price) ? (
                <Text style={[styles.mrpText, { color: colors.textMuted }]}>
                  {formatMoney(product?.originalPrice)}
                </Text>
              ) : null}
            </View>
          </View>
        </Squeeze>
      </FadeUp>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <RefurbishedHeader
        onFilterPress={() => setFilterModalVisible(true)}
        onCartPress={() => {
          try {
            navigation.navigate('Cart');
          } catch {}
        }}
        onWishlistPress={() => {
          try {
            navigation.navigate('Wishlist');
          } catch {}
        }}
        onMenuPress={() => {
          try {
            navigation.navigate('Settings');
          } catch {}
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
        {/* Back Button matching About Screen */}
        <Squeeze
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
          }}
          scale={0.9}
          style={styles.backWrap}>
          <View style={[styles.back, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={20} color={colors.onPrimary} />
          </View>
        </Squeeze>

        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surfaceAlt,
              borderColor: colors.border + '33',
            },
          ]}>
          <Icon source={searchBold} size={18} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('customer.searchDevices')}
            placeholderTextColor={colors.textMuted + '88'}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        {/* Category Quick Links (Figma: Sell Phone, Laptop, Speaker, Gaming console) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryLinksScroll}>
          {/* Sell Phone Quick Link */}
          <Squeeze
            onPress={() => navigation.navigate('SellRefurbished')}
            style={[
              styles.categoryLinkCard,
              { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '33' },
            ]}>
            <Text style={[styles.categoryLinkTitle, { color: colors.text }]}>{t('settings.menu.sellPhone')}</Text>
            <View style={styles.categoryIconWrap}>
              <Icon source={mobileBold} size={32} color={colors.primary} />
            </View>
          </Squeeze>

          {/* Laptop Quick Link */}
          <Squeeze
            onPress={() =>
              navigation.navigate('AllGadgets', { initialCategory: 'Laptop' })
            }
            style={[
              styles.categoryLinkCard,
              { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '33' },
            ]}>
            <Text style={[styles.categoryLinkTitle, { color: colors.text }]}>{t('customer.laptop')}</Text>
            <View style={styles.categoryIconWrap}>
              <Icon source={desktopBold} size={32} color={colors.primary} />
            </View>
          </Squeeze>

          {/* Speaker Quick Link */}
          <Squeeze
            onPress={() =>
              navigation.navigate('AllGadgets', { initialCategory: 'Speaker' })
            }
            style={[
              styles.categoryLinkCard,
              { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '33' },
            ]}>
            <Text style={[styles.categoryLinkTitle, { color: colors.text }]}>{t('customer.speaker')}</Text>
            <View style={styles.categoryIconWrap}>
              <Icon source={packageBold} size={32} color={colors.primary} />
            </View>
          </Squeeze>

          {/* Gaming console Quick Link */}
          <Squeeze
            onPress={() =>
              navigation.navigate('AllGadgets', { initialCategory: 'Gaming Console' })
            }
            style={[
              styles.categoryLinkCard,
              { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '33' },
            ]}>
            <Text style={[styles.categoryLinkTitle, { color: colors.text }]}>{t('customer.gaming')}</Text>
            <View style={styles.categoryIconWrap}>
              <Icon source={tagBold} size={32} color={colors.primary} />
            </View>
          </Squeeze>
        </ScrollView>

        {/* Real-time Products with Loading and Empty State */}
        {loading && !refreshing ? (
          <CtiLoader
            size="md"
            text={t('customer.loadingRefurbishedDevices')}
            style={{ paddingVertical: 40 }}
          />
        ) : loadError ? (
          <LoadErrorBox
            title={t('customer.couldNotLoadTheDevices')}
            message={loadError}
            onRetry={() => {
              setLoading(true);
              loadLiveData();
            }}
          />
        ) : productsList.length === 0 ? (
          <View style={{ paddingVertical: 50, alignItems: 'center' }}>
            <Icon source={packageBold} size={42} color={colors.textMuted} />
            <Text style={{ color: colors.text, fontFamily: fonts.bold, fontSize: 16, marginTop: 12 }}>
              {t('customer.noDevicesFound')}
            </Text>
            <Text style={{ color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
              {t('customer.currentlyThereAreNoRefurbished')}
            </Text>
          </View>
        ) : searchQuery.trim() ? (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('customer.searchResults')}</Text>
            </View>
            <View style={styles.productsGrid}>
              {searchResults.length > 0 ? (
                searchResults.map((item, idx) => renderProductCard(item, idx))
              ) : (
                <Text style={{ color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13 }}>
                  {t('customer.noDevicesMatchYourSearch')}
                </Text>
              )}
            </View>
          </>
        ) : (
          <>
            {topSelling.length > 0 ? (
              <>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('customer.topSellingDevices')}</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('AllGadgets')}>
                    <Text style={[styles.seeAllText, { color: colors.primary }]}>{t('customer.seeAll')}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.productsGrid}>
                  {topSelling.slice(0, 4).map((item, idx) => renderProductCard(item, idx))}
                </View>
              </>
            ) : null}

            {sectionDefs.map(section => {
              const items = productsList.filter(section.match).slice(0, section.limit);
              if (items.length === 0) return null;
              return (
                <View key={section.title}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('AllGadgets', { initialCategory: section.category })}>
                      <Text style={[styles.seeAllText, { color: colors.primary }]}>{i18n.t('customer.seeAll')}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.productsGrid}>
                    {items.map((item, idx) => renderProductCard(item, idx))}
                  </View>
                </View>
              );
            })}
          </>
        )}

      </ScrollView>

      {/* Filter Modal */}
      <RefurbishedFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={filters => {
          navigation.navigate('AllGadgets', { appliedFilters: filters });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
  },
  backWrap: {
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    padding: 0,
  },
  heroBanner: {
    marginHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#0284C7',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    minHeight: 150,
    marginBottom: 18,
  },
  heroContent: {
    flex: 1,
    zIndex: 2,
  },
  heroPreText: {
    color: '#E0F2FE',
    fontSize: 22,
    fontFamily: fonts.bold,
    lineHeight: 26,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: fonts.bold,
    lineHeight: 28,
  },
  heroPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 6,
    marginBottom: 12,
  },
  heroStarting: {
    color: '#BAE6FD',
    fontSize: 13,
    fontFamily: fonts.regular,
  },
  heroPrice: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: fonts.bold,
  },
  heroBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0369A1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: 130,
    height: 120,
    marginLeft: 8,
  },
  categoryLinksScroll: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  categoryLinkCard: {
    width: 105,
    height: 110,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryLinkTitle: {
    fontSize: 12,
    fontFamily: fonts.medium,
    textAlign: 'center',
  },
  categoryIconWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 6,
  },
  sectionTitle: {
    flexShrink: 1,
    fontSize: 18,
    fontFamily: fonts.bold,
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  productCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  miniLogo: {
    width: 60,
    height: 20,
  },
  ribbonWrapper: {
    position: 'absolute',
    left: -2,
    top: 50,
    zIndex: 10,
  },
  ribbonBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  ribbonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: fonts.bold,
  },
  imageBox: {
    width: '100%',
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  productImg: {
    width: '80%',
    height: '100%',
  },
  infoBox: {
    marginTop: 4,
  },
  brandText: {
    fontSize: 10,
    fontFamily: fonts.medium,
    letterSpacing: 0.5,
  },
  nameText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    marginTop: 2,
  },
  subtitleText: {
    fontSize: 11,
    fontFamily: fonts.regular,
    marginTop: 2,
    lineHeight: 15,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  refurbishedTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  refurbishedTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: fonts.bold,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  ratingText: {
    fontSize: 10,
    fontFamily: fonts.bold,
  },
  saveBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  saveBadgeText: {
    color: '#0284C7',
    fontSize: 9,
    fontFamily: fonts.bold,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 6,
  },
  priceText: {
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  mrpText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    textDecorationLine: 'line-through',
  },
  testimonialsSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  testimonialsHeadline: {
    fontSize: 17,
    fontFamily: fonts.bold,
    paddingHorizontal: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  testimonialsScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  testimonialCard: {
    width: SCREEN_WIDTH * 0.72,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  quoteMark: {
    fontSize: 32,
    fontFamily: fonts.bold,
    lineHeight: 32,
  },
  testimonialFeedback: {
    fontSize: 12,
    fontFamily: fonts.regular,
    lineHeight: 18,
    marginVertical: 8,
  },
  testimonialUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  testimonialUserName: {
    fontSize: 13,
    fontFamily: fonts.medium,
  },
});
