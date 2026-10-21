import { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import { starBold, starFilled } from '@/assets/icons';
import { dummyProfileExtra } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

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

  const filteredReviews = reviews.filter(rev => {
    if (selectedFilter === 'All') return true;
    return rev.rating.toString() === selectedFilter;
  });

  const handleReplySubmit = (id: string) => {
    if (!replyText.trim()) return;
    setReviews(prev =>
      prev.map(r => (r.id === id ? { ...r, sellerReply: replyText.trim() } : r))
    );
    setReplyingToId(null);
    setReplyText('');
    Alert.alert('Reply Posted', 'Your reply is now visible under this review.');
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
      showsVerticalScrollIndicator={false}>
      {/* Top Header matching REview screen.png */}
      <FadeUp delay={30} duration={300}>
        <View style={styles.topSection}>
          <Text style={[styles.mainTitle, { color: colors.text }]}>Product Reviews</Text>
          <Text style={[styles.mainSub, { color: colors.textMuted }]}>
            View and manage customer reviews on your products. ({reviews.length} total)
          </Text>
        </View>

        {/* Filter Pills: All, 5, 4, 3, 2, 1 matching Figma */}
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

      {/* 3 Metric Stat Cards matching Figma: Total reviews, Average Rating, With Rating */}
      <FadeUp delay={60} duration={300}>
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total reviews</Text>
            <Text style={[styles.statNum, { color: colors.text }]}>1</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Average Rating</Text>
            <View style={styles.ratingValRow}>
              <Text style={[styles.statNum, { color: colors.text }]}>2.0</Text>
              <Text style={{ color: '#F59E0B', fontSize: 16 }}>★</Text>
            </View>
          </View>

          <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>With Rating</Text>
            <Text style={[styles.statNum, { color: colors.text }]}>1</Text>
          </View>
        </View>
      </FadeUp>

      {/* Reviews List matching Figma */}
      <View style={styles.reviewsList}>
        {filteredReviews.map((rev, idx) => (
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
                    <Text style={[styles.reviewDate, { color: colors.textMuted }]}>
                      {rev.date}
                    </Text>
                  </View>
                </View>
                {renderStars(rev.rating)}
              </View>

              {/* Product Info Row */}
              <View style={[styles.productBanner, { backgroundColor: colors.surfaceAlt }]}>
                <Image source={{ uri: rev.productImg }} style={styles.productThumb} />
                <Text style={[styles.productName, { color: colors.text }]}>{rev.productName}</Text>
              </View>

              {/* Review Comment */}
              <Text style={[styles.commentText, { color: colors.text }]}>{rev.comment}</Text>

              {/* Existing Seller Reply */}
              {rev.sellerReply && (
                <View
                  style={[
                    styles.sellerReplyBox,
                    { backgroundColor: colors.primary + '10', borderColor: colors.primary },
                  ]}>
                  <Text style={[styles.sellerReplyTitle, { color: colors.primary }]}>
                    Your Reply:
                  </Text>
                  <Text style={[styles.sellerReplyText, { color: colors.text }]}>
                    {rev.sellerReply}
                  </Text>
                </View>
              )}

              {/* Reply Button or Input */}
              {!rev.sellerReply && (
                <View style={{ marginTop: 4 }}>
                  {replyingToId === rev.id ? (
                    <View style={styles.replyInputBox}>
                      <TextInput
                        style={[
                          styles.replyInput,
                          {
                            borderColor: colors.border,
                            color: colors.text,
                            backgroundColor: colors.surfaceAlt,
                          },
                        ]}
                        placeholder="Write a public response to this review..."
                        placeholderTextColor={colors.textMuted}
                        value={replyText}
                        onChangeText={setReplyText}
                        multiline
                      />
                      <View style={styles.replyActionsRow}>
                        <Button
                          title="Send Reply"
                          variant="primary"
                          size="sm"
                          onPress={() => handleReplySubmit(rev.id)}
                        />
                        <Button
                          title="Cancel"
                          variant="outline"
                          size="sm"
                          onPress={() => setReplyingToId(null)}
                        />
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => setReplyingToId(rev.id)}
                      style={[
                        styles.replyTriggerBtn,
                        { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
                      ]}>
                      <Text style={[styles.replyTriggerText, { color: colors.primary }]}>
                        Reply to Review
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </FadeUp>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 14 },
  topSection: { gap: 4 },
  mainTitle: { fontFamily: fonts.bold, fontSize: 22 },
  mainSub: { fontFamily: fonts.regular, fontSize: 13 },

  filterPillsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: { fontFamily: fonts.medium, fontSize: 13 },

  statsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  statBox: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: { fontFamily: fonts.regular, fontSize: 11 },
  statNum: { fontFamily: fonts.bold, fontSize: 18 },
  ratingValRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  reviewsList: { gap: 12, marginTop: 4 },
  reviewCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewerInfo: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  reviewerName: { fontFamily: fonts.bold, fontSize: 14 },
  reviewDate: { fontFamily: fonts.regular, fontSize: 11, marginTop: 2 },
  starsRow: { flexDirection: 'row', gap: 2 },

  productBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    padding: 8,
  },
  productThumb: { width: 32, height: 32, borderRadius: 6 },
  productName: { fontFamily: fonts.medium, fontSize: 13 },

  commentText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },

  sellerReplyBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 4,
  },
  sellerReplyTitle: { fontFamily: fonts.bold, fontSize: 12 },
  sellerReplyText: { fontFamily: fonts.regular, fontSize: 12 },

  replyTriggerBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  replyTriggerText: { fontFamily: fonts.medium, fontSize: 12 },
  replyInputBox: { gap: 8 },
  replyInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    fontFamily: fonts.regular,
    fontSize: 13,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  replyActionsRow: { flexDirection: 'row', gap: 8 },
});
