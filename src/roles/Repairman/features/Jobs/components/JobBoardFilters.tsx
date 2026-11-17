import { StyleSheet, Text, TextInput, View } from 'react-native';

import Button from '@/components/Button';
import Icon from '@/components/Icon';
import { mapBold, mapPinBold, searchBold, slidersHBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import Select from '../../../components/Select';
import { PRIORITY_OPTIONS } from '../utils/jobBoard';
import { useTranslation } from 'react-i18next';

interface Props {
  search: string;
  onSearch: (text: string) => void;
  stateName: string | null;
  stateOptions: string[];
  onState: (name: string) => void;
  cityName: string | null;
  cityOptions: string[];
  citiesLoading: boolean;
  onCity: (name: string) => void;
  priorityLabel: string | null;
  onPriority: (label: string) => void;
  onClear: () => void;
  hasFilters: boolean;
}

// The web job board filters: search, state, city and priority
export default function JobBoardFilters({
  search,
  onSearch,
  stateName,
  stateOptions,
  onState,
  cityName,
  cityOptions,
  citiesLoading,
  onCity,
  priorityLabel,
  onPriority,
  onClear,
  hasFilters,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      <View style={[styles.search, { borderColor: colors.border }]}>
        <Icon source={searchBold} size={18} color={colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={onSearch}
          placeholder={t('repairman.searchByDeviceBrandOr')}
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text }]}
          returnKeyType="search"
        />
      </View>

      <View style={styles.row}>
        <Select
          icon={mapBold}
          placeholder={t('repairman.selectState')}
          value={stateName}
          options={stateOptions}
          onChange={onState}
          searchable
        />
        <Select
          icon={mapPinBold}
          placeholder={stateName ? t('repairman.selectCity') : t('repairman.pickAStateFirst')}
          value={cityName}
          options={cityOptions}
          onChange={onCity}
          searchable
          loading={citiesLoading}
        />
      </View>
      <Select
        icon={slidersHBold}
        placeholder={t('repairman.allPriorities')}
        value={priorityLabel}
        options={PRIORITY_OPTIONS.map(option => option.label)}
        onChange={onPriority}
      />

      {hasFilters ? (
        <Button
          title={t('repairman.clearFilter')}
          variant="soft"
          size="sm"
          onPress={onClear}
          style={styles.clear}
        />
      ) : (
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          {t('repairman.withoutAStateOrCity')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16, gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  clear: { alignSelf: 'flex-start', minWidth: 130 },
  hint: { fontFamily: fonts.regular, fontSize: 11 },
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
