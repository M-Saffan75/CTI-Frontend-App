import { useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { arrowLeftBold, sendBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { CHATS, getChatById } from '../data/chats';

function Bubble({ message, chat }) {
  const { colors } = useTheme();

  // A soft tint of the brand colour for what I sent, plain surface for what
  // came in — enough to tell them apart without shouting.
  const bubble = (
    <View
      style={[
        styles.bubble,
        message.fromMe
          ? { backgroundColor: colors.primary + '1F', borderColor: colors.primary + '40' }
          : { backgroundColor: colors.surface, borderColor: colors.border },
        message.fromMe ? styles.bubbleMine : styles.bubbleTheirs,
      ]}>
      <Text style={[styles.bubbleText, { color: colors.text }]}>{message.text}</Text>
      <Text style={[styles.bubbleTime, { color: colors.textMuted }]}>{message.time}</Text>
    </View>
  );

  const avatar = <Image source={{ uri: chat.avatar }} style={styles.bubbleAvatar} />;

  // Written out both ways instead of one row with a flex-direction flip —
  // that trick reverses child ORDER, not just alignment, and put the avatar
  // on the wrong side.
  if (message.fromMe) {
    return (
      <View style={[styles.bubbleRow, styles.bubbleRowMine]}>
        {bubble}
        {avatar}
      </View>
    );
  }

  return (
    <View style={styles.bubbleRow}>
      {avatar}
      {bubble}
    </View>
  );
}

export default function ChatDetailScreen({ navigation, route }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const chat = getChatById(route.params?.chatId) ?? CHATS[0];

  const [messages, setMessages] = useState(chat.messages);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef(null);

  const send = () => {
    const text = draft.trim();
    if (!text) return;

    const now = new Date();
    setMessages(current => [
      ...current,
      {
        id: `local-${now.getTime()}`,
        fromMe: true,
        text,
        date: 'Today',
        time: now.toTimeString().slice(0, 5),
      },
    ]);
    setDraft('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Squeeze onPress={() => navigation.goBack()} scale={0.9}>
          <View style={[styles.back, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={18} color={colors.onPrimary} />
          </View>
        </Squeeze>

        <Image source={{ uri: chat.avatar }} style={styles.headerAvatar} />

        <View style={styles.headerText}>
          <Text style={[styles.headerName, { color: colors.text }]}>{chat.name}</Text>
          <View style={styles.statusRow}>
            <View
              style={[styles.onlineDot, { backgroundColor: chat.online ? colors.success : colors.textMuted }]}
            />
            <Text style={[styles.headerSubtitle, { color: chat.online ? colors.success : colors.textMuted }]}>
              {chat.online ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
        {messages.map((message, index) => {
          // Only the first message of each day gets a date separator.
          const showDate = index === 0 || message.date !== messages[index - 1].date;

          return (
            <View key={message.id} style={styles.messageGroup}>
              {showDate && (
                <View style={[styles.dateChip, { backgroundColor: colors.surfaceAlt }]}>
                  <Text style={[styles.dateChipText, { color: colors.textMuted }]}>{message.date}</Text>
                </View>
              )}
              <Bubble message={message} chat={chat} />
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.inputRow, { paddingBottom: insets.bottom + 12, borderTopColor: colors.border }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Type Your reply here"
          placeholderTextColor={colors.textMuted}
          multiline
          style={[styles.input, { color: colors.text, backgroundColor: colors.surfaceAlt }]}
        />
        <Squeeze onPress={send} scale={0.9}>
          <View style={[styles.sendButton, { backgroundColor: colors.primary }]}>
            <Icon source={sendBold} size={18} color={colors.onPrimary} />
          </View>
        </Squeeze>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerAvatar: { width: 44, height: 44, borderRadius: 22 },
  headerText: { flex: 1 },
  headerName: { fontFamily: fonts.bold, fontSize: 17 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  headerSubtitle: { fontFamily: fonts.regular, fontSize: 12 },

  body: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20, gap: 12 },
  messageGroup: { gap: 12 },
  dateChip: { alignSelf: 'center', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 6, marginTop: 6 },
  dateChipText: { fontFamily: fonts.medium, fontSize: 12 },

  // Both alignSelf and alignItems have to be explicit. On their defaults the
  // row stretched to full width and the avatar sat at the bubble's bottom,
  // so it drifted around as message heights changed.
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    maxWidth: '88%',
    alignSelf: 'flex-start',
  },
  bubbleRowMine: { alignSelf: 'flex-end' },
  bubbleAvatar: { width: 34, height: 34, borderRadius: 17 },
  bubble: { flexShrink: 1, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
  bubbleTheirs: { borderTopLeftRadius: 4 },
  bubbleMine: { borderTopRightRadius: 4 },
  bubbleText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20 },
  bubbleTime: { fontFamily: fonts.regular, fontSize: 10, alignSelf: 'flex-end', marginTop: 6 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 13,
    maxHeight: 100,
  },
  sendButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
