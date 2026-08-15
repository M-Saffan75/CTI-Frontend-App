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
import Select from '../../../components/Select';
import { DISPUTE_CATEGORIES } from '../data/jobs';

const NOTICE = [
  'Payment stays on hold until resolution.',
  "We'll review your case within 24-48 hours.",
  'Both parties will receive dispute updates.',
  'False disputes may lead to penalties.',
];

export default function CreateDisputeModal({ visible, onClose, onSubmit }) {
  const { colors } = useTheme();
  const [category, setCategory] = useState(null);
  const [description, setDescription] = useState('');

  const reset = () => {
    setCategory(null);
    setDescription('');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.avoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.backdrop, { backgroundColor: colors.backdrop }]}>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.head}>
              <Text style={[styles.title, { color: colors.text }]}>Request Statement</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <Icon source={closeIcon} size={16} color={colors.textMuted} />
              </Pressable>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={[styles.label, styles.firstLabel, { color: colors.text }]}>Dispute Category</Text>
              <Select placeholder="Select Category" value={category} options={DISPUTE_CATEGORIES} onChange={setCategory} />

              <Text style={[styles.label, { color: colors.text }]}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Please describe your issue in detail..."
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={1000}
                style={[styles.textarea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
              />
              <Text style={[styles.counter, { color: colors.textMuted }]}>{description.length}/1000</Text>

              <View style={[styles.notice, { backgroundColor: colors.primary + '14' }]}>
                <Text style={[styles.noticeTitle, { color: colors.text }]}>Important Notice</Text>
                {NOTICE.map(line => (
                  <Text key={line} style={[styles.noticeLine, { color: colors.textMuted }]}>
                    • {line}
                  </Text>
                ))}
              </View>
            </ScrollView>

            <View style={styles.actions}>
              <Button
                title="Submit Dispute"
                size="sm"
                onPress={() => {
                  onSubmit?.({ category, description });
                  reset();
                }}
                style={styles.action}
              />
              <Button title="Reset" variant="soft" size="sm" onPress={reset} style={styles.action} />
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
  textarea: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  counter: { fontFamily: fonts.regular, fontSize: 11, textAlign: 'right', marginTop: 4 },

  notice: { borderRadius: 12, padding: 14, marginTop: 16 },
  noticeTitle: { fontFamily: fonts.bold, fontSize: 13, marginBottom: 8 },
  noticeLine: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 19 },

  actions: { flexDirection: 'row', gap: 12, marginTop: 18 },
  action: { flex: 1 },
});
