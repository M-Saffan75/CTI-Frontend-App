import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import AuthLayout from '@/components/AuthLayout';
import Button from '@/components/Button';
import OtpInput from '@/components/OtpInput';
import { FadeUp } from '@/animations';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { validateOtp } from '@/utils/validators';
import { resendOtp, verifyOtp } from '../api/authApi';

export default function VerifyOtpScreen({ navigation, route, onLoggedIn }) {
  const { colors } = useTheme();
  const next = route?.params?.next;

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const message = validateOtp(otp);
    setError(message);
    if (message) return;

    setLoading(true);
    try {
      await verifyOtp({ otp });
      // From "forgot password" the next step is resetting; from sign-up we're done.
      if (next) navigation.navigate(next);
      else onLoggedIn?.();
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit once all 4 digits are in, so most users never need the button.
  useEffect(() => {
    if (otp.length === 4 && !loading) onSubmit();
  }, [otp]);

  return (
    <AuthLayout title="Verify OTP?" subtitle="Enter the OTP sent to your email/phone">
      <FadeUp delay={150} duration={700}>
        <OtpInput
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

        <Pressable onPress={resendOtp} hitSlop={8} style={styles.resend}>
          <Text style={[styles.resendText, { color: colors.primary }]}>Resend Otp</Text>
        </Pressable>
      </FadeUp>
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
