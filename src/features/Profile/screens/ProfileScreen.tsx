import { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  bookmarkBold,
  calendarBold,
  checkCircleBold,
  clockBold,
  commentDotsBold,
  creditCardBold,
  dummyProfileExtra,
  envelopeBold,
  exclamationCircleBold,
  fileBold,
  infoCircleBold,
  mapPinBold,
  mobileBold,
  packageBold,
  penBold,
  phoneBold,
  settingsBold,
  shieldBold,
  starBold,
  toolExtra,
  trashBold,
  userBold,
} from '@/assets/icons';
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

const CATALOG_FILTER_TABS = ['All 1', 'Approved 0', 'Pending 1', 'Rejected 0'];

export default function ProfileScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<ProfileData>(INITIAL_PROFILE_DATA);
  const [activeCatalogFilter, setActiveCatalogFilter] = useState('All 1');

  // Modals state
  const [showEduModal, setShowEduModal] = useState(false);
  const [editingEdu, setEditingEdu] = useState<EducationItem | null>(null);

  const [showExpModal, setShowExpModal] = useState(false);
  const [editingExp, setEditingExp] = useState<ExperienceItem | null>(null);

  const [showCertModal, setShowCertModal] = useState(false);
  const [editingCert, setEditingCert] = useState<CertificateItem | null>(null);

  const handleDeleteEdu = (id: string) => {
    setProfile(prev => ({
      ...prev,
      education: (prev?.education || []).filter(e => e?.id !== id),
    }));
  };

  const handleDeleteExp = (id: string) => {
    setProfile(prev => ({
      ...prev,
      experience: (prev?.experience || []).filter(e => e?.id !== id),
    }));
  };

  const handleDeleteCert = (id: string) => {
    setProfile(prev => ({
      ...prev,
      certificates: (prev?.certificates || []).filter(c => c?.id !== id),
    }));
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}>
        {/* Top Cover Banner */}
        <View style={[styles.coverBanner, { backgroundColor: '#374151' }]}>
          {/* ATP Geometric Brand Artwork */}
          <View style={styles.atpArtContainer}>
            <View style={styles.atpStripes}>
              <View style={[styles.stripe, styles.stripe1]} />
              <View style={[styles.stripe, styles.stripe2]} />
              <View style={[styles.stripe, styles.stripe3]} />
            </View>
            <Text style={styles.atpText}>ATP</Text>
          </View>

          {/* Floating Back Button */}
          <Squeeze
            onPress={() => navigation?.goBack()}
            style={[styles.floatingBack, { top: insets.top + 8 }]}>
            <View style={[styles.backBtnCircle, { backgroundColor: colors.primary }]}>
              <Icon source={arrowLeftBold} size={18} color={colors.onPrimary} />
            </View>
          </Squeeze>

          {/* Floating Edit Button */}
          <Squeeze
            onPress={() =>
              navigation?.navigate('EditProfile', {
                profileData: profile,
                onSaveProfile: setProfile,
              })
            }
            style={[styles.floatingEdit, { top: insets.top + 8 }]}>
            <View style={[styles.editBtnCircle, { backgroundColor: colors.surface }]}>
              <Icon source={penBold} size={16} color={colors.primary} />
            </View>
          </Squeeze>
        </View>

        {/* Profile Avatar & Header Info */}
        <View style={styles.profileHeaderSection}>
          {/* Avatar with Edit Badge */}
          <View style={styles.avatarWrap}>
            <Image
              source={dummyProfileExtra}
              style={[styles.avatarImage, { borderColor: colors.surface }]}
            />
            <TouchableOpacity
              onPress={() =>
                navigation?.navigate('EditProfile', {
                  profileData: profile,
                  onSaveProfile: setProfile,
                })
              }
              style={[styles.avatarEditBadge, { backgroundColor: colors.primary }]}>
              <Icon source={penBold} size={12} color={colors.onPrimary} />
            </TouchableOpacity>
          </View>

          {/* Name */}
          <Text style={[styles.profileName, { color: colors.text }]}>{profile.name}</Text>

          {/* Sub Meta Row */}
          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Icon source={mapPinBold} size={14} color={colors.textMuted} />
              <Text style={[styles.metaBadgeText, { color: colors.textMuted }]}>
                {profile.city}
              </Text>
            </View>

            <View style={styles.metaBadge}>
              <Icon source={clockBold} size={14} color={colors.textMuted} />
              <Text style={[styles.metaBadgeText, { color: colors.textMuted }]}>
                {profile.experienceYears}
              </Text>
            </View>

            <View style={styles.metaBadge}>
              <Icon source={packageBold} size={14} color={colors.textMuted} />
              <Text style={[styles.metaBadgeText, { color: colors.textMuted }]}>
                {profile.jobsCompleted} Job Completed
              </Text>
            </View>
          </View>
        </View>

        {/* Complete Bank Details Alert Card */}
        {!profile.bankDetailsCompleted && (
          <FadeUp delay={30} duration={300}>
            <View
              style={[
                styles.alertCard,
                { backgroundColor: colors.surface, borderColor: '#F59E0B' },
              ]}>
              <View style={styles.alertContent}>
                <View style={styles.alertIconCircle}>
                  <Icon source={exclamationCircleBold} size={20} color="#F59E0B" />
                </View>
                <View style={styles.alertTextWrap}>
                  <Text style={[styles.alertTitle, { color: colors.text }]}>
                    Complete Your Bank Details
                  </Text>
                  <Text style={[styles.alertSubtitle, { color: colors.textMuted }]}>
                    Add your bank information to start receiving payments
                  </Text>
                </View>
              </View>

              <Squeeze
                onPress={() =>
                  navigation?.navigate('EditProfile', {
                    profileData: profile,
                    onSaveProfile: setProfile,
                  })
                }>
                <View style={[styles.alertActionBtn, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.alertActionText, { color: colors.onPrimary }]}>
                    ↗ Add Bank details
                  </Text>
                </View>
              </Squeeze>
            </View>
          </FadeUp>
        )}

        {/* Stats Row */}
        <FadeUp delay={60} duration={300}>
          <View style={styles.statsRow}>
            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <Icon source={starBold} size={18} color="#F59E0B" />
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Rating</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{profile.rating}</Text>
            </View>

            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <Icon source={packageBold} size={18} color={colors.primary} />
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Jobs Completed</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>N/A</Text>
            </View>

            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <Icon source={clockBold} size={18} color={colors.primary} />
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Hours</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>09:00 - 21:00</Text>
            </View>
          </View>
        </FadeUp>

        {/* 1. About me */}
        <FadeUp delay={90} duration={300}>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.sectionHeader}>
              <Icon source={infoCircleBold} size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>About me</Text>
            </View>
            <Text style={[styles.aboutText, { color: colors.textMuted }]}>{profile.aboutMe}</Text>
          </View>
        </FadeUp>

        {/* 2. Specialization */}
        <FadeUp delay={120} duration={300}>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.sectionHeader}>
              <Icon source={starBold} size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Specialization</Text>
            </View>
            <View style={styles.specializationPillsRow}>
              {(profile?.specialization || []).map(item => (
                <View
                  key={item}
                  style={[
                    styles.specializationPill,
                    { borderColor: colors.primary, backgroundColor: colors.primary + '12' },
                  ]}>
                  <Text style={[styles.specializationPillText, { color: colors.primary }]}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </FadeUp>

        {/* 3. Working Hours */}
        <FadeUp delay={150} duration={300}>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.sectionHeader}>
              <Icon source={clockBold} size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Working Hours</Text>
            </View>

            <Text style={[styles.subLabel, { color: colors.primary }]}>Business Hours</Text>
            <Text style={[styles.workingHoursText, { color: colors.text }]}>
              {profile.workingHours}
            </Text>

            <Text style={[styles.subLabel, { color: colors.primary, marginTop: 10 }]}>
              Working Days
            </Text>
            <View style={styles.workingDaysRow}>
              {(profile?.workingDays || []).map(day => (
                <View
                  key={day}
                  style={[
                    styles.dayPill,
                    { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                  ]}>
                  <Text style={[styles.dayPillText, { color: colors.text }]}>{day}</Text>
                </View>
              ))}
            </View>
          </View>
        </FadeUp>

        {/* 4. Service Catalog Preview */}
        <FadeUp delay={180} duration={300}>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.sectionHeader}>
              <Icon source={toolExtra} size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Service Catalog</Text>
            </View>

            {/* Filter Pills */}
            <View style={styles.catalogFilterRow}>
              {CATALOG_FILTER_TABS.map(tab => {
                const isActive = activeCatalogFilter === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveCatalogFilter(tab)}
                    style={[
                      styles.catalogTabPill,
                      {
                        backgroundColor: isActive ? colors.primary : colors.surfaceAlt,
                        borderColor: isActive ? colors.primary : colors.border,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.catalogTabPillText,
                        { color: isActive ? colors.onPrimary : colors.textMuted },
                        isActive && { fontFamily: fonts.bold },
                      ]}>
                      {tab}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Catalog Item Preview Card */}
            <View
              style={[
                styles.catalogPreviewBox,
                { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
              ]}>
              {/* Top Graphic Box */}
              <View
                style={[
                  styles.previewGraphic,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                <Icon source={mobileBold} size={36} color={colors.primary} />
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>• Pending</Text>
                </View>
              </View>

              <View style={styles.catalogPreviewDetails}>
                <View style={styles.catalogTitleRow}>
                  <View>
                    <Text style={[styles.catalogItemTitle, { color: colors.text }]}>S23 ULTRA</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Icon source={mobileBold} size={13} color={colors.textMuted} />
                      <Text style={[styles.catalogItemSubtitle, { color: colors.textMuted }]}>
                        SAMSUNG $23 ultra
                      </Text>
                    </View>
                    <Text style={[styles.catalogItemCategory, { color: colors.textMuted }]}>
                      Best Repairman
                    </Text>
                  </View>
                  <Text style={[styles.catalogItemPrice, { color: colors.text }]}>TRY 700</Text>
                </View>

                {/* Sub details */}
                <View style={styles.catalogMetaRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Icon source={creditCardBold} size={13} color={colors.textMuted} />
                    <Text style={[styles.catalogMetaText, { color: colors.textMuted }]}>
                      Base: TRY 200
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Icon source={creditCardBold} size={13} color={colors.textMuted} />
                    <Text style={[styles.catalogMetaText, { color: colors.textMuted }]}>
                      Parts: TRY 500
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Icon source={calendarBold} size={13} color={colors.textMuted} />
                    <Text style={[styles.catalogMetaText, { color: colors.textMuted }]}>
                      30 Jun, 2026
                    </Text>
                  </View>
                </View>

                {/* View All Services Button */}
                <Squeeze onPress={() => navigation?.navigate('ServiceCatalog')}>
                  <View
                    style={[
                      styles.viewAllCatalogBtn,
                      { borderColor: colors.border, backgroundColor: colors.surface },
                    ]}>
                    <Text style={[styles.viewAllCatalogText, { color: colors.text }]}>
                      View all services →
                    </Text>
                  </View>
                </Squeeze>
              </View>
            </View>
          </View>
        </FadeUp>

        {/* 5. Education */}
        <FadeUp delay={210} duration={300}>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.sectionHeaderWithAction}>
              <View style={styles.sectionHeaderLeft}>
                <Icon source={bookmarkBold} size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Education</Text>
              </View>

              <Squeeze
                onPress={() => {
                  setEditingEdu(null);
                  setShowEduModal(true);
                }}>
                <View style={[styles.addPillBtn, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.addPillText, { color: colors.onPrimary }]}>
                    + Add Education
                  </Text>
                </View>
              </Squeeze>
            </View>

            {(profile?.education || []).map(item => (
              <View
                key={item.id}
                style={[
                  styles.itemCard,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}>
                <Text style={[styles.itemCardTitle, { color: colors.text }]}>{item.degree}</Text>
                <Text style={[styles.itemCardSub, { color: colors.primary }]}>
                  {item.institution}
                </Text>
                <Text style={[styles.itemCardDesc, { color: colors.textMuted }]}>
                  {item.description}
                </Text>

                <View style={styles.itemBottomRow}>
                  <View style={[styles.certTagBox, { borderColor: colors.border }]}>
                    <Text style={[styles.certTagText, { color: colors.textMuted }]}>
                      Education certificate
                    </Text>
                  </View>

                  <View style={styles.itemActionsRight}>
                    <View
                      style={[
                        styles.yearPill,
                        { backgroundColor: colors.primary + '18', borderColor: colors.primary },
                      ]}>
                      <Text style={[styles.yearPillText, { color: colors.primary }]}>
                        {item.startYear}-{item.endYear}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => {
                        setEditingEdu(item);
                        setShowEduModal(true);
                      }}
                      style={styles.actionBtn}>
                      <Icon source={penBold} size={15} color={colors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeleteEdu(item.id)}
                      style={styles.actionBtn}>
                      <Icon source={trashBold} size={15} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </FadeUp>

        {/* 6. Experience */}
        <FadeUp delay={240} duration={300}>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.sectionHeaderWithAction}>
              <View style={styles.sectionHeaderLeft}>
                <Icon source={packageBold} size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Experience</Text>
              </View>

              <Squeeze
                onPress={() => {
                  setEditingExp(null);
                  setShowExpModal(true);
                }}>
                <View style={[styles.addPillBtn, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.addPillText, { color: colors.onPrimary }]}>
                    + Add Experience
                  </Text>
                </View>
              </Squeeze>
            </View>

            {(profile?.experience || []).map(item => (
              <View
                key={item.id}
                style={[
                  styles.itemCard,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}>
                <Text style={[styles.itemCardTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.itemCardSub, { color: colors.primary }]}>
                  {item.company}
                </Text>
                <Text style={[styles.itemCardDesc, { color: colors.textMuted }]}>
                  {item.description}
                </Text>

                <View style={styles.itemBottomRow}>
                  <View style={[styles.certTagBox, { borderColor: colors.border }]}>
                    <Text style={[styles.certTagText, { color: colors.textMuted }]}>
                      Experience certificate
                    </Text>
                  </View>

                  <View style={styles.itemActionsRight}>
                    <View
                      style={[
                        styles.yearPill,
                        { backgroundColor: colors.primary + '18', borderColor: colors.primary },
                      ]}>
                      <Text style={[styles.yearPillText, { color: colors.primary }]}>
                        {item.startYear}-{item.endYear}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => {
                        setEditingExp(item);
                        setShowExpModal(true);
                      }}
                      style={styles.actionBtn}>
                      <Icon source={penBold} size={15} color={colors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeleteExp(item.id)}
                      style={styles.actionBtn}>
                      <Icon source={trashBold} size={15} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </FadeUp>

        {/* 7. Certifications & Licenses */}
        <FadeUp delay={270} duration={300}>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.sectionHeader}>
              <Icon source={fileBold} size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
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
                  <Text style={[styles.addPillText, { color: colors.onPrimary }]}>
                    + Add Certificate
                  </Text>
                </View>
              </Squeeze>
            </View>

            {(profile?.certificates || []).map(item => (
              <View
                key={item.id}
                style={[
                  styles.certCard,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}>
                {item.imageUri && (
                  <Image source={{ uri: item.imageUri }} style={styles.certPhoto} />
                )}
                <Text style={[styles.certCardTitle, { color: colors.text }]}>{item.title}</Text>

                <View style={styles.certButtonsRow}>
                  <Squeeze
                    onPress={() => {
                      setEditingCert(item);
                      setShowCertModal(true);
                    }}>
                    <View style={[styles.certEditBtn, { backgroundColor: colors.primary }]}>
                      <Icon source={penBold} size={14} color={colors.onPrimary} />
                      <Text style={[styles.certEditBtnText, { color: colors.onPrimary }]}>
                        Edit
                      </Text>
                    </View>
                  </Squeeze>

                  <Squeeze onPress={() => handleDeleteCert(item.id)}>
                    <View
                      style={[
                        styles.certDeleteBtn,
                        { borderColor: colors.error, backgroundColor: colors.surface },
                      ]}>
                      <Icon source={trashBold} size={14} color={colors.error} />
                      <Text style={[styles.certDeleteBtnText, { color: colors.error }]}>
                        Delete
                      </Text>
                    </View>
                  </Squeeze>
                </View>
              </View>
            ))}
          </View>
        </FadeUp>

        {/* 8. Contact Info */}
        <FadeUp delay={300} duration={300}>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.sectionHeader}>
              <Icon source={phoneBold} size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Info</Text>
            </View>

            <View style={styles.contactItem}>
              <Icon source={phoneBold} size={18} color={colors.primary} />
              <View style={styles.contactItemDetails}>
                <Text style={[styles.contactLabel, { color: colors.textMuted }]}>Phone</Text>
                <Text style={[styles.contactVal, { color: colors.text }]}>{profile.phone}</Text>
              </View>
            </View>

            <View style={styles.contactItem}>
              <Icon source={envelopeBold} size={18} color={colors.primary} />
              <View style={styles.contactItemDetails}>
                <Text style={[styles.contactLabel, { color: colors.textMuted }]}>Email</Text>
                <Text style={[styles.contactVal, { color: colors.text }]}>{profile.email}</Text>
              </View>
            </View>

            <View style={styles.contactItem}>
              <Icon source={commentDotsBold} size={18} color={colors.primary} />
              <View style={styles.contactItemDetails}>
                <Text style={[styles.contactLabel, { color: colors.textMuted }]}>WhatsApp</Text>
                <Text style={[styles.contactVal, { color: colors.text }]}>{profile.whatsapp}</Text>
              </View>
            </View>
          </View>
        </FadeUp>

        {/* 9. Location */}
        <FadeUp delay={330} duration={300}>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.sectionHeader}>
              <Icon source={mapPinBold} size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Location</Text>
            </View>

            <View style={[styles.infoBox, { backgroundColor: colors.primary + '10' }]}>
              <Text style={[styles.infoBoxLabel, { color: colors.primary }]}>Full Adress</Text>
              <Text style={[styles.infoBoxVal, { color: colors.text }]}>{profile.address}</Text>
            </View>

            <View style={[styles.infoBox, { backgroundColor: colors.surfaceAlt, marginTop: 8 }]}>
              <Text style={[styles.infoBoxLabel, { color: colors.textMuted }]}>Zip Code</Text>
              <Text style={[styles.infoBoxVal, { color: colors.text }]}>{profile.zipCode}</Text>
            </View>
          </View>
        </FadeUp>

        {/* 10. Emergency Contact */}
        <FadeUp delay={360} duration={300}>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.sectionHeader}>
              <Icon source={phoneBold} size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Emergency Contact</Text>
            </View>

            <View style={[styles.infoBoxWithIcon, { backgroundColor: colors.surfaceAlt }]}>
              <Icon source={userBold} size={18} color={colors.primary} />
              <View>
                <Text style={[styles.infoBoxLabel, { color: colors.textMuted }]}>
                  Contact Person
                </Text>
                <Text style={[styles.infoBoxVal, { color: colors.text }]}>
                  {profile.emergencyPerson}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.infoBoxWithIcon,
                { backgroundColor: colors.surfaceAlt, marginTop: 8 },
              ]}>
              <Icon source={phoneBold} size={18} color={colors.primary} />
              <View>
                <Text style={[styles.infoBoxLabel, { color: colors.textMuted }]}>
                  Contact Number
                </Text>
                <Text style={[styles.infoBoxVal, { color: colors.text }]}>
                  {profile.emergencyPhone}
                </Text>
              </View>
            </View>
          </View>
        </FadeUp>

        {/* 11. Services */}
        <FadeUp delay={390} duration={300}>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.sectionHeader}>
              <Icon source={toolExtra} size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Services</Text>
            </View>

            <View style={styles.servicesRow}>
              <Text style={[styles.serviceRowTitle, { color: colors.text }]}>Pickup Service</Text>
              <View style={[styles.availableBadge, { backgroundColor: '#10B98120' }]}>
                <Text style={[styles.availableBadgeText, { color: '#10B981' }]}>Available</Text>
              </View>
            </View>
          </View>
        </FadeUp>

        {/* 12. Account Information */}
        <FadeUp delay={420} duration={300}>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <View style={styles.sectionHeader}>
              <Icon source={settingsBold} size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Information</Text>
            </View>

            <View style={styles.accountRow}>
              <Text style={[styles.accountLabel, { color: colors.textMuted }]}>Member Since</Text>
              <Text style={[styles.accountVal, { color: colors.text }]}>
                {profile.memberSince}
              </Text>
            </View>

            <View style={styles.accountRow}>
              <Text style={[styles.accountLabel, { color: colors.textMuted }]}>Last Update</Text>
              <Text style={[styles.accountVal, { color: colors.text }]}>{profile.lastUpdate}</Text>
            </View>

            <View style={styles.verificationPillsRow}>
              <View style={[styles.verifyPill, { backgroundColor: '#10B98120', borderColor: '#10B981', borderWidth: 1 }]}>
                <Icon source={checkCircleBold} size={13} color="#10B981" />
                <Text style={[styles.verifyPillText, { color: '#10B981' }]}>Email Verified</Text>
              </View>

              <View
                style={[
                  styles.verifyPill,
                  { backgroundColor: colors.primary + '20', borderColor: colors.primary, borderWidth: 1 },
                ]}>
                <Icon source={checkCircleBold} size={13} color={colors.primary} />
                <Text style={[styles.verifyPillText, { color: colors.primary }]}>
                  Profile Completed
                </Text>
              </View>
            </View>
          </View>
        </FadeUp>
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { gap: 14 },
  coverBanner: {
    height: 180,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  atpArtContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    opacity: 0.85,
  },
  atpStripes: {
    gap: 6,
    transform: [{ rotate: '-45deg' }],
  },
  stripe: {
    width: 60,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#65A30D',
  },
  stripe1: { width: 50 },
  stripe2: { width: 70 },
  stripe3: { width: 60 },
  atpText: {
    fontFamily: fonts.bold,
    fontSize: 52,
    color: '#1F2937',
    letterSpacing: 2,
  },
  floatingBack: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
  backBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingEdit: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
  },
  editBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  profileHeaderSection: {
    alignItems: 'center',
    marginTop: -50,
    paddingHorizontal: 16,
    gap: 6,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileName: {
    fontFamily: fonts.bold,
    fontSize: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaBadgeText: {
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  alertCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  alertContent: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  alertIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTextWrap: {
    flex: 1,
    gap: 2,
  },
  alertTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  alertSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  alertActionBtn: {
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
  },
  alertActionText: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    textAlign: 'center',
  },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: 13,
    textAlign: 'center',
  },
  sectionCard: {
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionHeaderWithAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  aboutText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  specializationPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specializationPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  specializationPillText: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  subLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  workingHoursText: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  workingDaysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  dayPillText: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  catalogFilterRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  catalogTabPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  catalogTabPillText: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  catalogPreviewBox: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  previewGraphic: {
    height: 120,
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pendingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pendingBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: '#D97706',
  },
  catalogPreviewDetails: {
    padding: 14,
    gap: 10,
  },
  catalogTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  catalogItemTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  catalogItemSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 12,
    marginTop: 2,
  },
  catalogItemCategory: {
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 1,
  },
  catalogItemPrice: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  catalogMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  catalogMetaText: {
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  viewAllCatalogBtn: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  viewAllCatalogText: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  addPillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
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
  itemCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  itemCardTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  itemCardSub: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  itemCardDesc: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  itemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  certTagBox: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  certTagText: {
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  itemActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  yearPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  yearPillText: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  actionBtn: {
    padding: 4,
  },
  certCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  certPhoto: {
    width: '100%',
    height: 120,
    borderRadius: 10,
  },
  certCardTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  certButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  certEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  certEditBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  certDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  certDeleteBtnText: {
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactItemDetails: {
    gap: 2,
  },
  contactLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  contactVal: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  infoBox: {
    borderRadius: 12,
    padding: 12,
    gap: 2,
  },
  infoBoxLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  infoBoxVal: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  infoBoxWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    padding: 12,
  },
  servicesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceRowTitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  availableBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availableBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  accountVal: {
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  verificationPillsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  verifyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  verifyPillText: {
    fontFamily: fonts.bold,
    fontSize: 12,
  },
});
