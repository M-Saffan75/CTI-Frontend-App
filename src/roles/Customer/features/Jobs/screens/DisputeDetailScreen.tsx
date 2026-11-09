import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  calendarBold,
  clockBold,
  commentDotsBold,
  infoCircleBold,
  mapPinBold,
  menuBold,
  packageBold,
  sendBold,
  shieldIcon,
  shoppingCartExtra,
  starExtra,
} from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import customerJobApi, {
  MobileJobDetail,
  resolveServiceName,
} from '../services/customerJobApi';
import { useCart } from '@/roles/Customer/context/CartContext';
import { startChat } from '@/services/chatApi';

const TABS = ['Details', 'Repairman Info', 'Booking Details', 'Disputes'];

export default function DisputeDetailScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { cartCount } = useCart();

  const passedJob = route?.params?.job;
  const jobId = route?.params?.jobId || passedJob?.id;
  const routeDisputeId = route?.params?.disputeId;
  const initialTab = route?.params?.initialTab || (routeDisputeId ? 'Disputes' : 'Details');
  const [tab, setTab] = useState(initialTab);

  const [job, setJob] = useState<MobileJobDetail | null>(null);
  const [extraDispute, setExtraDispute] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Direct chat start state
  const [isStartingChat, setIsStartingChat] = useState(false);

  // Dispute Reply state
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Themed AlertModal state (Replaces native Alert)
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: AlertModalType;
    title: string;
    message: string;
    buttonText?: string;
    secondaryButtonText?: string;
    onButtonPress?: () => void;
    onSecondaryButtonPress?: () => void;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const fetchJobDetails = useCallback(async () => {
    if (!jobId && !routeDisputeId) {
      setLoading(false);
      return;
    }
    try {
      if (jobId) {
        const data = await customerJobApi.getMyJobDetail(jobId);
        if (data) setJob(data);
      }
      if (routeDisputeId) {
        const dispData = await customerJobApi.getDisputeDetails(routeDisputeId);
        if (dispData) setExtraDispute(dispData);
      }
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, [jobId, routeDisputeId]);

  useEffect(() => {
    setLoading(true);
    fetchJobDetails();
  }, [fetchJobDetails]);

  // Handle direct chat with repair technician
  const handleStartChatWithTech = async () => {
    // 1. Resolve technician ID across all possible data paths
    const rawRepairmanId =
      job?.repairman?.id ||
      job?.repairman?._id ||
      job?.booking?.repairmanId?._id ||
      job?.booking?.repairmanId ||
      job?.selectedOffer?.repairmanId ||
      (job?.dispute?.againstUser?.userType === 'repairman'
        ? job?.dispute?.againstUser?.userId?._id || job?.dispute?.againstUser?.userId
        : null) ||
      (job?.dispute?.raisedBy?.userType === 'repairman'
        ? job?.dispute?.raisedBy?.userId?._id || job?.dispute?.raisedBy?.userId
        : null);

    const repairmanId =
      typeof rawRepairmanId === 'object' && rawRepairmanId !== null
        ? String(rawRepairmanId._id || rawRepairmanId.id || '')
        : String(rawRepairmanId || '');

    if (!repairmanId || !/^[0-9a-fA-F]{24}$/.test(repairmanId)) {
      setAlertConfig({
        visible: true,
        type: 'info',
        title: 'Technician Not Assigned',
        message: 'Direct chat will be available once a certified technician is assigned to this job.',
        buttonText: 'View All Chats',
        secondaryButtonText: 'Cancel',
        onButtonPress: () => {
          setAlertConfig(prev => ({ ...prev, visible: false }));
          navigation.navigate('ChatList');
        },
        onSecondaryButtonPress: () => setAlertConfig(prev => ({ ...prev, visible: false })),
      });
      return;
    }

    setIsStartingChat(true);
    try {
      const bookingId =
        job?.booking?._id || job?.booking?.id
          ? String(job.booking._id || job.booking.id)
          : undefined;
      const jId = job?.id ? String(job.id) : undefined;

      const res = await startChat({
        repairmanId,
        bookingId,
        jobId: jId,
      });

      if (res.success && res.chat) {
        const chatId = res.chat._id || res.chat.chatId;
        const targetName =
          res.chat?.user?.name ||
          res.chat?.repairman?.name ||
          job?.repairman?.name ||
          'Certified Technician';
        const targetAvatar =
          res.chat?.user?.avatar ||
          res.chat?.repairman?.avatar ||
          job?.repairman?.avatar ||
          null;

        navigation.navigate('ChatDetail', {
          chatId,
          participantId: repairmanId,
          participantName: targetName,
          participantAvatar: targetAvatar,
          role: 'customer',
        });
      } else {
        setAlertConfig({
          visible: true,
          type: 'info',
          title: 'Chat Notice',
          message: res.message || 'Could not initiate chat with technician directly. Opening chat conversations...',
          buttonText: 'Open Chats',
          secondaryButtonText: 'Cancel',
          onButtonPress: () => {
            setAlertConfig(prev => ({ ...prev, visible: false }));
            navigation.navigate('ChatList');
          },
          onSecondaryButtonPress: () => setAlertConfig(prev => ({ ...prev, visible: false })),
        });
      }
    } catch {
      navigation.navigate('ChatList');
    } finally {
      setIsStartingChat(false);
    }
  };

  // Handle sending response to active dispute
  const handleSendDisputeReply = async () => {
    const disputeId =
      job?.dispute?._id ||
      job?.dispute?.id ||
      extraDispute?._id ||
      extraDispute?.id ||
      routeDisputeId;
    if (!disputeId) return;

    const trimmed = replyMessage.trim();
    if (!trimmed) {
      setAlertConfig({
        visible: true,
        type: 'warning',
        title: 'Required',
        message: 'Please enter a message to send.',
      });
      return;
    }

    setIsSendingReply(true);
    try {
      const res = await customerJobApi.sendDisputeResponse(disputeId, trimmed);
      if (res.success) {
        setReplyMessage('');
        await fetchJobDetails();
        setAlertConfig({
          visible: true,
          type: 'success',
          title: 'Update Sent',
          message: res.message || 'Response added successfully!',
        });
      } else {
        setAlertConfig({
          visible: true,
          type: 'error',
          title: 'Error',
          message: res.message || 'Failed to send response',
        });
      }
    } catch (e: any) {
      setAlertConfig({
        visible: true,
        type: 'error',
        title: 'Error',
        message: e?.message || 'Failed to send response',
      });
    } finally {
      setIsSendingReply(false);
    }
  };

  // Format category string e.g. "quality_of_work" -> "Quality Of Work"
  const formatCategory = (cat?: string) => {
    if (!cat) return 'General Dispute';
    return cat
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const booking = job?.booking;
  const repairman = job?.repairman;
  const dispute = job?.dispute || extraDispute;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
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
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}>
        <Squeeze onPress={() => navigation.goBack()} scale={0.9} style={styles.backWrap}>
          <View style={[styles.back, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={20} color={colors.onPrimary} />
          </View>
        </Squeeze>

        {loading ? (
          <View style={{ paddingVertical: 80, alignItems: 'center' }}>
            <CtiLoader size="lg" text="Loading dispute details..." />
          </View>
        ) : !job ? (
          <View style={{ paddingVertical: 80, alignItems: 'center', paddingHorizontal: 24 }}>
            <Icon source={packageBold} size={48} color={colors.textMuted} />
            <Text style={[styles.title, { color: colors.text, textAlign: 'center', marginTop: 12 }]}>
              Dispute Details Not Found
            </Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, marginTop: 8, textAlign: 'center' }}>
              The requested dispute details could not be found or loaded.
            </Text>
            <Squeeze onPress={() => navigation.goBack()} style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: 12 }}>
              <Text style={{ color: '#fff', fontFamily: fonts.bold }}>Go Back</Text>
            </Squeeze>
          </View>
        ) : (
          <>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.text }]}>{job.title}</Text>
            </View>

            {/* TABS HEADER */}
            <View style={[styles.tabsWrap, { borderColor: colors.border }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
                {TABS.map(name => {
                  const active = name === tab;
                  return (
                    <Pressable
                      key={name}
                      onPress={() => setTab(name)}
                      style={[styles.tab, active && { borderBottomColor: colors.primary }]}>
                      <Text
                        style={[
                          styles.tabText,
                          {
                            color: active ? colors.primary : colors.textMuted,
                            fontFamily: active ? fonts.bold : fonts.regular,
                          },
                        ]}>
                        {name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* TAB 1: DETAILS */}
            {tab === 'Details' && (
              <FadeUp duration={400}>
                <Text style={[styles.price, { color: colors.text }]}>{job.priceLabel}</Text>
                <View style={[styles.statusPillBadge, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}>
                  <View style={[styles.statusDot, { backgroundColor: '#b45309' }]} />
                  <Text style={[styles.statusText, { color: '#b45309' }]}>
                    Dispute / Under Review
                  </Text>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Services Description</Text>
                <Text style={[styles.text, { color: colors.textMuted }]}>{job.description}</Text>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Services Required</Text>
                <View style={styles.pills}>
                  {job.services.map(service => (
                    <View
                      key={service}
                      style={[
                        styles.pill,
                        {
                          backgroundColor: colors.surfaceAlt,
                          borderColor: colors.border,
                        },
                      ]}>
                      <View style={[styles.pillDot, { backgroundColor: colors.primary }]} />
                      <Text style={[styles.pillText, { color: colors.text, fontFamily: fonts.medium }]}>
                        {resolveServiceName(service)}
                      </Text>
                    </View>
                  ))}
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Pricing Breakdown</Text>
                <Row label="Estimated Price" value={job.priceLabel} bold />
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <Text style={[styles.sectionTitle, { color: colors.text }]}>Location & Preference</Text>
                <Row label="Location" value={job.locationLabel} />
                <Row label="Service Type" value={job.servicePreference} />

                <View
                  style={[
                    styles.infoBox,
                    {
                      backgroundColor: colors.surfaceAlt,
                      borderColor: colors.border,
                      borderWidth: 1,
                    },
                  ]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <Icon source={infoCircleBold} size={15} color={colors.primary} />
                    <Text style={[styles.infoTitle, { color: colors.text }]}>Dispute Status</Text>
                  </View>
                  <Text style={[styles.infoText, { color: colors.textMuted }]}>
                    Support team is reviewing the chat history, evidence, and booking records to resolve this matter.
                  </Text>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.footerText, { color: colors.textMuted }]}>
                  Created: {job.createdAt}
                </Text>
              </FadeUp>
            )}

            {/* TAB 2: REPAIRMAN INFO */}
            {tab === 'Repairman Info' && (
              <FadeUp duration={400}>
                {repairman ? (
                  <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.repairmanHeader}>
                      {repairman.avatar ? (
                        <Image
                          source={{ uri: repairman.avatar }}
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
                          ]}>
                          <Text style={[styles.avatarText, { color: colors.primary }]}>
                            {(repairman.name || 'R').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>
                          {repairman.name || 'Certified Repair Technician'}
                        </Text>
                        <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
                          {repairman.shopName || repairman.repairmanProfile?.shopName || 'Certified Service Center'}
                        </Text>
                        <View style={styles.ratingRow}>
                          <Icon source={starExtra} size={14} color="#f59e0b" />
                          <Text style={[styles.ratingText, { color: colors.text }]}>
                            {Number(repairman.rating || repairman.repairmanProfile?.rating || 5.0).toFixed(1)} / 5.0
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <Row
                      label="Total Jobs"
                      value={String(repairman.totalJobs || repairman.repairmanProfile?.totalJobs || 0)}
                    />
                    <Row
                      label="City / Area"
                      value={repairman.city || repairman.repairmanProfile?.city || 'Istanbul / Local'}
                    />
                    {Boolean(repairman.phone) && (
                      <Row label="Contact" value={repairman.phone} />
                    )}

                    <Squeeze
                      onPress={handleStartChatWithTech}
                      disabled={isStartingChat}
                      style={[styles.primaryActionBtn, { backgroundColor: colors.primary, marginTop: 16 }]}>
                      {isStartingChat ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Icon source={commentDotsBold} size={18} color="#fff" />
                          <Text style={styles.primaryActionBtnText}>Chat with Technician</Text>
                        </>
                      )}
                    </Squeeze>
                  </View>
                ) : (
                  <View style={[styles.emptyBox, { backgroundColor: colors.surfaceAlt }]}>
                    <Icon source={infoCircleBold} size={28} color={colors.textMuted} />
                    <Text style={[styles.emptyBoxText, { color: colors.textMuted }]}>
                      Repair technician details will be displayed once assigned to this booking.
                    </Text>
                  </View>
                )}
              </FadeUp>
            )}

            {/* TAB 3: BOOKING DETAILS */}
            {tab === 'Booking Details' && (
              <FadeUp duration={400}>
                {booking ? (
                  <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 0 }]}>
                        Booking Overview
                      </Text>
                      <View style={[styles.pillBadge, { backgroundColor: colors.primary + '18' }]}>
                        <Text style={[styles.pillBadgeText, { color: colors.primary }]}>
                          {booking.status ? booking.status.toUpperCase() : 'DISPUTED'}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    {/* Scheduled Date */}
                    <View style={styles.statRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Icon source={calendarBold} size={15} color={colors.textMuted} />
                        <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Scheduled Date:</Text>
                      </View>
                      <Text style={[styles.rowValue, { color: colors.text }]}>
                        {booking.bookingDetails?.scheduledDate
                          ? new Date(booking.bookingDetails.scheduledDate).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'To be scheduled'}
                      </Text>
                    </View>

                    {/* Service Type */}
                    <View style={styles.statRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Icon source={clockBold} size={15} color={colors.textMuted} />
                        <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Service Type:</Text>
                      </View>
                      <Text style={[styles.rowValue, { color: colors.text, textTransform: 'capitalize' }]}>
                        {String(booking.bookingDetails?.serviceType || 'Drop-off').replace('-', ' ')}
                      </Text>
                    </View>

                    {/* Pricing Breakdown */}
                    {Boolean(booking.bookingDetails?.pricing) && (
                      <>
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <Text style={[styles.subHeading, { color: colors.text }]}>Pricing Breakdown</Text>
                        {booking.bookingDetails.pricing.basePrice !== undefined && (
                          <Row
                            label="Base Price"
                            value={`${booking.bookingDetails.pricing.currency || 'TRY'} ${Number(booking.bookingDetails.pricing.basePrice || 0).toLocaleString()}`}
                          />
                        )}
                        {booking.bookingDetails.pricing.partsPrice > 0 && (
                          <Row
                            label="Parts Price"
                            value={`${booking.bookingDetails.pricing.currency || 'TRY'} ${Number(booking.bookingDetails.pricing.partsPrice || 0).toLocaleString()}`}
                          />
                        )}
                        {booking.bookingDetails.pricing.serviceCharge > 0 && (
                          <Row
                            label="Service Fee"
                            value={`${booking.bookingDetails.pricing.currency || 'TRY'} ${Number(booking.bookingDetails.pricing.serviceCharge || 0).toLocaleString()}`}
                          />
                        )}
                        <Row
                          label="Total Amount"
                          value={`${booking.bookingDetails.pricing.currency || 'TRY'} ${Number(booking.bookingDetails.pricing.totalAmount || 0).toLocaleString()}`}
                          bold
                        />
                      </>
                    )}

                    {/* Address Box */}
                    {Boolean(
                      booking.bookingDetails?.location?.address ||
                      booking.pickUpAddress ||
                      job.locationLabel
                    ) && (
                      <>
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <Icon source={mapPinBold} size={15} color={colors.primary} />
                          <Text style={[styles.subHeading, { color: colors.text }]}>Service / Pickup Address</Text>
                        </View>
                        <View style={[styles.addressBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                          <Text style={[styles.addressText, { color: colors.text }]}>
                            {booking.bookingDetails?.location?.address ||
                              booking.pickUpAddress ||
                              job.locationLabel}
                          </Text>
                        </View>
                      </>
                    )}

                    {/* Warranty */}
                    {Boolean(booking.bookingDetails?.warranty) && (() => {
                      const warrantyObj = booking.bookingDetails.warranty;
                      const duration = warrantyObj?.duration || 30;
                      const rawDesc = typeof warrantyObj?.description === 'string' ? warrantyObj.description.trim() : '';

                      // Avoid repeating the same number on a second line (e.g. duration: 9 and description: "9")
                      const isRedundantDesc =
                        !rawDesc ||
                        rawDesc === String(duration) ||
                        rawDesc.toLowerCase() === `${duration} days` ||
                        rawDesc.toLowerCase() === `${duration} day`;

                      return (
                        <View style={[styles.infoBox, { backgroundColor: colors.surfaceAlt, marginTop: 14 }]}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Icon source={shieldIcon} size={16} color={colors.primary} />
                            <Text style={[styles.infoTitle, { color: colors.text }]}>
                              Warranty: {duration} Days
                            </Text>
                          </View>
                          {!isRedundantDesc && (
                            <Text style={[styles.infoText, { color: colors.textMuted, marginTop: 4 }]}>
                              {rawDesc}
                            </Text>
                          )}
                        </View>
                      );
                    })()}
                  </View>
                ) : (
                  <View style={[styles.emptyBox, { backgroundColor: colors.surfaceAlt }]}>
                    <Icon source={infoCircleBold} size={28} color={colors.textMuted} />
                    <Text style={[styles.emptyBoxText, { color: colors.textMuted }]}>
                      Booking records are not currently available for this job posting.
                    </Text>
                  </View>
                )}
              </FadeUp>
            )}

            {/* TAB 4: DISPUTES */}
            {tab === 'Disputes' && (
              <FadeUp duration={400}>
                {dispute ? (
                  <View style={{ gap: 14 }}>
                    {/* Dispute Overview Card */}
                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <View style={styles.cardHeaderRow}>
                        <View>
                          <Text style={[styles.disputeIdText, { color: colors.primary }]}>
                            {dispute.disputeId || 'Dispute Case'}
                          </Text>
                          <Text style={[styles.disputeCategoryText, { color: colors.text }]}>
                            {formatCategory(dispute.category)}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 4 }}>
                          <View style={[styles.pillBadge, { backgroundColor: '#fef3c7' }]}>
                            <Text style={[styles.pillBadgeText, { color: '#b45309' }]}>
                              {String(dispute.status || 'Under Review').toUpperCase()}
                            </Text>
                          </View>
                          {Boolean(dispute.priority) && (
                            <Text style={{ fontSize: 11, fontFamily: fonts.medium, color: colors.textMuted }}>
                              {String(dispute.priority).toUpperCase()} PRIORITY
                            </Text>
                          )}
                        </View>
                      </View>

                      <View style={[styles.divider, { backgroundColor: colors.border }]} />

                      {/* Payment Status & Parties */}
                      {Boolean(dispute.paymentStatus) && (
                        <Row
                          label="Escrow Status"
                          value={String(dispute.paymentStatus).replace('_', ' ').toUpperCase()}
                        />
                      )}
                      <Row
                        label="Raised By"
                        value={`${dispute.raisedBy?.userId?.name || 'Customer'} (${dispute.raisedBy?.userType || 'customer'})`}
                      />
                      <Row
                        label="Against"
                        value={`${dispute.againstUser?.userId?.name || 'Repairman'} (${dispute.againstUser?.userType || 'repairman'})`}
                      />

                      {/* Description */}
                      <View style={[styles.divider, { backgroundColor: colors.border }]} />
                      <Text style={[styles.subHeading, { color: colors.text }]}>Dispute Description</Text>
                      <Text style={[styles.text, { color: colors.textMuted, marginTop: 4 }]}>
                        {dispute.description || 'No description provided.'}
                      </Text>

                      {/* Resolution Box if resolved */}
                      {Boolean(dispute.resolution) && (
                        <View style={[styles.resolutionBox, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}>
                          <Text style={[styles.resolutionTitle, { color: '#065f46' }]}>
                            Dispute Resolved
                          </Text>
                          {Boolean(dispute.resolution.resolutionType || dispute.resolution.decision) && (
                            <Text style={[styles.resolutionText, { color: '#047857' }]}>
                              Decision: {dispute.resolution.resolutionType || dispute.resolution.decision}
                            </Text>
                          )}
                          {Boolean(dispute.resolution.refundAmount) && (
                            <Text style={[styles.resolutionText, { color: '#047857', fontFamily: fonts.bold }]}>
                              Refund Amount: TRY {Number(dispute.resolution.refundAmount).toLocaleString()}
                            </Text>
                          )}
                          {Boolean(dispute.resolution.resolutionNotes) && (
                            <Text style={[styles.resolutionText, { color: '#065f46', marginTop: 4 }]}>
                              {dispute.resolution.resolutionNotes}
                            </Text>
                          )}
                        </View>
                      )}
                    </View>

                    {/* Evidence Photos */}
                    {Array.isArray(dispute.evidenceFiles) && dispute.evidenceFiles.length > 0 && (
                      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.subHeading, { color: colors.text }]}>Attached Evidence</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                          <View style={{ flexDirection: 'row', gap: 10 }}>
                            {dispute.evidenceFiles.map((item: any, idx: number) => {
                              const uri = item.fileUrl || item.url || item;
                              if (!uri || typeof uri !== 'string') return null;
                              return (
                                <Image
                                  key={idx}
                                  source={{ uri }}
                                  style={styles.evidenceImage}
                                  resizeMode="cover"
                                />
                              );
                            })}
                          </View>
                        </ScrollView>
                      </View>
                    )}

                    {/* Discussion / Responses Thread */}
                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Text style={[styles.subHeading, { color: colors.text, marginBottom: 8 }]}>
                        Case Discussion & Updates
                      </Text>

                      {Array.isArray(dispute.responses) && dispute.responses.length > 0 ? (
                        <View style={{ gap: 10 }}>
                          {dispute.responses.map((resp: any, idx: number) => {
                            const senderType = resp.respondedBy?.userType || 'User';
                            const isCustomer = senderType.toLowerCase() === 'customer';
                            const isAdmin = senderType.toLowerCase() === 'admin';

                            return (
                              <View
                                key={resp._id || idx}
                                style={[
                                  styles.responseBubble,
                                  {
                                    backgroundColor: isCustomer
                                      ? colors.primary + '12'
                                      : isAdmin
                                      ? '#ecfdf5'
                                      : colors.surfaceAlt,
                                    borderColor: isCustomer
                                      ? colors.primary + '30'
                                      : isAdmin
                                      ? '#a7f3d0'
                                      : colors.border,
                                    alignSelf: isCustomer ? 'flex-end' : 'flex-start',
                                  },
                                ]}>
                                <View style={styles.responseHeaderRow}>
                                  <Text
                                    style={[
                                      styles.responseSenderText,
                                      { color: isCustomer ? colors.primary : isAdmin ? '#065f46' : colors.text },
                                    ]}>
                                    {isAdmin ? 'CTI Support Team' : isCustomer ? 'You (Customer)' : 'Technician'}
                                  </Text>
                                  {Boolean(resp.respondedAt || resp.createdAt) && (
                                    <Text style={[styles.responseDateText, { color: colors.textMuted }]}>
                                      {new Date(resp.respondedAt || resp.createdAt).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </Text>
                                  )}
                                </View>
                                <Text style={[styles.responseMsgText, { color: colors.text }]}>
                                  {resp.message}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      ) : (
                        <Text style={[styles.emptyChatText, { color: colors.textMuted }]}>
                          No discussion messages yet. You can send an update to support below.
                        </Text>
                      )}

                      {/* Reply Input Box */}
                      {dispute.status !== 'resolved' && dispute.status !== 'closed' && (
                        <View style={[styles.replyInputWrap, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}>
                          <TextInput
                            value={replyMessage}
                            onChangeText={setReplyMessage}
                            placeholder="Type a message to support..."
                            placeholderTextColor={colors.textMuted}
                            style={[styles.replyInput, { color: colors.text }]}
                            multiline
                          />
                          <Squeeze
                            onPress={handleSendDisputeReply}
                            disabled={isSendingReply || !replyMessage.trim()}
                            style={[
                              styles.sendReplyBtn,
                              {
                                backgroundColor: replyMessage.trim() ? colors.primary : colors.border,
                              },
                            ]}>
                            {isSendingReply ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Icon source={sendBold} size={16} color="#fff" />
                            )}
                          </Squeeze>
                        </View>
                      )}
                    </View>
                  </View>
                ) : (
                  <View style={[styles.emptyBox, { backgroundColor: colors.surfaceAlt }]}>
                    <Icon source={shieldIcon} size={32} color={colors.primary} />
                    <Text style={[styles.title, { color: colors.text, textAlign: 'center', marginTop: 10, fontSize: 16 }]}>
                      No Active Dispute Found
                    </Text>
                    <Text style={[styles.emptyBoxText, { color: colors.textMuted, marginTop: 4 }]}>
                      There is no open dispute filed for this repair job. If you face any issues, you can report them through order support.
                    </Text>
                  </View>
                )}
              </FadeUp>
            )}
          </>
        )}
      </ScrollView>

      {/* Themed Alert Modal */}
      <AlertModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttonText={alertConfig.buttonText || 'Okay'}
        secondaryButtonText={alertConfig.secondaryButtonText}
        onButtonPress={alertConfig.onButtonPress}
        onSecondaryButtonPress={alertConfig.onSecondaryButtonPress}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <Text
        style={[
          styles.rowLabel,
          { color: colors.textMuted, fontFamily: bold ? fonts.bold : fonts.regular },
        ]}>
        {label}
      </Text>
      <Text
        style={[
          styles.rowValue,
          { color: colors.text, fontFamily: bold ? fonts.bold : fonts.regular },
        ]}>
        {value}
      </Text>
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

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 12,
  },
  title: { flex: 1, fontFamily: fonts.bold, fontSize: 18 },

  tabsWrap: { borderBottomWidth: 1, marginTop: 14, marginBottom: 16 },
  tabsScroll: { flexDirection: 'row' },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: { fontSize: 13 },

  price: { fontFamily: fonts.bold, fontSize: 16 },
  statusPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontFamily: fonts.bold, fontSize: 11 },

  sectionTitle: { fontFamily: fonts.bold, fontSize: 14, marginTop: 18 },
  subHeading: { fontFamily: fonts.bold, fontSize: 13 },
  text: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, marginTop: 6 },

  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 12 },

  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  rowLabel: { fontSize: 13 },
  rowValue: { fontSize: 13 },

  divider: { height: 1, marginVertical: 14 },

  infoBox: { borderRadius: 12, padding: 14, gap: 4, marginTop: 14 },
  infoTitle: { fontFamily: fonts.bold, fontSize: 13 },
  infoText: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },

  footerText: { fontFamily: fonts.regular, fontSize: 12 },

  emptyBox: { borderRadius: 12, padding: 24, alignItems: 'center', marginTop: 16, gap: 8 },
  emptyBoxText: { fontFamily: fonts.regular, fontSize: 13, textAlign: 'center', lineHeight: 19 },

  // Card styles
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { fontFamily: fonts.bold, fontSize: 15 },
  cardSubtitle: { fontFamily: fonts.regular, fontSize: 13 },

  pillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillBadgeText: { fontFamily: fonts.bold, fontSize: 11 },

  // Repairman tab styles
  repairmanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.bold, fontSize: 20 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingText: { fontFamily: fonts.bold, fontSize: 12 },

  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 12,
  },
  primaryActionBtnText: { color: '#fff', fontFamily: fonts.bold, fontSize: 14 },

  // Booking tab styles
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  addressBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  addressText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },

  // Dispute tab styles
  disputeIdText: { fontFamily: fonts.bold, fontSize: 12 },
  disputeCategoryText: { fontFamily: fonts.bold, fontSize: 16, marginTop: 2 },
  resolutionBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    gap: 4,
  },
  resolutionTitle: { fontFamily: fonts.bold, fontSize: 13 },
  resolutionText: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },

  evidenceImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
  },

  responseBubble: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    maxWidth: '88%',
    gap: 4,
  },
  responseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  responseSenderText: { fontFamily: fonts.bold, fontSize: 11 },
  responseDateText: { fontFamily: fonts.regular, fontSize: 10 },
  responseMsgText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  emptyChatText: { fontFamily: fonts.regular, fontSize: 13, textAlign: 'center', paddingVertical: 12 },

  replyInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 14,
    gap: 8,
  },
  replyInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    maxHeight: 80,
    paddingVertical: 4,
  },
  sendReplyBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
