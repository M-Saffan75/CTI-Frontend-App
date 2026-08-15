import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import { arrowRightBold, starExtra } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { RATING_DISTRIBUTION, RATING_TOTAL, REVIEWS } from '../data/reviews';

const PAGE_SIZE = 10;

function ReviewCard({ review }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.head}>
        <Image source={{ uri: review.avatar }} style={styles.avatar} />
        <View style={styles.headText}>
          <Text style={[styles.name, { color: colors.text }]}>{review.name}</Text>
          <Text style={[styles.days, { color: colors.textMuted }]}>{review.daysAgo} Days ago</Text>
        </View>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map(n => (
            <Icon key={n} source={starExtra} size={13} color={n <= review.rating ? colors.primary : colors.border} />
          ))}
        </View>
      </View>

      <View style={[styles.servicePill, { backgroundColor: colors.surfaceAlt }]}>
        <Text style={[styles.servicePillText, { color: colors.text }]}>{review.service}</Text>
      </View>

      <Text style={[styles.text, { color: colors.textMuted }]}>{review.text}</Text>

      <View style={styles.footer}>
        <View style={styles.helpfulRow}>
          <Text style={[styles.helpfulText, { color: colors.textMuted }]}>Helpful</Text>
        </View>
        <Squeeze onPress={() => {}}>
          <View style={styles.replyRow}>
            <Text style={[styles.replyText, { color: colors.primary }]}>Reply To Review</Text>
            <Icon source={arrowRightBold} size={13} color={colors.primary} />
          </View>
        </Squeeze>
      </View>
    </View>
  );
}

export default function ReviewsContent() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(PAGE_SIZE);

  const shown = REVIEWS.slice(0, visible);

  return (
      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>Reviews</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Track your client feedback and ratings</Text>

        <FadeUp delay={60} duration={450}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.distributionTitle, { color: colors.text }]}>Rating Distribution</Text>
            <Text style={[styles.distributionSubtitle, { color: colors.textMuted }]}>
              Breakdown of ratings from {RATING_TOTAL} verified customers
            </Text>

            {RATING_DISTRIBUTION.map(row => (
              <View key={row.stars} style={styles.distributionRow}>
                <Text style={[styles.distributionStars, { color: colors.textMuted }]}>{row.stars}</Text>
                <Icon source={starExtra} size={13} color={colors.primary} />
                <View style={[styles.distributionTrack, { backgroundColor: colors.border }]}>
                  <View
                    style={[styles.distributionFill, { backgroundColor: colors.primary, width: `${row.percent}%` }]}
                  />
                </View>
                <Text style={[styles.distributionCount, { color: colors.textMuted }]}>
                  {row.count} ({row.percent}%)
                </Text>
              </View>
            ))}
          </View>
        </FadeUp>

        <View style={styles.reviewsHead}>
          <Text style={[styles.reviewsTitle, { color: colors.text }]}>Recent Client Reviews</Text>
          <Text style={[styles.reviewsCount, { color: colors.textMuted }]}>
            Showing {shown.length} of {REVIEWS.length} reviews
          </Text>
        </View>

        <View style={styles.list}>
          {shown.map((review, index) => (
            <FadeUp key={review.id} delay={60 + index * 50} duration={450}>
              <ReviewCard review={review} />
            </FadeUp>
          ))}
        </View>

        {visible < REVIEWS.length && (
          <Button
            title="View All Reviews"
            variant="soft"
            onPress={() => setVisible(current => Math.min(current + PAGE_SIZE, REVIEWS.length))}
            style={styles.viewAll}
          />
        )}
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 20, paddingTop: 16 },
  title: { fontFamily: fonts.bold, fontSize: 24 },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },

  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 16 },
  distributionTitle: { fontFamily: fonts.bold, fontSize: 16 },
  distributionSubtitle: { fontFamily: fonts.regular, fontSize: 12, marginTop: 4, marginBottom: 14 },
  distributionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  distributionStars: { fontFamily: fonts.regular, fontSize: 12, width: 10 },
  distributionTrack: { flex: 1, height: 6, borderRadius: 3 },
  distributionFill: { height: 6, borderRadius: 3 },
  distributionCount: { fontFamily: fonts.regular, fontSize: 12, width: 60, textAlign: 'right' },

  reviewsHead: { marginTop: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  reviewsTitle: { fontFamily: fonts.bold, fontSize: 17 },
  reviewsCount: { fontFamily: fonts.regular, fontSize: 12 },

  list: { marginTop: 12, gap: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  headText: { flex: 1 },
  name: { fontFamily: fonts.bold, fontSize: 14 },
  days: { fontFamily: fonts.regular, fontSize: 11, marginTop: 1 },
  stars: { flexDirection: 'row', gap: 2 },

  servicePill: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginTop: 10 },
  servicePillText: { fontFamily: fonts.medium, fontSize: 11 },
  text: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, marginTop: 10 },

  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  helpfulRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  helpfulText: { fontFamily: fonts.regular, fontSize: 12 },
  replyRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  replyText: { fontFamily: fonts.bold, fontSize: 12 },

  viewAll: { marginTop: 18 },
});
