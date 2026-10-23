import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
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
import {
  fetchSellerProductsApi,
  toggleProductStatusApi,
  SellerProductItem,
} from '@/roles/Seller/services/sellerApi';

export default function ProductListScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [products, setProducts] = useState<SellerProductItem[]>(SELLER_PRODUCTS_DATA as any);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Disable'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(SELLER_PRODUCTS_DATA.length);

  // AlertModal State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: AlertModalType;
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const loadProducts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetchSellerProductsApi({
        page: currentPage,
        limit: 10,
        search: searchQuery.trim() || undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
      });

      if (res.products && res.products.length > 0) {
        setProducts(res.products);
        setTotalCount(res.pagination.total);
      } else if (!searchQuery && statusFilter === 'All') {
        // Fallback to local data if initial fetch is empty
        setProducts(SELLER_PRODUCTS_DATA as any);
        setTotalCount(SELLER_PRODUCTS_DATA.length);
      } else {
        setProducts([]);
        setTotalCount(0);
      }
    } catch {
      // Keep resilient fallback
      setProducts(SELLER_PRODUCTS_DATA as any);
      setTotalCount(SELLER_PRODUCTS_DATA.length);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, searchQuery, statusFilter]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const toggleProductActive = async (id: string) => {
    // Optimistic UI update
    setProducts(prev =>
      prev.map(p =>
        p.id === id
          ? {
              ...p,
              isActive: !p.isActive,
              status: !p.isActive ? 'Active' : 'Disable',
            }
          : p,
      ),
    );

    try {
      await toggleProductStatusApi(id);
    } catch (err: any) {
      // Revert if API fails
      setProducts(prev =>
        prev.map(p =>
          p.id === id
            ? {
                ...p,
                isActive: !p.isActive,
                status: !p.isActive ? 'Active' : 'Disable',
              }
            : p,
        ),
      );
      setAlertConfig({
        visible: true,
        type: 'error',
        title: 'Status Update Failed',
        message: err?.response?.data?.message || 'Unable to update product status right now.',
      });
    }
  };

  const cycleStatusFilter = () => {
    if (statusFilter === 'All') setStatusFilter('Active');
    else if (statusFilter === 'Active') setStatusFilter('Disable');
    else setStatusFilter('All');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadProducts(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        {/* Header Info matching Figma */}
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
              onSubmitEditing={() => loadProducts()}
              style={[styles.searchInput, { color: colors.text }]}
            />
          </View>

          {/* Filters Row */}
          <View style={styles.filtersWrapper}>
            <View style={styles.filterPillsRow}>
              <TouchableOpacity
                onPress={cycleStatusFilter}
                activeOpacity={0.7}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: statusFilter !== 'All' ? colors.primary + '20' : colors.surfaceAlt,
                    borderColor: statusFilter !== 'All' ? colors.primary : colors.border,
                  },
                ]}>
                <Icon source={slidersHBold} size={12} color={colors.primary} />
                <Text style={[styles.filterPillText, { color: colors.text }]}>
                  {statusFilter === 'All' ? 'All Status' : statusFilter}
                </Text>
                <Icon source={chevronDownBold} size={10} color={colors.textMuted} />
              </TouchableOpacity>

              <View
                style={[
                  styles.filterPill,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}>
                <Icon source={slidersHBold} size={12} color={colors.primary} />
                <Text style={[styles.filterPillText, { color: colors.text }]}>All Categories</Text>
                <Icon source={chevronDownBold} size={10} color={colors.textMuted} />
              </View>
            </View>

            <View style={styles.filterPillsRow}>
              <View
                style={[
                  styles.filterPill,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}>
                <Icon source={tagBold} size={12} color={colors.primary} />
                <Text style={[styles.filterPillText, { color: colors.text }]}>All Brands</Text>
                <Icon source={chevronDownBold} size={10} color={colors.textMuted} />
              </View>
            </View>
          </View>
        </FadeUp>

        {/* Loading Indicator */}
        {loading && !refreshing && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        {/* Products List matching Figma Cards */}
        <View style={styles.productList}>
          {products.map((prod, index) => (
            <FadeUp key={prod.id || String(index)} delay={60 + index * 30} duration={300}>
              <View
                style={[
                  styles.productCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
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

        {/* Dynamic Pagination Footer */}
        {products.length > 0 && (
          <View style={styles.paginationWrap}>
            <View style={styles.pageNumbers}>
              <TouchableOpacity
                onPress={() => setCurrentPage(1)}
                style={[
                  currentPage === 1 ? styles.activePageBox : null,
                  currentPage === 1 ? { backgroundColor: colors.primary } : null,
                ]}>
                <Text
                  style={[
                    styles.pageNumberItem,
                    { color: currentPage === 1 ? '#fff' : colors.text },
                  ]}>
                  1
                </Text>
              </TouchableOpacity>
              {totalCount > 10 && (
                <TouchableOpacity
                  onPress={() => setCurrentPage(2)}
                  style={[
                    currentPage === 2 ? styles.activePageBox : null,
                    currentPage === 2 ? { backgroundColor: colors.primary } : null,
                  ]}>
                  <Text
                    style={[
                      styles.pageNumberItem,
                      { color: currentPage === 2 ? '#fff' : colors.text },
                    ]}>
                    2
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.pageInfoText, { color: colors.textMuted }]}>
              Showing 1 to {products.length} of {totalCount} results
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Alert Modal */}
      <AlertModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
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

  loadingWrap: {
    paddingVertical: 12,
    alignItems: 'center',
  },

  productList: { gap: 16 },
  productCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageWrap: {
    width: '100%',
    height: 240,
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
    paddingHorizontal: 6,
  },
  activePageBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageInfoText: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },
});
