import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import { FadeUp } from '@/animations';
import {
  chevronDownBold,
  searchBold,
  slidersHBold,
  tagBold,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { SELLER_PRODUCTS_DATA } from '../data/productsData';

export default function ProductListScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState(SELLER_PRODUCTS_DATA);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleProductActive = (id: string) => {
    setProducts(prev =>
      prev.map(p =>
        p.id === id ? { ...p, isActive: !p.isActive, status: !p.isActive ? 'Active' : 'Disable' } : p
      )
    );
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}>
        {/* Header Info matching Figma exactly */}
        <FadeUp delay={30} duration={350}>
          <View style={styles.topRow}>
            <Text style={[styles.title, { color: colors.text }]}>Products</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Manage your store's inventory and listings
            </Text>
          </View>

          {/* Search Bar */}
          <View
            style={[
              styles.searchBar,
              { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
            ]}>
            <Icon source={searchBold} size={16} color={colors.textMuted} />
            <TextInput
              placeholder="Search By product name"
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchInput, { color: colors.text }]}
            />
          </View>

          {/* Filters Row */}
          <View style={styles.filtersWrapper}>
            <View style={styles.filterPillsRow}>
              <View style={[styles.filterPill, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Icon source={slidersHBold} size={12} color={colors.primary} />
                <Text style={[styles.filterPillText, { color: colors.text }]}>All Status</Text>
                <Icon source={chevronDownBold} size={10} color={colors.textMuted} />
              </View>
              <View style={[styles.filterPill, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Icon source={slidersHBold} size={12} color={colors.primary} />
                <Text style={[styles.filterPillText, { color: colors.text }]}>All Categori..</Text>
                <Icon source={chevronDownBold} size={10} color={colors.textMuted} />
              </View>
            </View>
            <View style={styles.filterPillsRow}>
              <View style={[styles.filterPill, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Icon source={tagBold} size={12} color={colors.primary} />
                <Text style={[styles.filterPillText, { color: colors.text }]}>All Brands</Text>
                <Icon source={chevronDownBold} size={10} color={colors.textMuted} />
              </View>
            </View>
          </View>
        </FadeUp>

        {/* Products List matching Figma Cards */}
        <View style={styles.productList}>
          {filteredProducts.map((prod, index) => (
            <FadeUp key={prod.id} delay={60 + index * 40} duration={350}>
              <View style={[styles.productCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {/* Product Image */}
                <View style={[styles.imageWrap, { backgroundColor: colors.surfaceAlt }]}>
                  <Image source={prod.image} style={styles.productImg} resizeMode="cover" />
                </View>

                {/* Product Info */}
                <View style={styles.cardContent}>
                  <Text style={[styles.prodName, { color: colors.text }]}>{prod.name}</Text>
                  <Text style={[styles.prodSku, { color: colors.textMuted }]}>{prod.sku}</Text>
                  <Text style={[styles.prodDesc, { color: colors.textMuted }]} numberOfLines={2}>
                    {prod.description}
                  </Text>

                  <Text style={[styles.prodPrice, { color: colors.text }]}>{prod.price}</Text>

                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  {/* Status Toggle Row */}
                  <View style={styles.statusRow}>
                    <Text style={[styles.statusLabel, { color: colors.textMuted }]}>
                      {prod.status}
                    </Text>
                    <Switch
                      value={prod.isActive}
                      onValueChange={() => toggleProductActive(prod.id)}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor="#fff"
                    />
                  </View>
                </View>
              </View>
            </FadeUp>
          ))}
        </View>

        {/* Exact Figma Pagination Footer */}
        <View style={styles.paginationWrap}>
          <View style={styles.pageNumbers}>
            <Text style={[styles.pageNumberItem, { color: colors.text }]}>1</Text>
            <View style={[styles.activePageBox, { backgroundColor: colors.primary }]}>
              <Text style={styles.activePageText}>2</Text>
            </View>
            <Text style={[styles.pageNumberItem, { color: colors.text }]}>3</Text>
          </View>
          <Text style={[styles.pageInfoText, { color: colors.textMuted }]}>
            Showing NaN to NaN of 21 result
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 14,
  },
  topRow: { gap: 4 },
  title: { fontFamily: fonts.bold, fontSize: 26 },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 16,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    padding: 0,
  },

  filtersWrapper: { gap: 8 },
  filterPillsRow: { flexDirection: 'row', gap: 8 },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterPillText: { fontFamily: fonts.medium, fontSize: 12 },

  productList: { gap: 16 },
  productCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageWrap: {
    width: '100%',
    height: 300,
  },
  productImg: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    padding: 16,
    gap: 6,
  },
  prodName: { fontFamily: fonts.bold, fontSize: 16 },
  prodSku: { fontFamily: fonts.regular, fontSize: 12 },
  prodDesc: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17 },
  prodPrice: { fontFamily: fonts.bold, fontSize: 16, marginTop: 4 },
  divider: { height: 1, marginVertical: 8 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: { fontFamily: fonts.medium, fontSize: 13 },

  paginationWrap: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  pageNumbers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pageNumberItem: {
    fontFamily: fonts.medium,
    fontSize: 13,
    paddingHorizontal: 4,
  },
  activePageBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePageText: {
    color: '#fff',
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  pageInfoText: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },
});
