import { useCallback, useEffect, useRef, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
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
import { getWebAddJobUrl } from '@/constants/config';
import ErrorState from '@/components/states/ErrorState';
import { formatMoney } from '@/utils/money';
import useRefreshOnActive from '@/utils/useRefreshOnActive';
import { subscribeJobChanges, useJobChangedChecker } from '../utils/jobLive';
import { getLocaleTag } from '@/i18n/locale';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { statusLabel, tx } from '@/utils/labels';

const PAGE_SIZE = 6;
const DESCRIPTION_PREVIEW = 120;

// Tabs aligned with Next.js web application (/my-account)
const TABS = [
  { key: 'all', get label() { return i18n.t('customer.allJobs'); }, icon: menuBold },
  { key: 'open', get label() { return i18n.t('seller.status.query.open'); }, icon: clockBold },
  { key: 'offers_received', get label() { return i18n.t('customer.offerReceived'); }, icon: inboxBold },
  { key: 'booked', get label() { return i18n.t('customer.booked'); }, icon: calendarBold },
  { key: 'in_progress', get label() { return i18n.t('customer.inProgress'); }, icon: settingsBold },
  { key: 'completed', get label() { return i18n.t('seller.status.withdraw.completed'); }, icon: checkCircleIcon },
  { key: 'disputed', get label() { return i18n.t('customer.disputed'); }, icon: exclamationCircleBold },
  { key: 'reviews', get label() { return i18n.t('sellerTabs.reviews'); }, icon: starBold },
];

const formatPrice = (min?: number, max?: number) => {
  const safeMin = Number(min || 0);
  const safeMax = Number(max || 0);
  if (safeMin === 0 && safeMax === 0) return i18n.t('customerMsg.priceOnInquiry');
  const one = (n: number) => formatMoney(n);
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
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const tagBadge = job.tag === 'job_posting' ? badges.booked : badges.inProgress;
  const tagLabel = statusLabel(job.tag === 'job_posting' ? 'job_posting' : 'direct_message');
  const offerBadge = job.offerConfirmed ? badges.accepted : badges.pending;

  return (
    <Squeeze
      onPress={onPress}
      scale={0.98}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHead}>
        <Text style={[styles.device, { color: colors.text }]}>{tx(job.device)}</Text>
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
                {expanded ? t('customer.seeLess') : t('customer.seeMore')}
              </Text>
            </Pressable>
          )}
        </>
      )}

      <Text style={[styles.servicesLabel, { color: colors.text }]}>{t('customer.requiredServices')}</Text>
      <View style={styles.services}>
        {(job.requiredServices || job.services || []).map(service => (
          <View key={service} style={[styles.servicePill, { borderColor: palette.rust }]}>
            <Text style={[styles.servicePillText, { color: palette.rust }]}>{service}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.footer}>
        <StatusPill label={statusLabel(job.offerConfirmed ? 'confirmed' : 'pending')} badge={offerBadge} />

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
              {t('customerMsg.expires', { date: job.expiresAt })}
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
  const { t } = useTranslation();
  const { colors } = useTheme();

  const device = item.jobId?.title || tx(item.device) || t('customer.deviceRepair');
  const completedDate = item.completedAt
    ? new Date(item.completedAt).toLocaleDateString(getLocaleTag())
    : item.date || item.completedDate || t('customerMsg.recently');
  const repairmanName =
    item.repairmanId?.name || item.assignedTo || item.repairman || t('chat.technician');
  const shopName =
    item.repairmanId?.repairmanProfile?.shopName || item.shop || '';
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
              {t('customerMsg.completedOn', { date: completedDate })}
            </Text>
          </View>
        </View>
        <StatusPill label={t('seller.status.withdraw.completed')} badge={badges.completed} />
      </View>

      <StatusPill label={t('customer.jobPosting')} badge={badges.booked} style={styles.tag} />

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
            {formatMoney(amountPaid)}
          </Text>
          <Text style={[styles.reviewMetaText, { color: colors.textMuted }]}>{t('customer.totalPaid')}</Text>
        </View>
      </View>

      {review ? (
        <View style={[styles.reviewDone, { borderColor: colors.border }]}>
          <View style={styles.reviewHead}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('customer.yourReview')}</Text>
            {Boolean(review.createdAt || review.submittedAt) && (
              <Text style={[styles.reviewMetaText, { color: colors.textMuted }]}>
                {new Date(review.createdAt || review.submittedAt).toLocaleDateString(getLocaleTag())}
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
              {t('customerMsg.ratingOutOf', { rating })}
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
              {t('customer.reviewSubmittedSuccessfully')}
            </Text>
          </View>
        </View>
      ) : (
        <Button
          title={t('customer.writeAReviewForThis')}
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
          title: i18n.t('customer.noOpenRepairRequests'),
          desc: i18n.t('customer.openJobsAreRequestsYou'),
          btnText: i18n.t('customerMsg.findExpert'),
        };
      case 'offers_received':
      case 'offer_received':
        return {
          title: i18n.t('customer.noOffersReceivedYet'),
          desc: i18n.t('customer.whenTechniciansSendQuotesFor'),
          btnText: i18n.t('customerMsg.exploreServices'),
        };
      case 'booked':
        return {
          title: i18n.t('customer.noBookedRepairs'),
          desc: i18n.t('customer.repairsWhereYouHaveAccepted'),
          btnText: i18n.t('customerMsg.findExpert'),
        };
      case 'in_progress':
        return {
          title: i18n.t('customer.noRepairsInProgress'),
          desc: i18n.t('customer.devicesCurrentlyBeingDiagnosedOr'),
          btnText: undefined,
        };
      case 'completed':
        return {
          title: i18n.t('customer.noCompletedRepairs'),
          desc: i18n.t('customer.repairsThatHaveBeenSuccessfully'),
          btnText: undefined,
        };
      case 'disputed':
        return {
          title: i18n.t('customer.noDisputedJobs'),
          desc: i18n.t('customer.anyJobsWithActiveDispute'),
          btnText: undefined,
        };
      case 'reviews':
        return {
          title: i18n.t('customer.noReviewsPending'),
          desc: i18n.t('customer.completedJobsEligibleForFeedback'),
          btnText: undefined,
        };
      default:
        return {
          title: i18n.t('customer.noRepairJobsFound'),
          desc: i18n.t('customer.tryAdjustingYourSearchOr'),
          btnText: i18n.t('customerMsg.exploreServices'),
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
  const { t } = useTranslation();
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
  const reviewBusy = useRef(false);
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Record<string, any>>({});
  const [completedReviewJobs, setCompletedReviewJobs] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);

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
      title: i18n.t('customer.newJobRequest'),
      message: i18n.t('customerMsg.webPortalMsg', { url: getWebAddJobUrl() }),
      buttonText: i18n.t('customer.openWebPortal'),
      secondaryButtonText: i18n.t('common.close'),
      onButtonPress: async () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
        try {
          await Linking.openURL(getWebAddJobUrl());
        } catch {
          setAlertConfig({
            visible: true,
            type: 'info',
            title: i18n.t('customer.webPortalLink'),
            message: getWebAddJobUrl(),
            buttonText: i18n.t('common.okay'),
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
    setReviewsError('');
    try {
      const list = await customerJobApi.getCompletedJobsForReview();
      setCompletedReviewJobs(list);
    } catch (err: any) {
      // keep the list already on screen; "nothing to review" is only shown when the request worked
      setReviewsError(err?.message || i18n.t('customer.couldNotLoadYourCompleted'));
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
      item.repairmanId?.name || item.assignedTo || i18n.t('chat.technician');
    let repairmanAvatar =
      item.repairmanId?.avatar || item.repairmanId?.profilePhoto || null;
    let deviceTitle = item.jobId?.title || tx(item.device) || i18n.t('customer.deviceRepair');

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
          deviceTitle = tx(full.title) || deviceTitle;
        }
      } catch {}
    }

    if (!bookingId || !repairmanId) {
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: i18n.t('common.notice'),
        message: i18n.t('customer.bookingDetailsAreIncompleteFor'),
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
    if (reviewBusy.current) return;
    reviewBusy.current = true;
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
        title: i18n.t('customer.reviewSubmitted'),
        message: res.message || i18n.t('customer.reviewSubmittedSuccessfully2'),
      });
      fetchJobs(true);
      fetchReviewJobs();
    } catch (err: any) {
      setAlertConfig({
        visible: true,
        type: 'error',
        title: i18n.t('customer.submissionError'),
        message: err?.message || i18n.t('customer.failedToSubmitReview'),
      });
    } finally {
      reviewBusy.current = false;
      setIsSubmittingReview(false);
    }
  };

  const fetchJobs = useCallback(async (isRefresh = false, silent = false) => {
    if (isRefresh) setRefreshing(true);
    else if (!silent) setLoading(true);

    try {
      const data = await customerJobApi.getMyJobs();
      setJobs(data);
      setLoadError(null);
    } catch (err: any) {
      if (!silent) setLoadError(err?.message || i18n.t('customer.failedToLoadYourRepair'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // A repairman sent an offer or changed a booking: reload quietly now if this screen is open,
  // or when it comes back into view
  const isFocused = useIsFocused();
  const focusedRef = useRef(isFocused);
  focusedRef.current = isFocused;
  const jobChanged = useJobChangedChecker();
  const reloadQuietly = () => {
    fetchJobs(false, true);
  };
  const reloadRef = useRef(reloadQuietly);
  reloadRef.current = reloadQuietly;
  const markLoaded = useRefreshOnActive(isFocused, reloadQuietly, jobChanged);
  useEffect(() => {
    if (!loading) markLoaded();
  }, [loading, markLoaded]);
  useEffect(
    () =>
      subscribeJobChanges(() => {
        if (focusedRef.current && jobChanged()) reloadRef.current();
      }),
    [jobChanged],
  );

  useEffect(() => setPage(1), [activeTab, search]);

  const onRefresh = () => {
    fetchJobs(true);
  };

  const query = search.trim().toLowerCase();
  const matches = (job: MobileCustomerJob) => {
    if (!query) return true;
    const device = (tx(job.device)).toLowerCase();
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
      const device = (item.jobId?.title || tx(item.device) || '').toLowerCase();
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

          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('customer.reviewCompletedJobs')}</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
            {t('customer.shareYourExperienceAndHelp')}
          </Text>

          {(loading && !refreshing) || loadingReviews ? (
            <CtiLoader
              size="md"
              text={t('customer.loadingCompletedJobs')}
              style={{ paddingVertical: 45 }}
            />
          ) : reviewsError && completedReviewJobs.length === 0 ? (
            <ErrorState error={reviewsError} onRetry={fetchReviewJobs} fullScreen={false} />
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
          buttonText={alertConfig.buttonText || i18n.t('common.okay')}
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
            text={t('customer.loadingYourRepairJobs')}
            style={{ paddingVertical: 45 }}
          />
        ) : loadError && jobs.length === 0 ? (
          <ErrorState
            fullScreen={false}
            title={t('customer.couldNotLoadJobs')}
            error={loadError}
            onRetry={() => fetchJobs()}
          />
        ) : (
          <>
            {!isEmpty && (
              <View style={styles.metaRow}>
                <Text style={[styles.metaText, { color: colors.textMuted }]}>
                  {t('customerMsg.showingRange', { from: (page - 1) * PAGE_SIZE + 1, to: Math.min(page * PAGE_SIZE, filtered.length), total: filtered.length })}
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
                    {t('customer.previous')}
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
                    {t('roleSelect.next')}
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
          title={t('customer.newJobRequest')}
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
    buttonText={alertConfig.buttonText || i18n.t('common.okay')}
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
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.titleRow}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: colors.text }]}>{t('customer.myRepairJobs')}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {t('customer.manageAndTrackYourDevice')}
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
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={[styles.search, { borderColor: colors.border }]}>
      <Icon source={searchBold} size={20} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={t('customer.searchByBrandServiceLocation')}
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
  expiryText: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 12 },

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
  reviewMetaText: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 12 },

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
  cardTitle: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 14 },

  reviewDone: { borderTopWidth: 1, marginTop: 14, paddingTop: 14, gap: 10 },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  submittedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  submittedText: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 12 },
  bottomPostJobWrap: {
    marginTop: 20,
    marginBottom: 8,
  },
});
