import { useEffect, useRef, useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';

import CtiLoader from '@/components/CtiLoader';
import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { arrowLeftBold, sendBold } from '@/assets/icons';
import { dummyProfileExtra } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import {
  ChatMessageItem,
  ChatParticipant,
  fetchChatMessages,
  markChatAsRead,
  sendChatMessageHttp,
} from '@/services/chatApi';
import socketService from '@/services/socketService';

function formatMessageTime(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatMessageDate(dateStr?: string): string {
  if (!dateStr) return 'Today';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Today';
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
}

function QuotationCard({ quotationData }: { quotationData: any }) {
  const { colors } = useTheme();
  if (!quotationData) return null;

  const total =
    (quotationData.pricing?.serviceCharges || quotationData.serviceCharges || 0) +
    (quotationData.pricing?.partsPrice || quotationData.partsPrice || 0);

  const statusColor =
    quotationData.status === 'accepted'
      ? colors.success
      : quotationData.status === 'rejected'
      ? colors.error
      : colors.primary;

  return (
    <View
      style={[
        styles.quotationCard,
        { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
      ]}>
      <View style={styles.quotationHeader}>
        <Text style={[styles.quotationTitle, { color: colors.text }]}>Service Quotation</Text>
        <View style={[styles.quotationStatusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.quotationStatusText, { color: statusColor }]}>
            {(quotationData.status || 'Pending').toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={[styles.quotationDesc, { color: colors.textMuted }]}>
        {quotationData.repairmanNotes || quotationData.description || 'Repair service estimate'}
      </Text>
      <View style={[styles.quotationDivider, { backgroundColor: colors.border }]} />
      <View style={styles.quotationRow}>
        <Text style={[styles.quotationLabel, { color: colors.textMuted }]}>Estimated Time:</Text>
        <Text style={[styles.quotationVal, { color: colors.text }]}>
          {quotationData.serviceDetails?.estimatedDuration ||
            quotationData.estimatedDuration ||
            '1-2 days'}
        </Text>
      </View>
      <View style={styles.quotationRow}>
        <Text style={[styles.quotationLabel, { color: colors.textMuted }]}>Total Amount:</Text>
        <Text style={[styles.quotationPrice, { color: colors.primary }]}>${total.toFixed(2)}</Text>
      </View>
    </View>
  );
}

function Bubble({
  message,
  participant,
  isMine,
}: {
  message: ChatMessageItem;
  participant: ChatParticipant | null;
  isMine: boolean;
}) {
  const { colors } = useTheme();

  const bubble = (
    <View
      style={[
        styles.bubble,
        isMine
          ? { backgroundColor: colors.primary + '1F', borderColor: colors.primary + '40' }
          : { backgroundColor: colors.surface, borderColor: colors.border },
        isMine ? styles.bubbleMine : styles.bubbleTheirs,
      ]}>
      {message.messageType === 'quotation' && message.quotationData ? (
        <QuotationCard quotationData={message.quotationData} />
      ) : (
        <Text style={[styles.bubbleText, { color: colors.text }]}>{message.content}</Text>
      )}
      <Text style={[styles.bubbleTime, { color: colors.textMuted }]}>
        {formatMessageTime(message.timestamp)}
      </Text>
    </View>
  );

  const avatarSource = participant?.avatar
    ? { uri: participant.avatar }
    : dummyProfileExtra;

  const avatar = <Image source={avatarSource} style={styles.bubbleAvatar} />;

  if (isMine) {
    return (
      <View style={[styles.bubbleRow, styles.bubbleRowMine]}>
        {bubble}
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

export default function ChatDetailScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const chatId = route?.params?.chatId;

  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserRole, setCurrentUserRole] = useState<string>('repairman');
  const [participant, setParticipant] = useState<ChatParticipant>({
    id: route?.params?.participantId || '',
    name: route?.params?.participantName || route?.params?.name || 'User',
    avatar: route?.params?.participantAvatar || route?.params?.avatar || null,
    isOnline: Boolean(route?.params?.isOnline),
  });

  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Fetch current logged in user info
  useEffect(() => {
    async function loadUser() {
      try {
        const authData = await AsyncStorage.getItem('auth');
        if (authData) {
          const parsed = JSON.parse(authData);
          if (parsed?.user) {
            setCurrentUserId(parsed.user._id || parsed.user.id || '');
            setCurrentUserRole(parsed.user.role || 'repairman');
          }
        }
      } catch {
        // ignore
      }
    }
    loadUser();
  }, []);

  // 2. Load message history and bind socket room
  useEffect(() => {
    if (!chatId) return;

    let isMounted = true;

    async function initChat() {
      setLoading(true);
      try {
        // Join socket room
        socketService.joinChat(chatId);
        markChatAsRead(chatId);

        // Fetch messages
        const data = await fetchChatMessages(chatId);
        if (isMounted) {
          setMessages(data.messages);
          if (data.user) {
            setParticipant(prev => ({
              ...prev,
              id: data.user?.id || prev.id,
              name: data.user?.name || prev.name,
              avatar: data.user?.avatar || prev.avatar,
            }));
          }
        }
      } catch (err) {
        if (__DEV__) console.log('[ChatDetailScreen] init error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initChat();

    // Listen to real-time incoming messages
    const unsubNewMsg = socketService.onNewMessage((msg: any) => {
      if (msg.chatId === chatId) {
        setMessages(prev => {
          // Prevent duplicates
          if (prev.some(m => m.messageId === msg.messageId || m._id === msg.messageId)) {
            return prev;
          }
          const newMsg: ChatMessageItem = {
            _id: msg.messageId || `msg-${Date.now()}`,
            messageId: msg.messageId || `msg-${Date.now()}`,
            content: msg.content || '',
            messageType: msg.messageType || 'text',
            senderType: msg.senderType,
            senderId: msg.senderId,
            timestamp: msg.timestamp || new Date().toISOString(),
            mediaUrl: msg.mediaUrl,
            fileName: msg.fileName,
            quotationId: msg.quotationId,
            quotationData: msg.quotationData,
            isRead: true,
          };
          return [...prev, newMsg];
        });

        // Mark read immediately since user is actively viewing this chat
        socketService.markMessagesRead(chatId, [msg.messageId]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      }
    });

    // Listen for typing events
    const unsubTypingStart = socketService.onTypingStart(data => {
      if (data.chatId === chatId && data.userId !== currentUserId) {
        setIsOtherTyping(true);
      }
    });

    const unsubTypingStop = socketService.onTypingStop(data => {
      if (data.chatId === chatId) {
        setIsOtherTyping(false);
      }
    });

    // Listen for participant online/offline
    const unsubOnline = socketService.onUserOnline(data => {
      if (data.chatId === chatId || data.userId === participant.id) {
        setParticipant(prev => ({ ...prev, isOnline: true }));
      }
    });

    const unsubOffline = socketService.onUserOffline(data => {
      if (data.chatId === chatId || data.userId === participant.id) {
        setParticipant(prev => ({ ...prev, isOnline: false }));
      }
    });

    return () => {
      isMounted = false;
      socketService.leaveChat(chatId);
      unsubNewMsg();
      unsubTypingStart();
      unsubTypingStop();
      unsubOnline();
      unsubOffline();
    };
  }, [chatId, currentUserId, participant.id]);

  // Handle typing debounce
  const handleTextChange = (text: string) => {
    setDraft(text);
    if (!chatId) return;

    socketService.startTyping(chatId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketService.stopTyping(chatId);
    }, 2000);
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || !chatId) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketService.stopTyping(chatId);

    const tempId = `local-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const localMsg: ChatMessageItem = {
      _id: tempId,
      messageId: tempId,
      content: text,
      messageType: 'text',
      senderType: (currentUserRole as any) || 'repairman',
      senderId: currentUserId,
      timestamp: nowIso,
      isRead: false,
    };

    setMessages(prev => [...prev, localMsg]);
    setDraft('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);

    // Send via socket
    socketService.sendChatMessage({
      chatId,
      content: text,
      messageType: 'text',
    });

    // Also HTTP fallback in case socket is disconnected
    sendChatMessageHttp(chatId, { content: text });
  };

  const isMessageFromMe = (msg: ChatMessageItem) => {
    if (msg._id.startsWith('local-')) return true;
    if (currentUserId && msg.senderId) {
      const sId = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
      if (sId === currentUserId) return true;
    }
    return msg.senderType === currentUserRole;
  };

  const avatarSource = participant.avatar ? { uri: participant.avatar } : dummyProfileExtra;

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Squeeze onPress={() => navigation.goBack()} scale={0.9}>
          <View style={[styles.back, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={18} color={colors.onPrimary} />
          </View>
        </Squeeze>

        <Image source={avatarSource} style={styles.headerAvatar} />

        <View style={styles.headerText}>
          <Text style={[styles.headerName, { color: colors.text }]}>{participant.name}</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.onlineDot,
                { backgroundColor: participant.isOnline ? colors.success : colors.textMuted },
              ]}
            />
            <Text
              style={[
                styles.headerSubtitle,
                { color: participant.isOnline ? colors.success : colors.textMuted },
              ]}>
              {isOtherTyping ? 'Typing...' : participant.isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      {loading ? (
        <CtiLoader size="md" text="Loading conversation..." style={{ flex: 1 }} />
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
          {messages.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyPrompt, { color: colors.textMuted }]}>
                This is the start of your direct conversation with {participant.name}.
              </Text>
            </View>
          ) : (
            messages.map((message, index) => {
              const msgDate = formatMessageDate(message.timestamp);
              const prevMsgDate =
                index > 0 ? formatMessageDate(messages[index - 1].timestamp) : null;
              const showDate = index === 0 || msgDate !== prevMsgDate;
              const isMine = isMessageFromMe(message);

              return (
                <View key={message._id || message.messageId || index} style={styles.messageGroup}>
                  {showDate && (
                    <View style={[styles.dateChip, { backgroundColor: colors.surfaceAlt }]}>
                      <Text style={[styles.dateChipText, { color: colors.textMuted }]}>
                        {msgDate}
                      </Text>
                    </View>
                  )}
                  <Bubble message={message} participant={participant} isMine={isMine} />
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Input row */}
      <View
        style={[
          styles.inputRow,
          {
            paddingBottom: insets.bottom + 12,
            borderTopColor: colors.border,
            backgroundColor: colors.surface,
          },
        ]}>
        <TextInput
          value={draft}
          onChangeText={handleTextChange}
          placeholder="Type your reply here..."
          placeholderTextColor={colors.textMuted}
          multiline
          style={[
            styles.input,
            { color: colors.text, backgroundColor: colors.surfaceAlt, borderColor: colors.border },
          ]}
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerAvatar: { width: 44, height: 44, borderRadius: 22 },
  headerText: { flex: 1 },
  headerName: { fontFamily: fonts.bold, fontSize: 17 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  headerSubtitle: { fontFamily: fonts.regular, fontSize: 12 },

  body: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20, gap: 12 },
  messageGroup: { gap: 12 },
  dateChip: {
    alignSelf: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginVertical: 6,
  },
  dateChipText: { fontFamily: fonts.medium, fontSize: 12 },

  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    maxWidth: '85%',
    alignSelf: 'flex-start',
  },
  bubbleRowMine: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  bubbleAvatar: { width: 34, height: 34, borderRadius: 17 },
  bubble: {
    flexShrink: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleTheirs: { borderTopLeftRadius: 4 },
  bubbleMine: { borderTopRightRadius: 4 },
  bubbleText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21 },
  bubbleTime: { fontFamily: fonts.regular, fontSize: 10, alignSelf: 'flex-end', marginTop: 4 },

  emptyWrap: { paddingVertical: 80, alignItems: 'center', paddingHorizontal: 30 },
  emptyPrompt: { fontFamily: fonts.regular, fontSize: 13, textAlign: 'center', lineHeight: 20 },

  quotationCard: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 8, minWidth: 200 },
  quotationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quotationTitle: { fontFamily: fonts.bold, fontSize: 13 },
  quotationStatusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  quotationStatusText: { fontFamily: fonts.bold, fontSize: 10 },
  quotationDesc: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17 },
  quotationDivider: { height: 1, width: '100%' },
  quotationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quotationLabel: { fontFamily: fonts.regular, fontSize: 12 },
  quotationVal: { fontFamily: fonts.medium, fontSize: 12 },
  quotationPrice: { fontFamily: fonts.bold, fontSize: 14 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
