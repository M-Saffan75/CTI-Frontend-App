import { ReactNode, useRef, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AlertModal, { AlertModalType } from '@/components/AlertModal';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { ErrorState, LoadingState } from '@/components/states';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  calendarBold,
  clockBold,
  commentDotsBold,
  couponBold,
  envelopeBold,
  exclamationCircleBold,
  fileBold,
  mapPinBold,
  mobileBold,
  penBold,
  phoneBold,
  settingsBold,
  userBold,
} from '@/assets/icons';
import repairmanApi from '@/roles/Repairman/api/repairmanApi';
import {
  statusLabel,
  statusTone,
} from '@/roles/Repairman/features/Dashboard/utils/bookingStatus';
import { markOffersChanged } from '@/roles/Repairman/utils/offerEvents';
import useApiData from '@/roles/Repairman/utils/useApiData';
import { startChat } from '@/services/chatApi';
import { formatDate, formatDateTime } from '@/utils/dateFormat';
import { formatMoney } from '@/utils/money';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import RepairmanHeader from '../../../components/RepairmanHeader';
import UpdateStatusModal from '../components/UpdateStatusModal';
import {
  bookingDevice,
  bookingServices,
  bookingUrgency,
  serviceTypeLabel,
} from '../utils/bookings';
import { urgencyLabel } from '../utils/jobBoard';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

