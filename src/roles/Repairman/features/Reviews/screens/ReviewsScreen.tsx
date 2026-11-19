import { useCallback, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AlertModal, { AlertModalType } from '@/components/AlertModal';
import Icon from '@/components/Icon';
import Avatar from '@/components/Avatar';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PaginationFooter,
} from '@/components/states';
import {
  arrowRightBold,
  starBold,
  starExtra,
} from '@/assets/icons';
import repairmanApi, {
  ReceivedReview,
} from '@/roles/Repairman/api/repairmanApi';
import useApiData from '@/roles/Repairman/utils/useApiData';
import usePagedList from '@/roles/Seller/utils/usePagedList';
import { formatDate, timeAgo } from '@/utils/dateFormat';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import ReplyModal from '../components/ReplyModal';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

const PAGE_SIZE = 10;
const STAR_ROWS = [5, 4, 3, 2, 1] as const;

function Stars({ value, size = 13 }: { value: number; size?: number }) {
  const { colors } = useTheme();

  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map(n => (
        <Icon
          key={n}
          source={starExtra}
          size={size}
          color={n <= Math.round(value) ? colors.primary : colors.border}
        />
      ))}
    </View>
  );
}

function ReviewCard({
  review,
  onReply,
}: {
  review: ReceivedReview;
  onReply: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const device = [review.deviceRepaired?.brand, review.deviceRepaired?.model]
    .filter(Boolean)
    .join(' ');
  const avatar = review.customerId?.profilePicture;
  const reply = review.repairmanResponse?.text;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.head}>
        <Avatar
          uri={avatar}
          name={review.customerId?.name}
          style={[styles.avatar, { borderColor: colors.avatarBorder }]}
        />
        <View style={styles.flex}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {review.customerId?.name || i18n.t('glossary.customer')}
          </Text>
          <Text style={[styles.days, { color: colors.textMuted }]}>
            {timeAgo(review.createdAt)}
          </Text>
        </View>
        <Stars value={review.overallRating} />
      </View>

      {device ? (
        <View style={[styles.pill, { backgroundColor: colors.surfaceAlt }]}>
          <Text style={[styles.pillText, { color: colors.text }]}>
            {device}
          </Text>
        </View>
      ) : null}

      {review.reviewText ? (
        <Text style={[styles.text, { color: colors.textMuted }]}>
          {review.reviewText}
        </Text>
      ) : (
        <Text style={[styles.text, { color: colors.textMuted }]}>
          {t('repairman.theCustomerLeftARating')}
        </Text>
      )}

      {reply ? (
        <View
          style={[
            styles.reply,
            { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.replyTitle, { color: colors.primary }]}>
            {i18n.t('repairman.yourReply')}
            {review.repairmanResponse?.respondedAt
              ? `  •  ${formatDate(review.repairmanResponse.respondedAt)}`
              : ''}
          </Text>
          <Text style={[styles.replyText, { color: colors.text }]}>
            {reply}
          </Text>
        </View>
      ) : null}

      <View style={styles.footer}>
        <Text style={[styles.helpful, { color: colors.textMuted }]}>
          {review.helpfulVotes
            ? i18n.t('repairmanMsg.helpfulVotes', { count: review.helpfulVotes })
            : ''}
        </Text>
        <TouchableOpacity onPress={onReply} hitSlop={8} style={styles.replyRow}>
          <Text style={[styles.replyAction, { color: colors.primary }]}>
            {reply ? t('repairman.editReply') : t('repairman.replyToReview')}
          </Text>
          <Icon source={arrowRightBold} size={13} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ReviewsContent() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();

  const [rating, setRating] = useState<number | null>(null);
  const [replyTo, setReplyTo] = useState<ReceivedReview | null>(null);
  const [notice, setNotice] = useState<{
    type: AlertModalType;
    title: string;
    message: string;
  } | null>(null);

  const stats = useApiData(() => repairmanApi.getReviewStats(), []);

  const fetchPage = useCallback(
    async (page: number) => {
      const data = await repairmanApi.getReceivedReviews({
        page,
        limit: PAGE_SIZE,
        rating: rating ?? undefined,
      });
      return {
        items: data.reviews,
        totalPages: data.totalPages,
        totalItems: data.total,
      };
    },
    [rating],
  );
  const list = usePagedList<ReceivedReview>(fetchPage, focused);

  const total = stats.data?.totalReviews ?? 0;
  const average = stats.data?.averageRating ?? 0;

  const refresh = async () => {
    stats.reload(true);
    list.onRefresh();
  };

  const header = (
    <View>
      <Text style={[styles.title, { color: colors.text }]}>{t('repairman.reviews')}</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        {t('repairman.trackYourClientFeedbackAnd')}
      </Text>

      <View
        style={[
          styles.summary,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {stats.loading && !stats.data ? (
          <LoadingState
            fullScreen={false}
            size="sm"
            text={t('repairman.loadingRatings')}
          />
        ) : stats.error && !stats.data ? (
          <ErrorState
            error={stats.error}
            onRetry={() => stats.reload()}
            fullScreen={false}
          />
        ) : (
          <>
            <View style={styles.average}>
              <Text style={[styles.averageValue, { color: colors.text }]}>
                {total ? average.toFixed(1) : '-'}
              </Text>
              <View style={styles.flex}>
                <Stars value={average} size={16} />
                <Text
                  style={[
                    styles.distributionSubtitle,
                    { color: colors.textMuted },
                  ]}
                >
                  {i18n.t(total === 1 ? 'repairmanMsg.breakdownOne' : 'repairmanMsg.breakdownMany', { count: total })}
                </Text>
              </View>
            </View>

            {STAR_ROWS.map(stars => {
              const count =
                stats.data?.ratingDistribution?.[
                  String(stars) as '1' | '2' | '3' | '4' | '5'
                ] ?? 0;
              const percent = total ? Math.round((count / total) * 100) : 0;
              return (
                <TouchableOpacity
                  key={stars}
                  style={styles.distributionRow}
                  onPress={() => setRating(rating === stars ? null : stars)}
                >
                  <Text
                    style={[
                      styles.distributionStars,
                      { color: colors.textMuted },
                    ]}
                  >
                    {stars}
                  </Text>
                  <Icon source={starBold} size={13} color={colors.primary} />
                  <View
                    style={[styles.track, { backgroundColor: colors.border }]}
                  >
                    <View
                      style={[
                        styles.fill,
                        {
                          backgroundColor: colors.primary,
                          width: `${percent}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.distributionCount,
                      { color: colors.textMuted },
                    ]}
                  >
                    {count} ({percent}%)
                  </Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </View>

      <View style={styles.filterRow}>
        {[null, ...STAR_ROWS].map(value => {
          const active = value === rating;
          return (
            <TouchableOpacity
              key={String(value)}
              onPress={() => setRating(value)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.primary : colors.surfaceAlt,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: active ? colors.onPrimary : colors.textMuted },
                ]}
              >
                {value === null ? i18n.t('customer.all') : `${value} ★`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.reviewsTitle, { color: colors.text }]}>
        {t('repairman.recentClientReviews')}
      </Text>
      <Text style={[styles.reviewsCount, { color: colors.textMuted }]}>
        {list.total
          ? i18n.t('repairmanMsg.showingReviews', { shown: list.items.length, total: list.total })
          : ''}
      </Text>
    </View>
  );

  return (
    <View style={styles.flex}>
      <FlatList
        data={list.items}
        keyExtractor={review => review._id}
        renderItem={({ item }) => (
          <ReviewCard review={item} onReply={() => setReplyTo(item)} />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          list.loading ? (
            <LoadingState fullScreen={false} text={t('repairman.loadingReviews')} />
          ) : list.error ? (
            <ErrorState
              error={list.error}
              onRetry={list.retry}
              fullScreen={false}
            />
          ) : (
            <EmptyState
              fullScreen={false}
              title={t('customer.noReviewsYet')}
              message={
                rating
                  ? i18n.t('repairmanMsg.noStarReviews', { rating })
                  : t('repairman.reviewsFromYourCustomersAppear')
              }
              icon={starBold}
              action={
                rating
                  ? {
                      label: t('repairman.showAllReviews'),
                      onPress: () => setRating(null),
                    }
                  : undefined
              }
            />
          )
        }
        ListFooterComponent={
          list.items.length > 0 ? (
            <PaginationFooter
              loading={list.loadingMore}
              hasMore={list.hasMore}
              endText={t('repairman.youHaveSeenAllReviews')}
            />
          ) : null
        }
        contentContainerStyle={[
          styles.body,
          { paddingBottom: insets.bottom + 30 },
        ]}
        showsVerticalScrollIndicator={false}
        onEndReached={list.onEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={list.refreshing}
            onRefresh={refresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />

      <ReplyModal
        review={replyTo}
        onClose={() => setReplyTo(null)}
        onReplied={(updated, message) => {
          list.updateItem(review => review._id === updated._id, {
            repairmanResponse: updated.repairmanResponse,
          });
          setReplyTo(null);
          setNotice({ type: 'success', title: i18n.t('repairman.replySent'), message });
        }}
      />

      <AlertModal
        visible={Boolean(notice) || Boolean(list.loadError)}
        type={notice?.type || 'error'}
        title={notice?.title || t('repairman.couldNotLoad')}
        message={notice?.message || list.loadError || ''}
        onClose={() => {
          setNotice(null);
          list.clearLoadError();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { paddingHorizontal: 20, paddingTop: 16 },
  title: { fontFamily: fonts.bold, fontSize: 24 },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },
  summary: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginTop: 16,
    gap: 8,
  },
  average: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 6,
  },
  averageValue: { fontFamily: fonts.bold, fontSize: 36 },
  distributionSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 4,
  },
  distributionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  distributionStars: { fontFamily: fonts.regular, fontSize: 12, width: 10 },
  track: { flex: 1, height: 6, borderRadius: 3 },
  fill: { height: 6, borderRadius: 3 },
  distributionCount: {
    fontFamily: fonts.regular,
    fontSize: 12,
    width: 66,
    textAlign: 'right',
  },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  chip: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { fontFamily: fonts.medium, fontSize: 12 },
  reviewsTitle: { fontFamily: fonts.bold, fontSize: 17, marginTop: 22 },
  reviewsCount: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  stars: { flexDirection: 'row', gap: 2 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginTop: 14,
    gap: 10,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, borderWidth: 1 },
  name: { fontFamily: fonts.bold, fontSize: 14 },
  days: { fontFamily: fonts.regular, fontSize: 12 },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: { fontFamily: fonts.medium, fontSize: 12 },
  text: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  reply: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 4 },
  replyTitle: { fontFamily: fonts.bold, fontSize: 12 },
  replyText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  helpful: { fontFamily: fonts.regular, fontSize: 12 },
  replyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  replyAction: { fontFamily: fonts.bold, fontSize: 13 },
});
