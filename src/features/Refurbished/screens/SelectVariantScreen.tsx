import { useEffect, useState } from 'react';
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
import Button from '@/components/Button';
import CtiLoader from '@/components/CtiLoader';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import { FadeUp } from '@/animations';
import {
  checkCircleBold,
  chevronLeftBold,
  chevronRightBold,
  searchBold,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import RefurbishedHeader from '../components/RefurbishedHeader';
import { getSellDeviceConfig } from '../services/refurbishedApi';

interface DeviceVariant {
  key: string;
  values: string[];
}

export default function SelectVariantScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const brand = route?.params?.brand || 'Device';
  const brandSlug = route?.params?.brandSlug || brand.toLowerCase();
  const brandId = route?.params?.brandId;
  const model = route?.params?.model || 'Device Model';
  const modelSlug =
    route?.params?.modelSlug || model.toLowerCase().replace(/\s+/g, '-');
  const modelId = route?.params?.modelId;
  const categoryId = route?.params?.categoryId;
  const categorySlug = route?.params?.categorySlug;

  const [searchQuery, setSearchQuery] = useState('');
  const [deviceConfig, setDeviceConfig] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentVariantIndex, setCurrentVariantIndex] = useState(0);
  const [selectedVariantsMap, setSelectedVariantsMap] = useState<Record<string, string>>({});

  // AlertModal State
  const [modal, setModal] = useState<{
    visible: boolean;
    type: AlertModalType;
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'warning',
    title: '',
    message: '',
  });

  useEffect(() => {
    if (brandSlug && modelSlug) {
      setLoading(true);
      getSellDeviceConfig(brandSlug, modelSlug)
        .then(config => {
          if (config) {
            setDeviceConfig(config);
          }
        })
        .catch(err => {
          if (__DEV__) console.warn('getSellDeviceConfig error:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [brandSlug, modelSlug]);

  // Extract variants from config (attributes configured in backend for this model)
  const variants: DeviceVariant[] = Array.isArray(deviceConfig?.variants)
    ? deviceConfig.variants
    : [];

  const hasVariants = variants.length > 0;
  const currentVariant: DeviceVariant | null = hasVariants ? variants[currentVariantIndex] : null;
  const currentSelectedValue = currentVariant ? selectedVariantsMap[currentVariant.key] : null;

  const handleSelectOption = (value: string) => {
    if (!currentVariant) return;
    setSelectedVariantsMap(prev => ({ ...prev, [currentVariant.key]: value }));
  };

  const handleProceed = () => {
    if (!currentVariant) return;
    if (!currentSelectedValue) {
      setModal({
        visible: true,
        type: 'warning',
        title: 'Selection Required',
        message: `Please select an option for ${currentVariant.key} before proceeding.`,
      });
      return;
    }

    const updated = { ...selectedVariantsMap, [currentVariant.key]: currentSelectedValue };
    const formattedVariants = Object.keys(updated).map(k => ({
      key: k,
      value: updated[k],
    }));

    if (currentVariantIndex < variants.length - 1) {
      setCurrentVariantIndex(prev => prev + 1);
    } else {
      navigation.navigate('DeviceCondition', {
        brand,
        brandSlug,
        brandId: brandId || deviceConfig?.brand?._id,
        model,
        modelSlug,
        modelId: modelId || deviceConfig?.model?._id,
        categoryId: categoryId || deviceConfig?.categoryId,
        categorySlug,
        selectedVariants: formattedVariants,
        config: deviceConfig,
      });
    }
  };

  const handleContinueNoVariants = () => {
    navigation.navigate('DeviceCondition', {
      brand,
      brandSlug,
      brandId: brandId || deviceConfig?.brand?._id,
      model,
      modelSlug,
      modelId: modelId || deviceConfig?.model?._id,
      categoryId: categoryId || deviceConfig?.categoryId,
      categorySlug,
      selectedVariants: [],
      config: deviceConfig,
    });
  };

  const handleBack = () => {
    if (currentVariantIndex > 0) {
      setCurrentVariantIndex(prev => prev - 1);
    } else {
      navigation.goBack();
    }
  };

  const filteredValues = (currentVariant?.values || []).filter(val =>
    val.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <RefurbishedHeader showActions={false} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
        {/* Back Link */}
        <TouchableOpacity onPress={handleBack} style={styles.backLink}>
          <Icon source={chevronLeftBold} size={14} color={colors.primary} />
          <Text style={[styles.backLinkText, { color: colors.primary }]}>
            {currentVariantIndex > 0 ? 'Back To Previous Option' : 'Back To Model Selection'}
          </Text>
        </TouchableOpacity>

        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <CtiLoader size="md" text="Loading device specifications..." />
          </View>
        ) : !hasVariants ? (
          /* State when no variants configured for this model (e.g. Haier AC, Camera, etc. matching Next.js) */
          <FadeUp
            delay={100}
            style={[
              styles.emptyVariantsContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border + '66',
              },
            ]}>
            <View
              style={[
                styles.checkIconWrap,
                {
                  backgroundColor: colors.primary + '18',
                  borderColor: colors.primary + '33',
                },
              ]}>
              <Icon source={checkCircleBold} size={38} color={colors.primary} />
            </View>
            <Text style={[styles.emptyHeading, { color: colors.text }]}>
              No Variant Selection Required
            </Text>
            <Text style={[styles.emptySubheading, { color: colors.textMuted }]}>
              This <Text style={{ fontFamily: fonts.bold, color: colors.primary }}>{model}</Text> does not require any variant selection. You can proceed directly to condition assessment.
            </Text>
            <Button
              title="Continue to Condition Assessment"
              onPress={handleContinueNoVariants}
              style={{ marginTop: 24, width: '100%' }}
            />
          </FadeUp>
        ) : (
          /* Dynamic Variant View */
          <>
            {/* Search Bar */}
            {(currentVariant?.values?.length || 0) > 4 && (
              <View
                style={[
                  styles.searchBar,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '33' },
                ]}>
                <Icon source={searchBold} size={18} color={colors.textMuted} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={`Search ${currentVariant?.key || 'options'}...`}
                  placeholderTextColor={colors.textMuted + '88'}
                  style={[styles.searchInput, { color: colors.text }]}
                />
              </View>
            )}

            {/* Title & Subtitle */}
            <View style={styles.titleSection}>
              {variants.length > 1 && (
                <View style={[styles.stepPill, { backgroundColor: colors.primary + '18' }]}>
                  <Text style={[styles.stepPillText, { color: colors.primary }]}>
                    Specification {currentVariantIndex + 1} of {variants.length}
                  </Text>
                </View>
              )}
              <Text style={[styles.heading, { color: colors.text }]}>
                Select {currentVariant?.key || 'Specification'}
              </Text>
              <Text style={[styles.subheading, { color: colors.textMuted }]}>
                Select the {currentVariant?.key} variant for your{' '}
                <Text style={{ color: colors.primary, fontFamily: fonts.bold }}>{model}</Text>
              </Text>
            </View>

            {/* Variant Options */}
            <View style={styles.variantsList}>
              {filteredValues.map((item, idx) => {
                const isSelected = currentSelectedValue === item;
                return (
                  <FadeUp key={`${item}-${idx}`} delay={idx * 30}>
                    <Squeeze
                      onPress={() => handleSelectOption(item)}
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

              {/* Strict Validation Button */}
              <View style={{ marginTop: 12 }}>
                <Button
                  title={
                    currentVariantIndex < variants.length - 1
                      ? 'Next Specification'
                      : 'Proceed to Condition Assessment'
                  }
                  disabled={!currentSelectedValue}
                  onPress={handleProceed}
                  style={{ width: '100%' }}
                />
                {!currentSelectedValue && (
                  <Text style={[styles.validationHint, { color: colors.textMuted }]}>
                    * Please select an option above to proceed
                  </Text>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Alert Modal for strict validation */}
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
  stepPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  stepPillText: {
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  heading: {
    fontSize: 26,
    fontFamily: fonts.bold,
  },
  subheading: {
    fontSize: 14,
    fontFamily: fonts.regular,
    marginTop: 4,
    lineHeight: 20,
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
    borderWidth: 1.5,
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
  validationHint: {
    fontSize: 12,
    fontFamily: fonts.medium,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyVariantsContainer: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    textAlign: 'center',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  checkIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyHeading: {
    fontSize: 22,
    fontFamily: fonts.bold,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  emptySubheading: {
    fontSize: 15,
    fontFamily: fonts.regular,
    textAlign: 'center',
    lineHeight: 23,
    paddingHorizontal: 8,
  },
});
