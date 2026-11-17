import { ReactNode, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AlertModal, { AlertModalType } from '@/components/AlertModal';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import DatePickerModal, { toDateText } from '@/components/DatePickerModal';
import Icon from '@/components/Icon';
import KeyboardSafeView from '@/components/KeyboardSafeView';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  calendarBold,
  fileBold,
  returnOfInvestmentIcon,
  sendBold,
  shieldIcon,
} from '@/assets/icons';
import repairmanApi, { OfferPayload } from '@/roles/Repairman/api/repairmanApi';
import { markOffersChanged } from '@/roles/Repairman/utils/offerEvents';
import { normalizeApiError } from '@/services/apiError';
import { formatDate } from '@/utils/dateFormat';
import { currencySymbol, formatMoney } from '@/utils/money';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import RepairmanHeader from '../../../components/RepairmanHeader';
import Select from '../../../components/Select';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

// Backend rules for POST /repairman/offers/jobs/:id/offer
const DESCRIPTION_MIN = 10;
const DESCRIPTION_MAX = 300;
const MIN_TIME = 0.5;
const TIME_UNITS: Record<string, 'hours' | 'days'> = {
  Hours: 'hours',
  Days: 'days',
};
// warranty days; parseInt() of the value goes to the backend
const WARRANTY_OPTIONS = ['7', '15', '30', '90'];
const START_HOUR = 9;

// Field names the backend reports, mapped to the fields on this screen
const BACKEND_FIELDS: Record<string, string> = {
  'pricing.basePrice': 'basePrice',
  partsEstimate: 'parts',
  'pricing.partsEstimate': 'parts',
  'estimatedTime.value': 'time',
  'estimatedTime.unit': 'time',
  description: 'description',
  'availability.canStartBy': 'startDate',
  'serviceOptions.pickupCharge': 'pickupCharge',
  'serviceOptions.homeServiceCharge': 'homeCharge',
};

const toNumber = (text: string) => Number(text.replace(',', '.').trim());

function startFromText(text: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text.trim())) return null;
  const [y, m, d] = text.trim().split('-').map(Number);
  const date = new Date(y, m - 1, d, START_HOUR, 0, 0);
  return date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
    ? date
    : null;
}

