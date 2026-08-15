import { StyleSheet, TextInput, View } from 'react-native';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import { mapPinBold, searchBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import Select from '../../../components/Select';
import { useCities } from '../../../api/locationApi';
import { PRIORITIES } from '../data/jobs';

export default function JobsFilterBar({
  search,
  onSearch,
  city = null,
  onCity = _value => {},
  priority,
  onPriority,
  onClear,
  showCity = true,
  searchPlaceholder = 'Search by device or brand',
}) {
  const { colors } = useTheme();
  const { cities, loading } = useCities();

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {showCity && (
          <Select
            icon={mapPinBold}
            placeholder="Select City"
            value={city}
            options={cities}
            onChange={onCity}
            searchable
            loading={loading}
          />
        )}
        <Select placeholder="All priorities" value={priority} options={PRIORITIES} onChange={onPriority} />
      </View>

      <Button title="Clear Filter" variant="soft" size="sm" onPress={onClear} style={styles.clear} />

      <View style={[styles.search, { borderColor: colors.border }]}>
        <Icon source={searchBold} size={18} color={colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={onSearch}
          placeholder={searchPlaceholder}
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16, gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  clear: { alignSelf: 'flex-start', minWidth: 130 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 13, padding: 0 },
});
