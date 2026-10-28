import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import AuthLayout from '@/components/AuthLayout';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import Input from '@/components/Input';
import AlertModal from '@/components/AlertModal';
import { FadeUp } from '@/animations';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { PASSWORD_MAX, validateEmail, validatePassword } from '@/utils/validators';
import { login } from '../api/authApi';

export default function LoginScreen({ navigation, onLoggedIn }: any) {
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({
    visible: false,
    type: 'error' as 'error' | 'warning' | 'success',
    title: '',
    message: '',
    buttonText: 'Okay',
    secondaryButtonText: '',
    onPrimary: () => {},
  });

  const onSubmit = async () => {
    const next = {
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setErrors(next);
    if (next.email || next.password) return;

    setLoading(true);
    try {
      const res: any = await login({ email, password, rememberMe: remember });
      if (res?.requiresVerification) {
        setModal({
          visible: true,
          type: 'warning',
          title: 'Verification Required',
          message: res.message || 'Please verify your email address to continue.',
          buttonText: 'Verify Now',
          secondaryButtonText: 'Cancel',
          onPrimary: () => {
            setModal(m => ({ ...m, visible: false }));
            navigation.navigate('VerifyOtp', {
              email: res.email || email,
              userId: res.userId,
            });
          },
        });
        return;
      }
      onLoggedIn?.();
    } catch (err: any) {
      setModal({
        visible: true,
        type: 'error',
        title: 'Login Failed',
        message: err.message || 'Invalid email or password',
        buttonText: 'Okay',
        secondaryButtonText: '',
        onPrimary: () => setModal(m => ({ ...m, visible: false })),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome Back">
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
      </FadeUp>

      <FadeUp delay={350} duration={700}>
        <View style={styles.row}>
          <Checkbox checked={remember} onChange={setRemember} label="Remember me" />
          <Pressable onPress={() => navigation.navigate('ForgotPassword')} hitSlop={8}>
            <Text style={[styles.link, { color: colors.textMuted }]}>Forgot Password?</Text>
          </Pressable>
        </View>
      </FadeUp>

      <FadeUp delay={450} duration={700}>
        <Button title="Login" size="lg" loading={loading} onPress={onSubmit} style={styles.button} />
      </FadeUp>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          Don't have an account?{' '}
        </Text>
        <Pressable onPress={() => navigation.navigate('SignUp')} hitSlop={8}>
          <Text style={[styles.footerLink, { color: colors.primary }]}>Sign up</Text>
        </Pressable>
      </View>

      <AlertModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        buttonText={modal.buttonText}
        secondaryButtonText={modal.secondaryButtonText}
        onButtonPress={modal.onPrimary}
        onSecondaryButtonPress={() => setModal(m => ({ ...m, visible: false }))}
        onClose={() => setModal(m => ({ ...m, visible: false }))}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  field: { marginTop: 18 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  link: { fontFamily: fonts.regular, fontSize: 14 },
  button: { marginTop: 26 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: { fontFamily: fonts.regular, fontSize: 14 },
  footerLink: { fontFamily: fonts.bold, fontSize: 14 },
});
