import { ReactNode, useEffect, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import Squeeze from '@/components/Squeeze';
import AlertModal from '@/components/AlertModal';
import { ErrorState, LoadingState } from '@/components/states';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  calendarBold,
  clockBold,
  couponBold,
  eyeBold,
  fileBold,
  imageBold,
  mapPinBold,
  mobileBold,
  settingsBold,
  shieldBold,
} from '@/assets/icons';
import repairmanApi, { JobOfferInfo } from '@/roles/Repairman/api/repairmanApi';
import { useOffersChangedChecker } from '@/roles/Repairman/utils/offerEvents';
import useApiData from '@/roles/Repairman/utils/useApiData';
import { normalizeApiError } from '@/services/apiError';
import { formatDate, timeAgo, timeRemaining } from '@/utils/dateFormat';
import { serviceTypeLabel, statusLabel } from '@/utils/labels';
import { formatMoney } from '@/utils/money';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import RepairmanHeader from '../../../components/RepairmanHeader';
import {
  getProposalAccess,
  isExpired,
  jobStatusLabel,
  urgencyLabel,
} from '../utils/jobBoard';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

// the shown text comes from serviceTypeLabel(); "both" has its own text
const preferenceLabel = (value?: string): string =>
  value === 'both' ? i18n.t('repairmanMsg.pickupOrDropoff') : value ? serviceTypeLabel(value) : '';

function InfoBox({
  icon,
  label,
  value,
}: {
  icon: number;
  label: string;
  value: string | number;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.infoBox, { backgroundColor: colors.surfaceAlt }]}>
      <View style={[styles.infoIcon, { backgroundColor: colors.surface }]}>
        <Icon source={icon} size={16} color={colors.primary} />
      </View>
      <Text style={[styles.infoLabel, { color: colors.textMuted }]}>
        {label}
      </Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

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

