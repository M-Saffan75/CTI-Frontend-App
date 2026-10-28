import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import CtiLoader from '@/components/CtiLoader';
import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { arrowLeftBold } from '@/assets/icons';
import { dummyProfileExtra } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import {
  ChatMessageItem,
  fetchChatMessages,
  getCachedMessages,
  markChatAsRead,
  sendChatMessageHttp,
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

export default function ChatDetailScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const chatId = route?.params?.chatId;
  const customerName = route?.params?.customerName || route?.params?.participantName || 'Customer';
  const queryId = route?.params?.queryId || '';
  const question = route?.params?.question || '';

  const initialCached = chatId ? getCachedMessages(chatId) : undefined;
  const cachedUser = AuthService.getCachedUser();
  const cachedRole = AuthService.getCachedRole();

  const [currentUserId, setCurrentUserId] = useState<string>(
    cachedUser?._id || cachedUser?.id || '',
  );
  const [currentUserRole, setCurrentUserRole] = useState<string>(
    cachedRole || route?.params?.role || 'seller',
  );
  const [isOnline, setIsOnline] = useState<boolean>(Boolean(route?.params?.isOnline));
  const [messages, setMessages] = useState<ChatMessageItem[]>(() => {
    if (initialCached && initialCached.length > 0) return initialCached;
    return [];
  });
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState<boolean>(() => {
    if (!chatId) return false;
    return !initialCached || initialCached.length === 0;
  });
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentUserIdRef = useRef(currentUserId);
  const currentUserRoleRef = useRef(currentUserRole);
  const hasInitialScrolledRef = useRef(false);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    currentUserRoleRef.current = currentUserRole;
  }, [currentUserRole]);

  // Keyboard show/hide listener to manage smooth scrolling and bottom padding
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // 1. Fetch current logged in user info
  useEffect(() => {
    async function loadUser() {
      try {
        const session = await AuthService.getStoredSession();
        if (session?.user) {
          const u = session.user;
          const uid = u._id || u.id || '';
          const r = session.role || u.role || 'seller';
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

  // 2. Load live messages & bind socket
  useEffect(() => {
    if (!chatId) return;

    let isMounted = true;

    async function initChat() {
      const cached = getCachedMessages(chatId);
      if (!cached || cached.length === 0) {
        setLoading(true);
      }

      try {
        socketService.joinChat(chatId);
        markChatAsRead(chatId);

        const data = await fetchChatMessages(chatId);
        if (isMounted) {
          setMessages(data.messages);
          setCachedMessages(chatId, data.messages);
          if (data.user?.isOnline !== undefined) {
            setIsOnline(Boolean(data.user.isOnline));
          }
        }
      } catch (err) {
        if (__DEV__) console.log('[SellerChatDetail] init error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initChat();

    // Live socket listeners
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
                isRead: true,
              },
            ];
          }

          setCachedMessages(chatId, updated);
          return updated;
        });

        socketService.markMessagesRead(chatId, [incomingId]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
      }
    });

    const unsubTypingStart = socketService.onTypingStart(data => {
      if (data.chatId === chatId && data.userId !== currentUserIdRef.current) {
        setIsTyping(true);
      }
    });

    const unsubTypingStop = socketService.onTypingStop(data => {
      if (data.chatId === chatId) {
        setIsTyping(false);
      }
    });

    const unsubOnline = socketService.onUserOnline(data => {
      if (data.chatId === chatId) {
        setIsOnline(true);
      }
    });

    const unsubOffline = socketService.onUserOffline(data => {
      if (data.chatId === chatId) {
        setIsOnline(false);
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
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 50);
    }
  }, [messages.length]);

  const handleTextChange = (text: string) => {
    setInputText(text);
    if (!chatId) return;

    socketService.startTyping(chatId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketService.stopTyping(chatId);
    }, 2000);
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    setIsSending(true);

    if (chatId) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socketService.stopTyping(chatId);
    }

    const tempId = `local-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const localMsg: ChatMessageItem = {
      _id: tempId,
      messageId: tempId,
      content: text,
      messageType: 'text',
      senderType: (currentUserRoleRef.current as any) || 'seller',
      senderId: currentUserIdRef.current,
      timestamp: nowIso,
      isRead: false,
    };

    setMessages(prev => {
      const next = [...prev, localMsg];
      if (chatId) setCachedMessages(chatId, next);
      return next;
    });
    setInputText('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      if (chatId) {
        if (socketService.isConnected()) {
          // Strictly send via socket when connected
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
      }
    } catch (err) {
      if (__DEV__) console.log('[SellerChatDetail] send error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const isMessageFromMe = (msg: ChatMessageItem) => {
    if (msg._id?.startsWith('local-') || msg.messageId?.startsWith('local-')) return true;
    const uid = currentUserId || currentUserIdRef.current;
    if (uid && msg.senderId) {
      const sId = typeof msg.senderId === 'object' ? msg.senderId._id || msg.senderId.id : msg.senderId;
      if (sId === uid) return true;
    }
    const myRole = currentUserRole || currentUserRoleRef.current;
    return msg.senderType === 'seller' || msg.senderType === myRole;
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
      {/* Header */}
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
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isOnline ? '#10B981' : colors.textMuted },
              ]}
            />
            <Text style={[styles.headerName, { color: colors.text }]}>{customerName}</Text>
          </View>
          <Text style={[styles.querySubtitle, { color: colors.textMuted }]} numberOfLines={1}>
            {isTyping
              ? 'Typing...'
              : question
              ? `${question}${queryId ? ` - ID: ${queryId}` : ''}`
              : isOnline
              ? 'Active now'
              : 'Offline'}
          </Text>
        </View>
      </View>

      {/* Date Pill */}
      <View style={styles.dateSeparatorWrap}>
        <View style={[styles.datePill, { backgroundColor: colors.surfaceAlt }]}>
          <Text style={[styles.datePillText, { color: colors.textMuted }]}>
            {messages.length > 0 ? formatMessageDate(messages[0].timestamp) : 'Today'}
          </Text>
        </View>
      </View>

      {/* Messages List */}
      {loading && messages.length === 0 ? (
        <CtiLoader size="md" text="Loading conversation..." style={{ flex: 1 }} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          style={styles.messagesList}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item, idx) => item._id || item.messageId || String(idx)}
          contentContainerStyle={[styles.messagesContainer, { paddingBottom: 16 }]}
          onContentSizeChange={() => {
            if (!hasInitialScrolledRef.current && messages.length > 0) {
              hasInitialScrolledRef.current = true;
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
          renderItem={({ item }) => {
            const isMine = isMessageFromMe(item);
            return (
              <View
                style={[
                  styles.messageRow,
                  isMine ? styles.messageRowRight : styles.messageRowLeft,
                ]}>
                <View
                  style={[
                    styles.bubble,
                    isMine
                      ? [styles.bubbleSeller, { backgroundColor: colors.primary }]
                      : [
                          styles.bubbleCustomer,
                          { backgroundColor: colors.surface, borderColor: colors.border },
                        ],
                  ]}>
                  <Text
                    style={[
                      styles.messageText,
                      { color: isMine ? colors.onPrimary : colors.text },
                    ]}>
                    {item.content}
                  </Text>
                  <Text
                    style={[
                      styles.messageTime,
                      { color: isMine ? 'rgba(255,255,255,0.7)' : colors.textMuted },
                    ]}>
                    {formatMessageTime(item.timestamp)}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={{ paddingVertical: 60, alignItems: 'center' }}>
              <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted }}>
                No messages yet. Send a message to start chatting.
              </Text>
            </View>
          }
        />
      )}

      {/* Bottom Input */}
      <View
        style={[
          styles.inputContainer,
          {
            paddingBottom: isKeyboardVisible ? 10 : insets.bottom + 10,
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
            placeholder="Type your reply here..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={handleTextChange}
            style={[styles.inputField, { color: colors.text }]}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={isSending}
            style={[
              styles.sendCircleBtn,
              { backgroundColor: colors.primary, opacity: isSending ? 0.6 : 1 },
            ]}>
            <Text style={styles.sendArrow}>➤</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  messagesList: { flex: 1 },
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
  statusDot: { width: 8, height: 8, borderRadius: 4 },
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
