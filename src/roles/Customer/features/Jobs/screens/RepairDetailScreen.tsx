import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import CtiLoader from '@/components/CtiLoader';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  checkCircleBold,
  clockBold,
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
import BookingModal from '../components/BookingModal';

const DESCRIPTION_PREVIEW = 150;

export default function RepairDetailScreen({ navigation, route }: any) {
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
  const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null);

  // Custom Modal States (no cheap Alert.alert)
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedOfferForBooking, setSelectedOfferForBooking] = useState<NormalizedOffer | null>(null);
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

  const fetchJobDetail = async () => {
    if (!jobId) {
      setLoading(false);
      return;
    }
    try {
      const data = await customerJobApi.getMyJobDetail(jobId);
      setJob(data);
    } catch {
      setJob(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobDetail();
  }, [jobId]);

  // Dynamic Tabs based on job type
  const availableTabs = useMemo(() => {
    if (!job) return [{ key: 'details', label: 'Details' }];

    const tabs: Array<{ key: string; label: string }> = [
      { key: 'details', label: 'Details' },
    ];

    if (job.tag === 'job_posting') {
      const offersCount = job.offers?.length || 0;
      if (job.selectedOffer) {
        tabs.push({ key: 'offers', label: 'Selected Offer' });
      } else {
        tabs.push({ key: 'offers', label: `Offers (${offersCount})` });
      }
    } else if (job.tag === 'direct_message') {
      tabs.push({ key: 'repairman', label: 'Repairman Info' });
    }

    if (job.booking) {
      tabs.push({ key: 'booking', label: 'Booking' });
    }

    return tabs;
  }, [job]);

  // Keep active tab valid if tabs change
  useEffect(() => {
    if (!availableTabs.some(t => t.key === activeTabKey)) {
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
        title: 'Notice',
        message: 'Technician contact details not found.',
      });
      return;
    }

    try {
      setStartingChatId(repairmanId);
      const res = await startChat({ repairmanId, jobId: job?.id });
      const targetName = res.chat?.user?.name || res.chat?.repairman?.name || repairmanName;
      const targetAvatar =
        res.chat?.user?.avatar || res.chat?.repairman?.avatar || repairmanAvatar;

      navigation.navigate('ChatDetail', {
        chatId: res.chat?._id || res.chat?.chatId,
        participantId: repairmanId,
        participantName: targetName,
        participantAvatar: targetAvatar,
      });
    } catch {
      navigation.navigate('ChatList');
    } finally {
      setStartingChatId(null);
    }
  };

  // Open modern booking modal when customer taps Accept Offer
  const handleAcceptOffer = (offer: NormalizedOffer) => {
    setSelectedOfferForBooking(offer);
    setBookingModalVisible(true);
  };

  // Submit booking from modern BookingModal
  const handleSubmitBooking = async (bookingData: {
    serviceType: string;
    scheduledDate: string;
    specialInstructions: string;
    pickUpAddress?: string;
  }) => {
    if (!job?.id || !selectedOfferForBooking?.id) return;

    try {
      setAcceptingOfferId(selectedOfferForBooking.id);
      const result = await customerJobApi.selectOffer(
        job.id,
        selectedOfferForBooking.id,
        bookingData,
      );

      setBookingModalVisible(false);

      if (result.success) {
        setAlertState({
          visible: true,
          type: 'success',
          title: 'Booking Confirmed!',
          message:
            result.message ||
            `Your repair service has been successfully booked with "${selectedOfferForBooking.repairmanName}".`,
        });
        await fetchJobDetail();
      } else {
        setAlertState({
          visible: true,
          type: 'warning',
          title: 'Booking Notice',
          message: result.message || 'Please proceed to confirm booking details and payment.',
        });
      }
    } catch (err: any) {
      setBookingModalVisible(false);
      setAlertState({
        visible: true,
        type: 'error',
        title: 'Booking Error',
        message: err?.message || 'Could not complete booking. Please try again.',
      });
    } finally {
      setAcceptingOfferId(null);
    }
  };

  const toggleOfferDesc = (id: string) => {
    setExpandedOfferDesc(prev => ({ ...prev, [id]: !prev[id] }));
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
            <CtiLoader size="lg" text="Loading repair job details..." />
          </View>
        ) : !job ? (
          <View style={{ paddingVertical: 80, alignItems: 'center', paddingHorizontal: 24 }}>
            <Icon source={packageBold} size={48} color={colors.textMuted} />
            <Text style={[styles.title, { color: colors.text, textAlign: 'center', marginTop: 12 }]}>
              Repair Job Not Found
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
              The requested repair job details could not be found or loaded.
            </Text>
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
              <Text style={{ color: '#fff', fontFamily: fonts.bold }}>Go Back</Text>
            </Squeeze>
          </View>
        ) : (
          <>
            {/* Title & Chips */}
            <Text style={[styles.title, { color: colors.text }]}>{job.title}</Text>

            <View style={styles.chips}>
              {job.chips.map((chip, idx) => (
                <View
                  key={`${chip}-${idx}`}
                  style={[styles.chip, { borderColor: colors.primary, backgroundColor: colors.primary + '10' }]}
                >
                  <Text style={[styles.chipText, { color: colors.primary }]}>{chip}</Text>
                </View>
              ))}
            </View>

            {/* Dynamic Tabs */}
            <View style={[styles.tabsWrap, { borderColor: colors.border }]}>
              {availableTabs.map(t => {
                const active = t.key === activeTabKey;
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => setActiveTabKey(t.key)}
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
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* TAB 1: DETAILS */}
            {activeTabKey === 'details' && (
              <FadeUp duration={400}>
                <Text style={[styles.price, { color: colors.text }]}>{job.priceLabel}</Text>
                <Text style={[styles.muted, { color: colors.textMuted }]}>{job.urgencyNote}</Text>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
                <Text
                  style={[styles.text, { color: colors.textMuted }]}
                  numberOfLines={expandedDesc ? undefined : 3}
                >
                  {job.description}
                </Text>
                {job.description.length > DESCRIPTION_PREVIEW && (
                  <Pressable onPress={() => setExpandedDesc(!expandedDesc)} hitSlop={6}>
                    <Text style={[styles.link, { color: colors.primary }]}>
                      {expandedDesc ? 'Read Less' : 'Read More'}
                    </Text>
                  </Pressable>
                )}

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Services Required</Text>
                <View style={styles.pills}>
                  {job.services.map((service, idx) => (
                    <View key={`${service}-${idx}`} style={[styles.pill, { borderColor: colors.primary }]}>
                      <Text style={[styles.pillText, { color: colors.primary }]}>{service}</Text>
                    </View>
                  ))}
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Location</Text>
                <Text style={[styles.text, { color: colors.textMuted }]}>{job.locationNote}</Text>
                <Text style={[styles.link, { color: colors.primary }]}>{job.locationLabel}</Text>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Service Preference</Text>
                <View style={[styles.pill, styles.singlePill, { borderColor: colors.primary }]}>
                  <Text style={[styles.pillText, { color: colors.primary }]}>
                    {job.servicePreference}
                  </Text>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Job Overview</Text>
                <View style={[styles.statsBox, { backgroundColor: colors.surfaceAlt }]}>
                  {job.stats.map(stat => (
                    <View key={stat.label} style={styles.statItem}>
                      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
                      <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
                    </View>
                  ))}
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.footerText, { color: colors.textMuted }]}>
                  Created: {job.createdAt}
                </Text>
              </FadeUp>
            )}

            {/* TAB 2: OFFERS (Job Postings) */}
            {activeTabKey === 'offers' && (
              <FadeUp duration={400}>
                {!job.offers || job.offers.length === 0 ? (
                  <View
                    style={[
                      styles.emptyOffersCard,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                  >
                    <Icon source={toolExtra} size={36} color={colors.primary} />
                    <Text style={[styles.emptyOffersTitle, { color: colors.text }]}>
                      No Offers Available Yet
                    </Text>
                    <Text style={[styles.emptyOffersText, { color: colors.textMuted }]}>
                      Expert repair technicians are reviewing your job request. When a technician submits an offer, you will see their proposal, pricing breakdown, and warranty details right here!
                    </Text>
                  </View>
                ) : (
                  <View style={styles.offersList}>
                    {job.offers.map((offer: NormalizedOffer, idx: number) => {
                      const isAccepted =
                        offer.status === 'accepted' ||
                        job.selectedOffer?.id === offer.id ||
                        job.status === 'booked';
                      const isSubmitting = acceptingOfferId === offer.id;
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
                                {offer.repairmanName}
                              </Text>
                              <Text style={[styles.offerShopName, { color: colors.textMuted }]}>
                                @{offer.shopName}
                              </Text>
                            </View>

                            <View style={{ alignItems: 'flex-end', gap: 4 }}>
                              <View style={styles.offerRatingRow}>
                                <Icon source={starExtra} size={14} color="#f59e0b" />
                                <Text style={[styles.offerRatingText, { color: colors.text }]}>
                                  {offer.rating.toFixed(1)}
                                </Text>
                              </View>
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
                                  {isAccepted ? 'Accepted Offer' : offer.status || 'Active Offer'}
                                </Text>
                              </View>
                            </View>
                          </View>

                          {/* Quick Stats Badges */}
                          <View style={styles.offerBadgesRow}>
                            <View style={[styles.miniBadge, { backgroundColor: colors.surfaceAlt }]}>
                              <Text style={[styles.miniBadgeText, { color: colors.textMuted }]}>
                                💼 {offer.totalJobs} jobs
                              </Text>
                            </View>
                            <View style={[styles.miniBadge, { backgroundColor: colors.surfaceAlt }]}>
                              <Text style={[styles.miniBadgeText, { color: colors.textMuted }]}>
                                ✔ {offer.successRate}% success
                              </Text>
                            </View>
                            <View
                              style={[
                                styles.miniBadge,
                                { backgroundColor: colors.primary + '12' },
                              ]}
                            >
                              <Text style={[styles.miniBadgeText, { color: colors.primary }]}>
                                🛡 {offer.warrantyLabel}
                              </Text>
                            </View>
                            {offer.pickupAvailable && (
                              <View style={[styles.miniBadge, { backgroundColor: '#e0f2fe' }]}>
                                <Text style={[styles.miniBadgeText, { color: '#0369a1' }]}>
                                  🚗 Pickup ({offer.currency} {offer.pickupCharge})
                                </Text>
                              </View>
                            )}
                            {offer.homeService && (
                              <View style={[styles.miniBadge, { backgroundColor: '#dcfce7' }]}>
                                <Text style={[styles.miniBadgeText, { color: '#15803d' }]}>
                                  🏠 Home Service
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
                                {offer.description}
                              </Text>
                              {offer.description.length > 90 && (
                                <Pressable onPress={() => toggleOfferDesc(offer.id)} hitSlop={6}>
                                  <Text style={[styles.link, { color: colors.primary, fontSize: 12 }]}>
                                    {isExpanded ? 'Read Less' : 'Read More'}
                                  </Text>
                                </Pressable>
                              )}
                            </View>
                          )}

                          {/* Availability & Timing Row */}
                          <View style={[styles.timingRow, { borderColor: colors.border }]}>
                            <View style={styles.timingItem}>
                              <Text style={[styles.timingLabel, { color: colors.textMuted }]}>
                                Can Start:
                              </Text>
                              <Text style={[styles.timingValue, { color: colors.text }]}>
                                {offer.startLabel}
                              </Text>
                            </View>
                            <View style={styles.timingItem}>
                              <Text style={[styles.timingLabel, { color: colors.textMuted }]}>
                                Estimated Time:
                              </Text>
                              <Text style={[styles.timingValue, { color: colors.text }]}>
                                {offer.timeLabel}
                              </Text>
                            </View>
                          </View>

                          {/* Required Parts List (if any) */}
                          {offer.requiredParts.length > 0 && (
                            <View style={styles.partsSection}>
                              <Text style={[styles.partsTitle, { color: colors.text }]}>
                                Required Replacement Parts:
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
                                      {part.name}
                                    </Text>
                                    <Text style={[styles.partPrice, { color: colors.primary }]}>
                                      {offer.currency} {part.price.toLocaleString()}
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
                              Price Breakdown
                            </Text>

                            <View style={styles.breakdownRow}>
                              <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>
                                Labor Cost:
                              </Text>
                              <Text style={[styles.breakdownVal, { color: colors.text }]}>
                                {offer.currency} {offer.basePrice.toLocaleString()}
                              </Text>
                            </View>

                            {offer.partsEstimate > 0 && (
                              <View style={styles.breakdownRow}>
                                <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>
                                  Parts Cost:
                                </Text>
                                <Text style={[styles.breakdownVal, { color: colors.text }]}>
                                  {offer.currency} {offer.partsEstimate.toLocaleString()}
                                </Text>
                              </View>
                            )}

                            {offer.pickupAvailable && offer.pickupCharge > 0 && (
                              <View style={styles.breakdownRow}>
                                <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>
                                  Pickup Fee:
                                </Text>
                                <Text style={[styles.breakdownVal, { color: colors.text }]}>
                                  +{offer.currency} {offer.pickupCharge.toLocaleString()}
                                </Text>
                              </View>
                            )}

                            <View style={[styles.breakdownDivider, { backgroundColor: colors.border }]} />

                            <View style={styles.breakdownRow}>
                              <Text style={[styles.totalLabel, { color: colors.text }]}>
                                Total Amount:
                              </Text>
                              <Text style={[styles.totalVal, { color: colors.primary }]}>
                                {offer.currency} {offer.finalTotal.toLocaleString()}
                              </Text>
                            </View>
                          </View>

                          {/* Action Buttons */}
                          <View style={styles.actionsRow}>
                            {/* Chat Button */}
                            <Squeeze
                              onPress={() =>
                                handleStartChatWithTech(
                                  offer.repairmanId,
                                  offer.repairmanName,
                                )
                              }
                              disabled={isStartingChat}
                              style={[
                                styles.chatBtn,
                                { borderColor: colors.primary, backgroundColor: colors.surface },
                              ]}
                            >
                              {isStartingChat ? (
                                <ActivityIndicator size="small" color={colors.primary} />
                              ) : (
                                <>
                                  <Icon source={sendBold} size={16} color={colors.primary} />
                                  <Text style={[styles.chatBtnText, { color: colors.primary }]}>
                                    Chat
                                  </Text>
                                </>
                              )}
                            </Squeeze>

                            {/* Accept Offer Button */}
                            {isAccepted ? (
                              <View
                                style={[
                                  styles.acceptedBtn,
                                  { backgroundColor: colors.success + '20' },
                                ]}
                              >
                                <Icon source={checkCircleBold} size={16} color={colors.success} />
                                <Text style={[styles.acceptBtnText, { color: colors.success }]}>
                                  Accepted
                                </Text>
                              </View>
                            ) : (
                              <Squeeze
                                onPress={() => handleAcceptOffer(offer)}
                                disabled={isSubmitting}
                                style={[
                                  styles.acceptBtn,
                                  { backgroundColor: colors.primary },
                                ]}
                              >
                                {isSubmitting ? (
                                  <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                  <Text style={styles.acceptBtnText}>Accept Offer</Text>
                                )}
                              </Squeeze>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
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
                    <View
                      style={[
                        styles.avatarCircle,
                        { backgroundColor: colors.primary + '20' },
                      ]}
                    >
                      <Text style={[styles.avatarText, { color: colors.primary }]}>
                        {job.repairman?.name?.charAt(0)?.toUpperCase() || 'R'}
                      </Text>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[styles.repairmanName, { color: colors.text }]}>
                        {job.repairman?.name || 'Certified Repair Technician'}
                      </Text>
                      <Text style={[styles.repairmanShop, { color: colors.textMuted }]}>
                        {job.repairman?.shopName || 'Certified Repair Center'}
                      </Text>
                      <View style={styles.offerRatingRow}>
                        <Icon source={starExtra} size={14} color="#f59e0b" />
                        <Text style={[styles.offerRatingText, { color: colors.text }]}>
                          {Number(job.repairman?.rating || 5.0).toFixed(1)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  {Boolean(job.repairman?.city) && (
                    <View style={styles.statItem}>
                      <Text style={[styles.statLabel, { color: colors.textMuted }]}>City / Area:</Text>
                      <Text style={[styles.statValue, { color: colors.text }]}>
                        {job.repairman.city}
                      </Text>
                    </View>
                  )}

                  {Boolean(job.repairman?.phone) && (
                    <View style={[styles.statItem, { marginTop: 6 }]}>
                      <Text style={[styles.statLabel, { color: colors.textMuted }]}>Contact:</Text>
                      <Text style={[styles.statValue, { color: colors.text }]}>
                        {job.repairman.phone}
                      </Text>
                    </View>
                  )}

                  <Squeeze
                    onPress={() =>
                      handleStartChatWithTech(
                        job.repairman?.id,
                        job.repairman?.name || 'Technician',
                        job.repairman?.avatar,
                      )
                    }
                    style={[
                      styles.fullChatBtn,
                      { backgroundColor: colors.primary, marginTop: 16 },
                    ]}
                  >
                    <Icon source={sendBold} size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontFamily: fonts.bold, fontSize: 14 }}>
                      Chat with Technician
                    </Text>
                  </Squeeze>
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
                      Booking Overview
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
                        {job.booking?.status || 'Scheduled'}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  {/* Scheduled Date */}
                  {Boolean(job.booking?.bookingDetails?.scheduledDate) && (
                    <View style={styles.statItem}>
                      <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                        Scheduled Date:
                      </Text>
                      <Text style={[styles.statValue, { color: colors.text }]}>
                        {new Date(
                          job.booking.bookingDetails.scheduledDate,
                        ).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                  )}

                  {/* Service Type */}
                  {Boolean(job.booking?.bookingDetails?.serviceType) && (
                    <View style={[styles.statItem, { marginTop: 10 }]}>
                      <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                        Service Type:
                      </Text>
                      <Text
                        style={[
                          styles.statValue,
                          { color: colors.text, textTransform: 'capitalize' },
                        ]}
                      >
                        {String(job.booking.bookingDetails.serviceType).replace('-', ' ')}
                      </Text>
                    </View>
                  )}

                  {/* Pricing */}
                  {Boolean(job.booking?.bookingDetails?.pricing?.totalAmount) && (
                    <View style={[styles.statItem, { marginTop: 10 }]}>
                      <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                        Total Price:
                      </Text>
                      <Text style={[styles.statValue, { color: colors.primary }]}>
                        {job.booking.bookingDetails.pricing.currency || 'TRY'}{' '}
                        {job.booking.bookingDetails.pricing.totalAmount.toLocaleString()}
                      </Text>
                    </View>
                  )}

                  {/* Service / Pickup Address - Clean line break + dedicated full-width box + See More / See Less */}
                  {Boolean(
                    job.booking?.bookingDetails?.location?.address ||
                      job.booking?.pickUpAddress ||
                      job.locationLabel,
                  ) && (
                    <View style={styles.addressBlock}>
                      <Text style={[styles.addressLabel, { color: colors.textMuted }]}>
                        Service / Pickup Address:
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
                              {expandedAddress ? 'See Less' : 'See More'}
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              </FadeUp>
            )}
          </>
        )}
      </ScrollView>

      {/* Modern Booking Modal */}
      <BookingModal
        visible={bookingModalVisible}
        offer={selectedOfferForBooking}
        jobTitle={job?.title}
        onClose={() => {
          if (!acceptingOfferId) {
            setBookingModalVisible(false);
            setSelectedOfferForBooking(null);
          }
        }}
        onSubmit={handleSubmitBooking}
        isSubmitting={Boolean(acceptingOfferId)}
      />

      {/* Modern Animated Alert / Feedback Modal (No cheap Alert.alert) */}
      <AlertModal
        visible={alertState.visible}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        buttonText="Okay"
        onButtonPress={() => setAlertState(prev => ({ ...prev, visible: false }))}
        onClose={() => setAlertState(prev => ({ ...prev, visible: false }))}
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
  sectionTitle: { fontFamily: fonts.bold, fontSize: 14, marginTop: 18 },
  text: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, marginTop: 6 },
  link: { fontFamily: fonts.bold, fontSize: 13, marginTop: 4 },

  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  pill: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  singlePill: { alignSelf: 'flex-start', marginTop: 8 },
  pillText: { fontFamily: fonts.regular, fontSize: 12 },

  statsBox: { borderRadius: 12, padding: 14, gap: 10, marginTop: 8 },
  statItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { fontFamily: fonts.regular, fontSize: 13 },
  statValue: { fontFamily: fonts.bold, fontSize: 13 },

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
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  timingValue: {
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
    color: '#fff',
    fontFamily: fonts.bold,
    fontSize: 13,
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
});
