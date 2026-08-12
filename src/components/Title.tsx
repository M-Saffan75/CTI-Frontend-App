import { StyleSheet, Text } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

const SIZES = { sm: 18, md: 22, lg: 26, xl: 30 };

export default function Title({
  children,
  size = 'xl',
  align = 'center',
  color = null,
  style = null,
}) {
  const { colors } = useTheme();

  return (
    <Text
      style={[
        styles.text,
        { fontSize: SIZES[size] ?? SIZES.xl, textAlign: align, color: color ?? colors.text },
        style,
      ]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: fonts.bold,
  },
});
