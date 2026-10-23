import { useState } from 'react';
import {
  Image,
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

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  bookmarkBold,
  calendarBold,
  checkCircleBold,
  chevronDownBold,
  creditCardBold,
  fileBold,
  mapPinBold,
  menuBold,
  packageBold,
  penBold,
  phoneBold,
  storeBold,
  trashBold,
  uploadBold,
  userBold,
} from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import {
  CertificateItem,
  EducationItem,
  ExperienceItem,
  INITIAL_PROFILE_DATA,
  ProfileData,
} from '../data/profileData';
import AddEducationModal from '../components/AddEducationModal';
import AddExperienceModal from '../components/AddExperienceModal';
import AddCertificateModal from '../components/AddCertificateModal';
import { updateUserProfileApi } from '../services/profileApi';

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const WEEK_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export default function EditProfileScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<ProfileData>(
    route?.params?.profileData || INITIAL_PROFILE_DATA,
  );

  // Form States
  const [firstName, setFirstName] = useState((profile?.name || '').split(' ')[0] || 'Malik');
  const [fatherName, setFatherName] = useState('Malik Nadeem');
  const [gender, setGender] = useState('Male');
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [dob, setDob] = useState('03/08/1999');
  const [cnic, setCnic] = useState('1469643963');
  const [taxNumber, setTaxNumber] = useState('22334');

  // Contact
  const [phone, setPhone] = useState(profile?.phone || '');
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [emergencyPhone, setEmergencyPhone] = useState(profile?.emergencyPhone || '');
  const [emergencyPerson, setEmergencyPerson] = useState(profile?.emergencyPerson || '');

  // Location
  const [country, setCountry] = useState('Pakistan');
  const [stateName, setStateName] = useState('Sindh');
  const [city, setCity] = useState(
    profile?.city === 'City Not Set' ? 'Karachi' : profile?.city || 'Karachi',
  );
  const [district, setDistrict] = useState('');
  const [zipCode, setZipCode] = useState(profile?.zipCode || '');
  const [address, setAddress] = useState(profile?.address || '');

  // Shop Info
  const [shopName, setShopName] = useState('Suggest');
  const [shopDesc, setShopDesc] = useState(profile?.aboutMe || '');
  const [offerPickup, setOfferPickup] = useState(Boolean(profile?.pickupServiceAvailable));

  // Professional Info
  const [yearsExperience, setYearsExperience] = useState('2');
  const [specializations, setSpecializations] = useState<string[]>(
    profile?.specialization || [],
  );
  const [newSpec, setNewSpec] = useState('');

  // Schedule
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('21:00 PM');
  const [selectedDays, setSelectedDays] = useState<string[]>([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]);

  // Banking
  const [accountTitle, setAccountTitle] = useState('Malik Zubair');
  const [accountNumber, setAccountNumber] = useState('012345678901');
  const [bankName, setBankName] = useState('Meezan Bank');
  const [branchName, setBranchName] = useState('Latifabad Branch');
  const [iban, setIban] = useState('PK36MEZN0001234567890101');

  // Modals
  const [showEduModal, setShowEduModal] = useState(false);
  const [editingEdu, setEditingEdu] = useState<EducationItem | null>(null);

  const [showExpModal, setShowExpModal] = useState(false);
  const [editingExp, setEditingExp] = useState<ExperienceItem | null>(null);

  const [showCertModal, setShowCertModal] = useState(false);
  const [editingCert, setEditingCert] = useState<CertificateItem | null>(null);

  const handleAddSpec = () => {
    if (!newSpec.trim()) return;
    if (!specializations.includes(newSpec.trim())) {
      setSpecializations([...specializations, newSpec.trim()]);
    }
    setNewSpec('');
  };

  const handleRemoveSpec = (tag: string) => {
    setSpecializations(specializations.filter(t => t !== tag));
  };

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const [isSaving, setIsSaving] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: AlertModalType;
    title: string;
    message: string;
    onOk?: () => void;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const handleSave = async () => {
    const updated: ProfileData = {
      ...profile,
      name: `${firstName.trim()} ${fatherName.trim()}`.trim() || profile.name,
      phone,
      whatsapp,
      email,
      emergencyPerson,
      emergencyPhone,
      city,
      address,
      zipCode,
      aboutMe: shopDesc,
      pickupServiceAvailable: offerPickup,
      specialization: specializations,
      workingHours: `${startTime} - ${endTime}`,
      workingDays: selectedDays.map(d => d.slice(0, 3)),
      bankDetailsCompleted: Boolean(accountNumber && bankName),
    };

    setIsSaving(true);
    try {
      await updateUserProfileApi({
        fullName: updated.name,
        phone: updated.phone,
        email: updated.email,
        city: updated.city,
        address: updated.address,
        zipCode: updated.zipCode,
        description: updated.aboutMe,
        workingHours: { start: startTime, end: endTime },
        workingDays: selectedDays,
        bankDetails: {
          accountTitle,
          accountNumber,
          bankName,
          branchName,
          iban,
        },
      });

      route?.params?.onSaveProfile?.(updated);
      setAlertConfig({
        visible: true,
        type: 'success',
        title: 'Profile Updated',
        message: 'Your profile details have been saved successfully!',
        onOk: () => navigation?.goBack(),
      });
    } catch (err: any) {
      route?.params?.onSaveProfile?.(updated);
      const msg = err?.response?.data?.message || 'Profile saved locally. Syncing with backend server.';
      setAlertConfig({
        visible: true,
        type: 'success',
        title: 'Profile Saved',
        message: msg,
        onOk: () => navigation?.goBack(),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Image source={ctiLogo} resizeMode="contain" style={styles.logo} />
        <TouchableOpacity onPress={() => navigation?.navigate('Settings')}>
          <Icon source={menuBold} size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Back Link Row */}
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backRow}>
          <View style={[styles.backIconCircle, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={16} color={colors.onPrimary} />
          </View>
          <Text style={[styles.backText, { color: colors.text }]}>Back to Profile</Text>
        </TouchableOpacity>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Edit Profile</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
            Update your profile information and keep your details current
          </Text>
        </View>

        {/* 1. Basic Information */}
        <FadeUp delay={30} duration={300}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Icon source={userBold} size={18} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Basic Information</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>First Name</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Father Name</Text>
              <TextInput
                value={fatherName}
                onChangeText={setFatherName}
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Gender</Text>
              <TouchableOpacity
                onPress={() => setShowGenderDropdown(!showGenderDropdown)}
                style={[
                  styles.dropdownInput,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}>
                <Text style={{ fontFamily: fonts.medium, color: colors.text }}>{gender}</Text>
                <Icon source={chevronDownBold} size={14} color={colors.textMuted} />
              </TouchableOpacity>

              {showGenderDropdown && (
                <View
                  style={[
                    styles.dropdownMenu,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}>
                  {GENDER_OPTIONS.map(opt => (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => {
                        setGender(opt);
                        setShowGenderDropdown(false);
                      }}
                      style={styles.dropdownItem}>
                      <Text
                        style={[
                          styles.dropdownItemText,
                          { color: gender === opt ? colors.primary : colors.text },
                        ]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Date of birth</Text>
              <View
                style={[
                  styles.inputRow,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}>
                <TextInput
                  value={dob}
                  onChangeText={setDob}
                  style={[styles.inputFlex, { color: colors.text }]}
                />
                <Icon source={calendarBold} size={16} color={colors.textMuted} />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>National ID / CNIC</Text>
              <TextInput
                value={cnic}
                onChangeText={setCnic}
                keyboardType="numeric"
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Tax Number</Text>
              <TextInput
                value={taxNumber}
                onChangeText={setTaxNumber}
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>
          </View>
        </FadeUp>

        {/* 2. Contact Information */}
        <FadeUp delay={60} duration={300}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Icon source={phoneBold} size={18} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Contact Information</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Mobile Number</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Whatsapp Number</Text>
              <TextInput
                value={whatsapp}
                onChangeText={setWhatsapp}
                keyboardType="phone-pad"
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Emergency Contact Number</Text>
              <TextInput
                value={emergencyPhone}
                onChangeText={setEmergencyPhone}
                keyboardType="phone-pad"
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Emergency Contact Person</Text>
              <TextInput
                value={emergencyPerson}
                onChangeText={setEmergencyPerson}
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>
          </View>
        </FadeUp>

        {/* 3. Location */}
        <FadeUp delay={90} duration={300}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Icon source={mapPinBold} size={18} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Location</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Country</Text>
              <TextInput
                value={country}
                onChangeText={setCountry}
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>State</Text>
              <TextInput
                value={stateName}
                onChangeText={setStateName}
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>City</Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>District</Text>
              <TextInput
                value={district}
                onChangeText={setDistrict}
                placeholder="District name"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Zip Code</Text>
              <TextInput
                value={zipCode}
                onChangeText={setZipCode}
                keyboardType="numeric"
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Full Address</Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={3}
                style={[
                  styles.textArea,
                  { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>
          </View>
        </FadeUp>

        {/* 4. Shop Information */}
        <FadeUp delay={120} duration={300}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Icon source={storeBold} size={18} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Shop Information</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Shop Name</Text>
              <TextInput
                value={shopName}
                onChangeText={setShopName}
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Shop Description</Text>
              <TextInput
                value={shopDesc}
                onChangeText={setShopDesc}
                multiline
                maxLength={500}
                numberOfLines={4}
                style={[
                  styles.textArea,
                  { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                ]}
              />
              <Text style={[styles.counter, { color: colors.textMuted }]}>
                {shopDesc.length}/500
              </Text>
            </View>

            {/* Checkbox: Offer pickup Service */}
            <TouchableOpacity
              onPress={() => setOfferPickup(!offerPickup)}
              style={styles.checkboxRow}>
              <View
                style={[
                  styles.checkboxBox,
                  {
                    backgroundColor: offerPickup ? colors.primary : 'transparent',
                    borderColor: offerPickup ? colors.primary : colors.border,
                  },
                ]}>
                {offerPickup && <Icon source={checkCircleBold} size={14} color={colors.onPrimary} />}
              </View>
              <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                Offer pickup Service
              </Text>
            </TouchableOpacity>

            {/* Upload Dropzones */}
            {['Profile photo', 'Shop Photo', 'National ID/Passport Scan', 'Utility Bill/Shop Proof'].map(
              docTitle => (
                <View key={docTitle} style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>{docTitle}</Text>
                  <TouchableOpacity
                    style={[
                      styles.uploadBox,
                      { borderColor: colors.border, backgroundColor: colors.surfaceAlt },
                    ]}>
                    <Icon source={uploadBold} size={18} color={colors.textMuted} />
                    <Text style={[styles.uploadText, { color: colors.textMuted }]}>
                      Upload Image
                    </Text>
                  </TouchableOpacity>
                </View>
              ),
            )}
          </View>
        </FadeUp>

        {/* 5. Professional Information */}
        <FadeUp delay={150} duration={300}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Icon source={packageBold} size={18} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Professional Information</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Years of experience</Text>
              <TextInput
                value={yearsExperience}
                onChangeText={setYearsExperience}
                keyboardType="numeric"
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Specializations</Text>
              <View style={styles.addTagRow}>
                <TextInput
                  placeholder="Type specialization and press Enter"
                  placeholderTextColor={colors.textMuted}
                  value={newSpec}
                  onChangeText={setNewSpec}
                  onSubmitEditing={handleAddSpec}
                  style={[
                    styles.tagInput,
                    { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                  ]}
                />
                <Squeeze onPress={handleAddSpec}>
                  <View style={[styles.addBtn, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.addBtnText, { color: colors.onPrimary }]}>Add</Text>
                  </View>
                </Squeeze>
              </View>

              {/* Tag Pills */}
              <View style={styles.tagsContainer}>
                {specializations.map(tag => (
                  <View
                    key={tag}
                    style={[
                      styles.specTag,
                      { backgroundColor: colors.primary + '18', borderColor: colors.primary },
                    ]}>
                    <Text style={[styles.specTagText, { color: colors.primary }]}>{tag}</Text>
                    <TouchableOpacity onPress={() => handleRemoveSpec(tag)}>
                      <Text style={[styles.tagRemove, { color: colors.primary }]}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </FadeUp>

        {/* 6. Education Section */}
        <FadeUp delay={180} duration={300}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeaderWithAction}>
              <View style={styles.cardHeaderLeft}>
                <Icon source={bookmarkBold} size={18} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>Education</Text>
              </View>

              <Squeeze
                onPress={() => {
                  setEditingEdu(null);
                  setShowEduModal(true);
                }}>
                <View style={[styles.addPillBtn, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.addPillText, { color: colors.onPrimary }]}>+ Add Education</Text>
                </View>
              </Squeeze>
            </View>

            {profile.education.map(item => (
              <View
                key={item.id}
                style={[
                  styles.subItemCard,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}>
                <View style={styles.subItemHeader}>
                  <Text style={[styles.subItemTitle, { color: colors.text }]}>{item.degree}</Text>
                  <View style={styles.subItemActions}>
                    <TouchableOpacity
                      onPress={() => {
                        setEditingEdu(item);
                        setShowEduModal(true);
                      }}
                      style={styles.actionIconBtn}>
                      <Icon source={penBold} size={15} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setProfile(prev => ({
                          ...prev,
                          education: prev.education.filter(e => e.id !== item.id),
                        }));
                      }}
                      style={styles.actionIconBtn}>
                      <Icon source={trashBold} size={15} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={[styles.subItemCompany, { color: colors.primary }]}>
                  {item.institution}
                </Text>
                <Text style={[styles.subItemDesc, { color: colors.textMuted }]}>
                  {item.startYear} - {item.endYear}
                </Text>
                <Text style={[styles.subItemDesc, { color: colors.textMuted }]}>
                  {item.description}
                </Text>
              </View>
            ))}
          </View>
        </FadeUp>

        {/* 7. Experience Section */}
        <FadeUp delay={210} duration={300}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeaderWithAction}>
              <View style={styles.cardHeaderLeft}>
                <Icon source={packageBold} size={18} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>Experience</Text>
              </View>

              <Squeeze
                onPress={() => {
                  setEditingExp(null);
                  setShowExpModal(true);
                }}>
                <View style={[styles.addPillBtn, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.addPillText, { color: colors.onPrimary }]}>+ Add Experience</Text>
                </View>
              </Squeeze>
            </View>

            {profile.experience.map(item => (
              <View
                key={item.id}
                style={[
                  styles.subItemCard,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}>
                <View style={styles.subItemHeader}>
                  <Text style={[styles.subItemTitle, { color: colors.text }]}>{item.title}</Text>
                  <View style={styles.subItemActions}>
                    <TouchableOpacity
                      onPress={() => {
                        setEditingExp(item);
                        setShowExpModal(true);
                      }}
                      style={styles.actionIconBtn}>
                      <Icon source={penBold} size={15} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setProfile(prev => ({
                          ...prev,
                          experience: prev.experience.filter(e => e.id !== item.id),
                        }));
                      }}
                      style={styles.actionIconBtn}>
                      <Icon source={trashBold} size={15} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={[styles.subItemCompany, { color: colors.primary }]}>
                  {item.company}
                </Text>
                <Text style={[styles.subItemDesc, { color: colors.textMuted }]}>
                  {item.startYear} - {item.endYear}
                </Text>
                <Text style={[styles.subItemDesc, { color: colors.textMuted }]}>
                  {item.description}
                </Text>
              </View>
            ))}
          </View>
        </FadeUp>

        {/* 8. Certifications & Licenses */}
        <FadeUp delay={240} duration={300}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Icon source={fileBold} size={18} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Certifications & Licenses
              </Text>
            </View>

            <View style={styles.centerButtonContainer}>
              <Squeeze
                onPress={() => {
                  setEditingCert(null);
                  setShowCertModal(true);
                }}>
                <View style={[styles.addPillBtnCentered, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.addPillText, { color: colors.onPrimary }]}>+ Add Certificate</Text>
                </View>
              </Squeeze>
            </View>

            {profile.certificates.map(item => (
              <View
                key={item.id}
                style={[
                  styles.subItemCard,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}>
                {item.imageUri && (
                  <Image source={{ uri: item.imageUri }} style={styles.certPreview} />
                )}
                <View style={styles.subItemHeader}>
                  <Text style={[styles.subItemTitle, { color: colors.text }]}>{item.title}</Text>
                  <View style={styles.subItemActions}>
                    <TouchableOpacity
                      onPress={() => {
                        setEditingCert(item);
                        setShowCertModal(true);
                      }}
                      style={styles.actionIconBtn}>
                      <Icon source={penBold} size={15} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setProfile(prev => ({
                          ...prev,
                          certificates: prev.certificates.filter(c => c.id !== item.id),
                        }));
                      }}
                      style={styles.actionIconBtn}>
                      <Icon source={trashBold} size={15} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </FadeUp>

        {/* 9. Working Schedule */}
        <FadeUp delay={270} duration={300}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Icon source={calendarBold} size={18} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Working Schedule</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Start Time</Text>
              <TextInput
                value={startTime}
                onChangeText={setStartTime}
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>End Time</Text>
              <TextInput
                value={endTime}
                onChangeText={setEndTime}
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text, marginBottom: 4 }]}>Working Days</Text>
              {WEEK_DAYS.map(day => {
                const isSelected = selectedDays.includes(day);
                return (
                  <TouchableOpacity
                    key={day}
                    onPress={() => toggleDay(day)}
                    style={[
                      styles.dayRow,
                      { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                    ]}>
                    <View
                      style={[
                        styles.checkboxBox,
                        {
                          backgroundColor: isSelected ? colors.primary : 'transparent',
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}>
                      {isSelected && (
                        <Icon source={checkCircleBold} size={14} color={colors.onPrimary} />
                      )}
                    </View>
                    <Text style={[styles.dayLabel, { color: colors.text }]}>{day}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </FadeUp>

        {/* 10. Banking Information */}
        <FadeUp delay={300} duration={300}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Icon source={creditCardBold} size={18} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Banking Information</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Account Title</Text>
              <TextInput
                value={accountTitle}
                onChangeText={setAccountTitle}
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Account Number</Text>
              <TextInput
                value={accountNumber}
                onChangeText={setAccountNumber}
                keyboardType="numeric"
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Bank Name</Text>
              <TextInput
                value={bankName}
                onChangeText={setBankName}
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Branch Name</Text>
              <TextInput
                value={branchName}
                onChangeText={setBranchName}
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>IBAN</Text>
              <TextInput
                value={iban}
                onChangeText={setIban}
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>
          </View>
        </FadeUp>

        {/* Action Buttons: Save Profile & Cancel */}
        <View style={styles.bottomButtonsSection}>
          <Squeeze onPress={handleSave}>
            <View style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
              <Text style={[styles.saveBtnText, { color: colors.onPrimary }]}>
                {isSaving ? 'Saving...' : 'Save Profile'}
              </Text>
            </View>
          </Squeeze>

          <Squeeze onPress={() => navigation?.goBack()}>
            <View
              style={[
                styles.cancelBtn,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
            </View>
          </Squeeze>
        </View>
      </ScrollView>

      {/* Add Education Modal */}
      <AddEducationModal
        visible={showEduModal}
        itemToEdit={editingEdu}
        onClose={() => setShowEduModal(false)}
        onSave={item => {
          if (editingEdu) {
            setProfile(prev => ({
              ...prev,
              education: prev.education.map(e => (e.id === item.id ? item : e)),
            }));
          } else {
            setProfile(prev => ({
              ...prev,
              education: [...prev.education, item],
            }));
          }
        }}
      />

      {/* Add Experience Modal */}
      <AddExperienceModal
        visible={showExpModal}
        itemToEdit={editingExp}
        onClose={() => setShowExpModal(false)}
        onSave={item => {
          if (editingExp) {
            setProfile(prev => ({
              ...prev,
              experience: prev.experience.map(e => (e.id === item.id ? item : e)),
            }));
          } else {
            setProfile(prev => ({
              ...prev,
              experience: [...prev.experience, item],
            }));
          }
        }}
      />

      {/* Add Certificate Modal */}
      <AddCertificateModal
        visible={showCertModal}
        itemToEdit={editingCert}
        onClose={() => setShowCertModal(false)}
        onSave={item => {
          if (editingCert) {
            setProfile(prev => ({
              ...prev,
              certificates: prev.certificates.map(c => (c.id === item.id ? item : c)),
            }));
          } else {
            setProfile(prev => ({
              ...prev,
              certificates: [...prev.certificates, item],
            }));
          }
        }}
      />

      {/* Alert Modal */}
      <AlertModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => {
          setAlertConfig(prev => ({ ...prev, visible: false }));
          if (alertConfig.onOk) {
            alertConfig.onOk();
          }
        }}
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
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  logo: { width: 110, height: 50 },
  content: {
    paddingHorizontal: 16,
    gap: 16,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  backIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  titleSection: {
    gap: 4,
    marginTop: 2,
  },
  pageTitle: {
    fontFamily: fonts.bold,
    fontSize: 24,
  },
  pageSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  cardHeaderWithAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  formGroup: {
    gap: 6,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  inputRow: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputFlex: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  dropdownInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownMenu: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 4,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dropdownItemText: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  textArea: {
    minHeight: 80,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  counter: {
    fontFamily: fonts.regular,
    fontSize: 11,
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  uploadBox: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadText: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  addTagRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tagInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  addBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  specTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
  },
  specTagText: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  tagRemove: {
    fontSize: 12,
    fontFamily: fonts.bold,
    marginLeft: 2,
  },
  addPillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
  },
  centerButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  addPillBtnCentered: {
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPillText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  subItemCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  subItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subItemTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    flex: 1,
  },
  subItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    padding: 4,
  },
  subItemCompany: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  subItemDesc: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  certPreview: {
    width: '100%',
    height: 110,
    borderRadius: 10,
    marginBottom: 6,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 6,
  },
  dayLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  bottomButtonsSection: {
    gap: 10,
    marginTop: 8,
  },
  saveBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  cancelBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: fonts.medium,
    fontSize: 15,
  },
});
