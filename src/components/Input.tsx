import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import Icon from '@/components/Icon';
import { FadeIn } from '@/animations';
import { eyeBold, eyeSlashBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

export default function Input({
  label = null,
  value,
  onChangeText,
  placeholder = '',
  error = '',
  password = false,
  style = null,
  ...rest
}) {
  const { colors } = useTheme();
  const [hidden, setHidden] = useState(true);

  return (
    <View style={style}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}

      <View
        style={[
          styles.field,
          { backgroundColor: colors.inputBg },
          error && { borderColor: colors.error, borderWidth: 1 },
        ]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={password && hidden}
          style={[styles.input, { color: colors.text }]}
          {...rest}
        />

        {password && (
          <Pressable onPress={() => setHidden(!hidden)} hitSlop={10}>
            <Icon source={hidden ? eyeSlashBold : eyeBold} size={20} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {error ? (
        <FadeIn duration={200}>
          <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
        </FadeIn>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.bold,
    fontSize: 14,
    marginBottom: 8,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 56,
    borderRadius: 10,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    padding: 0,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 6,
  },
});
