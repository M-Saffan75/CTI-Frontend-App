import { useState } from 'react';
import { StyleSheet } from 'react-native';

import AuthLayout from '@/components/AuthLayout';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { FadeUp } from '@/animations';
import { validateEmailOrPhone } from '@/utils/validators';
import { forgotPassword } from '../api/authApi';

export default function ForgotPasswordScreen({ navigation }) {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const message = validateEmailOrPhone(emailOrPhone);
    setError(message);
    if (message) return;

    setLoading(true);
    try {
      await forgotPassword({ emailOrPhone });
      navigation.navigate('VerifyOtp', { next: 'ResetPassword' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forget Password?"
      subtitle="Enter your email or phone to reset your password">
      <FadeUp delay={150} duration={700}>
        <Input
          label="Enter your Email or Phone"
          value={emailOrPhone}
          onChangeText={text => {
            setEmailOrPhone(text);
            if (error) setError('');
          }}
          placeholder="example@gmail.com"
          error={error}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </FadeUp>

      <FadeUp delay={250} duration={700}>
        <Button
          title="Continue"
          size="lg"
          loading={loading}
          onPress={onSubmit}
          style={styles.button}
        />
      </FadeUp>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  button: { marginTop: 22 },
});
