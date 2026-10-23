import { useState } from 'react';
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

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import { FadeUp } from '@/animations';
import { arrowLeftBold, chevronDownBold, searchBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import AddCardModal from '../components/AddCardModal';

interface ProductItem {
  id: string;
  name: string;
  price: string;
  img: string;
  checked: boolean;
}

const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 'p-1',
    name: 'Reebok Workout Ready T-Shirt',
    price: '$22:00',
    img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=200&q=80',
    checked: false,
  },
  {
    id: 'p-2',
    name: 'Gucci GG Marmont Leather Belt',
    price: '$539.00',
    img: 'https://images.unsplash.com/photo-1624222247344-550fa60583dc?w=200&q=80',
    checked: false,
  },
  {
    id: 'p-3',
    name: 'Gucci GG Marmont Leather Belt',
    price: '$539.00',
    img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80',
    checked: false,
  },
  {
    id: 'p-4',
    name: 'Gucci GG Marmont Leather Belt',
    price: '$539.00',
    img: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=200&q=80',
    checked: false,
  },
  {
    id: 'p-5',
    name: 'Gucci GG Marmont Leather Belt',
    price: '$539.00',
    img: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=200&q=80',
    checked: false,
  },
];

export default function CreateCampaignScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [selectedRadioIndex, setSelectedRadioIndex] = useState(0);
  const [campaignName, setCampaignName] = useState('All statuses');
  const [startDate, setStartDate] = useState('');
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [dailyBudget, setDailyBudget] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [isAddCardVisible, setIsAddCardVisible] = useState(false);

  const toggleProduct = (id: string) => {
    setProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, checked: !p.checked } : p))
    );
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchProductQuery.toLowerCase())
  );

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

  const handleSubmit = () => {
    setAlertConfig({
      visible: true,
      type: 'success',
      title: 'Campaign Submitted',
      message: 'Your campaign has been submitted for admin review before going live.',
      onOk: () => navigation?.goBack(),
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
      {/* Header matching Create Compaign.png */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Squeeze onPress={() => navigation?.goBack()} scale={0.9}>
          <View style={styles.backBtn}>
            <Icon source={arrowLeftBold} size={18} color="#FFFFFF" />
          </View>
        </Squeeze>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Craete Ad Campaign</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            New campaign will be reviewed before going live
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}>
        {/* Section 1: Target Icon & Sponsored Products Radio Cards */}
        <FadeUp delay={30} duration={300}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderIcon}>🎯</Text>
            <Text style={[styles.sectionHeaderTitle, { color: colors.text }]}>
              Summer fashion Sale
            </Text>
          </View>

          {/* Radio Card 1 (Selected) */}
          <TouchableOpacity
            onPress={() => setSelectedRadioIndex(0)}
            activeOpacity={0.8}
            style={[
              styles.radioCard,
              {
                backgroundColor: colors.surface,
                borderColor: selectedRadioIndex === 0 ? colors.primary : colors.border,
                borderWidth: selectedRadioIndex === 0 ? 1.5 : 1,
              },
            ]}>
            <View style={styles.radioCardLeft}>
              <Text style={{ fontSize: 16 }}>🎯</Text>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.radioCardTitle, { color: colors.text }]}>
                  Sponsored Products
                </Text>
                <Text style={[styles.radioCardSub, { color: colors.textMuted }]}>
                  New campaign will be reviewed before going live
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.radioCircleOuter,
                { borderColor: selectedRadioIndex === 0 ? colors.primary : colors.border },
              ]}>
              {selectedRadioIndex === 0 && (
                <View style={[styles.radioCircleInner, { backgroundColor: colors.primary }]} />
              )}
            </View>
          </TouchableOpacity>

          {/* Radio Card 2 (Unselected) */}
          <TouchableOpacity
            onPress={() => setSelectedRadioIndex(1)}
            activeOpacity={0.8}
            style={[
              styles.radioCard,
              {
                backgroundColor: colors.surface,
                borderColor: selectedRadioIndex === 1 ? colors.primary : colors.border,
                borderWidth: selectedRadioIndex === 1 ? 1.5 : 1,
                marginTop: 10,
              },
            ]}>
            <View style={styles.radioCardLeft}>
              <Text style={{ fontSize: 16 }}>🎯</Text>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.radioCardTitle, { color: colors.text }]}>
                  Sponsored Products
                </Text>
                <Text style={[styles.radioCardSub, { color: colors.textMuted }]}>
                  New campaign will be reviewed before going live
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.radioCircleOuter,
                { borderColor: selectedRadioIndex === 1 ? colors.primary : colors.border },
              ]}>
              {selectedRadioIndex === 1 && (
                <View style={[styles.radioCircleInner, { backgroundColor: colors.primary }]} />
              )}
            </View>
          </TouchableOpacity>
        </FadeUp>

        {/* Section 2: Summer fashion Sale Info Card */}
        <FadeUp delay={60} duration={300}>
          <View
            style={[
              styles.cardBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.cardBoxHeader}>
              <Text style={styles.cardBoxHeaderIcon}>✉</Text>
              <Text style={[styles.cardBoxTitle, { color: colors.text }]}>
                Summer fashion Sale
              </Text>
            </View>

            {/* Campaign Name Dropdown */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Campaign Name</Text>
              <View
                style={[
                  styles.dropdownInput,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}>
                <Text style={[styles.dropdownValueText, { color: colors.text }]}>
                  {campaignName}
                </Text>
                <Icon source={chevronDownBold} size={14} color={colors.textMuted} />
              </View>
            </View>

            {/* Start Data Input */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelCountRow}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Start Data</Text>
                <Text style={[styles.counterText, { color: colors.textMuted }]}>0/100</Text>
              </View>
              <View
                style={[
                  styles.dateInputBox,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}>
                <TextInput
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="mm/dd/yyyy"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.inputTextStyle, { color: colors.text }]}
                />
                <Text style={{ fontSize: 16 }}>📅</Text>
              </View>
              <Text style={[styles.helperFootnote, { color: colors.textMuted }]}>
                Campaign runs until budget is fully spent - no end date needed.
              </Text>
            </View>
          </View>
        </FadeUp>

        {/* Section 3: Select Products Card */}
        <FadeUp delay={90} duration={300}>
          <View
            style={[
              styles.cardBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.cardBoxHeader}>
              <Text style={styles.cardBoxHeaderIcon}>🎨</Text>
              <Text style={[styles.cardBoxTitle, { color: colors.text }]}>
                Select Products
              </Text>
            </View>

            {/* Search Product Bar */}
            <View
              style={[
                styles.searchBarBox,
                { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
              ]}>
              <Icon source={searchBold} size={15} color={colors.textMuted} />
              <TextInput
                value={searchProductQuery}
                onChangeText={setSearchProductQuery}
                placeholder="Search product"
                placeholderTextColor={colors.textMuted}
                style={[styles.inputTextStyle, { color: colors.text }]}
              />
            </View>

            {/* Products List */}
            <View style={styles.productList}>
              {filteredProducts.map((p, idx) => (
                <View key={p.id}>
                  <TouchableOpacity
                    onPress={() => toggleProduct(p.id)}
                    style={styles.productRow}>
                    <View
                      style={[
                        styles.checkboxSquare,
                        {
                          borderColor: p.checked ? colors.primary : colors.border,
                          backgroundColor: p.checked ? colors.primary : 'transparent',
                        },
                      ]}>
                      {p.checked && <Text style={styles.checkboxCheck}>✓</Text>}
                    </View>

                    <Image source={{ uri: p.img }} style={styles.productThumbnail} />

                    <View style={styles.productInfo}>
                      <Text style={[styles.productName, { color: colors.text }]}>{p.name}</Text>
                      <Text style={[styles.productPrice, { color: colors.textMuted }]}>
                        {p.price}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  {idx < filteredProducts.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  )}
                </View>
              ))}
            </View>
          </View>
        </FadeUp>

        {/* Section 4: Budget Card */}
        <FadeUp delay={120} duration={300}>
          <View
            style={[
              styles.cardBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.cardBoxHeader}>
              <Text style={styles.cardBoxHeaderIcon}>🏠</Text>
              <Text style={[styles.cardBoxTitle, { color: colors.text }]}>Budget</Text>
            </View>

            {/* CPC & Impressions Box */}
            <View style={[styles.metricsBox, { backgroundColor: colors.surfaceAlt }]}>
              <View style={styles.metricItemRow}>
                <View style={styles.purplePlaneIconBox}>
                  <Text style={{ fontSize: 13, color: '#9333EA' }}>✈</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.metricItemLabel, { color: colors.textMuted }]}>
                    Cost per click (CPC)
                  </Text>
                  <Text style={[styles.metricItemValue, { color: colors.text }]}>$0.50</Text>
                </View>
              </View>

              <View style={styles.metricItemRow}>
                <View style={styles.blueEyeIconBox}>
                  <Text style={{ fontSize: 13, color: '#2563EB' }}>👁</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.metricItemLabel, { color: colors.textMuted }]}>
                    Imperessions
                  </Text>
                  <Text style={[styles.metricItemValue, { color: '#10B981' }]}>Free</Text>
                </View>
              </View>
            </View>

            {/* Daily Budget Input */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Daily Budget</Text>
              <View
                style={[
                  styles.budgetInputBox,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}>
                <TextInput
                  value={dailyBudget}
                  onChangeText={setDailyBudget}
                  placeholder="$ Min $1.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  style={[styles.inputTextStyle, { color: colors.text }]}
                />
              </View>
            </View>

            {/* Total Budget Input */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Total Budget</Text>
              <View
                style={[
                  styles.budgetInputBox,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}>
                <TextInput
                  value={totalBudget}
                  onChangeText={setTotalBudget}
                  placeholder="$ Min $5.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  style={[styles.inputTextStyle, { color: colors.text }]}
                />
              </View>
            </View>

            {/* Blue Info Banner */}
            <View style={styles.blueInfoCard}>
              <Text style={styles.blueInfoIcon}>ℹ</Text>
              <Text style={styles.blueInfoText}>
                Campaign runs until total budget is used up. You will be charged only when the campaign completes.
              </Text>
            </View>
          </View>
        </FadeUp>

        {/* Section 5: Payment Method Card */}
        <FadeUp delay={150} duration={300}>
          <View
            style={[
              styles.cardBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.paymentHeaderRow}>
              <View style={styles.cardBoxHeader}>
                <Text style={styles.cardBoxHeaderIcon}>✉</Text>
                <Text style={[styles.cardBoxTitle, { color: colors.text }]}>
                  Payment Method
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsAddCardVisible(true)}
                style={styles.addCardPillBtn}>
                <Text style={styles.addCardPillText}>+ Add Card</Text>
              </TouchableOpacity>
            </View>

            {/* Selected Card Preview */}
            <View
              style={[
                styles.selectedCardBox,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.primary,
                },
              ]}>
              <View style={styles.selectedCardLeft}>
                <Text style={{ fontSize: 18, color: colors.primary }}>✉</Text>
                <View>
                  <Text style={[styles.selectedCardTitle, { color: colors.text }]}>
                    Paraf ..ooo8
                  </Text>
                  <Text style={[styles.selectedCardSub, { color: colors.textMuted }]}>
                    Jhon Deo Exp 12/2030
                  </Text>
                </View>
              </View>

              <View style={styles.selectedCardRight}>
                <View style={[styles.defaultBadge, { backgroundColor: colors.surfaceAlt }]}>
                  <Text style={[styles.defaultBadgeText, { color: colors.primary }]}>Default</Text>
                </View>
                <View style={[styles.blackCheckCircle, { backgroundColor: colors.primary }]}>
                  <Text style={styles.blackCheckMark}>✓</Text>
                </View>
              </View>
            </View>

            {/* Warning / Tokenization Notice Box */}
            <View
              style={[
                styles.peachNoticeBox,
                {
                  backgroundColor: colors.surfaceAlt,
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}>
              <Text style={{ fontSize: 16 }}>🛡</Text>
              <Text style={[styles.peachNoticeText, { color: colors.textMuted }]}>
                Your card will be charged only when the campaign ends or budget is exhausted - not before.
              </Text>
            </View>
          </View>
        </FadeUp>

        {/* Action Buttons matching Create Compaign.png */}
        <FadeUp delay={180} duration={300}>
          <View style={styles.actionBtnStack}>
            <Squeeze onPress={handleSubmit} scale={0.98}>
              <View style={[styles.submitApprovalBtn, { backgroundColor: '#FF6900' }]}>
                <Text style={styles.submitApprovalText}>➤  Submit for Approval</Text>
              </View>
            </Squeeze>

            <Squeeze onPress={() => navigation?.goBack()} scale={0.98}>
              <View
                style={[
                  styles.cancelBtn,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
              </View>
            </Squeeze>
          </View>
        </FadeUp>
      </ScrollView>

      <AddCardModal
        visible={isAddCardVisible}
        onClose={() => setIsAddCardVisible(false)}
        onCardAdded={() => setIsAddCardVisible(false)}
      />

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: { flex: 1 },
  headerTitle: { fontFamily: fonts.bold, fontSize: 18 },
  headerSubtitle: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },

  content: { padding: 16, gap: 16 },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionHeaderIcon: { fontSize: 16 },
  sectionHeaderTitle: { fontFamily: fonts.bold, fontSize: 15 },

  radioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
  },
  radioCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  radioCardTitle: { fontFamily: fonts.bold, fontSize: 14 },
  radioCardSub: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  radioCircleOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F59E0B',
  },

  cardBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  cardBoxHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardBoxHeaderIcon: { fontSize: 16, color: '#F97316' },
  cardBoxTitle: { fontFamily: fonts.bold, fontSize: 16 },

  fieldGroup: { gap: 6 },
  fieldLabel: { fontFamily: fonts.medium, fontSize: 13 },
  labelCountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  counterText: { fontFamily: fonts.regular, fontSize: 12 },

  dropdownInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 44,
  },
  dropdownValueText: { fontFamily: fonts.regular, fontSize: 13 },

  dateInputBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 44,
  },
  inputTextStyle: { flex: 1, fontFamily: fonts.regular, fontSize: 13 },
  helperFootnote: { fontFamily: fonts.regular, fontSize: 11, marginTop: 2 },

  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  productList: { gap: 10 },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  checkboxSquare: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCheck: { color: '#FFFFFF', fontSize: 11, fontFamily: fonts.bold },
  productThumbnail: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#F3F4F6' },
  productInfo: { flex: 1, gap: 2 },
  productName: { fontFamily: fonts.medium, fontSize: 13 },
  productPrice: { fontFamily: fonts.regular, fontSize: 12 },
  divider: { height: 1, width: '100%' },

  metricsBox: {
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  metricItemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  purplePlaneIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blueEyeIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricItemLabel: { fontFamily: fonts.regular, fontSize: 12 },
  metricItemValue: { fontFamily: fonts.bold, fontSize: 14, marginTop: 1 },

  budgetInputBox: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 44,
    justifyContent: 'center',
  },

  blueInfoCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'flex-start',
  },
  blueInfoIcon: { color: '#2563EB', fontSize: 16, fontFamily: fonts.bold },
  blueInfoText: { color: '#1E40AF', fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, flex: 1 },

  paymentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addCardPillBtn: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addCardPillText: { color: '#F97316', fontFamily: fonts.bold, fontSize: 12 },

  selectedCardBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
  },
  selectedCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectedCardTitle: { fontFamily: fonts.bold, fontSize: 14 },
  selectedCardSub: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  selectedCardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  defaultBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  defaultBadgeText: { color: '#D97706', fontFamily: fonts.medium, fontSize: 11 },
  blackCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blackCheckMark: { color: '#FFFFFF', fontSize: 11, fontFamily: fonts.bold },

  peachNoticeBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 12,
    alignItems: 'flex-start',
  },
  peachNoticeText: { color: '#92400E', fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, flex: 1 },

  actionBtnStack: { gap: 10 },
  submitApprovalBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitApprovalText: { color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 15 },
  cancelBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontFamily: fonts.medium, fontSize: 15 },
});