function Card({
  icon,
  title,
  children,
}: {
  icon: number;
  title: string;
  children: ReactNode;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.cardHead}>
        <Icon source={icon} size={16} color={colors.primary} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Line({
  icon,
  label,
  value,
}: {
  icon?: number;
  label: string;
  value?: string | number | null;
}) {
  const { colors } = useTheme();
  if (value === undefined || value === null || value === '') return null;

  return (
    <View style={styles.line}>
      {icon ? <Icon source={icon} size={15} color={colors.primary} /> : null}
      <View style={styles.flex}>
        <Text style={[styles.lineLabel, { color: colors.textMuted }]}>
          {label}
        </Text>
        <Text style={[styles.lineValue, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

// the hint text is repairmanMsg.jobHint.<status>
const statusHint = (status?: string): string =>
  status ? i18n.t(`repairmanMsg.jobHint.${status}`, { defaultValue: '' }) : '';

export default function MyJobDetailScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bookingId: string = route.params?.bookingId;

  // The booking and the next steps the backend allows for its status
  const detail = useApiData(async () => {
    const [booking, transitions] = await Promise.all([
      repairmanApi.getBookingDetail(bookingId),
      repairmanApi.getBookingTransitions(bookingId),
    ]);
    return { booking, transitions };
  }, [bookingId]);

  const [refreshing, setRefreshing] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const chatBusy = useRef(false);
  const [notice, setNotice] = useState<{
    type: AlertModalType;
    title: string;
    message: string;
  } | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    const error = await detail.reload(true);
    setRefreshing(false);
    if (error)
      setNotice({
        type: 'error',
        title: i18n.t('customer.couldNotRefresh'),
        message: error.message,
      });
  };

  const booking = detail.data?.booking;
  const transitions = detail.data?.transitions.availableTransitions || [];
  const job = booking?.jobInfo || null;
  // the detail request has no status inside bookingDetails; the transitions request and tracking carry it
  const status =
    detail.data?.transitions.currentStatus ||
    booking?.tracking?.currentLocation ||
    '';
  const tone = colors[statusTone(status)];
  const device = bookingDevice(job);
  const customer = booking?.customer;
  const pricing = booking?.bookingDetails?.pricing;
  const currency = pricing?.currency || 'TRY';
  const money = (value?: number) =>
    typeof value === 'number' ? formatMoney(value, currency) : '';
  const place = [job?.location?.city?.name, job?.location?.state?.name]
    .filter(Boolean)
    .join(', ');
  const warranty = booking?.bookingDetails?.warranty?.duration;

  const messageCustomer = async () => {
    if (chatBusy.current || !customer?._id) return;
    chatBusy.current = true;
    setChatLoading(true);
    // The same request the web sends: it starts the chat, or returns the one that exists
    const res = await startChat({ repairmanId: customer._id });
    chatBusy.current = false;
    setChatLoading(false);
    const chatId = res.chat?._id || res.chat?.chatId;
    if (res.success && chatId) {
      navigation.navigate('ChatDetail', {
        chatId,
        participantId: customer._id,
        participantName: res.chat?.user?.name || customer.name || i18n.t('glossary.customer'),
        participantAvatar: res.chat?.user?.avatar || customer.avatar || null,
        role: 'repairman',
      });
    } else {
      setNotice({
        type: 'error',
        title: i18n.t('customer.couldNotOpenTheChat2'),
        message: res.message || i18n.t('customer.pleaseTryAgain'),
      });
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <RepairmanHeader navigation={navigation} />

      {detail.loading && !detail.data ? (
        <LoadingState text={t('repairman.loadingJob')} />
      ) : detail.error || !booking ? (
        <ErrorState
          error={detail.error}
          onRetry={() => detail.reload()}
          fullScreen
        />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.body,
            { paddingBottom: insets.bottom + 30 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <Squeeze onPress={() => navigation.goBack()} scale={0.95}>
            <View style={styles.backWrap}>
              <Icon source={arrowLeftBold} size={16} color={colors.primary} />
              <Text style={[styles.backText, { color: colors.primary }]}>
                {t('repairman.backToMyJobs')}
              </Text>
            </View>
          </Squeeze>

          <FadeUp delay={40} duration={400}>
            <Text style={[styles.title, { color: colors.text }]}>{device}</Text>
            <View
              style={[
                styles.banner,
                { backgroundColor: colors.surface, borderColor: tone },
              ]}
            >
              <View style={[styles.pill, { backgroundColor: tone + '22' }]}>
                <Text style={[styles.pillText, { color: tone }]}>
                  {statusLabel(status)}
                </Text>
              </View>
              <Text style={[styles.bannerText, { color: colors.text }]}>
                {statusHint(status)}
              </Text>
            </View>

            {transitions.length > 0 ? (
              <Button
                title={t('repairman.updateStatus')}
                icon={penBold}
                iconPosition="left"
                onPress={() => setUpdateOpen(true)}
                style={styles.action}
              />
            ) : (
              <Text style={[styles.hint, { color: colors.textMuted }]}>
                {t('repairman.noFurtherStatusUpdatesAre')}
              </Text>
            )}
            {customer?._id ? (
              <Button
                title={t('repairman.messageCustomer')}
                variant="outline"
                icon={commentDotsBold}
                iconPosition="left"
                loading={chatLoading}
                onPress={messageCustomer}
                style={styles.action}
              />
            ) : null}
          </FadeUp>

          {booking.dispute ? (
            <FadeUp delay={60} duration={400}>
              <View
                style={[
                  styles.dispute,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.error,
                  },
                ]}
              >
                <Icon
                  source={exclamationCircleBold}
                  size={20}
                  color={colors.error}
                />
                <Text style={[styles.bannerText, { color: colors.text }]}>
                  {i18n.t('repairmanMsg.disputeRaised', {
                    category: booking.dispute.category
                      ? ` (${i18n.t(`dispute.categories.${booking.dispute.category}`, { defaultValue: String(booking.dispute.category).replace(/_/g, ' ') })})`
                      : '',
                  })}
                  {booking.dispute.status
                    ? ` ${i18n.t('repairmanMsg.disputeStatusIs', { status: statusLabel(booking.dispute.status) })}`
                    : ''}
                </Text>
              </View>
              {booking.dispute._id ? (
                <Button
                  title={t('repairman.viewDispute')}
                  variant="outline"
                  size="sm"
                  style={styles.action}
                  onPress={() =>
                    navigation.navigate('DisputeDetail', {
                      disputeId: booking.dispute._id,
                    })
                  }
                />
              ) : null}
            </FadeUp>
          ) : null}

          <FadeUp delay={80} duration={400}>
            <Card icon={couponBold} title={t('glossary.booking')}>
              <Line label={t('customer.total')} value={money(pricing?.totalAmount)} />
              <Line label={t('repairman.basePrice')} value={money(pricing?.basePrice)} />
              <Line label={t('repairman.parts')} value={money(pricing?.partsPrice)} />
              <Line
                label={t('repairman.serviceCharge')}
                value={
                  pricing?.serviceCharge ? money(pricing.serviceCharge) : ''
                }
              />
              <Line
                icon={settingsBold}
                label={t('repairman.serviceType')}
                value={serviceTypeLabel(booking.bookingDetails?.serviceType)}
              />
              <Line
                icon={calendarBold}
                label={t('repairman.scheduled')}
                value={formatDate(booking.bookingDetails?.scheduledDate)}
              />
              <Line
                icon={clockBold}
                label={t('repairman.estimatedCompletion')}
                value={formatDateTime(
                  booking.tracking?.estimatedCompletion ||
                    booking.bookingDetails?.estimatedCompletion,
                )}
              />
              <Line
                label={t('repairman.completedOn')}
                value={formatDateTime(booking.tracking?.actualCompletion)}
              />
              <Line
                label={t('glossary.warranty')}
                value={warranty ? i18n.t('repairmanMsg.daysValue', { count: warranty }) : ''}
              />
              <Line label={t('repairman.delay')} value={booking.tracking?.delays} />
            </Card>
          </FadeUp>

          <FadeUp delay={110} duration={400}>
            <Card icon={mobileBold} title={t('repairman.job')}>
              <Line label={t('repairman.device')} value={device} />
              <Line
                label={t('repairman.priority')}
                value={urgencyLabel(
                  bookingUrgency({
                    isQuotationBased: booking.isQuotationBased,
                    jobDetails: job,
                  }),
                )}
              />
              <Line label={t('repairman.services')} value={bookingServices(job).join(', ')} />
              <Line
                icon={fileBold}
                label={t('customer.description')}
                value={job?.description}
              />
              <Line
                label={t('repairman.partsQuality')}
                value={
                  job?.partsQuality
                    ? String(job.partsQuality).replace(/[-_]/g, ' ')
                    : ''
                }
              />
            </Card>
          </FadeUp>

          {customer ? (
            <FadeUp delay={140} duration={400}>
              <Card icon={userBold} title={t('glossary.customer')}>
                <Line icon={userBold} label={t('repairman.name')} value={customer.name} />
                <Line
                  icon={phoneBold}
                  label={t('customer.phone')}
                  value={customer.phone || booking.communication?.customerPhone}
                />
                <Line
                  icon={envelopeBold}
                  label={t('customer.email')}
                  value={customer.email}
                />
              </Card>
            </FadeUp>
          ) : null}

          {place || job?.location?.address ? (
            <FadeUp delay={170} duration={400}>
              <Card icon={mapPinBold} title={t('customer.location')}>
                <Line label={t('repairman.area')} value={place} />
                <Line label={t('customer.address')} value={job?.location?.address} />
                <Line label={t('repairman.zipCode')} value={job?.location?.zipCode} />
              </Card>
            </FadeUp>
          ) : null}

          <FadeUp delay={200} duration={400}>
            <Card icon={clockBold} title={t('repairman.timeline')}>
              {booking.timeline?.length ? (
                booking.timeline.map(entry => (
                  <View
                    key={`${entry.status}-${entry.timestamp}`}
                    style={styles.line}
                  >
                    <View
                      style={[styles.dot, { backgroundColor: colors.primary }]}
                    />
                    <View style={styles.flex}>
                      <Text style={[styles.lineValue, { color: colors.text }]}>
                        {entry.title}
                      </Text>
                      <Text
                        style={[styles.lineLabel, { color: colors.textMuted }]}
                      >
                        {formatDateTime(entry.timestamp)}
                        {entry.description ? `  •  ${entry.description}` : ''}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={[styles.lineLabel, { color: colors.textMuted }]}>
                  {t('repairman.noUpdatesYet')}
                </Text>
              )}
            </Card>
          </FadeUp>
        </ScrollView>
      )}

      <UpdateStatusModal
        visible={updateOpen}
        bookingId={bookingId}
        device={device}
        transitions={transitions}
        onClose={() => setUpdateOpen(false)}
        onUpdated={message => {
          setUpdateOpen(false);
          // My Jobs, My Offers, the Dashboard and the Job Board reload when shown; the customer gets a notification
          markOffersChanged();
          setNotice({ type: 'success', title: i18n.t('repairman.statusUpdated'), message });
          detail.reload(true);
        }}
      />

      <AlertModal
        visible={Boolean(notice)}
        type={notice?.type}
        title={notice?.title}
        message={notice?.message}
        onClose={() => setNotice(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  body: { paddingHorizontal: 20, paddingTop: 14 },
  backWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  backText: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 14 },
  title: { fontFamily: fonts.bold, fontSize: 22, marginTop: 16 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 14,
  },
  pill: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontFamily: fonts.bold, fontSize: 11 },
  bannerText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 19,
  },
  dispute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 12,
  },
  action: { marginTop: 12 },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 15 },
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  lineLabel: { fontFamily: fonts.regular, fontSize: 12 },
  lineValue: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
});
