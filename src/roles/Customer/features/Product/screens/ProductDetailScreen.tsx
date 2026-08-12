import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  cameraBold,
  checkCircleBold,
  checkCircleFilled,
  commentDotsBold,
  discountBold,
  filterBold,
  heartExtra,
  heartFilled,
  menuBold,
  minusSquareBold,
  packageBold,
  plusSquareBold,
  returnOfInvestmentIcon,
  shieldIcon,
  shoppingCartExtra,
  starExtra,
  storeBold,
  videoBold,
} from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useWishlist } from '../../../context/WishlistContext';
import { getProductById, PRODUCTS } from '../data/products';

function ImageCarousel({ images }) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);

  const onScrollEnd = event => {
    if (!width) return;
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <View onLayout={event => setWidth(event.nativeEvent.layout.width)}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}>
        {images.map((source, i) => (
          <Image key={i} source={source} style={{ width, height: 260 }} resizeMode="cover" />
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {images.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, { backgroundColor: i === index ? colors.primary : '#FFFFFF' }]}
          />
        ))}
      </View>
    </View>
  );
}

function SpecRow({ label, value, alt = false }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.specRow, alt && { backgroundColor: colors.surfaceAlt }]}>
      <Text style={[styles.specLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.specValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function VariantCard({ variant, selected, onPress }) {
  const { colors } = useTheme();

  return (
    <Squeeze
      onPress={onPress}
      style={[
        styles.variantCard,
        {
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.primary + '14' : colors.surface,
        },
      ]}>
      {selected && (
        <View style={[styles.variantCheck, { backgroundColor: colors.primary }]}>
          <Icon source={checkCircleFilled} size={14} color={colors.onPrimary} />
        </View>
      )}

      <View style={styles.variantHead}>
        <Image source={variant.image} style={styles.variantImage} />
        <View style={styles.variantHeadText}>
          <Text style={[styles.variantLabel, { color: colors.text }]}>{variant.label}</Text>
          {variant.verified && (
            <View style={[styles.verifiedPill, { backgroundColor: colors.success + '22' }]}>
              <Text style={[styles.verifiedText, { color: colors.success }]}>VERIFIED</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.variantFoot}>
        <Text style={[styles.variantPrice, { color: colors.primary }]}>${variant.price.toFixed(2)}</Text>
        <View style={[styles.stockPill, { backgroundColor: colors.success + '22' }]}>
          <Text style={[styles.stockText, { color: colors.success }]}>{variant.stockLeft} left</Text>
        </View>
      </View>
    </Squeeze>
  );
}

function RelatedCard({ product, navigation }) {
  const { colors } = useTheme();
  const { isSaved, toggle } = useWishlist();
  const saved = isSaved(product.id);

  return (
    <Squeeze
      onPress={() => navigation.push('ProductDetail', { productId: product.id })}
      style={[styles.relatedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View>
        <Image source={product.image} style={styles.relatedPhoto} />
        <Image source={ctiLogo} resizeMode="contain" style={styles.relatedLogo} />
        <Squeeze
          onPress={() => toggle(product.id)}
          scale={0.85}
          style={[styles.relatedHeart, { backgroundColor: colors.surface }]}>
          <Icon source={saved ? heartFilled : heartExtra} size={14} color={saved ? colors.error : colors.text} />
        </Squeeze>
      </View>
      <View style={styles.relatedBody}>
        <Text style={[styles.relatedBrand, { color: colors.textMuted }]} numberOfLines={1}>
          {product.brand}
        </Text>
        <Text style={[styles.relatedTitle, { color: colors.text }]} numberOfLines={1}>
          {product.title}
        </Text>
        <Text style={[styles.relatedPrice, { color: colors.text }]}>${product.price.toFixed(2)}</Text>
      </View>
    </Squeeze>
  );
}

export default function ProductDetailScreen({ navigation, route }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const product = getProductById(route.params?.productId) ?? PRODUCTS[0];
  const related = PRODUCTS.filter(item => item.id !== product.id);

  const { isSaved, toggle: toggleWishlist } = useWishlist();
  const saved = isSaved(product.id);
  const [color, setColor] = useState(product.colors[0]);
  const [quantity, setQuantity] = useState(1);
  const [variantId, setVariantId] = useState(product.variants[0]?.id);
  const [myRating, setMyRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewPhoto, setReviewPhoto] = useState(null);
  const [reviewVideo, setReviewVideo] = useState(null);

  const submitReview = () => {
    setMyRating(0);
    setReviewText('');
    setReviewPhoto(null);
    setReviewVideo(null);
  };

  const pickPhoto = () => {
    launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 }, response => {
      const asset = response.assets?.[0];
      if (asset) setReviewPhoto(asset.uri);
    });
  };

  const pickVideo = () => {
    launchImageLibrary({ mediaType: 'video', selectionLimit: 1 }, response => {
      const asset = response.assets?.[0];
      if (asset) setReviewVideo(asset.fileName ?? 'Video attached');
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Image source={ctiLogo} resizeMode="contain" style={styles.logo} />
        <View style={styles.headerIcons}>
          <Squeeze onPress={() => toggleWishlist(product.id)} scale={0.85}>
            <Icon source={saved ? heartFilled : heartExtra} size={22} color={saved ? colors.error : colors.text} />
          </Squeeze>
          <Squeeze onPress={() => navigation.navigate('ProductFilter')} scale={0.85}>
            <Icon source={filterBold} size={22} color={colors.text} />
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
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}>
        <Squeeze onPress={() => navigation.goBack()} scale={0.9} style={styles.backWrap}>
          <View style={[styles.back, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={20} color={colors.onPrimary} />
          </View>
        </Squeeze>

        <FadeUp delay={60} duration={450}>
          <View style={[styles.imageCard, { backgroundColor: colors.surfaceAlt }]}>
            <ImageCarousel images={product.images} />
          </View>
        </FadeUp>

        <FadeUp delay={110} duration={450}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]}>{product.title}</Text>
            <Text style={[styles.price, { color: colors.text }]}>${product.price.toFixed(2)}</Text>
          </View>
          <Text style={[styles.bestProduct, { color: colors.textMuted }]}>Best Product</Text>
        </FadeUp>

        <FadeUp delay={150} duration={450}>
          <Text style={[styles.label, { color: colors.text }]}>Color</Text>
          <View style={styles.colorsRow}>
            {product.colors.map(hex => (
              <Squeeze key={hex} onPress={() => setColor(hex)} scale={0.9}>
                <View
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: hex, borderColor: colors.border },
                    color === hex && { borderWidth: 3, borderColor: colors.primary },
                  ]}
                />
              </Squeeze>
            ))}
          </View>
        </FadeUp>

        <FadeUp delay={190} duration={450}>
          <View style={[styles.quantityRow, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={[styles.label, { color: colors.text, marginTop: 0 }]}>Quantity</Text>
            <View style={styles.quantityControls}>
              <Squeeze onPress={() => setQuantity(Math.max(1, quantity - 1))} style={[styles.qtyBtn, { borderColor: colors.border }]}>
                <Icon source={minusSquareBold} size={18} color={colors.text} />
              </Squeeze>
              <Text style={[styles.qtyValue, { color: colors.text }]}>{quantity}</Text>
              <Squeeze onPress={() => setQuantity(quantity + 1)} style={[styles.qtyBtn, { borderColor: colors.border }]}>
                <Icon source={plusSquareBold} size={18} color={colors.text} />
              </Squeeze>
            </View>
          </View>

          <Button title="Buy Now" variant="outline" onPress={() => navigation.navigate('Checkout')} style={styles.spaced} />
          <Button title="Add to Cart" icon={shoppingCartExtra} onPress={() => navigation.navigate('Cart')} style={styles.spaced} />
        </FadeUp>

        <FadeUp delay={230} duration={450}>
          <View style={[styles.sellerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sellerHead}>
              <Image source={{ uri: product.seller.avatar }} style={styles.sellerAvatar} />
              <View style={styles.sellerInfo}>
                <Text style={[styles.sellerName, { color: colors.text }]}>{product.seller.name}</Text>
                <Text style={[styles.sellerLocation, { color: colors.textMuted }]} numberOfLines={1}>
                  {product.seller.location}
                </Text>
              </View>
              <Button title="Visit Store" size="sm" fullWidth={false} onPress={() => {}} />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Button
              title="Ask Seller"
              variant="outline"
              icon={commentDotsBold}
              iconPosition="left"
              onPress={() => {}}
            />
          </View>
        </FadeUp>

        <FadeUp delay={270} duration={450}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Product Information</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.description, { color: colors.textMuted }]}>{product.description}</Text>
        </FadeUp>

        <FadeUp delay={310} duration={450}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Specifications</Text>
          <View style={[styles.specsTable, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <SpecRow label="Brand" value={product.specs.brand} alt />
            <SpecRow label="SKU" value={product.specs.sku} />
            <SpecRow label="Category" value={product.specs.category} alt />
            <SpecRow label="Total Variants" value={product.specs.totalVariants} />
            <SpecRow label="Total Stock" value={product.specs.totalStock} alt />
            <SpecRow label="Price Range" value={product.specs.priceRange} />
            <SpecRow label="Warranty" value={product.specs.warranty} alt />
          </View>
        </FadeUp>

        <FadeUp delay={350} duration={450}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Available Variant</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.bleed}
            contentContainerStyle={styles.variantsRow}>
            {product.variants.map(variant => (
              <VariantCard
                key={variant.id}
                variant={variant}
                selected={variant.id === variantId}
                onPress={() => setVariantId(variant.id)}
              />
            ))}
          </ScrollView>
        </FadeUp>

        <FadeUp delay={390} duration={450}>
          <View style={[styles.guaranteeCard, { backgroundColor: colors.primary + '14' }]}>
            <View style={[styles.guaranteeIcon, { backgroundColor: colors.surface }]}>
              <Icon source={shieldIcon} size={22} color={colors.primary} />
            </View>
            <Text style={[styles.guaranteeTitle, { color: colors.text }]}>
              Platform Guarantee &amp; Buyer Protection
            </Text>
            <Text style={[styles.guaranteeText, { color: colors.textMuted }]}>
              We stand behind every transaction on our platform. With our secure escrow system,
              your payment is protected and is only released to the seller once you receive the
              product exactly as described. Shop with confidence knowing our 24/7 support team is
              here to assist you with any disputes or issues.
            </Text>
          </View>
        </FadeUp>

        <FadeUp delay={430} duration={450}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Rating &amp; Reviews</Text>
          <View style={[styles.ratingsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.ratingsSummary}>
              <View>
                <Text style={[styles.ourRating, { color: colors.textMuted }]}>Our Rating</Text>
                <Text style={[styles.ratingNumber, { color: colors.text }]}>{product.rating.toFixed(1)}</Text>
                <Text style={[styles.reviewCount, { color: colors.textMuted }]}>
                  ({product.reviewCount} Reviews)
                </Text>
              </View>

              <View style={styles.ratingBars}>
                {product.reviewBreakdown.map(row => (
                  <View key={row.stars} style={styles.ratingBarRow}>
                    <Text style={[styles.ratingBarLabel, { color: colors.textMuted }]}>{row.stars}</Text>
                    <Icon source={starExtra} size={13} color={colors.primary} />
                    <View style={[styles.ratingBarTrack, { backgroundColor: colors.border }]}>
                      <View
                        style={[
                          styles.ratingBarFill,
                          { backgroundColor: colors.primary, width: `${row.percent}%` },
                        ]}
                      />
                    </View>
                    <Text style={[styles.ratingBarPercent, { color: colors.textMuted }]}>{row.percent}%</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </FadeUp>

        <FadeUp delay={470} duration={450}>
          <View style={[styles.reviewFormCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardHeading, { color: colors.text }]}>Write a Review</Text>
            <Text style={[styles.cardSubheading, { color: colors.textMuted }]}>
              Share your experience with other customers
            </Text>

            <Text style={[styles.label, { color: colors.text }]}>Your Rating</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map(n => (
                <Squeeze key={n} onPress={() => setMyRating(n)} scale={0.85}>
                  <Icon source={starExtra} size={24} color={n <= myRating ? colors.primary : colors.border} />
                </Squeeze>
              ))}
            </View>

            <TextInput
              value={reviewText}
              onChangeText={setReviewText}
              placeholder="Write your Review..."
              placeholderTextColor={colors.textMuted}
              multiline
              style={[styles.reviewInput, { color: colors.text, borderColor: colors.border }]}
            />

            <View style={styles.photoRow}>
              <Squeeze onPress={pickPhoto} style={[styles.photoBtn, { borderColor: colors.border }]}>
                <View style={styles.photoBtnInner}>
                  {reviewPhoto ? (
                    <Image source={{ uri: reviewPhoto }} style={styles.photoThumb} />
                  ) : (
                    <Icon source={cameraBold} size={16} color={colors.text} />
                  )}
                  <Text style={[styles.photoBtnText, { color: colors.text }]} numberOfLines={1}>
                    {reviewPhoto ? 'Photo added' : 'Add a photo'}
                  </Text>
                </View>
              </Squeeze>
              <Squeeze onPress={pickVideo} style={[styles.photoBtn, { borderColor: colors.border }]}>
                <View style={styles.photoBtnInner}>
                  <Icon source={reviewVideo ? checkCircleBold : videoBold} size={16} color={reviewVideo ? colors.success : colors.text} />
                  <Text style={[styles.photoBtnText, { color: colors.text }]} numberOfLines={1}>
                    {reviewVideo ? 'Video added' : 'Add a video'}
                  </Text>
                </View>
              </Squeeze>
            </View>

            <Button title="Submit Review" onPress={submitReview} style={styles.spaced} />
          </View>
        </FadeUp>

        <FadeUp delay={510} duration={450}>
          <View style={styles.promoRow}>
            <View style={[styles.promoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Icon source={discountBold} size={26} color={colors.primary} />
              <Text style={[styles.promoTitle, { color: colors.text }]}>Seasonal Sales</Text>
              <Text style={[styles.promoText, { color: colors.textMuted }]}>
                Exclusive seasonal offers on selected items.
              </Text>
            </View>
            <View style={[styles.promoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Icon source={returnOfInvestmentIcon} size={26} color={colors.primary} />
              <Text style={[styles.promoTitle, { color: colors.text }]}>Money Back Guarantee</Text>
              <Text style={[styles.promoText, { color: colors.textMuted }]}>
                Love it or return it within 7 days, no questions asked.
              </Text>
            </View>
            <View style={[styles.promoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Icon source={packageBold} size={26} color={colors.primary} />
              <Text style={[styles.promoTitle, { color: colors.text }]}>Free Shipping</Text>
              <Text style={[styles.promoText, { color: colors.textMuted }]}>
                On all orders within 7 days delivery.
              </Text>
            </View>
          </View>
        </FadeUp>

        <FadeUp delay={550} duration={450}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Related Products</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.bleed}
            contentContainerStyle={styles.relatedRow}>
            {related.map(item => (
              <RelatedCard key={item.id} product={item} navigation={navigation} />
            ))}
          </ScrollView>
        </FadeUp>
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

  body: { paddingHorizontal: 20 },
  backWrap: { alignSelf: 'flex-start', marginBottom: 10 },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  imageCard: { borderRadius: 16, overflow: 'hidden' },
  dots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },

  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 16 },
  title: { flex: 1, fontFamily: fonts.bold, fontSize: 20 },
  price: { fontFamily: fonts.bold, fontSize: 18 },
  bestProduct: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },

  label: { fontFamily: fonts.bold, fontSize: 14, marginTop: 16 },
  colorsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  colorSwatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 1 },

  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 16,
  },
  quantityControls: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  qtyBtn: { width: 30, height: 30, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  qtyValue: { fontFamily: fonts.bold, fontSize: 15, minWidth: 16, textAlign: 'center' },

  spaced: { marginTop: 14 },

  sellerCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 16, gap: 12 },
  sellerHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sellerAvatar: { width: 44, height: 44, borderRadius: 10 },
  sellerInfo: { flex: 1, gap: 2 },
  sellerName: { fontFamily: fonts.bold, fontSize: 15 },
  sellerLocation: { fontFamily: fonts.regular, fontSize: 12 },
  divider: { height: 1 },

  sectionTitle: { fontFamily: fonts.bold, fontSize: 17, marginTop: 22, marginBottom: 10 },
  description: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },

  specsTable: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12 },
  specLabel: { fontFamily: fonts.regular, fontSize: 13 },
  specValue: { fontFamily: fonts.regular, fontSize: 13 },

  variantsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20 },
  variantCard: { width: 200, borderRadius: 14, borderWidth: 1.5, padding: 12, gap: 12 },
  variantHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  variantImage: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#00000010' },
  variantHeadText: { flex: 1, gap: 4 },
  variantLabel: { fontFamily: fonts.bold, fontSize: 13 },
  verifiedPill: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  verifiedText: { fontFamily: fonts.bold, fontSize: 9 },
  variantCheck: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  variantFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  variantPrice: { fontFamily: fonts.bold, fontSize: 15 },
  stockPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  stockText: { fontFamily: fonts.bold, fontSize: 11 },

  guaranteeCard: { borderRadius: 14, padding: 16, marginTop: 22, gap: 10 },
  guaranteeIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  guaranteeTitle: { fontFamily: fonts.bold, fontSize: 15 },
  guaranteeText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },

  ratingsCard: { borderRadius: 14, borderWidth: 1, padding: 16 },
  ratingsSummary: { flexDirection: 'row', gap: 20 },
  ourRating: { fontFamily: fonts.regular, fontSize: 13 },
  ratingNumber: { fontFamily: fonts.bold, fontSize: 30, marginTop: 4 },
  reviewCount: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  ratingBars: { flex: 1, gap: 6, justifyContent: 'center' },
  ratingBarRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingBarLabel: { fontFamily: fonts.regular, fontSize: 12, width: 10 },
  ratingBarTrack: { flex: 1, height: 4, borderRadius: 2 },
  ratingBarFill: { height: 4, borderRadius: 2 },
  ratingBarPercent: { fontFamily: fonts.regular, fontSize: 11, width: 28, textAlign: 'right' },

  reviewFormCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 16 },
  cardHeading: { fontFamily: fonts.bold, fontSize: 16 },
  cardSubheading: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },
  stars: { flexDirection: 'row', gap: 8, marginTop: 10 },
  reviewInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    minHeight: 90,
    textAlignVertical: 'top',
    fontFamily: fonts.regular,
    fontSize: 14,
    marginTop: 14,
  },
  photoRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  photoBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  photoBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  photoThumb: { width: 18, height: 18, borderRadius: 4 },
  photoBtnText: { fontFamily: fonts.regular, fontSize: 12, flexShrink: 1 },

  promoRow: { gap: 12, marginTop: 22 },
  promoCard: { borderRadius: 14, borderWidth: 1, padding: 18, alignItems: 'center', gap: 6 },
  promoTitle: { fontFamily: fonts.bold, fontSize: 15, marginTop: 4 },
  promoText: { fontFamily: fonts.regular, fontSize: 12, textAlign: 'center' },

  bleed: { marginHorizontal: -20 },
  relatedRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20 },
  relatedCard: { width: 160, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  relatedPhoto: { width: '100%', height: 110 },
  relatedLogo: { position: 'absolute', top: 8, left: 8, width: 50, height: 22 },
  relatedHeart: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatedBody: { padding: 10, gap: 3 },
  relatedBrand: { fontFamily: fonts.regular, fontSize: 11 },
  relatedTitle: { fontFamily: fonts.bold, fontSize: 12 },
  relatedPrice: { fontFamily: fonts.bold, fontSize: 13 },
});
