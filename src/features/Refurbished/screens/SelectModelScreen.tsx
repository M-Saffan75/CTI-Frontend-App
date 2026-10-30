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
  chevronLeftBold,
  searchBold,
} from '@/assets/icons';
import { demoProductPhoto } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import RefurbishedHeader from '../components/RefurbishedHeader';
import { getAllSellModels, getSellDeviceModels } from '../services/refurbishedApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 44) / 2;

export default function SelectModelScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const brand = route?.params?.brand || 'Apple';
  const brandSlug = route?.params?.brandSlug || brand.toLowerCase();
  const brandId = route?.params?.brandId;

  const [searchQuery, setSearchQuery] = useState('');
  const [modelsList, setModelsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAllBrands = !brand || brand === 'All' || brandSlug === 'all';

  useEffect(() => {
    setLoading(true);
    if (isAllBrands) {
      getAllSellModels()
        .then(res => {
          if (Array.isArray(res)) {
            setModelsList(res);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      getSellDeviceModels(brandSlug || brand)
        .then(res => {
          if (Array.isArray(res)) {
            setModelsList(res);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [brand, brandSlug, isAllBrands]);

  const filteredModels = (modelsList || []).filter(m => {
    const name = typeof m === 'string' ? m : m.name;
    const bName = typeof m === 'object' ? m.brandName : '';
    const q = (searchQuery || '').toLowerCase();
    return name?.toLowerCase()?.includes(q) || bName?.toLowerCase()?.includes(q);
  });

  const handleSelectModel = (modelItem: any) => {
    const modelName = typeof modelItem === 'string' ? modelItem : modelItem.name;
    const modelSlug =
      typeof modelItem === 'string'
        ? modelItem.toLowerCase().replace(/\s+/g, '-')
        : (modelItem.slug || modelItem.name.toLowerCase().replace(/\s+/g, '-'));
    const modelId = typeof modelItem === 'string' ? undefined : modelItem._id;
    const categoryId = typeof modelItem === 'string' ? undefined : modelItem.categoryId;
    const categorySlug = route?.params?.categorySlug || (typeof modelItem === 'object' ? (modelItem.categorySlug || modelItem.category?.slug) : undefined);
    const modelBrand = modelItem.brandName || brand;
    const modelBrandSlug = modelItem.brandSlug || brandSlug;
    const modelBrandId = modelItem.brandId?._id || modelItem.brandId || brandId;

    navigation.navigate('SelectVariant', {
      brand: isAllBrands ? (modelItem.brandName || 'Device') : modelBrand,
      brandSlug: isAllBrands ? (modelItem.brandSlug || 'device') : modelBrandSlug,
      brandId: modelBrandId,
      model: modelName,
      modelSlug,
      modelId,
      categoryId,
      categorySlug,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <RefurbishedHeader showActions={false} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
        {/* Back Link matching Figma */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backLink}>
          <Icon source={chevronLeftBold} size={14} color={colors.primary} />
          <Text style={[styles.backLinkText, { color: colors.primary }]}>
            Back To Brand Selection
          </Text>
        </TouchableOpacity>

        {/* Search Bar matching Figma */}
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '33' },
          ]}>
          <Icon source={searchBold} size={18} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search device models..."
            placeholderTextColor={colors.textMuted + '88'}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        {/* Title & Subtitle */}
        <View style={styles.titleSection}>
          <Text style={[styles.heading, { color: colors.text }]}>Select Model</Text>
          <Text style={[styles.subheading, { color: colors.textMuted }]}>
            {isAllBrands ? (
              'Showing all available device models'
            ) : (
              <>
                Showing models for{' '}
                <Text style={{ color: colors.primary, fontFamily: fonts.bold }}>{brand}</Text>
              </>
            )}
          </Text>
        </View>

        {/* Loader or Models Grid */}
        {loading ? (
          <View style={styles.loaderBox}>
            <CtiLoader size="md" />
          </View>
        ) : filteredModels.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border + '33' }]}>
            <Icon source={searchBold} size={36} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Models Found</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              {searchQuery ? `No models match "${searchQuery}".` : `No active models found for ${brand}.`}
            </Text>
          </View>
        ) : (
          <View style={styles.modelsGrid}>
            {filteredModels.map((item, idx) => {
              const mName = typeof item === 'string' ? item : item.name;
              const bBadge = typeof item === 'object' && item?.brandName ? item.brandName : null;
              const mImg = typeof item === 'object' && item?.imageUrl ? { uri: item.imageUrl } : demoProductPhoto;
              return (
                <FadeUp key={(mName || idx) + idx} delay={idx * 30}>
                  <Squeeze
                    onPress={() => handleSelectModel(item)}
                    style={[
                      styles.modelCard,
                      {
                        width: CARD_WIDTH,
                        backgroundColor: colors.surface,
                        borderColor: colors.border + '44',
                      },
                    ]}>
                    <View
                      style={[
                        styles.modelImageBox,
                        { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '22' },
                      ]}>
                      <Image
                        source={mImg}
                        style={styles.modelImg}
                        resizeMode="contain"
                      />
                      {bBadge && isAllBrands ? (
                        <View style={[styles.brandBadge, { backgroundColor: colors.primary }]}>
                          <Text style={styles.brandBadgeText}>{bBadge}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.modelName, { color: colors.text }]} numberOfLines={2}>
                      {mName}
                    </Text>
                  </Squeeze>
                </FadeUp>
              );
            })}
          </View>
        )}
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
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 16,
  },
  backLinkText: {
    fontSize: 14,
    fontFamily: fonts.medium,
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
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    padding: 0,
  },
  titleSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  heading: {
    fontSize: 26,
    fontFamily: fonts.bold,
  },
  subheading: {
    fontSize: 14,
    fontFamily: fonts.regular,
    marginTop: 4,
  },
  modelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  modelCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  modelImageBox: {
    width: '100%',
    height: 130,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modelImg: {
    width: '80%',
    height: '80%',
  },
  modelName: {
    fontSize: 14,
    fontFamily: fonts.medium,
    textAlign: 'center',
  },
  brandBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  brandBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: fonts.bold,
    textTransform: 'uppercase',
  },
  loaderBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    marginHorizontal: 16,
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    fontFamily: fonts.regular,
    marginTop: 4,
    textAlign: 'center',
  },
});
