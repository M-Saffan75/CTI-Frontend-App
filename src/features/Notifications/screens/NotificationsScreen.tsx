import { useCallback, useEffect, useState } from 'react';
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
import {
  arrowLeftBold,
  bellBold,
  bellFilled,
  trashBold,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import notificationApi, { NotificationItem } from '@/services/notificationApi';
import socketService from '@/services/socketService';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  OfflineBanner,
  PaginationFooter,
} from '@/components/states';

const PAGE_SIZE = 20;

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function NotificationsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(
    async (targetPage = 1, isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else if (targetPage === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      try {
        const res = await notificationApi.getNotifications(targetPage, PAGE_SIZE);
        const incoming = res.notifications || [];

        if (isRefresh || targetPage === 1) {
          setNotifications(incoming);
        } else {
          setNotifications(prev => [...prev, ...incoming]);
        }

        setPage(targetPage);
        setHasMore(incoming.length >= PAGE_SIZE);
      } catch (err: any) {
        const errMsg = err?.message || 'Could not load notifications. Please try again.';
        setError(errMsg);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadNotifications(1, false);

    // Listen to real-time notification broadcasts over socket
    const unsub = socketService.onNotification((newNotif: any) => {
      const item: NotificationItem = {
        _id: newNotif._id || `notif-${Date.now()}`,
        title: newNotif.title || 'New Notification',
        body: newNotif.body || newNotif.message || '',
        type: newNotif.type || 'system',
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      setNotifications(prev => [item, ...prev]);
    });

    return () => {
      unsub();
    };
  }, [loadNotifications]);

  const handleMarkAsRead = async (item: NotificationItem) => {
    if (item.isRead) return;
    setNotifications(prev =>
      prev.map(n => (n._id === item._id ? { ...n, isRead: true } : n)),
    );
    await notificationApi.markAsRead(item._id);
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    await notificationApi.markAllAsRead();
  };

  const handleDelete = async (id: string) => {
    setNotifications(prev => prev.filter(n => n._id !== id));
    await notificationApi.deleteNotification(id);
  };

  const handleEndReached = () => {
    if (!loading && !loadingMore && !refreshing && hasMore) {
      loadNotifications(page + 1, false);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
        ]}>
        <Squeeze onPress={() => navigation?.goBack()} scale={0.9}>
          <View style={[styles.backBtn, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={18} color={colors.onPrimary} />
          </View>
        </Squeeze>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
            <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {/* Offline Status Bar */}
      <OfflineBanner />

      {/* Body States */}
      {loading && !refreshing ? (
        <LoadingState text="Loading notifications..." />
      ) : error && notifications.length === 0 ? (
        <ErrorState
          error={error}
          title="Unable to load notifications"
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
            <FadeUp key={item._id} delay={30 + Math.min(index, 10) * 20} duration={300}>
              <TouchableOpacity
                onPress={() => handleMarkAsRead(item)}
                activeOpacity={0.8}
                style={[
                  styles.card,
                  {
                    backgroundColor: item.isRead ? colors.surface : colors.surfaceAlt,
                    borderColor: colors.border,
                  },
                ]}>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: item.isRead
                        ? colors.surfaceAlt
                        : colors.primary + '18',
                    },
                  ]}>
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
                      ]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.cardTime, { color: colors.textMuted }]}>
                      {formatRelativeTime(item.createdAt)}
                    </Text>
                  </View>

                  <Text
                    style={[styles.cardBody, { color: colors.textMuted }]}
                    numberOfLines={2}>
                    {item.body}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => handleDelete(item._id)}
                  style={styles.deleteBtn}>
                  <Icon source={trashBold} size={15} color={colors.textMuted} />
                </TouchableOpacity>
              </TouchableOpacity>
            </FadeUp>
          )}
          ListEmptyComponent={
            <EmptyState
              title="No notifications"
              message="You're completely caught up. Updates on jobs, orders, and chats will appear here."
              icon={bellBold}
              fullScreen={false}
            />
          }
        />
      )}
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
