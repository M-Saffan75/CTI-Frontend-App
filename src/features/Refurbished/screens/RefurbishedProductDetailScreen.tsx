import { useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  cameraBold,
  checkCircleBold,
  checkCircleFilled,
  commentDotsBold,
  filterBold,
  heartExtra,
  heartFilled,
  menuBold,
  packageBold,
  returnOfInvestmentIcon,
  searchBold,
  shieldBold,
  shieldIcon,
  shoppingBasketBold,
  shoppingCartExtra,
  starExtra,
  starFilled,
  videoBold,
} from '@/assets/icons';
import { demoProductPhoto } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import AskPlatformModal from '../components/AskPlatformModal';
import RefurbishedFilterModal from '../components/RefurbishedFilterModal';
import {
  GRADE_EXPLANATIONS,
  REFURBISHED_PRODUCTS,
  RefurbishedProduct,
} from '../data/refurbishedData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GRADE_TABS: Array<'Superb' | 'Good' | 'Fair' | 'Best Value'> = [
  'Superb',
  'Good',
  'Fair',
  'Best Value',
];

export default function RefurbishedProductDetailScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const passedProduct: RefurbishedProduct | undefined = route?.params?.product;
  const productId: string | undefined = route?.params?.productId;

  const product =
    passedProduct ||
    REFURBISHED_PRODUCTS?.find(p => p.id === productId) ||
    REFURBISHED_PRODUCTS?.[0] ||
    ({} as RefurbishedProduct);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedGrade, setSelectedGrade] = useState<'Superb' | 'Good' | 'Fair' | 'Best Value'>(
    product?.grade || 'Superb',
  );
  const [askModalVisible, setAskModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [isWished, setIsWished] = useState(false);

  // Review Form states
  const [userRating, setUserRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewsList, setReviewsList] = useState([
    {
      id: 'r-1',
      name: 'James Walker',
      rating: 5,
      comment:
        'The whole process was smooth and easy. I found the right device quickly, and everything was exactly as described',
    },
    {
      id: 'r-2',
      name: 'Sophie Turner',
      rating: 5,
      comment:
        'Great platform with clear product details and fair pricing. The buying experience felt simple and trustworthy.',
    },
  ]);

  const handleAddReview = () => {
    if (!reviewText.trim()) return;
    const newRev = {
      id: `r-${Date.now()}`,
      name: 'You (Verified Buyer)',
      rating: userRating,
      comment: reviewText.trim(),
    };
    setReviewsList([newRev, ...reviewsList]);
    setReviewText('');
    Alert.alert('Review Submitted', 'Thank you for reviewing this refurbished product!');
  };

  const handleAddToCart = () => {
    Alert.alert('Added to Cart', `${product.name} (Qty: ${quantity}) has been added to your cart.`);
  };

  const handleBuyNow = () => {
    try {
      navigation.navigate('Checkout', {
        items: [{ product, quantity }],
        totalPrice: product.price * quantity,
      });
    } catch {
      handleAddToCart();
    }
  };

  const gradeInfo =
    GRADE_EXPLANATIONS?.[selectedGrade] ||
    GRADE_EXPLANATIONS?.['Superb'] ||
    ({} as (typeof GRADE_EXPLANATIONS)['Superb']);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View
        style={[
          styles.headerRow,
          {
            paddingTop: Math.max(insets.top, 10),
            backgroundColor: colors.background,
            borderBottomColor: colors.border + '33',
          },
        ]}>
        <Squeeze
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: colors.primary }]}>
          <Icon source={arrowLeftBold} size={18} color="#FFFFFF" />
        </Squeeze>

        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '33' },
          ]}>
          <Icon source={searchBold} size={16} color={colors.textMuted} />
          <TextInput
            placeholder="Search In Cti"
            placeholderTextColor={colors.textMuted + '88'}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setIsWished(!isWished)} style={styles.headIconBtn}>
            <Icon
              source={isWished ? heartFilled : heartExtra}
              size={20}
              color={isWished ? '#EF4444' : colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterModalVisible(true)}
            style={styles.headIconBtn}>
            <Icon source={filterBold} size={19} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              try {
                navigation.navigate('Cart');
              } catch {}
            }}
            style={styles.headIconBtn}>
            <Icon source={shoppingCartExtra} size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              try {
                navigation.navigate('Settings');
              } catch {}
            }}
            style={styles.headIconBtn}>
            <Icon source={menuBold} size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
        {/* Gallery Section */}
        <View
          style={[
            styles.galleryContainer,
            { backgroundColor: colors.surface, borderColor: colors.border + '44' },
          ]}>
          {/* Top right Refurbished badge */}
          <View style={[styles.refurbishedPill, { backgroundColor: colors.primary }]}>
            <Text style={styles.refurbishedPillText}>Refurbished</Text>
          </View>

          {/* Bottom left red ribbon */}
          <View style={styles.redCornerRibbon}>
            <Text style={styles.redCornerText}>-{product?.discountPercent ?? 0}%</Text>
          </View>

          {/* Big Product Image */}
          <Image
            source={
              product?.gallery?.[activeImageIndex] || product?.image || demoProductPhoto
            }
            style={styles.mainProductImage}
            resizeMode="contain"
          />

          {/* Thumbnails Row */}
          <View style={styles.thumbnailsRow}>
            {(product?.gallery || [product?.image || demoProductPhoto]).map((img, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setActiveImageIndex(idx)}
                style={[
                  styles.thumbnailBox,
                  {
                    borderColor:
                      activeImageIndex === idx ? colors.primary : colors.border + '44',
                    backgroundColor: colors.surfaceAlt,
                  },
                ]}>
                <Image source={img} style={styles.thumbImg} resizeMode="contain" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Brand & Category Pills + Quantity Stepper */}
        <View style={styles.metaRow}>
          <View style={styles.tagsContainer}>
            <View
              style={[
                styles.brandChip,
                { borderColor: colors.primary + '88', backgroundColor: colors.primary + '14' },
              ]}>
              <Text style={[styles.brandChipText, { color: colors.primary }]}>{product?.brand || ''}</Text>
            </View>
            <View
              style={[
                styles.categoryChip,
                { borderColor: colors.border + '55', backgroundColor: colors.surfaceAlt },
              ]}>
              <Text style={[styles.categoryChipText, { color: colors.text }]}>
                {product?.category || ''}
              </Text>
            </View>
          </View>

          {/* Stepper */}
          <View
            style={[
              styles.stepperBox,
              { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '44' },
            ]}>
            <TouchableOpacity
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
              style={styles.stepperBtn}>
              <Text style={[styles.stepperBtnText, { color: colors.text }]}>−</Text>
            </TouchableOpacity>
            <Text style={[styles.stepperVal, { color: colors.text }]}>{quantity}</Text>
            <TouchableOpacity
              onPress={() => setQuantity(quantity + 1)}
              style={styles.stepperBtn}>
              <Text style={[styles.stepperBtnText, { color: colors.text }]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Title & Description */}
        <View style={styles.infoSection}>
          <Text style={[styles.productTitle, { color: colors.text }]}>{product?.name || ''}</Text>
          <Text style={[styles.productDescription, { color: colors.textMuted }]}>
            {product?.description || ''}
          </Text>

          {/* Price & In-stock Row */}
          <View style={styles.priceRow}>
            <Text style={[styles.priceValue, { color: colors.text }]}>${product?.price ?? 0}.00</Text>
            <Text style={[styles.mrpValue, { color: colors.textMuted }]}>
              MRP ${product?.originalPrice ?? 0}.00
            </Text>
            <View style={styles.inStockBadge}>
              <Icon source={checkCircleFilled} size={14} color="#059669" />
              <Text style={styles.inStockText}>In Stock ({product?.inStockCount ?? 0} left)</Text>
            </View>
          </View>
        </View>

        {/* Add to Cart / Buy Now Action Buttons */}
        <View style={styles.cartButtonsRow}>
          <Squeeze
            onPress={handleAddToCart}
            style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}>
            <View style={styles.actionBtnRow}>
              <Icon source={shoppingBasketBold} size={18} color="#FFFFFF" />
              <Text style={styles.primaryActionText}>Add To Cart</Text>
            </View>
          </Squeeze>

          <Squeeze
            onPress={handleBuyNow}
            style={[styles.secondaryActionBtn, { backgroundColor: '#111827' }]}>
            <View style={styles.actionBtnRow}>
              <Icon source={shoppingCartExtra} size={18} color="#FFFFFF" />
              <Text style={styles.secondaryActionText}>Buy Now</Text>
            </View>
          </Squeeze>
        </View>

        {/* CTI Platform Card with Ask Platform */}
        <View
          style={[
            styles.ctiPlatformCard,
            { backgroundColor: colors.surface, borderColor: colors.border + '44' },
          ]}>
          <View style={styles.platformHeader}>
            <View style={[styles.shieldBadgeWrap, { backgroundColor: colors.primary + '18' }]}>
              <Icon source={shieldIcon} size={28} color={colors.primary} />
            </View>
            <View style={styles.platformMeta}>
              <View style={styles.platformNameRow}>
                <Text style={[styles.platformName, { color: colors.text }]}>CTI Platform</Text>
                <Icon
                  source={checkCircleFilled}
                  size={16}
                  color={colors.primary}
                  style={{ marginLeft: 6 }}
                />
              </View>
              <Text style={[styles.platformSub, { color: colors.textMuted }]}>
                Verified & Certified Refurbished
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setAskModalVisible(true)}
            style={[
              styles.askPlatformBtn,
              { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '33' },
            ]}>
            <Icon source={commentDotsBold} size={18} color={colors.primary} />
            <Text style={[styles.askPlatformText, { color: colors.primary }]}>
              Ask Platform
            </Text>
          </TouchableOpacity>
        </View>

        {/* Product Information Section */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>Product Information</Text>
          <View style={[styles.separator, { backgroundColor: colors.border + '33' }]} />

          <View style={styles.specBullet}>
            <View style={[styles.bulletDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.specTitle, { color: colors.text }]}>Build & Materials:</Text>
          </View>
          <Text style={[styles.specDesc, { color: colors.textMuted }]}>
            {product?.specs?.buildAndMaterials || ''}
          </Text>

          <View style={styles.specBullet}>
            <View style={[styles.bulletDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.specTitle, { color: colors.text }]}>Display & Visuals:</Text>
          </View>
          <Text style={[styles.specDesc, { color: colors.textMuted }]}>
            {product?.specs?.displayAndVisuals || ''}
          </Text>

          <View style={styles.specBullet}>
            <View style={[styles.bulletDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.specTitle, { color: colors.text }]}>
              Performance & Processing:
            </Text>
          </View>
          <Text style={[styles.specDesc, { color: colors.textMuted }]}>
            {product?.specs?.performance || ''}
          </Text>

          <View style={styles.specBullet}>
            <View style={[styles.bulletDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.specTitle, { color: colors.text }]}>Camera System:</Text>
          </View>
          <Text style={[styles.specDesc, { color: colors.textMuted }]}>
            {product?.specs?.cameraSystem || ''}
          </Text>

          <View style={styles.specBullet}>
            <View style={[styles.bulletDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.specTitle, { color: colors.text }]}>
              Battery & Connectivity:
            </Text>
          </View>
          <Text style={[styles.specDesc, { color: colors.textMuted }]}>
            {product?.specs?.batteryAndConnectivity || ''}
          </Text>
        </View>

        {/* Specifications Table */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>Specifications</Text>
          <View
            style={[
              styles.specTableCard,
              { backgroundColor: colors.surface, borderColor: colors.border + '44' },
            ]}>
            <View style={styles.tableRow}>
              <Text style={[styles.tableLabel, { color: colors.textMuted }]}>Brand</Text>
              <Text style={[styles.tableValue, { color: colors.text }]}>{product?.brand || ''}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableLabel, { color: colors.textMuted }]}>Category</Text>
              <Text style={[styles.tableValue, { color: colors.text }]}>{product?.category || ''}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableLabel, { color: colors.textMuted }]}>SKU</Text>
              <Text style={[styles.tableValue, { color: colors.text }]}>{product?.sku || ''}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableLabel, { color: colors.textMuted }]}>Total Variants</Text>
              <Text style={[styles.tableValue, { color: colors.text }]}>
                {product?.totalVariants ?? 1}
              </Text>
            </View>
            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.tableLabel, { color: colors.textMuted }]}>Condition</Text>
              <Text style={[styles.tableValue, { color: colors.text }]}>
                {product?.condition || 'Refurbished'}
              </Text>
            </View>
          </View>
        </View>

        {/* Grade Explained Section matching Figma */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>Grade Explained</Text>

          {/* Grade selection tabs */}
          <View style={styles.gradeTabsRow}>
            {GRADE_TABS.map(grade => {
              const active = selectedGrade === grade;
              return (
                <TouchableOpacity
                  key={grade}
                  onPress={() => setSelectedGrade(grade)}
                  style={[
                    styles.gradeTabBtn,
                    {
                      borderColor: active ? colors.primary : colors.border + '55',
                      backgroundColor: active ? colors.primary + '18' : colors.surfaceAlt,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.gradeTabText,
                      { color: active ? colors.primary : colors.text },
                    ]}>
                    {grade}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Overall box */}
          <View
            style={[
              styles.overallBanner,
              {
                borderColor: colors.primary,
                backgroundColor: colors.primary + '14',
              },
            ]}>
            <Text style={[styles.overallTitle, { color: colors.primary }]}>
              Overall -{' '}
              <Text style={{ fontFamily: fonts.regular, color: colors.text }}>
                {gradeInfo.overall}
              </Text>
            </Text>
          </View>

          {/* Screen Glass explanation with micro-scratches visual callouts */}
          <View style={styles.gradeDetailBlock}>
            <View style={styles.gradeSubHeadingRow}>
              <Icon source={checkCircleFilled} size={16} color={colors.primary} />
              <Text style={[styles.gradeSubTitle, { color: colors.text }]}>
                Screen Glass -{' '}
                <Text style={{ fontFamily: fonts.regular, color: colors.textMuted }}>
                  {gradeInfo.screenGlass}
                </Text>
              </Text>
            </View>

            <View style={styles.diagramCardsRow}>
              {[1, 2, 3].map(i => (
                <View
                  key={i}
                  style={[
                    styles.diagramCard,
                    { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '33' },
                  ]}>
                  <Image
                    source={demoProductPhoto}
                    style={styles.diagramImg}
                    resizeMode="contain"
                  />
                  <View style={styles.diagramBadge}>
                    <Text style={styles.diagramBadgeText}>Micro-scratches</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Display panel explanation */}
          <View style={styles.gradeDetailBlock}>
            <View style={styles.gradeSubHeadingRow}>
              <Icon source={checkCircleFilled} size={16} color={colors.primary} />
              <Text style={[styles.gradeSubTitle, { color: colors.text }]}>
                Display -{' '}
                <Text style={{ fontFamily: fonts.regular, color: colors.textMuted }}>
                  {gradeInfo.display}
                </Text>
              </Text>
            </View>

            <View style={styles.diagramCardsRow}>
              {[1, 2].map(i => (
                <View
                  key={i}
                  style={[
                    styles.diagramCard,
                    { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '33' },
                  ]}>
                  <Image
                    source={demoProductPhoto}
                    style={styles.diagramImg}
                    resizeMode="contain"
                  />
                  <View style={styles.diagramBadge}>
                    <Text style={styles.diagramBadgeText}>OLED Verified</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Body explanation */}
          <View style={styles.gradeDetailBlock}>
            <View style={styles.gradeSubHeadingRow}>
              <Icon source={checkCircleFilled} size={16} color={colors.primary} />
              <Text style={[styles.gradeSubTitle, { color: colors.text }]}>
                Body -{' '}
                <Text style={{ fontFamily: fonts.regular, color: colors.textMuted }}>
                  {gradeInfo.body}
                </Text>
              </Text>
            </View>

            <View style={styles.diagramCardsRow}>
              {[1, 2].map(i => (
                <View
                  key={i}
                  style={[
                    styles.diagramCard,
                    { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '33' },
                  ]}>
                  <Image
                    source={demoProductPhoto}
                    style={styles.diagramImg}
                    resizeMode="contain"
                  />
                  <View style={styles.diagramBadge}>
                    <Text style={styles.diagramBadgeText}>Frame Inspection</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Platform Guarantee & Buyer Protection Card matching Figma */}
        <View
          style={[
            styles.trustCard,
            { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
          ]}>
          <View style={styles.trustCardHeader}>
            <Icon source={shieldBold} size={24} color="#D97706" />
            <Text style={styles.trustCardTitle}>Platform Guarantee & Buyer Protection</Text>
          </View>
          <Text style={styles.trustCardDesc}>
            We stand behind every transaction on our platform. With our secure escrow system, your
            payment is protected and is only released to the seller once you receive the product
            exactly as described. Shop with confidence knowing Our 24/7 support team is here to
            assist you with any disputes or issues.
          </Text>
        </View>

        {/* Easy Returns & Refund Policy Card matching Figma */}
        <View
          style={[
            styles.trustCard,
            { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
          ]}>
          <View style={styles.trustCardHeader}>
            <Icon source={returnOfInvestmentIcon} size={24} color="#059669" />
            <Text style={[styles.trustCardTitle, { color: '#065F46' }]}>
              Easy Returns & Refund Policy
            </Text>
          </View>
          <Text style={[styles.trustCardDesc, { color: '#047857' }]}>
            Not satisfied with your purchase? You can return eligible items within 7 days of
            delivery for a full refund or exchange. We provide hassle-free return shipping labels
            and process refunds swiftly back to your original payment method. Terms and conditions
            apply.
          </Text>
        </View>

        {/* Rating & Reviews Section */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>Rating & Reviews</Text>

          <View
            style={[
              styles.ratingSummaryCard,
              { backgroundColor: colors.surface, borderColor: colors.border + '44' },
            ]}>
            <View style={styles.ratingScoreCol}>
              <Text style={[styles.ourRatingLabel, { color: colors.textMuted }]}>Our Rating</Text>
              <Text style={[styles.ratingScoreLarge, { color: colors.text }]}>4.9</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Icon key={s} source={starFilled} size={14} color="#F59E0B" />
                ))}
              </View>
              <Text style={[styles.reviewsCountText, { color: colors.textMuted }]}>
                ({reviewsList.length + 42} Reviews)
              </Text>
            </View>

            {/* Rating breakdown bars */}
            <View style={styles.ratingBarsCol}>
              {[5, 4, 3, 2, 1].map(star => {
                const percent = star === 5 ? '88%' : star === 4 ? '12%' : '0%';
                return (
                  <View key={star} style={styles.barRow}>
                    <Text style={[styles.starNumText, { color: colors.text }]}>{star}</Text>
                    <Icon source={starFilled} size={12} color="#F59E0B" style={{ marginRight: 6 }} />
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressBar,
                          { width: percent as any, backgroundColor: colors.primary },
                        ]}
                      />
                    </View>
                    <Text style={[styles.percentText, { color: colors.textMuted }]}>
                      {percent}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Write a Review Box matching Figma */}
          <View
            style={[
              styles.writeReviewCard,
              { backgroundColor: colors.surface, borderColor: colors.border + '44' },
            ]}>
            <Text style={[styles.writeReviewTitle, { color: colors.text }]}>Write a Review</Text>
            <Text style={[styles.writeReviewSub, { color: colors.textMuted }]}>
              Share your experience with other customers
            </Text>

            <Text style={[styles.yourRatingLabel, { color: colors.textMuted }]}>Your Rating</Text>
            <View style={styles.starSelectRow}>
              {[1, 2, 3, 4, 5].map(st => (
                <TouchableOpacity key={st} onPress={() => setUserRating(st)}>
                  <Icon
                    source={userRating >= st ? starFilled : starExtra}
                    size={24}
                    color="#F59E0B"
                    style={{ marginRight: 6 }}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              value={reviewText}
              onChangeText={setReviewText}
              placeholder="Write your Review..."
              placeholderTextColor={colors.textMuted + '88'}
              multiline
              numberOfLines={4}
              style={[
                styles.reviewInput,
                {
                  backgroundColor: colors.surfaceAlt,
                  color: colors.text,
                  borderColor: colors.border + '33',
                },
              ]}
            />

            <View style={styles.mediaButtonsRow}>
              <TouchableOpacity
                onPress={() => Alert.alert('Add Photo', 'Camera opened to attach product photo.')}
                style={[
                  styles.addMediaBtn,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '33' },
                ]}>
                <Icon source={cameraBold} size={16} color={colors.textMuted} />
                <Text style={[styles.addMediaText, { color: colors.text }]}>Add a photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => Alert.alert('Add Video', 'Gallery opened to attach product video.')}
                style={[
                  styles.addMediaBtn,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '33' },
                ]}>
                <Icon source={videoBold} size={16} color={colors.textMuted} />
                <Text style={[styles.addMediaText, { color: colors.text }]}>Add a video</Text>
              </TouchableOpacity>
            </View>

            <Squeeze
              onPress={handleAddReview}
              style={[styles.submitReviewBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.submitReviewText}>Submit Review</Text>
            </Squeeze>
          </View>

          {/* Customer Reviews List */}
          <View style={styles.reviewsList}>
            {reviewsList.map(item => (
              <View
                key={item.id}
                style={[
                  styles.reviewItemCard,
                  { backgroundColor: colors.surface, borderColor: colors.border + '33' },
                ]}>
                <View style={styles.reviewUserRow}>
                  <View style={[styles.reviewerAvatar, { backgroundColor: colors.primary + '22' }]}>
                    <Text style={[styles.reviewerInitials, { color: colors.primary }]}>
                      {item.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.reviewerMeta}>
                    <Text style={[styles.reviewerName, { color: colors.text }]}>{item.name}</Text>
                    <View style={styles.smallStars}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <Icon key={s} source={starFilled} size={12} color="#F59E0B" />
                      ))}
                    </View>
                  </View>
                </View>
                <Text style={[styles.reviewComment, { color: colors.textMuted }]}>
                  {item.comment}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Related Products Carousel */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>
            Related Refurbished Products
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.relatedScroll}>
            {REFURBISHED_PRODUCTS.filter(p => p.id !== product.id).map(rel => (
              <TouchableOpacity
                key={rel.id}
                onPress={() =>
                  navigation.push('RefurbishedProductDetail', { productId: rel.id, product: rel })
                }
                style={[
                  styles.relatedCard,
                  { backgroundColor: colors.surface, borderColor: colors.border + '44' },
                ]}>
                <Image
                  source={rel.image || demoProductPhoto}
                  style={styles.relatedImg}
                  resizeMode="contain"
                />
                <Text style={[styles.relatedTitle, { color: colors.text }]} numberOfLines={1}>
                  {rel.name}
                </Text>
                <Text style={[styles.relatedPrice, { color: colors.primary }]}>
                  ${rel.price}.00
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Ask Platform Modal */}
      <AskPlatformModal
        visible={askModalVisible}
        productName={product.name}
        onClose={() => setAskModalVisible(false)}
        onSend={(subj, msg) => {
          Alert.alert('Inquiry Sent', `Your query regarding "${subj}" has been forwarded.`);
        }}
      />

      {/* Filter Modal */}
      <RefurbishedFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={filters => navigation.navigate('AllGadgets', { appliedFilters: filters })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.regular,
    padding: 0,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headIconBtn: {
    padding: 2,
  },
  scrollContent: {
    paddingTop: 14,
  },
  galleryContainer: {
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  refurbishedPill: {
    position: 'absolute',
    top: 14,
    right: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 10,
  },
  refurbishedPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: fonts.bold,
  },
  redCornerRibbon: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    zIndex: 10,
  },
  redCornerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: fonts.bold,
  },
  mainProductImage: {
    width: SCREEN_WIDTH * 0.7,
    height: 240,
    marginVertical: 10,
  },
  thumbnailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  thumbnailBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  brandChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  brandChipText: {
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    height: 34,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  stepperVal: {
    fontSize: 14,
    fontFamily: fonts.bold,
    paddingHorizontal: 8,
  },
  infoSection: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  productTitle: {
    fontSize: 22,
    fontFamily: fonts.bold,
  },
  productDescription: {
    fontSize: 13,
    fontFamily: fonts.regular,
    lineHeight: 19,
    marginTop: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  priceValue: {
    fontSize: 20,
    fontFamily: fonts.bold,
  },
  mrpValue: {
    fontSize: 14,
    fontFamily: fonts.regular,
    textDecorationLine: 'line-through',
  },
  inStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  inStockText: {
    color: '#059669',
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  cartButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 18,
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryActionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  secondaryActionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  ctiPlatformCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 20,
  },
  platformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shieldBadgeWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformMeta: {
    flex: 1,
  },
  platformNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformName: {
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  platformSub: {
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  askPlatformBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 14,
    gap: 8,
  },
  askPlatformText: {
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  sectionBlock: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionHeading: {
    fontSize: 18,
    fontFamily: fonts.bold,
    marginBottom: 8,
  },
  separator: {
    height: 1,
    marginBottom: 14,
  },
  specBullet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  specTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  specDesc: {
    fontSize: 13,
    fontFamily: fonts.regular,
    lineHeight: 19,
    marginTop: 4,
    paddingLeft: 14,
  },
  specTableCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginTop: 6,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  tableLabel: {
    fontSize: 13,
    fontFamily: fonts.regular,
  },
  tableValue: {
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  gradeTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  gradeTabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  gradeTabText: {
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  overallBanner: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 14,
  },
  overallTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  gradeDetailBlock: {
    marginTop: 14,
  },
  gradeSubHeadingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 8,
  },
  gradeSubTitle: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.bold,
    lineHeight: 18,
  },
  diagramCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  diagramCard: {
    width: (SCREEN_WIDTH - 52) / 3,
    height: 90,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  diagramImg: {
    width: '70%',
    height: '70%',
  },
  diagramBadge: {
    position: 'absolute',
    bottom: 4,
    backgroundColor: '#000000AA',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  diagramBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: fonts.medium,
  },
  trustCard: {
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginTop: 16,
  },
  trustCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  trustCardTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: '#92400E',
    flex: 1,
  },
  trustCardDesc: {
    fontSize: 12,
    fontFamily: fonts.regular,
    lineHeight: 18,
    color: '#B45309',
  },
  ratingSummaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    marginTop: 6,
  },
  ratingScoreCol: {
    width: '38%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#E2E8F0',
    paddingRight: 10,
  },
  ourRatingLabel: {
    fontSize: 12,
    fontFamily: fonts.regular,
  },
  ratingScoreLarge: {
    fontSize: 36,
    fontFamily: fonts.bold,
    marginVertical: 2,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 4,
  },
  reviewsCountText: {
    fontSize: 11,
    fontFamily: fonts.regular,
  },
  ratingBarsCol: {
    flex: 1,
    paddingLeft: 14,
    justifyContent: 'center',
    gap: 4,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starNumText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    width: 10,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  percentText: {
    fontSize: 10,
    fontFamily: fonts.regular,
    width: 28,
    textAlign: 'right',
  },
  writeReviewCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 16,
  },
  writeReviewTitle: {
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  writeReviewSub: {
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: 2,
    marginBottom: 12,
  },
  yourRatingLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    marginBottom: 6,
  },
  starSelectRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  reviewInput: {
    height: 90,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
    fontSize: 13,
    fontFamily: fonts.regular,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  mediaButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  addMediaBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addMediaText: {
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  submitReviewBtn: {
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitReviewText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  reviewsList: {
    gap: 10,
    marginTop: 14,
  },
  reviewItemCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  reviewUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  reviewerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerInitials: {
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  reviewerMeta: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  smallStars: {
    flexDirection: 'row',
    marginTop: 2,
  },
  reviewComment: {
    fontSize: 12,
    fontFamily: fonts.regular,
    lineHeight: 17,
  },
  relatedScroll: {
    gap: 12,
    marginTop: 8,
  },
  relatedCard: {
    width: 140,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
  },
  relatedImg: {
    width: '100%',
    height: 90,
    marginBottom: 6,
  },
  relatedTitle: {
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  relatedPrice: {
    fontSize: 13,
    fontFamily: fonts.bold,
    marginTop: 2,
  },
});
