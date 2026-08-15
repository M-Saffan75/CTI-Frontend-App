import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import Squeeze from '@/components/Squeeze';
import { closeIcon, creditCardBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { QUICK_TOPUP_AMOUNTS } from '../data/earnings';

export default function TopUpWalletModal({ visible, onClose, onSubmit }) {
  const { colors } = useTheme();
  const [amount, setAmount] = useState(null);
  const [custom, setCustom] = useState('');

  const selected = custom ? Number(custom) : amount;

  const reset = () => {
    setAmount(null);
    setCustom('');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: colors.backdrop }]}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Pressable onPress={onClose} hitSlop={8} style={styles.close}>
            <Icon source={closeIcon} size={16} color={colors.textMuted} />
          </Pressable>

          <View style={[styles.iconWrap, { backgroundColor: colors.primary + '18' }]}>
            <Icon source={creditCardBold} size={26} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Top up Wallet</Text>

          <Text style={[styles.label, { color: colors.text }]}>Quick Select</Text>
          <View style={styles.quickRow}>
            {QUICK_TOPUP_AMOUNTS.map(value => (
              <Squeeze
                key={value}
                onPress={() => {
                  setAmount(value);
                  setCustom('');
                }}
                style={[
                  styles.quickChip,
                  { backgroundColor: amount === value ? colors.primary : colors.surfaceAlt },
                ]}>
                <Text style={[styles.quickChipText, { color: amount === value ? colors.onPrimary : colors.text }]}>
                  ₺{value}
                </Text>
              </Squeeze>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.text, marginTop: 16 }]}>Custom Amount</Text>
          <View style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}>
            <Text style={[styles.currency, { color: colors.textMuted }]}>₺</Text>
            <TextInput
              value={custom}
              onChangeText={text => {
                setCustom(text);
                setAmount(null);
              }}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              style={[styles.inputField, { color: colors.text }]}
            />
          </View>

          <Button
            title="Proceed to Pay"
            disabled={!selected}
            onPress={() => {
              onSubmit?.(selected);
              reset();
            }}
            style={styles.spaced}
          />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.secure, { color: colors.textMuted }]}>VISA • Mastercard • PayPal — Secure by iyzico</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', borderRadius: 18, padding: 22, alignItems: 'center' },
  close: { position: 'absolute', top: 16, right: 16, zIndex: 1 },
  iconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 20, marginTop: 12 },

  label: { alignSelf: 'flex-start', fontFamily: fonts.regular, fontSize: 13, marginTop: 20, marginBottom: 10 },
  quickRow: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  quickChip: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  quickChipText: { fontFamily: fonts.bold, fontSize: 14 },

  input: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'stretch', borderWidth: 1, borderRadius: 10, height: 48, paddingHorizontal: 14 },
  currency: { fontFamily: fonts.bold, fontSize: 14 },
  inputField: { flex: 1, fontFamily: fonts.regular, fontSize: 14, padding: 0 },

  spaced: { alignSelf: 'stretch', marginTop: 20 },
  divider: { height: 1, alignSelf: 'stretch', marginTop: 18, marginBottom: 12 },
  secure: { fontFamily: fonts.regular, fontSize: 11 },
});
