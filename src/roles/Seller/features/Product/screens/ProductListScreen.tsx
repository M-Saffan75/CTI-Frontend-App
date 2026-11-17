import { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import ConfirmModal from '@/components/ConfirmModal';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  OfflineBanner,
  PaginationFooter,
} from '@/components/states';
import { FadeUp } from '@/animations';
import {
  chevronDownBold,
  packageBold,
  plusSquareBold,
  searchBold,
  slidersHBold,
  tagBold,
  trashBold,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import useRefreshOnActive from '@/utils/useRefreshOnActive';
import { fonts } from '@/theme/fonts';
import {
  getWebSellerProductEditUrl,
  getWebSellerProductVariantsUrl,
} from '@/constants/config';
import {
  deleteSellerProductApi,
  fetchSellerProductsApi,
  SellerOption,
  SellerProductItem,
  toggleProductStatusApi,
} from '@/roles/Seller/services/sellerApi';
import { consumeProductsDirty, formatMoney, openWebsite } from '@/roles/Seller/utils/sellerUtils';
import useProductOptions from '@/roles/Seller/utils/useProductOptions';
import OptionPickerModal from '../components/OptionPickerModal';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 500;

type StatusFilter = 'all' | 'active' | 'disabled';

interface AlertState {
  visible: boolean;
  type: AlertModalType;
  title: string;
  message: string;
}

const HIDDEN_ALERT: AlertState = { visible: false, type: 'info', title: '', message: '' };

const ItemSeparator = () => <View style={styles.separator} />;

type LoadMode = 'initial' | 'refresh' | 'more' | 'silent';

export default function ProductListScreen({ navigation, isActive = true }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [products, setProducts] = useState<SellerProductItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [modelInput, setModelInput] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcode, setBarcode] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [category, setCategory] = useState<SellerOption | null>(null);
  const [brand, setBrand] = useState<SellerOption | null>(null);
  const { categories, brands, error: optionsError, retry: retryOptions } = useProductOptions();
  const [picker, setPicker] = useState<'category' | 'brand' | null>(null);

  const [busyIds, setBusyIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<SellerProductItem | null>(null);
  const [alert, setAlert] = useState<AlertState>(HIDDEN_ALERT);

  const mounted = useRef(true);
  const requestId = useRef(0);
  const markLoaded = useRefreshOnActive(
    isActive,
    () => loadProductsRef.current(1, 'silent'),
    consumeProductsDirty,
  );
  const loadProductsRef = useRef<(page: number, mode: LoadMode) => void>(() => {});

  const showAlert = (type: AlertModalType, title: string, message: string) =>
    setAlert({ visible: true, type, title, message });

  const loadProducts = useCallback(
    async (targetPage: number, mode: LoadMode) => {
      const current = ++requestId.current;
      if (mode === 'refresh') setRefreshing(true);
      else if (mode === 'more') setLoadingMore(true);
      else if (mode === 'initial') {
        setLoading(true);
        setProducts([]);
      }
      if (mode !== 'silent') setError(null);

      try {
        const res = await fetchSellerProductsApi({
          page: targetPage,
          limit: PAGE_SIZE,
          search: search.trim() || undefined,
          isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
          categoryId: category?.id,
          brandId: brand?.id,
          modelNumber: modelNumber.trim() || undefined,
          barcode: barcode.trim() || undefined,
        });
        if (!mounted.current || current !== requestId.current) return;

        setProducts(prev => (mode === 'more' ? [...prev, ...res.products] : res.products));
        setPage(targetPage);
        setHasMore(targetPage < res.pagination.totalPages);
        setTotalItems(res.pagination.totalItems);
        markLoaded();
      } catch (err: any) {
        if (!mounted.current || current !== requestId.current || mode === 'silent') return;
        const message = err?.message || i18n.t('sellerAuto.couldNotLoadYourProducts');
        if (mode === 'initial') setError(message);
        else showAlert('error', i18n.t('customer.couldNotLoadProducts'), message);
      } finally {
        if (mounted.current && current === requestId.current) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [search, modelNumber, barcode, statusFilter, category, brand, markLoaded],
  );

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const timer = setTimeout(() => setModelNumber(modelInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [modelInput]);

  useEffect(() => {
    const timer = setTimeout(() => setBarcode(barcodeInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [barcodeInput]);

  useEffect(() => {
    loadProductsRef.current = loadProducts;
    loadProducts(1, 'initial');
  }, [loadProducts]);

  const handleEndReached = () => {
    if (!loading && !loadingMore && !refreshing && hasMore) {
      loadProducts(page + 1, 'more');
    }
  };

  const setBusy = (id: string, busy: boolean) =>
    setBusyIds(prev => (busy ? [...prev, id] : prev.filter(x => x !== id)));

  const handleToggle = async (product: SellerProductItem) => {
    if (busyIds.includes(product.id)) return;
    setBusy(product.id, true);
    const nextActive = !product.isActive;
    setProducts(prev => prev.map(p => (p.id === product.id ? { ...p, isActive: nextActive } : p)));

    try {
      const res = await toggleProductStatusApi(product.id);
      if (!mounted.current) return;
      showAlert(
        'success',
        i18n.t('sellerAuto.statusUpdated'),
        res?.message || (nextActive ? i18n.t('sellerAuto.productActivated') : i18n.t('sellerAuto.productDeactivated')),
      );
    } catch (err: any) {
      if (!mounted.current) return;
      setProducts(prev =>
        prev.map(p => (p.id === product.id ? { ...p, isActive: product.isActive } : p)),
      );
      showAlert('error', i18n.t('sellerAuto.statusUpdateFailed'), err?.message || i18n.t('sellerAuto.unableToUpdateTheProduct'));
    } finally {
      if (mounted.current) setBusy(product.id, false);
    }
  };

  const handleDelete = async () => {
    const target = deleteTarget;
    if (!target || busyIds.includes(target.id)) return;
    setDeleteTarget(null);
    setBusy(target.id, true);

    try {
      const res = await deleteSellerProductApi(target.id);
      if (!mounted.current) return;
      setProducts(prev => prev.filter(p => p.id !== target.id));
      setTotalItems(prev => Math.max(0, prev - 1));
      showAlert('success', i18n.t('sellerAuto.productDeleted'), res?.message || i18n.t('sellerAuto.productDeletedSuccessfully'));
    } catch (err: any) {
      if (!mounted.current) return;
      showAlert('error', i18n.t('sellerAuto.deleteFailed'), err?.message || i18n.t('sellerAuto.unableToDeleteThisProduct'));
    } finally {
      if (mounted.current) setBusy(target.id, false);
    }
  };

  const openOnWebsite = async (url: string) => {
    const opened = await openWebsite(url);
    if (!opened && mounted.current) {
      showAlert('info', i18n.t('sellerAuto.openTheWebsite'), i18n.t('sellerMsg.product.onWebsite', { url }));
    }
  };

  const cycleStatusFilter = () => {
    setStatusFilter(prev => (prev === 'all' ? 'active' : prev === 'active' ? 'disabled' : 'all'));
  };

  const hasFilters = Boolean(search.trim() || category || brand || statusFilter !== 'all');
  const statusLabel =
    statusFilter === 'all' ? i18n.t('sellerMsg.product.allStatus') : statusFilter === 'active' ? i18n.t('sellerMsg.product.active') : i18n.t('sellerMsg.product.disabled');

  const renderProduct = ({ item, index }: { item: SellerProductItem; index: number }) => {
    const busy = busyIds.includes(item.id);
    return (
      <FadeUp delay={Math.min(index, 6) * 30} duration={300}>
        <View
          style={[styles.productCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.imageWrap, { backgroundColor: colors.surfaceAlt }]}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.productImg} resizeMode="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Icon source={packageBold} size={40} color={colors.textMuted} />
              </View>
            )}
          </View>

          <View style={styles.cardContent}>
            <Text style={[styles.prodName, { color: colors.text }]} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={[styles.prodSku, { color: colors.textMuted }]} numberOfLines={1}>
              {item.sku}
              {item.modelNumber ? `  |  ${item.modelNumber}` : ''}
            </Text>
            {item.category || item.brand ? (
              <Text style={[styles.prodSku, { color: colors.textMuted }]} numberOfLines={1}>
                {[item.category, item.brand].filter(Boolean).join('  |  ')}
              </Text>
            ) : null}
            {item.description ? (
              <Text style={[styles.prodDesc, { color: colors.textMuted }]} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}

            <View style={styles.priceRow}>
              <Text style={[styles.prodPrice, { color: colors.text }]}>
                {formatMoney(item.sellingPrice)}
              </Text>
              {item.discountPrice ? (
                <Text style={[styles.discountText, { color: colors.success ?? colors.primary }]}>
                  {i18n.t('sellerMsg.product.discounted', { price: formatMoney(item.discountPrice) })}
                </Text>
              ) : null}
            </View>
            <Text
              style={[
                styles.stockText,
                { color: item.stock === 0 ? colors.error ?? '#EF4444' : colors.textMuted },
              ]}>
              {item.stock === 0 ? i18n.t('customer.outOfStock') : i18n.t('sellerMsg.product.inStock', { count: item.stock })}
            </Text>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.textMuted }]}>
                {item.isActive ? i18n.t('profile.status.active') : i18n.t('sellerAuto.disabled')}
              </Text>
              <Switch
                value={item.isActive}
                disabled={busy}
                onValueChange={() => handleToggle(item)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                disabled={busy}
                activeOpacity={0.7}
                onPress={() => openOnWebsite(getWebSellerProductEditUrl(item.id))}
                style={[styles.actionBtn, { borderColor: colors.border }]}>
                <Text style={[styles.actionBtnText, { color: colors.primary }]}>{i18n.t('repairman.editOnWebsite')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={busy}
                activeOpacity={0.7}
                onPress={() => openOnWebsite(getWebSellerProductVariantsUrl(item.id))}
                style={[styles.actionBtn, { borderColor: colors.border }]}>
                <Text style={[styles.actionBtnText, { color: colors.primary }]}>{i18n.t('sellerAuto.variants')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={busy}
                activeOpacity={0.7}
                onPress={() => setDeleteTarget(item)}
                style={[styles.deleteBtn, { borderColor: colors.border }]}>
                <Icon source={trashBold} size={16} color={colors.error ?? '#EF4444'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </FadeUp>
    );
  };

  const header = (
    <View>
      <View style={styles.topRow}>
        <View style={styles.flex1}>
          <Text style={[styles.title, { color: colors.text }]}>{t('sellerAuto.products')}</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {t('sellerAuto.manageYourStoreSInventory')}
          </Text>
        </View>
        <Squeeze onPress={() => navigation?.navigate('AddProduct')}>
          <View style={[styles.addBtn, { backgroundColor: colors.primary }]}>
            <Icon source={plusSquareBold} size={14} color={colors.onPrimary} />
            <Text numberOfLines={1} adjustsFontSizeToFit style={styles.addBtnText}>{t('sellerAuto.add')}</Text>
          </View>
        </Squeeze>
      </View>

      <View
        style={[styles.searchBar, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
        <Icon source={searchBold} size={16} color={colors.textMuted} />
        <TextInput
          placeholder={t('sellerAuto.searchByNameSkuModel')}
          placeholderTextColor={colors.textMuted}
          value={searchInput}
          onChangeText={setSearchInput}
          returnKeyType="search"
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      <View style={styles.codeRow}>
        <TextInput
          placeholder={t('sellerAuto.modelNumber2')}
          placeholderTextColor={colors.textMuted}
          value={modelInput}
          onChangeText={setModelInput}
          autoCapitalize="characters"
          style={[
            styles.codeInput,
            { color: colors.text, backgroundColor: colors.surfaceAlt, borderColor: colors.border },
          ]}
        />
        <TextInput
          placeholder={t('sellerAuto.barcode')}
          placeholderTextColor={colors.textMuted}
          value={barcodeInput}
          onChangeText={setBarcodeInput}
          autoCapitalize="characters"
          style={[
            styles.codeInput,
            { color: colors.text, backgroundColor: colors.surfaceAlt, borderColor: colors.border },
          ]}
        />
      </View>

      <View style={styles.filtersWrapper}>
        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            onPress={cycleStatusFilter}
            activeOpacity={0.7}
            style={[
              styles.filterPill,
              {
                backgroundColor: statusFilter !== 'all' ? colors.primary + '20' : colors.surfaceAlt,
                borderColor: statusFilter !== 'all' ? colors.primary : colors.border,
              },
            ]}>
            <Icon source={slidersHBold} size={12} color={colors.primary} />
            <Text style={[styles.filterPillText, { color: colors.text }]}>{statusLabel}</Text>
            <Icon source={chevronDownBold} size={10} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPicker('category')}
            activeOpacity={0.7}
            style={[
              styles.filterPill,
              styles.filterPillFlex,
              {
                backgroundColor: category ? colors.primary + '20' : colors.surfaceAlt,
                borderColor: category ? colors.primary : colors.border,
              },
            ]}>
            <Icon source={slidersHBold} size={12} color={colors.primary} />
            <Text style={[styles.filterPillText, { color: colors.text }]}>
              {category ? category.name : t('sellerAuto.allCategories')}
            </Text>
            <Icon source={chevronDownBold} size={10} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            onPress={() => setPicker('brand')}
            activeOpacity={0.7}
            style={[
              styles.filterPill,
              styles.filterPillFlex,
              {
                backgroundColor: brand ? colors.primary + '20' : colors.surfaceAlt,
                borderColor: brand ? colors.primary : colors.border,
              },
            ]}>
            <Icon source={tagBold} size={12} color={colors.primary} />
            <Text style={[styles.filterPillText, { color: colors.text }]}>
              {brand ? brand.name : t('sellerAuto.allBrands')}
            </Text>
            <Icon source={chevronDownBold} size={10} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {!loading && products.length > 0 && (
        <Text style={[styles.countText, { color: colors.textMuted }]}>
          {i18n.t('sellerMsg.product.showing', { shown: products.length, total: totalItems })}
        </Text>
      )}
    </View>
  );

  let body: ReactElement | null = null;
  if (loading && products.length === 0) {
    body = <LoadingState text={t('sellerAuto.loadingProducts')} style={styles.stateWrap} />;
  } else if (error && products.length === 0) {
    body = <ErrorState error={error} onRetry={() => loadProducts(1, 'initial')} style={styles.stateWrap} />;
  } else if (products.length === 0) {
    body = (
      <EmptyState
        icon={packageBold}
        title={t('customer.noProductsFound')}
        message={
          hasFilters
            ? t('customer.noProductsMatchYourSearch')
            : t('sellerAuto.youHaveNotAddedAny')
        }
        style={styles.stateWrap}
      />
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <OfflineBanner />
      <FlatList
        data={products}
        keyExtractor={item => item.id}
        renderItem={renderProduct}
        ListHeaderComponent={header}
        ListEmptyComponent={body}
        ListFooterComponent={
          <PaginationFooter loading={loadingMore} hasMore={hasMore} />
        }
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 32 }]}
        ItemSeparatorComponent={ItemSeparator}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadProducts(1, 'refresh')}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />

      <OptionPickerModal
        visible={picker === 'category'}
        title={t('sellerAuto.selectCategory')}
        options={categories}
        error={optionsError}
        onRetry={retryOptions}
        selectedId={category?.id}
        clearLabel={t('sellerAuto.allCategories')}
        onSelect={option => {
          setCategory(option);
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
      <OptionPickerModal
        visible={picker === 'brand'}
        title={t('sellerAuto.selectBrand')}
        options={brands}
        error={optionsError}
        onRetry={retryOptions}
        selectedId={brand?.id}
        clearLabel={t('sellerAuto.allBrands')}
        onSelect={option => {
          setBrand(option);
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />

      <ConfirmModal
        visible={!!deleteTarget}
        title={t('sellerAuto.deleteProduct')}
        message={i18n.t('sellerMsg.product.deleteConfirm', { name: deleteTarget?.name ?? '' })}
        confirmText={t('chat.delete')}
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <AlertModal
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert(HIDDEN_ALERT)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex1: { flex: 1 },
  separator: { height: 16 },
  container: {
    paddingHorizontal: 16,
    paddingTop: 14,
    flexGrow: 1,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontFamily: fonts.bold, fontSize: 26 },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, marginTop: 4 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 10,
  },
  addBtnText: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 13, color: '#fff' },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 16,
    marginBottom: 10,
  },
  codeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  codeInput: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: fonts.regular,
    fontSize: 13,
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
  filterPillFlex: { flexShrink: 1 },
  filterPillText: { fontFamily: fonts.medium, fontSize: 12, flexShrink: 1 },
  countText: { fontFamily: fonts.regular, fontSize: 12, marginTop: 12, marginBottom: 4 },

  stateWrap: { paddingVertical: 40 },

  productCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 12,
  },
  imageWrap: { width: '100%', height: 220 },
  productImg: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardContent: { padding: 16, gap: 6 },
  prodName: { fontFamily: fonts.bold, fontSize: 16 },
  prodSku: { fontFamily: fonts.regular, fontSize: 12 },
  prodDesc: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 4 },
  prodPrice: { fontFamily: fonts.bold, fontSize: 16 },
  discountText: { fontFamily: fonts.medium, fontSize: 12 },
  stockText: { fontFamily: fonts.medium, fontSize: 12 },
  divider: { height: 1, marginVertical: 8 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: { fontFamily: fonts.medium, fontSize: 13 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  actionBtn: {
    flex: 1,
    minHeight: 38,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: { fontFamily: fonts.medium, fontSize: 12, textAlign: 'center' },
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
