import { StyleSheet, Text, View } from 'react-native';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import { arrowLeftBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useTranslation } from 'react-i18next';

interface Props {
  title: string;
  subtitle?: string;
  onBack: () => void;
}

// Round back button + title, used by the Seller screens that sit above the tabs.
export default function SellerScreenHeader({ title, subtitle, onBack }: Props) {
  useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <Squeeze onPress={onBack} scale={0.9}>
        <View style={[styles.backBtn, { backgroundColor: colors.primary }]}>
          <Icon source={arrowLeftBold} size={18} color={colors.onPrimary} />
        </View>
      </Squeeze>
      <View style={styles.texts}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1 },
  title: { fontFamily: fonts.bold, fontSize: 22 },
  subtitle: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
});
