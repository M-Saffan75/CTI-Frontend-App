import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import {
  clockBold,
  exclamationCircleBold,
  globeBold,
  infoCircleBold,
  logOutBold,
  shieldBold,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { getWebLoginUrl } from '@/constants/config';
import AuthService, { AuthUser } from '@/services/authService';

import { effectiveKycStatus, KycStatusType } from '../kycGate';
import { getLocaleTag } from '@/i18n/locale';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { statusLabel } from '@/utils/labels';

export type { KycStatusType };

export interface KycStatusScreenProps {
  status?: KycStatusType | string;
  user?: AuthUser | null;
  role?: string;
  onApproved?: (user: AuthUser) => void;
  onLogout?: () => void;
  navigation?: any;
  route?: any;
}

interface StatusConfig {
  badge: string;
  badgeBg: string;
  badgeTextColor: string;
  title: string;
  description: string;
  icon: any;
  iconColor: string;
}

export default function KycStatusScreen({
  status: propStatus,
  user: propUser,
  role: propRole,
  onApproved,
  onLogout,
  navigation,
  route,
}: KycStatusScreenProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const routeStatus = route?.params?.status;
  const routeMessage = route?.params?.message;
  const routeRole = route?.params?.role;
  const noToken = Boolean(route?.params?.noToken);

  const initialStatus: KycStatusType = (
    propStatus ||
    routeStatus ||
    propUser?.kycStatus ||
    (propUser?.isKycCompleted ? 'pending' : 'incomplete')
  ) as KycStatusType;

  const [currentStatus, setCurrentStatus] = useState<KycStatusType>(initialStatus);
  const [opening, setOpening] = useState(false);
  const [checking, setChecking] = useState(false);
  const checkBusy = useRef(false);
  const logoutBusy = useRef(false);
  const [linkError, setLinkError] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const role = propRole || routeRole || propUser?.role || 'provider';
  const roleDisplay = role === 'seller' ? i18n.t('glossary.seller') : i18n.t('repairmanMsg.repairTechnician');

  const getStatusConfig = (st: KycStatusType): StatusConfig => {
    switch (st) {
      case 'approved':
        return {
          badge: i18n.t('repairman.approved'),
          badgeBg: colors.success + '20',
          badgeTextColor: colors.success,
          title: i18n.t('repairman.accountApproved'),
          description: i18n.t('repairman.yourVerificationHasBeenApproved'),
          icon: shieldBold,
          iconColor: colors.success,
        };
      case 'revision':
        return {
          badge: i18n.t('repairman.revisionRequired'),
          badgeBg: '#FF820A20',
          badgeTextColor: '#FF820A',
          title: i18n.t('repairman.updatesRequired'),
          description:
            routeMessage ||
            i18n.t('repairman.someOfYourSubmittedDocuments'),
          icon: exclamationCircleBold,
          iconColor: '#FF820A',
        };
      case 'rejected':
        return {
          badge: i18n.t('repairman.applicationRejected'),
          badgeBg: colors.error + '20',
          badgeTextColor: colors.error,
          title: i18n.t('repairman.verificationRejected'),
          description:
            routeMessage ||
            i18n.t('repairman.yourProviderApplicationCouldNot'),
          icon: exclamationCircleBold,
          iconColor: colors.error,
        };
      case 'pending':
        return {
          badge: i18n.t('customer.underReview'),
          badgeBg: colors.primary + '20',
          badgeTextColor: colors.primary,
          title: i18n.t('repairman.documentsUnderReview'),
          description:
            routeMessage ||
            i18n.t('repairman.yourVerificationDocumentsHaveBeen'),
          icon: clockBold,
          iconColor: colors.primary,
        };
      case 'incomplete':
      default:
        return {
          badge: i18n.t('repairman.verificationIncomplete'),
          badgeBg: colors.primary + '20',
          badgeTextColor: colors.primary,
          title: i18n.t('repairman.completeProfileOnWebsite'),
          description:
            routeMessage ||
            i18n.t('repairmanMsg.activateAccount', { role: roleDisplay }),
          icon: infoCircleBold,
          iconColor: colors.primary,
        };
    }
  };

  const config = getStatusConfig(currentStatus);

  const handleOpenWebsite = async () => {
    setOpening(true);
    setLinkError(false);
    try {
      const supported = await Linking.canOpenURL(getWebLoginUrl());
      if (supported) {
        await Linking.openURL(getWebLoginUrl());
      } else {
        setLinkError(true);
      }
    } catch {
      setLinkError(true);
    } finally {
      setOpening(false);
    }
  };

  const handleCheckStatus = async () => {
    if (noToken) {
      setFeedback(i18n.t('repairman.profileMustBeSubmittedOn'));
      return;
    }
    if (checkBusy.current) return;
    checkBusy.current = true;

    setChecking(true);
    setFeedback(null);
    try {
      const updatedUser = await AuthService.fetchUserProfile();
      if (updatedUser) {
        const newStatus = effectiveKycStatus(role, updatedUser);
        setCurrentStatus(newStatus);

        if (newStatus === 'approved') {
          setFeedback(i18n.t('repairman.yourAccountHasBeenApproved'));
          if (onApproved) {
            onApproved(updatedUser);
          } else if (navigation?.canGoBack?.()) {
            navigation.goBack();
          }
          return;
        }

        setFeedback(
          i18n.t('repairmanMsg.statusChecked', {
            time: new Date().toLocaleTimeString(getLocaleTag(), { hour: '2-digit', minute: '2-digit' }),
            status: statusLabel(newStatus),
          }),
        );
      } else {
        setFeedback(i18n.t('repairman.couldNotFetchUpdatedStatus'));
      }
    } catch (err: any) {
      setFeedback(err?.message || i18n.t('repairman.unableToConnectToServer'));
    } finally {
      checkBusy.current = false;
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    if (logoutBusy.current) return;
    logoutBusy.current = true;
    try {
      await AuthService.logout();
    } finally {
      logoutBusy.current = false;
    }
    if (onLogout) {
      onLogout();
    } else if (navigation) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'RoleSelect' }],
      });
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Top Bar with Logout */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}>
        <Text style={[styles.headerRole, { color: colors.text }]}>
          {i18n.t('repairmanMsg.roleVerification', { role: roleDisplay })}
        </Text>

        <Squeeze onPress={handleLogout} scale={0.92}>
          <View style={[styles.logoutBtn, { borderColor: colors.border }]}>
            <Icon source={logOutBold} size={16} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.error }]}>{t('repairman.logOut')}</Text>
          </View>
        </Squeeze>
      </View>

      <View style={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <FadeUp delay={100} duration={500}>
          <View style={styles.centerSection}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: config.iconColor + '18', borderColor: config.iconColor + '30' },
              ]}>
              <Icon source={config.icon || shieldBold} size={44} color={config.iconColor} />
            </View>

            <View style={[styles.badge, { backgroundColor: config.badgeBg }]}>
              <Text style={[styles.badgeText, { color: config.badgeTextColor }]}>
                {config.badge}
              </Text>
            </View>

            <Text style={[styles.title, { color: colors.text }]}>{config.title}</Text>

            <Text style={[styles.description, { color: colors.textMuted }]}>
              {config.description}
            </Text>

            {Boolean(feedback) && (
              <View
                style={[
                  styles.feedbackBox,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}>
                <Text style={[styles.feedbackText, { color: colors.text }]}>
                  {feedback}
                </Text>
              </View>
            )}
          </View>
        </FadeUp>

        {/* Fallback link display if browser cannot open */}
        {linkError && (
          <FadeUp delay={150} duration={300}>
            <View style={[styles.fallbackBox, { borderColor: colors.primary }]}>
              <Text style={[styles.fallbackTitle, { color: colors.text }]}>
                {t('repairman.openThisAddressInYour')}
              </Text>
              <Text style={[styles.fallbackUrl, { color: colors.primary }]} selectable>
                {getWebLoginUrl()}
              </Text>
            </View>
          </FadeUp>
        )}

        {/* Action Controls */}
        <FadeUp delay={200} duration={500} style={styles.actions}>
          <Button
            title={t('repairman.openWebsite')}
            size="lg"
            loading={opening}
            onPress={handleOpenWebsite}
            icon={globeBold}
            iconPosition="left"
          />

          <TouchableOpacity
            onPress={handleCheckStatus}
            disabled={checking}
            activeOpacity={0.7}
            style={[styles.checkBtn, { borderColor: colors.border }]}>
            {checking ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.checkBtnText, { color: colors.text }]}>
                {t('repairman.checkStatus')}
              </Text>
            )}
          </TouchableOpacity>
        </FadeUp>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerRole: {
    flexShrink: 1,
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  logoutText: {
    flexShrink: 1,
    fontSize: 12,
    fontFamily: fonts.medium,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  centerSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  iconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  title: {
    fontSize: 22,
    fontFamily: fonts.bold,
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    fontFamily: fonts.regular,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 320,
  },
  feedbackBox: {
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    maxWidth: 320,
  },
  feedbackText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    textAlign: 'center',
  },
  fallbackBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginVertical: 12,
    alignItems: 'center',
  },
  fallbackTitle: {
    fontSize: 12,
    fontFamily: fonts.medium,
    marginBottom: 4,
    textAlign: 'center',
  },
  fallbackUrl: {
    fontSize: 13,
    fontFamily: fonts.bold,
    textAlign: 'center',
  },
  actions: {
    gap: 12,
  },
  checkBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnText: {
    fontSize: 15,
    fontFamily: fonts.bold,
  },
});
