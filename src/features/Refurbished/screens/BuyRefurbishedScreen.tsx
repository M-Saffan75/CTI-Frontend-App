import { useEffect, useState } from 'react';
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
  arrowRightBold,
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
import {
  REFURBISHED_PRODUCTS,
  REFURBISHED_TESTIMONIALS,
  RefurbishedProduct,
} from '../data/refurbishedData';
import { getTopSellingProducts } from '../services/refurbishedApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 44) / 2;

export default function BuyRefurbishedScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [productsList, setProductsList] = useState<RefurbishedProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLiveData = async () => {
    try {
      const live = await getTopSellingProducts();
      setProductsList(Array.isArray(live) ? live : []);
    } catch (e) {
      setProductsList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLiveData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLiveData();
    setRefreshing(false);
  };

  const toggleWishlist = (id: string) => {
    if (wishlist.includes(id)) {
      setWishlist(wishlist.filter(item => item !== id));
    } else {
      setWishlist([...wishlist, id]);
    }
  };

  const handleProductPress = (product: RefurbishedProduct) => {
    if (typeof navigation.push === 'function') {
      navigation.push('RefurbishedProductDetail', { productId: product.id, product });
    } else {
      navigation.navigate('RefurbishedProductDetail', { productId: product.id, product });
    }
  };

  const renderProductCard = (product: RefurbishedProduct, index: number) => {
    const isWished = wishlist.includes(product.id);
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
              onPress={() => toggleWishlist(product.id)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Icon
                source={isWished ? heartFilled : heartExtra}
                size={18}
                color={isWished ? '#EF4444' : colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Discount Ribbon */}
          <View style={styles.ribbonWrapper}>
            <View style={styles.ribbonBadge}>
              <Text style={styles.ribbonText}>{product?.discountPercent ?? 0}%</Text>
            </View>
          </View>

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
              {(product?.brand || '').toUpperCase()} {(product?.category || '').toUpperCase()}
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
                <Text style={styles.refurbishedTagText}>Refurbished</Text>
              </View>

              <View style={styles.ratingBadge}>
                <Text style={[styles.ratingText, { color: colors.text }]}>5.0</Text>
                <Icon source={starFilled} size={12} color="#F59E0B" style={{ marginLeft: 2 }} />
              </View>

              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>Save ${product?.saveAmount ?? 0}</Text>
              </View>
            </View>

            {/* Price Row */}
            <View style={styles.priceRow}>
              <Text style={[styles.priceText, { color: colors.text }]}>${product?.price ?? 0}.00</Text>
              <Text style={[styles.mrpText, { color: colors.textMuted }]}>
                ${product?.originalPrice ?? 0}.00
              </Text>
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
            placeholder="Search order custom product"
            placeholderTextColor={colors.textMuted + '88'}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        {/* Hero Promotional Banner */}
        <FadeUp delay={80}>
          <View style={styles.heroBanner}>
            <View style={styles.heroContent}>
              <Text style={styles.heroPreText}>Windows</Text>
              <Text style={styles.heroTitle}>Laptops</Text>
              <View style={styles.heroPriceRow}>
                <Text style={styles.heroStarting}>Starting</Text>
                <Text style={styles.heroPrice}> ₹7,999</Text>
              </View>

              <Squeeze
                onPress={() =>
                  navigation.navigate('AllGadgets', { initialCategory: 'Laptop' })
                }
                style={styles.heroBtn}>
                <Icon source={arrowRightBold} size={16} color="#FFFFFF" />
              </Squeeze>
            </View>

            <Image
              source={demoProductPhoto}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </View>
        </FadeUp>

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
            <Text style={[styles.categoryLinkTitle, { color: colors.text }]}>Sell Phone</Text>
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
            <Text style={[styles.categoryLinkTitle, { color: colors.text }]}>Laptop</Text>
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
            <Text style={[styles.categoryLinkTitle, { color: colors.text }]}>Speaker</Text>
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
            <Text style={[styles.categoryLinkTitle, { color: colors.text }]}>Gaming</Text>
            <View style={styles.categoryIconWrap}>
              <Icon source={tagBold} size={32} color={colors.primary} />
            </View>
          </Squeeze>
        </ScrollView>

        {/* Real-time Products with Loading and Empty State */}
        {loading && !refreshing ? (
          <CtiLoader
            size="md"
            text="Loading refurbished devices..."
            style={{ paddingVertical: 40 }}
          />
        ) : productsList.length === 0 ? (
          <View style={{ paddingVertical: 50, alignItems: 'center' }}>
            <Icon source={packageBold} size={42} color={colors.textMuted} />
            <Text style={{ color: colors.text, fontFamily: fonts.bold, fontSize: 16, marginTop: 12 }}>
              No Devices Found
            </Text>
            <Text style={{ color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
              Currently there are no refurbished devices available.
            </Text>
          </View>
        ) : (
          <>
            {/* Section: Top Selling Devices */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Selling Devices</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AllGadgets')}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.productsGrid}>
              {(productsList || []).slice(0, 4).map((item, idx) => renderProductCard(item, idx))}
            </View>

            {/* Section: Top Selling Phone */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Selling Phone</Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('AllGadgets', { initialCategory: 'Sell Phone' })
                }>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.productsGrid}>
              {(productsList || [])
                .filter(p => p?.category === 'Sell Phone' || p?.category === 'Earbuds')
                .slice(0, 2)
                .map((item, idx) => renderProductCard(item, idx + 4))}
            </View>

            {/* Section: Top Selling Laptop */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Selling Laptop</Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('AllGadgets', { initialCategory: 'Laptop' })
                }>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.productsGrid}>
              {(productsList || [])
                .filter(p => p?.category === 'Laptop' || p?.brand === 'Hp')
                .concat((productsList || []).slice(0, 1))
                .slice(0, 2)
                .map((item, idx) => renderProductCard(item, idx + 6))}
            </View>

            {/* Section: In-Demand Smartwatches */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                In-Demand Smartwatches
              </Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('AllGadgets', { initialCategory: 'Smart watches' })
                }>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.productsGrid}>
              {(productsList || [])
                .filter(p => p?.category === 'Smart watches')
                .concat((productsList || []).slice(1, 2))
                .slice(0, 2)
                .map((item, idx) => renderProductCard(item, idx + 8))}
            </View>

            {/* Section: Trending Gamer Essentials */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Trending Gamer Essentials
              </Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('AllGadgets', { initialCategory: 'Gaming Console' })
                }>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.productsGrid}>
              {(productsList || [])
                .filter(p => p?.category === 'Gaming Console')
                .concat((productsList || []).slice(0, 1))
                .slice(0, 2)
                .map((item, idx) => renderProductCard(item, idx + 10))}
            </View>
          </>
        )}

        {/* Testimonials Section matching Figma */}
        <View style={styles.testimonialsSection}>
          <Text style={[styles.testimonialsHeadline, { color: colors.text }]}>
            10+ lakh Happy heroes of Earth trust us to buy refurbished phones
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.testimonialsScroll}>
            {(REFURBISHED_TESTIMONIALS || []).map(t => (
              <View
                key={t?.id}
                style={[
                  styles.testimonialCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border + '33',
                  },
                ]}>
                <Text style={[styles.quoteMark, { color: colors.primary }]}>“</Text>
                <Text style={[styles.testimonialFeedback, { color: colors.text }]}>
                  {t?.feedback || ''}
                </Text>
                <View style={styles.testimonialUserRow}>
                  <View style={[styles.avatarCircle, { backgroundColor: colors.primary + '22' }]}>
                    <Text style={[styles.avatarText, { color: colors.primary }]}>
                      {t?.name ? t.name.charAt(0) : 'U'}
                    </Text>
                  </View>
                  <Text style={[styles.testimonialUserName, { color: colors.text }]}>
                    {t?.name || 'Customer'}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
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
