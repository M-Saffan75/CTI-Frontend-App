import { useEffect, useRef, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';

import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  chevronDownBold,
  closeIcon,
  imageBold,
  infoCircleBold,
  packageBold,
  tagBold,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { getWebSellerProductAddUrl } from '@/constants/config';
import {
  createSellerProductApi,
  SellerOption,
} from '@/roles/Seller/services/sellerApi';
import { markProductsDirty, openWebsite } from '@/roles/Seller/utils/sellerUtils';
import useProductOptions from '@/roles/Seller/utils/useProductOptions';
import OptionPickerModal from '../components/OptionPickerModal';
import KeyboardSafeView from '@/components/KeyboardSafeView';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

const MAX_IMAGES = 3;

type FieldKey = 'title' | 'modelNumber' | 'description' | 'categoryId' | 'price' | 'stock' | 'images';
type FieldErrors = Partial<Record<FieldKey, string>>;

interface PickedImage {
  uri: string;
  name: string;
  type: string;
}

interface AlertState {
  visible: boolean;
  type: AlertModalType;
  title: string;
  message: string;
  onClose?: () => void;
}

const HIDDEN_ALERT: AlertState = { visible: false, type: 'info', title: '', message: '' };

export default function AddProductScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<SellerOption | null>(null);
  const [brand, setBrand] = useState<SellerOption | null>(null);
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [images, setImages] = useState<PickedImage[]>([]);

  const { categories, brands, error: optionsError, retry: retryOptions } = useProductOptions();
  const [picker, setPicker] = useState<'category' | 'brand' | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [alert, setAlert] = useState<AlertState>(HIDDEN_ALERT);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const clearError = (key: FieldKey) =>
    setErrors(prev => (prev[key] ? { ...prev, [key]: undefined } : prev));

  const pickImages = () => {
    if (images.length >= MAX_IMAGES) {
      setAlert({
        visible: true,
        type: 'warning',
        title: i18n.t('sellerAuto.limitReached'),
        message: i18n.t('sellerMsg.imagesLimit', { max: MAX_IMAGES }),
      });
      return;
    }

    launchImageLibrary(
      { mediaType: 'photo', selectionLimit: MAX_IMAGES - images.length },
      response => {
        if (response.didCancel) return;
        if (response.errorCode) {
          setAlert({
            visible: true,
            type: 'error',
            title: i18n.t('sellerAuto.imageError'),
            message: response.errorMessage || i18n.t('sellerAuto.couldNotSelectTheImage'),
          });
          return;
        }
        const picked: PickedImage[] = (response.assets || [])
          .filter(a => !!a.uri)
          .map((a, i) => ({
            uri: a.uri as string,
            name: a.fileName || `product-${Date.now()}-${i}.jpg`,
            type: a.type || 'image/jpeg',
          }));
        if (picked.length > 0) {
          setImages(prev => [...prev, ...picked].slice(0, MAX_IMAGES));
          clearError('images');
        }
      },
    );
  };

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!title.trim()) next.title = i18n.t('sellerMsg.product.titleReq');
    if (!modelNumber.trim()) next.modelNumber = i18n.t('sellerMsg.product.modelReq');
    if (!description.trim()) next.description = i18n.t('sellerMsg.product.descReq');
    if (!category) next.categoryId = i18n.t('sellerMsg.product.categoryReq');
    const priceNum = Number(price);
    if (!price.trim()) next.price = i18n.t('sellerMsg.product.priceReq');
    else if (!isFinite(priceNum) || priceNum <= 0) next.price = i18n.t('sellerMsg.product.priceInvalid');
    if (stock.trim() && !/^\d+$/.test(stock.trim())) next.stock = i18n.t('sellerMsg.product.stockWhole');
    if (images.length === 0) next.images = i18n.t('sellerMsg.product.imageReq');
    return next;
  };

  const handleCreateProduct = async () => {
    if (submittingRef.current) return;

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('modelNumber', modelNumber.trim());
      formData.append('description', description.trim());
      if (shortDesc.trim()) formData.append('shortDescription', shortDesc.trim());
      formData.append('categoryId', category!.id);
      if (brand) formData.append('brandId', brand.id);
      formData.append('price', String(Number(price)));
      formData.append('stock', String(Number(stock.trim() || '0')));
      formData.append('discountPercentage', '0');
      formData.append('tags', JSON.stringify([]));
      formData.append('warranty[type]', 'no');
      formData.append('warranty[months]', '0');
      images.forEach(img => formData.append('images', img as any));

      const res = await createSellerProductApi(formData);
      markProductsDirty();
      if (!mounted.current) return;
      setAlert({
        visible: true,
        type: 'success',
        title: i18n.t('sellerAuto.productCreated'),
        message: res?.message || i18n.t('sellerAuto.productCreatedSuccessfully'),
        onClose: () => navigation?.goBack(),
      });
    } catch (err: any) {
      if (!mounted.current) return;
      if (err?.fieldErrors) {
        const fieldErrors: FieldErrors = {};
        (['title', 'modelNumber', 'description', 'categoryId'] as FieldKey[]).forEach(key => {
          if (err.fieldErrors[key]) fieldErrors[key] = err.fieldErrors[key];
        });
        if (Object.keys(fieldErrors).length > 0) setErrors(prev => ({ ...prev, ...fieldErrors }));
      }
      setAlert({
        visible: true,
        type: 'error',
        title: i18n.t('sellerAuto.creationFailed'),
        message: err?.message || i18n.t('sellerAuto.couldNotCreateTheProduct'),
      });
    } finally {
      submittingRef.current = false;
      if (mounted.current) setIsSubmitting(false);
    }
  };

  const openFullFormOnWebsite = async () => {
    const opened = await openWebsite(getWebSellerProductAddUrl());
    if (!opened && mounted.current) {
      setAlert({
        visible: true,
        type: 'info',
        title: i18n.t('sellerAuto.openTheWebsite'),
        message: i18n.t('sellerMsg.product.fullForm', { url: getWebSellerProductAddUrl() }),
      });
    }
  };

  const inputStyle = (hasError: boolean) => [
    styles.input,
    {
      backgroundColor: colors.surfaceAlt,
      color: colors.text,
      borderColor: hasError ? colors.error ?? '#EF4444' : colors.border,
    },
  ];

  const errorText = (key: FieldKey) =>
    errors[key] ? (
      <Text style={[styles.errorText, { color: colors.error ?? '#EF4444' }]}>{errors[key]}</Text>
    ) : null;

  const closeAlert = () => {
    const after = alert.onClose;
    setAlert(HIDDEN_ALERT);
    after?.();
  };

  return (
    <KeyboardSafeView
      style={styles.flex}>
      <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <FadeUp delay={20} duration={300}>
            <View style={styles.headerRow}>
              <Squeeze onPress={() => navigation?.goBack()} scale={0.9}>
                <View style={[styles.backBtnCircle, { backgroundColor: colors.primary }]}>
                  <Icon source={arrowLeftBold} size={18} color={colors.onPrimary} />
                </View>
              </Squeeze>
              <View style={styles.flex1}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{t('sellerAuto.addNewProduct')}</Text>
                <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                  {t('sellerAuto.enterTheBasicProductDetails')}
                </Text>
              </View>
            </View>
          </FadeUp>

          <FadeUp delay={50} duration={300}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeaderRow}>
                <Icon source={infoCircleBold} size={18} color={colors.primary} />
                <Text style={[styles.cardSectionTitle, { color: colors.text }]}>{t('sellerAuto.basicInformation')}</Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('sellerAuto.title')}</Text>
                <TextInput
                  style={inputStyle(!!errors.title)}
                  placeholder={t('sellerAuto.eGPremiumCottonT')}
                  placeholderTextColor={colors.textMuted}
                  value={title}
                  editable={!isSubmitting}
                  onChangeText={value => {
                    setTitle(value);
                    clearError('title');
                  }}
                />
                {errorText('title')}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('sellerAuto.modelNumber')}</Text>
                <TextInput
                  style={inputStyle(!!errors.modelNumber)}
                  placeholder={t('sellerAuto.eGMod1234')}
                  placeholderTextColor={colors.textMuted}
                  value={modelNumber}
                  editable={!isSubmitting}
                  autoCapitalize="characters"
                  onChangeText={value => {
                    setModelNumber(value);
                    clearError('modelNumber');
                  }}
                />
                {errorText('modelNumber')}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('sellerAuto.shortDescriptionOptional')}</Text>
                <TextInput
                  style={inputStyle(false)}
                  placeholder={t('sellerAuto.oneLineSummary')}
                  placeholderTextColor={colors.textMuted}
                  value={shortDesc}
                  editable={!isSubmitting}
                  onChangeText={setShortDesc}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('sellerAuto.description')}</Text>
                <TextInput
                  style={[...inputStyle(!!errors.description), styles.textArea]}
                  placeholder={t('sellerAuto.detailProductDescription')}
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={description}
                  editable={!isSubmitting}
                  onChangeText={value => {
                    setDescription(value);
                    clearError('description');
                  }}
                />
                {errorText('description')}
              </View>
            </View>
          </FadeUp>

          <FadeUp delay={80} duration={300}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeaderRow}>
                <Icon source={packageBold} size={18} color={colors.primary} />
                <Text style={[styles.cardSectionTitle, { color: colors.text }]}>{t('sellerAuto.categorization')}</Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('sellerAuto.category')}</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  disabled={isSubmitting}
                  onPress={() => setPicker('category')}
                  style={[
                    styles.selectorBox,
                    {
                      backgroundColor: colors.surfaceAlt,
                      borderColor: errors.categoryId ? colors.error ?? '#EF4444' : colors.border,
                    },
                  ]}>
                  <Text
                    style={[styles.selectorText, { color: category ? colors.text : colors.textMuted }]}
                    numberOfLines={1}>
                    {category ? category.name : t('sellerAuto.selectCategory')}
                  </Text>
                  <Icon source={chevronDownBold} size={14} color={colors.textMuted} />
                </TouchableOpacity>
                {errorText('categoryId')}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('sellerAuto.brandOptional')}</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  disabled={isSubmitting}
                  onPress={() => setPicker('brand')}
                  style={[
                    styles.selectorBox,
                    { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                  ]}>
                  <Text
                    style={[styles.selectorText, { color: brand ? colors.text : colors.textMuted }]}
                    numberOfLines={1}>
                    {brand ? brand.name : t('sellerAuto.selectBrand')}
                  </Text>
                  <Icon source={chevronDownBold} size={14} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          </FadeUp>

          <FadeUp delay={110} duration={300}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeaderRow}>
                <Icon source={tagBold} size={18} color={colors.primary} />
                <Text style={[styles.cardSectionTitle, { color: colors.text }]}>{t('sellerAuto.pricingAndStock')}</Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('sellerAuto.basePrice')}</Text>
                <TextInput
                  style={inputStyle(!!errors.price)}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={price}
                  editable={!isSubmitting}
                  onChangeText={value => {
                    setPrice(value.replace(',', '.'));
                    clearError('price');
                  }}
                />
                {errorText('price')}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('sellerAuto.stock')}</Text>
                <TextInput
                  style={inputStyle(!!errors.stock)}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  value={stock}
                  editable={!isSubmitting}
                  onChangeText={value => {
                    setStock(value);
                    clearError('stock');
                  }}
                />
                {errorText('stock')}
              </View>
            </View>
          </FadeUp>

          <FadeUp delay={140} duration={300}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeaderBetween}>
                <View style={styles.cardHeaderRow}>
                  <Icon source={imageBold} size={18} color={colors.primary} />
                  <Text style={[styles.cardSectionTitle, { color: colors.text }]}>{t('sellerAuto.productImages')}</Text>
                </View>
                <Text style={[styles.countLabel, { color: colors.textMuted }]}>
                  {images.length}/{MAX_IMAGES}
                </Text>
              </View>

              <View style={styles.imagesRow}>
                {images.map((img, index) => (
                  <View
                    key={img.uri}
                    style={[styles.thumbWrap, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}>
                    <Image source={{ uri: img.uri }} style={styles.thumb} resizeMode="cover" />
                    <TouchableOpacity
                      disabled={isSubmitting}
                      onPress={() => setImages(prev => prev.filter((_, i) => i !== index))}
                      style={styles.removeBtn}>
                      <Icon source={closeIcon} size={10} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}

                {images.length < MAX_IMAGES && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    disabled={isSubmitting}
                    onPress={pickImages}
                    style={[
                      styles.dashedBox,
                      { borderColor: errors.images ? colors.error ?? '#EF4444' : colors.border },
                    ]}>
                    <Text style={[styles.dashedPlus, { color: colors.textMuted }]}>+</Text>
                    <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.dashedAddText, { color: colors.textMuted }]}>{t('sellerAuto.add')}</Text>
                  </TouchableOpacity>
                )}
              </View>
              {errorText('images')}
              <Text style={[styles.hintSubtext, { color: colors.textMuted }]}>
                {t('sellerAuto.theFirstImageBecomesThe')}
              </Text>
            </View>
          </FadeUp>

          <FadeUp delay={170} duration={300}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardSectionTitle, { color: colors.text }]}>{t('sellerAuto.needMoreOptions')}</Text>
              <Text style={[styles.hintSubtext, styles.hintLong, { color: colors.textMuted }]}>
                {t('sellerAuto.variantsDiscountsVideosTagsWarranty')}
              </Text>
              <Button
                title={t('sellerAuto.openFullFormOnWebsite')}
                variant="outline"
                size="md"
                disabled={isSubmitting}
                onPress={openFullFormOnWebsite}
              />
            </View>
          </FadeUp>

          <FadeUp delay={200} duration={300}>
            <View style={styles.actionBtnsCol}>
              <Button
                title={isSubmitting ? t('sellerAuto.creating') : t('sellerAuto.createProduct')}
                variant="primary"
                size="lg"
                loading={isSubmitting}
                disabled={isSubmitting}
                onPress={handleCreateProduct}
              />
              <Button
                title={t('common.cancel')}
                variant="outline"
                size="lg"
                disabled={isSubmitting}
                onPress={() => navigation?.goBack()}
              />
            </View>
          </FadeUp>
        </ScrollView>

        <OptionPickerModal
          visible={picker === 'category'}
          title={t('sellerAuto.selectCategory')}
          options={categories}
          error={optionsError}
          onRetry={retryOptions}
          selectedId={category?.id}
          onSelect={option => {
            setCategory(option);
            clearError('categoryId');
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
        <OptionPickerModal
          visible={picker === 'brand'}
          title={t('sellerAuto.selectBrand')}
          options={brands}
          error={optionsError}
          onRetry={retryOptions}
          selectedId={brand?.id}
          clearLabel={t('sellerAuto.noBrand')}
          onSelect={option => {
            setBrand(option);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />

        <AlertModal
          visible={alert.visible}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={closeAlert}
        />
      </View>
    </KeyboardSafeView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flex1: { flex: 1 },
  hintLong: { lineHeight: 18 },
  screen: { flex: 1 },
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 4,
  },
  backBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  headerTitle: { fontFamily: fonts.bold, fontSize: 24 },
  headerSubtitle: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, marginTop: 4 },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardSectionTitle: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 16 },
  countLabel: { fontFamily: fonts.medium, fontSize: 12 },

  fieldGroup: { gap: 6 },
  fieldLabel: { fontFamily: fonts.medium, fontSize: 13 },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  textArea: { minHeight: 88, paddingTop: 10 },
  selectorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectorText: { fontFamily: fonts.regular, fontSize: 13, flex: 1 },
  errorText: { fontFamily: fonts.medium, fontSize: 12 },

  imagesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  thumbWrap: {
    width: 88,
    height: 88,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  thumb: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashedBox: {
    width: 88,
    height: 88,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashedPlus: { fontSize: 24, fontFamily: fonts.regular },
  dashedAddText: { fontFamily: fonts.medium, fontSize: 12 },
  hintSubtext: { fontFamily: fonts.regular, fontSize: 12 },

  actionBtnsCol: { gap: 10 },
});
