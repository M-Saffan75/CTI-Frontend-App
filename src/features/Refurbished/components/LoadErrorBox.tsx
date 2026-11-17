import { StyleSheet, Text, View } from 'react-native';

import Button from '@/components/Button';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useTranslation } from 'react-i18next';

// Shown when a request failed, so an empty list is never mistaken for "nothing here"
export default function LoadErrorBox({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.box}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>
      <Button title={t('customer.tryAgain')} size="sm" onPress={onRetry} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24, gap: 8 },
  title: { fontFamily: fonts.bold, fontSize: 16, textAlign: 'center' },
  message: { fontFamily: fonts.regular, fontSize: 13, textAlign: 'center' },
  button: { marginTop: 8, minWidth: 140 },
});
