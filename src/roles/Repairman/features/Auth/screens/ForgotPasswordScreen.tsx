import { useState } from 'react';
import { StyleSheet } from 'react-native';

import AuthLayout from '@/components/AuthLayout';
import Button from '@/components/Button';
import Input from '@/components/Input';
import AlertModal from '@/components/AlertModal';
import { FadeUp } from '@/animations';
import { validateEmailOrPhone } from '@/utils/validators';
import { forgotPassword } from '../api/authApi';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

export default function ForgotPasswordScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const onSubmit = async () => {
    const message = validateEmailOrPhone(emailOrPhone);
    setError(message);
    if (message) return;

    setLoading(true);
    try {
      await forgotPassword({ emailOrPhone });
      navigation.navigate('VerifyOtp', { email: emailOrPhone, next: 'ResetPassword' });
    } catch (err: any) {
      setModal({
        visible: true,
        title: i18n.t('customer.resetRequestFailed'),
        message: err.message || i18n.t('customer.couldNotSendResetCode'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('customer.forgotPassword')}
      subtitle={t('customer.enterYourEmailOrPhone')}>
      <FadeUp delay={150} duration={700}>
        <Input
          label={t('customer.enterYourEmailOrPhone2')}
          value={emailOrPhone}
          onChangeText={text => {
            setEmailOrPhone(text);
            if (error) setError('');
          }}
          placeholder={t('customer.exampleGmailCom')}
          error={error}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </FadeUp>

      <FadeUp delay={250} duration={700}>
        <Button
          title={t('customer.continue')}
          size="lg"
          loading={loading}
          onPress={onSubmit}
          style={styles.button}
        />
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
  button: { marginTop: 22 },
});
