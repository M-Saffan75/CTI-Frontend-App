import { Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { commentDotsBold, menuBold } from '@/assets/icons';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';

export default function RepairmanHeader({ navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <Image source={ctiLogo} resizeMode="contain" style={styles.logo} />
      <View style={styles.icons}>
        <Squeeze onPress={() => navigation?.navigate('ChatList')} scale={0.85}>
          <Icon source={commentDotsBold} size={22} color={colors.text} />
        </Squeeze>
        <Squeeze onPress={() => navigation?.navigate('Settings')} scale={0.85}>
          <Icon source={menuBold} size={22} color={colors.text} />
        </Squeeze>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  logo: { width: 110, height: 59 },
  icons: { flexDirection: 'row', alignItems: 'center', gap: 16 },
});
