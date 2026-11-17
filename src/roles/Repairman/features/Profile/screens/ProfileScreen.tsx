import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { Image, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useOffersChangedChecker } from '@/roles/Repairman/utils/offerEvents';
import useRefreshOnActive from '@/utils/useRefreshOnActive';

import AlertModal from '@/components/AlertModal';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { ErrorState, LoadingState } from '@/components/states';
import {
  arrowLeftBold,
  bookmarkBold,
  checkCircleBold,
  clockBold,
  dummyProfileExtra,
  envelopeBold,
  exclamationCircleBold,
  fileBold,
  infoCircleBold,
  mapPinBold,
  packageBold,
  penBold,
  phoneBold,
  starBold,
  toolExtra,
  userBold,
} from '@/assets/icons';
import { getWebRepairmanProfileEditUrl } from '@/constants/config';
import repairmanApi, { RepairmanProfile } from '@/roles/Repairman/api/repairmanApi';
import { openWebsite } from '@/roles/Seller/utils/sellerUtils';
import AuthService from '@/services/authService';
import { ApiError, normalizeApiError } from '@/services/apiError';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { getLocaleTag } from '@/i18n/locale';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { statusLabel } from '@/utils/labels';
import { weekdayLongName } from '@/utils/dateFormat';

const NOT_SET = '';

function formatDate(value?: string) {
  if (!value) return NOT_SET;
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? NOT_SET
    : d.toLocaleDateString(getLocaleTag(), { day: '2-digit', month: 'short', year: 'numeric' });
}

function years(start?: number, end?: number) {
  return [start, end].filter(Boolean).join(' - ');
}

function Card({ icon, title, children }: { icon: number; title: string; children: ReactNode }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHead}>
        <Icon source={icon} size={18} color={colors.primary} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.text }]}>{value || NOT_SET}</Text>
    </View>
  );
}

function Empty({ text }: { text: string }) {
  const { colors } = useTheme();
  return <Text style={[styles.muted, { color: colors.textMuted }]}>{text}</Text>;
}

