import { useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import {
  folderBold,
  inboxBold,
  palmHandIcon,
  starBold,
  tagBold,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import i18n from '@/i18n';
import { useTranslation } from 'react-i18next';

// Dashboard is not here on purpose — it's its own bottom-tab screen now.
// These tabs live inside the Jobs screen and start at the jobs board.
export const TABS = [
  { key: 'JobBoard', get label() { return i18n.t('repairman.jobsboard'); }, icon: inboxBold },
  { key: 'MyOffers', get label() { return i18n.t('repairman.myOffers'); }, icon: palmHandIcon },
  { key: 'MyJobs', get label() { return i18n.t('repairman.myJobs'); }, icon: folderBold },
  { key: 'Reviews', get label() { return i18n.t('repairman.reviews'); }, icon: starBold },
  { key: 'PartsOrder', get label() { return i18n.t('repairman.partsOrder'); }, icon: tagBold },
];

// Local, same-screen tab switching — same pattern as the Customer side's
// JobsScreen TabsRow. No navigation involved, so switching is instant.
export default function RepairmanTabs({ activeTab, onChange }) {
  useTranslation();
  const { colors } = useTheme();
  const scrollRef = useRef(null);
  const positions = useRef({});

  const reportLayout = (key, x) => {
    positions.current[key] = x;
  };

  const select = key => {
    onChange(key);
    const x = positions.current[key];
    if (x != null) {
      scrollRef.current?.scrollTo({ x: Math.max(0, x - 20), animated: true });
    }
  };

  return (
    <View style={[styles.wrap, { borderColor: colors.border }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {TABS.map(tab => {
          const isActive = tab.key === activeTab;

          return (
            <View key={tab.key} onLayout={event => reportLayout(tab.key, event.nativeEvent.layout.x)}>
              <Squeeze onPress={() => select(tab.key)}>
                <View style={[styles.tab, isActive && { borderBottomColor: colors.primary }]}>
                  <Icon source={tab.icon} size={15} color={isActive ? colors.primary : colors.textMuted} />
                  <Text
                    style={[
                      styles.label,
                      {
                        color: isActive ? colors.primary : colors.textMuted,
                        fontFamily: isActive ? fonts.bold : fonts.regular,
                      },
                    ]}>
                    {tab.label}
                  </Text>
                </View>
              </Squeeze>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderBottomWidth: 1, paddingHorizontal: 20 },
  row: { flexDirection: 'row' },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  label: { fontSize: 13 },
});
