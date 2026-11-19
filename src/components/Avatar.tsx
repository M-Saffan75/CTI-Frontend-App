import { Image, StyleProp, StyleSheet, Text, View, ViewStyle, ImageStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { upper } from '@/i18n/locale';
import { useTranslation } from 'react-i18next';

interface Props {
  uri?: string | null;
  name?: string | null;
  style?: StyleProp<ImageStyle>;
}

// The profile photo; without one, a round badge with the first letter of the name (same size and border as the photo)
export default function Avatar({ uri, name, style }: Props) {
  useTranslation();
  const { colors } = useTheme();

  if (uri) return <Image source={{ uri }} style={style} />;

  const flat = StyleSheet.flatten(style) || {};
  const size = typeof flat.width === 'number' ? flat.width : 40;
  const letter = upper((name || '').trim().charAt(0)) || '?';

  return (
    <View
      style={[
        style as StyleProp<ViewStyle>,
        styles.center,
        { backgroundColor: colors.primary + '20', borderColor: flat.borderColor || colors.avatarBorder },
      ]}>
      <Text style={[styles.letter, { color: colors.primary, fontSize: size * 0.42 }]}>{letter}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  letter: { fontFamily: fonts.bold, includeFontPadding: false },
});
