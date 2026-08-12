import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import { arrowLeftBold, heartExtra, heartFilled, menuBold, shoppingCartExtra } from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useWishlist } from '../../../context/WishlistContext';
import { PRODUCTS } from '../data/products';

function WishlistCard({ product, navigation, onRemove }) {
  const { colors } = useTheme();

  return (
    <Squeeze
      onPress={() => navigation.navigate('ProductDetail', { productId: product.id })}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.photoWrap}>
        <Image source={product.image} style={styles.photo} />
        <Image source={ctiLogo} resizeMode="contain" style={styles.cardLogo} />

        <Squeeze
          onPress={onRemove}
          scale={0.85}
          style={[styles.saveWrap, { backgroundColor: colors.surface }]}>
          <Icon source={heartFilled} size={16} color={colors.error} />
        </Squeeze>
      </View>

      <View style={styles.cardBody}>
        <Text style={[styles.brand, { color: colors.textMuted }]} numberOfLines={1}>
          {product.brand}
        </Text>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
          {product.title}
        </Text>
        <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={2}>
          {product.description}
        </Text>
        <Text style={[styles.reviews, { color: colors.textMuted }]}>
          {product.reviewCount ? `${product.reviewCount} Reviews` : 'No Reviews'}
        </Text>

        <View style={styles.priceRow}>
          <View style={[styles.discountPill, { backgroundColor: colors.primary }]}>
            <Text style={styles.discountText}>-{product.discountPercent}%</Text>
          </View>
          <Text style={[styles.price, { color: colors.text }]}>${product.price.toFixed(2)}</Text>
          <Text style={[styles.originalPrice, { color: colors.textMuted }]}>
            ${product.originalPrice.toFixed(2)}
          </Text>
        </View>
      </View>
    </Squeeze>
  );
}

export default function WishlistScreen({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { ids, toggle } = useWishlist();

  const items = PRODUCTS.filter(product => ids.includes(product.id));

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Image source={ctiLogo} resizeMode="contain" style={styles.logo} />
        <View style={styles.headerIcons}>
          <View>
            <Icon source={heartExtra} size={22} color={colors.text} />
            {items.length > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.error }]}>
                <Text style={styles.badgeText}>{items.length}</Text>
              </View>
            )}
          </View>
          <Squeeze onPress={() => navigation.navigate('Cart')} scale={0.85}>
            <Icon source={shoppingCartExtra} size={22} color={colors.text} />
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

        <View style={styles.titleRow}>
          <Icon source={heartFilled} size={22} color={colors.error} />
          <Text style={[styles.title, { color: colors.text }]}>
            My Wishlist <Text style={{ color: colors.textMuted }}>({items.length} items)</Text>
          </Text>
        </View>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Items you love, saved for later
        </Text>

        {items.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>
            Nothing here yet — tap the heart on a product to save it.
          </Text>
        ) : (
          <View style={styles.grid}>
            {items.map((product, index) => (
              <FadeUp
                key={product.id}
                delay={60 + index * 40}
                duration={500}
                style={styles.gridItem}>
                <WishlistCard
                  product={product}
                  navigation={navigation}
                  onRemove={() => toggle(product.id)}
                />
              </FadeUp>
            ))}
          </View>
        )}

        <Button
          title="Continue Shopping"
          variant="soft"
          icon={arrowLeftBold}
          iconPosition="left"
          onPress={() => navigation.goBack()}
          style={styles.continueButton}
        />
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

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  title: { fontFamily: fonts.bold, fontSize: 24 },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },
  empty: { fontFamily: fonts.regular, fontSize: 14, marginTop: 40, textAlign: 'center' },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  gridItem: { width: '48%', marginBottom: 14 },

  card: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  photoWrap: { position: 'relative' },
  photo: { width: '100%', height: 130 },
  cardLogo: { position: 'absolute', top: 8, left: 8, width: 60, height: 26 },
  saveWrap: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardBody: { padding: 10, gap: 3 },
  brand: { fontFamily: fonts.regular, fontSize: 11 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 13, marginTop: 1 },
  description: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 15, marginTop: 2 },
  reviews: { fontFamily: fonts.regular, fontSize: 11, marginTop: 2 },

  priceRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 6 },
  discountPill: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  discountText: { fontFamily: fonts.bold, fontSize: 10, color: '#FFFFFF' },
  price: { fontFamily: fonts.bold, fontSize: 13 },
  originalPrice: { fontFamily: fonts.regular, fontSize: 11, textDecorationLine: 'line-through' },

  continueButton: { marginTop: 24 },
});
