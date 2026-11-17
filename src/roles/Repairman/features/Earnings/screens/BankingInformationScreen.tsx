import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AlertModal, { AlertModalType } from '@/components/AlertModal';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Input from '@/components/Input';
import KeyboardSafeView from '@/components/KeyboardSafeView';
import Squeeze from '@/components/Squeeze';
import { ErrorState, LoadingState } from '@/components/states';
import { FadeUp } from '@/animations';
import { arrowLeftBold, checkCircleBold, storeBold } from '@/assets/icons';
import repairmanApi, { BankDetails } from '@/roles/Repairman/api/repairmanApi';
import { markOffersChanged } from '@/roles/Repairman/utils/offerEvents';
import useApiData from '@/roles/Repairman/utils/useApiData';
import { normalizeApiError } from '@/services/apiError';
import { formatDate } from '@/utils/dateFormat';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import RepairmanHeader from '../../../components/RepairmanHeader';
import { IBAN_PATTERN, maskValue } from '../utils/earnings';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

interface Form {
  accountTitle: string;
  accountNumber: string;
  bankName: string;
  branchName: string;
  iban: string;
}

const EMPTY: Form = {
  accountTitle: '',
  accountNumber: '',
  bankName: '',
  branchName: '',
  iban: '',
};

// The backend compares the IBAN without spaces and in capitals, so the form does the same
const clean = (bank?: BankDetails | Form | null): Form => ({
  accountTitle: (bank?.accountTitle || '').trim(),
  accountNumber: (bank?.accountNumber || '').trim(),
  bankName: (bank?.bankName || '').trim(),
  branchName: (bank?.branchName || '').trim(),
  iban: (bank?.iban || '').replace(/\s/g, '').toUpperCase(),
});

