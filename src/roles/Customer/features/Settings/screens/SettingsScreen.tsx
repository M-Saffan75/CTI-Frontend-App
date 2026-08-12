import { useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import ConfirmModal from '@/components/ConfirmModal';
import Squeeze from '@/components/Squeeze';
import ThemePicker from '@/components/ThemePicker';
import { FadeUp } from '@/animations';
import {
  arrowLeftBold,
  blogExtra,
  bookmarkBold,
  chevronDownBold,
  clockBold,
  commentDotsBold,
  desktopBold,
  dummyProfileExtra,
  fileBold,
  headphonesBold,
  homeBold,
  infoCircleBold,
  logOutBold,
  mobileBold,
  packageBold,
  phoneBold,
  searchBold,
  shieldBold,
  shoppingBasketBold,
  storeBold,
  tabletBold,
  tagBold,
  usersThreeBold,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

// The designer used the same gear icon on every row, so these are picked to match
// what each row actually does.
const MENU = [
  { label: 'Home', icon: homeBold },
  { label: 'Top expert repairman', icon: usersThreeBold, screen: 'ExpertRepairmen' },
  { label: 'About', icon: infoCircleBold, screen: 'About' },
  { label: 'Academy', icon: bookmarkBold, screen: 'Academy' },
  { label: 'Blogs', icon: blogExtra, screen: 'Blogs' },
  { label: 'Support', icon: headphonesBold },
  { label: 'My Order', icon: packageBold, screen: 'Orders' },
  { label: 'My Messages', icon: commentDotsBold },
  { label: 'My Sell Request', icon: tagBold },
  {
    label: 'Refurbished devices',
    icon: mobileBold,
    children: [
      { label: 'Sell gadgets', icon: storeBold },
      { label: 'Sell  phone', icon: phoneBold },
    ],
  },
  {
    label: 'Buy refurbished devices',
    icon: shoppingBasketBold,
    children: [
      { label: 'refurbished Smart watch', icon: clockBold },
      { label: 'refurbished Tablet', icon: tabletBold },
      { label: 'refurbished Gaming consolt', icon: desktopBold },
    ],
  },
  { label: 'Privacy Policy', icon: shieldBold, screen: 'PrivacyPolicy' },
  { label: 'Terms & Conditions', icon: fileBold, screen: 'Terms' },
];

function MenuRow({ item, depth = 0, navigation }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const hasChildren = Boolean(item.children);

  const onPress = () => {
    if (hasChildren) setOpen(!open);
    else if (item.screen) navigation?.navigate(item.screen);
  };

  return (
    <>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: colors.primary + '12' }}
        style={({ pressed }) => [
          styles.row,
          { paddingLeft: 10 + depth * 14 },
          // Android draws its own ripple; this is the iOS equivalent.
          pressed && Platform.OS === 'ios' && { backgroundColor: colors.primary + '12' },
        ]}>
        <Icon source={item.icon} size={depth ? 18 : 21} color={colors.text} />

        <Text
          style={[
            styles.label,
            {
              color: depth ? colors.textMuted : colors.text,
              fontFamily: hasChildren ? fonts.bold : fonts.regular,
              fontSize: depth ? 14 : 16,
            },
          ]}>
          {item.label}
        </Text>

        {hasChildren && (
          <Icon source={chevronDownBold} size={16} color={colors.text} />
        )}
      </Pressable>

      {hasChildren &&
        open &&
        item.children.map(child => (
          <MenuRow key={child.label} item={child} depth={depth + 1} navigation={navigation} />
        ))}
    </>
  );
}

export default function SettingsScreen({ navigation, onLogout }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.background, paddingTop: insets.top + 12 },
      ]}>
      <View style={styles.topRow}>
        <Squeeze onPress={() => navigation?.goBack()} scale={0.9}>
          <View style={[styles.back, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={20} color={colors.onPrimary} />
          </View>
        </Squeeze>

        <ThemePicker />
      </View>

      <View style={[styles.search, { borderColor: colors.border }]}>
        <Icon source={searchBold} size={20} color={colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search Courses"
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {MENU.map((item, index) => (
          <FadeUp key={item.label} delay={60 + index * 40} duration={500}>
            <MenuRow item={item} navigation={navigation} />
          </FadeUp>
        ))}
      </ScrollView>

      <View
        style={[
          styles.profile,
          { borderColor: colors.border, marginBottom: insets.bottom + 12 },
        ]}>
        <Image source={dummyProfileExtra} style={styles.avatar} />

        <View style={styles.profileText}>
          <Text style={[styles.name, { color: colors.text }]}>Zubair Malik</Text>
          <Text style={[styles.role, { color: colors.primary }]}>Owner</Text>
        </View>

        <Squeeze onPress={() => setConfirmLogout(true)} scale={0.85}>
          <Icon source={logOutBold} size={24} color={colors.error} />
        </Squeeze>
      </View>

      <ConfirmModal
        visible={confirmLogout}
        title="Logout"
        message="Are you sure you want to logout?"
        cancelText="Not now"
        confirmText="Logout"
        danger
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false);
          onLogout?.();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 20,
    marginTop: 22,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    padding: 0,
  },
  list: { paddingTop: 20, paddingBottom: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 11,
    paddingRight: 10,
    borderRadius: 10,
    // Android's ripple ignores borderRadius unless the view clips its children.
    overflow: 'hidden',
  },
  label: { flex: 1 },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 40,
    padding: 12,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  profileText: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.bold, fontSize: 16 },
  role: { fontFamily: fonts.regular, fontSize: 13 },
});
