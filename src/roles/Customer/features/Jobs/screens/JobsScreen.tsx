import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import {
  calendarBold,
  checkCircleBold,
  chevronDownBold,
  clockBold,
  exclamationCircleBold,
  inboxBold,
  menuBold,
  plusSquareBold,
  searchBold,
  settingsBold,
  shoppingCartExtra,
  starBold,
  starExtra,
  toolExtra,
  userBold,
} from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { badges, palette } from '@/theme/colors';
import { fonts } from '@/theme/fonts';
import { JOBS, REVIEWS } from '../data/jobs';

const PAGE_SIZE = 6;
const DESCRIPTION_PREVIEW = 120;

// The Figma file reused one icon everywhere as a placeholder ("put an icon
// here") — these are picked per tab instead of copying that.
const TABS = [
  { key: 'all', label: 'All Jobs', icon: menuBold },
  { key: 'open', label: 'Open', icon: clockBold },
  { key: 'offer_received', label: 'Offer Recived', icon: inboxBold },
  { key: 'booked', label: 'Booked', icon: calendarBold },
  { key: 'in_progress', label: 'In Progress', icon: settingsBold },
  { key: 'completed', label: 'Completed', icon: checkCircleBold },
  { key: 'disputed', label: 'Disputed', icon: exclamationCircleBold },
  { key: 'reviews', label: 'Reviews', icon: starBold },
];

