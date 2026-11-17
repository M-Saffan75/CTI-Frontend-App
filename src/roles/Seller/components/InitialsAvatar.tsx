import { Image, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { upper } from '@/i18n/locale';
import { useTranslation } from 'react-i18next';

interface Props {
  name: string;
  photo?: string | null;
  size?: number;
}

// Photo when there is one, otherwise the initials. Always has the themed avatar border.
export default function InitialsAvatar({ name, photo, size = 42 }: Props) {
  useTranslation();
  const { colors } = useTheme();
  const initials =
    upper(
      (name || '?')
        .split(' ')
        .filter(Boolean)
        .map(word => word[0])
        .join('')
        .slice(0, 2),
    ) || '?';
  const box = { width: size, height: size, borderRadius: size / 2, borderColor: colors.avatarBorder };

  if (photo) {
    return <Image source={{ uri: photo }} style={[styles.box, box, { backgroundColor: colors.surfaceAlt }]} />;
  }

  return (
    <View style={[styles.box, styles.center, box, { backgroundColor: colors.primary + '20' }]}>
      <Text style={[styles.text, { color: colors.primary, fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: fonts.bold },
});
