import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import AuthLayout from '@/components/AuthLayout';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Input from '@/components/Input';
import PasswordStrength from '@/components/PasswordStrength';
import AlertModal from '@/components/AlertModal';
import { FadeUp } from '@/animations';
import { googleIcon, sellerIcon } from '@/assets/icons';
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
import { Trans, useTranslation } from 'react-i18next';
import i18n from '@/i18n';

const ROLE_ICON = sellerIcon;

export default function SignUpScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({
    visible: false,
    title: '',
    message: '',
  });

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
      navigation.navigate('VerifyOtp', { email });
    } catch (err: any) {
      setModal({
        visible: true,
        title: i18n.t('sellerAuto.registrationError'),
        message: err.message || i18n.t('customer.couldNotCompleteRegistration'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={t('customer.createAnAccount')} subtitle={t('customer.createYourAccountToGet')}>
      <FadeUp delay={100} duration={700}>
        <View style={[styles.roleBadge, { backgroundColor: colors.surfaceAlt }]}>
          <Icon source={ROLE_ICON} size={16} color={colors.primary} />
          <Text style={[styles.roleBadgeText, { color: colors.text }]}>
            <Trans
              i18nKey="customerMsg.signingUpAs"
              values={{ role: t('glossary.seller') }}
              components={{ hl: <Text style={{ color: colors.primary, fontFamily: fonts.bold }} /> }}
            />
          </Text>
        </View>
      </FadeUp>

      <FadeUp delay={150} duration={700}>
        <Input
          label={t('profile.edit.fullName')}
          value={name}
          onChangeText={text => {
            setName(text);
            if (errors.name) setErrors({ ...errors, name: '' });
          }}
          placeholder={t('sellerAuto.johnDoe')}
          error={errors.name}
          style={styles.field}
        />
      </FadeUp>

      <FadeUp delay={190} duration={700}>
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
          style={styles.field}
        />
      </FadeUp>

      <FadeUp delay={230} duration={700}>
        <Input
          label={t('profile.phoneNumber')}
          value={phone}
          onChangeText={text => {
            setPhone(text);
            if (errors.phone) setErrors({ ...errors, phone: '' });
          }}
          placeholder={t('sellerAuto.n03xxXxxxxxx')}
          error={errors.phone}
          keyboardType="phone-pad"
          style={styles.field}
        />
      </FadeUp>

      <FadeUp delay={270} duration={700}>
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
        <PasswordStrength value={password} />
      </FadeUp>

      <FadeUp delay={310} duration={700}>
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
          title={t('sellerAuto.signUp2')}
          size="lg"
          loading={loading}
          onPress={onSubmit}
          style={styles.button}
        />
      </FadeUp>

      <FadeUp delay={400} duration={700}>
        <View style={styles.divider}>
          <View style={[styles.line, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textMuted }]}>{t('sellerAuto.or')}</Text>
          <View style={[styles.line, { backgroundColor: colors.border }]} />
        </View>

        <Button
          title={t('sellerAuto.google')}
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
          {t('customerMsg.haveAccount')}{' '}
        </Text>
        <Pressable onPress={() => navigation.navigate('Login')} hitSlop={8}>
          <Text style={[styles.footerLink, { color: colors.primary }]}>{t('sellerAuto.login')}</Text>
        </Pressable>
      </View>

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
  dividerText: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 14 },
  social: { marginTop: 24 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 14 },
  footerLink: { fontFamily: fonts.bold, fontSize: 14 },
});
