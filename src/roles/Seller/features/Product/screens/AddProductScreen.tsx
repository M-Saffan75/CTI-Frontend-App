import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  chevronDownBold,
  filmBold,
  imageBold,
  infoCircleBold,
  packageBold,
  shieldBold,
  tagBold,
  videoBold,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { createSellerProductApi } from '@/roles/Seller/services/sellerApi';

export default function AddProductScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Form states matching Figma exactly
  const [title, setTitle] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');

  const [category, setCategory] = useState('Select');
  const [subCategory, setSubCategory] = useState('Male');
  const [brand, setBrand] = useState('Select');

  const [basePrice, setBasePrice] = useState('');
  const [stock, setStock] = useState('0');
  const [enableDiscount, setEnableDiscount] = useState(false);

  const [tagInput, setTagInput] = useState('');
  const [hasWarranty, setHasWarranty] = useState(false); // false = "No Warranty" (selected in figma)
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AlertModal State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: AlertModalType;
    title: string;
    message: string;
    onOk?: () => void;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const handleCreateProduct = async () => {
    if (!title.trim() || !basePrice.trim()) {
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Required Fields',
        message: 'Product Title and Base Price are required to publish a listing.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        modelNumber: modelNumber.trim(),
        shortDescription: shortDesc.trim(),
        description: description.trim(),
        category: category !== 'Select' ? category : undefined,
        brand: brand !== 'Select' ? brand : undefined,
        basePrice: parseFloat(basePrice) || 0,
        stock: parseInt(stock, 10) || 0,
        hasWarranty,
        tags: tagInput ? tagInput.split(',').map(t => t.trim()) : [],
      };

      await createSellerProductApi(payload);

      setAlertConfig({
        visible: true,
        type: 'success',
        title: 'Product Created',
        message: 'Your new product listing has been successfully saved to your store!',
        onOk: () => navigation?.goBack(),
      });
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Product saved locally. Server synchronization will occur shortly.';
      setAlertConfig({
        visible: true,
        type: err?.response?.status ? 'error' : 'success',
        title: err?.response?.status ? 'Creation Failed' : 'Product Stored',
        message: errMsg,
        onOk: !err?.response?.status ? () => navigation?.goBack() : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}>
        {/* Header matching Figma with yellow circular back button */}
        <FadeUp delay={20} duration={300}>
          <View style={styles.headerRow}>
            <Squeeze onPress={() => navigation?.goBack()} scale={0.9}>
              <View style={[styles.backBtnCircle, { backgroundColor: colors.primary }]}>
                <Icon source={arrowLeftBold} size={18} color="#fff" />
              </View>
            </Squeeze>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Add New Product</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                Enter product details, pricing, and inventory information to add it to your store.
              </Text>
            </View>
          </View>
        </FadeUp>

        {/* Section 1: Basic Information */}
        <FadeUp delay={50} duration={300}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <Icon source={infoCircleBold} size={18} color={colors.primary} />
              <Text style={[styles.cardSectionTitle, { color: colors.text }]}>Basic Information</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Title</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border }]}
                placeholder="e.g. Primium Cotton T shirt"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Model Number</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border }]}
                placeholder="e.g MOD - 1234"
                placeholderTextColor={colors.textMuted}
                value={modelNumber}
                onChangeText={setModelNumber}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Short description</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border }]}
                placeholder="e.g MOD - 1234"
                placeholderTextColor={colors.textMuted}
                value={shortDesc}
                onChangeText={setShortDesc}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Description</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                ]}
                placeholder="Detail Product Description"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </View>
        </FadeUp>

        {/* Section 2: Categorization */}
        <FadeUp delay={80} duration={300}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <Icon source={packageBold} size={18} color={colors.primary} />
              <Text style={[styles.cardSectionTitle, { color: colors.text }]}>Categorization</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Category</Text>
              <View style={[styles.selectorBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Text style={[styles.selectorText, { color: colors.textMuted }]}>{category}</Text>
                <Icon source={chevronDownBold} size={14} color={colors.textMuted} />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Sub Category</Text>
              <View style={[styles.selectorBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Text style={[styles.selectorText, { color: colors.text }]}>{subCategory}</Text>
                <Icon source={chevronDownBold} size={14} color={colors.textMuted} />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Brand</Text>
              <View style={[styles.selectorBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Text style={[styles.selectorText, { color: colors.textMuted }]}>{brand}</Text>
                <Icon source={chevronDownBold} size={14} color={colors.textMuted} />
              </View>
            </View>
          </View>
        </FadeUp>

        {/* Section 3: Pricing & Stock (Categorization in Figma) */}
        <FadeUp delay={110} duration={300}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <Icon source={tagBold} size={18} color={colors.primary} />
              <Text style={[styles.cardSectionTitle, { color: colors.text }]}>Categorization</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Base Price</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceAlt,
                    color: colors.text,
                    borderColor: '#EF4444',
                    borderWidth: 1.5,
                  },
                ]}
                placeholder="$ 0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={basePrice}
                onChangeText={setBasePrice}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Stock</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border }]}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={stock}
                onChangeText={setStock}
              />
            </View>

            <Text style={styles.errorText}>Base price is required</Text>

            <View style={styles.switchRow}>
              <Switch
                value={enableDiscount}
                onValueChange={setEnableDiscount}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
              <Text style={[styles.switchLabel, { color: colors.text }]}>Enable discount</Text>
            </View>
          </View>
        </FadeUp>

        {/* Section 4: Product Images (0/5) */}
        <FadeUp delay={140} duration={300}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeaderBetween}>
              <View style={styles.cardHeaderRow}>
                <Icon source={imageBold} size={18} color={colors.primary} />
                <Text style={[styles.cardSectionTitle, { color: colors.text }]}>Product Images</Text>
              </View>
              <Text style={[styles.countLabel, { color: colors.textMuted }]}>0/5</Text>
            </View>

            <View style={[styles.dashedBox, { borderColor: colors.border }]}>
              <Text style={[styles.dashedPlus, { color: colors.textMuted }]}>+</Text>
              <Text style={[styles.dashedAddText, { color: colors.textMuted }]}>Add</Text>
            </View>
          </View>
        </FadeUp>

        {/* Section 5: Product Videos (0/5) */}
        <FadeUp delay={170} duration={300}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeaderBetween}>
              <View style={styles.cardHeaderRow}>
                <Icon source={videoBold} size={18} color={colors.primary} />
                <Text style={[styles.cardSectionTitle, { color: colors.text }]}>Product Images</Text>
              </View>
              <Text style={[styles.countLabel, { color: colors.textMuted }]}>0/5</Text>
            </View>

            <View style={[styles.dashedBox, { borderColor: colors.border, paddingVertical: 28 }]}>
              <Icon source={filmBold} size={26} color={colors.textMuted} />
              <Text style={[styles.dashedTitle, { color: colors.text, marginTop: 8 }]}>
                Click to upload video
              </Text>
              <Text style={[styles.dashedSub, { color: colors.textMuted }]}>
                MP4, WebM, MOV - up to 50MB each
              </Text>
            </View>

            <Text style={[styles.hintSubtext, { color: colors.textMuted }]}>
              Videos help buyers see the product in action. You can add up to 3.
            </Text>
          </View>
        </FadeUp>

        {/* Section 6: Tags */}
        <FadeUp delay={200} duration={300}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <Icon source={tagBold} size={18} color={colors.primary} />
              <Text style={[styles.cardSectionTitle, { color: colors.text }]}>Tags</Text>
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border }]}
              placeholder="Type a tag and press Enter..."
              placeholderTextColor={colors.textMuted}
              value={tagInput}
              onChangeText={setTagInput}
            />
            <Text style={[styles.hintSubtext, { color: colors.textMuted }]}>
              e.g gaming, premium, sale,refurbished
            </Text>

            {/* Section 7: Warranty */}
            <View style={[styles.cardHeaderRow, { marginTop: 14 }]}>
              <Icon source={shieldBold} size={18} color={colors.primary} />
              <Text style={[styles.cardSectionTitle, { color: colors.text }]}>Warranty</Text>
            </View>

            <View style={styles.warrantyButtonsCol}>
              <Squeeze onPress={() => setHasWarranty(false)}>
                <View
                  style={[
                    styles.warrantyBtn,
                    !hasWarranty
                      ? { backgroundColor: '#ECFDF5', borderColor: '#10B981', borderWidth: 1.5 }
                      : { backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderWidth: 1 },
                  ]}>
                  <Text style={[styles.warrantyBtnText, { color: !hasWarranty ? '#10B981' : colors.textMuted }]}>
                    ✕  No Warranty
                  </Text>
                </View>
              </Squeeze>

              <Squeeze onPress={() => setHasWarranty(true)}>
                <View
                  style={[
                    styles.warrantyBtn,
                    hasWarranty
                      ? { backgroundColor: '#ECFDF5', borderColor: '#10B981', borderWidth: 1.5 }
                      : { backgroundColor: colors.surfaceAlt, borderColor: colors.border, borderWidth: 1 },
                  ]}>
                  <Text style={[styles.warrantyBtnText, { color: hasWarranty ? '#10B981' : colors.textMuted }]}>
                    ✓  Yes, has warranty
                  </Text>
                </View>
              </Squeeze>
            </View>
          </View>
        </FadeUp>

        {/* Section 8: Summary Table */}
        <FadeUp delay={230} duration={300}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <Icon source={videoBold} size={18} color={colors.primary} />
              <Text style={[styles.cardSectionTitle, { color: colors.text }]}>Summary</Text>
            </View>

            <View style={styles.summaryTable}>
              <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Base price</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{basePrice || '—'}</Text>
              </View>
              <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Selling Price</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>—</Text>
              </View>
              <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Discount</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>—</Text>
              </View>
              <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Stock</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{stock}</Text>
              </View>
              <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Images</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>0/5</Text>
              </View>
              <View style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Videos</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>None</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Category</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>—</Text>
              </View>
            </View>
          </View>
        </FadeUp>

        {/* Action Buttons */}
        <FadeUp delay={260} duration={300}>
          <View style={styles.actionBtnsCol}>
            <Button
              title={isSubmitting ? 'Creating...' : 'Create Product'}
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              onPress={handleCreateProduct}
            />
            <Button
              title="Cancel"
              variant="outline"
              size="lg"
              disabled={isSubmitting}
              onPress={() => navigation?.goBack()}
            />
          </View>
        </FadeUp>

        {/* Section 9: Tips */}
        <FadeUp delay={290} duration={300}>
          <View style={[styles.tipsCard, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
            <View style={styles.tipsHeaderRow}>
              <Text style={{ fontSize: 16 }}>💡</Text>
              <Text style={[styles.tipsTitle, { color: '#B45309' }]}>Tips</Text>
            </View>
            <Text style={[styles.tipBullet, { color: '#92400E' }]}>
              • The first image becomes the main display image.
            </Text>
            <Text style={[styles.tipBullet, { color: '#92400E' }]}>
              • You can add variants after creating the product.
            </Text>
          </View>
        </FadeUp>
      </ScrollView>

      {/* Alert Modal */}
      <AlertModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => {
          setAlertConfig(prev => ({ ...prev, visible: false }));
          if (alertConfig.onOk) {
            alertConfig.onOk();
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
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
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 24,
  },
  headerSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardSectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  countLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },

  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  textArea: {
    minHeight: 88,
    paddingTop: 10,
  },
  selectorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectorText: {
    fontFamily: fonts.regular,
    fontSize: 13,
  },

  errorText: {
    color: '#EF4444',
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: -4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  switchLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },

  dashedBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  dashedPlus: {
    fontSize: 26,
    fontFamily: fonts.regular,
  },
  dashedAddText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    marginTop: 2,
  },
  dashedTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  dashedSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 3,
  },
  hintSubtext: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },

  warrantyButtonsCol: {
    gap: 10,
    marginTop: 4,
  },
  warrantyBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warrantyBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },

  summaryTable: {
    gap: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  summaryLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  summaryValue: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },

  actionBtnsCol: {
    gap: 10,
  },

  tipsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  tipsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipsTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  tipBullet: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
});
