import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import Squeeze from '@/components/Squeeze';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import CtiLoader from '@/components/CtiLoader';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  cameraBold,
  checkCircleIcon,
  checkCircleFilled,
  closeIcon,
  commentDotsBold,
  discountBold,
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
  trashBold,
  videoBold,
} from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useWishlist } from '../../../context/WishlistContext';
import { useCart } from '../../../context/CartContext';
import AuthService from '@/services/authService';
import {
  addToCartApi,
  checkReviewEligibilityApi,
  deleteProductReviewApi,
  getEcomProductDetail,
  getEcomProducts,
  getProductReviewsApi,
  MobileEcomProduct,
  resolveImageSource,
  submitProductReviewApi,
} from '../services/ecomApi';
import { demoProductPhoto } from '@/assets/images';
import { startChat } from '@/services/chatApi';
import AskSellerModal from '../components/AskSellerModal';

function ImageCarousel({ images }: { images?: any[] }) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);

  const safeImages = Array.isArray(images) && images.length > 0
    ? images.map(img => resolveImageSource(img, demoProductPhoto))
    : [demoProductPhoto];

  const onScrollEnd = (event: any) => {
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
        {safeImages.map((source, i) => (
          <Image key={i} source={source} style={{ width, height: 260 }} resizeMode="cover" />
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {safeImages.map((_, i) => (
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
  const displayVal = typeof value === 'object' && value !== null
    ? (value.name || value.title || '')
    : String(value ?? '');
  return (
    <View style={[styles.specRow, alt && { backgroundColor: colors.surfaceAlt }]}>
      <Text style={[styles.specLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.specValue, { color: colors.text }]}>{displayVal}</Text>
    </View>
  );
}

function VariantCard({ variant, selected, onPress }: any) {
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
        <Image source={resolveImageSource(variant.image, demoProductPhoto)} style={styles.variantImage} />
        <View style={styles.variantHeadText}>
          <Text style={[styles.variantLabel, { color: colors.text }]} numberOfLines={1}>{variant.label}</Text>
          {variant.verified && (
            <View style={[styles.verifiedPill, { backgroundColor: colors.success + '22' }]}>
              <Text style={[styles.verifiedText, { color: colors.success }]}>VERIFIED</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.variantFoot}>
        <Text style={[styles.variantPrice, { color: colors.primary }]}>${Number(variant.price || 0).toFixed(2)}</Text>
        <View style={[styles.stockPill, { backgroundColor: colors.success + '22' }]}>
          <Text style={[styles.stockText, { color: colors.success }]}>{variant.stockLeft ?? 5} left</Text>
        </View>
      </View>
    </Squeeze>
  );
}

function RelatedCard({ product, navigation }: any) {
  const { colors } = useTheme();
  const { isSaved, toggle } = useWishlist();
  const saved = isSaved(product.id);

  return (
    <Squeeze
      onPress={() => navigation.push('ProductDetail', { productId: product.id, slug: product.slug, product })}
      style={[styles.relatedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View>
        <Image source={resolveImageSource(product.image, demoProductPhoto)} style={styles.relatedPhoto} />
        <Image source={ctiLogo} resizeMode="contain" style={styles.relatedLogo} />
        <Squeeze
          onPress={() => toggle(product.id, product)}
          scale={0.85}
          style={[styles.relatedHeart, { backgroundColor: colors.surface }]}>
          <Icon source={saved ? heartFilled : heartExtra} size={14} color={saved ? colors.error : colors.text} />
        </Squeeze>
      </View>
      <View style={styles.relatedBody}>
        <Text style={[styles.relatedBrand, { color: colors.textMuted }]} numberOfLines={1}>
          {typeof product.brand === 'string' ? product.brand : (product.brand as any)?.title || (product.brand as any)?.name || 'CTI Store'}
        </Text>
        <Text style={[styles.relatedTitle, { color: colors.text }]} numberOfLines={1}>
          {typeof product.title === 'string' ? product.title : (product.title as any)?.title || (product.title as any)?.name || 'Product'}
        </Text>
        <Text style={[styles.relatedPrice, { color: colors.text }]}>${Number(product.price || 0).toFixed(2)}</Text>
      </View>
    </Squeeze>
  );
}

export default function ProductDetailScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const initialProduct = route.params?.product || null;
  const productId = route.params?.productId || initialProduct?.id;
  const productSlug = route.params?.slug || initialProduct?.slug;
  const [product, setProduct] = useState<MobileEcomProduct | null>(initialProduct);
  const [loading, setLoading] = useState<boolean>(!initialProduct && (!!productSlug || !!productId));
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [askModalVisible, setAskModalVisible] = useState(false);
  const [related, setRelated] = useState<MobileEcomProduct[]>([]);

  const { isSaved, toggle: toggleWishlist } = useWishlist();
  const { cartCount, addToCart } = useCart();
  const saved = product?.id ? isSaved(product.id) : false;
  const [color, setColor] = useState(initialProduct?.colors?.[0] || '#222222');
  const [quantity, setQuantity] = useState(1);
  const [variantId, setVariantId] = useState(initialProduct?.variants?.[0]?.id);
  const [myRating, setMyRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewPhoto, setReviewPhoto] = useState<any>(null);
  const [reviewVideo, setReviewVideo] = useState<any>(null);
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  // Load current user ID for review owner actions
  useEffect(() => {
    AuthService.getStoredSession()
      .then(session => {
        const uid = session?.user?._id || session?.user?.id;
        if (uid) setCurrentUserId(String(uid));
      })
      .catch(() => {});
  }, []);

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

  // Whenever the active product, productId, or slug params change, update the state immediately!
  useEffect(() => {
    const freshProduct = route.params?.product || null;
    if (freshProduct) {
      setProduct(freshProduct);
      setQuantity(1);
      if (freshProduct.variants?.length) {
        const defaultOrFirst =
          freshProduct.variants.find((v: any) => v.id && v.id.length === 24) || freshProduct.variants[0];
        setVariantId(defaultOrFirst.id);
      }
      if (freshProduct.colors?.length) {
        setColor(freshProduct.colors[0]);
      }
    }
  }, [route.params?.product, route.params?.productId, route.params?.slug]);

  useEffect(() => {
    // Prefer productSlug over productId because backend /e-commerce/products/:slug expects slug
    const lookupKey = productSlug || productId;
    if (!lookupKey) return;
    let isMounted = true;
    if (!initialProduct && !product) setLoading(true);

    getEcomProductDetail(lookupKey)
      .then(liveProd => {
        if (isMounted && liveProd) {
          setProduct(liveProd);
          if (liveProd.variants?.length) {
            const defaultOrFirst = liveProd.variants.find(v => v.id && v.id.length === 24) || liveProd.variants[0];
            setVariantId(defaultOrFirst.id);
          }
          if (liveProd.colors?.length) {
            setColor(liveProd.colors[0]);
          }

          // Fetch real related products
          getEcomProducts()
            .then(prods => {
              if (isMounted && Array.isArray(prods)) {
                setRelated(prods.filter(p => p.id !== liveProd.id).slice(0, 8));
              }
            })
            .catch(() => {});

          // Fetch product reviews
          const reviewKey = liveProd.slug || lookupKey;
          getProductReviewsApi(reviewKey)
            .then(revs => {
              if (isMounted && Array.isArray(revs)) {
                setReviewsList(revs);
              }
            })
            .catch(() => {});
        } else if (isMounted && !product && !initialProduct) {
          setProduct(null);
        }
      })
      .catch(() => {
        if (isMounted && !product && !initialProduct) {
          setProduct(null);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [productId, productSlug]);

  const activeVariant =
    (product?.variants || []).find((v: any) => v.id === variantId) ||
    product?.variants?.[0] ||
    null;
  const activePrice = activeVariant ? Number(activeVariant.price || product?.price || 0) : Number(product?.price || 0);
  const activeOriginalPrice = activeVariant?.originalPrice || (product as any)?.originalPrice || activePrice;
  const hasDiscount = activeOriginalPrice > activePrice;
  const discountPercent = hasDiscount ? Math.round(((activeOriginalPrice - activePrice) / activeOriginalPrice) * 100) : null;
  const activeStock = activeVariant ? Number(activeVariant.stockLeft ?? 5) : Number((product as any)?.stock ?? 5);
  const inStock = activeStock > 0;

  const handleAddToCart = async () => {
    if (!product?.id || addingToCart || buyingNow) return;
    try {
      setAddingToCart(true);
      const chosenVarId = activeVariant?.id || variantId;
      await addToCart(product.id, chosenVarId, quantity);
      navigation.navigate('Cart');
    } catch (err: any) {
      setModal({
        visible: true,
        type: 'error',
        title: 'Add to Cart Failed',
        message: err?.message || 'Could not add product to cart. Please try again.',
      });
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product?.id || addingToCart || buyingNow) return;
    try {
      setBuyingNow(true);
      const chosenVarId = activeVariant?.id || variantId;
      await addToCart(product.id, chosenVarId, quantity);
      const unitPrice = activePrice;
      const subtotalVal = unitPrice * quantity;
      const shippingVal = 10;
      navigation.navigate('Checkout', {
        cartItems: [
          {
            id: chosenVarId ? `${product.id}-${chosenVarId}` : product.id,
            productId: product.id,
            variantId: chosenVarId,
            title: product.title,
            price: unitPrice,
            quantity,
            image: activeVariant?.image || product.image,
            product,
          },
        ],
        subtotal: subtotalVal,
        shipping: shippingVal,
        total: subtotalVal + shippingVal,
      });
    } catch (err: any) {
      setModal({
        visible: true,
        type: 'error',
        title: 'Checkout Error',
        message: err?.message || 'Could not proceed to checkout.',
      });
    } finally {
      setBuyingNow(false);
    }
  };

  const handleVisitStore = () => {
    const sId = product?.seller?.id || product?.raw?.sellerId?._id || (typeof product?.raw?.sellerId === 'string' ? product?.raw?.sellerId : undefined);
    navigation.navigate('SellerStore', {
      sellerId: sId,
      sellerName: product?.seller?.name,
      seller: product?.seller,
    });
  };

  const handleAskSeller = () => {
    setAskModalVisible(true);
  };

  const handleDirectChat = async () => {
    const sId = product?.seller?.id || product?.raw?.sellerId?._id || (typeof product?.raw?.sellerId === 'string' ? product?.raw?.sellerId : undefined);
    if (!sId) {
      navigation.navigate('ChatList');
      return;
    }
    try {
      const res = await startChat({ sellerId: sId });
      if (res.success && res.chat) {
        navigation.navigate('ChatDetail', {
          conversationId: res.chat._id || res.chat.id,
          participant: {
            name: product.seller?.name || 'Seller',
            avatar: product.seller?.avatar,
          },
        });
      } else {
        navigation.navigate('ChatList');
      }
    } catch {
      navigation.navigate('ChatList');
    }
  };

  const submitReview = async () => {
    if (submittingReview) return;

    // 1. Validation: Star rating is required
    if (!myRating || myRating < 1) {
      setModal({
        visible: true,
        type: 'warning',
        title: 'Rating Required',
        message: 'Please select a star rating (1 to 5 stars) for this product.',
      });
      return;
    }

    // 2. Validation: Review comment is required
    if (!reviewText.trim()) {
      setModal({
        visible: true,
        type: 'warning',
        title: 'Review Message Required',
        message: 'Please write your review comment. Both star rating and a message are required to submit a review.',
      });
      return;
    }

    if (reviewText.trim().length < 5) {
      setModal({
        visible: true,
        type: 'warning',
        title: 'Review Too Short',
        message: 'Please write at least a few words describing your experience with the product.',
      });
      return;
    }

    const lookupKey = product?.slug || productSlug || product?.id || productId;
    if (!lookupKey) return;

    try {
      setSubmittingReview(true);
      const res = await submitProductReviewApi(lookupKey, {
        rating: myRating,
        comment: reviewText.trim(),
        photoUri: reviewPhoto?.uri || (typeof reviewPhoto === 'string' ? reviewPhoto : null),
        photoType: reviewPhoto?.type,
        photoName: reviewPhoto?.fileName,
        videoUri: reviewVideo?.uri || (typeof reviewVideo === 'string' ? reviewVideo : null),
        videoType: reviewVideo?.type,
        videoName: reviewVideo?.fileName,
      });

      if (res.success) {
        setModal({
          visible: true,
          type: 'success',
          title: 'Review Submitted',
          message: 'Thank you! Your review has been submitted successfully.',
        });
        setMyRating(0);
        setReviewText('');
        setReviewPhoto(null);
        setReviewVideo(null);

        // Instantly reflect the newly created review in the UI
        if (res.data) {
          setReviewsList(prev => [res.data, ...prev.filter(r => r._id !== res.data._id)]);
        }

        // Refresh reviews list
        getProductReviewsApi(lookupKey)
          .then(revs => {
            if (Array.isArray(revs)) setReviewsList(revs);
          })
          .catch(() => {});

        // Refresh product details to update rating and review count
        getEcomProductDetail(lookupKey)
          .then(live => {
            if (live) setProduct(live);
          })
          .catch(() => {});
      }
    } catch (err: any) {
      setModal({
        visible: true,
        type: 'error',
        title: 'Review Submission Failed',
        message: err?.message || 'Unable to submit review. Please try again.',
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    const lookupKey = product?.slug || productSlug || product?.id || productId;
    if (!lookupKey || !reviewId || deletingReviewId) return;

    try {
      setDeletingReviewId(reviewId);
      await deleteProductReviewApi(lookupKey, reviewId);
      setReviewsList(prev => prev.filter(r => r._id !== reviewId));
      setModal({
        visible: true,
        type: 'success',
        title: 'Review Deleted',
        message: 'Your review has been removed.',
      });
      getEcomProductDetail(lookupKey)
        .then(live => {
          if (live) setProduct(live);
        })
        .catch(() => {});
    } catch (err: any) {
      setModal({
        visible: true,
        type: 'error',
        title: 'Delete Failed',
        message: err?.message || 'Could not delete review.',
      });
    } finally {
      setDeletingReviewId(null);
    }
  };

  const pickPhoto = () => {
    launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 }, response => {
      const asset = response.assets?.[0];
      if (asset?.uri) setReviewPhoto(asset);
    });
  };

  const pickVideo = () => {
    launchImageLibrary({ mediaType: 'video', selectionLimit: 1 }, response => {
      const asset = response.assets?.[0];
      if (asset?.uri) setReviewVideo(asset);
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Image source={ctiLogo} resizeMode="contain" style={styles.logo} />
        <View style={styles.headerIcons}>
          <Squeeze onPress={() => product?.id && toggleWishlist(product.id, product)} scale={0.85}>
            <Icon source={saved ? heartFilled : heartExtra} size={22} color={saved ? colors.error : colors.text} />
          </Squeeze>
          <Squeeze onPress={() => navigation.navigate('Cart')} scale={0.85}>
            <View>
              <Icon source={shoppingCartExtra} size={22} color={colors.text} />
              {cartCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>{cartCount}</Text>
                </View>
              )}
            </View>
          </Squeeze>
          <Squeeze onPress={() => navigation.navigate('Settings')} scale={0.85}>
            <Icon source={menuBold} size={22} color={colors.text} />
          </Squeeze>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <CtiLoader size="lg" text="Loading product details..." />
        </View>
      ) : !product ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Icon source={packageBold} size={54} color={colors.textMuted} />
          <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: colors.text, marginTop: 16 }}>
            Product Not Found
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, marginTop: 8, textAlign: 'center' }}>
            The requested product is not available or could not be loaded.
          </Text>
          <Squeeze onPress={() => navigation.goBack()} style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: 12 }}>
            <Text style={{ color: '#fff', fontFamily: fonts.bold }}>Go Back</Text>
          </Squeeze>
        </View>
      ) : (
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
            <ImageCarousel images={product.images || [product.image]} />
          </View>
        </FadeUp>

        <FadeUp delay={110} duration={450}>
          {/* Brand & Category badges */}
          <View style={styles.badgeRow}>
            {product.brand ? (
              <View style={[styles.badgePill, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '35' }]}>
                <Text style={[styles.badgePillText, { color: colors.primary }]}>
                  {typeof product.brand === 'string' ? product.brand : (product.brand as any)?.title || 'Store'}
                </Text>
              </View>
            ) : null}
            {product.category ? (
              <View style={[styles.badgePill, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Text style={[styles.badgePillText, { color: colors.textMuted }]}>
                  {typeof product.category === 'string' ? product.category : (product.category as any)?.title || 'Electronics'}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Product Title (Full Width) */}
          <Text style={[styles.title, { color: colors.text }]}>{product.title}</Text>

          {/* Price Section - Below Title in proper format */}
          <View style={styles.priceContainer}>
            <View style={styles.priceRow}>
              <Text style={[styles.mainPrice, { color: colors.text }]}>
                ${activePrice.toFixed(2)}
              </Text>
              {hasDiscount && (
                <Text style={[styles.originalPrice, { color: colors.textMuted }]}>
                  ${activeOriginalPrice.toFixed(2)}
                </Text>
              )}
              {discountPercent ? (
                <View style={[styles.discountBadge, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.discountText, { color: colors.primary }]}>-{discountPercent}% OFF</Text>
                </View>
              ) : null}
            </View>

            <View style={[styles.stockRow, { backgroundColor: inStock ? '#10B98118' : '#EF444418' }]}>
              <View style={[styles.stockDot, { backgroundColor: inStock ? '#10B981' : '#EF4444' }]} />
              <Text style={[styles.stockStatusText, { color: inStock ? '#10B981' : '#EF4444' }]}>
                {inStock ? `In Stock (${activeStock} left)` : 'Out of Stock'}
              </Text>
            </View>
          </View>
        </FadeUp>

        {/* Available Variants */}
        {product.variants && product.variants.length > 0 && (
          <FadeUp delay={140} duration={450}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.label, { color: colors.text, marginTop: 0 }]}>Available Variants</Text>
              {activeVariant && (
                <Text style={[styles.selectedVariantNote, { color: colors.primary }]} numberOfLines={1}>
                  {activeVariant.label}
                </Text>
              )}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.bleed}
              contentContainerStyle={styles.variantsRow}>
              {product.variants.map(variant => (
                <VariantCard
                  key={variant.id}
                  variant={variant}
                  selected={variant.id === (activeVariant?.id || variantId)}
                  onPress={() => setVariantId(variant.id)}
                />
              ))}
            </ScrollView>
          </FadeUp>
        )}

        {product.colors && product.colors.length > 0 && (
          <FadeUp delay={160} duration={450}>
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
        )}

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

          <Button
            title="Buy Now"
            variant="outline"
            loading={buyingNow}
            disabled={addingToCart || buyingNow}
            onPress={handleBuyNow}
            style={styles.spaced}
          />
          <Button
            title="Add to Cart"
            icon={shoppingCartExtra}
            loading={addingToCart}
            disabled={addingToCart || buyingNow}
            onPress={handleAddToCart}
            style={styles.spaced}
          />
        </FadeUp>

        <FadeUp delay={230} duration={450}>
          <View style={[styles.sellerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sellerHead}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleVisitStore}
                style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
                <Image source={resolveImageSource(product.seller?.avatar, demoProductPhoto)} style={styles.sellerAvatar} />
                <View style={styles.sellerInfo}>
                  <Text style={[styles.sellerName, { color: colors.text }]}>{product.seller?.name || 'Verified Seller'}</Text>
                  <Text style={[styles.sellerLocation, { color: colors.textMuted }]} numberOfLines={1}>
                    {product.seller?.location || 'Karachi, Pakistan'}
                  </Text>
                </View>
              </TouchableOpacity>
              <Button title="Visit Store" size="sm" fullWidth={false} onPress={handleVisitStore} />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Button
              title="Ask Seller"
              variant="outline"
              icon={commentDotsBold}
              iconPosition="left"
              onPress={handleAskSeller}
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
            <SpecRow label="Brand" value={product.specs?.brand || product.brand} alt />
            <SpecRow label="SKU" value={product.specs?.sku || `SKU-${String(product.id || '').slice(-6)}`} />
            <SpecRow label="Category" value={product.specs?.category || product.category || 'Electronics'} alt />
            <SpecRow label="Total Variants" value={product.specs?.totalVariants || product.variants?.length || 1} />
            <SpecRow label="Total Stock" value={product.specs?.totalStock ?? (product.inStock ? 10 : 0)} alt />
            <SpecRow label="Price Range" value={product.specs?.priceRange || `$${Number(product.price || 0).toFixed(2)}`} />
            <SpecRow label="Warranty" value={product.specs?.warranty || '1 Year Official Warranty'} alt />
          </View>
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
                <Text style={[styles.ratingNumber, { color: colors.text }]}>{Number(product.rating || 4.5).toFixed(1)}</Text>
                <Text style={[styles.reviewCount, { color: colors.textMuted }]}>
                  ({product.reviewCount || 0} Reviews)
                </Text>
              </View>

              <View style={styles.ratingBars}>
                {(product.reviewBreakdown || [
                  { stars: 5, percent: 80 },
                  { stars: 4, percent: 15 },
                  { stars: 3, percent: 5 },
                  { stars: 2, percent: 0 },
                  { stars: 1, percent: 0 },
                ]).map(row => (
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

        {/* Customer Reviews List */}
        <FadeUp delay={450} duration={450}>
          <View style={styles.reviewsListContainer}>
            <Text style={[styles.reviewsListTitle, { color: colors.text }]}>
              Customer Reviews {reviewsList.length > 0 ? `(${reviewsList.length})` : ''}
            </Text>
            {reviewsList.length === 0 ? (
              <View style={[styles.emptyReviewsCard, { borderColor: colors.border }]}>
                <Text style={[styles.emptyReviewsText, { color: colors.textMuted }]}>
                  No reviews yet. Be the first to review this product!
                </Text>
              </View>
            ) : (
              reviewsList.map(item => {
                const authorName = item.userId?.name || 'Customer';
                const firstLetter = authorName.charAt(0).toUpperCase();
                const isOwner =
                  currentUserId && item.userId?._id && String(item.userId._id) === String(currentUserId);
                const reviewDate = item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString()
                  : '';

                return (
                  <View
                    key={item._id || Math.random().toString()}
                    style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <View style={styles.reviewCardHeader}>
                      <View style={styles.reviewUserRow}>
                        <View style={[styles.reviewAvatar, { backgroundColor: colors.primary }]}>
                          {item.userId?.profilePhoto ? (
                            <Image source={{ uri: item.userId.profilePhoto }} style={styles.reviewAvatarImg} />
                          ) : (
                            <Text style={styles.reviewAvatarText}>{firstLetter}</Text>
                          )}
                        </View>
                        <View style={styles.reviewUserInfo}>
                          <Text style={[styles.reviewUserName, { color: colors.text }]} numberOfLines={1}>
                            {authorName}
                          </Text>
                          {reviewDate ? (
                            <Text style={[styles.reviewDate, { color: colors.textMuted }]}>{reviewDate}</Text>
                          ) : null}
                        </View>
                      </View>

                      <View style={styles.reviewHeaderActions}>
                        <View style={styles.reviewStarsRow}>
                          {[1, 2, 3, 4, 5].map(s => (
                            <Icon
                              key={s}
                              source={starExtra}
                              size={13}
                              color={s <= (item.rating || 5) ? colors.primary : colors.border}
                            />
                          ))}
                        </View>
                        {isOwner && (
                          <TouchableOpacity
                            onPress={() => handleDeleteReview(item._id)}
                            disabled={deletingReviewId === item._id}
                            style={styles.deleteReviewBtn}
                          >
                            <Icon
                              source={trashBold}
                              size={15}
                              color={deletingReviewId === item._id ? colors.textMuted : colors.error}
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    {item.comment ? (
                      <Text style={[styles.reviewComment, { color: colors.text }]}>{item.comment}</Text>
                    ) : null}

                    {((item.images && item.images.length > 0) || item.video?.url) && (
                      <View style={styles.reviewMediaRow}>
                        {(item.images || []).map((img: any, idx: number) => {
                          const uri = typeof img === 'string' ? img : img?.url;
                          if (!uri) return null;
                          return (
                            <Image key={idx} source={{ uri }} style={styles.reviewMediaThumb} resizeMode="cover" />
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        </FadeUp>

        <FadeUp delay={470} duration={450}>
          <View style={[styles.reviewFormCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardHeading, { color: colors.text }]}>Write a Review</Text>
            <Text style={[styles.cardSubheading, { color: colors.textMuted }]}>
              Share your experience with other customers
            </Text>

            <View style={styles.reviewLabelRow}>
              <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>
                Your Rating <Text style={{ color: colors.error }}>*</Text>
              </Text>
              {myRating > 0 && (
                <Text style={[styles.selectedRatingText, { color: colors.primary }]}>
                  {myRating} / 5 {myRating === 1 ? 'Star' : 'Stars'}
                </Text>
              )}
            </View>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map(n => (
                <Squeeze key={n} onPress={() => setMyRating(n)} scale={0.85}>
                  <Icon source={starExtra} size={24} color={n <= myRating ? colors.primary : colors.border} />
                </Squeeze>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.text, marginTop: 14 }]}>
              Your Review <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <TextInput
              value={reviewText}
              onChangeText={setReviewText}
              placeholder="Write your review here (required)..."
              placeholderTextColor={colors.textMuted}
              multiline
              style={[styles.reviewInput, { color: colors.text, borderColor: colors.border }]}
            />

            <View style={styles.photoRow}>
              <View style={styles.photoBtnWrapper}>
                <Squeeze onPress={pickPhoto} style={[styles.photoBtn, { borderColor: colors.border }]}>
                  <View style={styles.photoBtnInner}>
                    {reviewPhoto ? (
                      <Image source={{ uri: reviewPhoto?.uri || reviewPhoto }} style={styles.photoThumb} />
                    ) : (
                      <Icon source={cameraBold} size={16} color={colors.text} />
                    )}
                    <Text style={[styles.photoBtnText, { color: colors.text }]} numberOfLines={1}>
                      {reviewPhoto ? 'Photo added' : 'Add a photo'}
                    </Text>
                  </View>
                </Squeeze>
                {reviewPhoto ? (
                  <TouchableOpacity onPress={() => setReviewPhoto(null)} style={styles.removeMediaBtn}>
                    <Icon source={closeIcon} size={12} color={colors.error} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <View style={styles.photoBtnWrapper}>
                <Squeeze onPress={pickVideo} style={[styles.photoBtn, { borderColor: colors.border }]}>
                  <View style={styles.photoBtnInner}>
                    <Icon source={reviewVideo ? checkCircleIcon : videoBold} size={16} color={reviewVideo ? colors.success : colors.text} />
                    <Text style={[styles.photoBtnText, { color: colors.text }]} numberOfLines={1}>
                      {reviewVideo ? 'Video added' : 'Add a video'}
                    </Text>
                  </View>
                </Squeeze>
                {reviewVideo ? (
                  <TouchableOpacity onPress={() => setReviewVideo(null)} style={styles.removeMediaBtn}>
                    <Icon source={closeIcon} size={12} color={colors.error} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            <Button
              title={submittingReview ? 'Submitting...' : 'Submit Review'}
              onPress={submitReview}
              loading={submittingReview}
              disabled={submittingReview}
              style={styles.spaced}
            />
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

        {related.length > 0 && (
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
        )}
      </ScrollView>
      )}

      <AlertModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal(prev => ({ ...prev, visible: false }))}
      />

      <AskSellerModal
        visible={askModalVisible}
        sellerId={product?.seller?.id || product?.raw?.sellerId?._id || (typeof product?.raw?.sellerId === 'string' ? product?.raw?.sellerId : '')}
        sellerName={product?.seller?.name || 'Seller'}
        productTitle={product?.title || ''}
        onClose={() => setAskModalVisible(false)}
        onSuccess={() => {
          setModal({
            visible: true,
            type: 'success',
            title: 'Message Sent',
            message: 'Your message has been sent to the seller!',
          });
        }}
        onOpenLiveChat={handleDirectChat}
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

  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, marginBottom: 4 },
  badgePill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  badgePillText: { fontFamily: fonts.bold, fontSize: 11, textTransform: 'uppercase' },

  title: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 28, marginTop: 4 },

  priceContainer: { marginTop: 12, marginBottom: 4, gap: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' },
  mainPrice: { fontFamily: fonts.bold, fontSize: 26 },
  originalPrice: { fontFamily: fonts.regular, fontSize: 16, textDecorationLine: 'line-through' },
  discountBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  discountText: { fontFamily: fonts.bold, fontSize: 12 },

  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  stockDot: { width: 7, height: 7, borderRadius: 4 },
  stockStatusText: { fontFamily: fonts.medium, fontSize: 12 },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 6,
  },
  selectedVariantNote: { fontFamily: fonts.medium, fontSize: 12, maxWidth: '60%' },

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

  variantsRow: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  variantCard: { width: 205, borderRadius: 14, borderWidth: 1.5, padding: 14, gap: 12 },
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
  photoBtnWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  removeMediaBtn: {
    padding: 6,
    borderRadius: 12,
  },
  reviewLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  selectedRatingText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },

  reviewsListContainer: {
    marginTop: 16,
    gap: 10,
  },
  reviewsListTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  emptyReviewsCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyReviewsText: {
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  reviewCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  reviewAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  reviewAvatarImg: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  reviewAvatarText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  reviewUserInfo: {
    flex: 1,
  },
  reviewUserName: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  reviewDate: {
    fontFamily: fonts.regular,
    fontSize: 11,
    marginTop: 1,
  },
  reviewHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewStarsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  deleteReviewBtn: {
    padding: 4,
    borderRadius: 6,
  },
  reviewComment: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  reviewMediaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  reviewMediaThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#00000010',
  },

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
});
