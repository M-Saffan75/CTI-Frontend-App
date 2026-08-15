import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import AuthLayout from '@/components/AuthLayout';
import Button from '@/components/Button';
import Input from '@/components/Input';
import PasswordStrength from '@/components/PasswordStrength';
import { FadeUp } from '@/animations';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { PASSWORD_MAX, validateConfirmPassword, validatePassword } from '@/utils/validators';
import { resetPassword } from '../api/authApi';

export default function ResetPasswordScreen({ navigation }) {
  const { colors } = useTheme();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const next = {
      password: validatePassword(password),
      confirm: validateConfirmPassword(confirm, password),
    };
    setErrors(next);
    if (next.password || next.confirm) return;

    setLoading(true);
    try {
      await resetPassword({ password });
      navigation.navigate('ResetSuccess');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset Your Password" subtitle="Enter a new password to secure your account">
      <FadeUp delay={150} duration={700}>
        <Input
          label="New Password"
          value={password}
          onChangeText={text => {
            setPassword(text);
            if (errors.password) setErrors({ ...errors, password: '' });
          }}
          placeholder="*******"
          error={errors.password}
          password
          maxLength={PASSWORD_MAX}
        />
        <PasswordStrength value={password} />
      </FadeUp>

      <FadeUp delay={250} duration={700}>
        <Input
          label="Confirm Password"
          value={confirm}
          onChangeText={text => {
            setConfirm(text);
            if (errors.confirm) setErrors({ ...errors, confirm: '' });
          }}
          placeholder="*******"
          error={errors.confirm}
          password
          maxLength={PASSWORD_MAX}
          style={styles.field}
        />
      </FadeUp>

      <FadeUp delay={350} duration={700}>
        <Button
          title="Continue"
          size="lg"
          loading={loading}
          onPress={onSubmit}
          style={styles.button}
        />

        <Pressable onPress={() => navigation.navigate('Login')} hitSlop={8} style={styles.back}>
          <Text style={[styles.backText, { color: colors.primary }]}>Back to login</Text>
        </Pressable>
      </FadeUp>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  field: { marginTop: 20 },
  button: { marginTop: 28 },
  back: { alignSelf: 'center', marginTop: 20 },
  backText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});
