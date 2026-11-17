import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeContext';
import RepairmanHeader from '../../../components/RepairmanHeader';
import DashboardContent from './DashboardScreen';
import { useTranslation } from 'react-i18next';

// Dashboard is its own bottom tab: the header and the dashboard content.
export default function DashboardTabScreen({ navigation }) {
  useTranslation();
  const { colors } = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <RepairmanHeader navigation={navigation} />
      <DashboardContent navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
