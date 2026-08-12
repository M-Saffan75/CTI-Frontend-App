import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import ConfirmModal from '@/components/ConfirmModal';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  chevronDownBold,
  mapPinBold,
  packageBold,
  searchBold,
  tagBold,
  uploadBold,
} from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { badges } from '@/theme/colors';
import { fonts } from '@/theme/fonts';
import { ORDERS, RETURNS, SHIPPING_ADDRESS } from '../data/orders';

const money = n => `$${n.toFixed(2)}`;

function StatusPill({ label, badge }) {
  return (
    <View style={[styles.pill, { backgroundColor: badge.bg }]}>
      <Text style={[styles.pillText, { color: badge.text }]}>{label}</Text>
    </View>
  );
}

function OrderCard({ order, index, onViewAll }) {
  const { colors } = useTheme();
  // The design shows the first card open and the rest collapsed.
  const [open, setOpen] = useState(index === 0);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHead}>
        <Text style={[styles.orderId, { color: colors.text }]}>{order.orderId}</Text>
        <Squeeze onPress={() => setOpen(!open)} scale={0.85}>
          <View style={[styles.chevronBtn, { backgroundColor: colors.surfaceAlt }]}>
            <Icon
              source={chevronDownBold}
              size={16}
              color={colors.text}
              style={open && styles.chevronFlipped}
            />
          </View>
        </Squeeze>
      </View>

      <Text style={[styles.orderNo, { color: colors.textMuted }]}>{order.orderNo}</Text>

      <View style={styles.tags}>
        <StatusPill label={order.statusTag} badge={badges.inProgress} />
        <StatusPill label={order.paymentTag} badge={badges.accepted} />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.row}>
        <View style={styles.rowCol}>
          <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Date</Text>
          <Text style={[styles.rowValue, { color: colors.text }]}>{order.date}</Text>
          <Text style={[styles.rowSub, { color: colors.textMuted }]}>{order.time}</Text>
        </View>
        <View style={[styles.rowCol, styles.rowColEnd]}>
          <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Item</Text>
          <Text style={[styles.rowValue, { color: colors.text }]}>{order.itemCount} item</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.rowCol}>
          <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Total</Text>
          <Text style={[styles.rowValue, { color: colors.text }]}>{order.date}</Text>
          <Text style={[styles.rowSub, { color: colors.textMuted }]}>{order.time}</Text>
        </View>
        <View style={[styles.rowCol, styles.rowColEnd]}>
          <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Payment</Text>
          <Text style={[styles.rowValue, { color: colors.text }]}>{order.paymentStatus}</Text>
        </View>
      </View>

      {open && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Items</Text>
          {order.items.map(item => (
            <View key={item.id} style={styles.item}>
              <Image source={{ uri: item.image }} style={styles.itemImage} />
              <View style={styles.itemText}>
                <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.itemVariant, { color: colors.textMuted }]}>
                  {item.variant}
                </Text>
                <Text style={[styles.itemQty, { color: colors.textMuted }]}>
                  QTY. {money(item.price)} each
                </Text>
              </View>
              <View style={styles.itemPriceCol}>
                <Text style={[styles.itemPrice, { color: colors.text }]}>{money(item.price)}</Text>
                <Text style={[styles.rowSub, { color: colors.textMuted }]}>Subtotal</Text>
              </View>
            </View>
          ))}
        </>
      )}

      <Pressable onPress={onViewAll} hitSlop={6}>
        <Text style={[styles.viewAll, { color: colors.primary }]}>View all  →</Text>
      </Pressable>
    </View>
  );
}

function ReturnCard({ item, onViewAll }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHead}>
        <Text style={[styles.orderId, { color: colors.text }]}>{item.returnId}</Text>
        <StatusPill label={item.status} badge={badges.inProgress} />
      </View>

      <Text style={[styles.itemName, { color: colors.text, marginTop: 6 }]}>{item.device}</Text>

      <Text style={[styles.returnNote, { color: colors.textMuted }]}>
        Order: {item.orderNo} Amount: ${item.amount.toFixed(2)}
        {'\n'}
        {item.date} {item.note}
      </Text>

      <Pressable onPress={onViewAll} hitSlop={6}>
        <Text style={[styles.viewAll, { color: colors.primary }]}>View all  →</Text>
      </Pressable>
    </View>
  );
}

