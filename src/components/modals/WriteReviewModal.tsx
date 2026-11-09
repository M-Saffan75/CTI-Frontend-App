import { useState } from 'react';
import {
  Image,
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
import { closeIcon, starBold, starFilled } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

export interface ReviewTargetJob {
  bookingId: string;
  jobId?: string;
  repairmanId: string;
  repairmanName?: string;
  repairmanAvatar?: string;
  deviceTitle?: string;
}

export interface WriteReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    bookingId: string;
    jobId?: string;
    repairmanId: string;
    overallRating: number;
    reviewText: string;
  }) => Promise<void> | void;
  job: ReviewTargetJob | null;
  isSubmitting?: boolean;
}

const RATING_LABELS = ['', 'Terrible', 'Bad', 'Okay', 'Good', 'Excellent'];

export default function WriteReviewModal({
  visible,
  onClose,
  onSubmit,
  job,
  isSubmitting = false,
}: WriteReviewModalProps) {
  const { colors } = useTheme();
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('');

  const reset = () => {
    setRating(5);
    setReviewText('');
  };

  const handleClose = () => {
    if (isSubmitting) return;
    reset();
    onClose();
  };

  const canSubmit = Boolean(
    job?.bookingId &&
      job?.repairmanId &&
      rating >= 1 &&
      rating <= 5 &&
      reviewText.trim().length > 0 &&
      !isSubmitting,
  );

  const handleSubmit = async () => {
    if (!canSubmit || !job) return;
    await onSubmit({
      bookingId: job.bookingId,
      jobId: job.jobId,
      repairmanId: job.repairmanId,
      overallRating: rating,
      reviewText: reviewText.trim(),
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.avoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.backdrop, { backgroundColor: colors.backdrop }]}>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            {/* Header */}
            <View style={styles.head}>
              <Text style={[styles.title, { color: colors.text }]}>
                Write a Review
              </Text>
              <Pressable onPress={handleClose} hitSlop={8} disabled={isSubmitting}>
                <Icon source={closeIcon} size={16} color={colors.textMuted} />
              </Pressable>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {/* Technician Info */}
              {job && (
                <View
                  style={[
                    styles.techCard,
                    {
                      backgroundColor: colors.surfaceAlt,
                      borderColor: colors.border,
                    },
                  ]}>
                  {job.repairmanAvatar ? (
                    <Image
                      source={{ uri: job.repairmanAvatar }}
                      style={[
                        styles.avatar,
                        { borderColor: colors.avatarBorder, borderWidth: 1.5 },
                      ]}
                    />
                  ) : (
                    <View
                      style={[
                        styles.avatar,
                        styles.avatarFallback,
                        {
                          backgroundColor: colors.primary + '20',
                          borderColor: colors.avatarBorder,
                          borderWidth: 1.5,
                        },
                      ]}>
                      <Text
                        style={[styles.avatarInitial, { color: colors.primary }]}>
                        {(job.repairmanName || 'T')[0]?.toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.techMeta}>
                    <Text
                      numberOfLines={1}
                      style={[styles.techName, { color: colors.text }]}>
                      {job.repairmanName || 'Technician'}
                    </Text>
                    {Boolean(job.deviceTitle) && (
                      <Text
                        numberOfLines={1}
                        style={[styles.deviceTitle, { color: colors.textMuted }]}>
                        {job.deviceTitle}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* Star Rating */}
              <Text style={[styles.label, { color: colors.text }]}>
                Overall Rating *
              </Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(star => {
                  const filled = star <= rating;
                  return (
                    <Pressable
                      key={star}
                      onPress={() => setRating(star)}
                      disabled={isSubmitting}
                      hitSlop={6}
                      style={styles.starTouch}>
                      <Icon
                        source={filled ? starFilled : starBold}
                        size={28}
                        color={filled ? '#F59E0B' : colors.textMuted}
                      />
                    </Pressable>
                  );
                })}
                <Text style={[styles.ratingLabel, { color: colors.textMuted }]}>
                  {RATING_LABELS[rating] || ''}
                </Text>
              </View>

              {/* Review Text */}
              <Text style={[styles.label, { color: colors.text }]}>
                Your Review (max 500 chars) *
              </Text>
              <TextInput
                value={reviewText}
                onChangeText={setReviewText}
                placeholder="Share your experience with this technician and repair service..."
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
                {reviewText.length}/500
              </Text>
            </ScrollView>

            {/* Actions */}
            <View style={styles.actions}>
              <Button
                title={isSubmitting ? 'Submitting...' : 'Submit Review'}
                size="md"
                disabled={!canSubmit}
                loading={isSubmitting}
                onPress={handleSubmit}
                style={styles.action}
                contentStyle={{ paddingHorizontal: 10 }}
                textStyle={{ fontSize: 14 }}
              />
              <Button
                title="Cancel"
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
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  avoiding: { flex: 1 },
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxHeight: '88%', borderRadius: 16, borderWidth: 1, padding: 20 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 17 },
  divider: { height: 1, marginTop: 14, marginBottom: 16 },

  techCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: fonts.bold, fontSize: 16 },
  techMeta: { flex: 1 },
  techName: { fontFamily: fonts.bold, fontSize: 14 },
  deviceTitle: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },

  label: { fontFamily: fonts.bold, fontSize: 13, marginBottom: 8, marginTop: 12 },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    paddingVertical: 4,
  },
  starTouch: { padding: 2 },
  ratingLabel: { fontFamily: fonts.medium, fontSize: 13, marginLeft: 8 },

  textarea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 110,
    textAlignVertical: 'top',
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  counter: { fontFamily: fonts.regular, fontSize: 11, textAlign: 'right', marginTop: 4 },

  actions: { flexDirection: 'row', gap: 12, marginTop: 18 },
  action: { flex: 1 },
});