function Line({ label, value }: { label: string; value?: string | null }) {
  const { colors } = useTheme();
  if (!value) return null;

  return (
    <View style={styles.line}>
      <Text style={[styles.lineLabel, { color: colors.textMuted }]}>
        {label}
      </Text>
      <Text style={[styles.lineValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

export default function JobBoardDetailScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const jobId: string = route.params?.jobId;
  const focused = useIsFocused();
  const offersChanged = useOffersChangedChecker();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState('');

  // The job (same request as the web) and whether the backend still takes offers for it.
  // A 404 from the offers route only means "no longer accepting offers", not a failure.
  const detail = useApiData(async () => {
    const job = await repairmanApi.getJobById(jobId);
    let info: JobOfferInfo | null = null;
    try {
      info = await repairmanApi.getJobOfferInfo(jobId);
    } catch (e) {
      const error = normalizeApiError(e);
      if (error.status !== 404) throw error;
    }
    return { job, info };
  }, [jobId]);

  // Coming back from Send Proposal: show the new "offer sent" state
  useEffect(() => {
    if (focused && offersChanged()) detail.reload(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused]);

  const onRefresh = async () => {
    setRefreshing(true);
    const error = await detail.reload(true);
    setRefreshing(false);
    if (error) setRefreshError(error.message);
  };

  const job = detail.data?.job;
  const info = detail.data?.info || null;
  const access = job ? getProposalAccess(job, info) : null;
  const currency = job?.budget?.currency || 'TRY';
  const place = [
    job?.location?.city?.name,
    job?.location?.state?.name,
    job?.location?.country?.name,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <RepairmanHeader navigation={navigation} />

      {detail.loading ? (
        <LoadingState text={t('repairman.loadingJob')} />
      ) : detail.error || !job ? (
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
                {t('repairman.backToJobBoard')}
              </Text>
            </View>
          </Squeeze>

          <FadeUp delay={60} duration={450}>
            <View style={styles.titleRow}>
              <View style={[styles.deviceIcon, { borderColor: colors.border }]}>
                <Icon source={mobileBold} size={18} color={colors.primary} />
              </View>
              <View style={styles.titleText}>
                <Text style={[styles.deviceName, { color: colors.text }]}>
                  {job.deviceInfo.brand} {job.deviceInfo.model}
                </Text>
                {job.title ? (
                  <Text
                    style={[styles.warrantyText, { color: colors.textMuted }]}
                  >
                    {job.title}
                  </Text>
                ) : null}
              </View>
              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: colors.success + '22' },
                ]}
              >
                <Text style={[styles.statusText, { color: colors.success }]}>
                  {jobStatusLabel(job)}
                </Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaPill}>
                <Icon source={clockBold} size={12} color={colors.textMuted} />
                <Text style={[styles.metaText, { color: colors.textMuted }]}>
                  {i18n.t('repairmanMsg.posted', { when: timeAgo(job.createdAt) })}
                </Text>
              </View>
              {job.location?.city?.name ? (
                <View style={styles.metaPill}>
                  <Icon
                    source={mapPinBold}
                    size={12}
                    color={colors.textMuted}
                  />
                  <Text style={[styles.metaText, { color: colors.textMuted }]}>
                    {job.location.city.name}
                  </Text>
                </View>
              ) : null}
              <View
                style={[
                  styles.priorityPill,
                  { backgroundColor: colors.primary + '18' },
                ]}
              >
                <Text style={[styles.priorityText, { color: colors.primary }]}>
                  {urgencyLabel(job.urgency)}
                </Text>
              </View>
            </View>
            {job.expiresAt ? (
              <Text style={[styles.expires, { color: colors.primary }]}>
                {isExpired(job)
                  ? t('repairman.thisJobHasExpired')
                  : i18n.t('repairmanMsg.expiresIn', { time: timeRemaining(job.expiresAt) })}
              </Text>
            ) : null}
          </FadeUp>

          <FadeUp delay={100} duration={450}>
            <View style={styles.infoGrid}>
              <InfoBox
                icon={couponBold}
                label={t('repairman.budgetRange')}
                value={`${formatMoney(
                  job.budget?.min,
                  currency,
                )} - ${formatMoney(job.budget?.max, currency)}`}
              />
              <InfoBox
                icon={calendarBold}
                label={t('repairman.preferredDate')}
                value={formatDate(job.preferredTime) || i18n.t('repairmanMsg.flexible')}
              />
              <InfoBox
                icon={fileBold}
                label={t('repairman.totalOffers')}
                value={`${
                  info?.competition.totalOffers ?? job.offers?.length ?? 0
                } / ${job.maxOffers ?? 10}`}
              />
              <InfoBox
                icon={eyeBold}
                label="VIEWS"
                value={job.viewCount ?? 0}
              />
            </View>
          </FadeUp>

          <FadeUp delay={140} duration={450}>
            <Card icon={fileBold} title={t('repairman.jobDescription')}>
              <Text style={[styles.cardText, { color: colors.textMuted }]}>
                {job.description}
              </Text>
            </Card>
          </FadeUp>

          {job.services?.length ? (
            <FadeUp delay={180} duration={450}>
              <Card icon={settingsBold} title={t('repairman.requestedServices')}>
                {job.services.map(service => (
                  <View
                    key={service._id}
                    style={[
                      styles.serviceRow,
                      { backgroundColor: colors.surfaceAlt },
                    ]}
                  >
                    <Text style={[styles.serviceName, { color: colors.text }]}>
                      {service.name}
                    </Text>
                    {service.description ? (
                      <Text
                        style={[
                          styles.serviceDescription,
                          { color: colors.textMuted },
                        ]}
                      >
                        {service.description}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </Card>
            </FadeUp>
          ) : null}

          <FadeUp delay={220} duration={450}>
            <Card icon={mobileBold} title={t('repairman.device')}>
              <Line label={t('customer.brand2')} value={job.deviceInfo.brand} />
              <Line label={t('customer.model')} value={job.deviceInfo.model} />
              <Line label={t('customer.color')} value={job.deviceInfo.color} />
              <Line
                label={t('glossary.warranty')}
                value={
                  job.deviceInfo.warrantyStatus
                    ? statusLabel(job.deviceInfo.warrantyStatus)
                    : ''
                }
              />
              <Line
                label={t('repairman.servicePreference')}
                value={preferenceLabel(job.servicePreference)}
              />
            </Card>
          </FadeUp>

          <FadeUp delay={260} duration={450}>
            <Card icon={mapPinBold} title={t('customer.location')}>
              <Line label={t('customer.address')} value={job.location?.address} />
              <Line label={t('repairman.area')} value={place} />
              <Line label={t('repairman.zipCode')} value={job.location?.zipCode} />
            </Card>
          </FadeUp>

          {job.images?.length ? (
            <FadeUp delay={300} duration={450}>
              <Card icon={imageBold} title={t('repairman.photos')}>
                <View style={styles.photos}>
                  {job.images.map((image, index) => (
                    <Image
                      key={`${image.url}-${index}`}
                      source={{ uri: image.url }}
                      style={[styles.photo, { borderColor: colors.border }]}
                    />
                  ))}
                </View>
              </Card>
            </FadeUp>
          ) : null}

          <FadeUp delay={340} duration={450}>
            {access?.allowed ? (
              <Button
                title={t('repairman.sendProposal')}
                icon={couponBold}
                iconPosition="left"
                onPress={() =>
                  navigation.navigate('SendProposal', {
                    jobId: job._id,
                    device: `${job.deviceInfo.brand} ${job.deviceInfo.model}`,
                    budgetMin: job.budget?.min,
                    budgetMax: job.budget?.max,
                    currency,
                    suggestedPrice: info?.recommendations.suggestedPrice,
                  })
                }
                style={styles.sendButton}
              />
            ) : (
              <View
                style={[
                  styles.notice,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Icon source={shieldBold} size={20} color={colors.primary} />
                <Text style={[styles.noticeText, { color: colors.text }]}>
                  {access?.reason}
                </Text>
              </View>
            )}
            {info?.repairmanStatus.hasSubmittedOffer ? (
              <Button
                title={t('repairman.viewMyOffers')}
                variant="soft"
                onPress={() =>
                  navigation.navigate('Home', {
                    screen: 'JobsTab',
                    params: { tab: 'MyOffers', at: Date.now() },
                  })
                }
                style={styles.sendButton}
              />
            ) : null}
          </FadeUp>
        </ScrollView>
      )}

      <AlertModal
        visible={Boolean(refreshError)}
        type="error"
        title={t('customer.couldNotRefresh')}
        message={refreshError}
        onClose={() => setRefreshError('')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 20, paddingTop: 14 },
  backWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  backText: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 14 },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  deviceIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: { flex: 1 },
  deviceName: { fontFamily: fonts.bold, fontSize: 18 },
  warrantyText: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  statusPill: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  statusText: { fontFamily: fonts.bold, fontSize: 12 },

  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
    alignItems: 'center',
  },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 12 },
  priorityPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  priorityText: { fontFamily: fonts.bold, fontSize: 11 },
  expires: { fontFamily: fonts.medium, fontSize: 12, marginTop: 10 },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 18 },
  infoBox: { width: '48%', borderRadius: 12, padding: 12, gap: 6 },
  infoIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: { fontFamily: fonts.medium, fontSize: 10, letterSpacing: 0.4 },
  infoValue: { fontFamily: fonts.bold, fontSize: 14 },

  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginTop: 16,
    gap: 10,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 15 },
  cardText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },

  serviceRow: { borderRadius: 10, padding: 12, gap: 4 },
  serviceName: { fontFamily: fonts.bold, fontSize: 13 },
  serviceDescription: { fontFamily: fonts.regular, fontSize: 12 },

  line: { gap: 2 },
  lineLabel: { fontFamily: fonts.regular, fontSize: 12 },
  lineValue: { fontFamily: fonts.medium, fontSize: 14 },

  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photo: { width: 90, height: 90, borderRadius: 10, borderWidth: 1 },

  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 20,
  },
  noticeText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 19,
  },
  sendButton: { marginTop: 20 },
});