export default function OrdersScreen({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('orders');
  const [search, setSearch] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);

  const goToDetail = () => navigation.navigate('OrderDetail');

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Image source={ctiLogo} resizeMode="contain" style={styles.logo} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <Squeeze onPress={() => navigation.goBack()} scale={0.9} style={styles.backWrap}>
          <View style={[styles.back, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={20} color={colors.onPrimary} />
          </View>
        </Squeeze>

        <Text style={[styles.title, { color: colors.text }]}>My Orders</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Track and manage all your purchases
        </Text>

        <View style={styles.segment}>
          <Squeeze onPress={() => setTab('orders')} style={styles.segmentItemWrap}>
            <View
              style={[
                styles.segmentItem,
                {
                  backgroundColor: tab === 'orders' ? colors.surface : colors.surfaceAlt,
                  borderColor: tab === 'orders' ? colors.border : 'transparent',
                },
              ]}>
              <Icon source={packageBold} size={16} color={colors.text} />
              <Text style={[styles.segmentText, { color: colors.text }]}>My Orders</Text>
            </View>
          </Squeeze>

          <Squeeze onPress={() => setTab('returns')} style={styles.segmentItemWrap}>
            <View
              style={[
                styles.segmentItem,
                {
                  backgroundColor: tab === 'returns' ? colors.surface : colors.surfaceAlt,
                  borderColor: tab === 'returns' ? colors.border : 'transparent',
                },
              ]}>
              <Icon source={uploadBold} size={16} color={colors.text} />
              <Text style={[styles.segmentText, { color: colors.text }]}>My Returns</Text>
            </View>
          </Squeeze>
        </View>

        <View style={[styles.search, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}>
          <Icon source={searchBold} size={18} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search  order custom product"
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        {tab === 'orders' && (
          <View style={styles.filters}>
            {['All', 'All'].map((label, index) => (
              <View
                key={index}
                style={[styles.filter, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}>
                <View style={[styles.filterIcon, { backgroundColor: colors.primary }]}>
                  <Icon source={tagBold} size={11} color={colors.onPrimary} />
                </View>
                <Text style={[styles.filterText, { color: colors.text }]}>{label}</Text>
                <Icon source={chevronDownBold} size={13} color={colors.textMuted} />
              </View>
            ))}
          </View>
        )}

        {tab === 'orders'
          ? ORDERS.map((order, index) => (
              <FadeUp key={order.id} delay={80 + index * 60} duration={500} style={styles.cardWrap}>
                <OrderCard order={order} index={index} onViewAll={goToDetail} />
              </FadeUp>
            ))
          : RETURNS.map((item, index) => (
              <FadeUp key={item.id} delay={80 + index * 60} duration={500} style={styles.cardWrap}>
                <ReturnCard item={item} onViewAll={goToDetail} />
              </FadeUp>
            ))}

        {tab === 'orders' && (
          <FadeUp delay={80 + ORDERS.length * 60} duration={500} style={styles.cardWrap}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.summaryHead}>
                <Icon source={mapPinBold} size={16} color={colors.text} />
                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 0 }]}>
                  shipping Address
                </Text>
              </View>
              <Text style={[styles.text, { color: colors.textMuted }]}>{SHIPPING_ADDRESS}</Text>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.summaryHead}>
                <Icon source={tagBold} size={16} color={colors.text} />
                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 0 }]}>
                  Price Summary
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.text, { color: colors.textMuted, marginTop: 0 }]}>
                  Subtatal
                </Text>
                <Text style={[styles.text, { color: colors.text, marginTop: 0 }]}>
                  {money(ORDERS[0].total)}
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.row}>
                <Text style={[styles.rowValue, { color: colors.text }]}>Total</Text>
                <Text style={[styles.rowValue, { color: colors.text }]}>
                  {money(ORDERS[0].total)}
                </Text>
              </View>

              <View style={styles.summaryActions}>
                <Button
                  title="Cancel Order"
                  size="sm"
                  onPress={() => setConfirmCancel(true)}
                  style={styles.summaryAction}
                />
                <Button
                  title="Returns order"
                  variant="soft"
                  color={colors.error}
                  size="sm"
                  onPress={() => setTab('returns')}
                  style={styles.summaryAction}
                />
              </View>
            </View>
          </FadeUp>
        )}
      </ScrollView>

      <ConfirmModal
        visible={confirmCancel}
        title="Cancel Order"
        message="Are you sure you want to cancel this order?"
        cancelText="Not now"
        confirmText="Cancel Order"
        danger
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => setConfirmCancel(false)}
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

  body: { paddingHorizontal: 20 },
  backWrap: { alignSelf: 'flex-start' },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 26, marginTop: 6 },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },

  segment: { flexDirection: 'row', gap: 10, marginTop: 16 },
  segmentItemWrap: { flex: 1 },
  segmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
  },
  segmentText: { fontFamily: fonts.medium, fontSize: 13 },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginTop: 14,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 13, padding: 0 },

  filters: { flexDirection: 'row', gap: 10, marginTop: 12 },
  filter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  filterIcon: { width: 20, height: 20, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  filterText: { flex: 1, fontFamily: fonts.regular, fontSize: 13 },

  cardWrap: { marginTop: 14 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontFamily: fonts.bold, fontSize: 15, flex: 1 },
  orderNo: { fontFamily: fonts.regular, fontSize: 12, marginTop: 4 },
  chevronBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  chevronFlipped: { transform: [{ rotate: '180deg' }] },

  tags: { flexDirection: 'row', gap: 8, marginTop: 10 },
  pill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  pillText: { fontFamily: fonts.bold, fontSize: 11 },

  divider: { height: 1, marginVertical: 12 },

  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  rowCol: { gap: 3 },
  rowColEnd: { alignItems: 'flex-end' },
  rowLabel: { fontFamily: fonts.regular, fontSize: 11 },
  rowValue: { fontFamily: fonts.bold, fontSize: 13 },
  rowSub: { fontFamily: fonts.regular, fontSize: 11 },

  sectionTitle: { fontFamily: fonts.bold, fontSize: 14, marginTop: 16 },
  summaryHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  text: { fontFamily: fonts.regular, fontSize: 13, marginTop: 8 },

  item: { flexDirection: 'row', gap: 10, marginTop: 12 },
  itemImage: { width: 44, height: 44, borderRadius: 8 },
  itemText: { flex: 1, gap: 2 },
  itemName: { fontFamily: fonts.bold, fontSize: 13 },
  itemVariant: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 15 },
  itemQty: { fontFamily: fonts.regular, fontSize: 11 },
  itemPriceCol: { alignItems: 'flex-end', gap: 2 },
  itemPrice: { fontFamily: fonts.bold, fontSize: 13 },

  viewAll: { fontFamily: fonts.bold, fontSize: 13, marginTop: 16 },

  returnNote: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, marginTop: 8 },

  summaryActions: { flexDirection: 'row', gap: 12, marginTop: 18 },
  summaryAction: { flex: 1 },
});
