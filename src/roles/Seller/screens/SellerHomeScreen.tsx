import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

import { useTheme } from '@/theme/ThemeContext';
import SellerHeader from '../components/SellerHeader';
import DashboardScreen from '../features/Dashboard/screens/DashboardScreen';
import { useTranslation } from 'react-i18next';

export default function SellerHomeScreen({ navigation }: any) {
  useTranslation();
  const { colors } = useTheme();
  const isFocused = useIsFocused();

  const openTab = useCallback(
    (tab: string, extra: Record<string, any> = {}) => {
      if (tab === 'Dashboard') return;
      navigation.navigate('ProductTab', { initialTab: tab, at: Date.now(), ...extra });
    },
    [navigation],
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <SellerHeader navigation={navigation} />
      <DashboardScreen onSelectTab={openTab} navigation={navigation} isActive={isFocused} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
