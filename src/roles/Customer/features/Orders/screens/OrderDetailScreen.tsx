import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import { arrowLeftBold, commentDotsBold, mapPinBold, packageBold, sendBold } from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { badges, palette } from '@/theme/colors';
import { fonts } from '@/theme/fonts';
import { ORDER_DETAIL } from '../data/orderDetail';
import { PROGRESS_STEPS } from '../data/orders';
import ContactSellerModal from '../components/ContactSellerModal';

const money = n => `$${n.toFixed(2)}`;

export default function OrderDetailScreen({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [contactOpen, setContactOpen] = useState(false);

  const order = ORDER_DETAIL;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Image source={ctiLogo} resizeMode="contain" style={styles.logo} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}>
        <Squeeze onPress={() => navigation.goBack()} scale={0.9} style={styles.backWrap}>
          <View style={[styles.back, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={20} color={colors.onPrimary} />
          </View>
        </Squeeze>

        <Text style={[styles.title, { color: colors.text }]}>Orders detail</Text>
        <Text style={[styles.orderId, { color: colors.textMuted }]}>{order.orderId}</Text>

        <View style={styles.tags}>
          {order.tags.map(tag => (
            <View key={tag} style={[styles.pill, { backgroundColor: badges.accepted.bg }]}>
              <Text style={[styles.pillText, { color: badges.accepted.text }]}>{tag}</Text>
            </View>
          ))}
        </View>

        <ProgressBar step={order.progressStep} />

        <FadeUp delay={100} duration={500}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHead}>
              <Icon source={packageBold} size={16} color={colors.text} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Order Items ({order.items.length})
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {order.items.map(item => (
              <View key={item.id} style={styles.item}>
                <Image source={{ uri: item.image }} style={styles.itemImage} />
                <View style={styles.itemText}>
                  <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.itemVariant, { color: colors.textMuted }]}>
                    {item.variant}
                  </Text>
                  <Text style={[styles.itemQty, { color: colors.textMuted }]}>
                    QTY.{item.qty}  {money(item.price)} each
                  </Text>
                </View>
                <View style={styles.itemEnd}>
                  <Text style={[styles.itemPrice, { color: colors.text }]}>
                    {money(item.price)}
                  </Text>
                  <View style={[styles.pill, { backgroundColor: badges.accepted.bg, marginTop: 6 }]}>
                    <Text style={[styles.pillText, { color: badges.accepted.text }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </FadeUp>

        <FadeUp delay={160} duration={500}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHead}>
              <Icon source={mapPinBold} size={16} color={colors.text} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Shipping Address</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Text style={[styles.customerName, { color: colors.text }]}>
              {order.customer.name}
            </Text>
            <Text style={[styles.text, { color: colors.textMuted }]}>{order.customer.phone}</Text>
            <Text style={[styles.text, { color: colors.textMuted }]}>{order.customer.city}</Text>
            <Text style={[styles.text, { color: colors.textMuted }]}>
              {order.customer.address}
            </Text>
          </View>
        </FadeUp>

        <FadeUp delay={220} duration={500}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Order Info</Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Row label="Order ID" value={order.orderId} />
            <Row label="Order No." value={order.orderNo} />
            <Row label="Date" value={order.date} />
            <Row label="Payment" value={order.payment} />
          </View>
        </FadeUp>

        <FadeUp delay={280} duration={500}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Price Summary</Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <Row label="Subtal" value={money(order.subtotal)} />
            <Row label="Shipping" value={money(order.shipping)} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Row label="Total" value={money(order.total)} bold />
          </View>

          <Button
            title="Contact Seller"
            variant="outline"
            icon={sendBold}
            iconPosition="left"
            onPress={() => setContactOpen(true)}
            style={styles.button}
          />
          <Button
            title="My Messages"
            variant="outline"
            icon={commentDotsBold}
            iconPosition="left"
            style={styles.button}
          />

          <View style={[styles.warranty, { backgroundColor: palette.mintBg }]}>
            <Text style={[styles.warrantyTitle, { color: colors.success }]}>
              Warranty Information
            </Text>
            <Text style={[styles.warrantyText, { color: colors.success }]}>
              Return #{order.warranty.returnId} - {order.warranty.date}
            </Text>
          </View>
        </FadeUp>
      </ScrollView>

      <ContactSellerModal
        visible={contactOpen}
        orderId={order.orderId}
        onClose={() => setContactOpen(false)}
      />
    </View>
  );
}

function ProgressBar({ step }) {
  const { colors } = useTheme();

  return (
    <View style={styles.progress}>
      <View style={styles.progressBars}>
        {PROGRESS_STEPS.map((label, index) => (
          <View
            key={label}
            style={[
              styles.progressBar,
              { backgroundColor: index <= step ? colors.primary : colors.border },
            ]}
          />
        ))}
      </View>
      <View style={styles.progressLabels}>
        {PROGRESS_STEPS.map((label, index) => (
          <Text
            key={label}
            style={[
              styles.progressLabel,
              { color: index <= step ? colors.primary : colors.textMuted },
              index <= step && { fontFamily: fonts.bold },
            ]}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

function Row({ label, value, bold = false }) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <Text
        style={[
          styles.rowLabel,
          { color: bold ? colors.text : colors.textMuted, fontFamily: bold ? fonts.bold : fonts.regular },
        ]}>
        {label}
      </Text>
      <Text style={[styles.rowValue, { color: colors.text, fontFamily: bold ? fonts.bold : fonts.regular }]}>
        {value}
      </Text>
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

  body: { paddingHorizontal: 20 },
  backWrap: { alignSelf: 'flex-start' },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  title: { fontFamily: fonts.bold, fontSize: 24, marginTop: 16 },
  orderId: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },

  tags: { flexDirection: 'row', gap: 8, marginTop: 12 },
  pill: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  pillText: { fontFamily: fonts.bold, fontSize: 11 },

  progress: { marginTop: 20 },
  progressBars: { flexDirection: 'row', gap: 4 },
  progressBar: { flex: 1, height: 4, borderRadius: 2 },
  progressLabels: { flexDirection: 'row', marginTop: 8 },
  progressLabel: { flex: 1, fontFamily: fonts.regular, fontSize: 10, textAlign: 'center' },

  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 16 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 15 },
  divider: { height: 1, marginVertical: 12 },

  item: { flexDirection: 'row', gap: 10 },
  itemImage: { width: 48, height: 48, borderRadius: 8 },
  itemText: { flex: 1, gap: 2 },
  itemName: { fontFamily: fonts.bold, fontSize: 14 },
  itemVariant: { fontFamily: fonts.regular, fontSize: 12 },
  itemQty: { fontFamily: fonts.regular, fontSize: 12 },
  itemEnd: { alignItems: 'flex-end' },
  itemPrice: { fontFamily: fonts.bold, fontSize: 14 },

  customerName: { fontFamily: fonts.bold, fontSize: 15 },
  text: { fontFamily: fonts.regular, fontSize: 13, marginTop: 6 },

  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  rowLabel: { fontSize: 13 },
  rowValue: { fontSize: 13 },

  button: { marginTop: 12 },

  warranty: { borderRadius: 12, padding: 16, marginTop: 16, gap: 4 },
  warrantyTitle: { fontFamily: fonts.bold, fontSize: 15 },
  warrantyText: { fontFamily: fonts.regular, fontSize: 12 },
});
