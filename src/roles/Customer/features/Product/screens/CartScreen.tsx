import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  heartExtra,
  menuBold,
  minusSquareBold,
  plusSquareBold,
  trashBold,
} from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useWishlist } from '../../../context/WishlistContext';
import { PRODUCTS } from '../data/products';

const SHIPPING_FEE = 10;

function CartRow({ item, onQuantity, onRemove }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Image source={item.product.image} style={styles.rowPhoto} />

      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
          {item.product.title}
        </Text>
        <Text style={[styles.rowPrice, { color: colors.text }]}>
          ${item.product.price.toFixed(2)}
        </Text>

        <View style={styles.rowFoot}>
          <View style={styles.qtyControls}>
            <Squeeze onPress={() => onQuantity(Math.max(1, item.quantity - 1))} style={[styles.qtyBtn, { borderColor: colors.border }]}>
              <Icon source={minusSquareBold} size={16} color={colors.text} />
            </Squeeze>
            <Text style={[styles.qtyValue, { color: colors.text }]}>{item.quantity}</Text>
            <Squeeze onPress={() => onQuantity(item.quantity + 1)} style={[styles.qtyBtn, { borderColor: colors.border }]}>
              <Icon source={plusSquareBold} size={16} color={colors.text} />
            </Squeeze>
          </View>

          <Squeeze onPress={onRemove} scale={0.85}>
            <Icon source={trashBold} size={18} color={colors.error} />
          </Squeeze>
        </View>
      </View>
    </View>
  );
}

export default function CartScreen({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { ids: wishlistIds } = useWishlist();

  const [items, setItems] = useState(
    PRODUCTS.slice(0, 2).map(product => ({ product, quantity: 1 })),
  );

  const setQuantity = (id, quantity) =>
    setItems(current => current.map(item => (item.product.id === id ? { ...item, quantity } : item)));

  const removeItem = id => setItems(current => current.filter(item => item.product.id !== id));

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
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
        showsVerticalScrollIndicator={false}>
        <Squeeze onPress={() => navigation.goBack()} scale={0.9} style={styles.backWrap}>
          <View style={[styles.back, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={20} color={colors.onPrimary} />
          </View>
        </Squeeze>

        <Text style={[styles.title, { color: colors.text }]}>My Cart</Text>

        {items.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>Your cart is empty.</Text>
        ) : (
          items.map((item, index) => (
            <FadeUp key={item.product.id} delay={60 + index * 60} duration={500} style={styles.spaced}>
              <CartRow
                item={item}
                onQuantity={q => setQuantity(item.product.id, q)}
                onRemove={() => removeItem(item.product.id)}
              />
            </FadeUp>
          ))
        )}

        <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Items</Text>
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
            <Text style={[styles.totalValue, { color: colors.text }]}>${total.toFixed(2)}</Text>
          </View>

          <Button
            title="Checkout"
            disabled={items.length === 0}
            onPress={() => navigation.navigate('Checkout')}
            style={styles.checkoutButton}
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
