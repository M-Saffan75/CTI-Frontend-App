import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { useTheme } from '@/theme/ThemeContext';
import { gradients } from '@/theme/colors';
import { fonts } from '@/theme/fonts';

const SIZES = {
  xs: { height: 32, fontSize: 12, icon: 14, paddingHorizontal: 12 },
  sm: { height: 40, fontSize: 14, icon: 16, paddingHorizontal: 16 },
  md: { height: 48, fontSize: 15, icon: 18, paddingHorizontal: 20 },
  lg: { height: 56, fontSize: 16, icon: 18, paddingHorizontal: 24 },
};

export default function Button({
  title,
  onPress = null,
  size = 'md',
  variant = 'filled',
  gradient = null,
  // Overrides the brand colour for one-off buttons, e.g. a red destructive one.
  color = null,
  icon = null,
  iconPosition = 'right',
  // Multi-colour logos (Google) must not be tinted or they turn into a blob.
  tintIcon = true,
  loading = false,
  disabled = false,
  fullWidth = true,
  style = null,
}) {
  const { colors } = useTheme();
  const sizing = SIZES[size] ?? SIZES.md;
  const isDisabled = disabled || loading;

  const accent = color ?? colors.primary;

  const textColor =
    gradient || variant === 'filled'
      ? color
        ? '#FFFFFF' // a custom fill is always a strong colour, so white reads on it
        : colors.onPrimary
      : variant === 'soft'
      ? colors.text
      : accent;

  const background = {
    filled: { backgroundColor: accent },
    soft: { backgroundColor: colors.inputBg },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: accent },
    ghost: { backgroundColor: 'transparent' },
  }[variant];

  const inner = (
    <>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Icon source={icon} size={sizing.icon} color={tintIcon ? textColor : null} />
          )}
          <Text style={[styles.title, { color: textColor, fontSize: sizing.fontSize }]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Icon source={icon} size={sizing.icon} color={tintIcon ? textColor : null} />
          )}
        </>
      )}
    </>
  );

  const box = [
    styles.box,
    { height: sizing.height, paddingHorizontal: sizing.paddingHorizontal },
  ];

  return (
    <Squeeze
      onPress={onPress}
      disabled={isDisabled}
      style={[fullWidth && styles.fullWidth, isDisabled && styles.disabled, style]}>
      {gradient ? (
        <LinearGradient
          colors={gradients[gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={box}>
          {inner}
        </LinearGradient>
      ) : (
        <View style={[box, background]}>{inner}</View>
      )}
    </Squeeze>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.5,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  title: {
    fontFamily: fonts.bold,
  },
});
