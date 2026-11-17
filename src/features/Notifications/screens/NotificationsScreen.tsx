import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import { arrowLeftBold, bellBold, bellFilled, trashBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import notificationApi, { NotificationItem } from '@/services/notificationApi';
import AuthService from '@/services/authService';
import fcmService from '@/services/fcmService';
import { setUnreadNotifications } from '@/services/unreadStore';
import socketService from '@/services/socketService';
import AlertModal from '@/components/AlertModal';
import NotificationDetailModal from '../components/NotificationDetailModal';
import {
  getDetailRows,
  getNotificationAction,
} from '../utils/notificationDetails';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  OfflineBanner,
  PaginationFooter,
} from '@/components/states';
import { getLocaleTag } from '@/i18n/locale';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

const PAGE_SIZE = 20;

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diffSec < 60) return i18n.t('repairmanMsg.time.justNow');
  if (diffSec < 3600) return i18n.t('repairmanMsg.time.minutesAgo', { count: Math.floor(diffSec / 60) });
  if (diffSec < 86400) return i18n.t('repairmanMsg.time.hoursAgoShort', { count: Math.floor(diffSec / 3600) });
  return d.toLocaleDateString(getLocaleTag(), { month: 'short', day: 'numeric' });
}

export default function NotificationsScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The total number of unread notifications from the backend, not only the ones loaded so far
  const [unreadTotal, setUnreadTotal] = useState(0);

  // Notifications the user read in this session stay read when the list is loaded again, even if the server answers
  // before it saved the change. Without this the unread count jumped back up for a moment after reading one.
  const readIds = useRef<Set<string>>(new Set());
  const deletingIds = useRef<Set<string>>(new Set());
  const markingAll = useRef(false);
  const keepRead = (list: NotificationItem[]) =>
    list.map(n =>
      readIds.current.has(n._id) && !n.isRead ? { ...n, isRead: true } : n,
    );

  const loadNotifications = useCallback(
    async (targetPage = 1, isRefresh = false, silent = false) => {
      if (silent) {
        // a quiet reload for a new notification: new ones go to the top, the rest of the list stays
      } else if (isRefresh) {
        setRefreshing(true);
      } else if (targetPage === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      if (!silent) setError(null);

      try {
        const res = await notificationApi.getNotifications(
          targetPage,
          PAGE_SIZE,
        );
        const raw = res.notifications || [];
        const incoming = keepRead(raw);
        if (targetPage === 1) {
          // a notification read a moment ago may still be unread on the server, so it is not counted
          const notSavedYet = raw.filter(
            n => !n.isRead && readIds.current.has(n._id),
          ).length;
          setUnreadTotal(Math.max(0, res.unreadCount - notSavedYet));
        }

        if (silent) {
          setNotifications(prev => {
            const ids = new Set(incoming.map(n => n._id));
            return [...incoming, ...prev.filter(n => !ids.has(n._id))];
          });
        } else if (isRefresh || targetPage === 1) {
          setNotifications(incoming);
          setPage(1);
          setHasMore(incoming.length >= PAGE_SIZE);
        } else {
          setNotifications(prev => [...prev, ...incoming]);
          setPage(targetPage);
          setHasMore(incoming.length >= PAGE_SIZE);
        }
      } catch (err: any) {
        if (!silent)
          setError(
            err?.message || i18n.t('repairman.couldNotLoadNotificationsPlease'),
          );
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  // A new notification arrives by socket (when the sender uses it) or as a push while the app is open.
  // Either way the saved list is loaded again quietly, so the screen always shows what the backend saved.
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reloadSoon = useCallback(() => {
    if (reloadTimer.current) clearTimeout(reloadTimer.current);
    reloadTimer.current = setTimeout(
      () => loadNotifications(1, false, true),
      600,
    );
  }, [loadNotifications]);

  useEffect(() => {
    loadNotifications(1, false);

    const offSocket = socketService.onNotification(() => reloadSoon());
    const offPush = fcmService.onMessageReceived(() => reloadSoon());

    return () => {
      offSocket();
      offPush();
      if (reloadTimer.current) clearTimeout(reloadTimer.current);
    };
  }, [loadNotifications, reloadSoon]);

  const [selected, setSelected] = useState<NotificationItem | null>(null);
  const [notice, setNotice] = useState('');

  const handleMarkAsRead = async (item: NotificationItem) => {
    if (item.isRead || readIds.current.has(item._id)) return;
    readIds.current.add(item._id);
    setUnreadTotal(total => Math.max(0, total - 1));
    setNotifications(prev =>
      prev.map(n => (n._id === item._id ? { ...n, isRead: true } : n)),
    );
    const ok = await notificationApi.markAsRead(item._id);
    if (!ok) {
      readIds.current.delete(item._id);
      setUnreadTotal(total => total + 1);
      setNotifications(prev =>
        prev.map(n => (n._id === item._id ? { ...n, isRead: false } : n)),
      );
      setNotice(i18n.t('repairman.couldNotMarkTheNotification'));
    }
  };

  const openItem = (item: NotificationItem) => {
    setSelected(item);
    handleMarkAsRead(item);
  };

  const handleMarkAllRead = async () => {
    if (markingAll.current) return;
    markingAll.current = true;
    const before = notifications;
    const totalBefore = unreadTotal;
    const added = notifications
      .filter(n => !readIds.current.has(n._id))
      .map(n => n._id);
    added.forEach(id => readIds.current.add(id));
    setUnreadTotal(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    const ok = await notificationApi.markAllAsRead();
    markingAll.current = false;
    if (!ok) {
      added.forEach(id => readIds.current.delete(id));
      setUnreadTotal(totalBefore);
      setNotifications(before);
      setNotice(i18n.t('repairman.couldNotMarkAllNotifications'));
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingIds.current.has(id)) return;
    deletingIds.current.add(id);
    const before = notifications;
    const wasUnread = notifications.some(n => n._id === id && !n.isRead);
    if (wasUnread) setUnreadTotal(total => Math.max(0, total - 1));
    setNotifications(prev => prev.filter(n => n._id !== id));
    setSelected(current => (current?._id === id ? null : current));
    const ok = await notificationApi.deleteNotification(id);
    deletingIds.current.delete(id);
    if (!ok) {
      if (wasUnread) setUnreadTotal(total => total + 1);
      setNotifications(before);
      setNotice(i18n.t('repairman.couldNotDeleteTheNotification'));
    }
  };

  const selectedRole = AuthService.getCachedRole();
  const selectedAction = selected
    ? getNotificationAction(selectedRole, selected)
    : null;

  const handleEndReached = () => {
    if (!loading && !loadingMore && !refreshing && hasMore) {
      loadNotifications(page + 1, false);
    }
  };

  const unreadCount = unreadTotal;

  // The bell in the headers shows the same number
  useEffect(() => {
    if (!loading) setUnreadNotifications(unreadTotal);
  }, [loading, unreadTotal]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Squeeze onPress={() => navigation?.goBack()} scale={0.9}>
          <View style={[styles.backBtn, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={18} color={colors.onPrimary} />
          </View>
        </Squeeze>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t('repairman.notifications')}
          </Text>
          {unreadCount > 0 && (
            <View
              style={[styles.unreadBadge, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 ? (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            style={styles.markAllBtn}
          >
            <Text style={[styles.markAllText, { color: colors.primary }]}>
              {t('repairman.markAll')}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {/* Offline Status Bar */}
      <OfflineBanner />

      {/* Body States */}
      {loading && !refreshing ? (
        <LoadingState text={t('repairman.loadingNotifications')} />
      ) : error && notifications.length === 0 ? (
        <ErrorState
          error={error}
          title={t('repairman.unableToLoadNotifications')}
          onRetry={() => loadNotifications(1, false)}
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item._id}
          contentContainerStyle={[
            styles.list,
            notifications.length === 0 && styles.emptyListContent,
            { paddingBottom: insets.bottom + 30 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadNotifications(1, true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            <PaginationFooter loading={loadingMore} hasMore={hasMore} />
          }
          renderItem={({ item, index }) => (
            <FadeUp
              key={item._id}
              delay={30 + Math.min(index, 10) * 20}
              duration={300}
            >
              <TouchableOpacity
                onPress={() => openItem(item)}
                activeOpacity={0.8}
                style={[
                  styles.card,
                  {
                    backgroundColor: item.isRead
                      ? colors.surface
                      : colors.surfaceAlt,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: item.isRead
                        ? colors.surfaceAlt
                        : colors.primary + '18',
                    },
                  ]}
                >
                  <Icon
                    source={item.isRead ? bellBold : bellFilled}
                    size={18}
                    color={item.isRead ? colors.textMuted : colors.primary}
                  />
                </View>

                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text
                      style={[
                        styles.cardTitle,
                        { color: colors.text },
                        !item.isRead && { fontFamily: fonts.bold },
                      ]}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[styles.cardTime, { color: colors.textMuted }]}
                    >
                      {formatRelativeTime(item.createdAt)}
                    </Text>
                  </View>

                  <Text
                    style={[styles.cardBody, { color: colors.textMuted }]}
                    numberOfLines={2}
                  >
                    {item.body}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => handleDelete(item._id)}
                  style={styles.deleteBtn}
                >
                  <Icon source={trashBold} size={15} color={colors.textMuted} />
                </TouchableOpacity>
              </TouchableOpacity>
            </FadeUp>
          )}
          ListEmptyComponent={
            <EmptyState
              title={t('repairman.noNotifications')}
              message={t('repairman.youReCompletelyCaughtUp')}
              icon={bellBold}
              fullScreen={false}
            />
          }
        />
      )}

      <NotificationDetailModal
        item={selected}
        rows={selected ? getDetailRows(selected) : []}
        action={selectedAction}
        onClose={() => setSelected(null)}
        onAction={() => {
          setSelected(null);
          selectedAction?.run(navigation);
        }}
      />

      <AlertModal
        visible={Boolean(notice)}
        type="error"
        title={t('repairman.notifications')}
        message={notice}
        onClose={() => setNotice('')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    flexShrink: 1,
    fontSize: 18,
    fontFamily: fonts.bold,
  },
  unreadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: fonts.bold,
  },
  markAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  markAllText: {
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  headerSpacer: {
    width: 60,
  },
  list: {
    padding: 16,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    flex: 1,
    marginRight: 8,
  },
  cardTime: {
    fontSize: 11,
    fontFamily: fonts.regular,
  },
  cardBody: {
    fontSize: 12,
    fontFamily: fonts.regular,
    lineHeight: 17,
  },
  deleteBtn: {
    padding: 4,
  },
});
