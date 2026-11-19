import { ReactNode, useCallback, useEffect, useState } from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AlertModal, { AlertModalType } from '@/components/AlertModal';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Avatar from '@/components/Avatar';
import Squeeze from '@/components/Squeeze';
import { ErrorState, LoadingState } from '@/components/states';
import {
  arrowLeftBold,
  calendarBold,
  cameraBold,
  checkCircleBold,
  clockBold,
  compassBold,
  creditCardBold,
  discountBold,
  envelopeBold,
  exclamationCircleBold,
  fileBold,
  globeBold,
  imageBold,
  linkBold,
  mapBold,
  mapMarkerBold,
  mapPinBold,
  menuBold,
  mobileBold,
  packageBold,
  penBold,
  phoneBold,
  shieldBold,
  storeBold,
  stopwatchBold,
  tagBold,
  userBold,
} from '@/assets/icons';
import { getWebSellerProfileEditUrl } from '@/constants/config';
import { ApiError, normalizeApiError } from '@/services/apiError';
import AuthService from '@/services/authService';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { formatDate, openWebsite } from '../../../utils/sellerUtils';
import BankModal from '../components/BankModal';
import PhotoPreviewModal from '../components/PhotoPreviewModal';
import ScheduleModal from '../components/ScheduleModal';
import SocialModal, { SOCIAL_LINKS } from '../components/SocialModal';
import StoreInfoModal from '../components/StoreInfoModal';
import { fetchSellerProfileApi, PickedImage, SellerProfile, updateSellerProfileApi } from '../services/sellerProfileApi';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { weekdayLongName } from '@/utils/dateFormat';

// KYC status words come from sellerMsg.kyc.<status>
const kycLabel = (status: string): string => i18n.t(`sellerMsg.kyc.${status}`, { defaultValue: status });

type Section = 'store' | 'bank' | 'social' | 'schedule';
type PickKind = 'logo' | 'cover';

function mask(value: string, keepStart: number, keepEnd: number) {
  if (value.length <= keepStart + keepEnd) return value;
  return `${value.slice(0, keepStart)}${'•'.repeat(value.length - keepStart - keepEnd)}${value.slice(-keepEnd)}`;
}

