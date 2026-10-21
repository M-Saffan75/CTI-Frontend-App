import { useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import {
  chartPieBold,
  commentDotsBold,
  creditCardBold,
  fileBold,
  homeBold,
  packageBold,
  starBold,
  storeBold,
  volumeUpBold,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

export const SELLER_TABS = [
  { key: 'Dashboard', label: 'Dashboard', icon: homeBold },
  { key: 'Product', label: 'Product', icon: packageBold },
  { key: 'OrderManagement', label: 'Order Management', icon: storeBold },
  { key: 'Wallet', label: 'Wallet', icon: creditCardBold },
  { key: 'Ads', label: 'Ads', icon: volumeUpBold },
  { key: 'Reported', label: 'Reported', icon: chartPieBold },
  { key: 'Invoices', label: 'Invoices', icon: fileBold },
  { key: 'Enquiries', label: 'Enquiries', icon: commentDotsBold },
  { key: 'Reviews', label: 'Reviews', icon: starBold },
];

export default function SellerTopTabs({ activeTab, onChange }) {
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
      scrollRef.current?.scrollTo({ x: Math.max(0, x - 24), animated: true });
    }
  };

  return (
    <View style={[styles.wrap, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {SELLER_TABS.map(tab => {
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
  wrap: { borderBottomWidth: 1, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  label: { fontSize: 13 },
});
