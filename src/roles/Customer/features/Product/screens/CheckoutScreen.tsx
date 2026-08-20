import { useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Squeeze from '@/components/Squeeze';
import ConfirmModal from '@/components/ConfirmModal';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  checkCircleIcon,
  creditCardBold,
  heartExtra,
  mapPinBold,
  menuBold,
  shoppingCartExtra,
} from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useWishlist } from '../../../context/WishlistContext';

export default function CheckoutScreen({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { ids: wishlistIds } = useWishlist();

  const [firstName, setFirstName] = useState('Customer');
  const [lastName, setLastName] = useState('Doe');
  const [email, setEmail] = useState('customer@gmail.com');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Karachi');
  const [postalCode, setPostalCode] = useState('75000');

  const [cardSelected, setCardSelected] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [placed, setPlaced] = useState(false);
  const scrollRef = useRef(null);

  const canPlaceOrder = cardSelected && cardNumber && cardExpiry && cardCvv;
  // Card fields sit right above the keyboard once it opens — scroll them
  // into view instead of letting the keyboard cover them.
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
            <Icon source={shoppingCartExtra} size={22} color={colors.text} />
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

            <Squeeze
              onPress={() => setCardSelected(!cardSelected)}
              style={[
                styles.paymentRow,
                {
                  backgroundColor: colors.surfaceAlt,
                  borderColor: cardSelected ? colors.primary : 'transparent',
                },
              ]}>
              <View style={styles.paymentRowInner}>
                <Icon source={creditCardBold} size={16} color={colors.text} />
                <Text style={[styles.paymentLabel, { color: colors.text }]} numberOfLines={1}>
                  Credit / Debit Card
                </Text>
                {cardSelected && <Icon source={checkCircleIcon} size={16} color={colors.primary} />}
              </View>
            </Squeeze>

            {cardSelected && (
              <FadeUp duration={350} style={styles.cardFields}>
                <Input
                  label="Card Number"
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  keyboardType="numeric"
                  placeholder="1234 5678 9012 3456"
                  onFocus={scrollToCardFields}
                  style={styles.field}
                />
                <View style={styles.row}>
                  <Input
                    label="Expiry"
                    value={cardExpiry}
                    onChangeText={setCardExpiry}
                    placeholder="MM/YY"
                    onFocus={scrollToCardFields}
                    style={[styles.field, styles.rowField]}
                  />
                  <Input
                    label="CVV"
                    value={cardCvv}
                    onChangeText={setCardCvv}
                    keyboardType="numeric"
                    placeholder="123"
                    onFocus={scrollToCardFields}
                    style={[styles.field, styles.rowField]}
                  />
                </View>
              </FadeUp>
            )}
          </View>
        </FadeUp>

        <Button
          title="Place Order Securely"
          icon={checkCircleIcon}
          iconPosition="left"
          disabled={!canPlaceOrder}
          onPress={() => setPlaced(true)}
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
          navigation.navigate('Home');
        }}
        onConfirm={() => {
          setPlaced(false);
          navigation.navigate('Orders');
        }}
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

  paymentRow: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  paymentRowInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  paymentLabel: { flex: 1, fontFamily: fonts.bold, fontSize: 13 },
  cardFields: { marginTop: 14 },

  placeOrder: { marginTop: 20 },
});
