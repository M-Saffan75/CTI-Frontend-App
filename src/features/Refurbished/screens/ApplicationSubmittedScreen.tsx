import { useEffect, useRef } from 'react';
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
  shoppingBasketBold,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import RefurbishedHeader from '../components/RefurbishedHeader';
import { Trans, useTranslation } from 'react-i18next';

export default function ApplicationSubmittedScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const referenceId = route?.params?.referenceId || '';
  const brand = route?.params?.brand || t('customerMsg.device');
  const model = route?.params?.model || t('customer.deviceModel');
  const selectedVariants: any[] = route?.params?.selectedVariants || [];
  const conditionAnswers = route?.params?.conditionAnswers || {};
  const picCount = route?.params?.picCount || 0;
  const vidCount = route?.params?.vidCount || 0;

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

  // The back handler is registered once; it always calls the latest handleGoHome
  const goHomeRef = useRef(handleGoHome);
  goHomeRef.current = handleGoHome;

  useEffect(() => {
    const onBackPress = () => {
      goHomeRef.current();
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
              {t('customer.applicationSubmitted')}
            </Text>

            <Text style={[styles.successDesc, { color: colors.textMuted }]}>
              {referenceId ? (
                <Trans i18nKey="customerMsg.thankYouRef" values={{ ref: referenceId }} components={{ hl: <Text style={{ color: colors.primary, fontFamily: fonts.bold }} /> }} />
              ) : (
                t('customerMsg.thankYou')
              )}
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
                    {t('customer.browseStore')}
                  </Text>
                </View>
              </TouchableOpacity>

              <Squeeze
                onPress={handleGoHome}
                style={[styles.ctaPrimaryBtn, { backgroundColor: colors.primary }]}>
                <View style={styles.ctaBtnContent}>
                  <Icon source={homeBold} size={16} color={colors.onPrimary} />
                  <Text style={styles.ctaPrimaryText}>{t('customer.backToHome')}</Text>
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
          <Text style={[styles.detailsHeading, { color: colors.text }]}>{t('customer.deviceDetails')}</Text>
          <View style={[styles.divider, { backgroundColor: colors.border + '33' }]} />

          <View style={styles.detailRow}>
            <View>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>{t('customer.brand2')}</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>{brand}</Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>{t('customer.model')}</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>
                {model}
              </Text>
            </View>
          </View>

          {/* Selected Specifications / Variants */}
          {Array.isArray(selectedVariants) && selectedVariants.length > 0 && (
            <View style={{ marginTop: 10 }}>
              {selectedVariants.map((v: any, idx: number) => (
                <View key={idx} style={[styles.detailRow, { marginTop: 6 }]}>
                  <Text style={[styles.metaLabel, { color: colors.textMuted }]}>{v.key || t('customerMsg.specification')}</Text>
                  <Text style={[styles.metaValue, { color: colors.text }]}>{v.value}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Dynamic Condition Breakdown */}
          {Object.entries(conditionAnswers).length > 0 && (
            <View style={{ marginTop: 14 }}>
              <Text style={[styles.conditionHeader, { color: colors.textMuted }]}>
                {t('customer.deviceCondition')}
              </Text>

              {Object.entries(conditionAnswers).map(([q, a], idx) => (
                <View key={idx} style={styles.conditionRow}>
                  <Text style={[styles.conditionQ, { color: colors.textMuted }]} numberOfLines={2}>
                    {q}
                  </Text>
                  <Text style={[styles.conditionA, { color: colors.text }]}>
                    {String(a)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={[styles.detailRow, { marginTop: 14 }]}>
            <View>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>{t('customer.mediaUploaded')}</Text>
              <Text style={[styles.metaValue, { color: colors.primary }]}>
                {t('customerMsg.picsVids', { pics: picCount, vids: vidCount })}
              </Text>
            </View>
          </View>
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
    flexShrink: 1,
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
    flexShrink: 1,
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
