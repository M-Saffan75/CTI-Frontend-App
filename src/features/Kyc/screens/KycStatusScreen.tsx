import { useState } from 'react';
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
import { WEB_LOGIN_URL } from '@/constants/config';
import AuthService, { AuthUser } from '@/services/authService';

export type KycStatusType = 'incomplete' | 'pending' | 'revision' | 'rejected' | 'approved';

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
  const [linkError, setLinkError] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const role = propRole || routeRole || propUser?.role || 'provider';
  const roleDisplay = role === 'seller' ? 'Seller' : 'Repair Technician';

  const getStatusConfig = (st: KycStatusType): StatusConfig => {
    switch (st) {
      case 'approved':
        return {
          badge: 'Approved',
          badgeBg: colors.success + '20',
          badgeTextColor: colors.success,
          title: 'Account Approved',
          description: 'Your verification has been approved! You now have full access to your provider dashboard.',
          icon: shieldBold,
          iconColor: colors.success,
        };
      case 'revision':
        return {
          badge: 'Revision Required',
          badgeBg: '#FF820A20',
          badgeTextColor: '#FF820A',
          title: 'Updates Required',
          description:
            routeMessage ||
            'Some of your submitted documents require revisions. Please log in to the website to review admin feedback and re-upload the requested files.',
          icon: exclamationCircleBold,
          iconColor: '#FF820A',
        };
      case 'rejected':
        return {
          badge: 'Application Rejected',
          badgeBg: colors.error + '20',
          badgeTextColor: colors.error,
          title: 'Verification Rejected',
          description:
            routeMessage ||
            'Your provider application could not be approved at this time. Please visit the website for further details or contact support for help.',
          icon: exclamationCircleBold,
          iconColor: colors.error,
        };
      case 'pending':
        return {
          badge: 'Under Review',
          badgeBg: colors.primary + '20',
          badgeTextColor: colors.primary,
          title: 'Documents Under Review',
          description:
            routeMessage ||
            'Your verification documents have been received and are currently being reviewed by our compliance team. Verification usually takes 12 to 24 hours.',
          icon: clockBold,
          iconColor: colors.primary,
        };
      case 'incomplete':
      default:
        return {
          badge: 'Verification Incomplete',
          badgeBg: colors.primary + '20',
          badgeTextColor: colors.primary,
          title: 'Complete Profile on Website',
          description:
            routeMessage ||
            `To activate your ${roleDisplay} account, identity verification and business details must be completed on our website.`,
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
      const supported = await Linking.canOpenURL(WEB_LOGIN_URL);
      if (supported) {
        await Linking.openURL(WEB_LOGIN_URL);
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
      setFeedback('Profile must be submitted on the website first. Once submitted, log in to sync your status.');
      return;
    }

    setChecking(true);
    setFeedback(null);
    try {
      const updatedUser = await AuthService.fetchUserProfile();
      if (updatedUser) {
        const newStatus = (updatedUser.kycStatus || (updatedUser.isKycCompleted ? 'approved' : 'incomplete')) as KycStatusType;
        setCurrentStatus(newStatus);

        if (newStatus === 'approved') {
          setFeedback('Your account has been approved! Redirecting to dashboard...');
          if (onApproved) {
            onApproved(updatedUser);
          } else if (navigation?.canGoBack?.()) {
            navigation.goBack();
          }
          return;
        }

        setFeedback(`Status checked at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}: ${newStatus}`);
      } else {
        setFeedback('Could not fetch updated status. Please try again.');
      }
    } catch (err: any) {
      setFeedback(err?.message || 'Unable to connect to server. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
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
          {roleDisplay} Verification
        </Text>

        <Squeeze onPress={handleLogout} scale={0.92}>
          <View style={[styles.logoutBtn, { borderColor: colors.border }]}>
            <Icon source={logOutBold} size={16} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.error }]}>Log out</Text>
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
                Open this address in your phone browser:
              </Text>
              <Text style={[styles.fallbackUrl, { color: colors.primary }]} selectable>
                {WEB_LOGIN_URL}
              </Text>
            </View>
          </FadeUp>
        )}

        {/* Action Controls */}
        <FadeUp delay={200} duration={500} style={styles.actions}>
          <Button
            title="Open Website"
            size="lg"
            loading={opening}
            onPress={handleOpenWebsite}
            icon={<Icon source={globeBold} size={18} color={colors.onPrimary} />}
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
                Check Status
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
