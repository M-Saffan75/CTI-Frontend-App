import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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

export default function ChangePasswordScreen({ navigation }: any) {
  const { colors } = useTheme();
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
  const [modal, setModal] = useState({
    visible: false,
    type: 'error' as 'error' | 'success' | 'warning',
    title: '',
    message: '',
    onPrimary: () => {},
  });

  const onSubmit = async () => {
    const nextErrors = {
      current: !currentPassword ? 'Current password is required' : '',
      newPass: validatePassword(newPassword),
      confirm: validateConfirmPassword(confirmPassword, newPassword),
    };

    if (currentPassword && newPassword && currentPassword === newPassword) {
      nextErrors.newPass = 'New password cannot be the same as old password';
    }

    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

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
        title: 'Success',
        message: res.message || 'Password changed successfully!',
        onPrimary: () => {
          setModal(m => ({ ...m, visible: false }));
          navigation.goBack();
        },
      });
    } catch (err: any) {
      setModal({
        visible: true,
        type: 'error',
        title: 'Change Password Failed',
        message: err.message || 'Could not change password. Please check your current password.',
        onPrimary: () => setModal(m => ({ ...m, visible: false })),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + 10 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Squeeze onPress={() => navigation.goBack()} scale={0.9}>
          <View style={[styles.backBtn, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={18} color={colors.onPrimary} />
          </View>
        </Squeeze>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Change Password</Text>
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
              <Text style={[styles.infoTitle, { color: colors.text }]}>Keep Your Account Secure</Text>
              <Text style={[styles.infoSubtitle, { color: colors.textMuted }]}>
                Ensure your new password has at least 8 characters with numbers, lowercase, and uppercase letters.
              </Text>
            </View>
          </View>
        </FadeUp>

        {/* Current Password Field */}
        <FadeUp delay={160} duration={600}>
          <Input
            label="Current Password"
            value={currentPassword}
            onChangeText={text => {
              setCurrentPassword(text);
              if (errors.current) setErrors({ ...errors, current: '' });
            }}
            placeholder="Enter current password"
            error={errors.current}
            password
            maxLength={PASSWORD_MAX}
            style={styles.field}
          />
        </FadeUp>

        {/* New Password Field */}
        <FadeUp delay={220} duration={600}>
          <Input
            label="New Password"
            value={newPassword}
            onChangeText={text => {
              setNewPassword(text);
              if (errors.newPass) setErrors({ ...errors, newPass: '' });
            }}
            placeholder="Enter new password"
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
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={text => {
              setConfirmPassword(text);
              if (errors.confirm) setErrors({ ...errors, confirm: '' });
            }}
            placeholder="Confirm new password"
            error={errors.confirm}
            password
            maxLength={PASSWORD_MAX}
            style={styles.field}
          />
        </FadeUp>

        {/* Submit Button */}
        <FadeUp delay={340} duration={600}>
          <Button
            title="Update Password"
            size="lg"
            loading={loading}
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
    </KeyboardAvoidingView>
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
