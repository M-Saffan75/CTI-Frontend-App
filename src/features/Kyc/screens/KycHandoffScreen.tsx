import { useState } from 'react';
import {
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
  arrowLeftBold,
  globeBold,
  shieldBold,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { WEB_LOGIN_URL } from '@/constants/config';

export interface KycHandoffScreenProps {
  navigation: any;
  route?: any;
}

export default function KycHandoffScreen({ navigation, route }: KycHandoffScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [opening, setOpening] = useState(false);
  const [linkError, setLinkError] = useState(false);

  const role = route?.params?.role || 'provider';
  const roleDisplay = role === 'seller' ? 'Seller' : 'Repair Technician';

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

  const handleReturnToLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}>
        <Squeeze onPress={handleReturnToLogin} scale={0.9}>
          <View style={[styles.backBtn, { backgroundColor: colors.surfaceAlt }]}>
            <Icon source={arrowLeftBold} size={18} color={colors.text} />
          </View>
        </Squeeze>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Verification</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <FadeUp delay={100} duration={500}>
          <View style={styles.centerSection}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.primary + '18', borderColor: colors.primary + '30' },
              ]}>
              <Icon source={shieldBold} size={48} color={colors.primary} />
            </View>

            <Text style={[styles.title, { color: colors.text }]}>
              Complete Your Verification
            </Text>

            <Text style={[styles.roleSubtitle, { color: colors.primary }]}>
              {roleDisplay} Account
            </Text>

            <Text style={[styles.description, { color: colors.textMuted }]}>
              Your email has been verified successfully. To maintain marketplace safety and process payouts, identity and business documents must be submitted on our website.
            </Text>

            <View
              style={[
                styles.instructionBox,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <View style={styles.stepRow}>
                <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.text }]}>
                  Log in to the CTI web portal using the credentials you just created.
                </Text>
              </View>

              <View style={styles.stepRow}>
                <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.text }]}>
                  Upload your national ID/tax certificate and business details.
                </Text>
              </View>

              <View style={styles.stepRow}>
                <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.text }]}>
                  Return to this mobile app anytime to check your approval status.
                </Text>
              </View>
            </View>
          </View>
        </FadeUp>

        {/* Fallback link display if Linking fails or for direct copying */}
        {linkError && (
          <FadeUp delay={150} duration={300}>
            <View style={[styles.fallbackBox, { borderColor: colors.primary }]}>
              <Text style={[styles.fallbackTitle, { color: colors.text }]}>
                Please open this address in your browser:
              </Text>
              <Text style={[styles.fallbackUrl, { color: colors.primary }]} selectable>
                {WEB_LOGIN_URL}
              </Text>
            </View>
          </FadeUp>
        )}

        {/* Action Buttons */}
        <FadeUp delay={200} duration={500} style={styles.actions}>
          <Button
            title="Complete on Website"
            size="lg"
            loading={opening}
            onPress={handleOpenWebsite}
            icon={<Icon source={globeBold} size={18} color={colors.onPrimary} />}
          />

          <TouchableOpacity
            onPress={handleReturnToLogin}
            activeOpacity={0.7}
            style={styles.secondaryBtn}>
            <Text style={[styles.secondaryBtnText, { color: colors.textMuted }]}>
              Return to Login
            </Text>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
  },
  headerSpacer: {
    width: 38,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  centerSection: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  title: {
    fontSize: 22,
    fontFamily: fonts.bold,
    textAlign: 'center',
    marginBottom: 6,
  },
  roleSubtitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    fontFamily: fonts.regular,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  instructionBox: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  stepText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    lineHeight: 18,
    flex: 1,
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
  secondaryBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontFamily: fonts.medium,
  },
});
