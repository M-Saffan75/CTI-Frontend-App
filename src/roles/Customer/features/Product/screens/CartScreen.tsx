import { useEffect, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CtiLoader from '@/components/CtiLoader';
import Icon from '@/components/Icon';
import Button from '@/components/Button';
import Squeeze from '@/components/Squeeze';
import ConfirmModal from '@/components/ConfirmModal';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import { FadeUp } from '@/animations';
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

const SHIPPING_FEE = 10;

function CartRow({
  item,
  onQuantity,
  onRemove,
  updating,
}: {
  item: MobileCartItem;
  onQuantity: (delta: number) => void;
  onRemove: () => void;
  updating?: boolean;
}) {
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
          <View style={{ backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginVertical: 2 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 9, color: '#92400E', textTransform: 'uppercase' }}>Refurbished</Text>
          </View>
        )}
        <Text style={[styles.rowPrice, { color: colors.primary }]}>
          ${Number(item.price || 0).toFixed(2)}
        </Text>

        <View style={styles.rowFoot}>
          <View style={styles.qtyControls}>
            <Squeeze
              onPress={() => onQuantity(-1)}
              disabled={updating || item.quantity <= 1}
              style={[
                styles.qtyBtn,
                { borderColor: colors.border, opacity: item.quantity <= 1 ? 0.4 : 1 },
              ]}>
              <Icon source={minusSquareBold} size={16} color={colors.text} />
            </Squeeze>
            <Text style={[styles.qtyValue, { color: colors.text }]}>
              {updating ? '...' : item.quantity}
            </Text>
            <Squeeze
              onPress={() => onQuantity(1)}
              disabled={updating}
              style={[styles.qtyBtn, { borderColor: colors.border }]}>
              <Icon source={plusSquareBold} size={16} color={colors.text} />
            </Squeeze>
          </View>

          <Squeeze onPress={onRemove} scale={0.85} disabled={updating}>
            <Icon source={trashBold} size={18} color={colors.error} />
          </Squeeze>
        </View>
      </View>
    </View>
  );
}

export default function CartScreen({ navigation }: any) {
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
  const [updatingId, setUpdatingId] = useState<string | null>(null);
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
      await refreshCart();
    } finally {
      setRefreshing(false);
    }
  };

  const handleQuantity = async (item: MobileCartItem, delta: number) => {
    setUpdatingId(item.id);
    try {
      await updateQuantity(item, delta);
    } catch (err: any) {
      setModal({
        visible: true,
        type: 'error',
        title: 'Update Failed',
        message: err?.message || 'Could not update item quantity.',
      });
    } finally {
      setUpdatingId(null);
    }
  };

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
        title: 'Delete Failed',
        message: err?.message || 'Could not remove item from cart.',
      });
    }
  };

  const subtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1), 0);
  const shipping = items.length ? SHIPPING_FEE : 0;
  const total = subtotal + shipping;

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

        <Text style={[styles.title, { color: colors.text }]}>My Cart</Text>

        {loading && !refreshing ? (
          <CtiLoader
            size="md"
            text="Loading your cart..."
            style={{ paddingVertical: 45 }}
          />
        ) : items.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: 'center', gap: 14 }}>
            <Icon source={shoppingCartExtra} size={48} color={colors.textMuted} />
            <Text style={[styles.empty, { color: colors.textMuted, marginTop: 0 }]}>
              Your shopping cart is currently empty.
            </Text>
            <Button
              title="Explore Products"
              size="sm"
              onPress={() => navigation.navigate('Home', { screen: 'ProductTab' })}
              style={{ marginTop: 6 }}
            />
          </View>
        ) : (
          items.map((item, index) => (
            <FadeUp key={item.id} delay={Math.min(300, 40 + index * 40)} duration={450} style={styles.spaced}>
              <CartRow
                item={item}
                updating={updatingId === item.id}
                onQuantity={delta => handleQuantity(item, delta)}
                onRemove={() => setItemToDelete(item)}
              />
            </FadeUp>
          ))
        )}

        <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>
              Items ({items.reduce((s, it) => s + it.quantity, 0)})
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Sub total</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Shipping</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>${shipping.toFixed(2)}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>${total.toFixed(2)}</Text>
          </View>

          <Button
            title="Proceed to Checkout"
            disabled={items.length === 0}
            onPress={() => {
              const hasRefurbished = items.some((i: any) => i.isRefurbished || i.product?.isRefurbished);
              navigation.navigate('Checkout', {
                cartItems: items,
                subtotal,
                shipping,
                total,
                isRefurbished: hasRefurbished,
              });
            }}
            style={styles.checkoutButton}
          />
        </View>
      </ScrollView>

      <ConfirmModal
        visible={!!itemToDelete}
        title="Remove Item?"
        message={`Are you sure you want to remove "${itemToDelete?.title}" from your cart?`}
        confirmText="Remove"
        cancelText="Keep"
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
  row: { flexDirection: 'row', gap: 12, borderRadius: 14, borderWidth: 1, padding: 12 },
  rowPhoto: { width: 70, height: 70, borderRadius: 10 },
  rowBody: { flex: 1, gap: 4 },
  rowTitle: { fontFamily: fonts.bold, fontSize: 14 },
  rowPrice: { fontFamily: fonts.bold, fontSize: 14 },
  rowFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: { width: 26, height: 26, borderRadius: 7, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  qtyValue: { fontFamily: fonts.bold, fontSize: 13, minWidth: 14, textAlign: 'center' },

  summary: { borderRadius: 16, borderWidth: 1, padding: 18, marginTop: 24 },
  summaryTitle: { fontFamily: fonts.bold, fontSize: 18, marginBottom: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontFamily: fonts.regular, fontSize: 14 },
  summaryValue: { fontFamily: fonts.bold, fontSize: 14 },
  divider: { height: 1, marginBottom: 10 },
  totalLabel: { fontFamily: fonts.bold, fontSize: 17 },
  totalValue: { fontFamily: fonts.bold, fontSize: 17 },
  checkoutButton: { marginTop: 16 },
});
