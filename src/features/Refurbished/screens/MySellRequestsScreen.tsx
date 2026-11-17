import { useCallback, useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import CtiLoader from '@/components/CtiLoader';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import ConfirmModal from '@/components/ConfirmModal';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  calendarBold,
  cameraBold,
  checkCircleBold,
  commentDotsBold,
  phoneBold,
  plusSquareBold,
  tagBold,
  videoBold,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import useRefreshOnActive from '@/utils/useRefreshOnActive';
import { fonts } from '@/theme/fonts';
import RefurbishedHeader from '../components/RefurbishedHeader';
import {
  acceptSellOffer,
  getCustomerSellRequests,
  rejectSellOffer,
  startSellRequestChat,
} from '../services/refurbishedApi';
import { formatMoney } from '@/utils/money';
import { getLocaleTag } from '@/i18n/locale';
import { useTranslation } from 'react-i18next';
import { lower } from '@/i18n/locale';
import { statusLabel } from '@/utils/labels';
import i18n from '@/i18n';

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(getLocaleTag(), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function MySellRequestsScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    type: 'accept' | 'reject';
    offerId: string;
    trackingId: string;
    amount?: number;
  }>({
    visible: false,
    type: 'accept',
    offerId: '',
    trackingId: '',
  });

  // Alert Modal state
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

  const fetchRequests = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const res = await getCustomerSellRequests();
      if (res.success && Array.isArray(res.data)) {
        setRequests(res.data);
      } else if (res.message) {
        // If not authenticated or error
        if (res.message.includes('401') || res.message.includes('Access denied')) {
          setAlertState({
            visible: true,
            type: 'warning',
            title: i18n.t('customer.authenticationRequired'),
            message: i18n.t('customer.pleaseSignInToView'),
          });
        }
      }
    } catch (e: any) {
      if (__DEV__) console.warn('fetchRequests error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // A new offer from the CTI team has no push, so the list reloads quietly when it comes back into view or the app returns
  const isFocused = useIsFocused();
  const markLoaded = useRefreshOnActive(isFocused, () => fetchRequests(true));
  useEffect(() => {
    if (!loading) markLoaded();
  }, [loading, requests, markLoaded]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests(true);
  };

  const handleOpenConfirm = (type: 'accept' | 'reject', offerId: string, trackingId: string, amount?: number) => {
    setConfirmModal({
      visible: true,
      type,
      offerId,
      trackingId,
      amount,
    });
  };

  const handleExecuteAction = async () => {
    const { type, offerId } = confirmModal;
    setConfirmModal(prev => ({ ...prev, visible: false }));

    if (!offerId) return;
    setActionLoadingId(offerId);

    try {
      if (type === 'accept') {
        const res = await acceptSellOffer(offerId);
        if (res.success) {
          setAlertState({
            visible: true,
            type: 'success',
            title: i18n.t('customer.offerAccepted'),
            message: i18n.t('customer.youHaveAcceptedTheOffer'),
          });
          fetchRequests(true);
        } else {
          setAlertState({
            visible: true,
            type: 'error',
            title: i18n.t('chat.actionFailed'),
            message: res.message || i18n.t('customer.couldNotAcceptOfferPlease'),
          });
        }
      } else {
        const res = await rejectSellOffer(offerId);
        if (res.success) {
          setAlertState({
            visible: true,
            type: 'info',
            title: i18n.t('customer.offerDeclined'),
            message: i18n.t('customer.youHaveDeclinedThisOffer'),
          });
          fetchRequests(true);
        } else {
          setAlertState({
            visible: true,
            type: 'error',
            title: i18n.t('chat.actionFailed'),
            message: res.message || i18n.t('customer.couldNotDeclineOfferPlease'),
          });
        }
      }
    } catch (err: any) {
      setAlertState({
        visible: true,
        type: 'error',
        title: i18n.t('common.error'),
        message: err?.message || i18n.t('customer.somethingWentWrongPleaseCheck'),
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStartChat = async (requestId: string) => {
    try {
      setActionLoadingId(`chat_${requestId}`);
      const res = await startSellRequestChat(requestId);
      if (res.success && res.chat) {
        navigation.navigate('ChatDetail', {
          chatId: res.chat.chatId || res.chat._id,
          participantName: i18n.t('customerMsg.supportName'),
          chatType: 'refurbish',
        });
      } else {
        setAlertState({
          visible: true,
          type: 'info',
          title: i18n.t('customer.liveChat'),
          message: i18n.t('customer.supportChatIsBeingSet'),
        });
      }
    } catch (err: any) {
      setAlertState({
        visible: true,
        type: 'error',
        title: i18n.t('customer.chatError'),
        message: err?.message || i18n.t('customer.couldNotStartChatSession'),
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'approved':
      case 'completed':
        return { bg: '#10B9811A', text: '#10B981', border: '#10B98144' };
      case 'under evaluation':
      case 'evaluating':
        return { bg: '#3B82F61A', text: '#3B82F6', border: '#3B82F644' };
      case 'rejected':
      case 'cancelled':
        return { bg: '#EF44441A', text: '#EF4444', border: '#EF444444' };
      case 'pending':
      default:
        return { bg: '#F59E0B1A', text: '#F59E0B', border: '#F59E0B44' };
    }
  };

  const getOfferBadgeStyle = (status: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'accepted':
        return { bg: '#10B9811A', text: '#10B981', label: i18n.t('chat.quoteStatus.accepted') };
      case 'rejected':
        return { bg: '#EF44441A', text: '#EF4444', label: i18n.t('customer.declined') };
      case 'expired':
        return { bg: '#6B72801A', text: '#6B7280', label: i18n.t('customer.expired') };
      case 'pending':
      default:
        return { bg: '#F59E0B1A', text: '#F59E0B', label: i18n.t('customer.pendingResponse') };
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Refurbished Header (exact match with Sell Phone & Store headers) */}
      <RefurbishedHeader
        onCartPress={() => {
          try {
            navigation.navigate('Cart');
          } catch {}
        }}
        onWishlistPress={() => {
          try {
            navigation.navigate('Wishlist');
          } catch {}
        }}
        onMenuPress={() => {
          try {
            navigation.navigate('Settings');
          } catch {}
        }}
      />

      {/* Main Body */}
      {loading ? (
        <View style={styles.centerContainer}>
          <CtiLoader size="lg" />
          <Text style={[styles.loaderText, { color: colors.textMuted }]}>
            {t('customer.loadingYourSellRequests')}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 40 },
          ]}>
          {/* Back Button matching About Screen */}
          <Squeeze
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            }}
            scale={0.9}
            style={styles.backWrap}>
            <View style={[styles.back, { backgroundColor: colors.primary }]}>
              <Icon source={arrowLeftBold} size={20} color={colors.onPrimary} />
            </View>
          </Squeeze>

          {/* Page Title & "Sell Device" Action Bar */}
          <View style={styles.titleSection}>
            <View style={styles.titleTextCol}>
              <Text style={[styles.screenHeading, { color: colors.text }]}>{t('customer.mySellRequests')}</Text>
              <Text style={[styles.screenSubheading, { color: colors.textMuted }]}>
                {t('customer.trackAndManageYourDevice')}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('SellRefurbished')}
              style={[styles.sellAnotherBtn, { backgroundColor: colors.primary }]}>
              <Icon source={plusSquareBold} size={14} color={colors.onPrimary} />
              <Text style={[styles.sellAnotherText, { color: colors.onPrimary }]}>{t('customer.sellDevice')}</Text>
            </TouchableOpacity>
          </View>
          {requests.length === 0 ? (
            /* Empty State matching Web UI */
            <FadeUp delay={100}>
              <View
                style={[
                  styles.emptyCard,
                  { backgroundColor: colors.surface, borderColor: colors.border + '33' },
                ]}>
                <View
                  style={[
                    styles.emptyIconCircle,
                    { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '22' },
                  ]}>
                  <Icon source={tagBold} size={32} color={colors.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {t('customer.noSellRequestsFound')}
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                  {t('customer.youHavenTSubmittedAny')}
                </Text>
                <Squeeze
                  onPress={() => navigation.navigate('SellRefurbished')}
                  style={[styles.emptyActionBtn, { backgroundColor: colors.primary }]}>
                  <Text style={styles.emptyActionText}>{t('customer.getInstantValuation')}</Text>
                </Squeeze>
              </View>
            </FadeUp>
          ) : (
            requests.map((item, idx) => {
              const brandName = item.brandId?.name || '';
              const modelName = item.modelId?.name || '';
              const deviceName = `${brandName} ${modelName}`.trim() || i18n.t('customer.customDevice');
              const hasOffer = Boolean(item.offer);
              const offerStatus = item.offer?.status;
              const isOfferExpired =
                hasOffer &&
                item.offer?.expiryDate &&
                new Date() > new Date(item.offer.expiryDate);
              const resolvedOfferStatus =
                isOfferExpired && offerStatus === 'pending' ? 'expired' : offerStatus;

              const statusStyle = getStatusBadgeStyle(item.status);
              const offerStyle = hasOffer ? getOfferBadgeStyle(resolvedOfferStatus) : null;
              const isActionLoading = actionLoadingId === item.offer?._id;
              const isChatLoading = actionLoadingId === `chat_${item._id}`;

              const photosCount = Array.isArray(item.media?.photos) ? item.media.photos.length : 0;
              const hasVideo = Boolean(item.media?.video);

              return (
                <FadeUp key={item._id || idx} delay={idx * 60}>
                  <View
                    style={[
                      styles.requestCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border + '33',
                      },
                    ]}>
                    {/* Top Row: Status badge & Date */}
                    <View style={styles.cardHeaderRow}>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: statusStyle.bg,
                            borderColor: statusStyle.border,
                          },
                        ]}>
                        <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
                          {t('customerMsg.statusLine', { status: statusLabel(item.status || 'pending') })}
                        </Text>
                      </View>

                      <View style={styles.dateRow}>
                        <Icon source={calendarBold} size={12} color={colors.textMuted} />
                        <Text style={[styles.dateText, { color: colors.textMuted }]}>
                          {formatDate(item.createdAt)}
                        </Text>
                      </View>
                    </View>

                    {/* Device Details */}
                    <View style={styles.deviceInfoBox}>
                      <View style={styles.deviceNameRow}>
                        <View style={styles.deviceIconCircle}>
                          <Icon source={phoneBold} size={16} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.deviceName, { color: colors.text }]}>
                            {deviceName}
                          </Text>
                          <Text style={[styles.trackingIdText, { color: colors.textMuted }]}>
                            {t('customerMsg.trackingId')}{' '}
                            <Text style={{ fontFamily: fonts.bold, color: colors.primary }}>
                              {item.trackingId || t('customerMsg.notAvailable')}
                            </Text>
                          </Text>
                        </View>
                      </View>

                      {/* Selected Variants (e.g. Storage, RAM, Color) */}
                      {Array.isArray(item.selectedVariants) && item.selectedVariants.length > 0 ? (
                        <View style={styles.variantPillsRow}>
                          {item.selectedVariants.map((v: any, vIdx: number) => (
                            <View
                              key={vIdx}
                              style={[
                                styles.variantPill,
                                {
                                  backgroundColor: colors.surfaceAlt,
                                  borderColor: colors.border + '22',
                                },
                              ]}>
                              <Text style={[styles.variantPillText, { color: colors.text }]}>
                                {v.key}: <Text style={{ fontFamily: fonts.bold }}>{v.value}</Text>
                              </Text>
                            </View>
                          ))}
                        </View>
                      ) : null}

                      {/* Media badge count */}
                      <View style={styles.mediaCountRow}>
                        {photosCount > 0 && (
                          <View style={styles.mediaTag}>
                            <Icon source={cameraBold} size={11} color={colors.textMuted} />
                            <Text style={[styles.mediaTagText, { color: colors.textMuted }]}>
                              {t('customerMsg.photosAttached', { count: photosCount })}
                            </Text>
                          </View>
                        )}
                        {hasVideo && (
                          <View style={styles.mediaTag}>
                            <Icon source={videoBold} size={11} color={colors.textMuted} />
                            <Text style={[styles.mediaTagText, { color: colors.textMuted }]}>
                              {i18n.t('customer.videoProofAttached')}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Chat with Platform (Next.js exact match: only rendered when offer is received) */}
                      {hasOffer && (
                        <View style={styles.chatButtonWrap}>
                          <TouchableOpacity
                            onPress={() => handleStartChat(item._id)}
                            disabled={isChatLoading}
                            style={[
                              styles.chatBtn,
                              {
                                backgroundColor: colors.surfaceAlt,
                                borderColor: colors.border + '55',
                              },
                            ]}>
                            {isChatLoading ? (
                              <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                              <>
                                <Icon source={commentDotsBold} size={14} color={colors.primary} />
                                <Text style={[styles.chatBtnText, { color: colors.text }]}>
                                  {i18n.t('customer.chatWithPlatform')}
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>

                    {/* Offer Box (Evaluation or Official Offer) */}
                    <View
                      style={[
                        styles.offerSection,
                        {
                          backgroundColor: colors.surfaceAlt,
                          borderColor: colors.border + '22',
                        },
                      ]}>
                      {!hasOffer ? (
                        <View style={styles.underEvaluationBox}>
                          <View
                            style={[
                              styles.evalIconWrap,
                              { backgroundColor: colors.primary + '18' },
                            ]}>
                            <Icon source={tagBold} size={18} color={colors.primary} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.evalTitle, { color: colors.text }]}>
                              {i18n.t('customer.underEvaluation')}
                            </Text>
                            <Text style={[styles.evalSub, { color: colors.textMuted }]}>
                              {i18n.t('customer.ourTechnicalTeamIsReviewing')}
                            </Text>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.offerContent}>
                          {/* Offer Header */}
                          <View style={styles.offerHeaderRow}>
                            <Text style={[styles.offerHeaderTitle, { color: colors.text }]}>
                              {i18n.t('customer.offerReceived')}
                            </Text>
                            {offerStyle && (
                              <View
                                style={[
                                  styles.offerBadge,
                                  { backgroundColor: offerStyle.bg },
                                ]}>
                                <Text style={[styles.offerBadgeText, { color: offerStyle.text }]}>
                                  {offerStyle.label}
                                </Text>
                              </View>
                            )}
                          </View>

                          {/* Payout Amounts */}
                          <View style={styles.payoutBlock}>
                            <Text style={[styles.payoutValue, { color: colors.primary }]}>
                              {formatMoney(item.offer?.offerPrice)}
                            </Text>
                            {item.offer?.estimatedValue ? (
                              <Text style={[styles.estValueText, { color: colors.textMuted }]}>
                                {t('customerMsg.estValue', { amount: formatMoney(item.offer.estimatedValue) })}
                              </Text>
                            ) : null}
                          </View>

                          {/* Offer Notes & Conditions */}
                          {(item.offer?.notes || item.offer?.conditions) && (
                            <View
                              style={[
                                styles.offerNotesBox,
                                {
                                  backgroundColor: colors.surface,
                                  borderColor: colors.border + '33',
                                },
                              ]}>
                              {item.offer.notes ? (
                                <View style={{ marginBottom: 6 }}>
                                  <Text style={[styles.notesLabel, { color: colors.textMuted }]}>
                                    {i18n.t('customer.evaluationNotes')}
                                  </Text>
                                  <Text style={[styles.notesText, { color: colors.text }]}>
                                    {item.offer.notes}
                                  </Text>
                                </View>
                              ) : null}

                              {item.offer.conditions ? (
                                <View>
                                  <Text style={[styles.notesLabel, { color: colors.textMuted }]}>
                                    {i18n.t('customer.conditions')}
                                  </Text>
                                  <Text style={[styles.notesText, { color: colors.text }]}>
                                    {item.offer.conditions}
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                          )}

                          {/* Action Buttons if Pending */}
                          {resolvedOfferStatus === 'pending' ? (
                            <View style={styles.offerActionsRow}>
                              <TouchableOpacity
                                onPress={() =>
                                  handleOpenConfirm(
                                    'accept',
                                    item.offer._id,
                                    item.trackingId,
                                    item.offer.offerPrice,
                                  )
                                }
                                disabled={Boolean(actionLoadingId)}
                                style={[styles.acceptBtn, { opacity: isActionLoading ? 0.7 : 1 }]}>
                                {isActionLoading ? (
                                  <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                  <>
                                    <Icon source={checkCircleBold} size={14} color="#FFFFFF" />
                                    <Text style={styles.acceptBtnText}>{i18n.t('customer.acceptOffer')}</Text>
                                  </>
                                )}
                              </TouchableOpacity>

                              <TouchableOpacity
                                onPress={() =>
                                  handleOpenConfirm('reject', item.offer._id, item.trackingId)
                                }
                                disabled={Boolean(actionLoadingId)}
                                style={[styles.declineBtn, { borderColor: '#EF444444' }]}>
                                <Text style={styles.declineBtnText}>{i18n.t('chat.decline')}</Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <View style={styles.offerStatusSummary}>
                              <Text style={[styles.statusSummaryText, { color: colors.textMuted }]}>
                                {t('customerMsg.offerIs', { status: lower(statusLabel(resolvedOfferStatus)) })}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>


                  </View>
                </FadeUp>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        visible={confirmModal.visible}
        title={confirmModal.type === 'accept' ? t('customer.acceptOffer2') : t('customer.declineOffer')}
        message={
          confirmModal.type === 'accept'
            ? t('customerMsg.acceptOfferMsg', { amount: formatMoney(confirmModal.amount), id: confirmModal.trackingId })
            : t('customerMsg.declineOfferMsg', { id: confirmModal.trackingId })
        }
        confirmText={confirmModal.type === 'accept' ? t('customer.yesAcceptOffer') : t('customer.yesDecline')}
        cancelText={t('common.cancel')}
        danger={confirmModal.type === 'reject'}
        onConfirm={handleExecuteAction}
        onCancel={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
      />

      {/* Feedback Alert Modal */}
      <AlertModal
        visible={alertState.visible}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onButtonPress={() => setAlertState(prev => ({ ...prev, visible: false }))}
        onClose={() => setAlertState(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backWrap: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    marginTop: 4,
  },
  titleTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  screenHeading: {
    fontSize: 20,
    fontFamily: fonts.bold,
  },
  screenSubheading: {
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: 2,
    lineHeight: 16,
  },
  sellAnotherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  sellAnotherText: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loaderText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    marginTop: 12,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  emptyCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: fonts.regular,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  emptyActionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  requestCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bold,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    fontFamily: fonts.medium,
  },
  deviceInfoBox: {
    marginBottom: 14,
  },
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  deviceIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6A0018',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceName: {
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  trackingIdText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  variantPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  variantPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  variantPillText: {
    fontSize: 11,
    fontFamily: fonts.regular,
  },
  mediaCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mediaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mediaTagText: {
    flexShrink: 1,
    fontSize: 11,
    fontFamily: fonts.medium,
  },
  offerSection: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  underEvaluationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  evalIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  evalTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  evalSub: {
    fontSize: 11,
    fontFamily: fonts.regular,
    marginTop: 2,
    lineHeight: 16,
  },
  offerContent: {
    gap: 10,
  },
  offerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#88888820',
  },
  offerHeaderTitle: {
    flexShrink: 1,
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  offerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  offerBadgeText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    textTransform: 'capitalize',
  },
  payoutBlock: {
    paddingVertical: 2,
  },
  payoutLabel: {
    fontSize: 10,
    fontFamily: fonts.bold,
    letterSpacing: 0.6,
  },
  payoutValue: {
    fontSize: 22,
    fontFamily: fonts.bold,
    marginTop: 2,
  },
  estValueText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    marginTop: 2,
  },
  offerNotesBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  notesLabel: {
    fontSize: 9,
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  notesText: {
    fontSize: 11,
    fontFamily: fonts.regular,
    lineHeight: 16,
  },
  offerActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: '#16A34A',
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  declineBtn: {
    flex: 1,
    backgroundColor: '#EF444415',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  offerStatusSummary: {
    paddingVertical: 4,
  },
  statusSummaryText: {
    fontSize: 11,
    fontFamily: fonts.regular,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  chatButtonWrap: {
    paddingTop: 10,
    alignSelf: 'flex-start',
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  chatBtnText: {
    fontSize: 12,
    fontFamily: fonts.bold,
  },
});

