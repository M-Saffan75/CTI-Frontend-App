import { useEffect } from 'react';
import {
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import {
  checkCircleFilled,
  homeBold,
  shieldBold,
  shoppingBasketBold,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import RefurbishedHeader from '../components/RefurbishedHeader';

export default function ApplicationSubmittedScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const referenceId = route?.params?.referenceId || 'REF-781920';
  const applicantName = route?.params?.applicantName || 'Valued Customer';
  const brand = route?.params?.brand || 'Apple';
  const model = route?.params?.model || '12 pro max';
  const storage = route?.params?.storage || '128 GB';
  const conditionAnswers = route?.params?.conditionAnswers || {
    0: 'Good',
    1: 'Yes',
    2: 'Yes',
  };
  const picCount = route?.params?.picCount || 3;
  const vidCount = route?.params?.vidCount || 1;

  const handleGoHome = () => {
    try {
      const state = navigation.getState?.();
      const firstRoute = state?.routes?.[0];
      const rootRouteName = firstRoute?.name;

      if (
        rootRouteName &&
        rootRouteName !== 'BuyRefurbished' &&
        rootRouteName !== 'ApplicationSubmitted'
      ) {
        navigation.reset({
          index: 1,
          routes: [{ name: rootRouteName }, { name: 'BuyRefurbished' }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'BuyRefurbished' }],
        });
      }
    } catch {
      try {
        navigation.navigate('BuyRefurbished');
      } catch {
        navigation.popToTop();
      }
    }
  };

  const handleGoMarketplace = () => {
    handleGoHome();
  };

  useEffect(() => {
    const onBackPress = () => {
      handleGoHome();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress,
    );

    return () => backHandler.remove();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <RefurbishedHeader showBack={false} showActions={false} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
        {/* Success Confirmation Card matching Booked.png */}
        <FadeUp delay={60}>
          <View
            style={[
              styles.successCard,
              { backgroundColor: colors.surface, borderColor: colors.border + '44' },
            ]}>
            <View style={styles.successIconCircle}>
              <Icon source={checkCircleFilled} size={56} color="#10B981" />
            </View>

            <Text style={[styles.successTitle, { color: colors.text }]}>
              Application Submitted
            </Text>

            <Text style={[styles.successDesc, { color: colors.textMuted }]}>
              Thank you,{' '}
              <Text style={{ color: colors.primary, fontFamily: fonts.bold }}>
                {referenceId}
              </Text>
              . Your request has been successfully registered. We will notify you or email you our
              offer after our team verifies your device details and uploaded media.
            </Text>

            <View style={styles.ctaRow}>
              <TouchableOpacity
                onPress={handleGoMarketplace}
                style={[
                  styles.ctaSecondaryBtn,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border + '44' },
                ]}>
                <View style={styles.ctaBtnContent}>
                  <Icon source={shoppingBasketBold} size={16} color={colors.text} />
                  <Text style={[styles.ctaSecondaryText, { color: colors.text }]}>
                    Browse Store
                  </Text>
                </View>
              </TouchableOpacity>

              <Squeeze
                onPress={handleGoHome}
                style={[styles.ctaPrimaryBtn, { backgroundColor: colors.primary }]}>
                <View style={styles.ctaBtnContent}>
                  <Icon source={homeBold} size={16} color="#FFFFFF" />
                  <Text style={styles.ctaPrimaryText}>Back to Home</Text>
                </View>
              </Squeeze>
            </View>
          </View>
        </FadeUp>

        {/* Device Details Summary Card matching Figma */}
        <View
          style={[
            styles.detailsCard,
            { backgroundColor: colors.surface, borderColor: colors.border + '44' },
          ]}>
          <Text style={[styles.detailsHeading, { color: colors.text }]}>Device Details</Text>
          <View style={[styles.divider, { backgroundColor: colors.border + '33' }]} />

          <View style={styles.detailRow}>
            <View>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Brand</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>{brand}</Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Model</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>
                {model} ({storage})
              </Text>
            </View>
          </View>

          {/* Condition Breakdown */}
          <View style={{ marginTop: 14 }}>
            <Text style={[styles.conditionHeader, { color: colors.textMuted }]}>
              DEVICE CONDITION
            </Text>

            <View style={styles.conditionRow}>
              <Text style={[styles.conditionQ, { color: colors.textMuted }]}>
                What is the Screen Condition
              </Text>
              <Text style={[styles.conditionA, { color: colors.text }]}>
                {conditionAnswers?.[0] || 'Good'}
              </Text>
            </View>

            <View style={styles.conditionRow}>
              <Text style={[styles.conditionQ, { color: colors.textMuted }]}>
                Is your device's touch screen working properly?
              </Text>
              <Text style={[styles.conditionA, { color: colors.text }]}>
                {conditionAnswers?.[1] || 'Yes'}
              </Text>
            </View>

            <View style={styles.conditionRow}>
              <Text style={[styles.conditionQ, { color: colors.textMuted }]}>
                Is your phone's screen original?
              </Text>
              <Text style={[styles.conditionA, { color: colors.text }]}>
                {conditionAnswers?.[2] || 'Yes'}
              </Text>
            </View>
          </View>

          <View style={[styles.detailRow, { marginTop: 14 }]}>
            <View>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Media Uploaded</Text>
              <Text style={[styles.metaValue, { color: colors.primary }]}>
                {picCount} Pics, {vidCount} Vids
              </Text>
            </View>
          </View>
        </View>

        {/* Security Trust Card matching Figma */}
        <View
          style={[
            styles.trustCard,
            { backgroundColor: colors.surface, borderColor: colors.border + '44' },
          ]}>
          <View style={styles.trustHeader}>
            <Icon source={shieldBold} size={20} color={colors.primary} />
            <Text style={[styles.trustTitle, { color: colors.text }]}>Device Detail</Text>
          </View>
          <Text style={[styles.trustDesc, { color: colors.textMuted }]}>
            Get paid instantly at your doorstep. We guarantee 100% data security and professional
            device assessment through the CTI platform.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  successCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  successIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontFamily: fonts.bold,
    textAlign: 'center',
  },
  successDesc: {
    fontSize: 13,
    fontFamily: fonts.regular,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  ctaBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  ctaSecondaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaSecondaryText: {
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  ctaPrimaryBtn: {
    flex: 1.2,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  detailsCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  detailsHeading: {
    fontSize: 17,
    fontFamily: fonts.bold,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    fontFamily: fonts.regular,
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  conditionHeader: {
    fontSize: 11,
    fontFamily: fonts.bold,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  conditionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  conditionQ: {
    fontSize: 12,
    fontFamily: fonts.regular,
    flex: 1,
  },
  conditionA: {
    fontSize: 12,
    fontFamily: fonts.bold,
    marginLeft: 8,
  },
  trustCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  trustHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  trustTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  trustDesc: {
    fontSize: 13,
    fontFamily: fonts.regular,
    lineHeight: 19,
  },
});
