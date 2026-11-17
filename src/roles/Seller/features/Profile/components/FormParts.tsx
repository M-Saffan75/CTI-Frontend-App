import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardTypeOptions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import Icon from '@/components/Icon';
import { chevronDownBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useTranslation } from 'react-i18next';

interface FieldProps {
  label: string;
  icon: number;
  value: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  helper?: string;
  multiline?: boolean;
  maxLength?: number;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  brandIcon?: boolean;
}

export function Field({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  required,
  readOnly,
  helper,
  multiline,
  maxLength,
  keyboardType,
  autoCapitalize,
  brandIcon,
}: FieldProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.group}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
          {required ? <Text style={{ color: colors.error }}> *</Text> : null}
        </Text>
        {readOnly ? <Text style={[styles.helper, { color: colors.textMuted }]}>{t('profile.readOnly')}</Text> : null}
      </View>
      <View
        style={[
          styles.box,
          multiline && styles.boxMultiline,
          readOnly && styles.dim,
          { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
        ]}>
        <Icon source={icon} size={16} color={brandIcon ? null : colors.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          editable={!readOnly}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          multiline={multiline}
          maxLength={maxLength}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={[styles.input, multiline && styles.inputMultiline, { color: readOnly ? colors.textMuted : colors.text }]}
        />
      </View>
      {helper ? <Text style={[styles.helper, { color: colors.textMuted }]}>{helper}</Text> : null}
    </View>
  );
}

interface Option {
  _id: string;
  name: string;
}

interface PickerProps {
  label: string;
  icon: number;
  selectedId: string;
  selectedName: string;
  options: Option[];
  loading?: boolean;
  disabled?: boolean;
  placeholder: string;
  emptyText: string;
  onSelect: (option: Option) => void;
}

export function PickerField({
  label,
  icon,
  selectedId,
  selectedName,
  options,
  loading,
  disabled,
  placeholder,
  emptyText,
  onSelect,
}: PickerProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.group}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TouchableOpacity
        disabled={disabled}
        onPress={() => setOpen(!open)}
        style={[
          styles.box,
          disabled && styles.dimMore,
          { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
        ]}>
        <Icon source={icon} size={16} color={colors.textMuted} />
        <Text
          numberOfLines={1}
          style={[styles.picked, { color: selectedName ? colors.text : colors.textMuted }]}>
          {selectedName || placeholder}
        </Text>
        <Icon source={chevronDownBold} size={14} color={colors.textMuted} />
      </TouchableOpacity>

      {open && (
        <View style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {loading ? (
            <View style={styles.listRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.optionText, { color: colors.textMuted }]}>{t('common.loading')}</Text>
            </View>
          ) : options.length === 0 ? (
            <Text style={[styles.optionText, styles.listRow, { color: colors.textMuted }]}>{emptyText}</Text>
          ) : (
            <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={styles.optionsScroll}>
              {options.slice(0, 200).map(option => {
                const selected = option._id === selectedId;
                return (
                  <TouchableOpacity
                    key={option._id}
                    onPress={() => {
                      onSelect(option);
                      setOpen(false);
                    }}
                    style={[styles.option, selected && { backgroundColor: colors.primary + '14' }]}>
                    <Text
                      style={[
                        styles.optionText,
                        { color: selected ? colors.primary : colors.text },
                        selected && { fontFamily: fonts.bold },
                      ]}>
                      {option.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontFamily: fonts.medium, fontSize: 13 },
  helper: { fontFamily: fonts.regular, fontSize: 11 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  dim: { opacity: 0.75 },
  dimMore: { opacity: 0.6 },
  boxMultiline: { alignItems: 'flex-start', paddingTop: 14 },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 14, paddingVertical: 0 },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top', paddingBottom: 10 },
  picked: { flex: 1, fontFamily: fonts.regular, fontSize: 14 },
  list: { borderWidth: 1, borderRadius: 12, marginTop: 4, overflow: 'hidden' },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  optionsScroll: { maxHeight: 180 },
  option: { paddingHorizontal: 14, paddingVertical: 10 },
  optionText: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 13 },
});
