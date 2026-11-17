import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import Button from '@/components/Button';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { SellerBankDetails } from '@/roles/Seller/services/sellerApi';
import { formatMoney } from '@/roles/Seller/utils/sellerUtils';
import { currencySymbol } from '@/utils/money';
import KeyboardSafeView from '@/components/KeyboardSafeView';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

export const MIN_WITHDRAWAL = 500;

interface Props {
  visible: boolean;
  available: number;
  // undefined = could not be checked, null = no bank details saved
  bank: SellerBankDetails | null | undefined;
  bankCheckFailed?: boolean;
  onRetryBank?: () => void;
  submitting: boolean;
  onSubmit: (amount: number) => void;
  onClose: () => void;
  onAddBank: () => void;
}

// Same rules as the web withdrawal box: minimum 500, not above the available balance.
export default function WithdrawModal({
  visible,
  available,
  bank,
  bankCheckFailed = false,
  onRetryBank,
  submitting,
  onSubmit,
  onClose,
  onAddBank,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setAmount('');
      setError('');
    }
  }, [visible]);

  const handleSubmit = () => {
    const value = parseFloat(amount);
    if (!value || value < MIN_WITHDRAWAL) {
      setError(i18n.t('sellerMsg.withdraw.minimum', { amount: formatMoney(MIN_WITHDRAWAL) }));
      return;
    }
    if (value > available) {
      setError(i18n.t('sellerMsg.withdraw.exceeds', { amount: formatMoney(available) }));
      return;
    }
    setError('');
    onSubmit(value);
  };

  const bankMissing = bank === null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardSafeView
        style={[styles.center, { backgroundColor: colors.backdrop }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={submitting ? undefined : onClose} />
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t('sellerAuto.requestWithdrawal')}</Text>

          <View style={[styles.balanceBox, { backgroundColor: colors.success + '20' }]}>
            <Text style={[styles.balanceLabel, { color: colors.success }]}>{t('sellerAuto.availableBalance')}</Text>
            <Text style={[styles.balanceValue, { color: colors.success }]}>{formatMoney(available)}</Text>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>{i18n.t('sellerMsg.withdraw.amountLabel', { symbol: currencySymbol() })}</Text>
          <TextInput
            value={amount}
            onChangeText={text => {
              setAmount(text.replace(',', '.'));
              if (error) setError('');
            }}
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            editable={!submitting}
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.surfaceAlt,
                borderColor: error ? colors.error : colors.border,
              },
            ]}
          />
          {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

          <Pressable
            disabled={submitting || available <= 0}
            onPress={() => {
              setAmount((Math.floor(available * 100) / 100).toFixed(2));
              setError('');
            }}>
            <Text style={[styles.link, { color: colors.primary }]}>
              {i18n.t('sellerMsg.withdraw.all', { amount: formatMoney(available) })}
            </Text>
          </Pressable>

          {bankMissing ? (
            <View style={[styles.infoBox, { backgroundColor: colors.error + '15' }]}>
              <Text style={[styles.infoText, { color: colors.error }]}>
                {t('sellerAuto.pleaseAddYourBankDetails')}
              </Text>
              <Button title={t('repairman.addBankDetails')} size="sm" variant="outline" onPress={onAddBank} />
            </View>
          ) : (
            <View style={[styles.infoBox, { backgroundColor: colors.primary + '15' }]}>
              {bank ? (
                <Text style={[styles.infoText, { color: colors.text }]}>
                  {i18n.t('sellerMsg.withdraw.bank', { bank: bank.bankName || t('sellerAuto.yourBank'), last4: bank.accountNumber.slice(-4) })}
                </Text>
              ) : null}
              {bank === undefined && bankCheckFailed ? (
                <Pressable onPress={onRetryBank}>
                  <Text style={[styles.infoText, { color: colors.error }]}>
                    {t('seller.bankCheckFailed')} {t('common.tryAgain')}
                  </Text>
                </Pressable>
              ) : null}
              <Text style={[styles.infoText, { color: colors.textMuted }]}>
                {t('sellerAuto.fundsWillBeTransferredTo')}
              </Text>
            </View>
          )}

          <View style={styles.actions}>
            <Button
              title={t('common.cancel')}
              variant="soft"
              size="md"
              fullWidth={false}
              style={styles.action}
              disabled={submitting}
              onPress={onClose}
            />
            <Button
              title={t('sellerAuto.submitRequest')}
              size="md"
              fullWidth={false}
              style={styles.action}
              loading={submitting}
              disabled={bankMissing}
              onPress={handleSubmit}
            />
          </View>
        </View>
      </KeyboardSafeView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 400, borderRadius: 20, padding: 18, gap: 8 },
  title: { fontFamily: fonts.bold, fontSize: 18, marginBottom: 4 },
  balanceBox: { borderRadius: 14, padding: 14, marginBottom: 6 },
  balanceLabel: { fontFamily: fonts.medium, fontSize: 12 },
  balanceValue: { fontFamily: fonts.bold, fontSize: 20, marginTop: 2 },
  label: { fontFamily: fonts.bold, fontSize: 13, marginTop: 4 },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: fonts.medium,
    fontSize: 15,
  },
  error: { fontFamily: fonts.regular, fontSize: 12 },
  link: { fontFamily: fonts.bold, fontSize: 12, paddingVertical: 4 },
  infoBox: { borderRadius: 12, padding: 12, gap: 8, marginTop: 4 },
  infoText: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  action: { flex: 1 },
});
