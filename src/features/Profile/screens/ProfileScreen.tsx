import { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Avatar from '@/components/Avatar';
import Button from '@/components/Button';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  calendarBold,
  cameraBold,
  checkCircleBold,
  commentDotsBold,
  compassBold,
  envelopeBold,
  exclamationCircleBold,
  flagBold,
  globeBold,
  homeBold,
  inboxBold,
  mapBold,
  mapMarkerBold,
  penBold,
  phoneBold,
  settingsBold,
  shieldBold,
  starBold,
  stopwatchBold,
  trashBold,
} from '@/assets/icons';
import ConfirmModal from '@/components/ConfirmModal';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import EditCustomerProfileModal from '../components/EditCustomerProfileModal';
import i18n from '@/i18n';
import { formatDate, formatMonthYear } from '@/utils/dateFormat';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import {
  EMPTY_PROFILE_DATA,
  ProfileData,
} from '../data/profileData';
import { deleteProfilePhotoApi, fetchUserProfileApi } from '../services/profileApi';
import AuthService from '@/services/authService';
import { useTranslation } from 'react-i18next';

export default function ProfileScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const cachedUser = AuthService.getCachedUser();
  const cachedRole = AuthService.getCachedRole() || cachedUser?.role || 'customer';
  const isCustomerRole = (cachedRole || '').toLowerCase() === 'customer';

  const [profile, setProfile] = useState<ProfileData>(() => {
    if (isCustomerRole) {
      return {
        ...EMPTY_PROFILE_DATA,
        name: cachedUser?.name || '',
        role: 'Customer',
        phone: cachedUser?.phone || '',
        email: cachedUser?.email || '',
        avatarUri: cachedUser?.avatar || cachedUser?.profileImage,
        city: '',
        address: '',
        aboutMe: '',
        specialization: [],
        workingDays: [],
        workingHours: '',
        education: [],
        experience: [],
        certificates: [],
      };
    }
    return EMPTY_PROFILE_DATA;
  });
  const [refreshing, setRefreshing] = useState(false);
  // The verified chip and the account dates are shown only once the profile was loaded from the backend
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadProfile = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await fetchUserProfileApi();
      if (data) {
        setProfile(data);
        setLoadedOnce(true);
        setLoadError('');
      }
    } catch (err: any) {
      // the details already on screen stay, and the customer is told that they may be old
      setLoadError(err?.message || i18n.t('profile.loadFailed'));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Customer Modals & Delete States
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [deletePhotoConfirmVisible, setDeletePhotoConfirmVisible] = useState(false);
  const [, setIsDeletingPhoto] = useState(false);

  // Themed Alert Feedback
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<AlertModalType>('success');
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  const handleConfirmDeletePhoto = async () => {
    setDeletePhotoConfirmVisible(false);
    setIsDeletingPhoto(true);
    try {
      const res = await deleteProfilePhotoApi();
      const serverMsg = res?.message || i18n.t('profile.photoRemovedFallback');
      setProfile(prev => ({ ...prev, avatarUri: undefined }));
      setAlertType('success');
      setAlertTitle(i18n.t('profile.photoRemoved'));
      setAlertMessage(serverMsg);
      setAlertVisible(true);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || err?.message || i18n.t('profile.removeFailed');
      setAlertType('error');
      setAlertTitle(i18n.t('common.error'));
      setAlertMessage(errorMsg);
      setAlertVisible(true);
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadProfile(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        {/* Top bar: back and edit */}
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          {navigation?.canGoBack() ? (
            <Squeeze onPress={() => navigation?.goBack()}>
              <View style={[styles.backBtnCircle, { backgroundColor: colors.primary }]}>
                <Icon source={arrowLeftBold} size={18} color={colors.onPrimary} />
              </View>
            </Squeeze>
          ) : (
            <View style={styles.backBtnCircle} />
          )}

          <Squeeze
            onPress={() => {
              setShowEditCustomerModal(true);
            }}>
            <View style={[styles.editBtnCircle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Icon source={penBold} size={16} color={colors.primary} />
            </View>
          </Squeeze>
        </View>

        {/* Profile Avatar & Header Info */}
        <View style={styles.profileHeaderSection}>
          {/* Avatar with Edit Badge */}
          <View style={styles.avatarWrap}>
            <Avatar
              uri={profile.avatarUri}
              name={profile.name}
              style={[styles.avatarImage, { borderColor: colors.avatarBorder }]}
            />
            <TouchableOpacity
              onPress={() => {
                setShowEditCustomerModal(true);
              }}
              style={[
                styles.avatarEditBadge,
                { backgroundColor: colors.primary, borderColor: colors.surface },
              ]}>
              <Icon source={cameraBold} size={12} color={colors.onPrimary} />
            </TouchableOpacity>

            {Boolean(profile.avatarUri) && (
              <TouchableOpacity
                onPress={() => setDeletePhotoConfirmVisible(true)}
                style={[
                  styles.avatarDeleteBadge,
                  { backgroundColor: colors.error, borderColor: colors.surface },
                ]}>
                <Icon source={trashBold} size={11} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Name */}
          <Text style={[styles.profileName, { color: colors.text }]}>
            {profile.name || t('glossary.customer')}
          </Text>

          {/* Sub Meta Row */}
          <View style={styles.metaRow}>

            <View
              style={[
                styles.metaBadge,
                {
                  backgroundColor: colors.primary + '18',
                  borderColor: colors.primary,
                  borderWidth: 1,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 10,
                },
              ]}>
              <Text style={[styles.metaBadgeText, { color: colors.primary, fontFamily: fonts.bold }]}>
                {t('glossary.customer')}
              </Text>
            </View>

            {Boolean(profile.country) && (
              <View style={styles.metaBadge}>
                <Icon source={flagBold} size={14} color={colors.textMuted} />
                <Text style={[styles.metaBadgeText, { color: colors.textMuted }]}>
                  {profile.country}
                </Text>
              </View>
            )}

            {Boolean(profile.memberSince) && (
              <View style={styles.metaBadge}>
                <Icon source={calendarBold} size={14} color={colors.textMuted} />
                <Text style={[styles.metaBadgeText, { color: colors.textMuted }]}>
                  {t('profile.memberSince', { date: formatMonthYear(profile.memberSince) })}
                </Text>
              </View>
            )}
          </View>
        </View>

        {loadError ? (
          <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.error, alignItems: 'center', gap: 8 }]}>
            <Text style={{ color: colors.text, fontFamily: fonts.bold, fontSize: 14 }}>{t('profile.couldNotLoad')}</Text>
            <Text style={{ color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, textAlign: 'center' }}>{loadError}</Text>
            <Button title={t('common.tryAgain')} size="sm" onPress={() => loadProfile(true)} />
          </View>
        ) : null}

        {/* Complete Bank Details Alert Card */}

        {/* Stats Row */}

        {/* 1. About me */}

        {/* Provider Only Sections: Specialization, Working Hours, Catalog, Education, Experience, Certifications */}

        {/* 8. Contact Info */}
        <FadeUp delay={300} duration={300}>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.sectionHeader}>
              <Icon source={inboxBold} size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.contactInfo')}</Text>
            </View>

            <View style={styles.contactItem}>
              <Icon source={phoneBold} size={18} color={colors.primary} />
              <View style={styles.contactItemDetails}>
                <Text style={[styles.contactLabel, { color: colors.textMuted }]}>{t('profile.phoneNumber')}</Text>
                <Text style={[styles.contactVal, { color: colors.text }]}>
                  {profile.phone || t('profile.notProvided')}
                </Text>
              </View>
            </View>

            <View style={styles.contactItem}>
              <Icon source={envelopeBold} size={18} color={colors.primary} />
              <View style={styles.contactItemDetails}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.contactLabel, { color: colors.textMuted }]}>{t('profile.emailAddress')}</Text>
                  <Text style={{ flexShrink: 1, fontSize: 10, color: colors.textMuted, fontFamily: fonts.regular }}>
                    {t('profile.readOnly')}
                  </Text>
                </View>
                <Text style={[styles.contactVal, { color: colors.text }]}>
                  {profile.email || t('profile.notProvided')}
                </Text>
              </View>
            </View>

            {Boolean(profile.whatsapp) && (
              <View style={styles.contactItem}>
                <Icon source={commentDotsBold} size={18} color={colors.primary} />
                <View style={styles.contactItemDetails}>
                  <Text style={[styles.contactLabel, { color: colors.textMuted }]}>WhatsApp</Text>
                  <Text style={[styles.contactVal, { color: colors.text }]}>{profile.whatsapp}</Text>
                </View>
              </View>
            )}
          </View>
        </FadeUp>

        {/* Customer Location Info (Real Data from user-details) */}
        <FadeUp delay={330} duration={300}>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.sectionHeader}>
              <Icon source={mapBold} size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.addressLocation')}</Text>
            </View>

            <View style={styles.contactItem}>
              <Icon source={globeBold} size={18} color={colors.primary} />
              <View style={styles.contactItemDetails}>
                <Text style={[styles.contactLabel, { color: colors.textMuted }]}>{t('profile.country')}</Text>
                <Text style={[styles.contactVal, { color: colors.text }]}>
                  {profile.country || t('profile.notProvided')}
                </Text>
              </View>
            </View>

            {Boolean(profile.state) && (
              <View style={styles.contactItem}>
                <Icon source={mapMarkerBold} size={18} color={colors.primary} />
                <View style={styles.contactItemDetails}>
                  <Text style={[styles.contactLabel, { color: colors.textMuted }]}>{t('profile.state')}</Text>
                  <Text style={[styles.contactVal, { color: colors.text }]}>{profile.state}</Text>
                </View>
              </View>
            )}

            {Boolean(profile.city) && (
              <View style={styles.contactItem}>
                <Icon source={compassBold} size={18} color={colors.primary} />
                <View style={styles.contactItemDetails}>
                  <Text style={[styles.contactLabel, { color: colors.textMuted }]}>{t('profile.city')}</Text>
                  <Text style={[styles.contactVal, { color: colors.text }]}>{profile.city}</Text>
                </View>
              </View>
            )}

            {Boolean(profile.address) && (
              <View style={styles.contactItem}>
                <Icon source={homeBold} size={18} color={colors.primary} />
                <View style={styles.contactItemDetails}>
                  <Text style={[styles.contactLabel, { color: colors.textMuted }]}>{t('profile.streetAddress')}</Text>
                  <Text style={[styles.contactVal, { color: colors.text }]}>{profile.address}</Text>
                </View>
              </View>
            )}

            {!profile.address && !profile.city && !profile.state && (
              <View
                style={[
                  styles.locationNoticeBox,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}>
                <Text style={[styles.locationNoticeText, { color: colors.textMuted }]}>
                  {t('profile.locationNotice')}
                </Text>
              </View>
            )}
          </View>
        </FadeUp>

        {/* 9. Location (Provider Only) */}

        {/* 10. Emergency Contact & 11. Services (Provider Only) */}

        {/* 12. Account Information */}
        <FadeUp delay={420} duration={300}>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.sectionHeader}>
              <Icon source={settingsBold} size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.accountInfo')}</Text>
            </View>

            <View style={styles.accountRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon source={shieldBold} size={15} color={colors.textMuted} />
                <Text style={[styles.accountLabel, { color: colors.textMuted }]}>{t('profile.accountStatus')}</Text>
              </View>
              <Text style={[styles.accountVal, { color: colors.text, textTransform: 'capitalize' }]}>
                {t(`profile.status.${profile.status || 'active'}`, { defaultValue: profile.status || '' })}
              </Text>
            </View>

            {profile.memberSince ? (
            <View style={styles.accountRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon source={calendarBold} size={15} color={colors.textMuted} />
                <Text style={[styles.accountLabel, { color: colors.textMuted }]}>{t('profile.memberSinceLabel')}</Text>
              </View>
              <Text style={[styles.accountVal, { color: colors.text }]}>
                {formatMonthYear(profile.memberSince)}
              </Text>
            </View>
            ) : null}

            {profile.lastUpdate ? (
            <View style={styles.accountRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon source={stopwatchBold} size={15} color={colors.textMuted} />
                <Text style={[styles.accountLabel, { color: colors.textMuted }]}>{t('profile.lastUpdate')}</Text>
              </View>
              <Text style={[styles.accountVal, { color: colors.text }]}>{formatDate(profile.lastUpdate)}</Text>
            </View>
            ) : null}

            {loadedOnce ? (
            <View style={styles.verificationPillsRow}>
              <View
                style={[
                  styles.verifyPill,
                  {
                    backgroundColor: profile.emailVerified ? '#10B98120' : '#F59E0B20',
                    borderColor: profile.emailVerified ? '#10B981' : '#F59E0B',
                    borderWidth: 1,
                  },
                ]}>
                <Icon
                  source={profile.emailVerified ? checkCircleBold : exclamationCircleBold}
                  size={13}
                  color={profile.emailVerified ? '#10B981' : '#F59E0B'}
                />
                <Text
                  style={[
                    styles.verifyPillText,
                    { color: profile.emailVerified ? '#10B981' : '#F59E0B' },
                  ]}>
                  {profile.emailVerified ? t('profile.emailVerified') : t('profile.emailPending')}
                </Text>
              </View>

              {profile.profileCompleted ? (
                <View
                  style={[
                    styles.verifyPill,
                    {
                      backgroundColor: colors.primary + '20',
                      borderColor: colors.primary,
                      borderWidth: 1,
                    },
                  ]}>
                  <Icon source={starBold} size={13} color={colors.primary} />
                  <Text style={[styles.verifyPillText, { color: colors.primary }]}>
                    {t('profile.profileCompleted')}
                  </Text>
                </View>
              ) : null}
            </View>
            ) : null}

            {/* Dispute Stats (if any) */}
            {Boolean(profile.disputeStats && profile.disputeStats.totalDisputes > 0) && (
              <View
                style={[
                  styles.disputeStatsCard,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}>
                <Text style={[styles.disputeStatsTitle, { color: colors.text }]}>
                  {t('profile.disputeHistory')}
                </Text>
                <View style={styles.disputeStatsRow}>
                  <Text style={[styles.disputeStatItem, { color: colors.textMuted }]}>
                    {t('profile.total')} <Text style={{ color: colors.text, fontFamily: fonts.bold }}>{profile.disputeStats?.totalDisputes || 0}</Text>
                  </Text>
                  <Text style={[styles.disputeStatItem, { color: '#10B981' }]}>
                    {t('profile.won')} <Text style={{ fontFamily: fonts.bold }}>{profile.disputeStats?.disputesWon || 0}</Text>
                  </Text>
                  <Text style={[styles.disputeStatItem, { color: colors.error }]}>
                    {t('profile.lost')} <Text style={{ fontFamily: fonts.bold }}>{profile.disputeStats?.disputesLost || 0}</Text>
                  </Text>
                </View>
              </View>
            )}
          </View>
        </FadeUp>
      </ScrollView>

      {/* Customer Edit Modal */}
      <EditCustomerProfileModal
        visible={showEditCustomerModal}
        profile={profile}
        onClose={() => setShowEditCustomerModal(false)}
        onSaved={updated => {
          setProfile(updated);
        }}
      />

      {/* Confirm Delete Photo Modal */}
      <ConfirmModal
        visible={deletePhotoConfirmVisible}
        title={t('profile.removePhotoTitle')}
        message={t('profile.removePhotoBody')}
        confirmText={t('profile.remove')}
        danger
        onConfirm={handleConfirmDeletePhoto}
        onCancel={() => setDeletePhotoConfirmVisible(false)}
      />

      {/* Feedback Alert Modal */}
      <AlertModal
        visible={alertVisible}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />

      {/* Provider-only Modals */}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { gap: 14 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  backBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  profileHeaderSection: {
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
    gap: 6,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarDeleteBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  profileName: {
    fontFamily: fonts.bold,
    fontSize: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaBadgeText: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  alertCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  alertContent: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  alertIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTextWrap: {
    flex: 1,
    gap: 2,
  },
  alertTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  alertSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  alertActionBtn: {
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
  },
  alertActionText: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    textAlign: 'center',
  },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: 13,
    textAlign: 'center',
  },
  sectionCard: {
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionHeaderWithAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  aboutText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  specializationPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specializationPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  specializationPillText: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  subLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  workingHoursText: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  workingDaysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  dayPillText: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  addPillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  centerButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  addPillBtnCentered: {
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPillText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  itemCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  itemCardTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  itemCardSub: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  itemCardDesc: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  itemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  certTagBox: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  certTagText: {
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  itemActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  yearPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  yearPillText: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  actionBtn: {
    padding: 4,
  },
  certCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  certPhoto: {
    width: '100%',
    height: 120,
    borderRadius: 10,
  },
  certCardTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  certButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  certEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  certEditBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  certDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  certDeleteBtnText: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactItemDetails: {
    gap: 2,
  },
  contactLabel: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  contactVal: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  infoBox: {
    borderRadius: 12,
    padding: 12,
    gap: 2,
  },
  infoBoxLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  infoBoxVal: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  infoBoxWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    padding: 12,
  },
  servicesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceRowTitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  availableBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availableBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountLabel: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  accountVal: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  verificationPillsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  verifyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  verifyPillText: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  locationNoticeBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  locationNoticeText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  disputeStatsCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    gap: 6,
  },
  disputeStatsTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  disputeStatsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  disputeStatItem: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
  },
});
