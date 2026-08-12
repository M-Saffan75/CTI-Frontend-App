import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import Icon from '@/components/Icon';
import Checkbox from '@/components/Checkbox';
import Button from '@/components/Button';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import { arrowLeftBold, chevronDownBold, chevronUpBold, starExtra } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { CATEGORIES, COLORS, STORAGE_OPTIONS } from '../data/products';

// Demo counts — the API will send real per-category totals.
const CATEGORY_COUNTS = { Electronics: 8, Fashion: 0, Home: 0, Sports: 0 };

const PRICE_MIN = 0;
const PRICE_MAX = 2000;
const THUMB = 20;

function FilterSection({ title, children }) {
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

// A draggable dual-thumb range slider. The two number fields below stay in
// sync with it either way — type a number or drag a thumb, both update.
function PriceRangeSlider({ minValue, maxValue, onChange }) {
  const { colors } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);

  const toX = value => (trackWidth ? ((value - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * trackWidth : 0);
  const toValue = x => Math.round(PRICE_MIN + (x / trackWidth) * (PRICE_MAX - PRICE_MIN));

  const minX = useSharedValue(0);
  const maxX = useSharedValue(0);

  useEffect(() => {
    if (trackWidth > 0) minX.value = toX(minValue);
  }, [trackWidth, minValue]);

  useEffect(() => {
    if (trackWidth > 0) maxX.value = toX(maxValue);
  }, [trackWidth, maxValue]);

  const updateMin = value => onChange(value, maxValue);
  const updateMax = value => onChange(minValue, value);

  const minPan = Gesture.Pan().onChange(event => {
    const next = Math.min(Math.max(0, minX.value + event.changeX), maxX.value);
    minX.value = next;
    runOnJS(updateMin)(toValue(next));
  });

  const maxPan = Gesture.Pan().onChange(event => {
    const next = Math.max(Math.min(trackWidth, maxX.value + event.changeX), minX.value);
    maxX.value = next;
    runOnJS(updateMax)(toValue(next));
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

export default function FilterScreen({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [categories, setCategories] = useState([]);
  const [color, setColor] = useState(null);
  const [storage, setStorage] = useState(null);
  const [minPrice, setMinPrice] = useState(PRICE_MIN);
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX);
  const [minRating, setMinRating] = useState(0);

  const toggleCategory = name =>
    setCategories(current =>
      current.includes(name) ? current.filter(item => item !== name) : [...current, name],
    );

  const clearAll = () => {
    setCategories([]);
    setColor(null);
    setStorage(null);
    setMinPrice(PRICE_MIN);
    setMaxPrice(PRICE_MAX);
    setMinRating(0);
  };

  const changePrice = (nextMin, nextMax) => {
    setMinPrice(Math.round(nextMin));
    setMaxPrice(Math.round(nextMax));
  };

  const onTypeMin = text => {
    const value = Math.min(Number(text.replace(/[^0-9]/g, '')) || 0, maxPrice);
    setMinPrice(value);
  };

  const onTypeMax = text => {
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Filter</Text>
        <View style={styles.back} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <FadeUp delay={60} duration={500}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <FilterSection title="Category">
              {CATEGORIES.map(name => (
                <View key={name} style={styles.categoryRow}>
                  <Checkbox
                    checked={categories.includes(name)}
                    onChange={() => toggleCategory(name)}
                    label={name}
                  />
                  <Text style={[styles.categoryCount, { color: colors.textMuted }]}>
                    {CATEGORY_COUNTS[name] ?? 0}
                  </Text>
                </View>
              ))}
            </FilterSection>

            <FilterSection title="Colors">
              <View style={styles.colorsGrid}>
                {COLORS.map(hex => (
                  <Squeeze key={hex} onPress={() => setColor(color === hex ? null : hex)} scale={0.9}>
                    <View
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: hex },
                        color === hex && { borderWidth: 3, borderColor: colors.primary },
                      ]}
                    />
                  </Squeeze>
                ))}
              </View>
            </FilterSection>

            <FilterSection title="Storage">
              <View style={styles.storageRow}>
                {STORAGE_OPTIONS.map(option => {
                  const active = storage === option;
                  return (
                    <Squeeze
                      key={option}
                      onPress={() => setStorage(active ? null : option)}
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
            onPress={() => navigation.goBack()}
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

  colorsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  colorSwatch: { width: 40, height: 40, borderRadius: 20 },

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
