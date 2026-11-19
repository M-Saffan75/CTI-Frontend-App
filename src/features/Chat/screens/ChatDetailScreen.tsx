import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AlertModal, { AlertModalType } from '@/components/AlertModal';
import Button from '@/components/Button';
import CtiLoader from '@/components/CtiLoader';
import Icon from '@/components/Icon';
import Avatar from '@/components/Avatar';
import Squeeze from '@/components/Squeeze';
import { arrowLeftBold, checkCircleBold, sendBold } from '@/assets/icons';
import i18n from '@/i18n';
import { upper } from '@/i18n/locale';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import {
  ChatMessageItem,
  ChatParticipant,
  fetchChatMessages,
  fetchQueryMessages,
  getCachedMessages,
  markChatAsRead,
  respondToQuotation,
  sendChatMessageHttp,
  sendQueryReply,
  setCachedMessages,
} from '@/services/chatApi';
import AuthService from '@/services/authService';
import socketService from '@/services/socketService';
import { formatMoney } from '@/utils/money';
import KeyboardSafeView from '@/components/KeyboardSafeView';
import { ErrorState } from '@/components/states';
import { getLocaleTag } from '@/i18n/locale';
import { useTranslation } from 'react-i18next';

export type ChatRole = 'customer' | 'repairman' | 'seller';

function formatMessageTime(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(getLocaleTag(), { hour: '2-digit', minute: '2-digit' });
}

function formatMessageDate(dateStr?: string): string {
  if (!dateStr) return i18n.t('chat.today');
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return i18n.t('chat.today');
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return i18n.t('chat.today');
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return i18n.t('chat.yesterday');
  return d.toLocaleDateString(getLocaleTag(), { day: 'numeric', month: 'long', year: 'numeric' });
}

// How long a socket message may stay unconfirmed before it is shown as not sent
const SEND_TIMEOUT_MS = 10000;

const isLocalMessage = (m: ChatMessageItem) =>
  Boolean(m._id?.startsWith('local-') || m.messageId?.startsWith('local-'));