export default function BankingInformationScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // The saved bank details come from the profile: the earnings request has no account title
  const saved = useApiData(
    async () =>
      (await repairmanApi.getProfile()).user.repairmanProfile?.bankDetails ||
      null,
    [],
  );
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const busy = useRef(false);
  const [notice, setNotice] = useState<{
    type: AlertModalType;
    title: string;
    message: string;
    leave?: boolean;
  } | null>(null);

  const original = clean(saved.data);
  const hasSaved = Boolean(saved.data?.accountNumber);

  useEffect(() => {
    if (saved.data !== null || !saved.loading) setForm(clean(saved.data));
  }, [saved.data, saved.loading]);

  const set = (key: keyof Form) => (text: string) => {
    setForm(prev => ({ ...prev, [key]: text }));
    setErrors(prev => (prev[key] ? { ...prev, [key]: '' } : prev));
  };

  const validate = (next: Form) => {
    const found: Partial<Record<keyof Form, string>> = {};
    if (!next.accountTitle)
      found.accountTitle = i18n.t('repairmanMsg.accountTitleReq');
    if (!next.accountNumber)
      found.accountNumber =
        i18n.t('repairmanMsg.accountNumberReq');
    if (!next.bankName) found.bankName = i18n.t('repairmanMsg.bankNameReq');
    if (!next.branchName) found.branchName = i18n.t('repairmanMsg.branchReq');
    if (!next.iban) found.iban = i18n.t('repairmanMsg.ibanReq');
    else if (!IBAN_PATTERN.test(next.iban))
      found.iban = i18n.t('repairmanMsg.ibanInvalid');
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const save = async () => {
    if (busy.current) return;
    const next = clean(form);
    if (!validate(next)) return;

    const unchanged = (Object.keys(next) as (keyof Form)[]).every(
      key => next[key] === original[key],
    );
    if (unchanged && hasSaved) {
      setNotice({
        type: 'info',
        title: i18n.t('common.nothingChanged'),
        message: i18n.t('repairman.yourBankDetailsAreAlready'),
      });
      return;
    }

    busy.current = true;
    setSubmitting(true);
    try {
      const { message } = await repairmanApi.saveBankDetails(next);
      // Earnings (withdrawal becomes possible) and Profile (the bank alert goes away) reload when shown
      markOffersChanged();
      saved.reload(true);
      setNotice({
        type: 'success',
        title: i18n.t('repairman.bankDetailsSaved'),
        message: message || i18n.t('repairman.bankDetailsUpdatedSuccessfully'),
        leave: true,
      });
    } catch (e) {
      const error = normalizeApiError(e);
      const missing: string[] = Array.isArray(error.data?.missingFields)
        ? error.data.missingFields
        : [];
      if (missing.length) {
        const mapped: Partial<Record<keyof Form, string>> = {};
        missing.forEach(field => {
          if (field in EMPTY)
            mapped[field as keyof Form] = i18n.t('repairmanMsg.fieldRequired');
        });
        setErrors(prev => ({ ...prev, ...mapped }));
      }
      setNotice({
        type: 'error',
        title: i18n.t('repairman.couldNotSave'),
        message: error.message,
      });
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <RepairmanHeader navigation={navigation} />

      <KeyboardSafeView>
        {saved.loading && !saved.data && !saved.error ? (
          <LoadingState text={t('repairman.loadingYourBankDetails')} />
        ) : saved.error ? (
          <ErrorState
            error={saved.error}
            onRetry={() => saved.reload()}
            fullScreen
          />
        ) : (
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
                  {t('repairman.backToEarnings')}
                </Text>
              </View>
            </Squeeze>

            {hasSaved ? (
              <FadeUp delay={40} duration={400}>
                <View
                  style={[
                    styles.savedCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.success,
                    },
                  ]}
                >
                  <Icon
                    source={checkCircleBold}
                    size={20}
                    color={colors.success}
                  />
                  <View style={styles.flex}>
                    <Text style={[styles.savedTitle, { color: colors.text }]}>
                      {t('repairman.bankDetailsSaved')}
                    </Text>
                    <Text
                      style={[styles.savedText, { color: colors.textMuted }]}
                    >
                      {original.bankName} •{' '}
                      {maskValue(original.accountNumber, 0, 4)}
                    </Text>
                    {saved.data?.updatedAt ? (
                      <Text
                        style={[styles.savedText, { color: colors.textMuted }]}
                      >
                        {i18n.t('repairmanMsg.updatedOn', { date: formatDate(saved.data.updatedAt) })}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </FadeUp>
            ) : null}

            <FadeUp delay={70} duration={400}>
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.cardHead}>
                  <Icon source={storeBold} size={18} color={colors.primary} />
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    {t('repairman.bankingInformation')}
                  </Text>
                </View>

                <Input
                  label={t('repairman.accountTitle')}
                  value={form.accountTitle}
                  onChangeText={set('accountTitle')}
                  error={errors.accountTitle}
                  maxLength={80}
                  editable={!submitting}
                  style={styles.field}
                />
                <Input
                  label={t('repairman.accountNumber')}
                  value={form.accountNumber}
                  onChangeText={set('accountNumber')}
                  error={errors.accountNumber}
                  keyboardType="number-pad"
                  maxLength={30}
                  editable={!submitting}
                  style={styles.field}
                />
                <Input
                  label={t('repairman.bankName')}
                  value={form.bankName}
                  onChangeText={set('bankName')}
                  error={errors.bankName}
                  maxLength={80}
                  editable={!submitting}
                  style={styles.field}
                />
                <Input
                  label={t('repairman.branchName')}
                  value={form.branchName}
                  onChangeText={set('branchName')}
                  error={errors.branchName}
                  maxLength={80}
                  editable={!submitting}
                  style={styles.field}
                />
                <Input
                  label="IBAN"
                  value={form.iban}
                  onChangeText={set('iban')}
                  error={errors.iban}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={40}
                  editable={!submitting}
                  style={styles.field}
                />

                <Button
                  title={t('repairman.saveBankDetails')}
                  loading={submitting}
                  onPress={save}
                  style={styles.spaced}
                />
                <Button
                  title={t('common.cancel')}
                  variant="outline"
                  disabled={submitting}
                  onPress={() => navigation.goBack()}
                  style={styles.spaced}
                />
              </View>
            </FadeUp>
          </ScrollView>
        )}
      </KeyboardSafeView>

      <AlertModal
        visible={Boolean(notice)}
        type={notice?.type}
        title={notice?.title}
        message={notice?.message}
        onClose={() => {
          const leave = notice?.leave;
          setNotice(null);
          if (leave) navigation.goBack();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  body: { paddingHorizontal: 20, paddingTop: 16 },
  backWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  backText: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 14 },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  savedTitle: { fontFamily: fonts.bold, fontSize: 14 },
  savedText: { fontFamily: fonts.regular, fontSize: 12 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 17 },
  field: { marginBottom: 16 },
  spaced: { marginTop: 10 },
});
