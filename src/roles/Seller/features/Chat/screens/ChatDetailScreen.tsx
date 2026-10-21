import { useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { arrowLeftBold } from '@/assets/icons';
import { dummyProfileExtra } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

interface Message {
  id: string;
  sender: 'customer' | 'seller';
  text: string;
  time: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm-1',
    sender: 'customer',
    text: 'Is this available?',
    time: '30/06/2026, 04:39 PM',
  },
  {
    id: 'm-2',
    sender: 'customer',
    text: 'Is this available?',
    time: '30/06/2026, 04:40 PM',
  },
];

export default function ChatDetailScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const customerName = route?.params?.customerName || 'Customer';
  const queryId = route?.params?.queryId || 'QRY-000004';
  const question = route?.params?.question || 'Is this available?';

  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMsg: Message = {
      id: `m-${Date.now()}`,
      sender: 'seller',
      text: inputText.trim(),
      time: 'Just now',
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header matching Chat screen.png */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}>
        <Squeeze onPress={() => navigation?.goBack()} scale={0.9}>
          <View style={[styles.backBtn, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={18} color={colors.onPrimary} />
          </View>
        </Squeeze>

        <Image source={dummyProfileExtra} style={styles.avatar} />

        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <View style={styles.greenDot} />
            <Text style={[styles.headerName, { color: colors.text }]}>{customerName}</Text>
          </View>
          <Text style={[styles.querySubtitle, { color: colors.textMuted }]} numberOfLines={1}>
            {question} - ID: {queryId}
          </Text>
        </View>
      </View>

      {/* Date Pill matching Chat screen.png */}
      <View style={styles.dateSeparatorWrap}>
        <View style={[styles.datePill, { backgroundColor: colors.surfaceAlt }]}>
          <Text style={[styles.datePillText, { color: colors.textMuted }]}>30 June 2026</Text>
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.messagesContainer, { paddingBottom: 16 }]}
        renderItem={({ item }) => {
          const isSeller = item.sender === 'seller';
          return (
            <View
              style={[
                styles.messageRow,
                isSeller ? styles.messageRowRight : styles.messageRowLeft,
              ]}>
              <View
                style={[
                  styles.bubble,
                  isSeller
                    ? [styles.bubbleSeller, { backgroundColor: colors.primary }]
                    : [
                        styles.bubbleCustomer,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                      ],
                ]}>
                <Text
                  style={[
                    styles.messageText,
                    { color: isSeller ? colors.onPrimary : colors.text },
                  ]}>
                  {item.text}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    { color: isSeller ? 'rgba(255,255,255,0.7)' : colors.textMuted },
                  ]}>
                  {item.time}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {/* Bottom Input Pill matching Chat screen.png */}
      <View
        style={[
          styles.inputContainer,
          {
            paddingBottom: insets.bottom + 12,
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        ]}>
        <View
          style={[
            styles.inputPill,
            { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
          ]}>
          <TextInput
            placeholder="Type Your reply here"
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            style={[styles.inputField, { color: colors.text }]}
          />
          <TouchableOpacity
            onPress={handleSend}
            style={[styles.sendCircleBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.sendArrow}>➤</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  headerInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  greenDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10B981' },
  headerName: { fontFamily: fonts.bold, fontSize: 15 },
  querySubtitle: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },

  dateSeparatorWrap: { alignItems: 'center', marginVertical: 12 },
  datePill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
  },
  datePillText: { fontFamily: fonts.medium, fontSize: 12 },

  messagesContainer: { paddingHorizontal: 16, gap: 12 },
  messageRow: { flexDirection: 'row' },
  messageRowLeft: { justifyContent: 'flex-start' },
  messageRowRight: { justifyContent: 'flex-end' },

  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 4,
  },
  bubbleCustomer: {
    borderWidth: 1,
    borderTopLeftRadius: 4,
  },
  bubbleSeller: {
    borderTopRightRadius: 4,
  },
  messageText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  messageTime: { fontFamily: fonts.regular, fontSize: 11, alignSelf: 'flex-end' },

  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    paddingLeft: 16,
    paddingRight: 6,
    height: 48,
  },
  inputField: { flex: 1, fontFamily: fonts.regular, fontSize: 14 },
  sendCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendArrow: { color: '#fff', fontSize: 14 },
});
