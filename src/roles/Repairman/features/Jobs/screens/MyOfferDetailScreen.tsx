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
import ConfirmModal from '@/components/ConfirmModal';
import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { ErrorState, LoadingState } from '@/components/states';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  checkCircleBold,
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
import { getWebRepairmanOfferEditUrl } from '@/constants/config';
import repairmanApi, { MyOffer } from '@/roles/Repairman/api/repairmanApi';
import { markOffersChanged } from '@/roles/Repairman/utils/offerEvents';
import useApiData from '@/roles/Repairman/utils/useApiData';
import { openWebsite } from '@/roles/Seller/utils/sellerUtils';
import { normalizeApiError } from '@/services/apiError';
import { formatDate } from '@/utils/dateFormat';
import { formatMoney } from '@/utils/money';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import RepairmanHeader from '../../../components/RepairmanHeader';
import WithdrawOfferModal from '../components/WithdrawOfferModal';
import { urgencyLabel } from '../utils/jobBoard';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { statusLabel } from '@/utils/labels';

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

export default function MyOfferDetailScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const offerId: string = route.params?.offerId;
  // The list sends the offer with its numeric prices (the detail request only has prices as formatted text)
  const listOffer: MyOffer | undefined = route.params?.offer;

  const detail = useApiData(
    () => repairmanApi.getOfferDetail(offerId),
    [offerId],
  );

  const [refreshing, setRefreshing] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [confirmAccept, setConfirmAccept] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const busy = useRef(false);
  const [notice, setNotice] = useState<{
    type: AlertModalType;
    title: string;
    message: string;
    leave?: boolean;
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

  const accept = async () => {
    if (busy.current) return;
    busy.current = true;
    setConfirmAccept(false);
    setAccepting(true);
    try {
      const { message } = await repairmanApi.acceptOffer(offerId);
      markOffersChanged();
      setNotice({
        type: 'success',
        title: i18n.t('repairman.offerConfirmed'),
        message: message || i18n.t('repairman.offerAcceptedSuccessfully'),
      });
      detail.reload(true);
    } catch (e) {
      setNotice({
        type: 'error',
        title: i18n.t('repairman.couldNotAccept'),
        message: normalizeApiError(e).message,
      });
    } finally {
      busy.current = false;
      setAccepting(false);
    }
  };

  const openEditOnWebsite = async () => {
    const url = getWebRepairmanOfferEditUrl(offerId);
    if (!(await openWebsite(url))) {
      setNotice({
        type: 'info',
        title: i18n.t('repairman.openOnTheWebsite'),
        message: i18n.t('settings.openAddress', { url }),
      });
    }
  };

  const data = detail.data;
  const job = data?.job;
  const offer = data?.offerDetails;
  const status = offer?.status || listOffer?.status || 'pending';
  const expired = Boolean(offer?.isExpired) && status === 'pending';
  const currency =
    listOffer?.pricing?.currency || job?.budget?.currency || 'TRY';
  const device = [
    job?.deviceInfo?.brandName || job?.deviceInfo?.brand,
    job?.deviceInfo?.modelName || job?.deviceInfo?.model,
  ]
    .filter(Boolean)
    .join(' ');
  const title =
    device ||
    (listOffer
      ? [listOffer.jobId?.deviceInfo?.brand, listOffer.jobId?.deviceInfo?.model]
          .filter(Boolean)
          .join(' ')
      : '') ||
    t('repairman.repairJob');
  const serviceOptions = offer?.serviceOptions;
  const customer = job?.customerId;

  const money = (value: number | undefined, fallbackText: string | undefined) =>
    typeof value === 'number' ? formatMoney(value, currency) : fallbackText;

  const banner = (() => {
    if (expired)
      return { tone: colors.textMuted, text: i18n.t('repairman.thisOfferHasExpired') };
    switch (status) {
      case 'pending':
        return {
          tone: colors.primary,
          text: i18n.t('repairman.waitingForTheCustomerTo'),
        };
      case 'accepted':
        return {
          tone: colors.success,
          text: i18n.t('repairman.theCustomerAcceptedYourOffer'),
        };
      case 'confirmed':
        return {
          tone: colors.success,
          text: i18n.t('repairman.youConfirmedThisOfferThe'),
        };
      case 'rejected':
        return { tone: colors.error, text: i18n.t('repairman.thisOfferWasRejected') };
      case 'withdrawn':
        return { tone: colors.textMuted, text: i18n.t('repairman.youWithdrewThisOffer') };
      default:
        return { tone: colors.textMuted, text: i18n.t('customerMsg.statusLine', { status: statusLabel(status) }) };
    }
  })();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <RepairmanHeader navigation={navigation} />

      {detail.loading && !data ? (
        <LoadingState text={t('repairman.loadingOffer')} />
      ) : detail.error || !data || !job || !offer ? (
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
                {t('repairman.backToMyOffers')}
              </Text>
            </View>
          </Squeeze>

          <FadeUp delay={40} duration={400}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <View
              style={[
                styles.banner,
                { backgroundColor: colors.surface, borderColor: banner.tone },
              ]}
            >
              <Icon
                source={
                  status === 'rejected' || expired
                    ? exclamationCircleBold
                    : checkCircleBold
                }
                size={20}
                color={banner.tone}
              />
              <Text style={[styles.bannerText, { color: colors.text }]}>
                {banner.text}
              </Text>
            </View>

            {status === 'accepted' ? (
              <Button
                title={t('repairman.confirmOffer')}
                icon={checkCircleBold}
                iconPosition="left"
                loading={accepting}
                onPress={() => setConfirmAccept(true)}
                style={styles.action}
              />
            ) : null}
            {status === 'pending' && !expired ? (
              <>
                <Button
                  title={t('repairman.editOnTheWebsite')}
                  icon={penBold}
                  iconPosition="left"
                  variant="soft"
                  onPress={openEditOnWebsite}
                  style={styles.action}
                />
                <Button
                  title={t('repairman.withdrawOffer')}
                  variant="outline"
                  onPress={() => setWithdrawOpen(true)}
                  style={styles.action}
                />
                <Text style={[styles.hint, { color: colors.textMuted }]}>
                  {t('repairman.pricesTimeWarrantyAndDescription')}
                </Text>
              </>
            ) : null}
            {status === 'confirmed' ? (
              <Button
                title={t('repairman.openMyJobs')}
                variant="soft"
                onPress={() =>
                  navigation.navigate('Home', {
                    screen: 'JobsTab',
                    params: { tab: 'MyJobs', at: Date.now() },
                  })
                }
                style={styles.action}
              />
            ) : null}
          </FadeUp>

          <FadeUp delay={80} duration={400}>
            <Card icon={couponBold} title={t('repairman.yourOffer')}>
              <Line
                label={t('repairman.basePrice')}
                value={money(
                  listOffer?.pricing?.basePrice,
                  offer.pricing.basePrice,
                )}
              />
              <Line
                label={t('repairman.partsCost')}
                value={money(
                  listOffer?.pricing?.partsEstimate ?? 0,
                  offer.pricing.partsEstimate,
                )}
              />
              <Line
                label={t('repairman.totalPrice')}
                value={money(
                  listOffer?.pricing?.totalPrice,
                  offer.pricing.totalPrice,
                )}
              />
              <Line label={t('repairman.estimatedTime')} value={offer.estimatedTime} />
              <Line
                label={t('glossary.warranty')}
                value={
                  offer.warranty?.duration
                    ? i18n.t('repairmanMsg.daysValue', { count: offer.warranty.duration })
                    : ''
                }
              />
              <Line
                label={t('repairman.pickupService')}
                value={
                  serviceOptions?.pickupAvailable
                    ? serviceOptions.pickupCharge
                      ? `Yes, ${formatMoney(
                          serviceOptions.pickupCharge,
                          currency,
                        )}`
                      : t('repairman.yesFree')
                    : ''
                }
              />
              <Line
                label={t('repairman.homeService')}
                value={
                  serviceOptions?.homeService
                    ? serviceOptions.homeServiceCharge
                      ? `Yes, ${formatMoney(
                          serviceOptions.homeServiceCharge,
                          currency,
                        )}`
                      : t('repairman.yesFree')
                    : ''
                }
              />
              <Line
                icon={fileBold}
                label={t('customer.description')}
                value={offer.description}
              />
              {offer.requiredParts?.length ? (
                <Line
                  label={t('repairman.parts')}
                  value={offer.requiredParts.map(p => p.name).join(', ')}
                />
              ) : null}
              {offer.servicesIncluded?.length ? (
                <Line
                  label={t('repairman.servicesIncluded')}
                  value={offer.servicesIncluded.map(s => s.name).join(', ')}
                />
              ) : null}
            </Card>
          </FadeUp>

          {customer ? (
            <FadeUp delay={120} duration={400}>
              <Card icon={userBold} title={t('glossary.customer')}>
                <Line icon={userBold} label={t('repairman.name')} value={customer.name} />
                <Line
                  icon={envelopeBold}
                  label={t('customer.email')}
                  value={customer.email}
                />
                <Line icon={phoneBold} label={t('customer.phone')} value={customer.phone} />
              </Card>
            </FadeUp>
          ) : null}

          <FadeUp delay={160} duration={400}>
            <Card icon={mobileBold} title={t('repairman.job')}>
              <Line label={t('repairman.device')} value={device} />
              <Line
                label={t('repairman.budget')}
                value={
                  job.budget
                    ? `${formatMoney(
                        job.budget.min,
                        job.budget.currency || 'TRY',
                      )} - ${formatMoney(
                        job.budget.max,
                        job.budget.currency || 'TRY',
                      )}`
                    : ''
                }
              />
              <Line
                label={t('repairman.priority')}
                value={job.urgency ? urgencyLabel(job.urgency) : ''}
              />
              <Line label={t('repairman.jobExpires')} value={formatDate(job.expiresAt)} />
              <Line label={t('customer.description')} value={job.description} />
              {job.services?.length ? (
                <Line
                  icon={settingsBold}
                  label={t('repairman.servicesRequired')}
                  value={job.services.map(s => s.name).join(', ')}
                />
              ) : null}
            </Card>
          </FadeUp>

          <FadeUp delay={200} duration={400}>
            <Card icon={mapPinBold} title={t('customer.location')}>
              <Line
                label={t('repairman.area')}
                value={[
                  job.formattedLocation?.city,
                  job.formattedLocation?.state,
                  job.formattedLocation?.country,
                ]
                  .filter(Boolean)
                  .join(', ')}
              />
              <Line label={t('customer.address')} value={job.location?.address} />
              <Line label={t('repairman.zipCode')} value={job.formattedLocation?.zipCode} />
            </Card>
          </FadeUp>

          <FadeUp delay={240} duration={400}>
            <Card icon={fileBold} title={t('repairman.offerInformation')}>
              <Line label={t('repairman.created')} value={formatDate(offer.createdAt)} />
              <Line label={t('repairman.offerExpires')} value={formatDate(offer.expiresAt)} />
            </Card>
          </FadeUp>
        </ScrollView>
      )}

      <WithdrawOfferModal
        visible={withdrawOpen}
        offerId={offerId}
        title={title}
        onClose={() => setWithdrawOpen(false)}
        onWithdrawn={message => {
          setWithdrawOpen(false);
          markOffersChanged();
          setNotice({
            type: 'success',
            title: i18n.t('repairman.offerWithdrawn'),
            message,
            leave: true,
          });
        }}
      />

      <ConfirmModal
        visible={confirmAccept}
        title={t('repairman.confirmThisOffer')}
        message={t('repairman.theCustomerAcceptedYourOffer')}
        confirmText={t('common.confirm')}
        cancelText={t('repairman.notNow')}
        onCancel={() => setConfirmAccept(false)}
        onConfirm={accept}
      />

      <AlertModal
        visible={Boolean(notice)}
        type={notice?.type}
        title={notice?.title}
        message={notice?.message}
        onClose={() => {
          const leave = notice?.leave;
          setNotice(null);
          if (leave) navigation.goBack();
        }}
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
  bannerText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 19,
  },
  action: { marginTop: 12 },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
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
});
