import { memo, useCallback, useMemo, useState } from 'react';
import { formatMoney } from '@/utils/money';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CtiLoader from '@/components/CtiLoader';
import Icon from '@/components/Icon';
import Button from '@/components/Button';
import AuthService from '@/services/authService';
import Squeeze from '@/components/Squeeze';
import ConfirmModal from '@/components/ConfirmModal';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import {
  arrowLeftBold,
  heartExtra,
  menuBold,
  minusSquareBold,
  plusSquareBold,
  shoppingCartExtra,
  trashBold,
} from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useWishlist } from '../../../context/WishlistContext';
import { useCart } from '../../../context/CartContext';
import {
  MobileCartItem,
} from '../services/ecomApi';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { upper } from '@/i18n/locale';

// The backend charges the customer no shipping (the seller arranges it), so the cart never adds a fee.
// Like the web, an order can only hold one seller's items, so the cart is shown in groups
// and each group is checked out on its own.
interface CartGroup {
  key: string;
  type: 'standard' | 'refurbished';
  sellerId?: string;
  sellerName?: string;
  items: MobileCartItem[];
  subtotal: number;
}

function groupCart(items: MobileCartItem[]): CartGroup[] {
  const map = new Map<string, CartGroup>();
  items.forEach(item => {
    const type = item.isRefurbished ? 'refurbished' : 'standard';
    const key = type === 'refurbished' ? 'refurbished' : 'seller:' + (item.sellerId || 'unknown');
    if (!map.has(key)) {
      map.set(key, { key, type, sellerId: item.sellerId, sellerName: item.sellerName, items: [], subtotal: 0 });
    }
    const group = map.get(key) as CartGroup;
    group.items.push(item);
    group.subtotal += (Number(item.price) || 0) * (item.quantity || 1);
  });
  const groups = Array.from(map.values());
  // marketplace sellers first, the refurbished store last
  return groups.sort((a, b) => (a.type === b.type ? 0 : a.type === 'standard' ? -1 : 1));
}

interface CartRowProps {
  item: MobileCartItem;
  onQuantity: (item: MobileCartItem, delta: number) => void;
  onRemove: (item: MobileCartItem) => void;
}

const CartRow = memo(function CartRowView({
  item,
  onQuantity,
  onRemove,
}: CartRowProps) {
  const { colors } = useTheme();

  const imageSource =
    typeof item.image === 'string'
      ? { uri: item.image }
      : item.image?.uri
      ? item.image
      : item.image;

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Image source={imageSource} style={styles.rowPhoto} resizeMode="cover" />

      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        {!!item.variantLabel && (
          <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted }}>
            {item.variantLabel}
          </Text>
        )}
        {item.isRefurbished && (
          <View
            style={{
              backgroundColor: '#FEF3C7',
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
              alignSelf: 'flex-start',
              marginVertical: 2,
            }}>
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 9,
                color: '#92400E',
              }}>
              {upper(i18n.t('glossary.refurbished'))}
            </Text>
          </View>
        )}
        <Text style={[styles.rowPrice, { color: colors.primary }]}>
          {formatMoney(item.price)}
        </Text>

        <View style={styles.rowFoot}>
          <View style={styles.qtyControls}>
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => onQuantity(item, -1)}
              disabled={item.quantity <= 1}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[
                styles.qtyBtn,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceAlt,
                  opacity: item.quantity <= 1 ? 0.35 : 1,
                },
              ]}>
              <Icon source={minusSquareBold} size={15} color={colors.text} />
            </TouchableOpacity>

            <Text style={[styles.qtyValue, { color: colors.text }]}>
              {item.quantity}
            </Text>

            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => onQuantity(item, 1)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[
                styles.qtyBtn,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceAlt,
                },
              ]}>
              <Icon source={plusSquareBold} size={15} color={colors.text} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => onRemove(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.deleteBtn}>
            <Icon source={trashBold} size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

