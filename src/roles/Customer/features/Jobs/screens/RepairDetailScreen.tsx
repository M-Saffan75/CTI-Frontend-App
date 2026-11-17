import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import Squeeze from '@/components/Squeeze';
import CtiLoader from '@/components/CtiLoader';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import CreateDisputeModal from '@/components/modals/CreateDisputeModal';
import WriteReviewModal,{ ReviewTargetJob } from '@/components/modals/WriteReviewModal';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  checkCircleBold,
  infoCircleBold,
  menuBold,
  packageBold,
  sendBold,
  shieldBold,
  shoppingCartExtra,
  starExtra,
  toolExtra,
} from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import customerJobApi, {
  MobileJobDetail,
  NormalizedOffer,
} from '../services/customerJobApi';
import { useCart } from '@/roles/Customer/context/CartContext';
import { startChat } from '@/services/chatApi';
import { formatMoney } from '@/utils/money';
import useRefreshOnActive from '@/utils/useRefreshOnActive';
import { subscribeJobChanges, useJobChangedChecker } from '../utils/jobLive';
import { getLocaleTag, upper } from '@/i18n/locale';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { chipLabel, serviceTypeLabel, statusLabel, tx } from '@/utils/labels';

const DESCRIPTION_PREVIEW = 150;

export default function RepairDetailScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { cartCount } = useCart();

  const passedJob = route?.params?.job;
  const jobId = route?.params?.jobId || passedJob?.id;

  const [job, setJob] = useState<MobileJobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTabKey, setActiveTabKey] = useState<string>('details');
  const [expandedDesc, setExpandedDesc] = useState(false);
  const [expandedOfferDesc, setExpandedOfferDesc] = useState<{ [id: string]: boolean }>({});
  const [expandedAddress, setExpandedAddress] = useState(false);
  const [startingChatId, setStartingChatId] = useState<string | null>(null);

  // Custom Modal States (no cheap Alert.alert)
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [disputeModalVisible, setDisputeModalVisible] = useState(false);
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
  const disputeBusy = useRef(false);
  const reviewBusy = useRef(false);
  const [openDisputeId, setOpenDisputeId] = useState<string | null>(null);
  const [alertState, setAlertState] = useState<{
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

  const [loadError, setLoadError] = useState('');

  const fetchJobDetail = useCallback(
    async (silent = false) => {
      if (!jobId) {
        setLoading(false);
        return;
      }
      try {
        const data = await customerJobApi.getMyJobDetail(jobId);
        setJob(data);
        setLoadError('');
      } catch (err: any) {
        // a quiet reload keeps what is already on screen
        if (!silent) {
          setJob(null);
          setLoadError(err?.message || i18n.t('customer.couldNotLoadThisJob'));
        }
      } finally {
        setLoading(false);
      }
    },
    [jobId],
  );

  useEffect(() => {
    fetchJobDetail();
  }, [fetchJobDetail]);

  // A repairman sent an offer or changed the booking: reload quietly now if this screen is open,
  // or when it comes back into view
  const isFocused = useIsFocused();
  const focusedRef = useRef(isFocused);
  focusedRef.current = isFocused;
  const jobChanged = useJobChangedChecker();
  const reloadQuietly = () => {
    fetchJobDetail(true);
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

  // Dynamic Tabs based on job type
  const availableTabs = useMemo(() => {
    if (!job) return [{ key: 'details', label: i18n.t('customer.details') }];

    const tabs: Array<{ key: string; label: string }> = [
      { key: 'details', label: i18n.t('customer.details') },
    ];

    if (job.tag === 'job_posting') {
      const offersCount = job.offers?.length || 0;
      if (job.selectedOffer) {
        tabs.push({ key: 'offers', label: i18n.t('customer.selectedOffer') });
      } else {
        tabs.push({ key: 'offers', label: i18n.t('customerMsg.offersCount', { count: offersCount }) });
      }
    } else if (job.tag === 'direct_message') {
      tabs.push({ key: 'repairman', label: i18n.t('customer.repairmanInfo') });
    }

    if (job.booking || ['booked', 'in_progress', 'completed', 'delivered', 'closed'].includes(job.status)) {
      tabs.push({ key: 'booking', label: i18n.t('glossary.booking') });
    }

    return tabs;
  }, [job]);

  // Keep active tab valid if tabs change
  useEffect(() => {
    if (!availableTabs.some(tab => tab.key === activeTabKey)) {
      setActiveTabKey('details');
    }
  }, [availableTabs, activeTabKey]);

  // Handle direct chat with repair technician
  const handleStartChatWithTech = async (
    repairmanId: string,
    repairmanName: string,
    repairmanAvatar?: string | null,
  ) => {
    if (!repairmanId) {
      setAlertState({
        visible: true,
        type: 'warning',
        title: i18n.t('common.notice'),
        message: i18n.t('customer.technicianContactDetailsNotFound'),
      });
      return;
    }

    try {
      setStartingChatId(repairmanId);
      const res = await startChat({ repairmanId, jobId: job?.id });
      if (!res.success || !res.chat) {
        setAlertState({
          visible: true,
          type: 'error',
          title: i18n.t('customer.couldNotOpenTheChat2'),
          message: res.message || i18n.t('customer.pleaseTryAgain'),
        });
        return;
      }
      const targetName = res.chat?.user?.name || res.chat?.repairman?.name || repairmanName;
      const targetAvatar =
        res.chat?.user?.avatar || res.chat?.repairman?.avatar || repairmanAvatar;

      navigation.navigate('ChatDetail', {
        chatId: res.chat?._id || res.chat?.chatId,
        participantId: repairmanId,
        participantName: targetName,
        participantAvatar: targetAvatar,
      });
    } catch (err: any) {
      setAlertState({
        visible: true,
        type: 'error',
        title: i18n.t('customer.couldNotOpenTheChat2'),
        message: err?.message || i18n.t('customer.pleaseTryAgain'),
      });
    } finally {
      setStartingChatId(null);
    }
  };

  // Show web checkout guidance when customer taps Accept Offer
  const handleAcceptOffer = (offer: NormalizedOffer) => {
    setAlertState({
      visible: true,
      type: 'info',
      title: i18n.t('customer.completeOnWebsite'),
      message: i18n.t('customerMsg.acceptOfferWeb', {
        amount: formatMoney(offer.finalTotal, offer.currency),
        name: tx(offer.repairmanName),
      }),
    });
  };

  const toggleOfferDesc = (id: string) => {
    setExpandedOfferDesc(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const hasDispute = Boolean(
    job?.dispute ||
      job?.booking?.hasDispute ||
      job?.status === 'disputed' ||
      job?.booking?.status === 'disputed',
  );

  const isReviewed = Boolean(
    job?.booking?.isReviewSubmitted ||
      job?.booking?.isReviewed ||
      (job as any)?.reviewed ||
      (job as any)?.review,
  );

  const isDelivered =
    job?.booking?.status === 'delivered' ||
    job?.status === 'delivered';

  const isCompletedWaitingDelivery =
    (job?.booking?.status === 'completed' || job?.status === 'completed') &&
    job?.booking?.status !== 'delivered' &&
    job?.status !== 'delivered';

  // Backend reviewController strictly requires booking.status === 'delivered'
  const canReview = Boolean(
    (job?.booking || (job as any)?.bookingId) &&
      (job?.booking?.status === 'delivered' || job?.status === 'delivered' || job?.booking?.status === 'closed') &&
      !hasDispute &&
      !isReviewed,
  );

  const DISPUTABLE_STATUSES = [
    'confirmed',
    'repairman_notified',
    'scheduled',
    'in_progress',
    'parts_needed',
    'pending_approval',
    'quality_check',
    'completed',
    'delivered',
  ];
  const disputeBookingId = String(job?.booking?._id || job?.booking?.id || '');
  const canReportProblem = Boolean(
    disputeBookingId &&
      !hasDispute &&
      DISPUTABLE_STATUSES.includes(String(job?.booking?.status || job?.status)),
  );

  const handleSubmitDispute = async (data: { category: string; description: string }) => {
    if (disputeBusy.current) return;
    disputeBusy.current = true;
    try {
      setIsSubmittingDispute(true);
      const res = await customerJobApi.createDispute({ bookingId: disputeBookingId, ...data });
      setDisputeModalVisible(false);
      const disputeId = res.dispute?._id || res.dispute?.id;
      await fetchJobDetail();
      setAlertState({
        visible: true,
        type: 'success',
        title: i18n.t('customer.disputeCreated'),
        message: res.message || i18n.t('customer.yourDisputeHasBeenSubmitted'),
      });
      setOpenDisputeId(disputeId ? String(disputeId) : null);
    } catch (err: any) {
      setAlertState({
        visible: true,
        type: 'error',
        title: i18n.t('customer.disputeError'),
        message: err?.message || i18n.t('customer.failedToCreateDispute'),
      });
    } finally {
      disputeBusy.current = false;
      setIsSubmittingDispute(false);
    }
  };

  const dismissAlert = () => {
    setAlertState(prev => ({ ...prev, visible: false }));
    if (openDisputeId) {
      const disputeId = openDisputeId;
      setOpenDisputeId(null);
      navigation.navigate('DisputeDetail', { jobId: job?.id, job, disputeId });
    }
  };

  const [isClosingJob, setIsClosingJob] = useState(false);

  const handleCloseJob = async () => {
    const bookingId = job?.booking?._id || job?.booking?.id;
    if (!bookingId) return;
    try {
      setIsClosingJob(true);
      const res = await customerJobApi.closeJob(String(bookingId));
      if (res.success) {
        setAlertState({
          visible: true,
          type: 'success',
          title: i18n.t('customer.jobClosed'),
          message: res.message || i18n.t('customer.jobClosedSuccessfullyTechnicianEarnings'),
        });
        await fetchJobDetail();
      } else {
        setAlertState({
          visible: true,
          type: 'error',
          title: i18n.t('common.error'),
          message: res.message || i18n.t('customer.failedToCloseJob'),
        });
      }
    } catch (err: any) {
      setAlertState({
        visible: true,
        type: 'error',
        title: i18n.t('common.error'),
        message: err?.message || i18n.t('customer.failedToCloseJob'),
      });
    } finally {
      setIsClosingJob(false);
    }
  };

  const targetJobForReview: ReviewTargetJob | null = useMemo(() => {
    const bookingId = String(
      job?.booking?._id ||
        job?.booking?.id ||
        (job as any)?.bookingId ||
        (job as any)?.raw?.bookingId ||
        '',
    );
    const offerRep = job?.selectedOffer?.repairmanId;
    const offerRepId =
      typeof offerRep === 'object' && offerRep !== null
        ? (offerRep as any)._id || (offerRep as any).id
        : offerRep;

    const repairmanId = String(
      job?.repairman?.id ||
        job?.booking?.repairmanId?._id ||
        job?.booking?.repairmanId ||
        offerRepId ||
        (job as any)?.raw?.repairmanId ||
        '',
    );
    if (!bookingId || !repairmanId) return null;
    return {
      bookingId,
      jobId: job?.id ? String(job.id) : undefined,
      repairmanId,
      repairmanName: job?.repairman?.name || tx(job?.selectedOffer?.repairmanName) || i18n.t('chat.technician'),
      repairmanAvatar: job?.repairman?.avatar || undefined,
      deviceTitle: tx(job?.title) || i18n.t('customer.deviceRepair'),
    };
  }, [job]);

  const handleOpenReviewModal = () => {
    if (!targetJobForReview) {
      setAlertState({
        visible: true,
        type: 'warning',
        title: i18n.t('common.notice'),
        message: i18n.t('customer.bookingOrTechnicianDetailsAre'),
      });
      return;
    }
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
      setAlertState({
        visible: true,
        type: 'success',
        title: i18n.t('customer.reviewSubmitted'),
        message: res.message || i18n.t('customer.thankYouYourReviewHas'),
      });
      await fetchJobDetail();
    } catch (err: any) {
      setAlertState({
        visible: true,
        type: 'error',
        title: i18n.t('customer.reviewError'),
        message: err?.message || i18n.t('customer.failedToSubmitReview2'),
      });
    } finally {
      reviewBusy.current = false;
      setIsSubmittingReview(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Top Header */}
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

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Squeeze onPress={() => navigation.goBack()} scale={0.9} style={styles.backWrap}>
          <View style={[styles.back, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={20} color={colors.onPrimary} />
          </View>
        </Squeeze>

        {loading ? (
          <View style={{ paddingVertical: 80, alignItems: 'center' }}>
            <CtiLoader size="lg" text={t('customer.loadingRepairJobDetails')} />
          </View>
        ) : !job ? (
          <View style={{ paddingVertical: 80, alignItems: 'center', paddingHorizontal: 24 }}>
            <Icon source={packageBold} size={48} color={colors.textMuted} />
            <Text style={[styles.title, { color: colors.text, textAlign: 'center', marginTop: 12 }]}>
              {loadError ? t('customer.couldNotLoadTheRepair') : t('customer.repairJobNotFound')}
            </Text>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 14,
                color: colors.textMuted,
                marginTop: 8,
                textAlign: 'center',
              }}
            >
              {loadError || t('customer.theRequestedRepairJobCould')}
            </Text>
            {loadError ? (
              <Squeeze
                onPress={() => {
                  setLoading(true);
                  fetchJobDetail();
                }}
                style={{ marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: 12 }}>
                <Text style={{ color: colors.onPrimary, fontFamily: fonts.bold }}>{t('customer.tryAgain')}</Text>
              </Squeeze>
            ) : null}
            <Squeeze
              onPress={() => navigation.goBack()}
              style={{
                marginTop: 24,
                paddingHorizontal: 24,
                paddingVertical: 12,
                backgroundColor: colors.primary,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: '#fff', fontFamily: fonts.bold }}>{t('customer.goBack')}</Text>
            </Squeeze>
          </View>
        ) : (
          <>
            {/* Title & Chips */}
            <Text style={[styles.title, { color: colors.text }]}>{tx(job.title)}</Text>

            <View style={styles.chips}>
              {job.chips.map((chip, idx) => (
                <View
                  key={`${chip}-${idx}`}
                  style={[styles.chip, { borderColor: colors.primary, backgroundColor: colors.primary + '10' }]}
                >
                  <Text style={[styles.chipText, { color: colors.primary }]}>{chipLabel(chip)}</Text>
                </View>
              ))}
            </View>

            {/* Dynamic Tabs */}
            <View style={[styles.tabsWrap, { borderColor: colors.border }]}>
              {availableTabs.map(tab => {
                const active = tab.key === activeTabKey;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => setActiveTabKey(tab.key)}
                    style={[styles.tab, active && { borderBottomColor: colors.primary }]}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        {
                          color: active ? colors.primary : colors.textMuted,
                          fontFamily: active ? fonts.bold : fonts.regular,
                        },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* TAB 1: DETAILS */}
            {activeTabKey === 'details' && (
              <FadeUp duration={400}>
                <Text style={[styles.price, { color: colors.text }]}>{job.priceLabel}</Text>
                <Text style={[styles.muted, { color: colors.textMuted }]}>{tx(job.urgencyNote)}</Text>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('customer.description')}</Text>
                <Text
                  style={[styles.text, { color: colors.textMuted }]}
                  numberOfLines={expandedDesc ? undefined : 3}
                >
                  {tx(job.description)}
                </Text>
                {tx(job.description).length > DESCRIPTION_PREVIEW && (
                  <Pressable onPress={() => setExpandedDesc(!expandedDesc)} hitSlop={6}>
                    <Text style={[styles.link, { color: colors.primary }]}>
                      {expandedDesc ? t('customer.readLess') : t('customer.readMore2')}
                    </Text>
                  </Pressable>
                )}

                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('customer.servicesRequired')}</Text>
                <View style={styles.pills}>
                  {job.services.map((service, idx) => (
                    <View key={`${tx(service)}-${idx}`} style={[styles.pill, { borderColor: colors.primary }]}>
                      <Text style={[styles.pillText, { color: colors.primary }]}>{tx(service)}</Text>
                    </View>
                  ))}
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('customer.location')}</Text>
                <Text style={[styles.text, { color: colors.textMuted }]}>{tx(job.locationNote)}</Text>
                <Text style={[styles.link, { color: colors.primary }]}>{tx(job.locationLabel)}</Text>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('customer.servicePreference')}</Text>
                <View style={[styles.pill, styles.singlePill, { borderColor: colors.primary }]}>
                  <Text style={[styles.pillText, { color: colors.primary }]}>
                    {job.servicePreference}
                  </Text>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('customer.jobOverview')}</Text>
                <View style={[styles.statsBox, { backgroundColor: colors.surfaceAlt }]}>
                  {job.stats.map(stat => (
                    <View key={tx(stat.label)} style={styles.statItem}>
                      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{tx(stat.label)}</Text>
                      <Text style={[styles.statValue, { color: colors.text }]}>{tx(stat.value)}</Text>
                    </View>
                  ))}
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.footerText, { color: colors.textMuted }]}>
                  {t('customerMsg.createdOn', { date: tx(job.createdAt) })}
                </Text>
              </FadeUp>
            )}

            {/* TAB 2: OFFERS (Job Postings) */}
            {activeTabKey === 'offers' && (
              <FadeUp duration={400}>
                {(() => {
                  const offersList = job.selectedOffer
                    ? job.offers?.length
                      ? job.offers
                      : [job.selectedOffer]
                    : job.offers || [];

                  if (offersList.length === 0) {
                    return (
                      <View
                        style={[
                          styles.emptyOffersCard,
                          { backgroundColor: colors.surface, borderColor: colors.border },
                        ]}
                      >
                        <Icon source={toolExtra} size={36} color={colors.primary} />
                        <Text style={[styles.emptyOffersTitle, { color: colors.text }]}>
                          {i18n.t('customer.noOffersAvailableYet')}
                        </Text>
                        <Text style={[styles.emptyOffersText, { color: colors.textMuted }]}>
                          {i18n.t('customer.expertRepairTechniciansAreReviewing')}
                        </Text>
                      </View>
                    );
                  }

                  return (
                    <View style={styles.offersList}>
                      {offersList.map((offer: NormalizedOffer, idx: number) => {
                        const isAccepted =
                          offer.status === 'accepted' ||
                          job.selectedOffer?.id === offer.id ||
                          job.status === 'booked' ||
                          job.status === 'in_progress' ||
                          job.status === 'completed' ||
                          job.status === 'delivered' ||
                          job.status === 'closed';
                        const isStartingChat = startingChatId === offer.repairmanId;
                        const isExpanded = Boolean(expandedOfferDesc[offer.id]);

                        return (
                          <View
                            key={offer.id || `offer-${idx}`}
                            style={[
                              styles.offerCard,
                              { backgroundColor: colors.surface, borderColor: colors.border },
                              isAccepted && { borderColor: colors.primary, borderWidth: 1.5 },
                            ]}
                          >
                            {/* Offer Header */}
                            <View style={styles.offerHeader}>
                              <View style={styles.offerTechInfo}>
                                <Text style={[styles.offerTechName, { color: colors.text }]}>
                                  {tx(offer.repairmanName)}
                                </Text>
                                <Text style={[styles.offerShopName, { color: colors.textMuted }]}>
                                  @{offer.shopName}
                                </Text>
                              </View>

                              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                              {offer.rating > 0 && (
                                <View style={styles.offerRatingRow}>
                                  <Icon source={starExtra} size={14} color="#f59e0b" />
                                  <Text style={[styles.offerRatingText, { color: colors.text }]}>
                                    {offer.rating.toFixed(1)}
                                  </Text>
                                </View>
                              )}
                              <View
                                style={[
                                  styles.offerStatusPill,
                                  {
                                    backgroundColor: isAccepted
                                      ? colors.success + '20'
                                      : colors.primary + '15',
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.offerStatusText,
                                    { color: isAccepted ? colors.success : colors.primary },
                                  ]}
                                >
                                  {isAccepted ? i18n.t('customer.acceptedOffer') : offer.status ? statusLabel(offer.status) : i18n.t('customer.activeOffer')}
                                </Text>
                              </View>
                            </View>
                          </View>

                          {/* Quick Stats Badges */}
                          <View style={styles.offerBadgesRow}>
                            <View style={[styles.miniBadge, { backgroundColor: colors.surfaceAlt }]}>
                              <Text style={[styles.miniBadgeText, { color: colors.textMuted }]}>
                                {t('customerMsg.jobsCount', { count: offer.totalJobs })}
                              </Text>
                            </View>
                            {offer.successRate > 0 && (
                              <View style={[styles.miniBadge, { backgroundColor: colors.surfaceAlt }]}>
                                <Text style={[styles.miniBadgeText, { color: colors.textMuted }]}>
                                  {t('customerMsg.successRate', { rate: offer.successRate })}
                                </Text>
                              </View>
                            )}
                            <View
                              style={[
                                styles.miniBadge,
                                { backgroundColor: colors.primary + '12' },
                              ]}
                            >
                              <Text style={[styles.miniBadgeText, { color: colors.primary }]}>
                                🛡 {tx(offer.warrantyLabel)}
                              </Text>
                            </View>
                            {offer.pickupAvailable && (
                              <View style={[styles.miniBadge, { backgroundColor: '#e0f2fe' }]}>
                                <Text style={[styles.miniBadgeText, { color: '#0369a1' }]}>
                                  {t('customerMsg.pickupFee', { fee: formatMoney(offer.pickupCharge, offer.currency) })}
                                </Text>
                              </View>
                            )}
                            {offer.homeService && (
                              <View style={[styles.miniBadge, { backgroundColor: '#dcfce7' }]}>
                                <Text style={[styles.miniBadgeText, { color: '#15803d' }]}>
                                  {i18n.t('customer.homeService')}
                                </Text>
                              </View>
                            )}
                            {Boolean(offer.partsQuality) && (
                              <View style={[styles.miniBadge, { backgroundColor: '#fef3c7' }]}>
                                <Text style={[styles.miniBadgeText, { color: '#b45309' }]}>
                                  🔧 {offer.partsQuality}
                                </Text>
                              </View>
                            )}
                          </View>

                          {/* Offer Description */}
                          {Boolean(offer.description) && (
                            <View style={styles.offerDescBox}>
                              <Text
                                style={[styles.offerDescText, { color: colors.textMuted }]}
                                numberOfLines={isExpanded ? undefined : 2}
                              >
                                {tx(offer.description)}
                              </Text>
                              {tx(offer.description).length > 90 && (
                                <Pressable onPress={() => toggleOfferDesc(offer.id)} hitSlop={6}>
                                  <Text style={[styles.link, { color: colors.primary, fontSize: 12 }]}>
                                    {isExpanded ? i18n.t('customer.readLess') : i18n.t('customer.readMore2')}
                                  </Text>
                                </Pressable>
                              )}
                            </View>
                          )}

                          {/* Availability & Timing Row */}
                          <View style={[styles.timingRow, { borderColor: colors.border }]}>
                            <View style={styles.timingItem}>
                              <Text style={[styles.timingLabel, { color: colors.textMuted }]}>
                                {i18n.t('customer.canStart')}
                              </Text>
                              <Text style={[styles.timingValue, { color: colors.text }]}>
                                {tx(offer.startLabel)}
                              </Text>
                            </View>
                            <View style={styles.timingItem}>
                              <Text style={[styles.timingLabel, { color: colors.textMuted }]}>
                                {i18n.t('chat.estimatedTime')}
                              </Text>
                              <Text style={[styles.timingValue, { color: colors.text }]}>
                                {tx(offer.timeLabel)}
                              </Text>
                            </View>
                          </View>

                          {/* Required Parts List (if any) */}
                          {offer.requiredParts.length > 0 && (
                            <View style={styles.partsSection}>
                              <Text style={[styles.partsTitle, { color: colors.text }]}>
                                {i18n.t('customer.requiredReplacementParts')}
                              </Text>
                              <View style={styles.partsGrid}>
                                {offer.requiredParts.map(part => (
                                  <View
                                    key={part.id}
                                    style={[
                                      styles.partItem,
                                      { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                                    ]}
                                  >
                                    <Text style={[styles.partName, { color: colors.text }]} numberOfLines={1}>
                                      {tx(part.name)}
                                    </Text>
                                    <Text style={[styles.partPrice, { color: colors.primary }]}>
                                      {formatMoney(part.price, offer.currency)}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            </View>
                          )}

                          {/* Price Breakdown Container */}
                          <View
                            style={[
                              styles.priceBreakdownBox,
                              { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                            ]}
                          >
                            <Text style={[styles.breakdownHeader, { color: colors.text }]}>
                              {i18n.t('customer.priceBreakdown')}
                            </Text>

                            <View style={styles.breakdownRow}>
                              <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>
                                {i18n.t('customer.laborCost')}
                              </Text>
                              <Text style={[styles.breakdownVal, { color: colors.text }]}>
                                {formatMoney(offer.basePrice, offer.currency)}
                              </Text>
                            </View>

                            {offer.partsEstimate > 0 && (
                              <View style={styles.breakdownRow}>
                                <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>
                                  {i18n.t('customer.partsCost')}
                                </Text>
                                <Text style={[styles.breakdownVal, { color: colors.text }]}>
                                  {formatMoney(offer.partsEstimate, offer.currency)}
                                </Text>
                              </View>
                            )}

                            {offer.pickupAvailable && offer.pickupCharge > 0 && (
                              <View style={styles.breakdownRow}>
                                <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>
                                  {i18n.t('customer.pickupFee')}
                                </Text>
                                <Text style={[styles.breakdownVal, { color: colors.text }]}>
                                  +{formatMoney(offer.pickupCharge, offer.currency)}
                                </Text>
                              </View>
                            )}

                            <View style={[styles.breakdownDivider, { backgroundColor: colors.border }]} />

                            <View style={styles.breakdownRow}>
                              <Text style={[styles.totalLabel, { color: colors.text }]}>
                                {i18n.t('customer.totalAmount2')}
                              </Text>
                              <Text style={[styles.totalVal, { color: colors.primary }]}>
                                {formatMoney(offer.finalTotal, offer.currency)}
                              </Text>
                            </View>
                          </View>

                          {/* Action Buttons */}
                          <View style={styles.actionsRow}>
                            {/* Chat Button */}
                            <Button
                              title={isAccepted ? i18n.t('customer.chat') : i18n.t('customer.chatWithTech')}
                              icon={sendBold}
                              iconPosition="left"
                              size="sm"
                              variant="outline"
                              onPress={() =>
                                handleStartChatWithTech(
                                  offer.repairmanId,
                                  tx(offer.repairmanName),
                                )
                              }
                              disabled={isStartingChat}
                              loading={isStartingChat}
                              style={{ flex: 1 }}
                              contentStyle={{ paddingHorizontal: 8, height: 40 }}
                              textStyle={{ fontSize: 13, fontFamily: fonts.bold }}
                            />

                            {/* Accept Offer Guidance */}
                            {!isAccepted && (
                              <Button
                                title={i18n.t('customer.acceptOffer')}
                                size="sm"
                                variant="primary"
                                onPress={() => handleAcceptOffer(offer)}
                                style={{ flex: 1.1 }}
                                contentStyle={{ paddingHorizontal: 8, height: 40 }}
                                textStyle={{ fontSize: 13, fontFamily: fonts.bold }}
                              />
                            )}

                            {/* Accepted Status Button (Only shown if already accepted) */}
                            {isAccepted && (
                              <View
                                style={[
                                  styles.acceptedBtn,
                                  { backgroundColor: colors.success + '20' },
                                ]}
                              >
                                <Icon source={checkCircleBold} size={16} color={colors.success} />
                                <Text style={[styles.acceptBtnText, { color: colors.success }]}>
                                  {i18n.t('chat.quoteStatus.accepted')}
                                </Text>
                              </View>
                            )}
                          </View>

                          {/* Secure Web Payment / Checkout Notice */}
                          {!isAccepted && (
                            <View
                              style={[
                                styles.secureNoticeBox,
                                { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                              ]}
                            >
                              <View
                                style={[
                                  styles.secureShieldWrap,
                                  { backgroundColor: colors.primary + '18' },
                                ]}
                              >
                                <Icon source={shieldBold} size={14} color={colors.primary} />
                              </View>
                              <Text style={[styles.secureNoticeText, { color: colors.textMuted }]}>
                                <Text style={{ fontFamily: fonts.bold, color: colors.text }}>
                                  {t('customerMsg.securePayment')}{' '}
                                </Text>
                                {t('customerMsg.securePaymentText')}
                              </Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                );
              })()}
              </FadeUp>
            )}

            {/* TAB 3: REPAIRMAN INFO (Direct Message Quotations) */}
            {activeTabKey === 'repairman' && (
              <FadeUp duration={400}>
                <View
                  style={[
                    styles.repairmanCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.repairmanHeader}>
                    {job.repairman?.avatar ? (
                      <Image
                        source={{ uri: job.repairman.avatar }}
                        style={[
                          styles.avatarCircle,
                          {
                            borderWidth: 1.5,
                            borderColor: colors.avatarBorder,
                          },
                        ]}
                      />
                    ) : (
                      <View
                        style={[
                          styles.avatarCircle,
                          {
                            backgroundColor: colors.primary + '20',
                            borderWidth: 1.5,
                            borderColor: colors.avatarBorder,
                          },
                        ]}
                      >
                        <Text style={[styles.avatarText, { color: colors.primary }]}>
                          {upper(job.repairman?.name?.charAt(0) || '') || 'R'}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[styles.repairmanName, { color: colors.text }]}>
                        {job.repairman?.name || t('chat.technician')}
                      </Text>
                      <Text style={[styles.repairmanShop, { color: colors.textMuted }]}>
                        {job.repairman?.shopName || ''}
                      </Text>
                      {Number(job.repairman?.rating) > 0 && (
                        <View style={styles.offerRatingRow}>
                          <Icon source={starExtra} size={14} color="#f59e0b" />
                          <Text style={[styles.offerRatingText, { color: colors.text }]}>
                            {Number(job.repairman?.rating).toFixed(1)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  {Boolean(job.repairman?.city) && (
                    <View style={styles.statItem}>
                      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('customer.cityArea2')}</Text>
                      <Text style={[styles.statValue, { color: colors.text }]}>
                        {job.repairman.city}
                      </Text>
                    </View>
                  )}

                  {Boolean(job.repairman?.phone) && (
                    <View style={[styles.statItem, { marginTop: 6 }]}>
                      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('customer.contact2')}</Text>
                      <Text style={[styles.statValue, { color: colors.text }]}>
                        {job.repairman.phone}
                      </Text>
                    </View>
                  )}

                  <Button
                    title={t('customer.chatWithTechnician')}
                    icon={sendBold}
                    iconPosition="left"
                    size="md"
                    variant="primary"
                    fullWidth
                    onPress={() =>
                      handleStartChatWithTech(
                        job.repairman?.id,
                        job.repairman?.name || i18n.t('chat.technician'),
                        job.repairman?.avatar,
                      )
                    }
                    style={{ marginTop: 16 }}
                    contentStyle={{ paddingHorizontal: 16, height: 44 }}
                    textStyle={{ fontSize: 14, fontFamily: fonts.bold }}
                  />
                </View>
              </FadeUp>
            )}

            {/* TAB: BOOKING DETAILS */}
            {activeTabKey === 'booking' && (
              <FadeUp duration={400}>
                <View
                  style={[
                    styles.bookingCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.bookingCardHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 0 }]}>
                      {t('customer.bookingOverview')}
                    </Text>
                    <View
                      style={[
                        styles.offerStatusPill,
                        { backgroundColor: colors.primary + '15' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.offerStatusText,
                          { color: colors.primary },
                        ]}
                      >
                        {statusLabel(job.booking?.status || job.status || 'scheduled')}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  {/* Assigned Repair Technician Info */}
                  <View
                    style={[
                      styles.bookingTechCard,
                      { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                    ]}
                  >
                    <View style={styles.repairmanHeader}>
                      {job.repairman?.avatar ? (
                        <Image
                          source={{ uri: job.repairman.avatar }}
                          style={[
                            styles.avatarCircle,
                            { borderWidth: 1.5, borderColor: colors.avatarBorder },
                          ]}
                        />
                      ) : (
                        <View
                          style={[
                            styles.avatarCircle,
                            {
                              backgroundColor: colors.primary + '20',
                              borderWidth: 1.5,
                              borderColor: colors.avatarBorder,
                            },
                          ]}
                        >
                          <Text style={[styles.avatarText, { color: colors.primary }]}>
                            {upper(job.repairman?.name?.charAt(0) || '') || 'T'}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[styles.repairmanName, { color: colors.text }]}>
                          {job.repairman?.name || tx(job.selectedOffer?.repairmanName) || ''}
                        </Text>
                        <Text style={[styles.repairmanShop, { color: colors.textMuted }]}>
                          {job.repairman?.shopName || job.selectedOffer?.shopName || ''}
                        </Text>
                        {Number(job.repairman?.rating || job.selectedOffer?.rating) > 0 && (
                          <View style={styles.offerRatingRow}>
                            <Icon source={starExtra} size={14} color="#f59e0b" />
                            <Text style={[styles.offerRatingText, { color: colors.text }]}>
                              {Number(job.repairman?.rating || job.selectedOffer?.rating).toFixed(1)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Chat with technician button */}
                    <Button
                      title={t('customer.chatWithTechnician')}
                      icon={sendBold}
                      iconPosition="left"
                      size="sm"
                      variant="outline"
                      fullWidth
                      onPress={() =>
                        handleStartChatWithTech(
                          job.repairman?.id || job.selectedOffer?.repairmanId || '',
                          job.repairman?.name || tx(job.selectedOffer?.repairmanName) || i18n.t('chat.technician'),
                          job.repairman?.avatar || undefined,
                        )
                      }
                      style={{ marginTop: 4 }}
                      contentStyle={{ paddingHorizontal: 16, height: 40 }}
                      textStyle={{ fontSize: 13, fontFamily: fonts.bold }}
                    />
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  {/* Scheduled Date */}
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                      {t('customer.scheduledDate')}
                    </Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {job.booking?.bookingDetails?.scheduledDate
                        ? new Date(job.booking.bookingDetails.scheduledDate).toLocaleDateString(getLocaleTag(), {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : t('customer.toBeScheduled')}
                    </Text>
                  </View>

                  {/* Estimated Completion */}
                  {Boolean(job.booking?.bookingDetails?.estimatedCompletion) && (
                    <View style={[styles.statItem, { marginTop: 10 }]}>
                      <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                        {t('customer.estimatedCompletion')}
                      </Text>
                      <Text style={[styles.statValue, { color: colors.text }]}>
                        {new Date(job.booking.bookingDetails.estimatedCompletion).toLocaleDateString(getLocaleTag(), {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  )}

                  {/* Service Type */}
                  <View style={[styles.statItem, { marginTop: 10 }]}>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                      {t('customer.serviceType2')}
                    </Text>
                    <Text
                      style={[
                        styles.statValue,
                        { color: colors.text, textTransform: 'capitalize' },
                      ]}
                    >
                      {serviceTypeLabel(job.booking?.bookingDetails?.serviceType || job.servicePreference || 'drop-off')}
                    </Text>
                  </View>

                  {/* Pricing Breakdown Container */}
                  <View
                    style={[
                      styles.priceBreakdownBox,
                      { backgroundColor: colors.surfaceAlt, borderColor: colors.border, marginTop: 14 },
                    ]}
                  >
                    <Text style={[styles.breakdownHeader, { color: colors.text }]}>
                      {t('customer.pricingBreakdown')}
                    </Text>

                    <View style={styles.breakdownRow}>
                      <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>
                        {t('customer.baseLabor')}
                      </Text>
                      <Text style={[styles.breakdownVal, { color: colors.text }]}>
                        {formatMoney(job.booking?.bookingDetails?.pricing?.basePrice || job.selectedOffer?.basePrice || 0, job.booking?.bookingDetails?.pricing?.currency || 'TRY')}
                      </Text>
                    </View>

                    {Number(
                      job.booking?.bookingDetails?.pricing?.partsPrice ||
                        job.selectedOffer?.partsEstimate ||
                        0,
                    ) > 0 && (
                      <View style={styles.breakdownRow}>
                        <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>
                          {t('customer.partsCost')}
                        </Text>
                        <Text style={[styles.breakdownVal, { color: colors.text }]}>
                          {formatMoney(job.booking?.bookingDetails?.pricing?.partsPrice || job.selectedOffer?.partsEstimate || 0, job.booking?.bookingDetails?.pricing?.currency || 'TRY')}
                        </Text>
                      </View>
                    )}

                    {Number(
                      job.booking?.bookingDetails?.pricing?.serviceCharge ||
                        job.selectedOffer?.pickupCharge ||
                        0,
                    ) > 0 && (
                      <View style={styles.breakdownRow}>
                        <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>
                          {t('customer.servicePickupFee')}
                        </Text>
                        <Text style={[styles.breakdownVal, { color: colors.text }]}>
                          +{formatMoney(job.booking?.bookingDetails?.pricing?.serviceCharge || job.selectedOffer?.pickupCharge || 0, job.booking?.bookingDetails?.pricing?.currency || 'TRY')}
                        </Text>
                      </View>
                    )}

                    <View style={[styles.breakdownDivider, { backgroundColor: colors.border }]} />

                    <View style={styles.breakdownRow}>
                      <Text style={[styles.totalLabel, { color: colors.text }]}>
                        {t('customer.totalPrice')}
                      </Text>
                      <Text style={[styles.totalVal, { color: colors.primary }]}>
                        {formatMoney(job.booking?.bookingDetails?.pricing?.totalAmount || job.selectedOffer?.finalTotal || 0, job.booking?.bookingDetails?.pricing?.currency || 'TRY')}
                      </Text>
                    </View>
                  </View>

                  {/* Warranty info: only what the backend sends */}
                  {(() => {
                    const warranty = job.booking?.bookingDetails?.warranty;
                    const label =
                      typeof warranty === 'string'
                        ? warranty
                        : warranty?.duration
                        ? i18n.t('customerMsg.warrantyDaysLabel', { days: warranty.duration })
                        : tx(job.selectedOffer?.warrantyLabel);
                    return label ? (
                      <View style={[styles.statItem, { marginTop: 12 }]}>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>{i18n.t('customer.warrantyProtection')}</Text>
                        <Text style={[styles.statValue, { color: colors.primary }]}>{label}</Text>
                      </View>
                    ) : null;
                  })()}

                  {/* Service / Pickup Address */}
                  {Boolean(
                    job.booking?.bookingDetails?.location?.address ||
                      job.booking?.pickUpAddress ||
                      job.locationLabel,
                  ) && (
                    <View style={styles.addressBlock}>
                      <Text style={[styles.addressLabel, { color: colors.textMuted }]}>
                        {t('customer.servicePickupAddress2')}
                      </Text>
                      <View
                        style={[
                          styles.addressBox,
                          {
                            backgroundColor: colors.surfaceAlt,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[styles.addressText, { color: colors.text }]}
                          numberOfLines={expandedAddress ? undefined : 2}
                        >
                          {job.booking?.bookingDetails?.location?.address ||
                            job.booking?.pickUpAddress ||
                            job.locationLabel}
                        </Text>

                        {String(
                          job.booking?.bookingDetails?.location?.address ||
                            job.booking?.pickUpAddress ||
                            job.locationLabel,
                        ).length > 55 && (
                          <Pressable
                            onPress={() => setExpandedAddress(!expandedAddress)}
                            hitSlop={8}
                            style={styles.seeMoreBtn}
                          >
                            <Text style={[styles.seeMoreText, { color: colors.primary }]}>
                              {expandedAddress ? t('customer.seeLess2') : t('customer.seeMore2')}
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Timeline Milestones (if available) */}
                  {Boolean(job.booking?.timeline) && (
                    <View style={styles.timelineSection}>
                      <Text style={[styles.addressLabel, { color: colors.textMuted, marginTop: 14 }]}>
                        {t('customer.serviceTimeline')}
                      </Text>
                      <View
                        style={[
                          styles.timelineBox,
                          { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                        ]}
                      >
                        {job.booking.timeline.confirmedAt && (
                          <View style={styles.timelineRow}>
                            <View style={[styles.timelineDot, { backgroundColor: colors.success }]} />
                            <Text style={[styles.timelineText, { color: colors.text }]}>
                              {t('customerMsg.timeline.confirmed', { date: new Date(job.booking.timeline.confirmedAt).toLocaleDateString(getLocaleTag()) })}
                            </Text>
                          </View>
                        )}
                        {job.booking.timeline.scheduledAt && (
                          <View style={styles.timelineRow}>
                            <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
                            <Text style={[styles.timelineText, { color: colors.text }]}>
                              {t('customerMsg.timeline.scheduled', { date: new Date(job.booking.timeline.scheduledAt).toLocaleDateString(getLocaleTag()) })}
                            </Text>
                          </View>
                        )}
                        {job.booking.timeline.startedAt && (
                          <View style={styles.timelineRow}>
                            <View style={[styles.timelineDot, { backgroundColor: '#f59e0b' }]} />
                            <Text style={[styles.timelineText, { color: colors.text }]}>
                              {t('customerMsg.timeline.started', { date: new Date(job.booking.timeline.startedAt).toLocaleDateString(getLocaleTag()) })}
                            </Text>
                          </View>
                        )}
                        {job.booking.timeline.completedAt && (
                          <View style={styles.timelineRow}>
                            <View style={[styles.timelineDot, { backgroundColor: '#8b5cf6' }]} />
                            <Text style={[styles.timelineText, { color: colors.text }]}>
                              {t('customerMsg.timeline.completed', { date: new Date(job.booking.timeline.completedAt).toLocaleDateString(getLocaleTag()) })}
                            </Text>
                          </View>
                        )}
                        {job.booking.timeline.deliveredAt && (
                          <View style={styles.timelineRow}>
                            <View style={[styles.timelineDot, { backgroundColor: colors.success }]} />
                            <Text style={[styles.timelineText, { color: colors.text }]}>
                              {t('customerMsg.timeline.delivered', { date: new Date(job.booking.timeline.deliveredAt).toLocaleDateString(getLocaleTag()) })}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Active Dispute Banner */}
                  {hasDispute && (
                    <View
                      style={[
                        styles.bookingDisputeNotice,
                        { backgroundColor: '#fef3c7', borderColor: '#fde68a' },
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Icon source={shieldBold} size={18} color="#b45309" />
                        <Text style={[styles.bookingDisputeTitle, { color: '#b45309' }]}>
                          {t('customer.caseUnderDisputeMediation')}
                        </Text>
                      </View>
                      <Text style={[styles.bookingDisputeDesc, { color: '#92400e' }]}>
                        {t('customer.paymentIsHeldSecurelyIn')}
                      </Text>
                      <Button
                        title={t('customer.viewDisputeDetails')}
                        size="sm"
                        onPress={() =>
                          navigation.navigate('DisputeDetail', {
                            jobId: job?.id,
                            job,
                            disputeId:
                              job?.booking?.disputeId ||
                              (job as any)?.disputeId ||
                              job?.dispute?._id ||
                              job?.dispute?.id,
                          })
                        }
                        style={{ marginTop: 10 }}
                      />
                    </View>
                  )}

                  {/* Delivery Handover Notice when repair completed but not yet marked delivered */}
                  {isCompletedWaitingDelivery && !isDelivered && !hasDispute && (
                    <View
                      style={[
                        styles.deliveryNoticeBox,
                        { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                      ]}>
                      <Icon source={infoCircleBold} size={16} color={colors.primary} />
                      <Text style={[styles.deliveryNoticeText, { color: colors.textMuted }]}>
                        {t('customer.repairCompletedByTechnicianReview')}
                      </Text>
                    </View>
                  )}

                  {/* Device Delivered: Customer Close Job Banner */}
                  {isDelivered && job?.booking?.status !== 'closed' && (
                    <View
                      style={[
                        styles.deliveryNoticeBox,
                        { backgroundColor: colors.surfaceAlt, borderColor: colors.border, marginTop: 12 },
                      ]}>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 0, fontSize: 13 }]}>
                          {t('customer.deviceDelivered')}
                        </Text>
                        <Text style={[styles.deliveryNoticeText, { color: colors.textMuted }]}>
                          {t('customer.pleaseInspectYourDeviceIf')}
                        </Text>
                      </View>
                      <Button
                        title={isClosingJob ? t('customer.closing') : t('customer.closeJob')}
                        size="sm"
                        variant="soft"
                        loading={isClosingJob}
                        disabled={isClosingJob}
                        onPress={handleCloseJob}
                        style={{ alignSelf: 'center', minWidth: 90 }}
                        contentStyle={{ paddingHorizontal: 10 }}
                        textStyle={{ fontSize: 13 }}
                      />
                    </View>
                  )}

                  {/* Review Submitted Status (Inside Booking Tab Only) */}
                  {isReviewed && (
                    <View
                      style={[
                        styles.reviewedSuccessBanner,
                        { backgroundColor: colors.surfaceAlt, borderColor: colors.border, marginTop: 14 },
                      ]}
                    >
                      <Icon source={checkCircleBold} size={16} color={colors.success} />
                      <Text style={[styles.reviewedSuccessText, { color: colors.text }]}>
                        {t('customer.reviewSubmittedForThisRepair')}
                      </Text>
                    </View>
                  )}

                  {/* Action: Write Review */}
                  {canReview && (
                    <View style={styles.bookingActionsRow}>
                      <Button
                        title={t('reviewModal.title')}
                        size="md"
                        variant="filled"
                        icon={starExtra}
                        iconPosition="left"
                        onPress={handleOpenReviewModal}
                        fullWidth
                        contentStyle={{ paddingHorizontal: 16, height: 44 }}
                        textStyle={{ fontSize: 14, fontFamily: fonts.bold }}
                      />
                    </View>
                  )}

                  {/* Action: Report a Problem */}
                  {canReportProblem && (
                    <View style={styles.bookingActionsRow}>
                      <Button
                        title={t('dispute.reportProblem')}
                        size="md"
                        variant="soft"
                        onPress={() => setDisputeModalVisible(true)}
                        fullWidth
                        contentStyle={{ paddingHorizontal: 16, height: 44 }}
                        textStyle={{ fontSize: 14, fontFamily: fonts.bold }}
                      />
                    </View>
                  )}
                </View>
              </FadeUp>
            )}
          </>
        )}
      </ScrollView>

      {/* Modern Animated Alert / Feedback Modal (No cheap Alert.alert) */}
      <AlertModal
        visible={alertState.visible}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        buttonText={t('common.okay')}
        onButtonPress={dismissAlert}
        onClose={dismissAlert}
      />

      <CreateDisputeModal
        visible={disputeModalVisible}
        role="customer"
        isSubmitting={isSubmittingDispute}
        onClose={() => setDisputeModalVisible(false)}
        onSubmit={handleSubmitDispute}
      />

      <WriteReviewModal
        visible={reviewModalVisible}
        job={targetJobForReview}
        isSubmitting={isSubmittingReview}
        onClose={() => setReviewModalVisible(false)}
        onSubmit={handleSubmitReview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: { width: 110, height: 59 },
  headerIcons: { flexDirection: 'row', gap: 12 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  badgeText: { color: '#fff', fontSize: 10, fontFamily: fonts.bold },

  body: { paddingHorizontal: 20, paddingTop: 6 },
  backWrap: { alignSelf: 'flex-start' },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  title: { fontFamily: fonts.bold, fontSize: 18, marginTop: 14 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontFamily: fonts.bold, fontSize: 11 },

  tabsWrap: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginTop: 16,
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: { fontSize: 14 },

  price: { fontFamily: fonts.bold, fontSize: 16 },
  muted: { fontFamily: fonts.regular, fontSize: 12, marginTop: 4 },
  sectionTitle: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 14, marginTop: 18 },
  text: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, marginTop: 6 },
  link: { fontFamily: fonts.bold, fontSize: 13, marginTop: 4 },

  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  pill: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  singlePill: { alignSelf: 'flex-start', marginTop: 8 },
  pillText: { fontFamily: fonts.regular, fontSize: 12 },

  statsBox: { borderRadius: 12, padding: 14, gap: 10, marginTop: 8 },
  statItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 13 },
  statValue: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 13 },

  divider: { height: 1, marginVertical: 14 },
  footerText: { fontFamily: fonts.regular, fontSize: 12 },

  emptyOffersCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  emptyOffersTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    marginTop: 4,
  },
  emptyOffersText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },

  offersList: {
    gap: 14,
    marginTop: 4,
  },
  offerCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  offerTechInfo: {
    flex: 1,
    gap: 2,
  },
  offerTechName: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  offerShopName: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  offerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  offerRatingText: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  offerStatusPill: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  offerStatusText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    textTransform: 'capitalize',
  },

  offerBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  miniBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  miniBadgeText: {
    fontFamily: fonts.regular,
    fontSize: 11,
  },

  offerDescBox: {
    marginTop: 2,
  },
  offerDescText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
  },

  timingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 8,
    marginTop: 4,
  },
  timingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timingLabel: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  timingValue: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 12,
  },

  partsSection: {
    marginTop: 4,
  },
  partsTitle: {
    fontFamily: fonts.bold,
    fontSize: 12,
    marginBottom: 6,
  },
  partsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  partItem: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  partName: {
    fontFamily: fonts.regular,
    fontSize: 11,
    maxWidth: 120,
  },
  partPrice: {
    fontFamily: fonts.bold,
    fontSize: 11,
  },

  priceBreakdownBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 6,
    marginTop: 4,
  },
  breakdownHeader: {
    fontFamily: fonts.bold,
    fontSize: 13,
    marginBottom: 2,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  breakdownVal: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  breakdownDivider: {
    height: 1,
    marginVertical: 4,
  },
  totalLabel: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  totalVal: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },

  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  chatBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  chatBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  acceptBtn: {
    flex: 1.2,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptedBtn: {
    flex: 1.2,
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  acceptBtnText: {
    flexShrink: 1,
    color: '#fff',
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  secureNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginTop: 2,
  },
  secureShieldWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secureNoticeText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },

  repairmanCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  repairmanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: 20,
  },
  repairmanName: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  repairmanShop: {
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  fullChatBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  bookingCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  bookingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressBlock: {
    marginTop: 14,
  },
  addressLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    marginBottom: 6,
  },
  addressBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  addressText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  seeMoreBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  seeMoreText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  bookingDisputeNotice: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginTop: 16,
  },
  bookingDisputeTitle: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  bookingDisputeDesc: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  bookingActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    alignItems: 'center',
  },
  deliveryNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 14,
  },
  deliveryNoticeText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  reviewedSuccessBanner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    marginBottom: 4,
  },
  reviewedSuccessText: {
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  bookingTechCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
    marginTop: 4,
  },
  timelineSection: {
    marginTop: 6,
  },
  timelineBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    marginTop: 6,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineText: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
  },
});
