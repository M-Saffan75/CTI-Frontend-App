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
import { closeIcon } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { CONTACT_TOPICS } from '../data/orderDetail';

const OPEN_MS = 220;
const CLOSE_MS = 160;
const EASING = Easing.bezier(0.4, 0, 0.2, 1);

export default function ContactSellerModal({ visible, orderId, onClose }) {
  const { colors } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
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

  const send = () => {
    // No backend yet — just clear the form and close.
    setSubject('');
    setMessage('');
    onClose();
  };

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      {/* Modal opens its own window, so it doesn't get the app's usual
          adjustResize behaviour for free — without this the keyboard covers
          Subject/Message instead of the card shrinking to make room. */}
      <KeyboardAvoidingView
        style={styles.center}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.backdrop }, backdrop]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.card, { backgroundColor: colors.background }, card]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Contact Seller</Text>
            <Squeeze onPress={onClose} scale={0.85}>
              <Icon source={closeIcon} size={18} color={colors.text} />
            </Squeeze>
          </View>
          <Text style={[styles.orderId, { color: colors.textMuted }]}>Order: {orderId}</Text>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.topics}>
              {CONTACT_TOPICS.map(topic => (
                <Squeeze key={topic} onPress={() => setSubject(topic)} style={styles.topicWrap}>
                  <View style={[styles.topic, { backgroundColor: colors.surfaceAlt }]}>
                    <Text style={[styles.topicText, { color: colors.text }]}>{topic}</Text>
                  </View>
                </Squeeze>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Subject</Text>
            <TextInput
              value={subject}
              onChangeText={setSubject}
              placeholder="What would you like to ask the seller?"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text }]}
            />

            <Text style={[styles.label, { color: colors.text }]}>Message</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Describe your issue or question in detail..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              style={[
                styles.input,
                styles.textarea,
                { backgroundColor: colors.inputBg, color: colors.text },
              ]}
            />

            <View style={styles.actions}>
              <Button title="Send Message" size="sm" onPress={send} style={styles.action} />
              <Button
                title="Cancel"
                variant="soft"
                size="sm"
                onPress={onClose}
                style={styles.action}
              />
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: 16,
    padding: 20,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: fonts.bold, fontSize: 18 },
  orderId: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },
  divider: { height: 1, marginTop: 14, marginBottom: 16 },

  topics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topicWrap: {},
  topic: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 },
  topicText: { fontFamily: fonts.regular, fontSize: 12 },

  label: { fontFamily: fonts.bold, fontSize: 14, marginTop: 18, marginBottom: 8 },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  textarea: { height: 90, textAlignVertical: 'top' },

  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  action: { flex: 1 },
});
