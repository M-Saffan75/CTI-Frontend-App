import { useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Squeeze from '@/components/Squeeze';
import ConfirmModal from '@/components/ConfirmModal';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  checkCircleIcon,
  creditCardBold,
  heartExtra,
  mapPinBold,
  menuBold,
  packageBold,
  shoppingCartExtra,
} from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useWishlist } from '../../../context/WishlistContext';
import { useCart } from '../../../context/CartContext';
import { createCustomerOrderApi } from '../../Orders/services/orderApi';

// Luhn algorithm validator for card numbers (Standard credit card checksum)
function validateLuhn(numberStr: string): boolean {
  const cleaned = numberStr.replace(/\D/g, '');
  if (cleaned.length < 13 || cleaned.length > 19) return false;
  let sum = 0;
  let isEven = false;
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
}

// Detect card brand for visual feedback
function getCardBrand(numberStr: string): string {
  const cleaned = numberStr.replace(/\D/g, '');
  if (/^4/.test(cleaned)) return 'Visa';
  if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
  if (/^3[47]/.test(cleaned)) return 'Amex';
  if (/^6(?:011|5)/.test(cleaned)) return 'Discover';
  return '';
}

// Format Card Number into 4-digit blocks (max 16 digits, 19 chars with spaces)
function formatCardNumber(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 16);
  const parts = digits.match(/.{1,4}/g);
  return parts ? parts.join(' ') : digits;
}

// Format Expiry MM/YY (max 4 digits, 5 chars with slash)
function formatExpiry(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  }
  return digits;
}

// Format CVV (digits only, max 4)
function formatCvv(text: string): string {
  return text.replace(/\D/g, '').slice(0, 4);
}

