import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import AuthLayout from '@/components/AuthLayout';
import Button from '@/components/Button';
import Input from '@/components/Input';
import PasswordStrength from '@/components/PasswordStrength';
import { FadeUp } from '@/animations';
import { googleIcon } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { PASSWORD_MAX, validateEmail, validatePassword } from '@/utils/validators';
import { register } from '../api/authApi';

export default function SignUpScreen({ navigation }) {
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const next = {
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setErrors(next);
    if (next.email || next.password) return;

    setLoading(true);
    try {
      await register({ email, password });
      navigation.navigate('VerifyOtp');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create an Account" subtitle="Create your account to get started">
      <FadeUp delay={150} duration={700}>
        <Input
          label="Email"
          value={email}
          onChangeText={text => {
            setEmail(text);
            if (errors.email) setErrors({ ...errors, email: '' });
          }}
          placeholder="example@gmail.com"
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </FadeUp>

      <FadeUp delay={250} duration={700}>
        <Input
          label="Password"
          value={password}
          onChangeText={text => {
            setPassword(text);
            if (errors.password) setErrors({ ...errors, password: '' });
          }}
          placeholder="*******"
          error={errors.password}
          password
          maxLength={PASSWORD_MAX}
          style={styles.field}
        />
        <PasswordStrength value={password} />
      </FadeUp>

      <FadeUp delay={350} duration={700}>
        <Button
          title="Sign Up"
          size="lg"
          loading={loading}
          onPress={onSubmit}
          style={styles.button}
        />
      </FadeUp>

      <FadeUp delay={450} duration={700}>
        <View style={styles.divider}>
          <View style={[styles.line, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textMuted }]}>Or</Text>
          <View style={[styles.line, { backgroundColor: colors.border }]} />
        </View>

        <Button
          title="Google"
          variant="soft"
          size="lg"
          icon={googleIcon}
          iconPosition="left"
          tintIcon={false}
          style={styles.social}
        />
      </FadeUp>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          Already have an account?{' '}
        </Text>
        <Pressable onPress={() => navigation.navigate('Login')} hitSlop={8}>
          <Text style={[styles.footerLink, { color: colors.primary }]}>Login</Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  field: { marginTop: 18 },
  button: { marginTop: 24 },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 24,
  },
  line: { flex: 1, height: 1 },
  dividerText: { fontFamily: fonts.regular, fontSize: 14 },
  social: { marginTop: 24 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: { fontFamily: fonts.regular, fontSize: 14 },
  footerLink: { fontFamily: fonts.bold, fontSize: 14 },
});
