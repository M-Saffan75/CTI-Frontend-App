import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import {
  getAllSellModels,
  getSellDeviceConfig,
  submitSellDeviceApplication,
} from '../services/refurbishedApi';
import AuthService from '@/services/authService';

export default function QuoteApplicationScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const brand = route?.params?.brand || 'Apple';
  const brandSlug = route?.params?.brandSlug || brand.toLowerCase();
  const brandId = route?.params?.brandId;
  const model = route?.params?.model || '12 pro max';
  const modelSlug =
    route?.params?.modelSlug || model.toLowerCase().replace(/\s+/g, '-');
  const modelId = route?.params?.modelId;
  const categoryId = route?.params?.categoryId;
  const storage = route?.params?.storage || '128 GB';
  const selectedVariants = route?.params?.selectedVariants || [{ key: 'Storage', value: storage }];
  const conditionAnswers = route?.params?.conditionAnswers || {};
  const images: any[] = route?.params?.images || [];
  const videos: any[] = route?.params?.videos || [];

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [iban, setIban] = useState('TR');
  const [idNumber, setIdNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill logged in user info
  useEffect(() => {
    AuthService.getStoredSession()
      .then(session => {
        const u = session?.user;
        if (u) {
          if (u.name) setFullName(u.name);
          if (u.email) setEmail(u.email);
          if (u.phone || u.phoneNumber) setPhone(u.phone || u.phoneNumber);
          if (u.address) setAddress(u.address);
          if (u.iban) setIban(u.iban);
          if (u.trIdNumber) setIdNumber(u.trIdNumber);
        }
      })
      .catch(() => {});
  }, []);

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

  const handleIbanChange = (text: string) => {
    let clean = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (clean.length > 0 && !clean.startsWith('TR')) {
      if (clean[0] !== 'T' && clean[0] !== 'R') {
        clean = 'TR' + clean;
      }
    }
    clean = clean.substring(0, 26);
    const parts = clean.match(/.{1,4}/g);
    setIban(parts ? parts.join(' ') : clean);
  };

  const handlePhoneChange = (text: string) => {
    // Only numbers allowed, max 11 digits (e.g. 05XX XXX XX XX or 5XX XXX XX XX)
    const clean = text.replace(/[^\d]/g, '').substring(0, 11);
    setPhone(clean);
  };

  const handleIdChange = (text: string) => {
    const clean = text.replace(/[^\d]/g, '').substring(0, 11);
    setIdNumber(clean);
  };

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      setModal({
        visible: true,
        type: 'warning',
        title: 'Name Required',
        message: 'Please enter your full name.',
      });
      return;
    }

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email.trim())) {
      setModal({
        visible: true,
        type: 'warning',
        title: 'Valid Email Required',
        message: 'Please enter a valid email address.',
      });
      return;
    }

    const cleanPhone = phone.trim().replace(/[^\d]/g, '');
    if (!cleanPhone) {
      setModal({
        visible: true,
        type: 'warning',
        title: 'Telephone Required',
        message: 'Please enter your telephone number.',
      });
      return;
    }

    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      setModal({
        visible: true,
        type: 'warning',
        title: 'Valid Telephone Required',
        message: 'Telephone number must be 10 or 11 digits (e.g. 05XX XXX XX XX).',
      });
      return;
    }

    const cleanId = idNumber.trim();
    if (!cleanId || cleanId.length !== 11) {
      setModal({
        visible: true,
        type: 'warning',
        title: 'TR ID Required',
        message: 'TR ID number must be exactly 11 digits.',
      });
      return;
    }

    if (!address.trim()) {
      setModal({
        visible: true,
        type: 'warning',
        title: 'Address Required',
        message: 'Please enter your pickup / residential address.',
      });
      return;
    }

    const cleanIban = iban.replace(/\s+/g, '').toUpperCase();
    if (!cleanIban.startsWith('TR') || cleanIban.length !== 26) {
      setModal({
        visible: true,
        type: 'warning',
        title: 'Valid IBAN Required',
        message: 'IBAN must start with TR and contain exactly 26 alphanumeric characters.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Ensure required MongoDB ObjectIds are present
      let finalCatId = categoryId;
      let finalBrandId = brandId;
      let finalModelId = modelId;

      const bSlug = brandSlug || brand?.toLowerCase();
      const mSlug = modelSlug || model?.toLowerCase()?.replace(/\s+/g, '-');

      if (!finalCatId || !finalBrandId || !finalModelId) {
        try {
          const config = await getSellDeviceConfig(bSlug, mSlug);
          if (config) {
            finalCatId = finalCatId || config.categoryId;
            finalBrandId = finalBrandId || config.brand?._id;
            finalModelId = finalModelId || config.model?._id;
          }
        } catch (e) {
          console.warn('Failed to resolve config IDs:', e);
        }
      }

      if (!finalModelId || !finalBrandId || !finalCatId) {
        try {
          const allModels = await getAllSellModels();
          const found = allModels.find(
            (m: any) =>
              m.slug === mSlug ||
              m.name?.toLowerCase() === model?.toLowerCase() ||
              (modelId && m._id === modelId),
          );
          if (found) {
            finalModelId = finalModelId || found._id;
            finalCatId = finalCatId || found.categoryId;
            finalBrandId =
              finalBrandId ||
              (typeof found.brandId === 'object' ? found.brandId?._id : found.brandId);
          }
        } catch (e) {
          console.warn('Failed to resolve model from allModels:', e);
        }
      }

      if (!finalModelId || !finalBrandId || !finalCatId) {
        setIsSubmitting(false);
        setModal({
          visible: true,
          type: 'warning',
          title: 'Device Info Missing',
          message: 'Could not identify device configuration. Please go back and re-select your device.',
        });
        return;
      }

      const formData = new FormData();

      // Required IDs
      formData.append('categoryId', String(finalCatId));
      formData.append('brandId', String(finalBrandId));
      formData.append('modelId', String(finalModelId));

      // Selected variants
      formData.append('selectedVariants', JSON.stringify(selectedVariants));

      // Question answers formatted as [{ question, answer }]
      let answersArray: { question: string; answer: string }[] = [];
      if (Array.isArray(conditionAnswers)) {
        answersArray = conditionAnswers;
      } else if (typeof conditionAnswers === 'object' && conditionAnswers !== null) {
        answersArray = Object.keys(conditionAnswers).map(k => ({
          question: k,
          answer: String(conditionAnswers[k]),
        }));
      }
      formData.append('questionAnswers', JSON.stringify(answersArray));

      // Customer fields matching Next.js / backend controller
      formData.append('name', fullName.trim());
      formData.append('email', email.trim());
      formData.append('phone', phone.trim());
      formData.append('trIdNumber', cleanId);
      formData.append('address', address.trim());
      formData.append('iban', cleanIban);

      // Binary Pictures (max 10)
      images.forEach((file: any, index: number) => {
        let uri = typeof file === 'string' ? file : file?.uri;
        if (!uri) return;
        if (Platform.OS === 'ios' && !uri.startsWith('file://') && !uri.startsWith('content://')) {
          uri = `file://${uri}`;
        }
        const filename =
          file?.fileName ||
          file?.name ||
          (typeof file === 'string' ? file.split('/').pop() : '') ||
          `device_pic_${index}_${Date.now()}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = file?.type || (match ? `image/${match[1]}` : 'image/jpeg');
        formData.append('pictures', {
          uri,
          name: filename,
          type,
        } as any);
      });

      // Binary Videos (max 3)
      videos.forEach((file: any, index: number) => {
        let uri = typeof file === 'string' ? file : file?.uri;
        if (!uri) return;
        if (Platform.OS === 'ios' && !uri.startsWith('file://') && !uri.startsWith('content://')) {
          uri = `file://${uri}`;
        }
        const filename =
          file?.fileName ||
          file?.name ||
          (typeof file === 'string' ? file.split('/').pop() : '') ||
          `device_vid_${index}_${Date.now()}.mp4`;
        const match = /\.(\w+)$/.exec(filename);
        const type = file?.type || (match ? `video/${match[1]}` : 'video/mp4');
        formData.append('videos', {
          uri,
          name: filename,
          type,
        } as any);
      });

      const res = await submitSellDeviceApplication(formData);

      if (res.success) {
        const refId =
          res?.data?.referenceNumber ||
          res?.data?._id?.slice(-8)?.toUpperCase() ||
          `REF-${Math.floor(100000 + Math.random() * 900000)}`;

        navigation.replace('ApplicationSubmitted', {
          referenceId: refId,
          applicantName: fullName.trim(),
          brand,
          model,
          selectedVariants,
          conditionAnswers,
          picCount: images.length,
          vidCount: videos.length,
        });
      } else {
        setModal({
          visible: true,
          type: 'error',
          title: 'Submission Failed',
          message: res.message || 'Could not submit your quote application. Please try again.',
        });
      }
    } catch (err: any) {
      setModal({
        visible: true,
        type: 'error',
        title: 'Submission Error',
        message: err?.message || 'A network error occurred while submitting. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <RefurbishedHeader showActions={false} />

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
              <View style={styles.inputLabelRow}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Telephone</Text>
                <Text style={[styles.charCountText, { color: colors.textMuted }]}>
                  {phone.length}/11 digits
                </Text>
              </View>
              <TextInput
                value={phone}
                onChangeText={handlePhoneChange}
                placeholder="05XX XXX XX XX"
                keyboardType="phone-pad"
                maxLength={11}
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
                onChangeText={handleIbanChange}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                autoCapitalize="characters"
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
                onChangeText={handleIdChange}
                placeholder="Your 11-digit TR ID number"
                keyboardType="numeric"
                maxLength={11}
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
              style={[
                styles.submitBtn,
                { backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1 },
              ]}>
              {isSubmitting ? (
                <View style={styles.submittingRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>Uploading & Submitting...</Text>
                </View>
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
                  {model}
                </Text>
              </View>
            </View>

            {/* Selected Specifications / Variants */}
            {Array.isArray(selectedVariants) && selectedVariants.length > 0 && (
              <View style={{ marginTop: 10 }}>
                {selectedVariants.map((v: any, idx: number) => (
                  <View key={idx} style={[styles.detailRow, { marginTop: 6 }]}>
                    <Text style={[styles.metaLabel, { color: colors.textMuted }]}>{v.key || 'Specification'}</Text>
                    <Text style={[styles.metaValue, { color: colors.text }]}>{v.value}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Dynamic Condition Answers Breakdown */}
            {Object.entries(conditionAnswers).length > 0 && (
              <View style={{ marginTop: 14 }}>
                <Text style={[styles.conditionHeader, { color: colors.textMuted }]}>
                  DEVICE CONDITION
                </Text>

                {Object.entries(conditionAnswers).map(([q, a], idx) => (
                  <View key={idx} style={styles.conditionRow}>
                    <Text style={[styles.conditionQ, { color: colors.textMuted }]} numberOfLines={2}>
                      {q}
                    </Text>
                    <Text style={[styles.conditionA, { color: colors.text }]}>
                      {String(a)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={[styles.detailRow, { marginTop: 14 }]}>
              <View>
                <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Media Uploaded</Text>
                <Text style={[styles.metaValue, { color: colors.primary }]}>
                  {images.length} Pics, {videos.length} Vids
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
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  charCountText: {
    fontSize: 11,
    fontFamily: fonts.medium,
  },
  submittingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
