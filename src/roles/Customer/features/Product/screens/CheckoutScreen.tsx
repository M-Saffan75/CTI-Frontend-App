import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Squeeze from '@/components/Squeeze';
import KeyboardSafeView from '@/components/KeyboardSafeView';
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
import { createCustomerOrderApi, getAllCustomerOrdersPage } from '../../Orders/services/orderApi';
import { clearRefurbishedCartApi } from '@/features/Refurbished/services/refurbishedApi';
import { formatMoney } from '@/utils/money';

import AuthService from '@/services/authService';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { upper } from '@/i18n/locale';

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
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { ids: wishlistIds } = useWishlist();
  const { cartCount, refreshCart, standardCartId, refurbishedCartId } = useCart();

  // Like the web: a cart checkout orders one group (one seller, or the refurbished store);
  // Buy Now orders the chosen item directly and never touches the cart
  const group = route?.params?.group;
  const isBuyNow = !group;
  const cartItems: any[] = group ? group.items || [] : route?.params?.cartItems || [];
  const isRefurbishedOrder = group
    ? group.type === 'refurbished'
    : Boolean(route?.params?.isRefurbished || cartItems.some((i: any) => i.isRefurbished));
  const cartId = isRefurbishedOrder ? refurbishedCartId : standardCartId;
  const orderSubtotal = cartItems.reduce(
    (sum: number, i: any) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1),
    0,
  );
  const effectiveCartCount = cartCount > 0 ? cartCount : cartItems.length;

  const cachedUser = AuthService.getCachedUser();
  const userNames = (cachedUser?.name || '').trim().split(' ');
  const [firstName, setFirstName] = useState(userNames[0] || '');
  const [lastName, setLastName] = useState(userNames.slice(1).join(' ') || '');
  const [phone, setPhone] = useState(cachedUser?.phone || '');
  // The order is always sent with country code TR, so the country is fixed
  const country = 'Turkey';
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('card');
  const [cardHolder, setCardHolder] = useState(cachedUser?.name || '');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [placed, setPlaced] = useState(false);
  const [placing, setPlacing] = useState(false);
  const placingRef = useRef(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState('');
  // Set when the order request got no answer: nobody knows if the order exists, so paying is blocked
  // until the Orders list has been checked (this is what prevents a second charge)
  const [pendingCheck, setPendingCheck] = useState<{ startedAt: number } | null>(null);
  const [checking, setChecking] = useState(false);
  const checkingRef = useRef(false);
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
    !pendingCheck &&
    phone.trim() &&
    address.trim() &&
    city.trim() &&
    (paymentMethod === 'cod' ||
      (rawCardDigits.length === 16 && cardExpiry.length === 5 && cardCvv.length >= 3));

  // Card number, expiry and CVV live only in this screen's state: never logged, stored or cached.
  // They are cleared after every request, when the screen loses focus, when the app goes to the background,
  // and when the customer switches to cash on delivery.
  const clearCardFields = useCallback(() => {
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
  }, []);

  useFocusEffect(useCallback(() => clearCardFields, [clearCardFields]));

  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state !== 'active') clearCardFields();
    });
    return () => sub.remove();
  }, [clearCardFields]);

  // Looks in the Orders list for an order created since the unanswered request
  const verifyPendingOrder = useCallback(async () => {
    if (!pendingCheck || checkingRef.current) return;
    checkingRef.current = true;
    setChecking(true);
    try {
      const page = await getAllCustomerOrdersPage({ page: 1 });
      // two minutes of slack for the difference between the phone clock and the server clock
      const found = page.orders.some(
        o => o.createdAt && new Date(o.createdAt).getTime() >= pendingCheck.startedAt - 120000,
      );
      setPendingCheck(null);
      if (found) {
        refreshCart({ silent: true });
        setOrderSuccessMsg(i18n.t('customerMsg.orderPlacedMsg'));
        setPlaced(true);
      } else {
        setModal({
          visible: true,
          type: 'info',
          title: i18n.t('customer.noOrderFound'),
          message: i18n.t('customer.noNewOrderWasFound'),
        });
      }
    } catch (err: any) {
      setModal({
        visible: true,
        type: 'error',
        title: i18n.t('customer.couldNotCheckYourOrders'),
        message: (err?.message || i18n.t('customer.pleaseTryAgain')) + i18n.t('customerMsg.placeOrderNote'),
      });
    } finally {
      checkingRef.current = false;
      setChecking(false);
    }
  }, [pendingCheck, refreshCart]);

  // Coming back from the Orders screen checks again by itself (not right after the failed request)
  const verifyRef = useRef(verifyPendingOrder);
  verifyRef.current = verifyPendingOrder;
  const pendingRef = useRef(pendingCheck);
  pendingRef.current = pendingCheck;
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (pendingRef.current) verifyRef.current();
    });
    return unsubscribe;
  }, [navigation]);

  const handlePlaceOrder = async () => {
    if (placingRef.current || pendingCheck) return;
    if (phone.replace(/\D/g, '').length < 10) {
      setModal({
        visible: true,
        type: 'warning',
        title: i18n.t('customer.invalidPhoneNumber'),
        message: i18n.t('customer.pleaseEnterAPhoneNumber'),
      });
      return;
    }

    if (!firstName.trim() || !address.trim() || !phone.trim() || !city.trim()) {
      setModal({
        visible: true,
        type: 'warning',
        title: i18n.t('customer.missingDetails'),
        message: i18n.t('customer.pleaseFillInYourFull'),
      });
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      setModal({
        visible: true,
        type: 'warning',
        title: i18n.t('customer.nothingToOrder'),
        message: i18n.t('customer.thereAreNoItemsTo'),
      });
      return;
    }

    if (paymentMethod === 'card') {
      const cleanDigits = cardNumber.replace(/\D/g, '');
      if (cleanDigits.length !== 16) {
        setModal({
          visible: true,
          type: 'warning',
          title: i18n.t('customer.invalidCardNumber'),
          message: i18n.t('customer.cardNumberMustBeExactly'),
        });
        return;
      }

      if (!validateLuhn(cleanDigits)) {
        setModal({
          visible: true,
          type: 'warning',
          title: i18n.t('customer.invalidCardNumber'),
          message:
            i18n.t('customer.cardNumberFailedChecksumVerification'),
        });
        return;
      }

      const holder = cardHolder.trim() || `${firstName} ${lastName}`.trim();
      if (holder.length < 3) {
        setModal({
          visible: true,
          type: 'warning',
          title: i18n.t('customer.cardHolderRequired'),
          message: i18n.t('customer.pleaseEnterTheCardHolder'),
        });
        return;
      }

      if (cardExpiry.length !== 5 || !cardExpiry.includes('/')) {
        setModal({
          visible: true,
          type: 'warning',
          title: i18n.t('customer.invalidExpiryDate'),
          message: i18n.t('customer.pleaseEnterExpiryDateIn'),
        });
        return;
      }

      const expMonth = parseInt(cardExpiry.slice(0, 2), 10);
      const expYear = 2000 + parseInt(cardExpiry.slice(3, 5), 10);
      if (isNaN(expMonth) || expMonth < 1 || expMonth > 12) {
        setModal({
          visible: true,
          type: 'warning',
          title: i18n.t('customer.invalidExpiryMonth'),
          message: i18n.t('customer.expiryMonthMustBeBetween'),
        });
        return;
      }

      const now = new Date();
      if (expYear < now.getFullYear() || (expYear === now.getFullYear() && expMonth < (now.getMonth() + 1))) {
        setModal({
          visible: true,
          type: 'warning',
          title: i18n.t('customer.cardExpired'),
          message: i18n.t('customer.thisCardHasAlreadyExpired'),
        });
        return;
      }

      const cleanCvv = cardCvv.replace(/\D/g, '');
      if (cleanCvv.length < 3 || cleanCvv.length > 4) {
        setModal({
          visible: true,
          type: 'warning',
          title: i18n.t('customer.invalidCvv'),
          message: i18n.t('customer.cvvMustBe3Or'),
        });
        return;
      }
    }

    placingRef.current = true;
    const startedAt = Date.now();
    try {
      setPlacing(true);
      const [expireMonth, expireYearShort] = cardExpiry.split('/');
      const expireYear = expireYearShort ? `20${expireYearShort}` : undefined;

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

      // Same request as the web: a cart checkout sends the cart id (and the seller for marketplace items);
      // Buy Now sends the item itself. The backend removes what it ordered from the cart.
      const cartFlow = !isBuyNow && Boolean(cartId);
      const orderRes = await createCustomerOrderApi({
        shippingAddress: {
          fullName: `${firstName} ${lastName}`.trim(),
          phone: phone.trim(),
          country,
          countryCode: 'TR',
          city: city.trim(),
          area: city.trim(),
          addressLine: address.trim(),
          postalCode: postalCode.trim() || undefined,
        },
        paymentMethod: paymentMethod === 'card' ? 'card' : 'cod',
        cardHolder: cardHolder.trim() || `${firstName} ${lastName}`.trim(),
        cardNumber: cardNumber.replace(/\s/g, ''),
        expireMonth: expireMonth?.trim(),
        expireYear: expireYear?.trim(),
        cvc: cardCvv.trim(),
        ...(cartFlow
          ? { cartId, ...(!isRefurbishedOrder && group?.sellerId ? { sellerId: group.sellerId } : {}) }
          : { items: orderItemsPayload }),
        isRefurbished: isRefurbishedOrder,
      });

      // Like the web, the refurbished cart is emptied after its order; marketplace carts keep the other sellers' items
      if (isRefurbishedOrder && !isBuyNow) {
        await clearRefurbishedCartApi().catch(() => {});
      }
      refreshCart({ silent: true });

      if (orderRes?.message) {
        setOrderSuccessMsg(orderRes.message);
      }
      setPlaced(true);
    } catch (err: any) {
      // No answer at all (no connection, timeout, server failure): the order may exist and the card may have been charged
      const noAnswer = err?.isNetworkError || err?.isTimeout || (err?.status && err.status >= 500);
      if (noAnswer) {
        setPendingCheck({ startedAt });
        setModal({
          visible: true,
          type: 'warning',
          title: i18n.t('customer.orderStatusUnknown'),
          message: i18n.t('customer.orderStatusUnknownPleaseCheck'),
        });
      } else {
        setModal({
          visible: true,
          type: 'error',
          title: i18n.t('customer.orderFailed'),
          message: err?.message || i18n.t('customer.couldNotPlaceYourOrder'),
        });
      }
    } finally {
      clearCardFields();
      placingRef.current = false;
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

      <KeyboardSafeView>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
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
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('customer.shippingAddress')}</Text>
            </View>

            <Input label={t('customer.firstName')} value={firstName} onChangeText={setFirstName} style={styles.field} />
            <Input label={t('customer.lastName')} value={lastName} onChangeText={setLastName} style={styles.field} />
            <Input label={t('customer.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder={t('customer.phoneNumber')} maxLength={20} style={styles.field} />
            <Input label={t('profile.country')} value={country} onChangeText={() => {}} editable={false} style={styles.field} />
            <Input label={t('customer.address')} value={address} onChangeText={setAddress} placeholder={t('customer.houseStreetArea')} style={styles.field} />
            <Input label={t('profile.city')} value={city} onChangeText={setCity} style={styles.field} />
            <Input label={t('customer.postalCode')} value={postalCode} onChangeText={setPostalCode} keyboardType="numeric" style={styles.field} />
          </View>
        </FadeUp>

        <FadeUp delay={120} duration={500}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHead}>
              <Icon source={creditCardBold} size={18} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('customer.selectPaymentMethod')}</Text>
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
                    <Text style={[styles.paymentLabel, { color: colors.text }]}>{t('customer.creditDebitCard')}</Text>
                    <Text style={[styles.paymentSub, { color: colors.textMuted }]}>
                      {t('customer.instantAndSecureOnlinePayment')}
                    </Text>
                  </View>
                  {paymentMethod === 'card' && <Icon source={checkCircleIcon} size={18} color={colors.primary} />}
                </View>
              </Squeeze>

              <Squeeze
                onPress={() => {
                  clearCardFields();
                  setPaymentMethod('cod');
                }}
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
                    <Text style={[styles.paymentLabel, { color: colors.text }]}>{t('customer.cashOnDeliveryCod')}</Text>
                    <Text style={[styles.paymentSub, { color: colors.textMuted }]}>
                      {t('customer.payInCashWhenYour')}
                    </Text>
                  </View>
                  {paymentMethod === 'cod' && <Icon source={checkCircleIcon} size={18} color={colors.primary} />}
                </View>
              </Squeeze>
            </View>

            {paymentMethod === 'card' && (
              <FadeUp duration={350} style={styles.cardFields}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.cardSubTitle, { color: colors.textMuted }]}>{upper(t('customer.cardInformation'))}</Text>
                  {cardBrand ? (
                    <View style={[styles.brandPill, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.brandText, { color: colors.primary }]}>{cardBrand}</Text>
                    </View>
                  ) : null}
                </View>

                <Input
                  label={t('customer.cardNumber')}
                  value={cardNumber}
                  onChangeText={(val: string) => setCardNumber(formatCardNumber(val))}
                  keyboardType="numeric"
                  maxLength={19}
                  autoComplete="off"
                  importantForAutofill="no"
                  autoCorrect={false}
                  placeholder="1234 5678 9012 3456"
                  onFocus={scrollToCardFields}
                  style={styles.field}
                />

                <Input
                  label={t('customer.nameOnCard')}
                  value={cardHolder}
                  onChangeText={setCardHolder}
                  maxLength={50}
                  placeholder={t('customer.nameOnYourCard')}
                  onFocus={scrollToCardFields}
                  style={styles.field}
                />

                <View style={styles.row}>
                  <Input
                    label={t('customer.expiry')}
                    value={cardExpiry}
                    onChangeText={(val: string) => setCardExpiry(formatExpiry(val))}
                    keyboardType="numeric"
                    maxLength={5}
                    autoComplete="off"
                    importantForAutofill="no"
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
                    secureTextEntry
                    autoComplete="off"
                    importantForAutofill="no"
                    autoCorrect={false}
                    placeholder="123"
                    onFocus={scrollToCardFields}
                    style={[styles.field, styles.rowField]}
                  />
                </View>
              </FadeUp>
            )}
          </View>
        </FadeUp>

        <FadeUp delay={160} duration={500}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHead}>
              <Icon source={packageBold} size={18} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('customer.orderSummary')}</Text>
            </View>
            {group?.sellerName ? (
              <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginBottom: 8 }}>
                {group.sellerName}
              </Text>
            ) : null}
            {cartItems.map((item: any, index: number) => (
              <View key={item.id || index} style={styles.summaryLine}>
                <Text style={[styles.summaryName, { color: colors.text }]} numberOfLines={2}>
                  {item.title}
                  {item.variantLabel ? ' (' + item.variantLabel + ')' : ''}
                </Text>
                <Text style={[styles.summaryAmount, { color: colors.textMuted }]}>
                  {item.quantity} x {formatMoney(item.price)}
                </Text>
              </View>
            ))}
            <View style={[styles.summaryLine, styles.summaryTotal, { borderTopColor: colors.border }]}>
              <Text style={[styles.summaryName, { color: colors.textMuted }]}>{t('customerMsg.shippingCost')}</Text>
              <Text style={[styles.summaryAmount, { color: colors.textMuted }]}>{t('customer.arrangedByTheSeller')}</Text>
            </View>
            <View style={styles.summaryLine}>
              <Text style={[styles.summaryName, { color: colors.text, fontFamily: fonts.bold }]}>{t('customer.total')}</Text>
              <Text style={[styles.summaryAmount, { color: colors.primary, fontFamily: fonts.bold, fontSize: 16 }]}>
                {formatMoney(orderSubtotal)}
              </Text>
            </View>
            {!isBuyNow && cartCount > cartItems.length ? (
              <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 8 }}>
                {t('customer.theOtherItemsInYour')}
              </Text>
            ) : null}
          </View>
        </FadeUp>

        {pendingCheck ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.error }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('customer.orderStatusUnknown')}</Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginVertical: 8 }}>
              {t('customer.weDidNotGetAn')}
            </Text>
            <Button title={t('customer.checkMyOrders')} loading={checking} onPress={verifyPendingOrder} style={styles.placeOrder} />
            <Button
              title={t('customer.openMyOrders')}
              variant="outline"
              onPress={() => navigation.navigate('Orders')}
              style={styles.placeOrder}
            />
          </View>
        ) : null}

        <Button
          title={placing ? t('customer.placingOrder') : t('customer.placeOrderSecurely')}
          icon={checkCircleIcon}
          iconPosition="left"
          disabled={!canPlaceOrder || placing}
          loading={placing}
          onPress={handlePlaceOrder}
          style={styles.placeOrder}
        />
      </ScrollView>
      </KeyboardSafeView>

      <ConfirmModal
        visible={placed}
        title={t('customer.orderPlaced')}
        message={
          orderSuccessMsg ||
          t('customer.yourOrderHasBeenPlaced')
        }
        cancelText={t('customer.keepShopping')}
        confirmText={t('customer.viewOrders')}
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
  cardTitle: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 17 },
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
  placeOrder: { marginTop: 20 },
  summaryLine: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 4 },
  summaryTotal: { borderTopWidth: 1, marginTop: 6, paddingTop: 8 },
  summaryName: { flex: 1, fontFamily: fonts.regular, fontSize: 13 },
  summaryAmount: { flexShrink: 1, fontFamily: fonts.medium, fontSize: 13 },
});
