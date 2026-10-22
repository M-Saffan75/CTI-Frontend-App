import { useState } from 'react';
import {
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
  checkCircleBold,
  chevronLeftBold,
  searchBold,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import RefurbishedHeader from '../components/RefurbishedHeader';
import { STORAGE_VARIANTS } from '../data/refurbishedData';

export default function SelectVariantScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const brand = route?.params?.brand || 'Apple';
  const model = route?.params?.model || '12 pro max';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStorage, setSelectedStorage] = useState<string | null>(null);

  const handleSelectStorage = (variant: string) => {
    setSelectedStorage(variant);
    setTimeout(() => {
      navigation.navigate('DeviceCondition', { brand, model, storage: variant });
    }, 200);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <RefurbishedHeader showBack={false} showActions={false} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
        {/* Back Link matching Figma */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backLink}>
          <Icon source={chevronLeftBold} size={14} color={colors.primary} />
          <Text style={[styles.backLinkText, { color: colors.primary }]}>
            Back To Model Selection
          </Text>
        </TouchableOpacity>

        {/* Search Bar */}
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
          <Text style={[styles.heading, { color: colors.text }]}>Select Storage</Text>
          <Text style={[styles.subheading, { color: colors.textMuted }]}>
            Select the Storage variant for your{' '}
            <Text style={{ color: colors.primary, fontFamily: fonts.bold }}>{model}</Text>
          </Text>
        </View>

        {/* Storage Options matching Figma */}
        <View style={styles.variantsList}>
          {STORAGE_VARIANTS.map((item, idx) => {
            const isSelected = selectedStorage === item;
            return (
              <FadeUp key={item} delay={idx * 50}>
                <Squeeze
                  onPress={() => handleSelectStorage(item)}
                  style={[
                    styles.variantCard,
                    {
                      backgroundColor: isSelected ? colors.primary + '14' : colors.surfaceAlt,
                      borderColor: isSelected ? colors.primary : colors.border + '33',
                    },
                  ]}>
                  <View style={styles.variantInnerRow}>
                    <View
                      style={[
                        styles.checkCircle,
                        {
                          borderColor: isSelected ? colors.primary : colors.textMuted + '66',
                          backgroundColor: isSelected ? colors.primary : 'transparent',
                        },
                      ]}>
                      <Icon
                        source={checkCircleBold}
                        size={18}
                        color={isSelected ? '#FFFFFF' : colors.textMuted}
                      />
                    </View>
                    <Text
                      style={[
                        styles.variantText,
                        {
                          color: isSelected ? colors.primary : colors.text,
                          fontFamily: isSelected ? fonts.bold : fonts.medium,
                        },
                      ]}>
                      {item}
                    </Text>
                  </View>
                </Squeeze>
              </FadeUp>
            );
          })}
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
  variantsList: {
    paddingHorizontal: 16,
    gap: 14,
  },
  variantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    gap: 14,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: '100%',
  },
  variantText: {
    fontSize: 15,
  },
});
