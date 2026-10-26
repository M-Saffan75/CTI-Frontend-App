import { useCallback, useEffect, useState } from 'react';
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

import Button from '@/components/Button';
import CtiLoader from '@/components/CtiLoader';
import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import { FadeUp } from '@/animations';
import { starBold, starFilled } from '@/assets/icons';
import { dummyProfileExtra } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { fetchSellerReviewsApi } from '@/roles/Seller/services/sellerApi';

const STAR_FILTERS = [
  { id: 'All', label: 'All' },
  { id: '5', label: '5 ★' },
  { id: '4', label: '4 ★' },
  { id: '3', label: '3 ★' },
  { id: '2', label: '2 ★' },
  { id: '1', label: '1 ★' },
];

interface ReviewCardItem {
  id: string;
  reviewer: string;
  date: string;
  rating: number;
  productName: string;
  productImg: string;
  comment: string;
  sellerReply?: string;
}

const MOCK_REVIEWS: ReviewCardItem[] = [
  {
    id: 'rev-1',
    reviewer: 'Ali khan',
    date: '30/06/2026, 04:39 PM',
    rating: 2,
    productName: 'Vivo V40 5G',
    productImg: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=200&q=80',
    comment: 'The device build is okay but heats up on heavy gaming.',
  },
];

