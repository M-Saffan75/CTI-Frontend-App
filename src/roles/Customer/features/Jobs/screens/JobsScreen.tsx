import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import Squeeze from '@/components/Squeeze';
import CtiLoader from '@/components/CtiLoader';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import { FadeUp } from '@/animations';
import {
  calendarBold,
  checkCircleIcon,
  clockBold,
  exclamationCircleBold,
  inboxBold,
  menuBold,
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
import customerJobApi, { MobileCustomerJob } from '../services/customerJobApi';
import { useCart } from '@/roles/Customer/context/CartContext';
import WriteReviewModal, { ReviewTargetJob } from '@/components/modals/WriteReviewModal';
import { WEB_ADD_JOB_URL } from '@/constants/config';

const PAGE_SIZE = 6;
const DESCRIPTION_PREVIEW = 120;

// Tabs aligned with Next.js web application (/my-account)
const TABS = [
  { key: 'all', label: 'All Jobs', icon: menuBold },
  { key: 'open', label: 'Open', icon: clockBold },
  { key: 'offers_received', label: 'Offer Received', icon: inboxBold },
  { key: 'booked', label: 'Booked', icon: calendarBold },
  { key: 'in_progress', label: 'In Progress', icon: settingsBold },
  { key: 'completed', label: 'Completed', icon: checkCircleIcon },
  { key: 'disputed', label: 'Disputed', icon: exclamationCircleBold },
  { key: 'reviews', label: 'Reviews', icon: starBold },
];

const formatPrice = (min?: number, max?: number) => {
  const safeMin = Number(min || 0);
  const safeMax = Number(max || 0);
  if (safeMin === 0 && safeMax === 0) return 'Price on inquiry';
  const one = (n: number) => `TRY ${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  return safeMin === safeMax ? one(safeMin) : `${one(safeMin)} - ${one(safeMax)}`;
};

function StatusPill({ label, badge, style = null }) {
  return (
    <View style={[styles.pill, { backgroundColor: badge.bg }, style]}>
      <Text style={[styles.pillText, { color: badge.text }]}>{label}</Text>
    </View>
  );
}

function JobCard({
  job,
  onPress,
}: {
  job: any;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const tagBadge = job.tag === 'job_posting' ? badges.booked : badges.inProgress;
  const tagLabel = job.tag === 'job_posting' ? 'Job Posting' : 'Direct Message';
  const offerBadge = job.offerLabel === 'Confirmed' ? badges.accepted : badges.pending;

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
        {(job.requiredServices || job.services || ['Diagnostics & Repair']).map(service => (
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
            <View
              style={[
                styles.avatarDot,
                {
                  backgroundColor: colors.surfaceAlt,
                  borderWidth: 1,
                  borderColor: colors.avatarBorder,
                },
              ]}>
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

function ReviewCard({
  item,
  onWriteReview,
}: {
  item: any;
  onWriteReview?: (item: any) => void;
}) {
  const { colors } = useTheme();

  const device = item.jobId?.title || item.device || 'Device Repair';
  const completedDate = item.completedAt
    ? new Date(item.completedAt).toLocaleDateString()
    : item.date || item.completedDate || 'Recently';
  const repairmanName =
    item.repairmanId?.name || item.assignedTo || item.repairman || 'Technician';
  const shopName =
    item.repairmanId?.repairmanProfile?.shopName || item.shop || 'Certified Service Center';
  const amountPaid = Number(
    item.pricing?.totalAmount || item.amountPaid || item.priceMin || 0,
  );
  const review = item.review;
  const rating = Number(review?.overallRating || review?.rating || 0);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.reviewHead}>
        <View style={styles.reviewHeadText}>
          <Text style={[styles.device, { color: colors.text }]}>{device}</Text>
          <View style={styles.reviewMeta}>
            <Icon source={calendarBold} size={13} color={colors.textMuted} />
            <Text style={[styles.reviewMetaText, { color: colors.textMuted }]}>
              Completed {completedDate}
            </Text>
          </View>
        </View>
        <StatusPill label="Completed" badge={badges.completed} />
      </View>

      <StatusPill label="Job posting" badge={badges.booked} style={styles.tag} />

      <View style={[styles.repairmanRow, { backgroundColor: colors.surfaceAlt }]}>
        <View
          style={[
            styles.avatarDot,
            {
              backgroundColor: colors.background,
              borderWidth: 1,
              borderColor: colors.avatarBorder,
            },
          ]}>
          <Icon source={userBold} size={16} color={colors.textMuted} />
        </View>
        <View style={styles.repairmanText}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{repairmanName}</Text>
          <Text style={[styles.reviewMetaText, { color: colors.textMuted }]}>{shopName}</Text>
        </View>
        <View style={styles.repairmanPrice}>
          <Text style={[styles.price, { color: colors.text }]}>
            TRY {amountPaid.toLocaleString('en-US')}
          </Text>
          <Text style={[styles.reviewMetaText, { color: colors.textMuted }]}>Total paid</Text>
        </View>
      </View>

      {review ? (
        <View style={[styles.reviewDone, { borderColor: colors.border }]}>
          <View style={styles.reviewHead}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Your Review</Text>
            {Boolean(review.createdAt || review.submittedAt) && (
              <Text style={[styles.reviewMetaText, { color: colors.textMuted }]}>
                {new Date(review.createdAt || review.submittedAt).toLocaleDateString()}
              </Text>
            )}
          </View>

          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map(n => (
              <Icon
                key={n}
                source={starExtra}
                size={16}
                color={n <= rating ? colors.primary : colors.border}
              />
            ))}
            <Text style={[styles.reviewMetaText, { color: colors.textMuted }]}>
              {rating} out of 5
            </Text>
          </View>

          {Boolean(review.reviewText) && (
            <Text style={[styles.description, { color: colors.textMuted, marginTop: 6 }]}>
              "{review.reviewText}"
            </Text>
          )}

          <View style={styles.submittedRow}>
            <Icon source={checkCircleIcon} size={14} color={colors.success} />
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
          onPress={() => onWriteReview?.(item)}
          style={styles.reviewButton}
        />
      )}
    </View>
  );
}

function EmptyState({
  activeTab,
  onAction,
}: {
  activeTab: string;
  onAction?: () => void;
}) {
  const { colors } = useTheme();

  const getEmptyDetails = () => {
    switch (activeTab) {
      case 'open':
        return {
          title: 'No Open Repair Requests',
          desc: 'Open jobs are requests you have posted that are waiting for offers from certified repair technicians.',
          btnText: 'Find Expert Repairmen',
        };
      case 'offers_received':
      case 'offer_received':
        return {
          title: 'No Offers Received Yet',
          desc: 'When technicians send quotes for your open repair jobs, they will appear here so you can compare and accept.',
          btnText: 'Explore Repair Services',
        };
      case 'booked':
        return {
          title: 'No Booked Repairs',
          desc: 'Repairs where you have accepted an offer and scheduled a technician will be listed here.',
          btnText: 'Find Expert Repairmen',
        };
      case 'in_progress':
        return {
          title: 'No Repairs In Progress',
          desc: 'Devices currently being diagnosed or repaired by technicians appear here.',
          btnText: undefined,
        };
      case 'completed':
        return {
          title: 'No Completed Repairs',
          desc: 'Repairs that have been successfully finished and delivered will appear here.',
          btnText: undefined,
        };
      case 'disputed':
        return {
          title: 'No Disputed Jobs',
          desc: 'Any jobs with active dispute cases or mediation will appear here.',
          btnText: undefined,
        };
      case 'reviews':
        return {
          title: 'No Reviews Pending',
          desc: 'Completed jobs eligible for feedback and ratings will appear here.',
          btnText: undefined,
        };
      default:
        return {
          title: 'No Repair Jobs Found',
          desc: 'Try adjusting your search or switching to a different tab.',
          btnText: 'Explore Repair Services',
        };
    }
  };

  const details = getEmptyDetails();

  return (
    <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Icon source={toolExtra} size={34} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{details.title}</Text>
      <Text style={[styles.emptyText, { color: colors.textMuted }]}>{details.desc}</Text>
      {details.btnText && (
        <Button
          title={details.btnText}
          size="sm"
          onPress={onAction}
          style={{ marginTop: 14, minWidth: 180 }}
        />
      )}
    </View>
  );
}

export default function JobsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [jobs, setJobs] = useState<MobileCustomerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Review & Dispute Modal States
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [targetJobForReview, setTargetJobForReview] = useState<ReviewTargetJob | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Record<string, any>>({});
  const [completedReviewJobs, setCompletedReviewJobs] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Themed AlertModal State (Replaces native Alert)
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: AlertModalType;
    title: string;
    message: string;
    buttonText?: string;
    secondaryButtonText?: string;
    onButtonPress?: () => void;
    onSecondaryButtonPress?: () => void;
    onOk?: () => void;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const handleOpenNewJobRequestModal = () => {
    setAlertConfig({
      visible: true,
      type: 'info',
      title: 'New Job Request',
      message: `To submit a new repair job request with diagnostic requirements and receive bids from certified technicians, please visit our web portal:\n\n${WEB_ADD_JOB_URL}`,
      buttonText: 'Open Web Portal',
      secondaryButtonText: 'Close',
      onButtonPress: async () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
        try {
          await Linking.openURL(WEB_ADD_JOB_URL);
        } catch {
          setAlertConfig({
            visible: true,
            type: 'info',
            title: 'Web Portal Link',
            message: WEB_ADD_JOB_URL,
            buttonText: 'Okay',
          });
        }
      },
      onSecondaryButtonPress: () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
      },
    });
  };

  const fetchReviewJobs = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const list = await customerJobApi.getCompletedJobsForReview();
      setCompletedReviewJobs(list);
    } catch {
      setCompletedReviewJobs([]);
    } finally {
      setLoadingReviews(false);
    }
  }, []);

  useEffect(() => {
    fetchReviewJobs();
  }, [fetchReviewJobs]);

  const handleOpenReviewModal = async (item: any) => {
    // Sourced from /reviews/my-completed-jobs: item._id is the RepairBooking._id
    // If sourced from job with active booking: item.bookingId or item.booking?._id
    let bookingId =
      item.bookingId ||
      item.booking?._id ||
      item.booking?.id ||
      (item.jobId ? item._id : undefined);

    let jobId =
      item.jobId?._id ||
      item.jobId ||
      (item.booking ? item._id : undefined) ||
      item.id ||
      item.raw?.jobId;

    let repairmanId =
      typeof item.repairmanId === 'object' && item.repairmanId !== null
        ? item.repairmanId._id || item.repairmanId.id
        : item.repairmanId || item.raw?.repairmanId || item.raw?.selectedOffer?.repairmanId;

    let repairmanName =
      item.repairmanId?.name || item.assignedTo || 'Technician';
    let repairmanAvatar =
      item.repairmanId?.avatar || item.repairmanId?.profilePhoto || null;
    let deviceTitle = item.jobId?.title || item.device || 'Device Repair';

    // Fallback: fetch detail if bookingId or repairmanId is missing on list item
    if ((!bookingId || !repairmanId) && item.id) {
      try {
        const full = await customerJobApi.getMyJobDetail(item.id);
        if (full?.booking) {
          bookingId = full.booking._id || full.booking.id;
          repairmanId =
            full.repairman?.id ||
            full.booking.repairmanId?._id ||
            full.booking.repairmanId ||
            repairmanId;
          repairmanName = full.repairman?.name || repairmanName;
          repairmanAvatar = full.repairman?.avatar || repairmanAvatar;
          deviceTitle = full.title || deviceTitle;
        }
      } catch {}
    }

    if (!bookingId || !repairmanId) {
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Notice',
        message: 'Booking details are incomplete for writing a review.',
      });
      return;
    }

    setTargetJobForReview({
      bookingId: String(bookingId),
      jobId: jobId ? String(jobId) : undefined,
      repairmanId: String(repairmanId),
      repairmanName,
      repairmanAvatar,
      deviceTitle,
    });
    setReviewModalVisible(true);
  };

  const handleSubmitReview = async (reviewData: {
    bookingId: string;
    jobId?: string;
    repairmanId: string;
    overallRating: number;
    reviewText: string;
  }) => {
    try {
      setIsSubmittingReview(true);
      const res = await customerJobApi.createReview(reviewData);
      setReviewModalVisible(false);
      setReviewedBookingIds(prev => ({
        ...prev,
        [reviewData.bookingId]: {
          overallRating: reviewData.overallRating,
          reviewText: reviewData.reviewText,
          createdAt: new Date().toISOString(),
        },
      }));
      setCompletedReviewJobs(prev =>
        prev.map(j => {
          if (String(j._id || j.id || j.bookingId) === reviewData.bookingId) {
            return {
              ...j,
              review: {
                overallRating: reviewData.overallRating,
                reviewText: reviewData.reviewText,
                createdAt: new Date().toISOString(),
              },
            };
          }
          return j;
        }),
      );
      setAlertConfig({
        visible: true,
        type: 'success',
        title: 'Review Submitted',
        message: res.message || 'Review submitted successfully!',
      });
      fetchJobs(true);
      fetchReviewJobs();
    } catch (err: any) {
      setAlertConfig({
        visible: true,
        type: 'error',
        title: 'Submission Error',
        message: err?.message || 'Failed to submit review',
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const fetchJobs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await customerJobApi.getMyJobs();
      setJobs(data);
    } catch (err) {
      if (__DEV__) console.warn('Failed to fetch customer jobs:', err);
      setJobs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => setPage(1), [activeTab, search]);

  const onRefresh = () => {
    fetchJobs(true);
  };

  const query = search.trim().toLowerCase();
  const matches = (job: MobileCustomerJob) => {
    if (!query) return true;
    const device = (job.device || '').toLowerCase();
    const desc = (job.description || '').toLowerCase();
    const assigned = (job.assignedTo || '').toLowerCase();
    const services = (job.services || []).join(' ').toLowerCase();
    return (
      device.includes(query) ||
      desc.includes(query) ||
      assigned.includes(query) ||
      services.includes(query)
    );
  };

  const jobCounts: Record<string, number> = {
    all: jobs.length,
    open: jobs.filter(j => j.status === 'open').length,
    offers_received: jobs.filter(
      j =>
        j.status === 'offers_received' ||
        j.status === 'offer_received' ||
        (j.status === 'open' && j.offersCount > 0),
    ).length,
    booked: jobs.filter(
      j => j.status === 'booked' || j.status === 'confirmed' || j.status === 'scheduled',
    ).length,
    in_progress: jobs.filter(
      j => j.status === 'in_progress' || j.status === 'parts_needed' || j.status === 'quality_check',
    ).length,
    completed: jobs.filter(
      j => j.status === 'completed' || j.status === 'delivered' || j.status === 'closed',
    ).length,
    disputed: jobs.filter(j => j.status === 'disputed').length,
    reviews: completedReviewJobs.length,
  };

  if (activeTab === 'reviews') {
    const listToRender = completedReviewJobs.filter(item => {
      if (!query) return true;
      const device = (item.jobId?.title || item.device || '').toLowerCase();
      const assigned = (item.repairmanId?.name || item.assignedTo || '').toLowerCase();
      const services = (item.services || []).join(' ').toLowerCase();
      return device.includes(query) || assigned.includes(query) || services.includes(query);
    });

    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <Header navigation={navigation} />

        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing || loadingReviews}
              onRefresh={() => {
                onRefresh();
                fetchReviewJobs();
              }}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }>
          <Title />
          <TabsRow activeTab={activeTab} onChange={setActiveTab} counts={jobCounts} />
          <SearchBar value={search} onChangeText={setSearch} />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Review Completed Jobs</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
            Share your experience and help other customers
          </Text>

          {(loading && !refreshing) || loadingReviews ? (
            <CtiLoader
              size="md"
              text="Loading completed jobs..."
              style={{ paddingVertical: 45 }}
            />
          ) : listToRender.length === 0 ? (
            <EmptyState
              activeTab="reviews"
              onAction={() => navigation.navigate('ExpertRepairmen')}
            />
          ) : (
            listToRender.map((item: any, index: number) => {
              const bId = String(item._id || item.bookingId || item.id);
              const mergedItem = {
                ...item,
                review: reviewedBookingIds[bId] || item.review,
              };

              return (
                <FadeUp key={bId || index} delay={80 + index * 60} duration={500} style={styles.cardWrap}>
                  <ReviewCard
                    item={mergedItem}
                    onWriteReview={handleOpenReviewModal}
                  />
                </FadeUp>
              );
            })
          )}
        </ScrollView>

        <WriteReviewModal
          visible={reviewModalVisible}
          job={targetJobForReview}
          isSubmitting={isSubmittingReview}
          onClose={() => setReviewModalVisible(false)}
          onSubmit={handleSubmitReview}
        />

        <AlertModal
          visible={alertConfig.visible}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          buttonText={alertConfig.buttonText || 'Okay'}
          secondaryButtonText={alertConfig.secondaryButtonText}
          onButtonPress={alertConfig.onButtonPress}
          onSecondaryButtonPress={alertConfig.onSecondaryButtonPress}
          onClose={() => {
            setAlertConfig(prev => ({ ...prev, visible: false }));
            if (alertConfig.onOk) alertConfig.onOk();
          }}
        />
      </View>
    );
  }

  const filtered = jobs.filter(job => {
    if (!matches(job)) return false;
    if (activeTab === 'all') return true;
    if (activeTab === 'open') return job.status === 'open';
    if (activeTab === 'offers_received' || activeTab === 'offer_received') {
      return (
        job.status === 'offers_received' ||
        job.status === 'offer_received' ||
        (job.status === 'open' && job.offersCount > 0)
      );
    }
    if (activeTab === 'booked') {
      return job.status === 'booked' || job.status === 'confirmed' || job.status === 'scheduled';
    }
    if (activeTab === 'in_progress') {
      return (
        job.status === 'in_progress' ||
        job.status === 'parts_needed' ||
        job.status === 'quality_check'
      );
    }
    if (activeTab === 'completed') {
      return job.status === 'completed' || job.status === 'delivered' || job.status === 'closed';
    }
    if (activeTab === 'disputed') {
      return job.status === 'disputed';
    }
    return job.status === activeTab;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const isEmpty = filtered.length === 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Header navigation={navigation} />

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        <Title />
        <TabsRow activeTab={activeTab} onChange={setActiveTab} counts={jobCounts} />
        <SearchBar value={search} onChangeText={setSearch} />

        {loading && !refreshing ? (
          <CtiLoader
            size="md"
            text="Loading your repair jobs..."
            style={{ paddingVertical: 45 }}
          />
        ) : (
          <>
            {!isEmpty && (
              <View style={styles.metaRow}>
                <Text style={[styles.metaText, { color: colors.textMuted }]}>
                  Showing {(page - 1) * PAGE_SIZE + 1} to{' '}
                  {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} jobs
                </Text>
              </View>
            )}

            {isEmpty ? (
              <EmptyState
                activeTab={activeTab}
                onAction={() => navigation.navigate('ExpertRepairmen')}
              />
            ) : (
              <>
                {pageItems.map((job, index) => (
                  <FadeUp key={job.id} delay={80 + index * 60} duration={500} style={styles.cardWrap}>
                    <JobCard
                      job={job}
                      onPress={() =>
                        navigation.navigate(
                          job.status === 'disputed' ? 'DisputeDetail' : 'RepairDetail',
                          { jobId: job.id, job },
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
      </>
    )}

    {/* New Job Request: Only on this screen, below all jobs */}
    {activeTab === 'all' && (
      <View style={styles.bottomPostJobWrap}>
        <Button
          title="New Job Request"
          size="md"
          variant="primary"
          fullWidth
          onPress={handleOpenNewJobRequestModal}
        />
      </View>
    )}
  </ScrollView>

  <WriteReviewModal
    visible={reviewModalVisible}
    job={targetJobForReview}
    isSubmitting={isSubmittingReview}
    onClose={() => setReviewModalVisible(false)}
    onSubmit={handleSubmitReview}
  />

  <AlertModal
    visible={alertConfig.visible}
    type={alertConfig.type}
    title={alertConfig.title}
    message={alertConfig.message}
    buttonText={alertConfig.buttonText || 'Okay'}
    secondaryButtonText={alertConfig.secondaryButtonText}
    onButtonPress={alertConfig.onButtonPress}
    onSecondaryButtonPress={alertConfig.onSecondaryButtonPress}
    onClose={() => {
      setAlertConfig(prev => ({ ...prev, visible: false }));
      if (alertConfig.onOk) alertConfig.onOk();
    }}
  />
</View>
);
}

function Header({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { cartCount } = useCart();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <Image source={ctiLogo} resizeMode="contain" style={styles.logo} />

      <View style={styles.headerIcons}>
        <Squeeze onPress={() => navigation.navigate('Cart')} scale={0.85}>
          <View>
            <Icon source={shoppingCartExtra} size={24} color={colors.text} />
            {cartCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            )}
          </View>
        </Squeeze>
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
    <View style={styles.titleRow}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: colors.text }]}>My Repair Jobs</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Manage and track your device repair requests
        </Text>
      </View>
    </View>
  );
}

function TabsRow({ activeTab, onChange, counts }: any) {
  const { colors } = useTheme();

  return (
    <View style={[styles.tabsWrap, { borderColor: colors.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        {TABS.map(tab => {
          const active = tab.key === activeTab;
          const count = counts ? counts[tab.key] : undefined;

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
                  {count !== undefined && count > 0 ? ` (${count})` : ''}
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
  badge: {
    position: 'absolute',
    top: -5,
    right: -6,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontFamily: fonts.bold, fontSize: 9, color: '#FFFFFF' },

  body: { paddingHorizontal: 20 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 6,
  },
  postJobBtn: { minWidth: 128, marginTop: 4 },
  title: { fontFamily: fonts.bold, fontSize: 26 },
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
    alignItems: 'center',
    marginTop: 16,
  },
  metaText: { fontFamily: fonts.regular, fontSize: 12 },

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
  bottomPostJobWrap: {
    marginTop: 20,
    marginBottom: 8,
  },
});
