import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { SellerOption } from '@/roles/Seller/services/sellerApi';
import { useTranslation } from 'react-i18next';

interface Props {
  visible: boolean;
  title: string;
  options: SellerOption[];
  selectedId?: string;
  clearLabel?: string;
  emptyText?: string;
  error?: string;
  onRetry?: () => void;
  onSelect: (option: SellerOption | null) => void;
  onClose: () => void;
}

export default function OptionPickerModal({
  visible,
  title,
  options,
  selectedId,
  clearLabel,
  emptyText,
  error,
  onRetry,
  onSelect,
  onClose,
}: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              paddingBottom: insets.bottom + 12,
            },
          ]}
          onPress={() => {}}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

          <FlatList
            data={options}
            keyExtractor={item => item.id}
            style={styles.list}
            ListHeaderComponent={
              clearLabel ? (
                <Pressable
                  onPress={() => onSelect(null)}
                  style={[styles.row, { borderColor: colors.border }]}>
                  <Text
                    style={[
                      styles.rowText,
                      { color: !selectedId ? colors.primary : colors.text },
                    ]}>
                    {clearLabel}
                  </Text>
                </Pressable>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={[styles.rowText, { color: error ? colors.error : colors.textMuted }]}>
                  {error || emptyText || t('seller.noOptions')}
                </Text>
                {error && onRetry ? <Button title={t('common.tryAgain')} size="sm" variant="outline" onPress={onRetry} /> : null}
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onSelect(item)}
                style={[styles.row, { borderColor: colors.border }]}>
                <Text
                  style={[
                    styles.rowText,
                    { color: item.id === selectedId ? colors.primary : colors.text },
                  ]}
                  numberOfLines={1}>
                  {item.name}
                </Text>
              </Pressable>
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  title: { fontFamily: fonts.bold, fontSize: 17, marginBottom: 8 },
  list: { flexGrow: 0 },
  row: { paddingVertical: 14, borderBottomWidth: 1 },
  rowText: { fontFamily: fonts.medium, fontSize: 14 },
  empty: { paddingVertical: 24, alignItems: 'center' },
});