export default function ReviewsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [reviews, setReviews] = useState<ReviewCardItem[]>(MOCK_REVIEWS);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 1,
    avgRating: 2.0,
    withRating: 1,
  });

  // AlertModal State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: AlertModalType;
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const loadReviews = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetchSellerReviewsApi({
        rating: selectedFilter !== 'All' ? selectedFilter : undefined,
      });

      if (res && res.reviews && res.reviews.length > 0) {
        setReviews(
          res.reviews.map((r: any) => ({
            id: r._id || r.id,
            reviewer: r.userId?.name || r.customerName || 'Customer',
            date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Today',
            rating: r.rating || 5,
            productName: r.productId?.title || r.productName || 'Product',
            productImg:
              r.productId?.images?.[0]?.url ||
              'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=200&q=80',
            comment: r.comment || '',
            sellerReply: r.sellerReply || '',
          })),
        );
      }

      if (res.stats) {
        setStats({
          total: res.total || 0,
          avgRating: res.stats.avgRating || 0,
          withRating: res.stats.withRating || 0,
        });
      }
    } catch {
      // Keep existing
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedFilter]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const onRefresh = async () => {
    await loadReviews(true);
  };

  const filteredReviews = reviews.filter(rev => {
    if (selectedFilter === 'All') return true;
    return rev.rating.toString() === selectedFilter;
  });

  const handleReplySubmit = (id: string) => {
    if (!replyText.trim()) return;
    setReviews(prev =>
      prev.map(r => (r.id === id ? { ...r, sellerReply: replyText.trim() } : r)),
    );
    setReplyingToId(null);
    setReplyText('');
    setAlertConfig({
      visible: true,
      type: 'success',
      title: 'Reply Posted',
      message: 'Your reply has been submitted and is now published under this customer review.',
    });
  };

  const renderStars = (count: number) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map(star => (
          <Icon
            key={star}
            source={star <= count ? starFilled : starBold}
            size={14}
            color={star <= count ? '#F59E0B' : colors.textMuted}
          />
        ))}
      </View>
    );
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }>
      {/* Alert Modal */}
      <AlertModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />

      {/* Screen Title & Subtitle matching Figma */}
      <FadeUp delay={30} duration={300}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Product Reviews</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            View and manage customer reviews on your products. ({reviews.length} total)
          </Text>
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsRow}>
          {STAR_FILTERS.map(pill => {
            const isSelected = selectedFilter === pill.id;
            return (
              <Squeeze key={pill.id} onPress={() => setSelectedFilter(pill.id)}>
                <View
                  style={[
                    styles.pill,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.pillText,
                      { color: isSelected ? colors.onPrimary : colors.textMuted },
                      isSelected && { fontFamily: fonts.bold },
                    ]}>
                    {pill.label}
                  </Text>
                </View>
              </Squeeze>
            );
          })}
        </ScrollView>
      </FadeUp>

      {/* 3 Metric Stat Cards matching Figma */}
      <FadeUp delay={60} duration={300}>
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total reviews</Text>
            <Text style={[styles.statNum, { color: colors.text }]}>{stats.total}</Text>
          </View>

          <View
            style={[
              styles.statBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Average Rating</Text>
            <View style={styles.ratingValRow}>
              <Text style={[styles.statNum, { color: colors.text }]}>
                {Number(stats.avgRating).toFixed(1)}
              </Text>
              <Text style={{ color: '#F59E0B', fontSize: 16 }}>★</Text>
            </View>
          </View>

          <View
            style={[
              styles.statBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>With Rating</Text>
            <Text style={[styles.statNum, { color: colors.text }]}>{stats.withRating}</Text>
          </View>
        </View>
      </FadeUp>

      {/* Reviews List matching Figma */}
      <View style={styles.reviewsList}>
        {loading && !refreshing ? (
          <CtiLoader size="md" text="Loading reviews..." style={{ paddingVertical: 40 }} />
        ) : filteredReviews.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted }}>
              No reviews found for this rating filter.
            </Text>
          </View>
        ) : (
          filteredReviews.map((rev, idx) => (
            <FadeUp key={rev.id} delay={90 + idx * 40} duration={320}>
              <View
                style={[
                  styles.reviewCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                {/* Header: Reviewer, Stars, Date */}
                <View style={styles.cardTop}>
                  <View style={styles.reviewerInfo}>
                    <Image source={dummyProfileExtra} style={styles.avatar} />
                    <View>
                      <Text style={[styles.reviewerName, { color: colors.text }]}>
                        {rev.reviewer}
                      </Text>
                      {renderStars(rev.rating)}
                    </View>
                  </View>
                  <Text style={[styles.dateText, { color: colors.textMuted }]}>{rev.date}</Text>
                </View>

                {/* Product Reference */}
                <View
                  style={[
                    styles.productPill,
                    { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                  ]}>
                  <Image source={{ uri: rev.productImg }} style={styles.productThumb} />
                  <Text
                    style={[styles.productPillTitle, { color: colors.text }]}
                    numberOfLines={1}>
                    {rev.productName}
                  </Text>
                </View>

                {/* Comment Text */}
                <Text style={[styles.commentText, { color: colors.textMuted }]}>
                  {rev.comment}
                </Text>

                {/* Seller Reply Box if exists */}
                {rev.sellerReply && (
                  <View
                    style={[
                      styles.replyBox,
                      { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' },
                    ]}>
                    <Text style={[styles.replyAuthor, { color: colors.primary }]}>Your Reply:</Text>
                    <Text style={[styles.replyText, { color: colors.text }]}>
                      {rev.sellerReply}
                    </Text>
                  </View>
                )}

                {/* Reply Form or Trigger Button */}
                {replyingToId === rev.id ? (
                  <View style={styles.replyForm}>
                    <TextInput
                      placeholder="Write your public reply..."
                      placeholderTextColor={colors.textMuted}
                      value={replyText}
                      onChangeText={setReplyText}
                      multiline
                      style={[
                        styles.replyInput,
                        {
                          color: colors.text,
                          backgroundColor: colors.surfaceAlt,
                          borderColor: colors.border,
                        },
                      ]}
                    />
                    <View style={styles.replyActionBtns}>
                      <TouchableOpacity
                        onPress={() => {
                          setReplyingToId(null);
                          setReplyText('');
                        }}
                        style={[styles.cancelBtn, { borderColor: colors.border }]}>
                        <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>
                          Cancel
                        </Text>
                      </TouchableOpacity>
                      <Button
                        title="Submit Reply"
                        size="sm"
                        onPress={() => handleReplySubmit(rev.id)}
                      />
                    </View>
                  </View>
                ) : (
                  !rev.sellerReply && (
                    <TouchableOpacity
                      onPress={() => {
                        setReplyingToId(rev.id);
                        setReplyText('');
                      }}
                      style={styles.replyTriggerBtn}>
                      <Text style={[styles.replyTriggerText, { color: colors.primary }]}>
                        Reply to review
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </FadeUp>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  header: { gap: 4 },
  title: { fontFamily: fonts.bold, fontSize: 20 },
  subtitle: { fontFamily: fonts.regular, fontSize: 13 },

  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: { fontFamily: fonts.medium, fontSize: 13 },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  statLabel: { fontFamily: fonts.regular, fontSize: 11 },
  statNum: { fontFamily: fonts.bold, fontSize: 18 },
  ratingValRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  reviewsList: { gap: 12 },
  reviewCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reviewerInfo: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  reviewerName: { fontFamily: fonts.bold, fontSize: 14, marginBottom: 2 },
  starsRow: { flexDirection: 'row', gap: 2 },
  dateText: { fontFamily: fonts.regular, fontSize: 12 },

  productPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    maxWidth: '90%',
  },
  productThumb: { width: 22, height: 22, borderRadius: 4 },
  productPillTitle: { fontFamily: fonts.medium, fontSize: 12 },

  commentText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },

  replyBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 4,
  },
  replyAuthor: { fontFamily: fonts.bold, fontSize: 12 },
  replyText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },

  replyTriggerBtn: { alignSelf: 'flex-start', marginTop: 4 },
  replyTriggerText: { fontFamily: fonts.bold, fontSize: 13 },

  replyForm: { gap: 8, marginTop: 4 },
  replyInput: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    fontFamily: fonts.regular,
    fontSize: 13,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  replyActionBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    alignItems: 'center',
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  cancelBtnText: { fontFamily: fonts.medium, fontSize: 12 },
});
