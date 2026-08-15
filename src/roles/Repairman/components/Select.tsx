import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import Icon from '@/components/Icon';
import { chevronDownBold, closeIcon, searchBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

/**
 * A tap-to-open picker for a flat list of string options. Used for city,
 * priority, status and category dropdowns across the Repairman screens —
 * one component instead of five near-identical ones.
 */
export default function Select({
  icon = null,
  placeholder = 'Select',
  value,
  options,
  onChange,
  searchable = false,
  loading = false,
  style = null,
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = searchable
    ? options.filter(option => option.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  const select = option => {
    onChange(option);
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.field, { borderColor: colors.border, backgroundColor: colors.surface }, style]}>
        {icon && <Icon source={icon} size={16} color={colors.textMuted} />}
        <Text
          style={[styles.fieldText, { color: value ? colors.text : colors.textMuted }]}
          numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Icon source={chevronDownBold} size={14} color={colors.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView style={styles.avoiding} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={[styles.backdrop, { backgroundColor: colors.backdrop }]} onPress={() => setOpen(false)}>
            <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
              <View style={styles.sheetHead}>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>{placeholder}</Text>
                <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                  <Icon source={closeIcon} size={16} color={colors.textMuted} />
                </Pressable>
              </View>

              {searchable && (
                <View style={[styles.search, { borderColor: colors.border }]}>
                  <Icon source={searchBold} size={16} color={colors.textMuted} />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search..."
                    placeholderTextColor={colors.textMuted}
                    style={[styles.searchInput, { color: colors.text }]}
                  />
                </View>
              )}

              <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
                {loading && (
                  <Text style={[styles.empty, { color: colors.textMuted }]}>Loading...</Text>
                )}
                {!loading && filtered.length === 0 && (
                  <Text style={[styles.empty, { color: colors.textMuted }]}>No results</Text>
                )}
                {filtered.map(option => (
                  <Pressable
                    key={option}
                    onPress={() => select(option)}
                    style={[styles.option, option === value && { backgroundColor: colors.surfaceAlt }]}>
                    <Text
                      style={[
                        styles.optionText,
                        { color: option === value ? colors.primary : colors.text },
                      ]}>
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  fieldText: { flex: 1, fontFamily: fonts.regular, fontSize: 13 },

  avoiding: { flex: 1 },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { maxHeight: '70%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18 },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitle: { fontFamily: fonts.bold, fontSize: 16 },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    marginTop: 14,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 14, padding: 0 },

  list: { marginTop: 10 },
  option: { paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8 },
  optionText: { fontFamily: fonts.regular, fontSize: 14 },
  empty: { textAlign: 'center', fontFamily: fonts.regular, fontSize: 13, paddingVertical: 20 },
});
