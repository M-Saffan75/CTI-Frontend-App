import { ImageBackground, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import { FadeUp, ZoomIn } from '@/animations';
import { checkCircleFilled } from '@/assets/icons';
import { splashByTheme } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useTranslation } from 'react-i18next';

export default function ResetSuccessScreen({ navigation }) {
  const { t } = useTranslation();
  const { colors, themeName } = useTheme();
  const insets = useSafeAreaInsets();

  // Wipe the auth history so the back button can't return here.
  const goHome = () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] });

  return (
    <ImageBackground
      source={splashByTheme[themeName] ?? splashByTheme.white}
      resizeMode="cover"
      style={styles.screen}>
      <StatusBar barStyle={colors.barStyle} />

      <View style={[styles.body, { paddingBottom: insets.bottom + 20 }]}>
        <ZoomIn duration={500}>
          <View style={styles.check}>
            {/* The tick is a transparent cut-out in the icon, so this disc behind
                it is what shows through. */}
            <View style={[styles.checkFill, { backgroundColor: colors.onPrimary }]} />
            <Icon source={checkCircleFilled} size={150} color={colors.primary} />
          </View>
        </ZoomIn>

        <FadeUp delay={200} duration={700}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('customer.passwordUpdatedSuccessfully')}
          </Text>
          <Text style={[styles.text, { color: colors.textMuted }]}>
            {t('customer.yourPasswordHasBeenChanged')}
          </Text>
        </FadeUp>

        <FadeUp delay={320} duration={700} style={styles.buttonWrap}>
          <Button title={t('customer.backToHome2')} size="lg" onPress={goHome} />
        </FadeUp>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  check: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  checkFill: { position: 'absolute', width: 105, height: 105, borderRadius: 53 },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 38,
    textAlign: 'center',
    marginTop: 30,
  },
  text: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
  },
  buttonWrap: { marginTop: 34 },
});
