import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CtiLoader from '@/components/CtiLoader';
import { ErrorState } from '@/components/states';
import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import { arrowLeftBold, searchBold } from '@/assets/icons';
import { dummyProfileExtra } from '@/assets/icons';
import i18n from '@/i18n';

import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { ChatItem, fetchChatList } from '@/services/chatApi';
import socketService from '@/services/socketService';
import { getLocaleTag } from '@/i18n/locale';
import { useTranslation } from 'react-i18next';

function formatChatTime(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString(getLocaleTag(), { hour: '2-digit', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) {
    return i18n.t('chat.yesterday');
  }
  return d.toLocaleDateString(getLocaleTag(), { month: 'short', day: 'numeric' });
}

function ChatRow({
  chat,
  navigation,
  fallbackName,
}: {
  chat: ChatItem;
  navigation: any;
  fallbackName: string;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const avatarSource = chat.participant?.avatar
    ? { uri: chat.participant.avatar }
    : dummyProfileExtra;
  const isQuery = chat.chatType === 'seller_query';
  const rowFallback = isQuery ? t('glossary.seller') : fallbackName;

  return (
    <Squeeze
      onPress={() =>
        navigation.navigate('ChatDetail', {
          chatId: chat.chatId,
          queryId: chat.queryId,
          chatType: chat.chatType,
          participantId: chat.participant?.id || (chat.participant as any)?._id || '',
          participantName: chat.participant?.name || rowFallback,
          participantAvatar: chat.participant?.avatar,
          isOnline: chat.participant?.isOnline,
        })
      }>
      <View style={styles.row}>
        <View style={styles.avatarWrap}>
          <Image
            source={avatarSource}
            style={[styles.avatar, { borderWidth: 1, borderColor: colors.avatarBorder }]}
          />
          {chat.participant?.isOnline && (
            <View
              style={[
                styles.onlineDot,
                { backgroundColor: colors.success, borderColor: colors.background },
              ]}
            />
          )}
        </View>

        <View style={styles.rowBody}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {chat.participant?.name || rowFallback}
          </Text>
          <Text style={[styles.lastMessage, { color: colors.textMuted }]} numberOfLines={1}>
            {chat.lastMessage?.fromMe ? t('appMsg.youPrefix') : ''}
            {chat.lastMessage?.content || (isQuery ? t('glossary.enquiry') : t('chat.noMessagesYet'))}
          </Text>
        </View>

        <View style={styles.rowMeta}>
          <Text style={[styles.time, { color: colors.success }]}>
            {formatChatTime(chat.lastMessage?.timestamp || chat.updatedAt)}
          </Text>
          {chat.unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.success }]}>
              <Text style={styles.unreadText}>{chat.unreadCount > 99 ? '99+' : chat.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </Squeeze>
  );
}

export default function ChatListScreen({
  navigation,
  role,
}: {
  navigation: any;
  role: 'customer' | 'repairman' | 'seller';
}) {
  const isCustomer = role === 'customer';
  const { t } = useTranslation();
  const fallbackName = isCustomer ? t('chat.technician') : t('chat.user');
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const chatsRef = useRef<ChatItem[]>([]);
  const firstFocusRef = useRef(true);

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  // A failed load never wipes the list: the old chats stay and an error line shows
  const loadChats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchChatList();
      setChats(data);
      setLoadError('');
    } catch (err: any) {
      setLoadError(err?.message || i18n.t('chat.loadFailed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Counts changed in the open chat (read) must show when coming back to this list
  useEffect(() => {
    const unsubFocus = navigation.addListener('focus', () => {
      if (firstFocusRef.current) {
        firstFocusRef.current = false;
        return;
      }
      loadChats(true);
    });
    return unsubFocus;
  }, [navigation, loadChats]);

  useEffect(() => {
    loadChats();

    // Ensure socket connected
    socketService.connect().catch(() => {});

    // Listen to real-time chat list updates
    const unsubListUpdate = socketService.onChatListUpdated((updateData: any) => {
      if (__DEV__) {
        console.log('[ChatListScreen] onChatListUpdated:', updateData);
      }
      loadChats(true);
    });

    // Fetch what was missed while the connection was down
    const unsubReconnect = socketService.onReconnect(() => loadChats(true));

    // Listen to new message to bump conversation
    const unsubNewMsg = socketService.onNewMessage((msg: any) => {
      if (!chatsRef.current.some(c => c.chatId === msg.chatId)) {
        // not in the list yet, reload from API
        loadChats(true);
        return;
      }
      // my own messages and messages of the chat I am looking at are not unread
      const countsAsUnread =
        msg.senderType !== role && socketService.getActiveChatId() !== msg.chatId;
      setChats(prev => {
        const index = prev.findIndex(c => c.chatId === msg.chatId);
        if (index !== -1) {
          const updatedChat = {
            ...prev[index],
            lastMessage: {
              content: msg.content || (msg.messageType ? `[${msg.messageType}]` : ''),
              senderType: msg.senderType,
              timestamp: msg.timestamp || new Date().toISOString(),
              messageType: msg.messageType || 'text',
            },
            unreadCount: (prev[index].unreadCount || 0) + (countsAsUnread ? 1 : 0),
            updatedAt: msg.timestamp || new Date().toISOString(),
          };
          const rest = prev.filter((_, i) => i !== index);
          return [updatedChat, ...rest];
        }
        return prev;
      });
    });

    return () => {
      unsubListUpdate();
      unsubReconnect();
      unsubNewMsg();
    };
  }, [loadChats, role]);

  const filtered = chats.filter(chat =>
    (chat.participant?.name || '').toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 30 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadChats(true)}
            colors={[colors.primary]}
          />
        }>
        <View style={styles.headRow}>
          <Squeeze onPress={() => navigation.goBack()} scale={0.9}>
            <View style={[styles.back, { backgroundColor: colors.primary }]}>
              <Icon source={arrowLeftBold} size={20} color={colors.onPrimary} />
            </View>
          </Squeeze>

          <View
            style={[
              styles.search,
              { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
            ]}>
            <Icon source={searchBold} size={16} color={colors.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t('chat.searchConversations')}
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.text }]}
            />
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{t('chat.chatsCount', { count: chats.length })}</Text>

        {loadError && chats.length > 0 && (
          <TouchableOpacity onPress={() => loadChats(true)} style={styles.errorLine}>
            <Text style={[styles.errorLineText, { color: colors.error }]}>
              {t('chat.refreshFailed')}
            </Text>
          </TouchableOpacity>
        )}

        {loading && !refreshing ? (
          <CtiLoader size="md" text={t('chat.loadingChats')} style={{ paddingVertical: 50 }} />
        ) : loadError && chats.length === 0 ? (
          <ErrorState error={loadError} onRetry={() => loadChats()} fullScreen={false} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {search.trim() ? t('chat.noChatsMatching') : t('chat.noConversations')}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              {search.trim()
                ? isCustomer
                  ? t('chat.tryOtherTechnician')
                  : t('chat.tryOtherName')
                : isCustomer
                ? t('chat.emptyCustomer')
                : t('chat.emptyOther')}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map((chat, index) => (
              <FadeUp key={chat.chatId} delay={40 + index * 30} duration={350}>
                <ChatRow chat={chat} navigation={navigation} fallbackName={fallbackName} />
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              </FadeUp>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 20 },

  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 13, padding: 0 },

  title: { fontFamily: fonts.bold, fontSize: 22, marginTop: 20, marginBottom: 6 },

  errorLine: { paddingVertical: 8 },
  errorLineText: { fontFamily: fonts.medium, fontSize: 12 },

  list: {},
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  rowBody: { flex: 1, gap: 3 },
  name: { fontFamily: fonts.bold, fontSize: 15 },
  lastMessage: { fontFamily: fonts.regular, fontSize: 13 },
  rowMeta: { alignItems: 'flex-end', gap: 6 },
  time: { fontFamily: fonts.medium, fontSize: 12 },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadText: { fontFamily: fonts.bold, fontSize: 11, color: '#FFFFFF' },
  divider: { height: 1 },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 16, textAlign: 'center' },
  emptySubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
