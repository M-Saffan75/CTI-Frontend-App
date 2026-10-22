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
import { closeIcon, fileBold, uploadBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { CertificateItem } from '../data/profileData';

interface Props {
  visible: boolean;
  itemToEdit?: CertificateItem | null;
  onClose: () => void;
  onSave: (item: CertificateItem) => void;
}

export default function AddCertificateModal({ visible, itemToEdit, onClose, onSave }: Props) {
  const { colors } = useTheme();
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (itemToEdit) {
      setTitle(itemToEdit.title);
    } else {
      setTitle('');
    }
  }, [itemToEdit, visible]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave({
      id: itemToEdit?.id || `cert-${Date.now()}`,
      title: title.trim(),
      imageUri:
        itemToEdit?.imageUri ||
        'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
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
                <Icon source={fileBold} size={24} color={colors.primary} />
              </View>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Icon source={closeIcon} size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {itemToEdit ? 'Edit Certificate/License' : 'Add Certificate/License'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
              {/* Certificate / License Title */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>
                  Certificate / License Title
                </Text>
                <TextInput
                  placeholder="e.g. B.A Diploma or Certified Technician"
                  placeholderTextColor={colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                  style={[
                    styles.input,
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
                      {itemToEdit ? 'Save Changes' : 'Add Certificate'}
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
    maxHeight: '85%',
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
    gap: 14,
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
