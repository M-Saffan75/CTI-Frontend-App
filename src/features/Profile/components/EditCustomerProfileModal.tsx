import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import {
  cameraBold,
  chevronDownBold,
  closeIcon,
  dummyProfileExtra,
  envelopeBold,
  globeBold,
  phoneBold,
  userBold,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { ProfileData } from '../data/profileData';
import {
  CountryOption,
  fetchCountriesApi,
  updateUserProfileApi,
} from '../services/profileApi';

interface EditCustomerProfileModalProps {
  visible: boolean;
  profile: ProfileData;
  onClose: () => void;
  onSaved: (updatedProfile: ProfileData) => void;
}

export default function EditCustomerProfileModal({
  visible,
  profile,
  onClose,
  onSaved,
}: EditCustomerProfileModalProps) {
  const { colors } = useTheme();

  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [selectedCountryId, setSelectedCountryId] = useState<string | undefined>(
    profile?.countryId,
  );
  const [selectedCountryName, setSelectedCountryName] = useState<string>(
    profile?.country || 'Turkey',
  );
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // AlertModal state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<AlertModalType>('error');
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  // Initial snapshot for nothing-changed guard
  const initialSnapshotRef = useRef({
    name: (profile?.name || '').trim(),
    phone: (profile?.phone || '').trim().replace(/[\s-()]/g, ''),
    countryId: profile?.countryId,
    countryName: profile?.country || 'Turkey',
  });

  useEffect(() => {
    if (visible) {
      setName(profile?.name || '');
      setPhone(profile?.phone || '');
      setSelectedCountryId(profile?.countryId);
      setSelectedCountryName(profile?.country || 'Turkey');
      setSelectedPhoto(null);
      setShowCountryDropdown(false);

      initialSnapshotRef.current = {
        name: (profile?.name || '').trim(),
        phone: (profile?.phone || '').trim().replace(/[\s-()]/g, ''),
        countryId: profile?.countryId,
        countryName: profile?.country || 'Turkey',
      };

      fetchCountriesApi().then(list => {
        if (list && list.length > 0) {
          setCountries(list);
          if (profile?.countryId) {
            const match = list.find(c => c.id === profile.countryId);
            if (match) {
              setSelectedCountryName(match.name);
            }
          } else if (profile?.country) {
            const match = list.find(
              c => c.name.toLowerCase() === profile.country?.toLowerCase(),
            );
            if (match) {
              setSelectedCountryId(match.id);
              setSelectedCountryName(match.name);
            }
          }
        }
      });
    }
  }, [visible, profile]);

  const handlePickPhoto = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
      });

      if (result.assets && result.assets.length > 0) {
        setSelectedPhoto(result.assets[0]);
      }
    } catch {
      // User cancelled
    }
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    const cleanPhone = phone.trim().replace(/[\s-()]/g, '');

    // Backend rule 1: Name 2-50 chars
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      setAlertType('warning');
      setAlertTitle('Invalid Name');
      setAlertMessage('Full name must be between 2 and 50 characters.');
      setAlertVisible(true);
      return;
    }

    // Backend rule 2: Phone mobile format
    if (!cleanPhone || cleanPhone.length < 7) {
      setAlertType('warning');
      setAlertTitle('Invalid Phone');
      setAlertMessage('Please provide a valid phone number.');
      setAlertVisible(true);
      return;
    }

    // Nothing-changed guard
    const isPhotoChanged = Boolean(selectedPhoto);
    const isNameChanged = trimmedName !== initialSnapshotRef.current.name;
    const isPhoneChanged = cleanPhone !== initialSnapshotRef.current.phone;
    const isCountryChanged =
      (selectedCountryId && selectedCountryId !== initialSnapshotRef.current.countryId) ||
      (!selectedCountryId && selectedCountryName !== initialSnapshotRef.current.countryName);

    if (!isPhotoChanged && !isNameChanged && !isPhoneChanged && !isCountryChanged) {
      setAlertType('info');
      setAlertTitle('No Changes');
      setAlertMessage('No changes were made to your profile.');
      setAlertVisible(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: trimmedName,
        phone: cleanPhone,
        country: selectedCountryId || selectedCountryName,
        countryId: selectedCountryId,
      };

      if (selectedPhoto?.uri) {
        payload.profilePhoto = selectedPhoto;
      }

      const res = await updateUserProfileApi(payload);

      const serverMsg = res?.message || 'Profile updated successfully!';
      const updatedUser = res?.data?.user || res?.user;

      const updatedProfile: ProfileData = {
        ...profile,
        name: updatedUser?.name || trimmedName,
        phone: updatedUser?.phone || cleanPhone,
        country: selectedCountryName,
        countryId: selectedCountryId,
        avatarUri:
          updatedUser?.profileImage ||
          (selectedPhoto ? selectedPhoto.uri : profile.avatarUri),
      };

      onSaved(updatedProfile);
      setAlertType('success');
      setAlertTitle('Success');
      setAlertMessage(serverMsg);
      setAlertVisible(true);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to update profile. Please try again.';
      setAlertType('error');
      setAlertTitle('Update Failed');
      setAlertMessage(errorMsg);
      setAlertVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentAvatarUri = selectedPhoto
    ? selectedPhoto.uri
    : profile?.avatarUri;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.modalCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Edit Profile
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                Update your personal customer details
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Icon source={closeIcon} size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {/* Avatar Picker */}
            <View style={styles.avatarRow}>
              <View style={styles.avatarWrap}>
                <Image
                  source={
                    currentAvatarUri
                      ? { uri: currentAvatarUri }
                      : dummyProfileExtra
                  }
                  style={[styles.avatarImg, { borderColor: colors.avatarBorder }]}
                />
                <TouchableOpacity
                  onPress={handlePickPhoto}
                  style={[
                    styles.avatarBadge,
                    { backgroundColor: colors.primary, borderColor: colors.surface },
                  ]}>
                  <Icon source={cameraBold} size={14} color={colors.onPrimary} />
                </TouchableOpacity>
              </View>
              <View style={styles.avatarTextWrap}>
                <Text style={[styles.avatarLabel, { color: colors.text }]}>
                  Profile Picture
                </Text>
                <Text style={[styles.avatarHint, { color: colors.textMuted }]}>
                  PNG, JPG up to 5MB
                </Text>
                <TouchableOpacity onPress={handlePickPhoto} style={styles.changePhotoBtn}>
                  <Text style={[styles.changePhotoText, { color: colors.primary }]}>
                    Choose Photo
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Full Name <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputBox,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}>
                <Icon source={userBold} size={16} color={colors.textMuted} />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter full name"
                  placeholderTextColor={colors.textMuted}
                  maxLength={50}
                  style={[styles.textInput, { color: colors.text }]}
                />
              </View>
            </View>

            {/* Email (Read Only) */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Email Address</Text>
                <Text style={[styles.readOnlyBadge, { color: colors.textMuted }]}>
                  (Read-only)
                </Text>
              </View>
              <View
                style={[
                  styles.inputBox,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border, opacity: 0.75 },
                ]}>
                <Icon source={envelopeBold} size={16} color={colors.textMuted} />
                <TextInput
                  value={profile?.email || ''}
                  editable={false}
                  style={[styles.textInput, { color: colors.textMuted }]}
                />
              </View>
              <Text style={[styles.fieldHelpText, { color: colors.textMuted }]}>
                Email address cannot be changed directly.
              </Text>
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Phone Number <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputBox,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}>
                <Icon source={phoneBold} size={16} color={colors.textMuted} />
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="e.g. +90 555 123 4567"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  maxLength={20}
                  style={[styles.textInput, { color: colors.text }]}
                />
              </View>
            </View>

            {/* Country Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Country</Text>
              <TouchableOpacity
                onPress={() => setShowCountryDropdown(!showCountryDropdown)}
                style={[
                  styles.inputBox,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}>
                <Icon source={globeBold} size={16} color={colors.textMuted} />
                <Text style={[styles.dropdownSelectedText, { color: colors.text }]}>
                  {selectedCountryName}
                </Text>
                <Icon
                  source={chevronDownBold}
                  size={14}
                  color={colors.textMuted}
                  style={{
                    transform: [{ rotate: showCountryDropdown ? '180deg' : '0deg' }],
                  }}
                />
              </TouchableOpacity>

              {showCountryDropdown && (
                <View
                  style={[
                    styles.dropdownList,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}>
                  {countries.length === 0 ? (
                    <View style={styles.dropdownLoadingRow}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={[styles.dropdownItemText, { color: colors.textMuted }]}>
                        Loading countries...
                      </Text>
                    </View>
                  ) : (
                    countries.map(c => {
                      const isSelected =
                        c.id === selectedCountryId ||
                        c.name.toLowerCase() === selectedCountryName.toLowerCase();
                      return (
                        <TouchableOpacity
                          key={c.id}
                          onPress={() => {
                            setSelectedCountryId(c.id);
                            setSelectedCountryName(c.name);
                            setShowCountryDropdown(false);
                          }}
                          style={[
                            styles.dropdownItem,
                            isSelected && {
                              backgroundColor: colors.primary + '14',
                            },
                          ]}>
                          <Text
                            style={[
                              styles.dropdownItemText,
                              { color: isSelected ? colors.primary : colors.text },
                              isSelected && { fontFamily: fonts.bold },
                            ]}>
                            {c.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <View style={styles.btnRow}>
              <Button
                title="Cancel"
                variant="outline"
                size="sm"
                onPress={onClose}
                disabled={isSubmitting}
                style={styles.modalBtn}
                contentStyle={styles.btnContent}
                textStyle={styles.btnText}
              />
              <Button
                title="Save Changes"
                variant="primary"
                size="sm"
                onPress={handleSave}
                loading={isSubmitting}
                style={styles.modalBtn}
                contentStyle={styles.btnContent}
                textStyle={styles.btnText}
              />
            </View>
          </View>
        </View>

        {/* Feedback Modal */}
        <AlertModal
          visible={alertVisible}
          type={alertType}
          title={alertTitle}
          message={alertMessage}
          onClose={() => {
            setAlertVisible(false);
            if (alertType === 'success') {
              onClose();
            }
          }}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  scrollArea: {
    maxHeight: 400,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImg: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTextWrap: {
    flex: 1,
  },
  avatarLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  avatarHint: {
    fontSize: 11,
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  changePhotoBtn: {
    marginTop: 4,
  },
  changePhotoText: {
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  readOnlyBadge: {
    fontSize: 11,
    fontFamily: fonts.regular,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    paddingVertical: 0,
  },
  fieldHelpText: {
    fontSize: 11,
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  dropdownSelectedText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  dropdownList: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 160,
    overflow: 'hidden',
  },
  dropdownLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dropdownItemText: {
    fontSize: 13,
    fontFamily: fonts.regular,
  },
  modalFooter: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  modalBtn: {
    flex: 1,
  },
  btnContent: {
    height: 38,
    paddingHorizontal: 10,
  },
  btnText: {
    fontSize: 13,
    fontFamily: fonts.medium,
  },
});
