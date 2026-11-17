import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import AuthLayout from '@/components/AuthLayout';
import Button from '@/components/Button';
import OtpInput from '@/components/OtpInput';
import AlertModal from '@/components/AlertModal';
import { FadeUp } from '@/animations';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { validateOtp } from '@/utils/validators';
import { resendOtp, verifyOtp } from '../api/authApi';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

export default function VerifyOtpScreen({ navigation, route, onLoggedIn }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const next = route?.params?.next;
  const email = route?.params?.email || '';

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [modal, setModal] = useState({
    visible: false,
    type: 'error' as 'error' | 'success' | 'warning',
    title: '',
    message: '',
  });

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer(seconds => seconds - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const onResend = async () => {
    if (timer > 0 || resending) return;
    setResending(true);
    try {
      await resendOtp(email);
      setModal({
        visible: true,
        type: 'success',
        title: i18n.t('customer.otpResent'),
        message: i18n.t('customerMsg.otpSentMsg', { email: email || i18n.t('customer.yourEmail') }),
      });
      setTimer(60);
      setOtp('');
      setError('');
    } catch (err: any) {
      setModal({
        visible: true,
        type: 'error',
        title: i18n.t('customer.resendFailed'),
        message: err.message || i18n.t('customer.couldNotResendOtp'),
      });
    } finally {
      setResending(false);
    }
  };

  const onSubmit = async () => {
    const message = validateOtp(otp, 6);
    setError(message);
    if (message) return;

    setLoading(true);
    try {
      if (next === 'ResetPassword') {
        navigation.navigate('ResetPassword', { email, otp });
      } else {
        await verifyOtp({ email, otp });
        onLoggedIn?.();
      }
    } catch (err: any) {
      const msg = err.message || i18n.t('customer.invalidOrExpiredOtp');
      setError(msg);
      setModal({
        visible: true,
        type: 'error',
        title: i18n.t('customer.verificationFailed'),
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit once all 6 digits are entered. Only a changed code triggers it; the latest
  // onSubmit and loading flag are read from refs so this never loops.
  const submitRef = useRef(onSubmit);
  submitRef.current = onSubmit;
  const loadingRef = useRef(loading);
  loadingRef.current = loading;
  useEffect(() => {
    if (otp.length === 6 && !loadingRef.current) {
      submitRef.current();
    }
  }, [otp]);

  return (
    <AuthLayout
      title={t('customer.verifyOtp')}
      subtitle={t('customerMsg.otpSubtitle', { email: email ? email : t('customer.yourEmail') })}>
      <FadeUp delay={150} duration={700}>
        <OtpInput
          length={6}
          value={otp}
          onChange={text => {
            setOtp(text);
            if (error) setError('');
          }}
          error={error}
        />
      </FadeUp>

      <FadeUp delay={250} duration={700}>
        <Button
          title={t('customer.submit')}
          size="lg"
          loading={loading}
          onPress={onSubmit}
          style={styles.button}
        />

        <Pressable
          onPress={onResend}
          disabled={timer > 0 || resending}
          hitSlop={8}
          style={styles.resend}>
          <Text
            style={[
              styles.resendText,
              { color: timer > 0 ? colors.textMuted : colors.primary },
            ]}>
            {timer > 0 ? t('customerMsg.resendIn', { seconds: timer }) : t('customer.resendOtp')}
          </Text>
        </Pressable>
      </FadeUp>

      <AlertModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal(m => ({ ...m, visible: false }))}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  button: { marginTop: 30 },
  resend: { alignSelf: 'center', marginTop: 20 },
  resendText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});
