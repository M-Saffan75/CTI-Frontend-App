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
import { bookmarkBold, closeIcon, uploadBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { EducationItem } from '../data/profileData';

interface Props {
  visible: boolean;
  itemToEdit?: EducationItem | null;
  onClose: () => void;
  onSave: (item: EducationItem) => void;
}

export default function AddEducationModal({ visible, itemToEdit, onClose, onSave }: Props) {
  const { colors } = useTheme();

  const [degree, setDegree] = useState('');
  const [institution, setInstitution] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (itemToEdit) {
      setDegree(itemToEdit.degree);
      setInstitution(itemToEdit.institution);
      setStartYear(itemToEdit.startYear);
      setEndYear(itemToEdit.endYear);
      setDescription(itemToEdit.description);
    } else {
      setDegree('');
      setInstitution('');
      setStartYear('');
      setEndYear('');
      setDescription('');
    }
  }, [itemToEdit, visible]);

  const handleSubmit = () => {
    if (!degree.trim() || !institution.trim()) return;
    onSave({
      id: itemToEdit?.id || `edu-${Date.now()}`,
      degree: degree.trim(),
      institution: institution.trim(),
      startYear: startYear.trim() || '2018',
      endYear: endYear.trim() || '2022',
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
                <Icon source={bookmarkBold} size={24} color={colors.primary} />
              </View>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Icon source={closeIcon} size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {itemToEdit ? 'Edit Education' : 'Add Education'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
              {/* Degree / Title */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Degree / Title</Text>
                <TextInput
                  placeholder="BS Software Engineering"
                  placeholderTextColor={colors.textMuted}
                  value={degree}
                  onChangeText={setDegree}
                  style={[
                    styles.input,
                    { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                  ]}
                />
              </View>

              {/* Institution */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Institution</Text>
                <TextInput
                  placeholder="University of Karachi"
                  placeholderTextColor={colors.textMuted}
                  value={institution}
                  onChangeText={setInstitution}
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
                    placeholder="2018"
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
                    placeholder="2022"
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
                  placeholder="I successfully completed my degree in Software Engineering"
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
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Certificate Image</Text>
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
                      {itemToEdit ? 'Save Changes' : 'Add Education'}
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
