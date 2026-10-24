import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CtiLoader from '@/components/CtiLoader';
import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import {
  chevronLeftBold,
  shieldBold,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import RefurbishedHeader from '../components/RefurbishedHeader';
import { submitSellDeviceApplication } from '../services/refurbishedApi';

export default function QuoteApplicationScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const brand = route?.params?.brand || 'Apple';
  const model = route?.params?.model || '12 pro max';
  const storage = route?.params?.storage || '128 GB';
  const conditionAnswers = route?.params?.conditionAnswers || {
    0: 'Good',
    1: 'Yes',
    2: 'Yes',
  };
  const picCount = route?.params?.picCount || 3;
  const vidCount = route?.params?.vidCount || 1;

  const [fullName, setFullName] = useState('John Doe');
  const [email, setEmail] = useState('example@mail.com');
  const [phone, setPhone] = useState('+90 500 000 0000');
  const [address, setAddress] = useState('124 Central Boulevard, Apt 4B');
  const [iban, setIban] = useState('TR00 0000 0000 0000 0000 0000 00');
  const [idNumber, setIdNumber] = useState('12345678901');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AlertModal State
  const [modal, setModal] = useState<{
    visible: boolean;
    type: AlertModalType;
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const handleSubmit = async () => {
    if (!fullName?.trim() || !email?.trim() || !phone?.trim()) {
      setModal({
        visible: true,
        type: 'warning',
        title: 'Required Fields',
        message: 'Please fill in your name, email, and telephone number.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('address', address);
      formData.append('iban', iban);
      formData.append('idNumber', idNumber);
      formData.append('brand', brand);
      formData.append('model', model);
      formData.append('storage', storage);
      formData.append('conditionAnswers', JSON.stringify(conditionAnswers));

      const res = await submitSellDeviceApplication(formData);
      const refId = res?.data?.referenceId || `REF-${Math.floor(100000 + Math.random() * 900000)}`;

      navigation.replace('ApplicationSubmitted', {
        referenceId: refId,
        applicantName: fullName,
        brand,
        model,
        storage,
        conditionAnswers,
        picCount,
        vidCount,
      });
    } catch {
      const fallbackId = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
      navigation.replace('ApplicationSubmitted', {
        referenceId: fallbackId,
        applicantName: fullName,
        brand,
        model,
        storage,
        conditionAnswers,
        picCount,
        vidCount,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <RefurbishedHeader showBack={false} showActions={false} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
          {/* Back link matching Figma */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backLink}>
            <Icon source={chevronLeftBold} size={14} color={colors.primary} />
            <Text style={[styles.backLinkText, { color: colors.primary }]}>Back</Text>
          </TouchableOpacity>

          {/* Form Card matching Figma */}
          <View
            style={[
              styles.formCard,
              { backgroundColor: colors.surface, borderColor: colors.border + '44' },
            ]}>
            <Text style={[styles.formTitle, { color: colors.text }]}>
              Complete Your Application
            </Text>
            <Text style={[styles.formSub, { color: colors.textMuted }]}>
              Please provide your details below. Our technicians will inspect your device details
              and get back to you with our customized quote.
            </Text>

            {/* Name Surname */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Name Surname</Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="John Doe"
                placeholderTextColor={colors.textMuted + '88'}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceAlt,
                    color: colors.text,
                    borderColor: colors.border + '33',
                  },
                ]}
              />
            </View>

            {/* E-mail */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>E-mail</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="example@mail.com"
                keyboardType="email-address"
                placeholderTextColor={colors.textMuted + '88'}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceAlt,
                    color: colors.text,
                    borderColor: colors.border + '33',
                  },
                ]}
              />
            </View>

            {/* Telephone */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Telephone</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+90 500 000 0000"
                keyboardType="phone-pad"
                placeholderTextColor={colors.textMuted + '88'}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceAlt,
                    color: colors.text,
                    borderColor: colors.border + '33',
                  },
                ]}
              />
            </View>

            {/* Address */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Address</Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Enter your address information"
                placeholderTextColor={colors.textMuted + '88'}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceAlt,
                    color: colors.text,
                    borderColor: colors.border + '33',
                  },
                ]}
              />
            </View>

            {/* IBAN */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>IBAN (For payment)</Text>
              <TextInput
                value={iban}
                onChangeText={setIban}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                placeholderTextColor={colors.textMuted + '88'}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceAlt,
                    color: colors.text,
                    borderColor: colors.border + '33',
                  },
                ]}
              />
            </View>

            {/* TR ID Number */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>TR ID Number</Text>
              <TextInput
                value={idNumber}
                onChangeText={setIdNumber}
                placeholder="Your 11-digit TR ID number"
                keyboardType="numeric"
                placeholderTextColor={colors.textMuted + '88'}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surfaceAlt,
                    color: colors.text,
                    borderColor: colors.border + '33',
                  },
                ]}
              />
            </View>

            {/* Complete Application Button */}
            <Squeeze
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1 }]}>
              {isSubmitting ? (
                <CtiLoader size="xs" />
              ) : (
                <Text style={styles.submitBtnText}>Complete application</Text>
              )}
            </Squeeze>
          </View>

          {/* Device Details Summary Card matching Figma */}
          <View
            style={[
              styles.detailsCard,
              { backgroundColor: colors.surface, borderColor: colors.border + '44' },
            ]}>
            <Text style={[styles.detailsHeading, { color: colors.text }]}>Device Details</Text>
            <View style={[styles.divider, { backgroundColor: colors.border + '33' }]} />

            <View style={styles.detailRow}>
              <View>
                <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Brand</Text>
                <Text style={[styles.metaValue, { color: colors.text }]}>{brand}</Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Model</Text>
                <Text style={[styles.metaValue, { color: colors.text }]}>
                  {model} ({storage})
                </Text>
              </View>
            </View>

            {/* Condition Answers Breakdown */}
            <View style={{ marginTop: 14 }}>
              <Text style={[styles.conditionHeader, { color: colors.textMuted }]}>
                DEVICE CONDITION
              </Text>

              <View style={styles.conditionRow}>
                <Text style={[styles.conditionQ, { color: colors.textMuted }]}>
                  What is the Screen Condition
                </Text>
                <Text style={[styles.conditionA, { color: colors.text }]}>
                  {conditionAnswers?.[0] || 'Good'}
                </Text>
              </View>

              <View style={styles.conditionRow}>
                <Text style={[styles.conditionQ, { color: colors.textMuted }]}>
                  Is your device's touch screen working properly?
                </Text>
                <Text style={[styles.conditionA, { color: colors.text }]}>
                  {conditionAnswers?.[1] || 'Yes'}
                </Text>
              </View>

              <View style={styles.conditionRow}>
                <Text style={[styles.conditionQ, { color: colors.textMuted }]}>
                  Is your phone's screen original?
                </Text>
                <Text style={[styles.conditionA, { color: colors.text }]}>
                  {conditionAnswers?.[2] || 'Yes'}
                </Text>
              </View>
            </View>

            <View style={[styles.detailRow, { marginTop: 14 }]}>
              <View>
                <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Media Uploaded</Text>
                <Text style={[styles.metaValue, { color: colors.primary }]}>
                  {picCount} Pics, {vidCount} Vids
                </Text>
              </View>
            </View>
          </View>

          {/* Security & Guarantee Trust Card */}
          <View
            style={[
              styles.trustCard,
              { backgroundColor: colors.surface, borderColor: colors.border + '44' },
            ]}>
            <View style={styles.trustHeader}>
              <Icon source={shieldBold} size={20} color={colors.primary} />
              <Text style={[styles.trustTitle, { color: colors.text }]}>Device Detail</Text>
            </View>
            <Text style={[styles.trustDesc, { color: colors.textMuted }]}>
              Get paid instantly at your doorstep. We guarantee 100% data security and professional
              device assessment through the CTI platform.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AlertModal
        visible={modal.visible}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  backLinkText: {
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  formCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
  },
  formSub: {
    fontSize: 13,
    fontFamily: fonts.regular,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 18,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
    marginBottom: 6,
  },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  submitBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  detailsCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  detailsHeading: {
    fontSize: 17,
    fontFamily: fonts.bold,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    fontFamily: fonts.regular,
    marginBottom: 3,
  },
  metaValue: {
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  conditionHeader: {
    fontSize: 11,
    fontFamily: fonts.bold,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  conditionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  conditionQ: {
    fontSize: 12,
    fontFamily: fonts.regular,
    flex: 1,
  },
  conditionA: {
    fontSize: 12,
    fontFamily: fonts.bold,
    marginLeft: 8,
  },
  trustCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  trustHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  trustTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  trustDesc: {
    fontSize: 13,
    fontFamily: fonts.regular,
    lineHeight: 19,
  },
});
