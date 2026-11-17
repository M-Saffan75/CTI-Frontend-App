import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeContext';
import RepairmanHeader from '../../../components/RepairmanHeader';
import EarningsContent from './EarningsScreen';
import { useTranslation } from 'react-i18next';

export default function EarningsTabScreen({ navigation }) {
  useTranslation();
  const { colors } = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <RepairmanHeader navigation={navigation} />
      <EarningsContent navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
