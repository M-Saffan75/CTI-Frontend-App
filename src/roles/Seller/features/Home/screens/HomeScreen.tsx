import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + 20 }]}>
      <Text style={[styles.title, { color: colors.text }]}>Seller</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>Seller screens go here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 },
  title: { fontFamily: fonts.bold, fontSize: 28 },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, marginTop: 6 },
});
