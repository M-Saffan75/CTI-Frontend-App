import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Icon from '@/components/Icon';
import { checkCircleFilled } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { DeviceType, GRADE_DATA, GRADE_TABS } from '../data/gradeData';
import { useTranslation } from 'react-i18next';

const GRADE_LABEL: Record<string, string> = {
  Superb: 'customerMsg.grade.superb',
  Good: 'customerMsg.grade.good',
  Fair: 'customerMsg.grade.fair',
  'Best Value': 'customerMsg.grade.bestValue',
};

// Web's "Grade Explained" section (CategoryInfoSections.jsx), same tabs and text, no pictures
export default function GradeExplained({ deviceType }: { deviceType: DeviceType }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [active, setActive] = useState<string>('Superb');
  const grade = (GRADE_DATA[deviceType] || GRADE_DATA.phone)[active];
  if (!grade) return null;

  return (
    <View style={[styles.box, { backgroundColor: colors.surface }]}>
      <Text style={[styles.heading, { color: colors.text }]}>{t('customer.gradeExplained')}</Text>

      <View style={styles.tabs}>
        {GRADE_TABS.map(tab => {
          const on = tab === active;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActive(tab)}
              style={[
                styles.tab,
                { borderColor: on ? colors.primary : colors.border, backgroundColor: on ? colors.primary : colors.background },
              ]}>
              <Text style={[styles.tabText, { color: on ? '#FFFFFF' : colors.textMuted }]}>{t(GRADE_LABEL[tab])}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.overall, { borderColor: colors.primary + '55', backgroundColor: colors.primary + '12' }]}>
        <Text style={[styles.overallText, { color: colors.textMuted }]}>
          <Text style={[styles.overallLabel, { color: colors.primary }]}>{t('customer.overall')}</Text> – {grade.overall}
        </Text>
      </View>

      {grade.checks.map((check, i) => (
        <View key={`${check.label}-${i}`} style={styles.checkRow}>
          <Icon source={checkCircleFilled} size={16} color={colors.primary} />
          <Text style={[styles.checkText, { color: colors.textMuted }]}>
            <Text style={[styles.checkLabel, { color: colors.text }]}>{check.label}</Text> – {check.desc}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { marginHorizontal: 16, marginTop: 16, borderRadius: 20, padding: 16 },
  heading: { fontFamily: fonts.bold, fontSize: 18, marginBottom: 14 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5 },
  tabText: { fontFamily: fonts.bold, fontSize: 13 },
  overall: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14 },
  overallLabel: { fontFamily: fonts.bold },
  overallText: { fontFamily: fonts.regular, fontSize: 13 },
  checkRow: { flexDirection: 'row', gap: 8, marginBottom: 12, alignItems: 'flex-start' },
  checkText: { flex: 1, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },
  checkLabel: { fontFamily: fonts.bold, fontSize: 13 },
});
