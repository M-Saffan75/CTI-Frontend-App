import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import { arrowLeftBold, checkCircleIcon, chevronDownBold, chevronUpBold, starExtra } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import {
  EcomFilterCategory,
  EcomFilterColor,
  getColorHex,
  getEcomProductFiltersApi,
} from '../services/ecomApi';

const PRICE_MIN = 0;
const PRICE_MAX = 2000;
const THUMB = 20;

const DEFAULT_CATEGORIES: EcomFilterCategory[] = [
  { _id: '6abcecea51d9ef55a9ced393', title: 'Electronics', count: 21 },
  { _id: '6abcecef51d9ef55a9ced3b3', title: 'Fashion & Apparel', count: 10 },
];

const DEFAULT_COLORS: EcomFilterColor[] = [
  { name: 'Black', hex: '#18181b' },
  { name: 'Silver', hex: '#C0C0C0' },
  { name: 'Titanium Gray', hex: '#6B7280' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'White', hex: '#F9FAFB' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Navy', hex: '#1E3A5F' },
  { name: 'Beige', hex: '#D4B896' },
  { name: 'Gold', hex: '#D4A017' },
];

const DEFAULT_STORAGE = ['128GB', '256GB', '512GB', '1TB', '2TB SSD'];

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(true);

  return (
    <View style={styles.section}>
      <Pressable style={styles.sectionHead} onPress={() => setOpen(!open)}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
        <Icon source={open ? chevronUpBold : chevronDownBold} size={16} color={colors.text} />
      </Pressable>

      {open && <View style={styles.sectionBody}>{children}</View>}
    </View>
  );
}

// Draggable dual-thumb range slider
function PriceRangeSlider({
  minValue,
  maxValue,
  onChange,
}: {
  minValue: number;
  maxValue: number;
  onChange: (min: number, max: number) => void;
}) {
  const { colors } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);

  const toX = (value: number) =>
    trackWidth > 0 ? ((value - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * trackWidth : 0;

  const minX = useSharedValue(0);
  const maxX = useSharedValue(0);

  useEffect(() => {
    if (trackWidth > 0) minX.value = toX(minValue);
  }, [trackWidth, minValue]);

  useEffect(() => {
    if (trackWidth > 0) maxX.value = toX(maxValue);
  }, [trackWidth, maxValue]);

  const updateMin = (value: number) => onChange(value, maxValue);
  const updateMax = (value: number) => onChange(minValue, value);

  const minPan = Gesture.Pan()
    .onChange(event => {
      minX.value = Math.min(Math.max(0, minX.value + event.changeX), maxX.value);
    })
    .onEnd(() => {
      if (trackWidth > 0) {
        runOnJS(updateMin)(Math.round(PRICE_MIN + (minX.value / trackWidth) * (PRICE_MAX - PRICE_MIN)));
      }
    });

  const maxPan = Gesture.Pan()
    .onChange(event => {
      maxX.value = Math.max(Math.min(trackWidth, maxX.value + event.changeX), minX.value);
    })
    .onEnd(() => {
      if (trackWidth > 0) {
        runOnJS(updateMax)(Math.round(PRICE_MIN + (maxX.value / trackWidth) * (PRICE_MAX - PRICE_MIN)));
      }
    });

  const fillStyle = useAnimatedStyle(() => ({
    left: minX.value,
    width: Math.max(0, maxX.value - minX.value),
  }));
  const minThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: minX.value - THUMB / 2 }],
  }));
  const maxThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: maxX.value - THUMB / 2 }],
  }));

  return (
    <View style={styles.priceTrack} onLayout={event => setTrackWidth(event.nativeEvent.layout.width)}>
      <View style={[styles.priceTrackBg, { backgroundColor: colors.border }]} />
      <Animated.View style={[styles.priceTrackFill, { backgroundColor: colors.primary }, fillStyle]} />

      <GestureDetector gesture={minPan}>
        <Animated.View
          style={[styles.thumb, { backgroundColor: colors.primary, borderColor: colors.surface }, minThumbStyle]}
        />
      </GestureDetector>
      <GestureDetector gesture={maxPan}>
        <Animated.View
          style={[styles.thumb, { backgroundColor: colors.primary, borderColor: colors.surface }, maxThumbStyle]}
        />
      </GestureDetector>
    </View>
  );
}

