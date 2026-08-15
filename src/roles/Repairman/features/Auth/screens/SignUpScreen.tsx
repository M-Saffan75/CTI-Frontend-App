import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import AuthLayout from '@/components/AuthLayout';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Input from '@/components/Input';
import PasswordStrength from '@/components/PasswordStrength';
import { FadeUp } from '@/animations';
import { googleIcon, repairmanIcon } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import {
  PASSWORD_MAX,
  validateConfirmPassword,
  validateEmail,
  validateName,
  validatePassword,
  validatePhone,
} from '@/utils/validators';
import { register } from '../api/authApi';

const ROLE_LABEL = 'Repairman';
const ROLE_ICON = repairmanIcon;

export default function SignUpScreen({ navigation }) {
  const { colors } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const next = {
      name: validateName(name),
      email: validateEmail(email),
      phone: validatePhone(phone),
      password: validatePassword(password),
      confirm: validateConfirmPassword(confirm, password),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    setLoading(true);
    try {
      await register({ name, email, phone, password });
      navigation.navigate('VerifyOtp');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create an Account" subtitle="Create your account to get started">
      <FadeUp delay={100} duration={700}>
        <View style={[styles.roleBadge, { backgroundColor: colors.surfaceAlt }]}>
          <Icon source={ROLE_ICON} size={16} color={colors.primary} />
          <Text style={[styles.roleBadgeText, { color: colors.text }]}>
            Signing up as{' '}
            <Text style={{ color: colors.primary, fontFamily: fonts.bold }}>{ROLE_LABEL}</Text>
          </Text>
        </View>
      </FadeUp>

      <FadeUp delay={150} duration={700}>
        <Input
          label="Full Name"
          value={name}
          onChangeText={text => {
            setName(text);
            if (errors.name) setErrors({ ...errors, name: '' });
          }}
          placeholder="John Doe"
          error={errors.name}
          style={styles.field}
        />
      </FadeUp>

      <FadeUp delay={190} duration={700}>
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
          style={styles.field}
        />
      </FadeUp>

      <FadeUp delay={230} duration={700}>
        <Input
          label="Phone Number"
          value={phone}
          onChangeText={text => {
            setPhone(text);
            if (errors.phone) setErrors({ ...errors, phone: '' });
          }}
          placeholder="03xx xxxxxxx"
          error={errors.phone}
          keyboardType="phone-pad"
          style={styles.field}
        />
      </FadeUp>

      <FadeUp delay={270} duration={700}>
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

      <FadeUp delay={310} duration={700}>
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
          title="Sign Up"
          size="lg"
          loading={loading}
          onPress={onSubmit}
          style={styles.button}
        />
      </FadeUp>

      <FadeUp delay={400} duration={700}>
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
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  roleBadgeText: { fontFamily: fonts.regular, fontSize: 13 },
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