const formatPrice = (min, max) => {
  const one = n => `TRY ${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  return min === max ? one(min) : `${one(min)} - ${one(max)}`;
};

function StatusPill({ label, badge, style = null }) {
  return (
    <View style={[styles.pill, { backgroundColor: badge.bg }, style]}>
      <Text style={[styles.pillText, { color: badge.text }]}>{label}</Text>
    </View>
  );
}

function JobCard({ job, onPress }) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const tagBadge = job.tag === 'job_posting' ? badges.booked : badges.inProgress;
  const tagLabel = job.tag === 'job_posting' ? 'Job Posting' : 'Direct Message';
  const offerBadge = job.offerLabel === 'Confirmed' ? badges.pending : badges.dispute;

  return (
    <Squeeze
      onPress={onPress}
      scale={0.98}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHead}>
        <Text style={[styles.device, { color: colors.text }]}>{job.device}</Text>
        <Text style={[styles.price, { color: colors.text }]}>
          {formatPrice(job.priceMin, job.priceMax)}
        </Text>
      </View>

      <StatusPill label={tagLabel} badge={tagBadge} style={styles.tag} />

      {job.description && (
        <>
          <Text
            style={[styles.description, { color: colors.textMuted }]}
            numberOfLines={expanded ? undefined : 3}>
            {job.description}
          </Text>
          {job.description.length > DESCRIPTION_PREVIEW && (
            <Pressable onPress={() => setExpanded(!expanded)} hitSlop={6}>
              <Text style={[styles.seeMore, { color: colors.primary }]}>
                {expanded ? 'See less' : 'See more'}
              </Text>
            </Pressable>
          )}
        </>
      )}

      <Text style={[styles.servicesLabel, { color: colors.text }]}>Required Services</Text>
      <View style={styles.services}>
        {job.requiredServices.map(service => (
          <View key={service} style={[styles.servicePill, { borderColor: palette.rust }]}>
            <Text style={[styles.servicePillText, { color: palette.rust }]}>{service}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.footer}>
        <StatusPill label={job.offerLabel} badge={offerBadge} />

        {job.assignedTo ? (
          <View style={styles.assignee}>
            <View style={[styles.avatarDot, { backgroundColor: colors.surfaceAlt }]}>
              <Icon source={userBold} size={12} color={colors.textMuted} />
            </View>
            <Text style={[styles.assigneeText, { color: colors.textMuted }]}>
              {job.assignedTo}
            </Text>
          </View>
        ) : job.expiresAt ? (
          <View style={styles.expiry}>
            <Icon source={clockBold} size={13} color={colors.textMuted} />
            <Text style={[styles.expiryText, { color: colors.textMuted }]}>
              Expires: {job.expiresAt}
            </Text>
          </View>
        ) : null}
      </View>
    </Squeeze>
  );
}

function ReviewCard({ item }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.reviewHead}>
        <View style={styles.reviewHeadText}>
          <Text style={[styles.device, { color: colors.text }]}>{item.device}</Text>
          <View style={styles.reviewMeta}>
            <Icon source={calendarBold} size={13} color={colors.textMuted} />
            <Text style={[styles.reviewMetaText, { color: colors.textMuted }]}>
              Completed {item.completedDate}
            </Text>
          </View>
        </View>
        <StatusPill label="Completed" badge={badges.completed} />
      </View>

      <StatusPill label="Job posting" badge={badges.booked} style={styles.tag} />

      <View style={[styles.repairmanRow, { backgroundColor: colors.surfaceAlt }]}>
        <View style={[styles.avatarDot, { backgroundColor: colors.background }]}>
          <Icon source={userBold} size={16} color={colors.textMuted} />
        </View>
        <View style={styles.repairmanText}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{item.repairman}</Text>
          <Text style={[styles.reviewMetaText, { color: colors.textMuted }]}>{item.shop}</Text>
        </View>
        <View style={styles.repairmanPrice}>
          <Text style={[styles.price, { color: colors.text }]}>
            TRY {item.amountPaid.toLocaleString('en-US')}
          </Text>
          <Text style={[styles.reviewMetaText, { color: colors.textMuted }]}>Total paid</Text>
        </View>
      </View>

      {item.review ? (
        <View style={[styles.reviewDone, { borderColor: colors.border }]}>
          <View style={styles.reviewHead}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Your Review</Text>
            <Text style={[styles.reviewMetaText, { color: colors.textMuted }]}>
              {item.review.submittedAt}
            </Text>
          </View>

          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map(n => (
              <Icon
                key={n}
                source={starExtra}
                size={16}
                color={n <= item.review.rating ? colors.primary : colors.border}
              />
            ))}
            <Text style={[styles.reviewMetaText, { color: colors.textMuted }]}>
              {item.review.rating} out of 5
            </Text>
          </View>

          <View style={styles.submittedRow}>
            <Icon source={checkCircleBold} size={14} color={colors.success} />
            <Text style={[styles.submittedText, { color: colors.success }]}>
              Review submitted successfully
            </Text>
          </View>
        </View>
      ) : (
        <Button
          title="Write a Review for this Job"
          icon={starExtra}
          iconPosition="left"
          size="md"
          style={styles.reviewButton}
        />
      )}
    </View>
  );
}

function EmptyState({ label }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Icon source={toolExtra} size={30} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No {label ? `${label} ` : ''}jobs found
      </Text>
      <Text style={[styles.emptyText, { color: colors.textMuted }]}>
        Try adjusting your search or switching to a different tab.
      </Text>
    </View>
  );
}

export default function JobsScreen({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [activeTab, search]);

  const query = search.trim().toLowerCase();
  const matches = device => !query || device.toLowerCase().includes(query);

  if (activeTab === 'reviews') {
    const reviews = REVIEWS.filter(item => matches(item.device));

    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <Header navigation={navigation} />

        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <Title />
          <TabsRow activeTab={activeTab} onChange={setActiveTab} />
          <SearchBar value={search} onChangeText={setSearch} />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Review Completed Jobs</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
            Share your experience and help other customers
          </Text>

          {reviews.length === 0 ? (
            <EmptyState label="review" />
          ) : (
            reviews.map((item, index) => (
              <FadeUp key={item.id} delay={80 + index * 60} duration={500} style={styles.cardWrap}>
                <ReviewCard item={item} />
              </FadeUp>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  const filtered = JOBS.filter(
    job => (activeTab === 'all' || job.status === activeTab) && matches(job.device),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const isEmpty = filtered.length === 0;
  const tabLabel = TABS.find(tab => tab.key === activeTab)?.label.toLowerCase();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Header navigation={navigation} />

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <Title />
        <TabsRow activeTab={activeTab} onChange={setActiveTab} />
        <SearchBar value={search} onChangeText={setSearch} />

        {!isEmpty && (
          <View style={styles.metaRow}>
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              Showing {(page - 1) * PAGE_SIZE + 1} to{' '}
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} jobs
            </Text>
            <View style={styles.perPage}>
              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                Jobs per page: {PAGE_SIZE}
              </Text>
              <Icon source={chevronDownBold} size={12} color={colors.textMuted} />
            </View>
          </View>
        )}

        {isEmpty ? (
          <>
            <EmptyState label={activeTab === 'all' ? '' : tabLabel} />
            <Text style={[styles.helperText, { color: colors.textMuted }]}>
              If you want to upload a new request then you can do it from the website
            </Text>
          </>
        ) : (
          <>
            {pageItems.map((job, index) => (
              <FadeUp key={job.id} delay={80 + index * 60} duration={500} style={styles.cardWrap}>
                <JobCard
                  job={job}
                  onPress={() =>
                    navigation.navigate(
                      job.status === 'disputed' ? 'DisputeDetail' : 'RepairDetail',
                      { jobId: job.id },
                    )
                  }
                />
              </FadeUp>
            ))}

            {totalPages > 1 && (
              <View style={styles.pagination}>
                <Squeeze onPress={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <Text
                    style={[
                      styles.pageNav,
                      { color: page === 1 ? colors.border : colors.text },
                    ]}>
                    Previous
                  </Text>
                </Squeeze>

                {Array.from({ length: totalPages }).map((_, index) => {
                  const number = index + 1;
                  const active = number === page;
                  return (
                    <Squeeze key={number} onPress={() => setPage(number)}>
                      <View
                        style={[
                          styles.pageDot,
                          active && { backgroundColor: colors.primary },
                        ]}>
                        <Text
                          style={[
                            styles.pageDotText,
                            { color: active ? colors.onPrimary : colors.text },
                          ]}>
                          {number}
                        </Text>
                      </View>
                    </Squeeze>
                  );
                })}

                <Squeeze
                  onPress={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}>
                  <Text
                    style={[
                      styles.pageNav,
                      { color: page === totalPages ? colors.border : colors.text },
                    ]}>
                    Next
                  </Text>
                </Squeeze>
              </View>
            )}
          </>
        )}

        <Button
          title="New repair request"
          icon={plusSquareBold}
          iconPosition="left"
          size="lg"
          style={styles.newRequest}
        />
      </ScrollView>
    </View>
  );
}

function Header({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <Image source={ctiLogo} resizeMode="contain" style={styles.logo} />

      <View style={styles.headerIcons}>
        <Icon source={shoppingCartExtra} size={24} color={colors.text} />
        <Squeeze onPress={() => navigation.navigate('Settings')} scale={0.85}>
          <Icon source={menuBold} size={24} color={colors.text} />
        </Squeeze>
      </View>
    </View>
  );
}

function Title() {
  const { colors } = useTheme();

  return (
    <>
      <Text style={[styles.title, { color: colors.text }]}>My Repair Jobs</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Manage and track your device repair requests
      </Text>
    </>
  );
}

function TabsRow({ activeTab, onChange }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.tabsWrap, { borderColor: colors.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        {TABS.map(tab => {
          const active = tab.key === activeTab;

          return (
            <Squeeze key={tab.key} onPress={() => onChange(tab.key)}>
              <View style={[styles.tab, active && { borderBottomColor: colors.primary }]}>
                <Icon source={tab.icon} size={16} color={active ? colors.primary : colors.textMuted} />
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: active ? colors.primary : colors.textMuted,
                      fontFamily: active ? fonts.bold : fonts.regular,
                    },
                  ]}>
                  {tab.label}
                </Text>
              </View>
            </Squeeze>
          );
        })}
      </ScrollView>
    </View>
  );
}

function SearchBar({ value, onChangeText }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.search, { borderColor: colors.border }]}>
      <Icon source={searchBold} size={20} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search by brand, service, location, color..."
        placeholderTextColor={colors.textMuted}
        style={[styles.searchInput, { color: colors.text }]}
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
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  logo: { width: 110, height: 59 },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 18 },

  body: { paddingHorizontal: 20 },
  title: { fontFamily: fonts.bold, fontSize: 26, marginTop: 6 },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },

  tabsWrap: { borderBottomWidth: 1, marginTop: 18 },
  tabsScroll: { flexGrow: 0 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: { fontSize: 13 },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 13, padding: 0 },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  metaText: { fontFamily: fonts.regular, fontSize: 12 },
  perPage: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  cardWrap: { marginTop: 14 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  device: { flex: 1, fontFamily: fonts.bold, fontSize: 15, lineHeight: 20 },
  price: { fontFamily: fonts.bold, fontSize: 13 },

  pill: { alignSelf: 'flex-start', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  pillText: { fontFamily: fonts.bold, fontSize: 11 },
  tag: { marginTop: 10 },

  description: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, marginTop: 12 },
  seeMore: { fontFamily: fonts.bold, fontSize: 12, marginTop: 4 },

  servicesLabel: { fontFamily: fonts.bold, fontSize: 13, marginTop: 14 },
  services: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  servicePill: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  servicePillText: { fontFamily: fonts.regular, fontSize: 12 },

  divider: { height: 1, marginTop: 16, marginBottom: 12 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  assignee: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatarDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  assigneeText: { fontFamily: fonts.regular, fontSize: 12 },

  expiry: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  expiryText: { fontFamily: fonts.regular, fontSize: 12 },

  empty: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 34,
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 6,
  },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 15, marginTop: 6 },
  emptyText: { fontFamily: fonts.regular, fontSize: 13, textAlign: 'center' },

  helperText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
  newRequest: { marginTop: 18 },

  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 20 },
  pageNav: { fontFamily: fonts.regular, fontSize: 13 },
  pageDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pageDotText: { fontFamily: fonts.bold, fontSize: 12 },

  sectionTitle: { fontFamily: fonts.bold, fontSize: 18, marginTop: 20 },
  sectionSubtitle: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },

  reviewHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  reviewHeadText: { flex: 1, gap: 4 },
  reviewMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  reviewMetaText: { fontFamily: fonts.regular, fontSize: 12 },

  reviewButton: { marginTop: 14 },
  repairmanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    padding: 10,
    marginTop: 14,
  },
  repairmanText: { flex: 1, gap: 2 },
  repairmanPrice: { alignItems: 'flex-end', gap: 2 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 14 },

  reviewDone: { borderTopWidth: 1, marginTop: 14, paddingTop: 14, gap: 10 },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  submittedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  submittedText: { fontFamily: fonts.regular, fontSize: 12 },
});
