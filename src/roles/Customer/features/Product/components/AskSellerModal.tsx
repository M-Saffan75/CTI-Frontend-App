import { useEffect, useState } from 'react';
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
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import Squeeze from '@/components/Squeeze';
import { closeIcon, commentDotsBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { sendProductQueryApi } from '../services/ecomApi';
import { sendChatMessageHttp, startChat } from '@/services/chatApi';

const OPEN_MS = 220;
const CLOSE_MS = 160;
const EASING = Easing.bezier(0.4, 0, 0.2, 1);

const ASK_QUICK_SUBJECTS = [
  'Warranty details?',
  'Shipping to my city?',
  'Stock availability',
  'Condition details',
];

export default function AskSellerModal({
  visible,
  productTitle,
  sellerName,
  sellerId,
  onClose,
  onSuccess,
  onOpenLiveChat,
}: {
  visible: boolean;
  productTitle: string;
  sellerName: string;
  sellerId: string;
  onClose: () => void;
  onSuccess?: () => void;
  onOpenLiveChat?: () => void;
}) {
  const { colors } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setError('');
      setSubject('');
      setMessage('');
      progress.value = withTiming(1, { duration: OPEN_MS, easing: EASING });
    } else if (mounted) {
      progress.value = withTiming(0, { duration: CLOSE_MS, easing: EASING }, finished => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [visible]);

  const backdrop = useAnimatedStyle(() => ({ opacity: progress.value }));
  const card = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.94 + progress.value * 0.06 }],
  }));

  const handleSend = async () => {
    if (!subject.trim()) {
      setError('Please enter or select a subject');
      return;
    }
    if (!message.trim()) {
      setError('Please enter your message');
      return;
    }
    if (!sellerId) {
      setError('Seller details not found');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Send query to /customer/queries (Matches Next.js query tracking)
      await sendProductQueryApi({
        sellerId,
        subject: subject.trim(),
        message: message.trim(),
      });

      setSubject('');
      setMessage('');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to send message to seller');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardWrap}>
        <Animated.View style={[styles.backdrop, backdrop]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
            card,
          ]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[styles.title, { color: colors.text }]}>
                Ask {sellerName || 'Seller'}
              </Text>
              <Text style={[styles.productName, { color: colors.textMuted }]} numberOfLines={1}>
                {productTitle}
              </Text>
            </View>
            <Squeeze onPress={onClose} scale={0.9} style={styles.closeWrap}>
              <Icon source={closeIcon} size={18} color={colors.text} />
            </Squeeze>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollBody}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {/* Quick Chips */}
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Quick Topics:</Text>
            <View style={styles.chipsRow}>
              {ASK_QUICK_SUBJECTS.map(item => {
                const active = subject === item;
                return (
                  <Squeeze key={item} onPress={() => setSubject(item)}>
                    <View
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active ? colors.primary : colors.surfaceAlt,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}>
                      <Text
                        style={[
                          styles.chipText,
                          { color: active ? colors.onPrimary : colors.text },
                        ]}>
                        {item}
                      </Text>
                    </View>
                  </Squeeze>
                );
              })}
            </View>

            {/* Subject Input */}
            <Text style={[styles.inputLabel, { color: colors.text }]}>Subject</Text>
            <TextInput
              value={subject}
              onChangeText={setSubject}
              placeholder="e.g. Warranty details?"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceAlt,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />

            {/* Message Input */}
            <Text style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>Message</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Type your question or query for the seller..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={[
                styles.textarea,
                {
                  backgroundColor: colors.surfaceAlt,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />

            {!!error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={onClose}
                style={{ flex: 1 }}
              />
              <Button
                title="Send Message"
                loading={loading}
                onPress={handleSend}
                style={{ flex: 1.3 }}
              />
            </View>

            {onOpenLiveChat && (
              <Squeeze
                onPress={() => {
                  onClose();
                  onOpenLiveChat();
                }}
                style={styles.liveChatRow}>
                <Icon source={commentDotsBold} size={16} color={colors.primary} />
                <Text style={[styles.liveChatText, { color: colors.primary }]}>
                  Or start instant live chat with seller
                </Text>
              </Squeeze>
            )}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  card: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 17,
  },
  productName: {
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 2,
  },
  closeWrap: {
    padding: 6,
    borderRadius: 8,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollBody: {
    padding: 18,
  },
  sectionLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  inputLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  textarea: {
    height: 90,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  liveChatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 6,
  },
  liveChatText: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
});
