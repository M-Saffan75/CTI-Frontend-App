import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import { closeIcon } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

export default function UpSellModal({ visible, onClose, onSubmit }) {
  const { colors } = useTheme();
  const [price, setPrice] = useState('');
  const [reason, setReason] = useState('');

  const reset = () => {
    setPrice('');
    setReason('');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.avoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.backdrop, { backgroundColor: colors.backdrop }]}>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.head}>
              <Text style={[styles.title, { color: colors.text }]}>Revised Quotation</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <Icon source={closeIcon} size={16} color={colors.textMuted} />
              </Pressable>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={[styles.label, styles.firstLabel, { color: colors.text }]}>New Total Price (TRY)</Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                placeholder="e.g. 4000"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
              />

              <Text style={[styles.label, { color: colors.text }]}>Reason for Price Update</Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="Explain the additional fault found (e.g. IC Short, Screen Damage)"
                placeholderTextColor={colors.textMuted}
                multiline
                style={[styles.textarea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
              />

              <Text style={[styles.note, { color: colors.textMuted }]}>
                *Note: Customer will receive a notification to approve or reject this new price.
              </Text>
            </ScrollView>

            <View style={styles.actions}>
              <Button
                title="Send Revision"
                size="sm"
                onPress={() => {
                  onSubmit?.({ price, reason });
                  reset();
                }}
                style={styles.action}
              />
              <Button title="Cancel" variant="soft" size="sm" onPress={onClose} style={styles.action} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  avoiding: { flex: 1 },
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxHeight: '85%', borderRadius: 16, padding: 20 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 17 },
  divider: { height: 1, marginTop: 14, marginBottom: 16 },

  label: { fontFamily: fonts.bold, fontSize: 13, marginBottom: 8, marginTop: 18 },
  firstLabel: { marginTop: 0 },
  input: { borderWidth: 1, borderRadius: 10, height: 48, paddingHorizontal: 14, fontFamily: fonts.regular, fontSize: 14 },
  textarea: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    minHeight: 90,
    textAlignVertical: 'top',
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  note: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 16, marginTop: 12 },

  actions: { flexDirection: 'row', gap: 12, marginTop: 18 },
  action: { flex: 1 },
});
