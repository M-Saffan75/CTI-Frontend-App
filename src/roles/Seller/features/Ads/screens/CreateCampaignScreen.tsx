import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';

import Button from '@/components/Button';
import Icon from '@/components/Icon';
import ProductThumb from '@/components/ProductThumb';
import Squeeze from '@/components/Squeeze';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import { ErrorState, LoadingState, OfflineBanner } from '@/components/states';
import { calendarBold, checkCircleBold, imageBold, searchBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { getWebSellerAdsPaymentUrl } from '@/constants/config';
import DateRangeModal from '@/roles/Seller/components/DateRangeModal';
import SellerScreenHeader from '@/roles/Seller/components/SellerScreenHeader';
import {
  createSellerCampaignApi,
  fetchSellerAdCardsApi,
  fetchSellerAdSettingsApi,
  fetchSellerProductsApi,
  runSellerCampaignActionApi,
  SellerAdCard,
  SellerAdSettings,
  SellerProductItem,
} from '@/roles/Seller/services/sellerApi';
import { formatDate, formatMoney, markAdsDirty, openSellerTab, openWebsite, toApiDate } from '@/roles/Seller/utils/sellerUtils';
import { currencySymbol } from '@/utils/money';
import KeyboardSafeView from '@/components/KeyboardSafeView';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

const MAX_BANNER_BYTES = 2 * 1024 * 1024;

type CampaignType = 'sponsored_product' | 'sponsored_store';

interface Banner {
  uri: string;
  type: string;
  name: string;
}

interface AlertState {
  visible: boolean;
  type: AlertModalType;
  title: string;
  message: string;
  leave?: boolean;
}

const HIDDEN_ALERT: AlertState = { visible: false, type: 'info', title: '', message: '' };

export default function CreateCampaignScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [type, setType] = useState<CampaignType>('sponsored_product');
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [banner, setBanner] = useState<Banner | null>(null);
  const [startDate, setStartDate] = useState('');
  const [dailyBudget, setDailyBudget] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [cardId, setCardId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [dateOpen, setDateOpen] = useState(false);

  const [settings, setSettings] = useState<SellerAdSettings | null>(null);
  const [products, setProducts] = useState<SellerProductItem[]>([]);
  const [cards, setCards] = useState<SellerAdCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [checkingCards, setCheckingCards] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<AlertState>(HIDDEN_ALERT);
  const mounted = useRef(true);
  // The draft is created once; if the submit step fails, a retry only submits it again
  const draftId = useRef('');

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [adSettings, productsPage, savedCards] = await Promise.all([
        fetchSellerAdSettingsApi(),
        fetchSellerProductsApi({ page: 1, limit: 200 }),
        fetchSellerAdCardsApi(),
      ]);
      if (!mounted.current) return;
      setSettings(adSettings);
      setProducts(productsPage.products);
      setCards(savedCards);
      setCardId(prev => prev || (savedCards.find(c => c.isDefault) || savedCards[0])?.id || '');
    } catch (err: any) {
      if (mounted.current) setLoadError(err?.message || i18n.t('sellerAuto.couldNotLoadTheCampaign'));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshCards = async () => {
    setCheckingCards(true);
    try {
      const savedCards = await fetchSellerAdCardsApi();
      if (!mounted.current) return;
      setCards(savedCards);
      setCardId(prev => (savedCards.some(c => c.id === prev) ? prev : (savedCards.find(c => c.isDefault) || savedCards[0])?.id || ''));
    } catch (err: any) {
      if (mounted.current) {
        setAlert({ visible: true, type: 'error', title: i18n.t('sellerAuto.couldNotLoadCards'), message: err?.message || i18n.t('customer.pleaseTryAgain') });
      }
    } finally {
      if (mounted.current) setCheckingCards(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return q ? products.filter(p => p.name.toLowerCase().includes(q)) : products;
  }, [products, productSearch]);

  const daily = parseFloat(dailyBudget);
  const total = parseFloat(totalBudget);
  const endDate = useMemo(() => {
    if (!startDate || !(daily > 0) || !(total > 0)) return '';
    const [y, m, d] = startDate.split('-').map(Number);
    const end = new Date(y, m - 1, d);
    end.setDate(end.getDate() + Math.min(Math.ceil(total / daily), 365));
    return toApiDate(end);
  }, [startDate, daily, total]);

  const clearError = (key: string) => setErrors(prev => (prev[key] ? { ...prev, [key]: '' } : prev));

  const pickBanner = () => {
    launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 }, response => {
      if (response.didCancel) return;
      const asset = response.assets?.[0];
      if (response.errorCode || !asset?.uri) {
        setAlert({ visible: true, type: 'error', title: i18n.t('sellerAuto.imageError'), message: response.errorMessage || i18n.t('sellerAuto.couldNotSelectTheImage') });
        return;
      }
      if ((asset.fileSize || 0) > MAX_BANNER_BYTES) {
        setAlert({ visible: true, type: 'error', title: i18n.t('sellerAuto.bannerTooLarge'), message: i18n.t('sellerAuto.theBannerMustBeUnder') });
        return;
      }
      setBanner({ uri: asset.uri, type: asset.type || 'image/jpeg', name: asset.fileName || 'banner.jpg' });
      clearError('banner');
    });
  };

  const toggleProduct = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]));
    clearError('products');
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = i18n.t('sellerMsg.campaign.nameReq');
    else if (name.trim().length < 3) next.name = i18n.t('sellerMsg.campaign.nameMin');
    if (!startDate) next.startDate = i18n.t('sellerMsg.campaign.startReq');
    else if (startDate < toApiDate(new Date())) next.startDate = i18n.t('sellerMsg.campaign.startPast');
    if (!dailyBudget) next.dailyBudget = i18n.t('sellerMsg.campaign.dailyReq');
    else if (isNaN(daily) || daily < (settings?.minDailyBudget || 0)) {
      next.dailyBudget = i18n.t('sellerMsg.campaign.dailyMin', { amount: formatMoney(settings?.minDailyBudget) });
    }
    if (!totalBudget) next.totalBudget = i18n.t('sellerMsg.campaign.totalReq');
    else if (isNaN(total) || total < (settings?.minTotalBudget || 0)) {
      next.totalBudget = i18n.t('sellerMsg.campaign.totalMin', { amount: formatMoney(settings?.minTotalBudget) });
    }
    if (!next.dailyBudget && !next.totalBudget && daily > total) {
      next.dailyBudget = i18n.t('sellerMsg.campaign.dailyExceeds');
    }
    if (type === 'sponsored_product' && selectedIds.length === 0) next.products = i18n.t('sellerMsg.campaign.productsReq');
    if (type === 'sponsored_store' && !banner) next.banner = i18n.t('sellerMsg.campaign.bannerReq');
    if (!cardId) next.payment = i18n.t('sellerMsg.campaign.paymentReq');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const leave = () => {
    markAdsDirty();
    openSellerTab(navigation, 'Ads');
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (!draftId.current) {
        const form = new FormData();
        form.append('type', type);
        form.append('name', name.trim());
        form.append('startDate', startDate);
        form.append('dailyBudget', String(daily));
        form.append('totalBudget', String(total));
        form.append('paymentMethodId', cardId);
        if (type === 'sponsored_product') {
          selectedIds.forEach(id => form.append('productIds[]', id));
        } else {
          if (tagline.trim()) form.append('storeTagline', tagline.trim());
          if (banner) form.append('banner', banner as any);
        }
        const created = await createSellerCampaignApi(form);
        if (!created.id) throw new Error('The campaign was created but the server sent no id.');
        draftId.current = created.id;
        markAdsDirty();
      }
      const submitted = await runSellerCampaignActionApi(draftId.current, 'submit');
      if (!mounted.current) return;
      setAlert({
        visible: true,
        type: 'success',
        title: i18n.t('sellerAuto.campaignSubmitted'),
        message: submitted.message || i18n.t('sellerAuto.yourCampaignWasSentFor'),
        leave: true,
      });
    } catch (err: any) {
      if (!mounted.current) return;
      const saved = !!draftId.current;
      setAlert({
        visible: true,
        type: 'error',
        title: saved ? i18n.t('sellerAuto.savedAsDraftNotSubmitted') : i18n.t('sellerAuto.couldNotCreateTheCampaign'),
        message: saved
          ? i18n.t('sellerMsg.campaign.draftSaved', { message: err?.message || i18n.t('sellerAuto.submitFailed') })
          : err?.message || i18n.t('sellerAuto.pleaseCheckTheFormAnd'),
      });
    } finally {
      if (mounted.current) setSubmitting(false);
    }
  };

  const optionBox = (selected: boolean) => ({
    borderColor: selected ? colors.primary : colors.border,
    backgroundColor: selected ? colors.primary + '10' : 'transparent',
  });
  const dateBox = {
    backgroundColor: colors.surfaceAlt,
    borderColor: errors.startDate ? colors.error : 'transparent',
  };
  const inputStyle = [styles.input, { color: colors.text, backgroundColor: colors.surfaceAlt }];
  const locked = submitting || !!draftId.current;

  const renderError = (key: string) =>
    errors[key] ? <Text style={[styles.error, { color: colors.error }]}>{errors[key]}</Text> : null;

  let content;
  if (loading) {
    content = <LoadingState text={t('common.loading')} style={styles.stateWrap} />;
  } else if (loadError || !settings) {
    content = <ErrorState error={loadError || t('sellerAuto.couldNotLoadTheCampaign')} onRetry={loadData} style={styles.stateWrap} />;
  } else if (!settings.isEnabled) {
    content = (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{t('sellerAuto.advertisingIsNotAvailable')}</Text>
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          {t('sellerAuto.advertisingIsSwitchedOffBy')}
        </Text>
      </View>
    );
  } else {
    content = (
      <>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('sellerAuto.campaignType')}</Text>
          {(
            [
              { id: 'sponsored_product', title: t('sellerAuto.sponsoredProducts'), desc: t('sellerAuto.promoteSelectedProductsInSearch') },
              { id: 'sponsored_store', title: t('sellerAuto.sponsoredStore'), desc: t('sellerAuto.promoteYourWholeStoreWith') },
            ] as Array<{ id: CampaignType; title: string; desc: string }>
          ).map(option => {
            const active = type === option.id;
            return (
              <Squeeze key={option.id} onPress={() => (locked ? undefined : setType(option.id))} scale={0.98}>
                <View
                  style={[styles.option, optionBox(active)]}>
                  <View style={styles.flex1}>
                    <Text style={[styles.optionTitle, { color: colors.text }]}>{option.title}</Text>
                    <Text style={[styles.hint, { color: colors.textMuted }]}>{option.desc}</Text>
                  </View>
                  {active ? <Icon source={checkCircleBold} size={20} color={colors.primary} /> : null}
                </View>
              </Squeeze>
            );
          })}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('sellerAuto.details')}</Text>
          <Text style={[styles.label, { color: colors.text }]}>{t('sellerAuto.campaignName')}</Text>
          <TextInput
            value={name}
            onChangeText={text => {
              setName(text);
              clearError('name');
            }}
            editable={!locked}
            placeholder={t('sellerAuto.eGSummerSale')}
            placeholderTextColor={colors.textMuted}
            style={[inputStyle, errors.name ? { borderColor: colors.error } : null]}
          />
          {renderError('name')}

          {type === 'sponsored_store' ? (
            <>
              <Text style={[styles.label, { color: colors.text }]}>{t('sellerAuto.storeTaglineOptional')}</Text>
              <TextInput
                value={tagline}
                onChangeText={setTagline}
                editable={!locked}
                placeholder={t('sellerAuto.aShortLineShownWith')}
                placeholderTextColor={colors.textMuted}
                maxLength={120}
                style={inputStyle}
              />
              <Text style={[styles.label, { color: colors.text }]}>{t('sellerAuto.storeBanner')}</Text>
              <Squeeze onPress={locked ? undefined : pickBanner} scale={0.98}>
                <View style={[styles.bannerBox, { borderColor: errors.banner ? colors.error : colors.border, backgroundColor: colors.surfaceAlt }]}>
                  {banner ? (
                    <Image source={{ uri: banner.uri }} style={styles.bannerImage} resizeMode="cover" />
                  ) : (
                    <>
                      <Icon source={imageBold} size={26} color={colors.textMuted} />
                      <Text style={[styles.hint, { color: colors.textMuted }]}>{t('sellerAuto.tapToChooseABanner')}</Text>
                    </>
                  )}
                </View>
              </Squeeze>
              {renderError('banner')}
            </>
          ) : null}
        </View>

        {type === 'sponsored_product' ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {selectedIds.length > 0 ? i18n.t('sellerMsg.campaign.productsTitleCount', { count: selectedIds.length }) : i18n.t('sellerMsg.campaign.productsTitle')}
            </Text>
            <View style={[styles.searchBar, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <Icon source={searchBold} size={16} color={colors.textMuted} />
              <TextInput
                value={productSearch}
                onChangeText={setProductSearch}
                placeholder={t('sellerAuto.searchYourProducts')}
                placeholderTextColor={colors.textMuted}
                style={[styles.searchInput, { color: colors.text }]}
              />
            </View>
            {products.length === 0 ? (
              <Text style={[styles.hint, { color: colors.textMuted }]}>{t('sellerAuto.youHaveNoProductsYet')}</Text>
            ) : (
              <ScrollView style={styles.productList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                {filteredProducts.map(product => {
                  const picked = selectedIds.includes(product.id);
                  return (
                    <Squeeze key={product.id} onPress={locked ? undefined : () => toggleProduct(product.id)} scale={0.99}>
                      <View style={[styles.productRow, { borderColor: picked ? colors.primary : colors.border }]}>
                        <ProductThumb uri={product.image} size={40} radius={8} />
                        <View style={styles.flex1}>
                          <Text style={[styles.optionTitle, { color: colors.text }]}>{product.name}</Text>
                          <Text style={[styles.hint, { color: colors.textMuted }]}>{formatMoney(product.sellingPrice)}</Text>
                        </View>
                        {picked ? <Icon source={checkCircleBold} size={20} color={colors.primary} /> : null}
                      </View>
                    </Squeeze>
                  );
                })}
                {filteredProducts.length === 0 ? (
                  <Text style={[styles.hint, { color: colors.textMuted }]}>{t('sellerAuto.noProductMatchesYourSearch')}</Text>
                ) : null}
              </ScrollView>
            )}
            {renderError('products')}
          </View>
        ) : null}

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('sellerAuto.scheduleAndBudget')}</Text>
          <Text style={[styles.label, { color: colors.text }]}>{t('sellerAuto.startDate')}</Text>
          <Squeeze onPress={locked ? undefined : () => setDateOpen(true)} scale={0.99}>
            <View
              style={[
                styles.input,
                styles.dateField,
                dateBox,
              ]}>
              <Text style={[styles.dateText, { color: startDate ? colors.text : colors.textMuted }]}>
                {startDate ? formatDate(startDate) : t('sellerAuto.chooseAStartDate')}
              </Text>
              <Icon source={calendarBold} size={16} color={colors.textMuted} />
            </View>
          </Squeeze>
          {renderError('startDate')}

          <Text style={[styles.label, { color: colors.text }]}>{i18n.t('sellerMsg.campaign.dailyLabel', { symbol: currencySymbol() })}</Text>
          <TextInput
            value={dailyBudget}
            onChangeText={text => {
              setDailyBudget(text.replace(',', '.'));
              clearError('dailyBudget');
            }}
            editable={!locked}
            keyboardType="decimal-pad"
            placeholder={`Min ${formatMoney(settings.minDailyBudget)}`}
            placeholderTextColor={colors.textMuted}
            style={[inputStyle, errors.dailyBudget ? { borderColor: colors.error } : null]}
          />
          {renderError('dailyBudget')}

          <Text style={[styles.label, { color: colors.text }]}>{i18n.t('sellerMsg.campaign.totalLabel', { symbol: currencySymbol() })}</Text>
          <TextInput
            value={totalBudget}
            onChangeText={text => {
              setTotalBudget(text.replace(',', '.'));
              clearError('totalBudget');
            }}
            editable={!locked}
            keyboardType="decimal-pad"
            placeholder={`Min ${formatMoney(settings.minTotalBudget)}`}
            placeholderTextColor={colors.textMuted}
            style={[inputStyle, errors.totalBudget ? { borderColor: colors.error } : null]}
          />
          {renderError('totalBudget')}

          {endDate ? (
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              {i18n.t('sellerMsg.campaign.endEstimate', { date: formatDate(endDate), cost: formatMoney(settings.costPerClick) })}
            </Text>
          ) : null}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('sellerAuto.paymentCard')}</Text>
          {cards.length === 0 ? (
            <>
              <Text style={[styles.hint, { color: colors.textMuted }]}>
                {t('sellerAuto.youHaveNoSavedCard')}
              </Text>
              <Button title={t('sellerAuto.addACardOnThe')} size="md" onPress={() => openWebsite(getWebSellerAdsPaymentUrl())} />
              <Button
                title={t('sellerAuto.iAddedACardCheck')}
                size="md"
                variant="soft"
                loading={checkingCards}
                onPress={refreshCards}
              />
            </>
          ) : (
            cards.map(card => {
              const picked = card.id === cardId;
              return (
                <Squeeze
                  key={card.id}
                  onPress={
                    locked
                      ? undefined
                      : () => {
                          setCardId(card.id);
                          clearError('payment');
                        }
                  }
                  scale={0.98}>
                  <View style={[styles.option, optionBox(picked)]}>
                    <View style={styles.flex1}>
                      <Text style={[styles.optionTitle, { color: colors.text }]}>
                        {card.brand ? `${card.brand} ` : ''}****{card.last4}
                        {card.isDefault ? i18n.t('sellerAuto.default') : ''}
                      </Text>
                      <Text style={[styles.hint, { color: colors.textMuted }]}>
                        {card.holderName}
                        {card.expMonth ? `  |  ${String(card.expMonth).padStart(2, '0')}/${card.expYear}` : ''}
                      </Text>
                    </View>
                    {picked ? <Icon source={checkCircleBold} size={20} color={colors.primary} /> : null}
                  </View>
                </Squeeze>
              );
            })
          )}
          {renderError('payment')}
        </View>

        <Button
          title={draftId.current ? t('sellerAuto.submitDraftForApproval') : t('sellerAuto.createAndSubmitForApproval')}
          size="md"
          loading={submitting}
          onPress={handleSubmit}
        />
        <Text style={[styles.hint, styles.center, { color: colors.textMuted }]}>
          {t('sellerAuto.theCampaignIsReviewedBy')}
        </Text>
      </>
    );
  }

  return (
    <KeyboardSafeView
      style={[styles.screen, { backgroundColor: colors.background }]}>
      <OfflineBanner />
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <SellerScreenHeader title={t('sellerAuto.createCampaign')} subtitle={t('sellerAuto.promoteYourProductsOrStore')} onBack={() => navigation.goBack()} />
        {checkingCards && cards.length > 0 ? <ActivityIndicator color={colors.primary} /> : null}
        {content}
      </ScrollView>

      <DateRangeModal
        visible={dateOpen}
        title={t('sellerAuto.startDate')}
        from={startDate}
        to={startDate}
        onApply={from => {
          setStartDate(from);
          clearError('startDate');
          setDateOpen(false);
        }}
        onClose={() => setDateOpen(false)}
      />
      <AlertModal
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() => {
          const goBack = alert.leave;
          setAlert(HIDDEN_ALERT);
          if (goBack) leave();
        }}
      />
    </KeyboardSafeView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex1: { flex: 1 },
  container: { paddingHorizontal: 16, gap: 14 },
  stateWrap: { paddingVertical: 40 },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 15 },
  label: { fontFamily: fonts.medium, fontSize: 13 },
  hint: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17 },
  center: { textAlign: 'center' },
  error: { fontFamily: fonts.regular, fontSize: 12 },
  input: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 14,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  dateField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateText: { fontFamily: fonts.regular, fontSize: 14 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 12 },
  optionTitle: { fontFamily: fonts.medium, fontSize: 13 },
  bannerBox: {
    height: 130,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  bannerImage: { width: '100%', height: '100%' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 13, padding: 0 },
  productList: { maxHeight: 300 },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 8, marginBottom: 8 },
});
