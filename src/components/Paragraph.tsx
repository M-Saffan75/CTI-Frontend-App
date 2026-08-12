import { StyleSheet, Text } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

const SIZES = { sm: 12, md: 14, lg: 16 };

export default function Paragraph({
  children,
  size = 'md',
  align = 'center',
  muted = true,
  color = null,
  style = null,
  ...rest
}) {
  const { colors } = useTheme();

  return (
    <Text
      style={[
        styles.text,
        {
          fontSize: SIZES[size] ?? SIZES.md,
          lineHeight: (SIZES[size] ?? SIZES.md) + 6,
          textAlign: align,
          color: color ?? (muted ? colors.textMuted : colors.text),
        },
        style,
      ]}
      {...rest}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: fonts.regular,
  },
});