export default function CartScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { ids: wishlistIds } = useWishlist();
  const {
    cartItems: items,
    loading,
    refreshCart,
    updateQuantity,
    removeItem,
  } = useCart();

  const [refreshing, setRefreshing] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MobileCartItem | null>(null);

  // AlertModal State
  const [modal, setModal] = useState<{
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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const ok = await refreshCart();
      if (!ok) {
        setModal({
          visible: true,
          type: 'error',
          title: i18n.t('customer.couldNotRefresh'),
          message: i18n.t('customer.yourCartCouldNotBe'),
        });
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleQuantity = useCallback(
    (item: MobileCartItem, delta: number) => {
      updateQuantity(item, delta);
    },
    [updateQuantity]
  );

  const handleRemove = useCallback((item: MobileCartItem) => {
    setItemToDelete(item);
  }, []);

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const target = itemToDelete;
    setItemToDelete(null);

    try {
      await removeItem(target);
    } catch (err: any) {
      setModal({
        visible: true,
        type: 'error',
        title: i18n.t('customer.deleteFailed'),
        message: err?.message || i18n.t('customer.couldNotRemoveItemFrom'),
      });
    }
  };

  const groups = useMemo(() => groupCart(items), [items]);

  const checkoutGroup = (group: CartGroup) => {
    navigation.navigate('Checkout', {
      group: {
        type: group.type,
        sellerId: group.sellerId,
        sellerName: group.sellerName,
        items: group.items,
        subtotal: group.subtotal,
      },
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Image source={ctiLogo} resizeMode="contain" style={styles.logo} />
        <View style={styles.headerIcons}>
          <Squeeze onPress={() => navigation.navigate('Wishlist')} scale={0.85}>
            <View>
              <Icon source={heartExtra} size={22} color={colors.text} />
              {wishlistIds.length > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.error }]}>
                  <Text style={styles.badgeText}>{wishlistIds.length}</Text>
                </View>
              )}
            </View>
          </Squeeze>
          <Squeeze onPress={() => navigation.navigate('Settings')} scale={0.85}>
            <Icon source={menuBold} size={22} color={colors.text} />
          </Squeeze>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        <Squeeze onPress={() => navigation.goBack()} scale={0.9} style={styles.backWrap}>
          <View style={[styles.back, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={20} color={colors.onPrimary} />
          </View>
        </Squeeze>

        <Text style={[styles.title, { color: colors.text }]}>{t('customer.myCart')}</Text>

        {loading && !refreshing && items.length === 0 ? (
          <CtiLoader
            size="md"
            text={t('customer.loadingYourCart')}
            style={{ paddingVertical: 45 }}
          />
        ) : items.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: 'center', gap: 14 }}>
            <Icon source={shoppingCartExtra} size={48} color={colors.textMuted} />
            <Text style={[styles.empty, { color: colors.textMuted, marginTop: 0 }]}>
              {t('customer.yourShoppingCartIsCurrently')}
            </Text>
            <Button
              title={t('customer.exploreProducts')}
              size="sm"
              onPress={() =>
                AuthService.getCachedRole() === 'customer'
                  ? navigation.navigate('Home', { screen: 'ProductTab' })
                  : navigation.navigate('Products')
              }
              style={{ marginTop: 6 }}
            />
          </View>
        ) : (
          <>
            {groups.length > 1 && (
              <View style={[styles.notice, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Text style={[styles.noticeText, { color: colors.text }]}>
                  {t('customer.eachSellerIsCheckedOut')}
                </Text>
              </View>
            )}

            {groups.map(group => (
              <View key={group.key} style={styles.group}>
                {groups.length > 1 && (
                  <Text style={[styles.groupTitle, { color: colors.text }]}>
                    {group.type === 'refurbished'
                      ? i18n.t('customer.refurbishedStore')
                      : group.sellerName
                      ? t('customerMsg.marketplaceSeller', { name: group.sellerName })
                      : i18n.t('customer.marketplace')}
                  </Text>
                )}

                {group.items.map(item => (
                  <View key={item.id} style={styles.spaced}>
                    <CartRow item={item} onQuantity={handleQuantity} onRemove={handleRemove} />
                  </View>
                ))}

                <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.summaryTitle, { color: colors.text }]}>{i18n.t('customer.orderSummary')}</Text>

                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
                      {t('customerMsg.subtotalCount', { count: group.items.reduce((sum, it) => sum + it.quantity, 0) })}
                    </Text>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>{formatMoney(group.subtotal)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{t('customerMsg.shippingCost')}</Text>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>{i18n.t('customer.arrangedByTheSeller')}</Text>
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  <View style={styles.summaryRow}>
                    <Text style={[styles.totalLabel, { color: colors.text }]}>{i18n.t('customer.total')}</Text>
                    <Text style={[styles.totalValue, { color: colors.primary }]}>{formatMoney(group.subtotal)}</Text>
                  </View>

                  <Button
                    title={i18n.t('customer.proceedToCheckout')}
                    onPress={() => checkoutGroup(group)}
                    style={styles.checkoutButton}
                  />
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <ConfirmModal
        visible={!!itemToDelete}
        title={t('customer.removeItem')}
        message={t('customerMsg.removeFromCart', { title: itemToDelete?.title || '' })}
        confirmText={t('profile.remove')}
        cancelText={t('customer.keep')}
        danger
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
      />

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
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  logo: { width: 110, height: 59 },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  badge: {
    position: 'absolute',
    top: -5,
    right: -6,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontFamily: fonts.bold, fontSize: 9, color: '#FFFFFF' },

  body: { paddingHorizontal: 20 },
  backWrap: { alignSelf: 'flex-start' },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  title: { fontFamily: fonts.bold, fontSize: 24, marginTop: 16 },
  empty: { fontFamily: fonts.regular, fontSize: 14, marginTop: 30, textAlign: 'center' },

  spaced: { marginTop: 14 },
  group: { marginTop: 6 },
  groupTitle: { fontFamily: fonts.bold, fontSize: 16, marginTop: 18 },
  notice: { borderRadius: 12, borderWidth: 1, padding: 12, marginTop: 14 },
  noticeText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  row: { flexDirection: 'row', gap: 12, borderRadius: 14, borderWidth: 1, padding: 12 },
  rowPhoto: { width: 70, height: 70, borderRadius: 10 },
  rowBody: { flex: 1, gap: 4 },
  rowTitle: { fontFamily: fonts.bold, fontSize: 14 },
  rowPrice: { fontFamily: fonts.bold, fontSize: 14 },
  rowFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: { fontFamily: fonts.bold, fontSize: 14, minWidth: 26, textAlign: 'center' },
  deleteBtn: {
    padding: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  summary: { borderRadius: 16, borderWidth: 1, padding: 18, marginTop: 24 },
  summaryTitle: { fontFamily: fonts.bold, fontSize: 18, marginBottom: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 14 },
  summaryValue: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 14 },
  divider: { height: 1, marginBottom: 10 },
  totalLabel: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 17 },
  totalValue: { fontFamily: fonts.bold, fontSize: 17 },
  checkoutButton: { marginTop: 16 },
});