export default function FilterScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const initialFilters = route?.params?.currentFilters;

  const [categoriesList, setCategoriesList] = useState<EcomFilterCategory[]>(DEFAULT_CATEGORIES);
  const [colorsList, setColorsList] = useState<EcomFilterColor[]>(DEFAULT_COLORS);
  const [storageList, setStorageList] = useState<string[]>(DEFAULT_STORAGE);
  const [loadingFilters, setLoadingFilters] = useState(true);

  // Active user selections
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    initialFilters?.categoryIds || [],
  );
  const [selectedCategoryTitles, setSelectedCategoryTitles] = useState<string[]>(
    initialFilters?.categories || [],
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(initialFilters?.color || null);
  const [selectedStorage, setSelectedStorage] = useState<string | null>(initialFilters?.storage || null);
  const [minPrice, setMinPrice] = useState<number>(initialFilters?.minPrice ?? PRICE_MIN);
  const [maxPrice, setMaxPrice] = useState<number>(initialFilters?.maxPrice ?? PRICE_MAX);
  const [minRating, setMinRating] = useState<number>(initialFilters?.minRating || 0);

  // Fetch live filter options from backend
  useEffect(() => {
    let mounted = true;
    getEcomProductFiltersApi().then(data => {
      if (!mounted || !data) {
        if (mounted) setLoadingFilters(false);
        return;
      }
      if (Array.isArray(data.categories) && data.categories.length > 0) {
        setCategoriesList(data.categories);
        // Sync names if user came in with IDs
        if (selectedCategoryIds.length > 0 && selectedCategoryTitles.length === 0) {
          const matchedTitles = data.categories
            .filter(c => selectedCategoryIds.includes(c._id))
            .map(c => c.title);
          setSelectedCategoryTitles(matchedTitles);
        }
      }
      if (Array.isArray(data.colors) && data.colors.length > 0) {
        const seen = new Set<string>();
        const unique: EcomFilterColor[] = [];
        data.colors.forEach(c => {
          if (!c?.name) return;
          const norm = c.name.trim().toLowerCase();
          if (!seen.has(norm)) {
            seen.add(norm);
            unique.push({ name: c.name.trim(), hex: c.hex || getColorHex(c.name) });
          }
        });
        setColorsList(unique);
      }
      if (Array.isArray(data.dynamicAttributes)) {
        const storageAttr = data.dynamicAttributes.find(a => /storage/i.test(a.name));
        if (storageAttr && Array.isArray(storageAttr.values) && storageAttr.values.length > 0) {
          setStorageList(storageAttr.values);
        }
      }
      setLoadingFilters(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const toggleCategory = (id: string, title: string) => {
    setSelectedCategoryIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id],
    );
    setSelectedCategoryTitles(prev =>
      prev.includes(title) ? prev.filter(item => item !== title) : [...prev, title],
    );
  };

  const clearAll = () => {
    setSelectedCategoryIds([]);
    setSelectedCategoryTitles([]);
    setSelectedColor(null);
    setSelectedStorage(null);
    setMinPrice(PRICE_MIN);
    setMaxPrice(PRICE_MAX);
    setMinRating(0);
    if (typeof route?.params?.onApply === 'function') {
      route.params.onApply({
        categoryIds: [],
        categories: [],
        color: null,
        storage: null,
        minPrice: PRICE_MIN,
        maxPrice: PRICE_MAX,
        minRating: 0,
      });
    }
  };

  const handleApply = () => {
    const filters = {
      categoryIds: selectedCategoryIds,
      categories: selectedCategoryTitles,
      color: selectedColor,
      storage: selectedStorage,
      minPrice,
      maxPrice,
      minRating,
    };
    if (typeof route?.params?.onApply === 'function') {
      route.params.onApply(filters);
    }
    navigation.goBack();
  };

  const changePrice = (nextMin: number, nextMax: number) => {
    setMinPrice(Math.round(nextMin));
    setMaxPrice(Math.round(nextMax));
  };

  const onTypeMin = (text: string) => {
    const value = Math.min(Number(text.replace(/[^0-9]/g, '')) || 0, maxPrice);
    setMinPrice(value);
  };

  const onTypeMax = (text: string) => {
    const value = Math.max(Number(text.replace(/[^0-9]/g, '')) || 0, minPrice);
    setMaxPrice(Math.min(value, PRICE_MAX));
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Squeeze onPress={() => navigation.goBack()} scale={0.9}>
          <View style={[styles.back, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={20} color={colors.onPrimary} />
          </View>
        </Squeeze>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Filter Products</Text>
        <View style={styles.back} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <FadeUp delay={60} duration={500}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Category Section with Live Backend Counts */}
            <FilterSection title="Category">
              {loadingFilters && categoriesList.length === 0 ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                categoriesList.map(cat => {
                  const isChecked =
                    selectedCategoryIds.includes(cat._id) || selectedCategoryTitles.includes(cat.title);
                  return (
                    <View key={cat._id} style={styles.categoryRow}>
                      <Checkbox
                        checked={isChecked}
                        onChange={() => toggleCategory(cat._id, cat.title)}
                        label={cat.title}
                      />
                      <Text style={[styles.categoryCount, { color: colors.textMuted }]}>
                        {cat.count ?? 0}
                      </Text>
                    </View>
                  );
                })
              )}
            </FilterSection>

            {/* Colors Section */}
            <FilterSection title="Colors">
              {selectedColor && (
                <Text style={[styles.selectedLabel, { color: colors.primary }]}>
                  Selected: {selectedColor}
                </Text>
              )}
              <View style={styles.colorsGrid}>
                {colorsList.map(c => {
                  const hex = c.hex || getColorHex(c.name);
                  const active = selectedColor?.toLowerCase() === c.name.toLowerCase();
                  return (
                    <Squeeze
                      key={c.name}
                      onPress={() => setSelectedColor(active ? null : c.name)}
                      scale={0.9}>
                      <View
                        style={[
                          styles.colorSwatch,
                          { backgroundColor: hex },
                          active && { borderWidth: 3, borderColor: colors.primary },
                        ]}>
                        {active && (
                          <Icon
                            source={checkCircleIcon}
                            size={16}
                            color={hex.toLowerCase() === '#f9fafb' || hex.toLowerCase() === '#ffffff' ? '#18181b' : '#ffffff'}
                          />
                        )}
                      </View>
                    </Squeeze>
                  );
                })}
              </View>
            </FilterSection>

            {/* Storage Section */}
            <FilterSection title="Storage">
              <View style={styles.storageRow}>
                {storageList.map(option => {
                  const active = selectedStorage === option;
                  return (
                    <Squeeze
                      key={option}
                      onPress={() => setSelectedStorage(active ? null : option)}
                      style={[
                        styles.storageChip,
                        { backgroundColor: active ? colors.primary : colors.surfaceAlt },
                      ]}>
                      <Text
                        style={[
                          styles.storageChipText,
                          { color: active ? colors.onPrimary : colors.text },
                        ]}>
                        {option}
                      </Text>
                    </Squeeze>
                  );
                })}
              </View>
            </FilterSection>

            {/* Price Range Slider */}
            <FilterSection title="Price Range">
              <PriceRangeSlider minValue={minPrice} maxValue={maxPrice} onChange={changePrice} />
              <View style={styles.priceInputs}>
                <View style={[styles.priceField, { borderColor: colors.border }]}>
                  <Text style={[styles.priceSign, { color: colors.textMuted }]}>$</Text>
                  <TextInput
                    value={String(minPrice)}
                    onChangeText={onTypeMin}
                    keyboardType="numeric"
                    style={[styles.priceInput, { color: colors.text }]}
                  />
                </View>
                <View style={[styles.priceField, { borderColor: colors.border }]}>
                  <Text style={[styles.priceSign, { color: colors.textMuted }]}>$</Text>
                  <TextInput
                    value={String(maxPrice)}
                    onChangeText={onTypeMax}
                    keyboardType="numeric"
                    style={[styles.priceInput, { color: colors.text }]}
                  />
                </View>
              </View>
            </FilterSection>

            {/* Min Rating Section */}
            <FilterSection title="Min Rating">
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map(n => (
                  <Squeeze key={n} onPress={() => setMinRating(n === minRating ? 0 : n)} scale={0.85}>
                    <Icon
                      source={starExtra}
                      size={26}
                      color={n <= minRating ? colors.primary : colors.border}
                    />
                  </Squeeze>
                ))}
              </View>
            </FilterSection>
          </View>
        </FadeUp>

        <View style={styles.actions}>
          <Button title="Clear All" variant="soft" size="sm" onPress={clearAll} style={styles.actionButton} />
          <Button
            title="Apply Filters"
            size="sm"
            onPress={handleApply}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
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
    paddingBottom: 14,
  },
  back: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.bold, fontSize: 20 },

  body: { paddingHorizontal: 20 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },

  section: { marginBottom: 6 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 16 },
  sectionBody: { gap: 14, paddingBottom: 14 },

  categoryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryCount: { fontFamily: fonts.regular, fontSize: 13 },

  selectedLabel: { fontFamily: fonts.medium, fontSize: 12, marginBottom: 4 },
  colorsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorSwatch: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  storageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  storageChip: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  storageChipText: { fontFamily: fonts.bold, fontSize: 13 },

  priceTrack: { height: 24, justifyContent: 'center', marginTop: 6, marginHorizontal: 10 },
  priceTrackBg: { position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 2 },
  priceTrackFill: { position: 'absolute', height: 4, borderRadius: 2 },
  thumb: {
    position: 'absolute',
    top: 2,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    borderWidth: 2,
  },
  priceInputs: { flexDirection: 'row', gap: 14, marginTop: 10 },
  priceField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
  },
  priceSign: { fontFamily: fonts.bold, fontSize: 15 },
  priceInput: { flex: 1, fontFamily: fonts.regular, fontSize: 15, padding: 0 },

  stars: { flexDirection: 'row', gap: 8 },

  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  actionButton: { flex: 1 },
});
