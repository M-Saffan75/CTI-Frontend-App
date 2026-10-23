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
import { FadeUp } from '@/animations';
import {
  chevronLeftBold,
  searchBold,
} from '@/assets/icons';
import { demoProductPhoto } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import RefurbishedHeader from '../components/RefurbishedHeader';
import { SELLER_DEVICE_MODELS } from '../data/refurbishedData';
import { getSellDeviceModels } from '../services/refurbishedApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 44) / 2;

export default function SelectModelScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const brand = route?.params?.brand || 'Apple';

  const [searchQuery, setSearchQuery] = useState('');
  const [modelsList, setModelsList] = useState<string[]>(
    SELLER_DEVICE_MODELS?.[brand] ||
    SELLER_DEVICE_MODELS?.['Apple'] ||
    [],
  );

  useEffect(() => {
    if (brand && brand !== 'All') {
      getSellDeviceModels(brand)
        .then(res => {
          if (Array.isArray(res) && res.length > 0) {
            setModelsList(res);
          }
        })
        .catch(() => {});
    }
  }, [brand]);

  const filteredModels = (modelsList || []).filter(m =>
    m?.toLowerCase()?.includes((searchQuery || '').toLowerCase()),
  );

  const handleSelectModel = (model: string) => {
    navigation.navigate('SelectVariant', { brand, model });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <RefurbishedHeader
        showBack={false}
        showActions={false}
      />

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
            placeholder="Search order custom product"
            placeholderTextColor={colors.textMuted + '88'}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        {/* Title & Subtitle */}
        <View style={styles.titleSection}>
          <Text style={[styles.heading, { color: colors.text }]}>Select Model</Text>
          <Text style={[styles.subheading, { color: colors.textMuted }]}>
            Showing models for{' '}
            <Text style={{ color: colors.primary, fontFamily: fonts.bold }}>{brand}</Text>
          </Text>
        </View>

        {/* 2-Column Grid of Device Models matching Figma */}
        <View style={styles.modelsGrid}>
          {filteredModels.map((item, idx) => (
            <FadeUp key={item + idx} delay={idx * 30}>
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
                    source={demoProductPhoto}
                    style={styles.modelImg}
                    resizeMode="contain"
                  />
                </View>
                <Text style={[styles.modelName, { color: colors.text }]}>{item}</Text>
              </Squeeze>
            </FadeUp>
          ))}
        </View>
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
});
