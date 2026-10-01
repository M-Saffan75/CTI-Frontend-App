import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeContext';
import RepairmanHeader from '../../../components/RepairmanHeader';
import DashboardContent from './DashboardScreen';

// Dashboard is its own bottom tab now — no horizontal tab row above it, just
// the header and the dashboard content.
export default function DashboardTabScreen({ navigation }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <RepairmanHeader navigation={navigation} />
      <DashboardContent />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