function Card({
  icon,
  title,
  onEdit,
  children,
}: {
  icon: number;
  title: string;
  onEdit?: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHead}>
        <Icon source={icon} size={18} color={colors.primary} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
        {onEdit ? (
          <TouchableOpacity onPress={onEdit} hitSlop={8} style={[styles.editBtn, { backgroundColor: colors.surfaceAlt }]}>
            <Icon source={penBold} size={14} color={colors.primary} />
            <Text style={[styles.editText, { color: colors.primary }]}>{t('common.edit')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function Row({
  icon,
  label,
  value,
  onPress,
}: {
  icon: number;
  label: string;
  value?: string | number | null;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const content = (
    <View style={styles.row}>
      <Icon source={icon} size={18} color={colors.primary} />
      <View style={styles.flex}>
        <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{label}</Text>
        <Text style={[styles.rowValue, { color: onPress && value ? colors.primary : colors.text }]}>
          {value || i18n.t('repairmanMsg.notSet')}
        </Text>
      </View>
    </View>
  );
  return onPress && value ? <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity> : content;
}

export default function SellerProfileScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [section, setSection] = useState<Section | null>(null);
  const [pending, setPending] = useState<{ kind: PickKind; image: PickedImage } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState<{ type: AlertModalType; title: string; message: string } | null>(null);
  const [failedLink, setFailedLink] = useState('');

  const load = useCallback(async (mode: 'first' | 'refresh' | 'silent' = 'first') => {
    if (mode === 'refresh') setRefreshing(true);
    else if (mode === 'first') setLoading(true);
    try {
      const data = await fetchSellerProfileApi();
      setSeller(data);
      setError(null);

      const cached = AuthService.getCachedUser();
      if (data.profilePictureOrLogo && data.profilePictureOrLogo !== (cached?.avatar || cached?.profileImage)) {
        AuthService.updateStoredUser({ avatar: data.profilePictureOrLogo, profileImage: data.profilePictureOrLogo });
      }
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

  // The Wallet "Add bank details" button opens this screen with the bank form
  useEffect(() => {
    if (route?.params?.editSection === 'bank' && seller) setSection('bank');
  }, [route?.params?.editSection, route?.params?.at, seller]);

  const openLink = async (url: string) => {
    if (!(await openWebsite(url))) setFailedLink(url);
  };

  const pickImage = async (kind: PickKind) => {
    if (uploading) return;
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.8,
        maxWidth: kind === 'cover' ? 1600 : 800,
        maxHeight: kind === 'cover' ? 900 : 800,
      });
      const asset = result.assets?.[0];
      if (asset?.uri) {
        setPending({ kind, image: { uri: asset.uri, type: asset.type, fileName: asset.fileName } });
      }
    } catch {
      setAlert({ type: 'error', title: i18n.t('sellerAuto.photo'), message: i18n.t('sellerAuto.couldNotOpenYourPhoto') });
    }
  };

  const uploadImage = async () => {
    if (!pending || uploading) return;
    setUploading(true);
    try {
      const message = await updateSellerProfileApi(
        {},
        pending.kind === 'logo' ? { logo: pending.image } : { cover: pending.image },
      );
      setPending(null);
      setAlert({ type: 'success', title: i18n.t('common.success'), message: message || i18n.t('sellerAuto.profileUpdatedSuccessfully') });
      await load('silent');
    } catch (e) {
      setAlert({ type: 'error', title: i18n.t('sellerAuto.uploadFailed'), message: normalizeApiError(e).message });
    } finally {
      setUploading(false);
    }
  };

  const closeSection = () => {
    setSection(null);
    navigation?.setParams?.({ editSection: undefined });
  };

  const status = seller?.kycStatus || 'pending';
  const statusColor =
    status === 'approved' ? colors.success : status === 'rejected' ? colors.error : colors.primary;
  const emailValue =
    seller?.emailAddress || (typeof seller?.userId === 'object' ? seller.userId?.email : '') || '';
  const bank = seller?.bankDetails;
  const links = SOCIAL_LINKS.filter(item => seller?.socialLinks?.[item.key]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {loading && !seller ? (
        <LoadingState text={t('sellerAuto.loadingProfile')} />
      ) : error && !seller ? (
        <ErrorState error={error} onRetry={() => load()} fullScreen />
      ) : seller ? (
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load('refresh')}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }>
          <View style={[styles.cover, { backgroundColor: colors.surfaceAlt }]}>
            {seller.coverPhoto ? (
              <Image source={{ uri: seller.coverPhoto }} style={StyleSheet.absoluteFill} />
            ) : (
              <Icon source={imageBold} size={36} color={colors.textMuted} />
            )}

            {navigation?.canGoBack() ? (
              <Squeeze onPress={() => navigation.goBack()} scale={0.9} style={[styles.coverLeft, { top: insets.top + 8 }]}>
                <View style={[styles.circle, { backgroundColor: colors.primary }]}>
                  <Icon source={arrowLeftBold} size={18} color={colors.onPrimary} />
                </View>
              </Squeeze>
            ) : (
              <Squeeze onPress={() => navigation?.navigate('Settings')} scale={0.9} style={[styles.coverLeft, { top: insets.top + 8 }]}>
                <View style={[styles.circle, { backgroundColor: colors.surface }]}>
                  <Icon source={menuBold} size={18} color={colors.primary} />
                </View>
              </Squeeze>
            )}

            <Squeeze onPress={() => pickImage('cover')} scale={0.9} style={[styles.coverRight, { top: insets.top + 8 }]}>
              <View style={[styles.circle, { backgroundColor: colors.surface }]}>
                <Icon source={cameraBold} size={16} color={colors.primary} />
              </View>
            </Squeeze>
          </View>

          <View style={styles.headerWrap}>
            <View>
              <Avatar
                uri={seller.profilePictureOrLogo}
                name={seller.businessName || seller.fullName}
                style={[styles.avatar, { borderColor: colors.avatarBorder, backgroundColor: colors.surface }]}
              />
              <TouchableOpacity
                onPress={() => pickImage('logo')}
                style={[styles.avatarBadge, { backgroundColor: colors.primary, borderColor: colors.surface }]}>
                <Icon source={cameraBold} size={12} color={colors.onPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.name, { color: colors.text }]}>{seller.businessName || t('sellerAuto.yourStore')}</Text>
            <View style={[styles.badge, { borderColor: statusColor, backgroundColor: statusColor + '18' }]}>
              <Icon source={status === 'approved' ? shieldBold : exclamationCircleBold} size={13} color={statusColor} />
              <Text style={[styles.badgeText, { color: statusColor }]}>{kycLabel(status)}</Text>
            </View>
            <Text style={[styles.address, { color: colors.textMuted }]}>
              {seller.storeAddress || t('sellerAuto.storeAddressNotSet')}
            </Text>
          </View>

          <View style={styles.content}>
            {status !== 'approved' && (
              <View style={[styles.notice, { backgroundColor: colors.surface, borderColor: statusColor }]}>
                <Icon source={exclamationCircleBold} size={20} color={statusColor} />
                <Text style={[styles.noticeText, { color: colors.text }]}>
                  {status === 'pending'
                    ? t('sellerAuto.yourProfileIsUnderAdmin')
                    : seller.kycReason ||
                      (status === 'revision'
                        ? t('sellerAuto.yourProfileNeedsRevisionPlease')
                        : t('sellerAuto.yourProfileWasRejectedPlease'))}
                </Text>
              </View>
            )}

            <Card icon={storeBold} title={t('sellerAuto.storeInformation')} onEdit={() => setSection('store')}>
              <Row icon={userBold} label={t('profile.edit.fullName')} value={seller.fullName} />
              <Row icon={storeBold} label={t('sellerAuto.businessName')} value={seller.businessName} />
              <Row icon={phoneBold} label={t('sellerAuto.phone')} value={seller.phoneNumber} />
              <Row icon={envelopeBold} label={t('sellerAuto.email')} value={emailValue} />
              <Row icon={mapPinBold} label={t('sellerAuto.storeAddress')} value={seller.storeAddress} />
              <Row icon={globeBold} label={t('profile.country')} value={seller.country?.name} />
              <Row icon={mapBold} label={t('sellerAuto.state')} value={seller.state?.name} />
              <Row icon={compassBold} label={t('profile.city')} value={seller.city?.name} />
              <Row icon={tagBold} label={t('sellerAuto.zipCode')} value={seller.zipCode} />
              <Row icon={fileBold} label={t('sellerAuto.storeDescription')} value={seller.storeDescription} />
            </Card>

            <Card icon={creditCardBold} title={t('sellerAuto.bankDetails')} onEdit={() => setSection('bank')}>
              {bank?.accountNumber ? (
                <>
                  <Row icon={userBold} label={t('sellerAuto.accountTitle')} value={bank.accountTitle} />
                  <Row icon={creditCardBold} label={t('sellerAuto.accountNo')} value={mask(bank.accountNumber, 0, 4)} />
                  <Row icon={storeBold} label={t('sellerAuto.bank')} value={bank.bankName} />
                  <Row icon={mapMarkerBold} label={t('sellerAuto.branch')} value={bank.branchName} />
                  <Row icon={fileBold} label="IBAN" value={bank.iban ? mask(bank.iban, 4, 4) : ''} />
                </>
              ) : (
                <Text style={[styles.muted, { color: colors.textMuted }]}>
                  {t('sellerAuto.bankDetailsNotAddedYet')}
                </Text>
              )}
            </Card>

            <Card icon={linkBold} title={t('sellerAuto.socialLinks')} onEdit={() => setSection('social')}>
              {links.length === 0 ? (
                <Text style={[styles.muted, { color: colors.textMuted }]}>{t('sellerAuto.noSocialLinksAddedYet')}</Text>
              ) : (
                links.map(item => (
                  <View key={item.key} style={styles.row}>
                    <Icon source={item.icon} size={18} color={item.brand ? null : colors.primary} />
                    <View style={styles.flex}>
                      <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{item.label}</Text>
                      <Text
                        numberOfLines={1}
                        onPress={() => openLink(seller.socialLinks?.[item.key] as string)}
                        style={[styles.rowValue, { color: colors.primary }]}>
                        {seller.socialLinks?.[item.key]}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </Card>

            <Card icon={clockBold} title={t('sellerAuto.workingSchedule')} onEdit={() => setSection('schedule')}>
              <Row icon={calendarBold} label={t('sellerAuto.workingDays')} value={seller.workingDays?.map(weekdayLongName).join(', ')} />
              <Row
                icon={clockBold}
                label={t('sellerAuto.businessHours')}
                value={
                  seller.workingHours?.start && seller.workingHours?.end
                    ? `${seller.workingHours.start} - ${seller.workingHours.end}`
                    : ''
                }
              />
            </Card>

            <Card icon={shieldBold} title={t('profile.accountStatus')}>
              <Row icon={shieldBold} label={t('sellerAuto.kycStatus')} value={kycLabel(status)} />
              <Row icon={checkCircleBold} label={t('sellerAuto.account')} value={seller.isActive === false ? t('profile.status.inactive') : t('profile.status.active')} />
              <Row icon={mobileBold} label={t('sellerAuto.sellsRefurbished')} value={seller.sellsRefurbishedDevices ? t('common.yes') : 'No'} />
              <Row icon={discountBold} label={t('sellerAuto.commissionRate')} value={`${seller.commissionRate ?? 10}%`} />
              <Row icon={packageBold} label={t('sellerAuto.shippingMethod')} value={seller.shippingMethod} />
              {seller.kycLastUpdated ? (
                <Row icon={stopwatchBold} label={t('sellerAuto.kycUpdated')} value={formatDate(seller.kycLastUpdated)} />
              ) : null}
            </Card>

            <Card icon={fileBold} title={t('sellerAuto.kycDocuments')}>
              <Row icon={imageBold} label={t('sellerAuto.profilePhoto')} value={seller.profilePictureOrLogo ? t('sellerAuto.view') : ''} onPress={() => openLink(seller.profilePictureOrLogo as string)} />
              <Row icon={userBold} label={t('sellerAuto.nationalId')} value={seller.nationalIdOrPassport ? t('sellerAuto.view') : ''} onPress={() => openLink(seller.nationalIdOrPassport as string)} />
              <Row icon={fileBold} label={t('sellerAuto.shopLicense')} value={seller.shopLicenseOrTaxCertificate ? t('sellerAuto.view') : ''} onPress={() => openLink(seller.shopLicenseOrTaxCertificate as string)} />
              <Row icon={mapPinBold} label={t('sellerAuto.proofOfAddress')} value={seller.proofOfAddress ? t('sellerAuto.view') : ''} onPress={() => openLink(seller.proofOfAddress as string)} />
              <Text style={[styles.muted, { color: colors.textMuted }]}>
                {t('sellerAuto.documentsAndBusinessRegistrationAre')}
              </Text>
              <Button
                title={t('repairman.editOnTheWebsite')}
                variant="soft"
                size="sm"
                onPress={() => openLink(getWebSellerProfileEditUrl())}
              />
            </Card>
          </View>
        </ScrollView>
      ) : null}

      {seller ? (
        <>
          <StoreInfoModal
            visible={section === 'store'}
            seller={seller}
            onClose={closeSection}
            onSaved={changed => {
              load('silent');
              const patch = Object.fromEntries(Object.entries(changed).filter(([, v]) => v));
              if (Object.keys(patch).length) AuthService.updateStoredUser(patch);
            }}
          />
          <BankModal visible={section === 'bank'} seller={seller} onClose={closeSection} onSaved={() => load('silent')} />
          <SocialModal visible={section === 'social'} seller={seller} onClose={closeSection} onSaved={() => load('silent')} />
          <ScheduleModal visible={section === 'schedule'} seller={seller} onClose={closeSection} onSaved={() => load('silent')} />
        </>
      ) : null}

      <PhotoPreviewModal
        visible={Boolean(pending)}
        kind={pending?.kind || 'logo'}
        uri={pending?.image.uri}
        uploading={uploading}
        onCancel={() => setPending(null)}
        onUpload={uploadImage}
      />

      <AlertModal
        visible={Boolean(alert)}
        type={alert?.type}
        title={alert?.title}
        message={alert?.message}
        onClose={() => setAlert(null)}
      />
      <AlertModal
        visible={Boolean(failedLink)}
        type="info"
        title={t('repairman.openOnTheWebsite')}
        message={i18n.t('settings.openAddress', { url: failedLink })}
        onClose={() => setFailedLink('')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  cover: { height: 190, alignItems: 'center', justifyContent: 'center' },
  coverLeft: { position: 'absolute', left: 20 },
  coverRight: { position: 'absolute', right: 20 },
  circle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  headerWrap: { alignItems: 'center', gap: 6, marginTop: -48, paddingHorizontal: 20 },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 3 },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontFamily: fonts.bold, fontSize: 20, textAlign: 'center', marginTop: 4 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: { fontFamily: fonts.medium, fontSize: 12 },
  address: { fontFamily: fonts.regular, fontSize: 12, textAlign: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 16, gap: 14 },
  notice: { flexDirection: 'row', gap: 10, alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14 },
  noticeText: { flex: 1, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontFamily: fonts.bold, fontSize: 15 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  editText: { flexShrink: 1, fontFamily: fonts.medium, fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { fontFamily: fonts.regular, fontSize: 12 },
  rowValue: { fontFamily: fonts.medium, fontSize: 14 },
  muted: { fontFamily: fonts.regular, fontSize: 12 },
});
