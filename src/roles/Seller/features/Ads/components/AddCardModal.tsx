import { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import Button from '@/components/Button';
import Icon from '@/components/Icon';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import { timesSquareBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { PaymentCard } from '../data/adsData';

interface AddCardModalProps {
  visible: boolean;
  onClose: () => void;
  onCardAdded: (card: PaymentCard) => void;
}

export default function AddCardModal({ visible, onClose, onCardAdded }: AddCardModalProps) {
  const { colors } = useTheme();
  const [holderName, setHolderName] = useState('Jhon Deo');
  const [cardNumber, setCardNumber] = useState('5528 7900 0000 0008');
  const [month, setMonth] = useState('12');
  const [year, setYear] = useState('30');
  const [cvv, setCvv] = useState('123');

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
    if (!holderName.trim() || cardNumber.length < 12) {
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Incomplete Form',
        message: 'Please fill in all card details accurately before saving.',
      });
      return;
    }

    const last4 = cardNumber.slice(-4) || '0008';
    const newCard: PaymentCard = {
      id: `card-${Date.now()}`,
      cardNumber: `•••• •••• •••• ${last4}`,
      cardHolder: holderName.trim(),
      expiry: `${month}/${year}`,
      cardType: 'Mastercard',
      isDefault: true,
    };

    setAlertConfig({
      visible: true,
      type: 'success',
      title: 'Card Saved',
      message: 'Your ad billing payment method has been verified and activated.',
      onOk: () => {
        onCardAdded(newCard);
        onClose();
      },
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.box, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Add New Card</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon source={timesSquareBold} size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Stylized Ad Campaign Card Preview matching Add Card POPUP.png */}
          <View style={[styles.cardPreview, { backgroundColor: colors.primary }]}>
            <View style={styles.cardPreviewTop}>
              <Text style={styles.cardPreviewLabel}>Ad Campaign Card</Text>
              <View style={styles.mastercardCircles}>
                <View style={[styles.mcCircle, { backgroundColor: '#EB001B' }]} />
                <View style={[styles.mcCircle, { backgroundColor: '#F79E1B', marginLeft: -8 }]} />
              </View>
            </View>

            <View style={styles.chipRow}>
              <Text style={styles.chipIcon}>💳</Text>
              <Text style={styles.contactlessIcon}>ᯤ</Text>
            </View>

            <Text style={styles.cardNumberPreview}>•••• •••• •••• 0008</Text>

            <View style={styles.cardPreviewBottom}>
              <View>
                <Text style={styles.cardHolderLabel}>CARDHOLDER</Text>
                <Text style={styles.cardHolderVal}>{holderName || 'Jhon Deo'}</Text>
              </View>
              <View>
                <Text style={styles.cardHolderLabel}>EXPIRES</Text>
                <Text style={styles.cardHolderVal}>{month}/{year}</Text>
              </View>
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Cardholder Name</Text>
              <TextInput
                style={[
                  styles.input,
                  { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceAlt },
                ]}
                placeholder="Jhon Deo"
                placeholderTextColor={colors.textMuted}
                value={holderName}
                onChangeText={setHolderName}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Card Number</Text>
              <TextInput
                style={[
                  styles.input,
                  { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceAlt },
                ]}
                placeholder="5528 7900 0000 0008"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={cardNumber}
                onChangeText={setCardNumber}
              />
            </View>

            {/* 3 Column Row: Month, Year, CVV */}
            <View style={styles.rowThree}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Month</Text>
                <TextInput
                  style={[
                    styles.input,
                    { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceAlt },
                  ]}
                  placeholder="12"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  maxLength={2}
                  value={month}
                  onChangeText={setMonth}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Year</Text>
                <TextInput
                  style={[
                    styles.input,
                    { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceAlt },
                  ]}
                  placeholder="30"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  maxLength={2}
                  value={year}
                  onChangeText={setYear}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>CVV</Text>
                <TextInput
                  style={[
                    styles.input,
                    { borderColor: colors.border, color: colors.text, backgroundColor: colors.surfaceAlt },
                  ]}
                  placeholder="123"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  value={cvv}
                  onChangeText={setCvv}
                />
              </View>
            </View>

            {/* Tokenized encryption note */}
            <Text style={[styles.noteText, { color: colors.textMuted }]}>
              Your card details are tokenized securely with 256-bit AES encryption.
            </Text>

            {/* Sandbox Test Cards Box matching Figma */}
            <View style={[styles.sandboxBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <Text style={[styles.sandboxTitle, { color: colors.text }]}>Sandbox Test Cards</Text>
              <Text style={[styles.sandboxLine, { color: colors.textMuted }]}>
                Mastercard: 5528 7900 0000 0008
              </Text>
              <Text style={[styles.sandboxLine, { color: colors.textMuted }]}>
                Expiry: 12/30 | CVV: 123
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.btnRow}>
              <Button
                title="Save Card"
                variant="primary"
                size="md"
                onPress={handleSubmit}
                style={{ flex: 1 }}
              />
              <Button
                title="Cancel"
                variant="outline"
                size="md"
                onPress={onClose}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </View>

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
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  box: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontFamily: fonts.bold, fontSize: 18 },

  cardPreview: {
    borderRadius: 14,
    padding: 16,
    gap: 10,
    elevation: 3,
  },
  cardPreviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardPreviewLabel: { color: '#fff', fontFamily: fonts.medium, fontSize: 12 },
  mastercardCircles: { flexDirection: 'row' },
  mcCircle: { width: 18, height: 18, borderRadius: 9, opacity: 0.9 },

  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipIcon: { fontSize: 20 },
  contactlessIcon: { color: '#fff', fontSize: 16 },

  cardNumberPreview: {
    color: '#fff',
    fontFamily: fonts.bold,
    fontSize: 16,
    letterSpacing: 2,
    marginVertical: 4,
  },
  cardPreviewBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardHolderLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 9, fontFamily: fonts.medium },
  cardHolderVal: { color: '#fff', fontFamily: fonts.bold, fontSize: 12, marginTop: 2 },

  form: { gap: 10 },
  fieldGroup: { gap: 4 },
  label: { fontFamily: fonts.medium, fontSize: 12 },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 40,
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  rowThree: { flexDirection: 'row', gap: 10 },

  noteText: { fontFamily: fonts.regular, fontSize: 11, textAlign: 'center' },

  sandboxBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 2,
  },
  sandboxTitle: { fontFamily: fonts.bold, fontSize: 12, marginBottom: 2 },
  sandboxLine: { fontFamily: fonts.regular, fontSize: 11 },

  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
