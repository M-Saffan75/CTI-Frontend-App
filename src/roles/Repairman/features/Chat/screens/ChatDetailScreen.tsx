import { useEffect, useRef, useState } from 'react';
import {
  Image,
  Keyboard,
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
  fetchQueryMessages,
  getCachedMessages,
  markChatAsRead,
  sendChatMessageHttp,
  sendQueryReply,
  setCachedMessages,
} from '@/services/chatApi';
import AuthService from '@/services/authService';
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
  const queryId = route?.params?.queryId || (chatId?.startsWith('query_') ? chatId.replace(/^query_/, '') : undefined);
  const isSellerQuery = Boolean(queryId || route?.params?.chatType === 'seller_query');

  const initialCached = chatId ? getCachedMessages(chatId) : undefined;
  const cachedUser = AuthService.getCachedUser();
  const cachedRole = AuthService.getCachedRole();

  const [currentUserId, setCurrentUserId] = useState<string>(
    cachedUser?._id || cachedUser?.id || '',
  );
  const [currentUserRole, setCurrentUserRole] = useState<string>(
    cachedRole || route?.params?.role || 'repairman',
  );
  const [participant, setParticipant] = useState<ChatParticipant>({
    id: route?.params?.participantId || '',
    name: route?.params?.participantName || route?.params?.name || 'User',
    avatar: route?.params?.participantAvatar || route?.params?.avatar || null,
    isOnline: Boolean(route?.params?.isOnline),
  });

  const [messages, setMessages] = useState<ChatMessageItem[]>(() => {
    if (initialCached && initialCached.length > 0) return initialCached;
    return [];
  });
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState<boolean>(() => {
    if (!chatId) return false;
    return !initialCached || initialCached.length === 0;
  });
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentUserIdRef = useRef(currentUserId);
  const currentUserRoleRef = useRef(currentUserRole);
  const participantRef = useRef(participant);
  const hasInitialScrolledRef = useRef(false);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    currentUserRoleRef.current = currentUserRole;
  }, [currentUserRole]);

  useEffect(() => {
    participantRef.current = participant;
  }, [participant]);

  // Keyboard show/hide listener to manage smooth scrolling and bottom padding
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // 1. Fetch current logged in user info (if not already cached)
  useEffect(() => {
    async function loadUser() {
      try {
        const session = await AuthService.getStoredSession();
        if (session?.user) {
          const u = session.user;
          const uid = u._id || u.id || '';
          const r = session.role || u.role || 'repairman';
          if (uid && uid !== currentUserIdRef.current) {
            setCurrentUserId(uid);
          }
          if (r && r !== currentUserRoleRef.current) {
            setCurrentUserRole(r);
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
      if (isSellerQuery) {
        setLoading(true);
        try {
          const data = await fetchQueryMessages(queryId || chatId);
          if (isMounted) {
            setMessages(data.messages);
            if (data.user) {
              setParticipant(prev => {
                const hasValidName = Boolean(prev.name && prev.name !== 'User');
                return {
                  ...prev,
                  id: data.user?.id || prev.id,
                  name: hasValidName ? prev.name : (data.user?.name || prev.name),
                  avatar: prev.avatar || data.user?.avatar || null,
                };
              });
            }
          }
        } catch (err) {
          if (__DEV__) console.log('[ChatDetailScreen] fetchQueryMessages error:', err);
        } finally {
          if (isMounted) setLoading(false);
        }
        return;
      }

      const cached = getCachedMessages(chatId);
      if (!cached || cached.length === 0) {
        setLoading(true);
      }

      try {
        // Join socket room
        socketService.joinChat(chatId);
        markChatAsRead(chatId);

        // Fetch messages
        const data = await fetchChatMessages(chatId);
        if (isMounted) {
          setMessages(data.messages);
          setCachedMessages(chatId, data.messages);
          if (data.user) {
            setParticipant(prev => {
              const hasValidName = Boolean(prev.name && prev.name !== 'User');
              return {
                ...prev,
                id: data.user?.id || prev.id,
                name: hasValidName ? prev.name : (data.user?.name || prev.name),
                avatar: prev.avatar || data.user?.avatar || null,
              };
            });
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
        const incomingId = msg.messageId || msg._id || `msg-${Date.now()}`;

        setMessages(prev => {
          // 1. Prevent duplicate by exact ID
          if (prev.some(m => m.messageId === incomingId || m._id === incomingId)) {
            return prev;
          }

          // 2. If message was sent by me, reconcile with existing pending local optimistic message
          const myId = currentUserIdRef.current;
          const myRole = currentUserRoleRef.current;
          const sId = typeof msg.senderId === 'object' ? msg.senderId?._id || msg.senderId.id : msg.senderId;
          const isFromMe = (myId && sId === myId) || msg.senderType === myRole;

          let updated: ChatMessageItem[];
          if (isFromMe) {
            const pendingIndex = prev.findIndex(
              m =>
                (m._id.startsWith('local-') || m.messageId.startsWith('local-')) &&
                m.content === msg.content,
            );
            if (pendingIndex !== -1) {
              const copy = [...prev];
              copy[pendingIndex] = {
                _id: incomingId,
                messageId: incomingId,
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
              updated = copy;
            } else {
              updated = [
                ...prev,
                {
                  _id: incomingId,
                  messageId: incomingId,
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
                },
              ];
            }
          } else {
            updated = [
              ...prev,
              {
                _id: incomingId,
                messageId: incomingId,
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
              },
            ];
          }

          setCachedMessages(chatId, updated);
          return updated;
        });

        // Mark read immediately since user is actively viewing this chat
        socketService.markMessagesRead(chatId, [incomingId]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
      }
    });

    // Listen for typing events
    const unsubTypingStart = socketService.onTypingStart(data => {
      if (data.chatId === chatId && data.userId !== currentUserIdRef.current) {
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
      if (data.chatId === chatId || data.userId === participantRef.current?.id) {
        setParticipant(prev => ({ ...prev, isOnline: true }));
      }
    });

    const unsubOffline = socketService.onUserOffline(data => {
      if (data.chatId === chatId || data.userId === participantRef.current?.id) {
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
  }, [chatId]);

  // Initial scroll to bottom once messages are rendered
  useEffect(() => {
    if (messages.length > 0 && !hasInitialScrolledRef.current) {
      hasInitialScrolledRef.current = true;
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: false });
      }, 50);
    }
  }, [messages.length]);

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
    if (!text || !chatId || isSending) return;

    setIsSending(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketService.stopTyping(chatId);

    const tempId = `local-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const localMsg: ChatMessageItem = {
      _id: tempId,
      messageId: tempId,
      content: text,
      messageType: 'text',
      senderType: (currentUserRoleRef.current as any) || 'repairman',
      senderId: currentUserIdRef.current,
      timestamp: nowIso,
      isRead: false,
    };

    setMessages(prev => {
      const next = [...prev, localMsg];
      setCachedMessages(chatId, next);
      return next;
    });
    setDraft('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);

    if (isSellerQuery) {
      try {
        await sendQueryReply(queryId || chatId, text);
      } catch (err) {
        if (__DEV__) console.log('[ChatDetailScreen] sendQueryReply error:', err);
      } finally {
        setIsSending(false);
      }
      return;
    }

    try {
      if (socketService.isConnected()) {
        // Only send via socket when connected
        socketService.sendChatMessage({
          chatId,
          content: text,
          messageType: 'text',
        });
      } else {
        // Fallback to HTTP only when socket is not connected
        const res = await sendChatMessageHttp(chatId, { content: text });
        if (res.success && res.message) {
          const serverId = res.message._id || res.message.messageId;
          if (serverId) {
            setMessages(prev => {
              const updated = prev.map(m =>
                m._id === tempId ? { ...m, _id: serverId, messageId: serverId } : m,
              );
              setCachedMessages(chatId, updated);
              return updated;
            });
          }
        }
      }
    } catch (err) {
      if (__DEV__) console.log('[ChatDetailScreen] send error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const isMessageFromMe = (msg: ChatMessageItem) => {
    if (msg._id?.startsWith('local-') || msg.messageId?.startsWith('local-')) return true;
    if (msg.senderType === 'customer') return true;
    if (msg.senderType === 'seller') return false;
    const uid = currentUserId || currentUserIdRef.current;
    if (uid && msg.senderId) {
      const sId = typeof msg.senderId === 'object' ? msg.senderId._id || msg.senderId.id : msg.senderId;
      if (sId === uid) return true;
    }
    const myRole = currentUserRole || currentUserRoleRef.current;
    if (msg.senderType && myRole) {
      return msg.senderType === myRole;
    }
    return false;
  };

  const avatarSource = participant.avatar ? { uri: participant.avatar } : dummyProfileExtra;

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
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
      {loading && messages.length === 0 ? (
        <CtiLoader size="md" text="Loading conversation..." style={{ flex: 1 }} />
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.messageScroll}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            if (!hasInitialScrolledRef.current && messages.length > 0) {
              hasInitialScrolledRef.current = true;
              scrollRef.current?.scrollToEnd({ animated: false });
            }
          }}>
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
            paddingBottom: isKeyboardVisible ? 10 : insets.bottom + 10,
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
        <Squeeze onPress={send} scale={0.9} disabled={isSending}>
          <View
            style={[
              styles.sendButton,
              { backgroundColor: colors.primary, opacity: isSending ? 0.6 : 1 },
            ]}>
            <Icon source={sendBold} size={18} color={colors.onPrimary} />
          </View>
        </Squeeze>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  messageScroll: { flex: 1 },
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
