import { useEffect, useState } from 'react';
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

export default function VerifyOtpScreen({ navigation, route, onLoggedIn }: any) {
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
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
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
        title: 'OTP Resent',
        message: `A new verification code was sent to ${email || 'your email'}.`,
      });
      setTimer(60);
      setOtp('');
      setError('');
    } catch (err: any) {
      setModal({
        visible: true,
        type: 'error',
        title: 'Resend Failed',
        message: err.message || 'Could not resend OTP',
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
      const msg = err.message || 'Invalid or expired OTP';
      setError(msg);
      setModal({
        visible: true,
        type: 'error',
        title: 'Verification Failed',
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit once all 6 digits are entered
  useEffect(() => {
    if (otp.length === 6 && !loading) {
      onSubmit();
    }
  }, [otp]);

  return (
    <AuthLayout
      title="Verify OTP"
      subtitle={`Enter the 6-digit code sent to ${email ? email : 'your email'}`}>
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
          title="Submit"
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
            {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
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
