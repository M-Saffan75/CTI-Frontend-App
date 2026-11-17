import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import AuthLayout from '@/components/AuthLayout';
import Button from '@/components/Button';
import Input from '@/components/Input';
import PasswordStrength from '@/components/PasswordStrength';
import AlertModal from '@/components/AlertModal';
import { FadeUp } from '@/animations';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { PASSWORD_MAX, validateConfirmPassword, validatePassword } from '@/utils/validators';
import { resetPassword } from '../api/authApi';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

export default function ResetPasswordScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const email = route?.params?.email || '';
  const otp = route?.params?.otp || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const onSubmit = async () => {
    const next = {
      password: validatePassword(password),
      confirm: validateConfirmPassword(confirm, password),
    };
    setErrors(next);
    if (next.password || next.confirm) return;

    setLoading(true);
    try {
      await resetPassword({ email, otp, password, confirmPassword: confirm });
      navigation.navigate('ResetSuccess');
    } catch (err: any) {
      setModal({
        visible: true,
        title: i18n.t('sellerAuto.resetFailed'),
        message: err.message || i18n.t('customer.couldNotResetPassword'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t('customer.resetYourPassword')} subtitle={t('customer.enterANewPasswordTo')}>
      <FadeUp delay={150} duration={700}>
        <Input
          label={t('profile.password.new')}
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
          label={t('sellerAuto.confirmPassword')}
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
          title={t('sellerAuto.continue')}
          size="lg"
          loading={loading}
          onPress={onSubmit}
          style={styles.button}
        />

        <Pressable onPress={() => navigation.navigate('Login')} hitSlop={8} style={styles.back}>
          <Text style={[styles.backText, { color: colors.primary }]}>{t('customer.backToLogin')}</Text>
        </Pressable>
      </FadeUp>

      <AlertModal
        visible={modal.visible}
        type="error"
        title={modal.title}
        message={modal.message}
        onClose={() => setModal(m => ({ ...m, visible: false }))}
      />
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