function toMessageItem(msg: any, id: string): ChatMessageItem {
  return {
    _id: id,
    messageId: id,
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
}

function QuotationCard({
  quotationData,
  onRespond,
  isResponding,
}: {
  quotationData: any;
  onRespond?: (quotationId: string, action: 'accepted' | 'rejected') => void;
  isResponding?: boolean;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  if (!quotationData) return null;

  const total =
    (quotationData.pricing?.serviceCharges || quotationData.serviceCharges || 0) +
    (quotationData.pricing?.partsPrice || quotationData.partsPrice || 0);
  const currency = quotationData.pricing?.currency || quotationData.currency || 'TRY';
  const status = quotationData.status || 'pending';
  const quotationId = quotationData.quotationId || quotationData._id;

  const statusColor =
    status === 'accepted' ? colors.success : status === 'rejected' ? colors.error : colors.primary;

  return (
    <View
      style={[
        styles.quotationCard,
        { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
      ]}>
      <View style={styles.quotationHeader}>
        <Text style={[styles.quotationTitle, { color: colors.text }]}>{t('chat.serviceQuotation')}</Text>
        <View style={[styles.quotationStatusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.quotationStatusText, { color: statusColor }]}>
            {upper(t(`chat.quoteStatus.${status}`, { defaultValue: status }))}
          </Text>
        </View>
      </View>
      <Text style={[styles.quotationDesc, { color: colors.textMuted }]}>
        {quotationData.repairmanNotes || quotationData.description || t('chat.repairEstimate')}
      </Text>
      <View style={[styles.quotationDivider, { backgroundColor: colors.border }]} />
      <View style={styles.quotationRow}>
        <Text style={[styles.quotationLabel, { color: colors.textMuted }]}>{t('chat.estimatedTime')}</Text>
        <Text style={[styles.quotationVal, { color: colors.text }]}>
          {quotationData.serviceDetails?.estimatedDuration ||
            quotationData.estimatedDuration ||
            t('chat.defaultDuration')}
        </Text>
      </View>
      <View style={styles.quotationRow}>
        <Text style={[styles.quotationLabel, { color: colors.textMuted }]}>{t('customer.totalAmount')}:</Text>
        <Text style={[styles.quotationPrice, { color: colors.primary }]}>
          {formatMoney(total, currency)}
        </Text>
      </View>

      {status === 'pending' && onRespond && quotationId && (
        <View style={styles.quotationActions}>
          <Button
            title={t('chat.accept')}
            size="sm"
            variant="primary"
            loading={isResponding}
            disabled={isResponding}
            onPress={() => onRespond(quotationId, 'accepted')}
            style={styles.quotationActionBtn}
          />
          <Button
            title={t('chat.decline')}
            size="sm"
            variant="outline"
            disabled={isResponding}
            onPress={() => onRespond(quotationId, 'rejected')}
            style={styles.quotationActionBtn}
          />
        </View>
      )}
    </View>
  );
}

function Bubble({
  message,
  participant,
  isMine,
  onRespondQuotation,
  isRespondingQuotation,
  onRetry,
  onDiscard,
}: {
  message: ChatMessageItem;
  participant: ChatParticipant | null;
  isMine: boolean;
  onRespondQuotation?: (quotationId: string, action: 'accepted' | 'rejected') => void;
  isRespondingQuotation?: boolean;
  onRetry?: (id: string) => void;
  onDiscard?: (id: string) => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();

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
        <QuotationCard
          quotationData={message.quotationData}
          onRespond={onRespondQuotation}
          isResponding={isRespondingQuotation}
        />
      ) : (
        <Text style={[styles.bubbleText, { color: colors.text }]}>{message.content}</Text>
      )}
      <View style={styles.bubbleFooter}>
        {message.localStatus === 'sending' ? (
          <Text style={[styles.bubbleTime, { color: colors.textMuted }]}>{t('chat.sending')}</Text>
        ) : message.localStatus === 'failed' ? (
          <Text style={[styles.bubbleTime, { color: colors.error }]}>{t('chat.notSent')}</Text>
        ) : (
          <Text style={[styles.bubbleTime, { color: colors.textMuted }]}>
            {formatMessageTime(message.timestamp)}
          </Text>
        )}
        {isMine && message.isRead && !message.localStatus && (
          <Icon source={checkCircleBold} size={11} color={colors.primary} />
        )}
      </View>
      {message.localStatus === 'failed' && (
        <View style={styles.failedRow}>
          <TouchableOpacity onPress={() => onRetry?.(message._id)} hitSlop={8}>
            <Text style={[styles.failedAction, { color: colors.primary }]}>{t('chat.retry')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDiscard?.(message._id)} hitSlop={8}>
            <Text style={[styles.failedAction, { color: colors.textMuted }]}>{t('chat.delete')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const avatar = (
    <Avatar
      uri={participant?.avatar}
      name={participant?.name}
      style={[styles.bubbleAvatar, { borderWidth: 1, borderColor: colors.avatarBorder }]}
    />
  );

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

export default function ChatDetailScreen({
  navigation,
  route,
  role,
}: {
  navigation: any;
  route: any;
  role: ChatRole;
}) {
  const isCustomer = role === 'customer';
  const defaultParticipantName = isCustomer ? i18n.t('chat.technician') : i18n.t('chat.user');
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const chatId = route?.params?.chatId;
  const queryId = route?.params?.queryId || (chatId?.startsWith('query_') ? chatId.replace(/^query_/, '') : undefined);
  // Customer enquiry threads use the REST query endpoints; other roles use the normal chat.
  const isSellerQuery = isCustomer && Boolean(queryId || route?.params?.chatType === 'seller_query');

  const initialCached = chatId ? getCachedMessages(chatId) : undefined;
  const cachedUser = AuthService.getCachedUser();

  const [currentUserId, setCurrentUserId] = useState<string>(
    cachedUser?._id || cachedUser?.id || '',
  );
  const [participant, setParticipant] = useState<ChatParticipant>({
    id: route?.params?.participantId || '',
    name:
      route?.params?.participantName ||
      route?.params?.name ||
      route?.params?.customerName ||
      defaultParticipantName,
    avatar: route?.params?.participantAvatar || route?.params?.avatar || null,
    isOnline: Boolean(route?.params?.isOnline),
  });

  const [messages, setMessages] = useState<ChatMessageItem[]>(() => {
    if (initialCached && initialCached.length > 0) {
      // nothing can be in flight at mount, so a cached "sending" message was never sent
      return initialCached.map(m => (m.localStatus === 'sending' ? { ...m, localStatus: 'failed' as const } : m));
    }
    return [];
  });
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState<boolean>(() => {
    if (!chatId) return false;
    return !initialCached || initialCached.length === 0;
  });
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [olderError, setOlderError] = useState('');
  const [isRespondingQuotation, setIsRespondingQuotation] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: AlertModalType;
  }>({ visible: false, title: '', message: '', type: 'info' });
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentUserIdRef = useRef(currentUserId);
  const processedMessageIdsRef = useRef<Set<string>>(new Set());
  const participantRef = useRef(participant);
  const hasInitialScrolledRef = useRef(false);
  const mountedRef = useRef(true);
  const messagesRef = useRef<ChatMessageItem[]>(messages);
  const draftRef = useRef('');
  const deliveringRef = useRef<Set<string>>(new Set());
  const sendTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    mountedRef.current = true;
    const timers = sendTimersRef.current;
    return () => {
      mountedRef.current = false;
      timers.forEach(timer => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

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
          if (uid && uid !== currentUserIdRef.current) {
            setCurrentUserId(uid);
          }
        }
      } catch {
        // ignore
      }
    }
    loadUser();
  }, []);

  const clearSendTimer = useCallback((id: string) => {
    const timer = sendTimersRef.current.get(id);
    if (timer) clearTimeout(timer);
    sendTimersRef.current.delete(id);
  }, []);

  const patchMessage = useCallback(
    (id: string, patch: Partial<ChatMessageItem>, onlyIfStatus?: 'sending' | 'failed') => {
      if (!chatId) return;
      setMessages(prev => {
        const next = prev.map(m =>
          m._id === id && (!onlyIfStatus || m.localStatus === onlyIfStatus) ? { ...m, ...patch } : m,
        );
        setCachedMessages(chatId, next);
        return next;
      });
    },
    [chatId],
  );

  // Put a loaded page into the screen. A silent refresh (after a reconnect) keeps the older
  // pages already loaded; messages not yet confirmed by the server are always kept.
  const applyHistory = useCallback(
    (
      data: { messages: ChatMessageItem[]; hasMore?: boolean; user?: ChatParticipant },
      silent: boolean,
    ) => {
      if (!chatId) return;
      const server = data.messages;
      server.forEach(m => {
        if (m.messageId) processedMessageIdsRef.current.add(m.messageId);
        if (m._id) processedMessageIdsRef.current.add(m._id);
      });

      const locals = messagesRef.current
        .filter(isLocalMessage)
        .filter(
          local =>
            !server.some(
              srv =>
                srv.content === local.content &&
                srv.senderType === role &&
                new Date(srv.timestamp).getTime() >= new Date(local.timestamp).getTime() - 5000,
            ),
        )
        .map(m =>
          m.localStatus === 'sending' &&
          !deliveringRef.current.has(m._id) &&
          !sendTimersRef.current.has(m._id)
            ? { ...m, localStatus: 'failed' as const }
            : m,
        );

      let base = server;
      if (silent) {
        const byId = new Map<string, ChatMessageItem>();
        messagesRef.current.filter(m => !isLocalMessage(m)).forEach(m => byId.set(m._id, m));
        server.forEach(m => byId.set(m._id, m));
        base = Array.from(byId.values()).sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );
      }

      const merged = [...base, ...locals];
      setMessages(merged);
      setCachedMessages(chatId, merged);
      if (!silent || messagesRef.current.length === 0) setHasMore(Boolean(data.hasMore));

      if (data.user) {
        setParticipant(prev => {
          const hasValidName = Boolean(prev.name && prev.name !== defaultParticipantName);
          return {
            ...prev,
            id: data.user?.id || prev.id,
            name: hasValidName ? prev.name : (data.user?.name || prev.name),
            avatar: prev.avatar || data.user?.avatar || null,
          };
        });
      }
    },
    [chatId, role, defaultParticipantName],
  );

  const loadHistory = useCallback(
    async (silent = false) => {
      if (!chatId) return;
      if (!silent) {
        setHistoryError('');
        const cached = getCachedMessages(chatId);
        if (!cached || cached.length === 0) setLoading(true);
      }
      try {
        if (isSellerQuery) {
          const data = await fetchQueryMessages(queryId || chatId);
          if (!mountedRef.current) return;
          applyHistory({ messages: data.messages, user: data.user }, silent);
        } else {
          socketService.joinChat(chatId);
          markChatAsRead(chatId);
          const data = await fetchChatMessages(chatId);
          if (!mountedRef.current) return;
          applyHistory(data, silent);
        }
        setHistoryError('');
      } catch (err: any) {
        if (mountedRef.current) {
          setHistoryError(err?.message || i18n.t('chat.loadMessagesFailed'));
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [chatId, isSellerQuery, queryId, applyHistory],
  );

  // Older messages: the server pages by the id of the oldest message we hold
  const loadOlder = useCallback(async () => {
    if (!chatId || isSellerQuery || loadingOlder || !hasMore) return;
    const oldest = messagesRef.current.find(m => !isLocalMessage(m));
    if (!oldest) return;
    setLoadingOlder(true);
    setOlderError('');
    try {
      const data = await fetchChatMessages(chatId, oldest._id);
      if (!mountedRef.current) return;
      data.messages.forEach(m => {
        if (m.messageId) processedMessageIdsRef.current.add(m.messageId);
        if (m._id) processedMessageIdsRef.current.add(m._id);
      });
      setMessages(prev => {
        const have = new Set(prev.map(m => m._id));
        const next = [...data.messages.filter(m => !have.has(m._id)), ...prev];
        setCachedMessages(chatId, next);
        return next;
      });
      setHasMore(data.hasMore);
    } catch (err: any) {
      if (mountedRef.current) setOlderError(err?.message || i18n.t('chat.loadOlderFailed'));
    } finally {
      if (mountedRef.current) setLoadingOlder(false);
    }
  }, [chatId, isSellerQuery, loadingOlder, hasMore]);

  // 2. Load message history and bind socket room
  useEffect(() => {
    if (!chatId) return;

    loadHistory(false);

    // Listen to real-time incoming messages
    const unsubNewMsg = socketService.onNewMessage((msg: any) => {
      if (msg.chatId !== chatId) return;
      const incomingId = msg.messageId || msg._id || `msg-${Date.now()}`;

      // The server emits to both the chat and user rooms, so ignore repeated wire events
      if (processedMessageIdsRef.current.has(incomingId)) return;
      processedMessageIdsRef.current.add(incomingId);

      setMessages(prev => {
        if (prev.some(m => m.messageId === incomingId || m._id === incomingId)) return prev;

        // A message sent by me replaces its local copy (even one already shown as not sent)
        const myId = currentUserIdRef.current;
        const sId = typeof msg.senderId === 'object' ? msg.senderId?._id || msg.senderId?.id : msg.senderId;
        const isFromMe = (myId && sId === myId) || msg.senderType === role;
        const incoming = toMessageItem(msg, incomingId);
        const pendingIndex = isFromMe
          ? prev.findIndex(m => isLocalMessage(m) && m.content === msg.content)
          : -1;

        let updated: ChatMessageItem[];
        if (pendingIndex !== -1) {
          clearSendTimer(prev[pendingIndex]._id);
          updated = [...prev];
          updated[pendingIndex] = incoming;
        } else {
          updated = [...prev, incoming];
        }
        setCachedMessages(chatId, updated);
        return updated;
      });

      // Mark read immediately since user is actively viewing this chat
      socketService.markMessagesRead(chatId, [incomingId]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    });

    // The server could not save a message
    const unsubChatError = socketService.onChatError(data => {
      if (data?.type !== 'message_send_error') return;
      const sending = messagesRef.current.filter(m => m.localStatus === 'sending');
      if (sending.length > 0) {
        sending.forEach(m => clearSendTimer(m._id));
        setMessages(prev => prev.map(m => (m.localStatus === 'sending' ? { ...m, localStatus: 'failed' } : m)));
        return;
      }
      // the message was already shown from the live echo but never saved: reload the truth
      setAlertConfig({
        visible: true,
        title: i18n.t('chat.messageNotSaved'),
        message: i18n.t('chat.messageNotSavedBody'),
        type: 'error',
      });
      loadHistory(false);
    });

    // After a connection drop, fetch what was missed
    const unsubReconnect = socketService.onReconnect(() => {
      socketService.joinChat(chatId);
      loadHistory(true);
    });

    // Listen to read receipts from the other participant
    const unsubRead = socketService.onMessagesRead(data => {
      if (data.chatId === chatId) {
        const idsToMark = new Set(data.messageIds || []);
        setMessages(prev =>
          prev.map(m =>
            idsToMark.size === 0 || idsToMark.has(m._id) || idsToMark.has(m.messageId)
              ? { ...m, isRead: true }
              : m,
          ),
        );
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
      socketService.leaveChat(chatId);
      unsubNewMsg();
      unsubChatError();
      unsubReconnect();
      unsubRead();
      unsubTypingStart();
      unsubTypingStop();
      unsubOnline();
      unsubOffline();
    };
  }, [chatId, role, loadHistory, clearSendTimer]);

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
    draftRef.current = text;
    setDraft(text);
    if (!chatId) return;

    socketService.startTyping(chatId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketService.stopTyping(chatId);
    }, 2000);
  };

  // Sends (or re-sends) one message that already sits in the list as a local copy
  const deliver = useCallback(
    async (tempId: string, text: string) => {
      if (!chatId || deliveringRef.current.has(tempId)) return;
      deliveringRef.current.add(tempId);
      patchMessage(tempId, { localStatus: 'sending' });
      try {
        if (isSellerQuery) {
          const ok = await sendQueryReply(queryId || chatId, text);
          if (mountedRef.current) patchMessage(tempId, { localStatus: ok ? undefined : 'failed' });
          return;
        }

        if (socketService.isConnected()) {
          socketService.sendChatMessage({ chatId, content: text, messageType: 'text' });
          // the server echoes the message back; no echo in time means it was not sent
          clearSendTimer(tempId);
          sendTimersRef.current.set(
            tempId,
            setTimeout(() => {
              sendTimersRef.current.delete(tempId);
              if (mountedRef.current) patchMessage(tempId, { localStatus: 'failed' }, 'sending');
            }, SEND_TIMEOUT_MS),
          );
          return;
        }

        // Fallback to HTTP only when socket is not connected
        const res = await sendChatMessageHttp(chatId, { content: text });
        if (!mountedRef.current) return;
        if (res.success) {
          const serverId = res.message?._id || res.message?.messageId;
          if (serverId) processedMessageIdsRef.current.add(serverId);
          patchMessage(
            tempId,
            serverId ? { _id: serverId, messageId: serverId, localStatus: undefined } : { localStatus: undefined },
          );
        } else {
          patchMessage(tempId, { localStatus: 'failed' });
        }
      } catch {
        if (mountedRef.current) patchMessage(tempId, { localStatus: 'failed' });
      } finally {
        deliveringRef.current.delete(tempId);
      }
    },
    [chatId, isSellerQuery, queryId, patchMessage, clearSendTimer],
  );

  const send = () => {
    // read from the ref so a quick double tap cannot send the same text twice
    const text = draftRef.current.trim();
    if (!text || !chatId) return;
    draftRef.current = '';

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketService.stopTyping(chatId);

    const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const localMsg: ChatMessageItem = {
      _id: tempId,
      messageId: tempId,
      content: text,
      messageType: 'text',
      senderType: role,
      senderId: currentUserIdRef.current,
      timestamp: new Date().toISOString(),
      isRead: false,
      localStatus: 'sending',
    };

    setMessages(prev => {
      const next = [...prev, localMsg];
      setCachedMessages(chatId, next);
      return next;
    });
    setDraft('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    deliver(tempId, text);
  };

  const retryMessage = (id: string) => {
    const m = messagesRef.current.find(x => x._id === id);
    if (m && m.localStatus === 'failed') deliver(id, m.content);
  };

  const discardMessage = (id: string) => {
    if (!chatId) return;
    clearSendTimer(id);
    setMessages(prev => {
      const next = prev.filter(m => m._id !== id);
      setCachedMessages(chatId, next);
      return next;
    });
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (e.nativeEvent.contentOffset.y < 80 && hasInitialScrolledRef.current && !olderError) {
      loadOlder();
    }
  };

  const handleRespondQuotation = async (quotationId: string, action: 'accepted' | 'rejected') => {
    if (!quotationId || isRespondingQuotation) return;
    setIsRespondingQuotation(true);
    try {
      const res = await respondToQuotation(quotationId, action);
      setMessages(prev =>
        prev.map(m => {
          const id = m.quotationData?.quotationId || m.quotationData?._id;
          return id === quotationId
            ? { ...m, quotationData: { ...m.quotationData, status: action } }
            : m;
        }),
      );
      setAlertConfig({
        visible: true,
        title: action === 'accepted' ? i18n.t('chat.quoteAccepted') : i18n.t('chat.quoteDeclined'),
        message:
          res?.message ||
          (action === 'accepted'
            ? i18n.t('chat.acceptedBody')
            : i18n.t('chat.declinedBody')),
        type: action === 'accepted' ? 'success' : 'info',
      });
    } catch (err: any) {
      setAlertConfig({
        visible: true,
        title: i18n.t('chat.actionFailed'),
        message: err?.message || i18n.t('chat.quoteUpdateFailed'),
        type: 'error',
      });
    } finally {
      setIsRespondingQuotation(false);
    }
  };

  const isMessageFromMe = (msg: ChatMessageItem) => {
    if (msg._id?.startsWith('local-') || msg.messageId?.startsWith('local-')) return true;
    const uid = currentUserId || currentUserIdRef.current;
    if (uid && msg.senderId) {
      const sId = typeof msg.senderId === 'object' ? msg.senderId._id || msg.senderId.id : msg.senderId;
      if (sId && String(sId) === String(uid)) return true;
    }
    return msg.senderType === role;
  };

  return (
    <KeyboardSafeView
      style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Squeeze onPress={() => navigation.goBack()} scale={0.9}>
          <View style={[styles.back, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={18} color={colors.onPrimary} />
          </View>
        </Squeeze>

        <Avatar
          uri={participant.avatar}
          name={participant.name}
          style={[styles.headerAvatar, { borderWidth: 1, borderColor: colors.avatarBorder }]}
        />

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
              {isOtherTyping
                ? t('chat.typing')
                : route?.params?.question
                ? `${route.params.question}${queryId ? t('chat.idSuffix', { id: queryId }) : ''}`
                : participant.isOnline
                ? t('chat.online')
                : t('chat.offline')}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      {loading && messages.length === 0 ? (
        <CtiLoader size="md" text={t('chat.loadingConversation')} style={{ flex: 1 }} />
      ) : historyError && messages.length === 0 ? (
        <ErrorState error={historyError} onRetry={() => loadHistory(false)} fullScreen={false} />
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.messageScroll}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={100}
          onScroll={handleScroll}
          maintainVisibleContentPosition={{ minIndexForVisible: 1 }}
          onContentSizeChange={() => {
            if (!hasInitialScrolledRef.current && messages.length > 0) {
              hasInitialScrolledRef.current = true;
              scrollRef.current?.scrollToEnd({ animated: false });
            }
          }}>
          {/* index 0 is always this row, so older messages can be added above without a jump */}
          <View style={styles.notice}>
            {loadingOlder ? (
              <Text style={[styles.noticeText, { color: colors.textMuted }]}>{t('chat.loadingOlder')}</Text>
            ) : olderError ? (
              <TouchableOpacity
                onPress={() => {
                  setOlderError('');
                  loadOlder();
                }}>
                <Text style={[styles.noticeText, { color: colors.error }]}>
                  {t('chat.olderRetry')}
                </Text>
              </TouchableOpacity>
            ) : historyError ? (
              <TouchableOpacity onPress={() => loadHistory(false)}>
                <Text style={[styles.noticeText, { color: colors.error }]}>
                  {t('chat.refreshRetry')}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {messages.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyPrompt, { color: colors.textMuted }]}>
                {t('chat.startOfConversation', { name: participant.name })}
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
                  <Bubble
                    message={message}
                    participant={participant}
                    isMine={isMine}
                    onRespondQuotation={isCustomer ? handleRespondQuotation : undefined}
                    isRespondingQuotation={isRespondingQuotation}
                    onRetry={retryMessage}
                    onDiscard={discardMessage}
                  />
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
          placeholder={isCustomer ? t('chat.typeMessage') : t('chat.typeReply')}
          placeholderTextColor={colors.textMuted}
          multiline
          style={[
            styles.input,
            { color: colors.text, backgroundColor: colors.surfaceAlt, borderColor: colors.border },
          ]}
        />
        <Squeeze onPress={send} scale={0.9} disabled={!draft.trim()}>
          <View
            style={[
              styles.sendButton,
              { backgroundColor: colors.primary, opacity: draft.trim() ? 1 : 0.5 },
            ]}>
            <Icon source={sendBold} size={18} color={colors.onPrimary} />
          </View>
        </Squeeze>
      </View>

      <AlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </KeyboardSafeView>
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
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  bubbleTime: { fontFamily: fonts.regular, fontSize: 10 },
  failedRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 6 },
  failedAction: { fontFamily: fonts.bold, fontSize: 12 },
  notice: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 14 },
  noticeText: { fontFamily: fonts.medium, fontSize: 12, textAlign: 'center' },

  emptyWrap: { paddingVertical: 80, alignItems: 'center', paddingHorizontal: 30 },
  emptyPrompt: { fontFamily: fonts.regular, fontSize: 13, textAlign: 'center', lineHeight: 20 },

  quotationCard: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 8, minWidth: 200 },
  quotationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quotationTitle: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 13 },
  quotationStatusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  quotationStatusText: { fontFamily: fonts.bold, fontSize: 10 },
  quotationDesc: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17 },
  quotationDivider: { height: 1, width: '100%' },
  quotationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quotationLabel: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 12 },
  quotationVal: { fontFamily: fonts.medium, fontSize: 12 },
  quotationActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  quotationActionBtn: { flex: 1 },
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
