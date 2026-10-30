import { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  chevronDownBold,
  chevronRightBold,
  packageBold,
  starFilled,
} from '@/assets/icons';
import { demoProductPhoto } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import RefurbishedHeader from '../components/RefurbishedHeader';
import RefurbishedFilterModal from '../components/RefurbishedFilterModal';
import CtiLoader from '@/components/CtiLoader';
import {
  REFURBISHED_PRODUCTS,
  RefurbishedProduct,
} from '../data/refurbishedData';
import { getRefurbishedProducts } from '../services/refurbishedApi';

const SORT_OPTIONS = [
  'Default Sorting',
  'Price: Low to High',
  'Price: High to Low',
  'Highest Rated',
  'Newest Arrivals',
];

export default function AllGadgetsScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const initialCategory = route?.params?.initialCategory;
  const initialFilters = route?.params?.appliedFilters;

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>(initialFilters || null);
  const [sortOption, setSortOption] = useState('Default Sorting');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [rawProducts, setRawProducts] = useState<RefurbishedProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLiveProducts = async () => {
    try {
      const live = await getRefurbishedProducts();
      setRawProducts(Array.isArray(live) ? live : []);
    } catch (e) {
      setRawProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveProducts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLiveProducts();
    setRefreshing(false);
  };

  // Filter products based on category or active filters
  let filtered = Array.isArray(rawProducts) ? [...rawProducts] : [];

  if (initialCategory) {
    const rawClean = String(initialCategory).toLowerCase();
    const catClean = rawClean.replace(/[\s\-_]+/g, '');
    filtered = filtered.filter(p => {
      const pCat = String(p?.category || '').toLowerCase();
      const pCatClean = pCat.replace(/[\s\-_]+/g, '');
      const pName = String(p?.name || '').toLowerCase();

      // Flexible Watch matching ("Smartwatches", "Smart watches", "watch")
      if (rawClean.includes('watch') && (pCat.includes('watch') || pName.includes('watch'))) {
        return true;
      }
      // Phone / Mobile matching
      if (
        (rawClean.includes('phone') || rawClean.includes('mobile')) &&
        (pCat.includes('phone') || pCat.includes('mobile') || pName.includes('phone'))
      ) {
        return true;
      }
      // General clean match
      return (
        pCat.includes(rawClean) ||
        pCatClean.includes(catClean) ||
        catClean.includes(pCatClean) ||
        pName.includes(rawClean)
      );
    });
  }

  if (activeFilters) {
    if (Array.isArray(activeFilters?.types) && !activeFilters.types.includes('all')) {
      filtered = filtered.filter(p => {
        const pCat = String(p?.category || '').toLowerCase();
        const pName = String(p?.name || '').toLowerCase();
        return activeFilters.types.some((t: string) => {
          const typeLower = String(t).toLowerCase();
          if (typeLower === 'watch' && (pCat.includes('watch') || pName.includes('watch'))) {
            return true;
          }
          if (
            (typeLower === 'phone' || typeLower === 'mobile') &&
            (pCat.includes('phone') || pCat.includes('mobile') || pName.includes('phone'))
          ) {
            return true;
          }
          return pCat.includes(typeLower) || pName.includes(typeLower);
        });
      });
    }
    if (Array.isArray(activeFilters?.brands) && activeFilters.brands.length > 0) {
      filtered = filtered.filter(p =>
        activeFilters.brands.some((b: string) =>
          p?.brand?.toLowerCase() === String(b).toLowerCase(),
        ),
      );
    }
    if (activeFilters?.minPrice !== undefined) {
      filtered = filtered.filter(p => (p?.price ?? 0) >= Number(activeFilters.minPrice));
    }
    if (activeFilters?.maxPrice !== undefined) {
      filtered = filtered.filter(p => (p?.price ?? 0) <= Number(activeFilters.maxPrice));
    }
  }

  // Apply Sorting
  if (sortOption === 'Price: Low to High') {
    filtered.sort((a, b) => (a?.price ?? 0) - (b?.price ?? 0));
  } else if (sortOption === 'Price: High to Low') {
    filtered.sort((a, b) => (b?.price ?? 0) - (a?.price ?? 0));
  } else if (sortOption === 'Highest Rated') {
    filtered.sort((a, b) => (b?.rating ?? 0) - (a?.rating ?? 0));
  }

  const handleProductPress = (product: RefurbishedProduct) => {
    const slug = product?.slug || product?.raw?.slug;
    const pId = String(product?.rawId || product?.id);
    if (typeof navigation.push === 'function') {
      navigation.push('RefurbishedProductDetail', { productId: pId, slug, product });
    } else {
      navigation.navigate('RefurbishedProductDetail', { productId: pId, slug, product });
    }
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
            <Icon source={arrowLeftBold} size={20} color="#FFFFFF" />
          </View>
        </Squeeze>

        {/* Title & Subtitle matching Figma */}
        <View style={styles.titleSection}>
          <Text style={[styles.mainHeading, { color: colors.text }]}>
            All Refurbished Gadgets
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Showing {filtered.length} premium refurbished products
          </Text>
        </View>

        {/* Sort Row */}
        <View style={styles.sortRow}>
          <TouchableOpacity
            style={[styles.sortLabelBtn, { backgroundColor: colors.surfaceAlt }]}
            onPress={() => setSortMenuVisible(true)}>
            <Text style={[styles.sortLabelText, { color: colors.text }]}>Sort By:</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortDropdownBtn, { backgroundColor: colors.primary }]}
            onPress={() => setSortMenuVisible(true)}>
            <Text style={styles.sortDropdownText}>{sortOption}</Text>
            <Icon source={chevronDownBold} size={14} color="#FFFFFF" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>

        {/* Loading & Empty States */}
        {loading && !refreshing ? (
          <CtiLoader
            size="md"
            text="Loading gadgets..."
            style={{ paddingVertical: 45 }}
          />
        ) : filtered.length === 0 ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <Icon source={packageBold} size={48} color={colors.textMuted} />
            <Text style={{ color: colors.text, fontFamily: fonts.bold, fontSize: 16, marginTop: 14 }}>
              No Products Found
            </Text>
            <Text style={{ color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, marginTop: 6, textAlign: 'center', maxWidth: 260 }}>
              No refurbished devices match your current selection or category.
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {(filtered || []).map((item, index) => (
            <FadeUp key={item?.id || index} delay={index * 50}>
              <View
                style={[
                  styles.horizontalCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border + '44',
                  },
                ]}>
                <View style={styles.cardTopRow}>
                  {/* Left: Thumbnail with discount ribbon */}
                  <View
                    style={[
                      styles.thumbBox,
                      { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '33' },
                    ]}>
                    <View style={styles.redRibbon}>
                      <Text style={styles.redRibbonText}>{item?.discountPercent ?? 0}%</Text>
                    </View>
                    <Image
                      source={item?.image || demoProductPhoto}
                      style={styles.thumbImage}
                      resizeMode="contain"
                    />
                  </View>

                  {/* Right Details */}
                  <View style={styles.cardInfo}>
                    <View style={styles.brandRatingRow}>
                      <View
                        style={[
                          styles.brandPill,
                          { borderColor: colors.border + '55', backgroundColor: colors.surfaceAlt },
                        ]}>
                        <Text style={[styles.brandPillText, { color: colors.text }]}>
                          {item?.brand || ''}
                        </Text>
                      </View>

                      <View style={styles.ratingBadge}>
                        <Text style={[styles.ratingNumber, { color: colors.text }]}>
                          {(item?.rating ?? 4.5).toFixed(1)}
                        </Text>
                        <Icon
                          source={starFilled}
                          size={12}
                          color="#F59E0B"
                          style={{ marginLeft: 3 }}
                        />
                      </View>
                    </View>

                    <Text style={[styles.cardTitle, { color: colors.primary }]} numberOfLines={1}>
                      {item?.name || ''}
                    </Text>

                    <View style={styles.priceRow}>
                      <Text style={[styles.priceText, { color: colors.text }]}>
                        ${item?.price ?? 0}.00
                      </Text>
                      <Text style={[styles.mrpText, { color: colors.textMuted }]}>
                        ${item?.originalPrice ?? 0}.00
                      </Text>
                    </View>

                    <Text style={[styles.cardDesc, { color: colors.textMuted }]} numberOfLines={2}>
                      {item?.specs?.buildAndMaterials || item?.description || ''}
                    </Text>
                  </View>
                </View>

                {/* Bottom Full Width View Detail Button */}
                <Squeeze
                  onPress={() => handleProductPress(item)}
                  style={[styles.viewDetailBtn, { backgroundColor: colors.primary }]}>
                  <View style={styles.viewDetailRow}>
                    <Text style={styles.viewDetailText}>View Detail</Text>
                    <Icon
                      source={chevronRightBold}
                      size={14}
                      color="#FFFFFF"
                      style={{ marginLeft: 6 }}
                    />
                  </View>
                </Squeeze>
              </View>
            </FadeUp>
          ))}
        </View>
        )}
      </ScrollView>

      {/* Sort Menu Modal */}
      <Modal
        visible={sortMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSortMenuVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSortMenuVisible(false)}>
          <View
            style={[
              styles.sortMenuDialog,
              { backgroundColor: colors.surface, borderColor: colors.border + '44' },
            ]}>
            <Text style={[styles.sortMenuTitle, { color: colors.text }]}>Select Sorting</Text>
            {SORT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt}
                onPress={() => {
                  setSortOption(opt);
                  setSortMenuVisible(false);
                }}
                style={[
                  styles.sortMenuItem,
                  sortOption === opt && { backgroundColor: colors.primary + '18' },
                ]}>
                <Text
                  style={[
                    styles.sortMenuText,
                    { color: sortOption === opt ? colors.primary : colors.text },
                  ]}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Filter Modal */}
      <RefurbishedFilterModal
        visible={filterModalVisible}
        initialFilters={activeFilters || {}}
        onClose={() => setFilterModalVisible(false)}
        onApply={filters => setActiveFilters(filters)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
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
  titleSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  mainHeading: {
    fontSize: 22,
    fontFamily: fonts.bold,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: fonts.regular,
    marginTop: 4,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  sortLabelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sortLabelText: {
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  sortDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sortDropdownText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  horizontalCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    overflow: 'hidden',
  },
  cardTopRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
  },
  thumbBox: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  redRibbon: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderTopRightRadius: 6,
    zIndex: 2,
  },
  redRibbonText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: fonts.bold,
  },
  thumbImage: {
    width: '80%',
    height: '80%',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  brandRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  brandPillText: {
    fontSize: 11,
    fontFamily: fonts.medium,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2,
  },
  priceText: {
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  mrpText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    textDecorationLine: 'line-through',
  },
  cardDesc: {
    fontSize: 11,
    fontFamily: fonts.regular,
    lineHeight: 15,
    marginTop: 4,
  },
  viewDetailBtn: {
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sortMenuDialog: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  sortMenuTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    marginBottom: 12,
  },
  sortMenuItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  sortMenuText: {
    fontSize: 14,
    fontFamily: fonts.medium,
  },
});