export default function RepairmanProfileScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<RepairmanProfile | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [linkFailed, setLinkFailed] = useState(false);

  const load = useCallback(async (mode: 'first' | 'refresh' | 'silent' = 'first') => {
    if (mode === 'refresh') setRefreshing(true);
    else if (mode === 'first') setLoading(true);
    try {
      const data = await repairmanApi.getProfile();
      setProfile(data);
      setError(null);

      const cached = AuthService.getCachedUser();
      const photo = data.user.repairmanProfile?.profilePhoto || data.user.profileImage;
      AuthService.setCachedSession(
        { ...cached, name: data.user.name || cached?.name, profileImage: photo || cached?.profileImage },
        AuthService.getCachedRole(),
      );
    } catch (e) {
      if (mode !== 'silent') setError(normalizeApiError(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // The bank details were saved (or a job changed the numbers): the profile reloads quietly when it is shown again
  const focused = useIsFocused();
  const changed = useOffersChangedChecker();
  const loadRef = useRef(load);
  loadRef.current = load;
  const markLoaded = useRefreshOnActive(focused, () => loadRef.current('silent').then(markLoaded), changed);
  useEffect(() => {
    if (profile) markLoaded();
  }, [profile, markLoaded]);

  const openEditOnWebsite = async () => {
    if (!(await openWebsite(getWebRepairmanProfileEditUrl()))) setLinkFailed(true);
  };

  const user = profile?.user;
  const rp = user?.repairmanProfile;
  const photo = rp?.profilePhoto || user?.profileImage;
  const hours =
    rp?.workingHours?.start && rp?.workingHours?.end
      ? `${rp.workingHours.start} - ${rp.workingHours.end}`
      : '';
  const location = [user?.city?.name, user?.state?.name, user?.country?.name]
    .filter(Boolean)
    .join(', ');
  const stats = profile?.serviceCatalog.stats;
  const catalogCounts: [string, number | undefined][] = [
    [statusLabel('total'), stats?.total],
    [statusLabel('approved'), stats?.approved],
    [statusLabel('pending'), stats?.pending],
    [statusLabel('rejected'), stats?.rejected],
  ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        {navigation?.canGoBack() ? (
          <Squeeze onPress={() => navigation.goBack()} scale={0.9}>
            <View style={[styles.circle, { backgroundColor: colors.primary }]}>
              <Icon source={arrowLeftBold} size={18} color={colors.onPrimary} />
            </View>
          </Squeeze>
        ) : (
          <View style={styles.circle} />
        )}
        <Text style={[styles.topTitle, { color: colors.text }]}>{t('repairman.profile')}</Text>
        <Squeeze onPress={openEditOnWebsite} scale={0.9}>
          <View
            style={[
              styles.circle,
              styles.outlined,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <Icon source={penBold} size={16} color={colors.primary} />
          </View>
        </Squeeze>
      </View>

      {loading && !profile ? (
        <LoadingState text={t('repairman.loadingProfile')} />
      ) : error && !profile ? (
        <ErrorState error={error} onRetry={() => load()} fullScreen />
      ) : user && rp ? (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load('refresh')}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }>
          <View style={styles.header}>
            <Image
              source={photo ? { uri: photo } : dummyProfileExtra}
              style={[styles.avatar, { borderColor: colors.avatarBorder }]}
            />
            <Text style={[styles.name, { color: colors.text }]}>{rp.fullName || user.name}</Text>
            {Boolean(rp.shopName) && (
              <Text style={[styles.shop, { color: colors.primary }]}>{rp.shopName}</Text>
            )}
            <View style={styles.meta}>
              {Boolean(user.city?.name) && (
                <View style={styles.metaItem}>
                  <Icon source={mapPinBold} size={14} color={colors.textMuted} />
                  <Text style={[styles.metaText, { color: colors.textMuted }]}>{user.city?.name}</Text>
                </View>
              )}
              {Boolean(rp.yearsOfExperience) && (
                <View style={styles.metaItem}>
                  <Icon source={clockBold} size={14} color={colors.textMuted} />
                  <Text style={[styles.metaText, { color: colors.textMuted }]}>
                    {i18n.t('repairmanMsg.yearsExperience', { count: rp.yearsOfExperience })}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {!rp.isPaymentInformationCompleted && (
            <View
              style={[styles.alert, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
              <View style={styles.alertHead}>
                <Icon source={exclamationCircleBold} size={20} color={colors.primary} />
                <View style={styles.flex}>
                  <Text style={[styles.alertTitle, { color: colors.text }]}>
                    {t('repairman.completeYourBankDetails')}
                  </Text>
                  <Text style={[styles.muted, { color: colors.textMuted }]}>
                    {t('repairman.youNeedThemToWithdraw')}
                  </Text>
                </View>
              </View>
              <Button
                title={t('repairman.addBankDetails')}
                size="sm"
                onPress={() => navigation?.navigate('BankingInformation')}
              />
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Icon source={starBold} size={18} color={colors.primary} />
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('customer.rating')}</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {rp.rating ? `${rp.rating.toFixed(1)} ★` : t('repairman.noRating')}
              </Text>
            </View>
            <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Icon source={packageBold} size={18} color={colors.primary} />
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('repairman.totalJobs')}</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{rp.totalJobs ?? 0}</Text>
            </View>
            <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Icon source={bookmarkBold} size={18} color={colors.primary} />
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('repairman.reviews')}</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {user.reviewStats?.totalReviews ?? 0}
              </Text>
            </View>
          </View>

          {Boolean(rp.description) && (
            <Card icon={infoCircleBold} title={t('repairman.aboutMe')}>
              <Text style={[styles.body, { color: colors.textMuted }]}>{rp.description}</Text>
            </Card>
          )}

          <Card icon={starBold} title={t('repairman.specialization')}>
            {rp.specializations?.length ? (
              <View style={styles.pills}>
                {rp.specializations.map(item => (
                  <View
                    key={item}
                    style={[
                      styles.pill,
                      { borderColor: colors.primary, backgroundColor: colors.primary + '12' },
                    ]}>
                    <Text style={[styles.pillText, { color: colors.primary }]}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Empty text={t('repairman.noSpecializationAdded')} />
            )}
          </Card>

          <Card icon={clockBold} title={t('repairman.workingHours')}>
            <Row label={t('repairman.businessHours')} value={hours} />
            {rp.workingDays?.length ? (
              <View style={[styles.pills, styles.gapTop]}>
                {rp.workingDays.map(day => (
                  <View
                    key={day}
                    style={[styles.pill, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                    <Text style={[styles.pillText, { color: colors.text }]}>{weekdayLongName(day)}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </Card>

          <Card icon={toolExtra} title={t('repairman.serviceCatalog')}>
            <View style={styles.statsRow}>
              {catalogCounts.map(([label, count]) => (
                <View key={label} style={[styles.mini, { backgroundColor: colors.surfaceAlt }]}>
                  <Text style={[styles.statValue, { color: colors.text }]}>{count ?? 0}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
                </View>
              ))}
            </View>
            <Button
              title={t('repairman.viewAllServices')}
              size="sm"
              variant="soft"
              style={styles.gapTop}
              onPress={() => navigation?.navigate('ServiceCatalog')}
            />
          </Card>

          <Card icon={bookmarkBold} title={t('repairman.education')}>
            {rp.education?.length ? (
              rp.education.map(item => (
                <View key={item._id} style={[styles.item, { backgroundColor: colors.surfaceAlt }]}>
                  <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.itemSub, { color: colors.primary }]}>{item.institution}</Text>
                  {Boolean(item.description) && (
                    <Text style={[styles.muted, { color: colors.textMuted }]}>{item.description}</Text>
                  )}
                  <Text style={[styles.muted, { color: colors.textMuted }]}>
                    {years(item.startYear, item.endYear)}
                  </Text>
                </View>
              ))
            ) : (
              <Empty text={t('repairman.noEducationAdded')} />
            )}
          </Card>

          <Card icon={packageBold} title={t('repairman.experience')}>
            {rp.experience?.length ? (
              rp.experience.map(item => (
                <View key={item._id} style={[styles.item, { backgroundColor: colors.surfaceAlt }]}>
                  <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.itemSub, { color: colors.primary }]}>{item.companyName}</Text>
                  {Boolean(item.description) && (
                    <Text style={[styles.muted, { color: colors.textMuted }]}>{item.description}</Text>
                  )}
                  <Text style={[styles.muted, { color: colors.textMuted }]}>
                    {years(item.startYear, item.endYear)}
                  </Text>
                </View>
              ))
            ) : (
              <Empty text={t('repairman.noExperienceAdded')} />
            )}
          </Card>

          <Card icon={fileBold} title={t('repairman.certificationsAndLicenses')}>
            {rp.certificationsLicense?.length ? (
              rp.certificationsLicense.map(item => (
                <View key={item._id} style={[styles.item, { backgroundColor: colors.surfaceAlt }]}>
                  <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
                </View>
              ))
            ) : (
              <Empty text={t('repairman.noCertificatesAdded')} />
            )}
          </Card>

          <Card icon={phoneBold} title={t('repairman.contactInfo')}>
            <Row label={t('customer.phone')} value={rp.mobileNumber || user.phone} />
            <Row label={t('customer.email')} value={user.email} />
            <Row label={t('repairman.whatsapp')} value={rp.whatsappNumber} />
          </Card>

          <Card icon={mapPinBold} title={t('customer.location')}>
            <Row label={t('repairman.area')} value={location} />
            <Row label={t('repairman.fullAddress')} value={rp.fullAddress} />
            <Row label={t('repairman.zipCode2')} value={rp.zipCode} />
          </Card>

          <Card icon={userBold} title={t('repairman.emergencyContact')}>
            <Row label={t('repairman.contactPerson')} value={rp.emergencyContactPerson} />
            <Row label={t('repairman.contactNumber')} value={rp.emergencyContactNumber} />
          </Card>

          <Card icon={envelopeBold} title={t('repairman.accountInformation')}>
            <Row label={t('repairman.accountStatus')} value={user.status} />
            <Row label={t('repairman.memberSince')} value={formatDate(user.createdAt)} />
            <Row label={t('repairman.lastUpdate')} value={formatDate(user.profileLastUpdated || user.updatedAt)} />
            <Row label={t('repairman.pickupService')} value={rp.pickupService ? t('repairman.available') : t('repairman.notAvailable')} />
            <View
              style={[styles.pill, styles.gapTop, styles.selfStart, { borderColor: colors.success }]}>
              <Icon
                source={user.isEmailVerified ? checkCircleBold : exclamationCircleBold}
                size={13}
                color={colors.success}
              />
              <Text style={[styles.pillText, { color: colors.success }]}>
                {user.isEmailVerified ? t('repairman.emailVerified') : t('repairman.emailNotVerified')}
              </Text>
            </View>
          </Card>

          <Button title={t('repairman.editProfileOnTheWebsite')} variant="soft" onPress={openEditOnWebsite} />
          <Text style={[styles.muted, styles.note, { color: colors.textMuted }]}>
            {t('repairman.profileDetailsAndDocumentsAre')}
          </Text>
        </ScrollView>
      ) : null}

      <AlertModal
        visible={linkFailed}
        type="info"
        title={t('repairman.openOnTheWebsite')}
        message={i18n.t('settings.openAddress', { url: getWebRepairmanProfileEditUrl() })}
        onClose={() => setLinkFailed(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  selfStart: { alignSelf: 'flex-start' },
  outlined: { borderWidth: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  circle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  topTitle: { flexShrink: 1, fontFamily: fonts.bold, fontSize: 18 },
  content: { paddingHorizontal: 20, gap: 14 },
  header: { alignItems: 'center', gap: 4, paddingTop: 8 },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 3 },
  name: { fontFamily: fonts.bold, fontSize: 20, marginTop: 8, textAlign: 'center' },
  shop: { fontFamily: fonts.medium, fontSize: 14, textAlign: 'center' },
  meta: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 12 },
  alert: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  alertHead: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  alertTitle: { fontFamily: fonts.bold, fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, gap: 4, alignItems: 'center' },
  mini: { flex: 1, borderRadius: 12, padding: 10, alignItems: 'center', gap: 2 },
  statLabel: { fontFamily: fonts.regular, fontSize: 11, textAlign: 'center' },
  statValue: { fontFamily: fonts.bold, fontSize: 15, textAlign: 'center' },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 15 },
  body: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20 },
  muted: { fontFamily: fonts.regular, fontSize: 12 },
  row: { gap: 2 },
  rowLabel: { fontFamily: fonts.regular, fontSize: 12 },
  rowValue: { fontFamily: fonts.medium, fontSize: 14 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: { fontFamily: fonts.medium, fontSize: 12 },
  gapTop: { marginTop: 6 },
  item: { borderRadius: 12, padding: 12, gap: 2 },
  itemTitle: { fontFamily: fonts.bold, fontSize: 14 },
  itemSub: { fontFamily: fonts.medium, fontSize: 13 },
  note: { textAlign: 'center' },
});