export default function CheckoutScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { ids: wishlistIds } = useWishlist();
  const { cartItems: contextCartItems, cartCount, refreshCart } = useCart();

  const routeItems = route?.params?.cartItems;
  const cartItems = routeItems && routeItems.length > 0 ? routeItems : contextCartItems;
  const effectiveCartCount =
    cartCount > 0 ? cartCount : (cartItems?.length || 0);

  const [firstName, setFirstName] = useState('Customer');
  const [lastName, setLastName] = useState('User');
  const [email, setEmail] = useState('customer@gmail.com');
  const [phone, setPhone] = useState('03001234567');
  const [address, setAddress] = useState('Main Boulevard, Gulberg');
  const [city, setCity] = useState('Lahore');
  const [postalCode, setPostalCode] = useState('54000');

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('card');
  const [cardHolder, setCardHolder] = useState('Customer User');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [placed, setPlaced] = useState(false);
  const [placing, setPlacing] = useState(false);
  const scrollRef = useRef<any>(null);

  const cardBrand = getCardBrand(cardNumber);

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

  const rawCardDigits = cardNumber.replace(/\D/g, '');
  const canPlaceOrder =
    phone.trim() &&
    address.trim() &&
    city.trim() &&
    (paymentMethod === 'cod' ||
      (rawCardDigits.length === 16 && cardExpiry.length === 5 && cardCvv.length >= 3));

  const fillSandboxTestCard = () => {
    setCardNumber(formatCardNumber('5528790000000008'));
    setCardHolder(`${firstName} ${lastName}`.trim() || 'Customer User');
    setCardExpiry('12/28');
    setCardCvv('123');
  };

  const handlePlaceOrder = async () => {
    if (!firstName.trim() || !address.trim() || !phone.trim() || !city.trim()) {
      setModal({
        visible: true,
        type: 'warning',
        title: 'Missing Details',
        message: 'Please fill in your full name, shipping address, city and phone number.',
      });
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      setModal({
        visible: true,
        type: 'warning',
        title: 'Cart is Empty',
        message: 'Please add items to your cart before proceeding to checkout.',
      });
      return;
    }

    if (paymentMethod === 'card') {
      const cleanDigits = cardNumber.replace(/\D/g, '');
      if (cleanDigits.length !== 16) {
        setModal({
          visible: true,
          type: 'warning',
          title: 'Invalid Card Number',
          message: 'Card number must be exactly 16 digits.',
        });
        return;
      }

      if (!validateLuhn(cleanDigits)) {
        setModal({
          visible: true,
          type: 'warning',
          title: 'Invalid Card Number',
          message:
            'Card number failed checksum verification. Please verify the digits or tap "Autofill Sandbox Test Card" below.',
        });
        return;
      }

      const holder = cardHolder.trim() || `${firstName} ${lastName}`.trim();
      if (holder.length < 3) {
        setModal({
          visible: true,
          type: 'warning',
          title: 'Card Holder Required',
          message: 'Please enter the card holder name (at least 3 characters).',
        });
        return;
      }

      if (cardExpiry.length !== 5 || !cardExpiry.includes('/')) {
        setModal({
          visible: true,
          type: 'warning',
          title: 'Invalid Expiry Date',
          message: 'Please enter expiry date in MM/YY format (e.g. 12/28).',
        });
        return;
      }

      const expMonth = parseInt(cardExpiry.slice(0, 2), 10);
      const expYear = 2000 + parseInt(cardExpiry.slice(3, 5), 10);
      if (isNaN(expMonth) || expMonth < 1 || expMonth > 12) {
        setModal({
          visible: true,
          type: 'warning',
          title: 'Invalid Expiry Month',
          message: 'Expiry month must be between 01 and 12.',
        });
        return;
      }

      const now = new Date();
      if (expYear < now.getFullYear() || (expYear === now.getFullYear() && expMonth < (now.getMonth() + 1))) {
        setModal({
          visible: true,
          type: 'warning',
          title: 'Card Expired',
          message: 'This card has already expired. Please enter a valid future expiry date.',
        });
        return;
      }

      const cleanCvv = cardCvv.replace(/\D/g, '');
      if (cleanCvv.length < 3 || cleanCvv.length > 4) {
        setModal({
          visible: true,
          type: 'warning',
          title: 'Invalid CVV',
          message: 'CVV must be 3 or 4 digits.',
        });
        return;
      }
    }

    try {
      setPlacing(true);
      const [expireMonth, expireYearShort] = cardExpiry.split('/');
      const expireYear = expireYearShort ? `20${expireYearShort}` : undefined;

      const isRefurbishedOrder = Boolean(
        route?.params?.isRefurbished ||
        cartItems.some((i: any) =>
          i.isRefurbished ||
          i.product?.isRefurbished ||
          i.itemType === 'refurbished' ||
          i.product?.condition === 'Refurbished'
        )
      );

      const orderItemsPayload = cartItems.map((i: any) => {
        const pId = String(i.productId || i.product?._id || i.product?.id || i.id || '');
        let vId = i.variantId
          ? String(typeof i.variantId === 'object' ? (i.variantId._id || i.variantId.id) : i.variantId)
          : undefined;
        if (!vId && i.product) {
          vId = i.product.defaultVariantId || i.product.variants?.[0]?._id;
        }
        return {
          productId: pId,
          variantId: vId,
          quantity: Number(i.quantity || 1),
        };
      });

      await createCustomerOrderApi({
        shippingAddress: {
          fullName: `${firstName} ${lastName}`.trim(),
          phone: phone.trim(),
          country: 'Pakistan',
          city: city.trim(),
          addressLine: address.trim(),
          postalCode: postalCode.trim(),
        },
        paymentMethod: paymentMethod === 'card' ? 'card' : 'cod',
        cardHolder: cardHolder.trim() || `${firstName} ${lastName}`.trim(),
        cardNumber: cardNumber.replace(/\s/g, ''),
        expireMonth: expireMonth?.trim(),
        expireYear: expireYear?.trim(),
        cvc: cardCvv.trim(),
        items: orderItemsPayload,
        isRefurbished: isRefurbishedOrder,
      });

      try {
        await refreshCart();
      } catch {}

      setPlaced(true);
    } catch (err: any) {
      setModal({
        visible: true,
        type: 'error',
        title: 'Order Failed',
        message: err?.message || 'Could not place your order. Please try again.',
      });
    } finally {
      setPlacing(false);
    }
  };

  // Card fields sit right above the keyboard once it opens — scroll them into view
  const scrollToCardFields = () => scrollRef.current?.scrollToEnd({ animated: true });

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
          <Squeeze onPress={() => navigation.navigate('Cart')} scale={0.85}>
            <View>
              <Icon source={shoppingCartExtra} size={22} color={colors.text} />
              {effectiveCartCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>{effectiveCartCount}</Text>
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
        ref={scrollRef}
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 280 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <Squeeze onPress={() => navigation.goBack()} scale={0.9} style={styles.backWrap}>
          <View style={[styles.back, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={20} color={colors.onPrimary} />
          </View>
        </Squeeze>

        <FadeUp delay={60} duration={500}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHead}>
              <Icon source={mapPinBold} size={18} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Shipping Address</Text>
            </View>

            <Input label="First Name" value={firstName} onChangeText={setFirstName} style={styles.field} />
            <Input label="Last Name" value={lastName} onChangeText={setLastName} style={styles.field} />
            <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" style={styles.field} />
            <Input label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="03xx xxxxxxx" style={styles.field} />
            <Input label="Address" value={address} onChangeText={setAddress} placeholder="House, street, area" style={styles.field} />
            <Input label="City" value={city} onChangeText={setCity} style={styles.field} />
            <Input label="Postal Code" value={postalCode} onChangeText={setPostalCode} keyboardType="numeric" style={styles.field} />
          </View>
        </FadeUp>

        <FadeUp delay={120} duration={500}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHead}>
              <Icon source={creditCardBold} size={18} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Select Payment Method</Text>
            </View>

            {/* Payment Method Choices */}
            <View style={styles.paymentOptions}>
              <Squeeze
                onPress={() => setPaymentMethod('card')}
                style={[
                  styles.paymentRow,
                  {
                    backgroundColor: colors.surfaceAlt,
                    borderColor: paymentMethod === 'card' ? colors.primary : 'transparent',
                  },
                ]}>
                <View style={styles.paymentRowInner}>
                  <Icon source={creditCardBold} size={18} color={paymentMethod === 'card' ? colors.primary : colors.text} />
                  <View style={styles.paymentTextWrap}>
                    <Text style={[styles.paymentLabel, { color: colors.text }]}>Credit / Debit Card</Text>
                    <Text style={[styles.paymentSub, { color: colors.textMuted }]}>
                      Instant & secure online payment via Iyzico
                    </Text>
                  </View>
                  {paymentMethod === 'card' && <Icon source={checkCircleIcon} size={18} color={colors.primary} />}
                </View>
              </Squeeze>

              <Squeeze
                onPress={() => setPaymentMethod('cod')}
                style={[
                  styles.paymentRow,
                  {
                    backgroundColor: colors.surfaceAlt,
                    borderColor: paymentMethod === 'cod' ? colors.primary : 'transparent',
                  },
                ]}>
                <View style={styles.paymentRowInner}>
                  <Icon source={packageBold} size={18} color={paymentMethod === 'cod' ? colors.primary : colors.text} />
                  <View style={styles.paymentTextWrap}>
                    <Text style={[styles.paymentLabel, { color: colors.text }]}>Cash on Delivery (COD)</Text>
                    <Text style={[styles.paymentSub, { color: colors.textMuted }]}>
                      Pay in cash when your order is delivered
                    </Text>
                  </View>
                  {paymentMethod === 'cod' && <Icon source={checkCircleIcon} size={18} color={colors.primary} />}
                </View>
              </Squeeze>
            </View>

            {paymentMethod === 'card' && (
              <FadeUp duration={350} style={styles.cardFields}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.cardSubTitle, { color: colors.textMuted }]}>Card Information</Text>
                  {cardBrand ? (
                    <View style={[styles.brandPill, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.brandText, { color: colors.primary }]}>{cardBrand}</Text>
                    </View>
                  ) : null}
                </View>

                <Input
                  label="Card Number"
                  value={cardNumber}
                  onChangeText={(val: string) => setCardNumber(formatCardNumber(val))}
                  keyboardType="numeric"
                  maxLength={19}
                  placeholder="1234 5678 9012 3456"
                  onFocus={scrollToCardFields}
                  style={styles.field}
                />

                <Input
                  label="Name on Card"
                  value={cardHolder}
                  onChangeText={setCardHolder}
                  maxLength={50}
                  placeholder="e.g. Customer User"
                  onFocus={scrollToCardFields}
                  style={styles.field}
                />

                <View style={styles.row}>
                  <Input
                    label="Expiry"
                    value={cardExpiry}
                    onChangeText={(val: string) => setCardExpiry(formatExpiry(val))}
                    keyboardType="numeric"
                    maxLength={5}
                    placeholder="MM/YY"
                    onFocus={scrollToCardFields}
                    style={[styles.field, styles.rowField]}
                  />
                  <Input
                    label="CVV"
                    value={cardCvv}
                    onChangeText={(val: string) => setCardCvv(formatCvv(val))}
                    keyboardType="numeric"
                    maxLength={4}
                    placeholder="123"
                    onFocus={scrollToCardFields}
                    style={[styles.field, styles.rowField]}
                  />
                </View>

                <Squeeze onPress={fillSandboxTestCard} style={[styles.testCardBtn, { borderColor: colors.primary + '40' }]}>
                  <Text style={[styles.testCardText, { color: colors.primary }]}>
                    ⚡ Autofill Sandbox Test Card (5528...0008)
                  </Text>
                </Squeeze>
              </FadeUp>
            )}
          </View>
        </FadeUp>

        <Button
          title={placing ? 'Placing Order...' : 'Place Order Securely'}
          icon={checkCircleIcon}
          iconPosition="left"
          disabled={!canPlaceOrder || placing}
          loading={placing}
          onPress={handlePlaceOrder}
          style={styles.placeOrder}
        />
      </ScrollView>

      <ConfirmModal
        visible={placed}
        title="Order Placed!"
        message="Your order has been placed successfully. We'll notify you once it starts shipping."
        cancelText="Keep Shopping"
        confirmText="View Orders"
        onCancel={() => {
          setPlaced(false);
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        }}
        onConfirm={() => {
          setPlaced(false);
          navigation.reset({
            index: 1,
            routes: [{ name: 'Home' }, { name: 'Orders' }],
          });
        }}
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

  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 16 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 17 },
  field: { marginBottom: 14 },
  row: { flexDirection: 'row', gap: 12 },
  rowField: { flex: 1 },

  paymentOptions: { gap: 10 },
  paymentRow: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  paymentRowInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  paymentTextWrap: { flex: 1 },
  paymentLabel: { fontFamily: fonts.bold, fontSize: 13 },
  paymentSub: { fontFamily: fonts.regular, fontSize: 11, marginTop: 2 },
  cardFields: { marginTop: 14 },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardSubTitle: {
    fontFamily: fonts.medium,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  brandPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  brandText: {
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  testCardBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 2,
  },
  testCardText: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },

  placeOrder: { marginTop: 20 },
});
