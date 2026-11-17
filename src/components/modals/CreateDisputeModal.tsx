import { useState } from 'react';
import {
  Modal,
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
import KeyboardSafeView from '@/components/KeyboardSafeView';
import { useTranslation } from 'react-i18next';

// Exact policy notice lines directly from Next.js web app (Disputes.jsx)
const WEB_POLICY_NOTICE = ['dispute.notice1', 'dispute.notice2', 'dispute.notice3', 'dispute.notice4'];

export const CUSTOMER_DISPUTE_CATEGORIES = [
  { value: 'payment_issue', label: 'dispute.categories.payment_issue' },
  { value: 'quality_of_work', label: 'dispute.categories.quality_of_work' },
  { value: 'service_not_provided', label: 'dispute.categories.service_not_provided' },
  { value: 'damaged_property', label: 'dispute.categories.damaged_property' },
  { value: 'unprofessional_behavior', label: 'dispute.categories.unprofessional_behavior' },
  { value: 'cancellation_issue', label: 'dispute.categories.cancellation_issue' },
  { value: 'other', label: 'dispute.categories.other' },
];

export const REPAIRMAN_DISPUTE_CATEGORIES = [
  { value: 'unfair_rating', label: 'dispute.categories.unfair_rating' },
  { value: 'late_payment', label: 'dispute.categories.late_payment' },
  { value: 'rude_behavior', label: 'dispute.categories.rude_behavior' },
  { value: 'cancellation_after_arrival', label: 'dispute.categories.cancellation_after_arrival' },
  { value: 'fake_request', label: 'dispute.categories.fake_request' },
  { value: 'other', label: 'dispute.categories.other' },
];

export interface CreateDisputeModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { category: string; description: string }) => Promise<void> | void;
  role?: 'customer' | 'repairman';
  isSubmitting?: boolean;
}

export default function CreateDisputeModal({
  visible,
  onClose,
  onSubmit,
  role = 'customer',
  isSubmitting = false,
}: CreateDisputeModalProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const categories =
    role === 'repairman' ? REPAIRMAN_DISPUTE_CATEGORIES : CUSTOMER_DISPUTE_CATEGORIES;

  const reset = () => {
    setCategory('');
    setDescription('');
    setShowCategoryDropdown(false);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    reset();
    onClose();
  };

  const selectedCategoryLabel =
    categories.find(c => c.value === category)?.label || 'dispute.selectCategory';

  const canSubmit = Boolean(category && description.trim().length >= 5 && !isSubmitting);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onSubmit({ category, description: description.trim() });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}>
      <KeyboardSafeView
        style={styles.avoiding}>
        <View style={[styles.backdrop, { backgroundColor: colors.backdrop }]}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Header */}
            <View style={styles.head}>
              <Text style={[styles.title, { color: colors.text }]}>{t('dispute.reportProblem')}</Text>
              <Pressable onPress={handleClose} hitSlop={8} disabled={isSubmitting}>
                <Icon source={closeIcon} size={16} color={colors.textMuted} />
              </Pressable>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {/* Category Picker */}
              <Text style={[styles.label, styles.firstLabel, { color: colors.text }]}>
                {t('dispute.category')}
              </Text>
              <Pressable
                onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                disabled={isSubmitting}
                style={[
                  styles.selectInput,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}>
                <Text numberOfLines={1} adjustsFontSizeToFit
                  style={[
                    styles.selectText,
                    { color: category ? colors.text : colors.textMuted },
                  ]}>
                  {t(selectedCategoryLabel)}
                </Text>
              </Pressable>

              {showCategoryDropdown && (
                <View
                  style={[
                    styles.dropdownMenu,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}>
                  {categories.map(c => {
                    const isSelected = c.value === category;
                    return (
                      <Pressable
                        key={c.value}
                        onPress={() => {
                          setCategory(c.value);
                          setShowCategoryDropdown(false);
                        }}
                        style={[
                          styles.dropdownItem,
                          isSelected && { backgroundColor: colors.primary + '18' },
                        ]}>
                        <Text
                          style={[
                            styles.dropdownItemText,
                            {
                              color: isSelected ? colors.primary : colors.text,
                              fontFamily: isSelected ? fonts.bold : fonts.regular,
                            },
                          ]}>
                          {t(c.label)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* Description */}
              <Text style={[styles.label, { color: colors.text }]}>
                {t('dispute.description')}
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder={t('dispute.placeholder')}
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={500}
                editable={!isSubmitting}
                style={[
                  styles.textarea,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceAlt,
                  },
                ]}
              />
              <Text style={[styles.counter, { color: colors.textMuted }]}>
                {description.length}/500
              </Text>

              {/* Exact Web Policy Notice */}
              <View style={[styles.notice, { backgroundColor: colors.primary + '14', borderColor: colors.primary + '30' }]}>
                <Text style={[styles.noticeTitle, { color: colors.text }]}>{t('dispute.importantNotice')}</Text>
                {WEB_POLICY_NOTICE.map(line => (
                  <Text key={line} style={[styles.noticeLine, { color: colors.textMuted }]}>
                    • {t(line)}
                  </Text>
                ))}
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={styles.actions}>
              <Button
                title={isSubmitting ? t('dispute.submitting') : t('dispute.submit')}
                size="md"
                disabled={!canSubmit}
                loading={isSubmitting}
                onPress={handleSubmit}
                style={styles.action}
                contentStyle={{ paddingHorizontal: 10 }}
                textStyle={{ fontSize: 14 }}
              />
              <Button
                title={t('common.cancel')}
                variant="soft"
                size="md"
                disabled={isSubmitting}
                onPress={handleClose}
                style={styles.action}
                contentStyle={{ paddingHorizontal: 10 }}
                textStyle={{ fontSize: 14 }}
              />
            </View>
          </View>
        </View>
      </KeyboardSafeView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  avoiding: { flex: 1 },
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxHeight: '88%', borderRadius: 16, borderWidth: 1, padding: 20 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 17 },
  divider: { height: 1, marginTop: 14, marginBottom: 16 },

  label: { fontFamily: fonts.bold, fontSize: 13, marginBottom: 8, marginTop: 16 },
  firstLabel: { marginTop: 0 },
  selectInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  selectText: { fontFamily: fonts.medium, fontSize: 14 },
  dropdownMenu: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 6,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  dropdownItemText: { fontSize: 13 },

  textarea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  counter: { fontFamily: fonts.regular, fontSize: 11, textAlign: 'right', marginTop: 4 },

  notice: { borderRadius: 12, borderWidth: 1, padding: 14, marginTop: 16 },
  noticeTitle: { fontFamily: fonts.bold, fontSize: 13, marginBottom: 8 },
  noticeLine: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, marginTop: 2 },

  actions: { flexDirection: 'row', gap: 12, marginTop: 18 },
  action: { flex: 1 },
});
