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
import { PASSWORD_MAX, validateEmail, validateLoginPassword } from '@/utils/validators';
import { login } from '../api/authApi';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

export default function LoginScreen({ navigation, onLoggedIn }: any) {
  const { t } = useTranslation();
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
    buttonText: t('common.okay'),
    secondaryButtonText: '',
    onPrimary: () => {},
  });

  const onSubmit = async () => {
    const next = {
      email: validateEmail(email),
      password: validateLoginPassword(password),
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
          title: i18n.t('sellerAuto.verificationRequired'),
          message: res.message || i18n.t('customer.pleaseVerifyYourEmailAddress'),
          buttonText: i18n.t('sellerAuto.verifyNow'),
          secondaryButtonText: i18n.t('common.cancel'),
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
      onLoggedIn?.(res?.user);
    } catch (err: any) {
      // Handle Seller HTTP 410 (KYC incomplete, no token issued)
      if (err?.status === 410) {
        navigation.navigate('KycStatus', {
          status: 'incomplete',
          role: 'seller',
          message: err.message || i18n.t('sellerAuto.pleaseCompleteYourKycOn'),
          userId: err.data?.userId,
          noToken: true,
        });
        return;
      }

      setModal({
        visible: true,
        type: 'error',
        title: i18n.t('sellerAuto.loginFailed'),
        message: err.message || i18n.t('customer.invalidEmailOrPassword'),
        buttonText: i18n.t('common.okay'),
        secondaryButtonText: '',
        onPrimary: () => setModal(m => ({ ...m, visible: false })),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t('sellerAuto.welcomeBack')}>
      <FadeUp delay={150} duration={700}>
        <Input
          label={t('sellerAuto.email')}
          value={email}
          onChangeText={text => {
            setEmail(text);
            if (errors.email) setErrors({ ...errors, email: '' });
          }}
          placeholder={t('sellerAuto.exampleGmailCom')}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </FadeUp>

      <FadeUp delay={250} duration={700}>
        <Input
          label={t('sellerAuto.password')}
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
          <Checkbox checked={remember} onChange={setRemember} label={t('sellerAuto.rememberMe')} />
          <Pressable onPress={() => navigation.navigate('ForgotPassword')} hitSlop={8}>
            <Text style={[styles.link, { color: colors.textMuted }]}>{t('sellerAuto.forgotPassword')}</Text>
          </Pressable>
        </View>
      </FadeUp>

      <FadeUp delay={450} duration={700}>
        <Button title={t('sellerAuto.login')} size="lg" loading={loading} onPress={onSubmit} style={styles.button} />
      </FadeUp>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textMuted }]}>
          {t('customerMsg.noAccount')}{' '}
        </Text>
        <Pressable onPress={() => navigation.navigate('SignUp')} hitSlop={8}>
          <Text style={[styles.footerLink, { color: colors.primary }]}>{t('sellerAuto.signUp')}</Text>
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
  footerText: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 14 },
  footerLink: { fontFamily: fonts.bold, fontSize: 14 },
});