function Card({
  icon,
  title,
  children,
}: {
  icon: number;
  title: string;
  children: ReactNode;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.cardHead}>
        <Icon source={icon} size={18} color={colors.primary} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function FieldError({ text }: { text?: string }) {
  const { colors } = useTheme();
  return text ? (
    <Text style={[styles.error, { color: colors.error }]}>{text}</Text>
  ) : null;
}

export default function SendProposalScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    jobId,
    device,
    budgetMin,
    budgetMax,
    currency = 'TRY',
    suggestedPrice,
  } = route.params || {};

  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [parts, setParts] = useState('');
  const [timeValue, setTimeValue] = useState('2');
  const [timeUnit, setTimeUnit] = useState('Days');
  const [startDate, setStartDate] = useState('');
  const [warranty, setWarranty] = useState('30');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [pickup, setPickup] = useState(false);
  const [pickupCharge, setPickupCharge] = useState('');
  const [homeService, setHomeService] = useState(false);
  const [homeCharge, setHomeCharge] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [alert, setAlert] = useState<{
    type: AlertModalType;
    title: string;
    message: string;
  } | null>(null);

  const total = (toNumber(basePrice) || 0) + (toNumber(parts) || 0);
  const clearError = (key: string) =>
    setErrors(prev => (prev[key] ? { ...prev, [key]: '' } : prev));

  const validate = () => {
    const next: Record<string, string> = {};
    const base = toNumber(basePrice);
    const partsCost = parts.trim() ? toNumber(parts) : 0;
    const time = toNumber(timeValue);
    const start = startFromText(startDate);

    if (!basePrice.trim() || !Number.isFinite(base) || base <= 0)
      next.basePrice = i18n.t('repairmanMsg.priceRequired');
    if (!Number.isFinite(partsCost) || partsCost < 0)
      next.parts = i18n.t('repairmanMsg.partsNegative');
    if (!timeValue.trim() || !Number.isFinite(time) || time < MIN_TIME) {
      next.time = i18n.t('repairmanMsg.timeMin', { min: MIN_TIME });
    }
    const length = description.trim().length;
    if (length < DESCRIPTION_MIN || length > DESCRIPTION_MAX) {
      next.description = i18n.t('repairmanMsg.descLength', { min: DESCRIPTION_MIN, max: DESCRIPTION_MAX });
    }
    if (!start) next.startDate = i18n.t('repairmanMsg.startRequired');
    else if (start.getTime() <= Date.now())
      next.startDate = i18n.t('repairmanMsg.startFuture');
    if (pickup && pickupCharge.trim() && !(toNumber(pickupCharge) >= 0))
      next.pickupCharge = i18n.t('repairmanMsg.chargeNegative');
    if (homeService && homeCharge.trim() && !(toNumber(homeCharge) >= 0))
      next.homeCharge = i18n.t('repairmanMsg.chargeNegative');

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async () => {
    if (submittingRef.current) return;
    if (!validate()) return;

    const start = startFromText(startDate) as Date;
    const partsCost = parts.trim() ? toNumber(parts) : 0;
    const payload: OfferPayload = {
      pricing: {
        basePrice: toNumber(basePrice),
        partsEstimate: partsCost,
        totalPrice: toNumber(basePrice) + partsCost,
        currency: 'TRY',
      },
      estimatedTime: { value: toNumber(timeValue), unit: TIME_UNITS[timeUnit] },
      description: description.trim(),
      warranty: {
        duration: parseInt(warranty, 10),
        description: '',
        terms: '',
      },
      availability: { canStartBy: start.toISOString(), preferredSlots: [] },
      serviceOptions: {
        pickupAvailable: pickup,
        pickupCharge: pickup ? toNumber(pickupCharge) || 0 : 0,
        homeService,
        homeServiceCharge: homeService ? toNumber(homeCharge) || 0 : 0,
      },
      servicesIncluded: [],
    };

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const { message } = await repairmanApi.submitOffer(jobId, payload);
      markOffersChanged();
      setAlert({
        type: 'success',
        title: i18n.t('repairman.offerSent'),
        message: message || i18n.t('repairman.offerSubmittedSuccessfully'),
      });
    } catch (e) {
      const error = normalizeApiError(e);
      const mapped: Record<string, string> = {};
      Object.entries(error.fieldErrors || {}).forEach(([key, text]) => {
        if (BACKEND_FIELDS[key]) mapped[BACKEND_FIELDS[key]] = text;
      });
      if (Object.keys(mapped).length)
        setErrors(prev => ({ ...prev, ...mapped }));
      setAlert({
        type: 'error',
        title: i18n.t('repairman.couldNotSendOffer'),
        message: error.message,
      });
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const closeAlert = () => {
    const sent = alert?.type === 'success';
    setAlert(null);
    if (sent)
      navigation.navigate('Home', {
        screen: 'JobsTab',
        params: { tab: 'MyOffers', at: Date.now() },
      });
  };

  const inputStyle = [styles.input, { color: colors.text }];
  const rowStyle = (key: string) => [
    styles.inputRow,
    {
      backgroundColor: colors.surfaceAlt,
      borderColor: errors[key] ? colors.error : colors.surfaceAlt,
    },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <RepairmanHeader navigation={navigation} />

      <KeyboardSafeView>
        <ScrollView
          contentContainerStyle={[
            styles.body,
            { paddingBottom: insets.bottom + 30 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Squeeze onPress={() => navigation.goBack()} scale={0.95}>
            <View style={styles.backWrap}>
              <Icon source={arrowLeftBold} size={16} color={colors.primary} />
              <Text style={[styles.backText, { color: colors.primary }]}>
                {t('repairman.backToJob')}
              </Text>
            </View>
          </Squeeze>

          <FadeUp delay={40} duration={400}>
            <View
              style={[styles.summary, { backgroundColor: colors.surfaceAlt }]}
            >
              <Text style={[styles.summaryTitle, { color: colors.text }]}>
                {device || t('repairman.repairJob')}
              </Text>
              <Text style={[styles.summaryText, { color: colors.textMuted }]}>
                {i18n.t('repairmanMsg.budgetLine', { min: formatMoney(budgetMin, currency), max: formatMoney(budgetMax, currency) })}
              </Text>
              {suggestedPrice ? (
                <Text style={[styles.summaryText, { color: colors.textMuted }]}>
                  {i18n.t('repairmanMsg.suggestedPrice', { price: formatMoney(suggestedPrice, currency) })}
                </Text>
              ) : null}
            </View>
          </FadeUp>

          <FadeUp delay={70} duration={400}>
            <Card icon={fileBold} title={t('repairman.proposalDescription')}>
              <View
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.surfaceAlt,
                    borderColor: errors.description
                      ? colors.error
                      : colors.surfaceAlt,
                  },
                ]}
              >
                <TextInput
                  value={description}
                  onChangeText={text => {
                    setDescription(text);
                    clearError('description');
                  }}
                  placeholder={t('repairman.explainHowYouWillApproach')}
                  placeholderTextColor={colors.textMuted}
                  multiline
                  maxLength={DESCRIPTION_MAX}
                  style={[
                    styles.input,
                    styles.multiline,
                    { color: colors.text },
                  ]}
                />
              </View>
              <View style={styles.counterRow}>
                <FieldError text={errors.description} />
                <Text style={[styles.counter, { color: colors.textMuted }]}>
                  {i18n.t('repairmanMsg.descCount', { count: description.trim().length, max: DESCRIPTION_MAX, min: DESCRIPTION_MIN })}
                </Text>
              </View>
            </Card>
          </FadeUp>

          <FadeUp delay={100} duration={400}>
            <Card icon={returnOfInvestmentIcon} title={t('repairman.pricingDetails')}>
              <Text style={[styles.label, { color: colors.textMuted }]}>
                {t('repairman.baseServicePrice')}
              </Text>
              <View style={rowStyle('basePrice')}>
                <Text style={[styles.currency, { color: colors.textMuted }]}>
                  {currencySymbol()}
                </Text>
                <TextInput
                  value={basePrice}
                  onChangeText={text => {
                    setBasePrice(text);
                    clearError('basePrice');
                  }}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  style={inputStyle}
                />
              </View>
              <FieldError text={errors.basePrice} />

              <Text
                style={[styles.label, styles.gap, { color: colors.textMuted }]}
              >
                {t('repairman.partsCostOptional')}
              </Text>
              <View style={rowStyle('parts')}>
                <Text style={[styles.currency, { color: colors.textMuted }]}>
                  {currencySymbol()}
                </Text>
                <TextInput
                  value={parts}
                  onChangeText={text => {
                    setParts(text);
                    clearError('parts');
                  }}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  style={inputStyle}
                />
              </View>
              <FieldError text={errors.parts} />

              <View
                style={[styles.totalRow, { borderTopColor: colors.border }]}
              >
                <Text style={[styles.totalLabel, { color: colors.text }]}>
                  {t('repairman.totalPrice')}
                </Text>
                <Text style={[styles.totalValue, { color: colors.primary }]}>
                  {formatMoney(total)}
                </Text>
              </View>
            </Card>
          </FadeUp>

          <FadeUp delay={130} duration={400}>
            <Card icon={shieldIcon} title={t('repairman.timelineAndWarranty')}>
              <Text style={[styles.label, { color: colors.textMuted }]}>
                {t('repairman.estimatedTime2')}
              </Text>
              <View style={styles.row}>
                <View style={[rowStyle('time'), styles.rowField]}>
                  <TextInput
                    value={timeValue}
                    onChangeText={text => {
                      setTimeValue(text);
                      clearError('time');
                    }}
                    keyboardType="decimal-pad"
                    style={inputStyle}
                  />
                </View>
                <Select
                  value={timeUnit}
                  options={Object.keys(TIME_UNITS)}
                  onChange={setTimeUnit}
                  style={styles.rowField}
                />
              </View>
              <FieldError text={errors.time} />

              <Text
                style={[styles.label, styles.gap, { color: colors.textMuted }]}
              >
                {t('repairman.canStartBy')}
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setDatePickerOpen(true)}
                style={rowStyle('startDate')}
              >
                <Text
                  style={[
                    styles.dateText,
                    { color: startDate ? colors.text : colors.textMuted },
                  ]}
                >
                  {startDate
                    ? formatDate(startFromText(startDate)?.toISOString())
                    : t('repairman.selectTheStartDate')}
                </Text>
                <Icon
                  source={calendarBold}
                  size={16}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
              <Text style={[styles.hint, { color: colors.textMuted }]}>
                {i18n.t('repairmanMsg.startsAt', { hour: START_HOUR })}
              </Text>
              <FieldError text={errors.startDate} />

              <Text
                style={[styles.label, styles.gap, { color: colors.textMuted }]}
              >
                {t('repairman.warrantyDuration')}
              </Text>
              <Select
                value={warranty}
                options={WARRANTY_OPTIONS}
                format={option => i18n.t('repairmanMsg.daysOption', { count: Number(option) })}
                onChange={setWarranty}
              />
            </Card>
          </FadeUp>

          <FadeUp delay={160} duration={400}>
            <Card icon={shieldIcon} title={t('repairman.serviceOptionsOptional')}>
              <View
                style={[
                  styles.optionRow,
                  { backgroundColor: colors.surfaceAlt },
                ]}
              >
                <Checkbox checked={pickup} onChange={setPickup} />
                <View style={styles.optionText}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {t('repairman.pickupService2')}
                  </Text>
                  <Text
                    style={[
                      styles.optionDescription,
                      { color: colors.textMuted },
                    ]}
                  >
                    {t('repairman.youPickUpTheDevice')}
                  </Text>
                </View>
              </View>
              {pickup && (
                <>
                  <View style={rowStyle('pickupCharge')}>
                    <Text
                      style={[styles.currency, { color: colors.textMuted }]}
                    >
                      {currencySymbol()}
                    </Text>
                    <TextInput
                      value={pickupCharge}
                      onChangeText={text => {
                        setPickupCharge(text);
                        clearError('pickupCharge');
                      }}
                      placeholder={t('repairman.pickupChargeLeaveEmptyIf')}
                      placeholderTextColor={colors.textMuted}
                      keyboardType="decimal-pad"
                      style={inputStyle}
                    />
                  </View>
                  <FieldError text={errors.pickupCharge} />
                </>
              )}

              <View
                style={[
                  styles.optionRow,
                  { backgroundColor: colors.surfaceAlt },
                ]}
              >
                <Checkbox checked={homeService} onChange={setHomeService} />
                <View style={styles.optionText}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {t('repairman.homeService2')}
                  </Text>
                  <Text
                    style={[
                      styles.optionDescription,
                      { color: colors.textMuted },
                    ]}
                  >
                    {t('repairman.youRepairTheDeviceAt')}
                  </Text>
                </View>
              </View>
              {homeService && (
                <>
                  <View style={rowStyle('homeCharge')}>
                    <Text
                      style={[styles.currency, { color: colors.textMuted }]}
                    >
                      {currencySymbol()}
                    </Text>
                    <TextInput
                      value={homeCharge}
                      onChangeText={text => {
                        setHomeCharge(text);
                        clearError('homeCharge');
                      }}
                      placeholder={t('repairman.homeServiceChargeLeaveEmpty')}
                      placeholderTextColor={colors.textMuted}
                      keyboardType="decimal-pad"
                      style={inputStyle}
                    />
                  </View>
                  <FieldError text={errors.homeCharge} />
                </>
              )}
            </Card>
          </FadeUp>

          <Button
            title={t('repairman.submitOffer')}
            icon={sendBold}
            iconPosition="left"
            loading={submitting}
            onPress={onSubmit}
            style={styles.submitButton}
          />
          <Text style={[styles.helper, { color: colors.textMuted }]}>
            {t('repairman.requiredDescriptionBasePriceEstimated')}
          </Text>
        </ScrollView>
      </KeyboardSafeView>

      <DatePickerModal
        visible={datePickerOpen}
        title={t('repairman.canStartBy')}
        value={startDate}
        minDate={toDateText(new Date())}
        onSelect={date => {
          setStartDate(date);
          clearError('startDate');
          setDatePickerOpen(false);
        }}
        onClose={() => setDatePickerOpen(false)}
      />

      <AlertModal
        visible={Boolean(alert)}
        type={alert?.type}
        title={alert?.title}
        message={alert?.message}
        onClose={closeAlert}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 20, paddingTop: 16 },
  backWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  backText: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 14 },

  summary: { borderRadius: 12, padding: 14, gap: 2 },
  summaryTitle: { fontFamily: fonts.bold, fontSize: 15 },
  summaryText: { fontFamily: fonts.regular, fontSize: 12 },

  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 14 },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: { fontFamily: fonts.bold, fontSize: 15 },

  label: { fontFamily: fonts.regular, fontSize: 13, marginBottom: 8 },
  gap: { marginTop: 14 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  currency: { fontFamily: fonts.bold, fontSize: 14 },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 14, padding: 0 },
  textArea: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 6,
  },
  counter: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 11 },
  error: {
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 4,
    flexShrink: 1,
  },
  hint: { fontFamily: fonts.regular, fontSize: 11, marginTop: 6 },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    marginTop: 16,
    paddingTop: 12,
  },
  totalLabel: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 14 },
  totalValue: { fontFamily: fonts.bold, fontSize: 18 },

  row: { flexDirection: 'row', gap: 10 },
  rowField: { flex: 1 },

  dateText: { flex: 1, fontFamily: fonts.regular, fontSize: 14 },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  optionText: { flex: 1, gap: 4 },
  optionTitle: { fontFamily: fonts.bold, fontSize: 14 },
  optionDescription: { fontFamily: fonts.regular, fontSize: 12 },

  submitButton: { marginTop: 20 },
  helper: {
    fontFamily: fonts.regular,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
  },
});
