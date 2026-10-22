import { useEffect, useState } from 'react';
import {
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

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { closeIcon, packageBold, uploadBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { ExperienceItem } from '../data/profileData';

interface Props {
  visible: boolean;
  itemToEdit?: ExperienceItem | null;
  onClose: () => void;
  onSave: (item: ExperienceItem) => void;
}

export default function AddExperienceModal({ visible, itemToEdit, onClose, onSave }: Props) {
  const { colors } = useTheme();

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (itemToEdit) {
      setTitle(itemToEdit.title);
      setCompany(itemToEdit.company);
      setStartYear(itemToEdit.startYear);
      setEndYear(itemToEdit.endYear);
      setDescription(itemToEdit.description);
    } else {
      setTitle('');
      setCompany('');
      setStartYear('');
      setEndYear('');
      setDescription('');
    }
  }, [itemToEdit, visible]);

  const handleSubmit = () => {
    if (!title.trim() || !company.trim()) return;
    onSave({
      id: itemToEdit?.id || `exp-${Date.now()}`,
      title: title.trim(),
      company: company.trim(),
      startYear: startYear.trim() || '2024',
      endYear: endYear.trim() || '2025',
      description: description.trim(),
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrap}>
          <Pressable
            style={[styles.modalCard, { backgroundColor: colors.surface }]}
            onPress={e => e.stopPropagation()}>
            {/* Top Close Button & Icon Badge */}
            <View style={styles.header}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + '18' }]}>
                <Icon source={packageBold} size={24} color={colors.primary} />
              </View>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Icon source={closeIcon} size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {itemToEdit ? 'Edit Experience' : 'Add Experience'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
              {/* Job Title */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Job Title / Role</Text>
                <TextInput
                  placeholder="Mobile Repair Specialist"
                  placeholderTextColor={colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                  style={[
                    styles.input,
                    { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                  ]}
                />
              </View>

              {/* Company */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Company / Workplace</Text>
                <TextInput
                  placeholder="Click To Integrate"
                  placeholderTextColor={colors.textMuted}
                  value={company}
                  onChangeText={setCompany}
                  style={[
                    styles.input,
                    { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                  ]}
                />
              </View>

              {/* Years Row */}
              <View style={styles.yearsRow}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={[styles.fieldLabel, { color: colors.text }]}>Start Year</Text>
                  <TextInput
                    placeholder="2024"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={startYear}
                    onChangeText={setStartYear}
                    style={[
                      styles.input,
                      { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                    ]}
                  />
                </View>

                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={[styles.fieldLabel, { color: colors.text }]}>End Year</Text>
                  <TextInput
                    placeholder="2025"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={endYear}
                    onChangeText={setEndYear}
                    style={[
                      styles.input,
                      { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                    ]}
                  />
                </View>
              </View>

              {/* Description */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Description</Text>
                <TextInput
                  placeholder="Describe your role and accomplishments"
                  placeholderTextColor={colors.textMuted}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  style={[
                    styles.textArea,
                    { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                  ]}
                />
              </View>

              {/* Upload Certificate Image Box */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Experience Document / Proof</Text>
                <TouchableOpacity
                  style={[styles.uploadBox, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}>
                  <Icon source={uploadBold} size={20} color={colors.textMuted} />
                  <Text style={[styles.uploadText, { color: colors.textMuted }]}>Upload Image</Text>
                </TouchableOpacity>
                <Text style={[styles.uploadHint, { color: colors.textMuted }]}>JPG, PNG max 5MB</Text>
              </View>

              {/* Buttons */}
              <View style={styles.buttonsRow}>
                <Squeeze onPress={handleSubmit} style={{ flex: 1 }}>
                  <View style={[styles.primaryBtn, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.primaryBtnText, { color: colors.onPrimary }]}>
                      {itemToEdit ? 'Save Changes' : 'Add Experience'}
                    </Text>
                  </View>
                </Squeeze>

                <Squeeze onPress={onClose} style={{ flex: 1 }}>
                  <View
                    style={[
                      styles.cancelBtn,
                      { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                    ]}>
                    <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
                  </View>
                </Squeeze>
              </View>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  keyboardWrap: {
    justifyContent: 'center',
  },
  modalCard: {
    borderRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    alignItems: 'center',
    position: 'relative',
    marginBottom: 10,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  form: {
    gap: 12,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  yearsRow: {
    flexDirection: 'row',
    gap: 12,
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
  uploadBox: {
    height: 52,
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
    fontSize: 14,
  },
  uploadHint: {
    fontFamily: fonts.regular,
    fontSize: 11,
    marginTop: 2,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  primaryBtn: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  cancelBtn: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: fonts.medium,
    fontSize: 14,
  },
});
