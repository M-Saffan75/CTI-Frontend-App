import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import ThemePicker from '@/components/ThemePicker';
import { FadeUp } from '@/animations';
import { arrowRightBold, customerIcon, repairmanIcon, sellerIcon } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { ROLES } from '@/constants/roles';

const OPTIONS = [
  {
    role: ROLES.CUSTOMER,
    title: 'Customer',
    description: 'Book a repair or browse products',
    icon: customerIcon,
  },
  {
    role: ROLES.REPAIRMAN,
    title: 'Repairman',
    description: 'Accept bookings and manage repair jobs',
    icon: repairmanIcon,
  },
  {
    role: ROLES.SELLER,
    title: 'Seller',
    description: 'List your products and manage orders',
    icon: sellerIcon,
  },
];

export default function RoleSelectScreen({ onNext = null }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState(ROLES.CUSTOMER);

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.background, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 },
      ]}>
      <ThemePicker style={styles.themePicker} />

      <Text style={[styles.title, { color: colors.text }]}>
        In which role will you be working?
      </Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Choose your role and we'll personalize the app just for you
      </Text>

      <View style={styles.list}>
        {OPTIONS.map((option, index) => {
          const isSelected = option.role === selected;

          return (
            <FadeUp key={option.role} delay={100 + index * 100}>
            <Pressable
              onPress={() => setSelected(option.role)}
              style={[
                styles.card,
                isSelected
                  ? { backgroundColor: colors.surface, borderColor: colors.primary }
                  : { backgroundColor: colors.surfaceAlt, borderColor: 'transparent' },
              ]}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: isSelected ? colors.surfaceAlt : colors.surface },
                ]}>
                <Icon
                  source={option.icon}
                  size={26}
                  color={isSelected ? colors.primary : colors.textMuted}
                />
              </View>

              <View style={styles.cardText}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{option.title}</Text>
                <Text style={[styles.cardDescription, { color: colors.textMuted }]}>
                  {option.description}
                </Text>
              </View>

              <View
                style={[
                  styles.radio,
                  { borderColor: isSelected ? colors.primary : colors.textMuted },
                ]}>
                {isSelected && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
              </View>
            </Pressable>
            </FadeUp>
          );
        })}
      </View>

      <Button
        title="Next"
        icon={arrowRightBold}
        size="lg"
        onPress={() => onNext && onNext(selected)}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 20,
  },
  themePicker: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    textAlign: 'center',
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  list: {
    gap: 12,
    marginTop: 28,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  cardDescription: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  button: {
    marginTop: 24,
  },
});
