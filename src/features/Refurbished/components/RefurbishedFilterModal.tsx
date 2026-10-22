import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
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
import {
  arrowLeftBold,
  checkCircleBold,
  chevronDownBold,
  chevronUpBold,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { REFURBISHED_BRANDS, REFURBISHED_CATEGORIES } from '../data/refurbishedData';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  initialFilters?: any;
}

export default function RefurbishedFilterModal({
  visible,
  onClose,
  onApply,
  initialFilters = {},
}: FilterModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const safeInitial = initialFilters || {};
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    safeInitial?.types || ['all'],
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    safeInitial?.brands || [],
  );
  const [selectedSources, setSelectedSources] = useState<string[]>(
    safeInitial?.sources || ['Platform Products'],
  );
  const [minPrice, setMinPrice] = useState(safeInitial?.minPrice?.toString() || '0');
  const [maxPrice, setMaxPrice] = useState(safeInitial?.maxPrice?.toString() || '2000');
  const [ramSectionOpen, setRamSectionOpen] = useState(true);
  const [selectedRam, setSelectedRam] = useState<string[]>(safeInitial?.ram || []);
  const [storageSectionOpen, setStorageSectionOpen] = useState(true);
  const [selectedStorage, setSelectedStorage] = useState<string[]>(
    safeInitial?.storage || [],
  );

  const toggleType = (id: string) => {
    if (id === 'all') {
      setSelectedTypes(['all']);
    } else {
      const current = Array.isArray(selectedTypes) ? selectedTypes : [];
      let updated = current.filter(t => t !== 'all');
      if (updated.includes(id)) {
        updated = updated.filter(t => t !== id);
      } else {
        updated.push(id);
      }
      setSelectedTypes(updated.length === 0 ? ['all'] : updated);
    }
  };

  const toggleBrand = (brand: string) => {
    const current = Array.isArray(selectedBrands) ? selectedBrands : [];
    if (current.includes(brand)) {
      setSelectedBrands(current.filter(b => b !== brand));
    } else {
      setSelectedBrands([...current, brand]);
    }
  };

  const toggleSource = (source: string) => {
    const current = Array.isArray(selectedSources) ? selectedSources : [];
    if (current.includes(source)) {
      setSelectedSources(current.filter(s => s !== source));
    } else {
      setSelectedSources([...current, source]);
    }
  };

  const toggleRam = (item: string) => {
    const current = Array.isArray(selectedRam) ? selectedRam : [];
    if (current.includes(item)) {
      setSelectedRam(current.filter(r => r !== item));
    } else {
      setSelectedRam([...current, item]);
    }
  };

  const toggleStorage = (item: string) => {
    const current = Array.isArray(selectedStorage) ? selectedStorage : [];
    if (current.includes(item)) {
      setSelectedStorage(current.filter(s => s !== item));
    } else {
      setSelectedStorage([...current, item]);
    }
  };

  const handleReset = () => {
    setSelectedTypes(['all']);
    setSelectedBrands([]);
    setSelectedSources(['Platform Products']);
    setMinPrice('0');
    setMaxPrice('2000');
    setSelectedRam([]);
    setSelectedStorage([]);
  };

  const handleApply = () => {
    onApply({
      types: selectedTypes,
      brands: selectedBrands,
      sources: selectedSources,
      minPrice: Number(minPrice) || 0,
      maxPrice: Number(maxPrice) || 2000,
      ram: selectedRam,
      storage: selectedStorage,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.headerRow,
            {
              paddingTop: Math.max(insets.top, 14),
              borderBottomColor: colors.border + '33',
            },
          ]}>
          <Squeeze onPress={onClose} style={[styles.backBtn, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={18} color="#FFFFFF" />
          </Squeeze>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Filter</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={[styles.resetText, { color: colors.primary }]}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}>
          {/* Main Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border + '44',
              },
            ]}>
            {/* Section: Product Type */}
            <Text style={[styles.sectionHeading, { color: colors.text }]}>Product Type</Text>
            {REFURBISHED_CATEGORIES.map(cat => {
              const checked = Boolean(selectedTypes?.includes(cat?.id));
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => toggleType(cat.id)}
                  style={styles.checkboxRow}>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: checked ? colors.primary : colors.border,
                        backgroundColor: checked ? colors.primary : 'transparent',
                      },
                    ]}>
                    {checked && <Icon source={checkCircleBold} size={14} color="#FFFFFF" />}
                  </View>
                  <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                    {cat.figmaName || cat.name}
                  </Text>
                </Pressable>
              );
            })}

            {/* Section: Brand */}
            <Text style={[styles.sectionHeading, { color: colors.text, marginTop: 24 }]}>
              BRAND
            </Text>
            {REFURBISHED_BRANDS.map(brand => {
              const checked = Boolean(selectedBrands?.includes(brand));
              return (
                <Pressable
                  key={brand}
                  onPress={() => toggleBrand(brand)}
                  style={styles.checkboxRow}>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: checked ? colors.primary : colors.border,
                        backgroundColor: checked ? colors.primary : 'transparent',
                      },
                    ]}>
                    {checked && <Icon source={checkCircleBold} size={14} color="#FFFFFF" />}
                  </View>
                  <Text style={[styles.checkboxLabel, { color: colors.text }]}>{brand}</Text>
                </Pressable>
              );
            })}

            {/* Section: Product Source */}
            <Text style={[styles.sectionHeading, { color: colors.text, marginTop: 24 }]}>
              PRODUCT SOURCE
            </Text>
            {['Platform Products', 'Seller Products'].map(src => {
              const checked = Boolean(selectedSources?.includes(src));
              return (
                <Pressable
                  key={src}
                  onPress={() => toggleSource(src)}
                  style={styles.checkboxRow}>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: checked ? colors.primary : colors.border,
                        backgroundColor: checked ? colors.primary : 'transparent',
                      },
                    ]}>
                    {checked && <Icon source={checkCircleBold} size={14} color="#FFFFFF" />}
                  </View>
                  <Text style={[styles.checkboxLabel, { color: colors.text }]}>{src}</Text>
                </Pressable>
              );
            })}

            {/* Section: Price Range */}
            <View style={styles.accordionHeader}>
              <Text style={[styles.sectionHeading, { color: colors.text, marginTop: 24 }]}>
                Price Range
              </Text>
              <Icon source={chevronDownBold} size={18} color={colors.textMuted} />
            </View>

            {/* Slider track bar graphic */}
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderActive, { backgroundColor: colors.primary }]} />
              <View style={[styles.sliderThumb, { borderColor: colors.primary, left: 0 }]} />
              <View style={[styles.sliderThumb, { borderColor: colors.primary, right: 0 }]} />
            </View>

            <View style={styles.priceInputsRow}>
              <View style={styles.priceInputBlock}>
                <Text style={[styles.priceInputLabel, { color: colors.textMuted }]}>Min</Text>
                <View
                  style={[
                    styles.priceInputBox,
                    { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                  ]}>
                  <Text style={[styles.currencyPrefix, { color: colors.text }]}>$</Text>
                  <TextInput
                    value={minPrice}
                    onChangeText={setMinPrice}
                    keyboardType="numeric"
                    style={[styles.priceInput, { color: colors.text }]}
                  />
                </View>
              </View>

              <View style={styles.priceInputBlock}>
                <Text style={[styles.priceInputLabel, { color: colors.textMuted }]}>Max</Text>
                <View
                  style={[
                    styles.priceInputBox,
                    { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                  ]}>
                  <Text style={[styles.currencyPrefix, { color: colors.text }]}>$</Text>
                  <TextInput
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    keyboardType="numeric"
                    style={[styles.priceInput, { color: colors.text }]}
                  />
                </View>
              </View>
            </View>

            {/* Section: RAM */}
            <TouchableOpacity
              onPress={() => setRamSectionOpen(!ramSectionOpen)}
              style={[styles.accordionHeader, { marginTop: 20 }]}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Ram</Text>
              <Icon
                source={ramSectionOpen ? chevronUpBold : chevronDownBold}
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
            {ramSectionOpen &&
              ['4GB', '8GB', '16GB'].map(ram => {
                const checked = Boolean(selectedRam?.includes(ram));
                return (
                  <Pressable
                    key={ram}
                    onPress={() => toggleRam(ram)}
                    style={styles.checkboxRow}>
                    <View
                      style={[
                        styles.checkbox,
                        {
                          borderColor: checked ? colors.primary : colors.border,
                          backgroundColor: checked ? colors.primary : 'transparent',
                        },
                      ]}>
                      {checked && <Icon source={checkCircleBold} size={14} color="#FFFFFF" />}
                    </View>
                    <Text style={[styles.checkboxLabel, { color: colors.text }]}>{ram}</Text>
                  </Pressable>
                );
              })}

            {/* Section: Storage */}
            <TouchableOpacity
              onPress={() => setStorageSectionOpen(!storageSectionOpen)}
              style={[styles.accordionHeader, { marginTop: 20 }]}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Storage</Text>
              <Icon
                source={storageSectionOpen ? chevronUpBold : chevronDownBold}
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
            {storageSectionOpen &&
              ['128GB', '256GB', '512GB', '1TB'].map(stg => {
                const checked = Boolean(selectedStorage?.includes(stg));
                return (
                  <Pressable
                    key={stg}
                    onPress={() => toggleStorage(stg)}
                    style={styles.checkboxRow}>
                    <View
                      style={[
                        styles.checkbox,
                        {
                          borderColor: checked ? colors.primary : colors.border,
                          backgroundColor: checked ? colors.primary : 'transparent',
                        },
                      ]}>
                      {checked && <Icon source={checkCircleBold} size={14} color="#FFFFFF" />}
                    </View>
                    <Text style={[styles.checkboxLabel, { color: colors.text }]}>{stg}</Text>
                  </Pressable>
                );
              })}
          </View>
        </ScrollView>

        {/* Bottom Apply CTA */}
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border + '33',
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}>
          <Squeeze
            onPress={handleApply}
            style={[styles.applyBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.applyBtnText}>Apply Filters</Text>
          </Squeeze>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
  },
  resetText: {
    fontSize: 15,
    fontFamily: fonts.medium,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  sectionHeading: {
    fontSize: 16,
    fontFamily: fonts.bold,
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    position: 'relative',
    marginVertical: 18,
  },
  sliderActive: {
    height: 4,
    borderRadius: 2,
    width: '100%',
  },
  sliderThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
  },
  priceInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
    marginBottom: 10,
  },
  priceInputBlock: {
    flex: 1,
  },
  priceInputLabel: {
    fontSize: 12,
    fontFamily: fonts.regular,
    marginBottom: 4,
  },
  priceInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  currencyPrefix: {
    fontSize: 14,
    fontFamily: fonts.medium,
    marginRight: 6,
  },
  priceInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.medium,
    padding: 0,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  applyBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fonts.bold,
  },
});
