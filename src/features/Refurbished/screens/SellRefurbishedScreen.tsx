import { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
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
import CtiLoader from '@/components/CtiLoader';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  arrowRightBold,
  checkCircleBold,
  packageBold,
  searchBold,
  chevronDownBold,
  chevronUpBold,
  phoneBold,
  storeBold,
} from '@/assets/icons';
import { demoProductPhoto } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import SellWebSections from '../components/SellWebSections';
import LoadErrorBox from '../components/LoadErrorBox';
import { normalizeApiError } from '@/services/apiError';
import RefurbishedHeader from '../components/RefurbishedHeader';
import {
} from '../data/refurbishedData';
import {
  getAllSellBrands,
  getSellHeaderData,
  getAllSellModels,
} from '../services/refurbishedApi';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BRAND_CARD_WIDTH = (SCREEN_WIDTH - 52) / 3;
const GADGET_CARD_WIDTH = (SCREEN_WIDTH - 44) / 2;

export default function SellRefurbishedScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const initialMode = route?.params?.mode === 'gadget' ? 'gadget' : 'phone';
  const [activeTab, setActiveTab] = useState<'phone' | 'gadget'>(initialMode);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [brandsList, setBrandsList] = useState<any[]>([]);
  const [gadgetCategories, setGadgetCategories] = useState<any[]>([]);
  const [allModels, setAllModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllBrands, setShowAllBrands] = useState(false);

  useEffect(() => {
    setLoading(true);
    setLoadError('');
    Promise.all([
      getAllSellBrands(),
      getSellHeaderData(),
      getAllSellModels(),
    ])
      .then(([brands, headerData, models]) => {
        if (Array.isArray(brands) && brands.length > 0) {
          setBrandsList(brands);
          setSelectedBrand(brands[0].name || '');
        }
        if (headerData?.sellGadgets && Array.isArray(headerData.sellGadgets)) {
          setGadgetCategories(headerData.sellGadgets);
        }
        if (Array.isArray(models)) {
          setAllModels(models);
        }
      })
      .catch(err => {
        setLoadError(normalizeApiError(err).message);
      })
      .finally(() => setLoading(false));
  }, [reloadKey]);

  // Filter models for instant search autocomplete
  const filteredSuggestions = searchQuery.trim()
    ? allModels
        .filter(m => {
          const name = (m.name || '').toLowerCase();
          const bName = (m.brandName || '').toLowerCase();
          const q = searchQuery.toLowerCase();
          return name.includes(q) || bName.includes(q);
        })
        .slice(0, 6)
    : [];

  const handleBrandSelect = (brandName: string, brandSlug?: string, brandId?: string) => {
    setSelectedBrand(brandName);
    navigation.navigate('SelectModel', {
      brand: brandName,
      brandSlug: brandSlug || brandName.toLowerCase(),
      brandId,
      categorySlug: activeTab === 'phone' ? 'phone' : undefined,
    });
  };

  const handleSuggestionSelect = (item: any) => {
    setSearchQuery('');
    navigation.navigate('SelectVariant', {
      brand: item.brandName || i18n.t('customerMsg.device'),
      brandSlug: item.brandSlug || 'device',
      brandId: item.brandId?._id || item.brandId,
      model: item.name,
      modelSlug: item.slug,
      modelId: item._id,
      categoryId: item.categoryId,
      categorySlug: item.categorySlug || item.categoryId?.slug || (activeTab === 'phone' ? 'phone' : undefined),
    });
  };

  const handleGadgetCategorySelect = (category: any) => {
    const firstBrand = category.brands?.[0];
    const catSlug = category.slug || category.id || 'gadgets';
    if (firstBrand) {
      navigation.navigate('SelectModel', {
        brand: firstBrand.name,
        brandSlug: firstBrand.slug,
        brandId: firstBrand._id,
        categorySlug: catSlug,
      });
    } else {
      navigation.navigate('SelectModel', {
        brand: category.name || t('customerMsg.all'),
        brandSlug: 'all',
        categorySlug: catSlug,
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <RefurbishedHeader
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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
        
        {/* Back Button matching About Screen */}
        <Squeeze
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }}
          scale={0.9}
          style={styles.backWrap}>
          <View style={[styles.back, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={20} color={colors.onPrimary} />
          </View>
        </Squeeze>

        {/* Mode Switcher Tabs (Sell Phone vs Sell Gadgets) */}
        <View style={[styles.tabsRow, { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '33' }]}>
          <TouchableOpacity
            onPress={() => setActiveTab('phone')}
            style={[
              styles.tabBtn,
              activeTab === 'phone' && { backgroundColor: colors.primary },
            ]}>
            <Icon
              source={phoneBold}
              size={14}
              color={activeTab === 'phone' ? '#FFFFFF' : colors.textMuted}
            />
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'phone' ? '#FFFFFF' : colors.text },
              ]}>
              {t('settings.menu.sellPhone')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('gadget')}
            style={[
              styles.tabBtn,
              activeTab === 'gadget' && { backgroundColor: colors.primary },
            ]}>
            <Icon
              source={storeBold}
              size={14}
              color={activeTab === 'gadget' ? '#FFFFFF' : colors.textMuted}
            />
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'gadget' ? '#FFFFFF' : colors.text },
              ]}>
              {t('settings.menu.sellGadgets')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar with live autocomplete */}
        <View style={styles.searchSection}>
          <View
            style={[
              styles.searchBar,
              { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '33' },
            ]}>
            <Icon source={searchBold} size={18} color={colors.textMuted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={activeTab === 'phone' ? t('customer.searchPhoneModelEG') : t('customer.searchGadgetModelEG')}
              placeholderTextColor={colors.textMuted + '88'}
              style={[styles.searchInput, { color: colors.text }]}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                <Text style={[styles.clearSearchText, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Autocomplete Dropdown List */}
          {filteredSuggestions.length > 0 ? (
            <View
              style={[
                styles.suggestionsBox,
                { backgroundColor: colors.surface, borderColor: colors.border + '44' },
              ]}>
              {filteredSuggestions.map((item, idx) => (
                <TouchableOpacity
                  key={item._id || idx}
                  onPress={() => handleSuggestionSelect(item)}
                  style={[
                    styles.suggestionItem,
                    idx < filteredSuggestions.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border + '22',
                    },
                  ]}>
                  <View style={styles.suggestionLeft}>
                    <Text style={[styles.suggestionTitle, { color: colors.text }]}>
                      {item.name}
                    </Text>
                    {item.brandName ? (
                      <Text style={[styles.suggestionBrand, { color: colors.primary }]}>
                        {item.brandName}
                      </Text>
                    ) : null}
                  </View>
                  <Icon source={arrowRightBold} size={12} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>

        {/* Hero Promotional Banner */}
        <FadeUp delay={60}>
          <View style={styles.heroBanner}>
            <View style={styles.heroTextCol}>
              <Text style={styles.heroHeadline}>
                {activeTab === 'phone' ? t('customer.sellOldMobilePhoneFor') : t('customer.sellYourGadgetsForInstant')}
              </Text>
              <Squeeze
                onPress={() => {
                  if (activeTab === 'phone') {
                    handleBrandSelect(selectedBrand);
                  } else if (gadgetCategories.length > 0) {
                    handleGadgetCategorySelect(gadgetCategories[0]);
                  }
                }}
                style={styles.heroActionBtn}>
                <View style={styles.heroActionRow}>
                  <Text style={styles.heroActionBtnText}>{t('customer.sellNow')}</Text>
                  <Icon source={arrowRightBold} size={14} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </View>
              </Squeeze>
            </View>

            <Image
              source={demoProductPhoto}
              style={styles.heroPhoneImage}
              resizeMode="contain"
            />
          </View>
        </FadeUp>

        {/* Trust Badges matching Figma */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trustBadgesRow}>
          <View
            style={[
              styles.trustBadge,
              { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '33' },
            ]}>
            <Icon source={checkCircleBold} size={14} color={colors.primary} />
            <Text style={[styles.trustBadgeText, { color: colors.text }]}>
              {t('customer.freeDoorstepPickup')}
            </Text>
          </View>

          <View
            style={[
              styles.trustBadge,
              { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '33' },
            ]}>
            <Icon source={checkCircleBold} size={14} color={colors.primary} />
            <Text style={[styles.trustBadgeText, { color: colors.text }]}>{t('customer.maximumValue')}</Text>
          </View>

          <View
            style={[
              styles.trustBadge,
              { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '33' },
            ]}>
            <Icon source={packageBold} size={14} color={colors.primary} />
            <Text style={[styles.trustBadgeText, { color: colors.text }]}>
              {t('customer.safeAndHassleFree')}
            </Text>
          </View>
        </ScrollView>

        {/* Dynamic Section: Sell Phone (Brands) vs Sell Gadgets (Categories) */}
        {activeTab === 'gadget' ? (
          /* ================= GADGETS VIEW ================= */
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>
                {t('customer.popularGadgets')}
              </Text>
              <Text style={[styles.sectionSubBadge, { color: colors.textMuted }]}>
                {t('customerMsg.categoriesCount', { count: gadgetCategories.length })}
              </Text>
            </View>

            {loading ? (
              <View style={styles.loaderBox}>
                <CtiLoader size="md" />
              </View>
            ) : loadError ? (
              <LoadErrorBox title={t('customer.couldNotLoadTheDevice')} message={loadError} onRetry={() => setReloadKey(k => k + 1)} />
            ) : (
              <View style={styles.gadgetsGrid}>
                {gadgetCategories.map((cat, idx) => {
                  const bName = cat.brands?.[0]?.name;
                  return (
                    <FadeUp key={cat._id || idx} delay={idx * 30}>
                      <TouchableOpacity
                        onPress={() => handleGadgetCategorySelect(cat)}
                        style={[
                          styles.gadgetCard,
                          {
                            width: GADGET_CARD_WIDTH,
                            backgroundColor: colors.surface,
                            borderColor: colors.border + '44',
                          },
                        ]}>
                        <View
                          style={[
                            styles.gadgetImageBox,
                            { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '22' },
                          ]}>
                          <Image
                            source={cat.image ? { uri: cat.image } : demoProductPhoto}
                            style={styles.gadgetImg}
                            resizeMode="contain"
                          />
                        </View>
                        <Text style={[styles.gadgetName, { color: colors.text }]} numberOfLines={1}>
                          {cat.name}
                        </Text>
                        {bName ? (
                          <Text style={[styles.gadgetBrandTag, { color: colors.primary }]}>
                            {bName}
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                    </FadeUp>
                  );
                })}
              </View>
            )}
          </View>
        ) : null}

        {/* ================= BRANDS SECTION (Always available, highlighted for Phone) ================= */}
        <View style={styles.sectionBlock}>
          {/* OR CHOOSE A BRAND Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border + '44' }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>
              {t('customer.orChooseABrand')}
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border + '44' }]} />
          </View>

          {/* Horizontal Brand Pills Selector */}
          <View style={styles.brandsWrapper}>
            {loading ? (
              <View style={styles.loaderBox}>
                <CtiLoader size="sm" />
              </View>
            ) : loadError ? null : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.brandsScroll}>
                {brandsList.slice(0, 7).map(brandItem => {
                  const bName = brandItem.name;
                  const bSlug = brandItem.slug;
                  const bId = brandItem._id;
                  const active = selectedBrand === bName;
                  return (
                    <TouchableOpacity
                      key={bName}
                      onPress={() => handleBrandSelect(bName, bSlug, bId)}
                      style={[
                        styles.brandSelectBtn,
                        {
                          backgroundColor: active ? colors.primary + '18' : colors.surfaceAlt,
                          borderColor: active ? colors.primary : colors.border + '44',
                        },
                      ]}>
                      <Text
                        style={[
                          styles.brandSelectText,
                          { color: active ? colors.primary : colors.text },
                        ]}>
                        {bName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  onPress={() => setShowAllBrands(!showAllBrands)}
                  style={[
                    styles.brandSelectBtn,
                    {
                      backgroundColor: showAllBrands ? colors.primary + '18' : colors.surfaceAlt,
                      borderColor: showAllBrands ? colors.primary : colors.border + '44',
                    },
                  ]}>
                  <Text style={[styles.brandSelectText, { color: colors.primary }]}>
                    {showAllBrands ? t('customer.hideBrands') : t('customer.moreBrands')}
                  </Text>
                  <Icon
                    source={showAllBrands ? chevronUpBold : chevronDownBold}
                    size={12}
                    color={colors.primary}
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>

          {/* Expanded All Brands Grid */}
          {showAllBrands && brandsList.length > 0 && (
            <FadeUp delay={40}>
              <View
                style={[
                  styles.allBrandsContainer,
                  { backgroundColor: colors.surface, borderColor: colors.border + '44' },
                ]}>
                <View style={styles.allBrandsHeader}>
                  <Text style={[styles.allBrandsTitle, { color: colors.text }]}>
                    {t('customer.allAvailableBrands')}
                  </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('SelectModel', { brand: 'All', brandSlug: 'all' })}>
                    <Text style={[styles.viewAllModelsText, { color: colors.primary }]}>
                      {t('customer.viewAllModels')}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.brandsGrid}>
                  {brandsList.map((brand, idx) => (
                    <TouchableOpacity
                      key={brand._id || idx}
                      onPress={() => handleBrandSelect(brand.name, brand.slug, brand._id)}
                      style={[
                        styles.brandCard,
                        {
                          width: BRAND_CARD_WIDTH,
                          backgroundColor: colors.surfaceAlt,
                          borderColor: colors.border + '33',
                        },
                      ]}>
                      <View style={styles.brandLogoBox}>
                        {brand.logoUrl ? (
                          <Image
                            source={{ uri: brand.logoUrl }}
                            style={styles.brandLogoImg}
                            resizeMode="contain"
                          />
                        ) : (
                          <Icon source={phoneBold} size={20} color={colors.primary} />
                        )}
                      </View>
                      <Text style={[styles.brandCardName, { color: colors.text }]} numberOfLines={1}>
                        {brand.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </FadeUp>
          )}
        </View>


        <SellWebSections />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 10,
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
  tabsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabBtnText: {
    flexShrink: 1,
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  searchSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    position: 'relative',
    zIndex: 99,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    padding: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  clearSearchText: {
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  suggestionsBox: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    borderRadius: 14,
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    overflow: 'hidden',
    zIndex: 999,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  suggestionLeft: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  suggestionBrand: {
    fontSize: 11,
    fontFamily: fonts.bold,
    marginTop: 2,
  },
  heroBanner: {
    marginHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FF690018',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    marginBottom: 18,
  },
  heroTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  heroHeadline: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: '#FF6900',
    lineHeight: 24,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#666666',
    lineHeight: 17,
    marginBottom: 14,
  },
  heroActionBtn: {
    backgroundColor: '#FF6900',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  heroActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroActionBtnText: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  heroPhoneImage: {
    width: 90,
    height: 100,
  },
  trustBadgesRow: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 20,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  trustBadgeText: {
    flexShrink: 1,
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    flexShrink: 1,
    marginHorizontal: 12,
    fontSize: 11,
    fontFamily: fonts.bold,
    letterSpacing: 0.8,
  },
  brandsWrapper: {
    marginBottom: 16,
  },
  brandsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  brandSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  brandSelectText: {
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  allBrandsContainer: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 6,
    marginBottom: 16,
  },
  allBrandsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  allBrandsTitle: {
    flexShrink: 1,
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  viewAllModelsText: {
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  brandsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogoBox: {
    width: 44,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  brandLogoImg: {
    width: '100%',
    height: '100%',
  },
  brandCardName: {
    fontSize: 12,
    fontFamily: fonts.bold,
    textAlign: 'center',
  },
  sectionBlock: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionHeading: {
    flexShrink: 1,
    fontSize: 18,
    fontFamily: fonts.bold,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionSubBadge: {
    flexShrink: 1,
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  gadgetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  gadgetCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  gadgetImageBox: {
    width: '100%',
    height: 110,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  gadgetImg: {
    width: '80%',
    height: '80%',
  },
  gadgetName: {
    fontSize: 14,
    fontFamily: fonts.bold,
    textAlign: 'center',
  },
  gadgetBrandTag: {
    fontSize: 11,
    fontFamily: fonts.medium,
    marginTop: 2,
    textAlign: 'center',
  },
  loaderBox: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  howItWorksScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  stepCard: {
    width: SCREEN_WIDTH * 0.65,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  stepIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 12,
    fontFamily: fonts.regular,
    lineHeight: 18,
  },
  whyUsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  whyUsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 14,
  },
  whyUsIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whyUsInfo: {
    flex: 1,
  },
  whyUsTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    marginBottom: 4,
  },
  whyUsDesc: {
    fontSize: 12,
    fontFamily: fonts.regular,
    lineHeight: 17,
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