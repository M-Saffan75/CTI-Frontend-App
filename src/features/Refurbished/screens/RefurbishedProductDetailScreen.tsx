import { useEffect, useRef, useState } from 'react';
import { formatMoney } from '@/utils/money';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import {
  arrowLeftBold,
  checkCircleFilled,
  filterBold,
  heartExtra,
  heartFilled,
  menuBold,
  packageBold,
  shoppingBasketBold,
  shieldIcon,
  shoppingCartExtra,
  starExtra,
  starFilled,
} from '@/assets/icons';
import { demoProductPhoto } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { normalizeApiError } from '@/services/apiError';
import PlatformGuarantees from '@/components/PlatformGuarantees';
import GradeExplained from '../components/GradeExplained';
import { detectDeviceType } from '../data/gradeData';
import RefurbishedFilterModal from '../components/RefurbishedFilterModal';
import CtiLoader from '@/components/CtiLoader';
import { RefurbishedProduct } from '../data/refurbishedData';
import {
  getRefurbishedProductDetail,
  getRelatedRefurbishedProducts,
  addRefurbishedCartItem,
} from '../services/refurbishedApi';
import { useWishlist } from '@/roles/Customer/context/WishlistContext';
import { useCart } from '@/roles/Customer/context/CartContext';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RefurbishedProductDetailScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const passedProduct: RefurbishedProduct | undefined = route?.params?.product;
  const lookupKey: string | undefined =
    route?.params?.slug ||
    passedProduct?.slug ||
    route?.params?.productId ||
    passedProduct?.rawId ||
    passedProduct?.id;

  const [product, setProduct] = useState<RefurbishedProduct | null>(passedProduct || null);
  const [loading, setLoading] = useState<boolean>(!passedProduct && !!lookupKey);
  const [relatedProducts, setRelatedProducts] = useState<RefurbishedProduct[]>([]);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // Sync state whenever route params change
  useEffect(() => {
    if (passedProduct) {
      setProduct(passedProduct);
      setQuantity(1);
    }
  }, [passedProduct, lookupKey]);

  // The live fetch runs once per product key; whether a product is already on screen is read from a ref
  const hasProductRef = useRef(false);
  hasProductRef.current = Boolean(passedProduct || product);

  useEffect(() => {
    if (lookupKey) {
      if (!hasProductRef.current) setLoading(true);
      setLoadError('');
      getRefurbishedProductDetail(lookupKey)
        .then(live => {
          if (live) {
            setProduct(live);
          } else if (!hasProductRef.current) {
            setProduct(null);
          }
        })
        .catch(err => {
          if (!hasProductRef.current) {
            setProduct(null);
            setLoadError(normalizeApiError(err).message);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [lookupKey, reloadKey]);

  const productId = product?.id;
  useEffect(() => {
    if (!product) return;
    let active = true;
    getRelatedRefurbishedProducts(product)
      .then(list => active && setRelatedProducts(list))
      .catch(() => active && setRelatedProducts([]));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [isWished, setIsWished] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const { ids: wishlistIds, toggle: toggleWishlistContext } = useWishlist();
  const { cartCount, refreshCart } = useCart();

  // Variant handling
  const variants: any[] = product?.variants || product?.raw?.variants || [];
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      const vars = product?.variants || product?.raw?.variants || [];
      const def = vars.find((v: any) => v.isDefault) || vars[0];
      const vId = def?._id ? String(def._id) : (product.defaultVariantId || null);
      setSelectedVariantId(vId);

      const pId = String(product.rawId || product.id);
      setIsWished(wishlistIds.includes(pId));
    }
  }, [product, wishlistIds]);

  const selectedVariant =
    variants.find((v: any) => String(v._id) === String(selectedVariantId)) ||
    variants[0] ||
    null;

  const displayPrice = Number(
    selectedVariant?.discountPrice ||
    selectedVariant?.sellingPrice ||
    selectedVariant?.price ||
    product?.price ||
    0,
  );

  const displayMrp = Number(
    selectedVariant?.sellingPrice ||
    selectedVariant?.price ||
    product?.originalPrice ||
    0,
  );

  const displayStock = Number(
    selectedVariant?.stock ??
    product?.inStockCount ??
    0,
  );
  const reviewCount = Number(product?.reviewsCount || 0);
  const averageRating = Number(product?.rating || 0);

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

  const handleAddToCart = async () => {
    if (!product) return;
    const pId = product.rawId || product.id;
    const vId = selectedVariant?._id ? String(selectedVariant._id) : (selectedVariantId || product.defaultVariantId);
    setAddingToCart(true);
    try {
      const res = await addRefurbishedCartItem(pId, vId || undefined, quantity);
      if (res.success) {
        await refreshCart();
        setModal({
          visible: true,
          type: 'success',
          title: i18n.t('customer.addedToCart'),
          message: i18n.t('customerMsg.addedToCartMsg', { name: product.name, qty: quantity }),
        });
      } else {
        setModal({
          visible: true,
          type: 'error',
          title: i18n.t('common.error'),
          message: res.message || i18n.t('customer.couldNotAddToCart'),
        });
      }
    } catch (err: any) {
      setModal({
        visible: true,
        type: 'error',
        title: i18n.t('common.error'),
        message: err?.message || i18n.t('customer.couldNotAddToCart'),
      });
    } finally {
      setAddingToCart(false);
    }
  };

  // The heart flips at once and goes back if the request fails. The button is disabled while it runs.
  const handleToggleWishlist = async () => {
    if (!product || wishlistLoading) return;
    setWishlistLoading(true);
    const vId = selectedVariantId || product.defaultVariantId;
    try {
      await toggleWishlistContext(product, vId);
    } catch {
      // The context already put the heart back
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleBuyNow = () => {
    try {
      const pId = String(product?.rawId || product?.id || '');
      const vId = selectedVariant?._id
        ? String(selectedVariant._id)
        : (selectedVariantId || product?.defaultVariantId || undefined);

      navigation.navigate('Checkout', {
        isRefurbished: true,
        cartItems: [{
          id: pId || 'refurb-item',
          productId: pId,
          variantId: vId,
          title: product?.name || '',
          price: displayPrice,
          quantity,
          image: product?.image,
          isRefurbished: true,
          product: product?.raw || product,
        }],
        subtotal: displayPrice * quantity,
        total: displayPrice * quantity,
      });
    } catch {
      handleAddToCart();
    }
  };

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
          <Icon source={arrowLeftBold} size={18} color={colors.onPrimary} />
        </Squeeze>

        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          <Text
            style={{
              fontFamily: fonts.bold,
              fontSize: 16,
              color: colors.text,
            }}
            numberOfLines={1}>
            {product?.name || t('customer.deviceDetails')}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleToggleWishlist}
            disabled={wishlistLoading}
            style={styles.headIconBtn}>
            <View style={{ position: 'relative' }}>
              <Icon
                source={isWished ? heartFilled : heartExtra}
                size={20}
                color={isWished ? '#EF4444' : colors.text}
              />
              {wishlistIds.length > 0 && (
                <View style={[styles.headBadge, { backgroundColor: colors.error }]}>
                  <Text style={styles.headBadgeText}>
                    {wishlistIds.length > 99 ? '99+' : wishlistIds.length}
                  </Text>
                </View>
              )}
            </View>
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
            <View style={{ position: 'relative' }}>
              <Icon source={shoppingCartExtra} size={20} color={colors.text} />
              {cartCount > 0 && (
                <View style={[styles.headBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.headBadgeText}>
                    {cartCount > 99 ? '99+' : cartCount}
                  </Text>
                </View>
              )}
            </View>
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

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <CtiLoader size="lg" text={t('customer.loadingRefurbishedProduct')} />
        </View>
      ) : !product ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Icon source={packageBold} size={54} color={colors.textMuted} />
          <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: colors.text, marginTop: 16 }}>
            {loadError ? t('customer.couldNotLoadTheProduct') : t('customer.productNotFound')}
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, marginTop: 8, textAlign: 'center' }}>
            {loadError || t('customer.theRequestedRefurbishedDeviceIs')}
          </Text>
          {loadError ? (
            <Squeeze onPress={() => setReloadKey(k => k + 1)} style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: 12 }}>
              <Text style={{ color: colors.onPrimary, fontFamily: fonts.bold }}>{t('customer.tryAgain')}</Text>
            </Squeeze>
          ) : null}
          <Squeeze onPress={() => navigation.goBack()} style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: 12 }}>
            <Text style={{ color: '#fff', fontFamily: fonts.bold }}>{t('customer.goBack')}</Text>
          </Squeeze>
        </View>
      ) : (
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
            <Text style={styles.refurbishedPillText}>{t('glossary.refurbished')}</Text>
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

          {/* Variants Selector */}
          {variants.length > 1 && (
            <View style={styles.variantsSection}>
              <Text style={[styles.variantSectionTitle, { color: colors.text }]}>
                {t('customer.selectVariant')}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.variantsRow}>
                {variants.map((v: any, vIdx: number) => {
                  const isSel = String(v._id) === String(selectedVariantId);
                  const attrText =
                    Array.isArray(v.attributes) && v.attributes.length > 0
                      ? v.attributes.map((a: any) => `${a.name}: ${a.value}`).join(' • ')
                      : v.title || `Option ${vIdx + 1}`;
                  return (
                    <TouchableOpacity
                      key={v._id || vIdx}
                      onPress={() => setSelectedVariantId(String(v._id))}
                      style={[
                        styles.variantChip,
                        {
                          borderColor: isSel ? colors.primary : colors.border + '55',
                          backgroundColor: isSel ? colors.primary + '15' : colors.surfaceAlt,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.variantChipText,
                          {
                            color: isSel ? colors.primary : colors.text,
                            fontFamily: isSel ? fonts.bold : fonts.regular,
                          },
                        ]}>
                        {attrText}
                      </Text>
                      {typeof v.stock === 'number' && (
                        <Text
                          style={[
                            styles.variantStockText,
                            { color: v.stock > 0 ? '#059669' : '#EF4444' },
                          ]}>
                          {v.stock > 0 ? i18n.t('customerMsg.inStockCount', { count: v.stock }) : i18n.t('customer.outOfStock')}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Price & In-stock Row */}
          <View style={styles.priceRow}>
            <Text style={[styles.priceValue, { color: colors.text }]}>{formatMoney(displayPrice)}</Text>
            {displayMrp > displayPrice && (
              <Text style={[styles.mrpValue, { color: colors.textMuted }]}>
                {t('customerMsg.mrp', { amount: formatMoney(displayMrp) })}
              </Text>
            )}
            {displayStock > 0 ? (
              <View style={styles.inStockBadge}>
                <Icon source={checkCircleFilled} size={14} color="#059669" />
                <Text style={styles.inStockText}>{t('customerMsg.inStockLeft', { count: displayStock })}</Text>
              </View>
            ) : (
              <Text style={[styles.inStockText, { color: colors.error }]}>{t('customer.outOfStock')}</Text>
            )}
          </View>
        </View>

        {/* Add to Cart / Buy Now Action Buttons */}
        <View style={styles.cartButtonsRow}>
          <Squeeze
            onPress={handleAddToCart}
            disabled={addingToCart || displayStock <= 0}
            style={[styles.primaryActionBtn, { backgroundColor: colors.primary, opacity: displayStock <= 0 ? 0.5 : 1 }]}>
            <View style={styles.actionBtnRow}>
              {addingToCart ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <>
                  <Icon source={shoppingBasketBold} size={18} color={colors.onPrimary} />
                  <Text style={styles.primaryActionText}>{t('customer.addToCart')}</Text>
                </>
              )}
            </View>
          </Squeeze>

          <Squeeze
            onPress={handleBuyNow}
            disabled={displayStock <= 0}
            style={[styles.secondaryActionBtn, { backgroundColor: colors.text, opacity: displayStock <= 0 ? 0.5 : 1 }]}>
            <View style={styles.actionBtnRow}>
              <Icon source={shoppingCartExtra} size={18} color={colors.background} />
              <Text style={[styles.secondaryActionText, { color: colors.background }]}>{t('customer.buyNow')}</Text>
            </View>
          </Squeeze>
        </View>

        {/* Web shows this block only when the platform itself listed the product (addedByRole admin) */}
        {product?.raw?.addedByRole === 'admin' && (
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
                  <Text style={[styles.platformName, { color: colors.text }]}>{t('customer.ctiPlatform')}</Text>
                  <Icon source={checkCircleFilled} size={16} color={colors.primary} style={{ marginLeft: 6 }} />
                </View>
                <Text style={[styles.platformSub, { color: colors.textMuted }]}>
                  {t('customer.verifiedAndCertifiedRefurbished')}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Product Information Section: only the fields the backend sends */}
        {[
          [t('customerMsg.specGroup.build'), product?.specs?.buildAndMaterials],
          [t('customerMsg.specGroup.display'), product?.specs?.displayAndVisuals],
          [t('customerMsg.specGroup.performance'), product?.specs?.performance],
          [t('customerMsg.specGroup.camera'), product?.specs?.cameraSystem],
          [t('customerMsg.specGroup.battery'), product?.specs?.batteryAndConnectivity],
        ].some(([, value]) => Boolean(value)) || product?.description ? (
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>{t('customer.productInformation')}</Text>
            <View style={[styles.separator, { backgroundColor: colors.border + '33' }]} />

            {product?.description ? (
              <Text style={[styles.specDesc, { color: colors.textMuted }]}>{product.description}</Text>
            ) : null}

            {[
              [t('customerMsg.specGroup.build'), product?.specs?.buildAndMaterials],
              [t('customerMsg.specGroup.display'), product?.specs?.displayAndVisuals],
              [t('customerMsg.specGroup.performance'), product?.specs?.performance],
              [t('customerMsg.specGroup.camera'), product?.specs?.cameraSystem],
              [t('customerMsg.specGroup.battery'), product?.specs?.batteryAndConnectivity],
            ].map(([title, value]) =>
              value ? (
                <View key={title}>
                  <View style={styles.specBullet}>
                    <View style={[styles.bulletDot, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.specTitle, { color: colors.text }]}>{title}</Text>
                  </View>
                  <Text style={[styles.specDesc, { color: colors.textMuted }]}>{value}</Text>
                </View>
              ) : null,
            )}
          </View>
        ) : null}

        {/* Specifications Table */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>{t('customer.specifications')}</Text>
          <View
            style={[
              styles.specTableCard,
              { backgroundColor: colors.surface, borderColor: colors.border + '44' },
            ]}>
            {[
              [t('customerMsg.specRow.brand'), product?.brand],
              [t('customerMsg.specRow.category'), product?.category],
              [t('customerMsg.specRow.sku'), product?.sku],
              [t('customerMsg.specRow.totalVariants'), product?.totalVariants ? String(product.totalVariants) : ''],
              [t('customerMsg.specRow.condition'), product?.condition],
            ]
              .filter(([, value]) => Boolean(value))
              .map(([label, value], index, rows) => (
                <View
                  key={label}
                  style={[
                    styles.tableRow,
                    index === rows.length - 1 ? { borderBottomWidth: 0 } : { borderBottomColor: colors.border },
                  ]}>
                  <Text style={[styles.tableLabel, { color: colors.textMuted }]}>{label}</Text>
                  <Text style={[styles.tableValue, { color: colors.text }]}>{value}</Text>
                </View>
              ))}
          </View>
        </View>

        {/* Same sections the web shows before the reviews */}
        <GradeExplained deviceType={detectDeviceType(product?.raw?.categoryId?.slug, product?.raw?.categoryId?.name || product?.category)} />
        <PlatformGuarantees />

        {/* Rating & Reviews Section */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>{t('customer.ratingAndReviews')}</Text>

          <View
            style={[
              styles.ratingSummaryCard,
              { backgroundColor: colors.surface, borderColor: colors.border + '44' },
            ]}>
            {reviewCount > 0 ? (
              <View style={[styles.ratingScoreCol, { borderRightColor: colors.border }]}>
                <Text style={[styles.ourRatingLabel, { color: colors.textMuted }]}>{t('customer.ourRating')}</Text>
                <Text style={[styles.ratingScoreLarge, { color: colors.text }]}>
                  {averageRating.toFixed(1)}
                </Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Icon
                      key={s}
                      source={Math.round(averageRating) >= s ? starFilled : starExtra}
                      size={14}
                      color="#F59E0B"
                    />
                  ))}
                </View>
                <Text style={[styles.reviewsCountText, { color: colors.textMuted }]}>
                  ({reviewCount} {reviewCount === 1 ? t('glossary.review') : t('sellerTabs.reviews')})
                </Text>
              </View>
            ) : (
              <Text style={[styles.reviewsCountText, { color: colors.textMuted }]}>
                {t('customer.noReviewsYet')}
              </Text>
            )}
          </View>
        </View>

        {/* Related Products Carousel */}
        {relatedProducts.length > 0 && (
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>
            {t('customer.relatedRefurbishedProducts')}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.relatedScroll}>
            {relatedProducts.map(rel => (
                <TouchableOpacity
                  key={rel?.id}
                  onPress={() =>
                    navigation.push('RefurbishedProductDetail', { productId: rel?.id, product: rel })
                  }
                  style={[
                    styles.relatedCard,
                    { backgroundColor: colors.surface, borderColor: colors.border + '44' },
                  ]}>
                  <Image
                    source={rel?.image || demoProductPhoto}
                    style={styles.relatedImg}
                    resizeMode="contain"
                  />
                  <Text style={[styles.relatedTitle, { color: colors.text }]} numberOfLines={1}>
                    {rel?.name || ''}
                  </Text>
                  <Text style={[styles.relatedPrice, { color: colors.primary }]}>
                    {formatMoney(rel?.price)}
                  </Text>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>
        )}
      </ScrollView>
      )}

      {/* Filter Modal */}
      <RefurbishedFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={filters => navigation.navigate('AllGadgets', { appliedFilters: filters })}
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
  headBadge: {
    position: 'absolute',
    top: -5,
    right: -8,
    minWidth: 15,
    height: 15,
    borderRadius: 7.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  headBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: fonts.bold,
    textAlign: 'center',
    lineHeight: 11,
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
  variantsSection: {
    marginTop: 14,
  },
  variantSectionTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    marginBottom: 8,
  },
  variantsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 10,
  },
  variantChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantChipText: {
    fontSize: 13,
  },
  variantStockText: {
    fontSize: 10,
    fontFamily: fonts.medium,
    marginTop: 2,
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
    flexShrink: 1,
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
    flexShrink: 1,
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
    flexShrink: 1,
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  platformSub: {
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: 2,
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
