import { useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import Input from '@/components/Input';
import PasswordStrength from '@/components/PasswordStrength';
import Squeeze from '@/components/Squeeze';
import AlertModal from '@/components/AlertModal';
import { FadeUp } from '@/animations';
import { arrowLeftBold, lockBold, shieldBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { PASSWORD_MAX, validateConfirmPassword, validatePassword } from '@/utils/validators';
import AuthService from '@/services/authService';
import KeyboardSafeView from '@/components/KeyboardSafeView';
import { useTranslation } from 'react-i18next';

export default function ChangePasswordScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({
    current: '',
    newPass: '',
    confirm: '',
  });
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);
  const [modal, setModal] = useState({
    visible: false,
    type: 'error' as 'error' | 'success' | 'warning',
    title: '',
    message: '',
    onPrimary: () => {},
  });

  const onSubmit = async () => {
    const nextErrors = {
      current: !currentPassword ? t('profile.password.currentRequired') : '',
      newPass: validatePassword(newPassword),
      confirm: validateConfirmPassword(confirmPassword, newPassword),
    };

    if (currentPassword && newPassword && currentPassword === newPassword) {
      nextErrors.newPass = t('profile.password.sameAsOld');
    }

    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;
    if (busy.current) return;
    busy.current = true;

    setLoading(true);
    try {
      const res = await AuthService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setModal({
        visible: true,
        type: 'success',
        title: t('common.success'),
        message: res?.message || t('profile.password.successFallback'),
        onPrimary: () => {
          setModal(m => ({ ...m, visible: false }));
          navigation.goBack();
        },
      });
    } catch (err: any) {
      setModal({
        visible: true,
        type: 'error',
        title: t('profile.password.failedTitle'),
        message:
          err?.response?.data?.message ||
          err?.data?.message ||
          err?.message ||
          t('profile.password.failedBody'),
        onPrimary: () => setModal(m => ({ ...m, visible: false })),
      });
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };

  return (
    <KeyboardSafeView
      style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + 10 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Squeeze onPress={() => navigation.goBack()} scale={0.9}>
          <View style={[styles.backBtn, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={18} color={colors.onPrimary} />
          </View>
        </Squeeze>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('profile.password.title')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Banner Card */}
        <FadeUp delay={100} duration={600}>
          <View style={[styles.infoBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.infoIconCircle, { backgroundColor: colors.primary + '18' }]}>
              <Icon source={shieldBold} size={24} color={colors.primary} />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>{t('profile.password.banner')}</Text>
              <Text style={[styles.infoSubtitle, { color: colors.textMuted }]}>
                {t('profile.password.hint')}
              </Text>
            </View>
          </View>
        </FadeUp>

        {/* Current Password Field */}
        <FadeUp delay={160} duration={600}>
          <Input
            label={t('profile.password.current')}
            value={currentPassword}
            onChangeText={text => {
              setCurrentPassword(text);
              if (errors.current) setErrors({ ...errors, current: '' });
            }}
            placeholder={t('profile.password.enterCurrent')}
            error={errors.current}
            password
            maxLength={PASSWORD_MAX}
            style={styles.field}
          />
        </FadeUp>

        {/* New Password Field */}
        <FadeUp delay={220} duration={600}>
          <Input
            label={t('profile.password.new')}
            value={newPassword}
            onChangeText={text => {
              setNewPassword(text);
              if (errors.newPass) setErrors({ ...errors, newPass: '' });
            }}
            placeholder={t('profile.password.enterNew')}
            error={errors.newPass}
            password
            maxLength={PASSWORD_MAX}
            style={styles.field}
          />
          <PasswordStrength value={newPassword} />
        </FadeUp>

        {/* Confirm New Password Field */}
        <FadeUp delay={280} duration={600}>
          <Input
            label={t('profile.password.confirmNew')}
            value={confirmPassword}
            onChangeText={text => {
              setConfirmPassword(text);
              if (errors.confirm) setErrors({ ...errors, confirm: '' });
            }}
            placeholder={t('profile.password.confirmNewPlaceholder')}
            error={errors.confirm}
            password
            maxLength={PASSWORD_MAX}
            style={styles.field}
          />
        </FadeUp>

        {/* Submit Button */}
        <FadeUp delay={340} duration={600}>
          <Button
            title={loading ? t('profile.password.updating') : t('profile.password.update')}
            size="lg"
            loading={loading}
            disabled={loading}
            onPress={onSubmit}
            icon={lockBold}
            iconPosition="left"
            style={styles.button}
          />
        </FadeUp>
      </ScrollView>

      <AlertModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onButtonPress={modal.onPrimary}
        onClose={() => setModal(m => ({ ...m, visible: false }))}
      />
    </KeyboardSafeView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 18,
  },
  headerRight: { width: 38 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    marginBottom: 20,
  },
  infoIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextWrap: { flex: 1, gap: 3 },
  infoTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  infoSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  field: { marginTop: 18 },
  button: { marginTop: 30 },
});
