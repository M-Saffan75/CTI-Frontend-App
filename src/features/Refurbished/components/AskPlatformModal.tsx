import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { checkCircleFilled, closeIcon } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

interface AskPlatformModalProps {
  visible: boolean;
  productName: string;
  onClose: () => void;
  onSend?: (subject: string, message: string) => void;
}

const QUICK_TOPICS = [
  'Warranty Details',
  'Stock availability',
  'Condition details',
  'Shipping & Delivery',
];

export default function AskPlatformModal({
  visible,
  productName,
  onClose,
  onSend,
}: AskPlatformModalProps) {
  const { colors } = useTheme();
  const [selectedTopic, setSelectedTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleTopicPress = (topic: string) => {
    setSelectedTopic(topic);
    setSubject(topic);
  };

  const handleSend = () => {
    if (!message?.trim()) return;
    onSend?.(subject, message);
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      setMessage('');
      setSubject('');
      setSelectedTopic('');
      onClose();
    }, 1400);
  };

  const handleDismiss = () => {
    setSentSuccess(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleDismiss}>
      <Pressable style={styles.backdrop} onPress={handleDismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrap}>
          <Pressable
            style={[
              styles.dialog,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border + '33',
              },
            ]}
            onPress={e => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.dialogHeader}>
              <View style={styles.titleCol}>
                <Text style={[styles.dialogTitle, { color: colors.text }]}>
                  Ask the Platform
                </Text>
                <Text style={[styles.productSub, { color: colors.textMuted }]}>
                  {productName || 'Apple I phone 15 pro'}
                </Text>
              </View>
              <TouchableOpacity onPress={handleDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon source={closeIcon} size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border + '33' }]} />

            {sentSuccess ? (
              <View style={styles.successBox}>
                <Icon source={checkCircleFilled} size={50} color={colors.primary} />
                <Text style={[styles.successTitle, { color: colors.text }]}>Message Sent!</Text>
                <Text style={[styles.successSub, { color: colors.textMuted }]}>
                  CTI platform specialists will answer your question shortly in your enquiries.
                </Text>
              </View>
            ) : (
              <>
                {/* Quick Topics */}
                <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
                  Quick Topics
                </Text>
                <View style={styles.topicsGrid}>
                  {QUICK_TOPICS.map(topic => {
                    const isSelected = selectedTopic === topic;
                    return (
                      <TouchableOpacity
                        key={topic}
                        onPress={() => handleTopicPress(topic)}
                        style={[
                          styles.topicChip,
                          {
                            backgroundColor: isSelected ? colors.primary + '18' : colors.surfaceAlt,
                            borderColor: isSelected ? colors.primary : colors.border + '44',
                          },
                        ]}>
                        <Text
                          style={[
                            styles.topicText,
                            { color: isSelected ? colors.primary : colors.text },
                          ]}>
                          {topic}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Subject Input */}
                <TextInput
                  value={subject}
                  onChangeText={setSubject}
                  placeholder="Subject"
                  placeholderTextColor={colors.textMuted + '99'}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surfaceAlt,
                      color: colors.text,
                      borderColor: colors.border + '33',
                    },
                  ]}
                />

                {/* Message Input */}
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Write your message here..."
                  placeholderTextColor={colors.textMuted + '99'}
                  multiline
                  numberOfLines={4}
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: colors.surfaceAlt,
                      color: colors.text,
                      borderColor: colors.border + '33',
                    },
                  ]}
                />

                {/* Action Buttons */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    onPress={handleDismiss}
                    style={[styles.cancelBtn, { backgroundColor: colors.surfaceAlt }]}>
                    <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
                  </TouchableOpacity>

                  <Squeeze
                    onPress={handleSend}
                    style={[
                      styles.sendBtn,
                      { backgroundColor: colors.primary, opacity: message?.trim() ? 1 : 0.6 },
                    ]}>
                    <Text style={styles.sendBtnText}>Send Message</Text>
                  </Squeeze>
                </View>
              </>
            )}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  keyboardWrap: {
    width: '100%',
    maxWidth: 420,
  },
  dialog: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 8,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  titleCol: {
    flex: 1,
  },
  dialogTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
  },
  productSub: {
    fontSize: 13,
    fontFamily: fonts.regular,
    marginTop: 3,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
    marginBottom: 8,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  topicChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  topicText: {
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: fonts.regular,
    marginBottom: 12,
  },
  textArea: {
    height: 96,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
    fontSize: 14,
    fontFamily: fonts.regular,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  sendBtn: {
    flex: 1.4,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  successTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    marginTop: 12,
  },
  successSub: {
    fontSize: 13,
    fontFamily: fonts.regular,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
  },
});
