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
  chevronDownBold,
  commentDotsBold,
  creditCardBold,
  dummyProfileExtra,
  fileBold,
  folderBold,
  headphonesBold,
  homeBold,
  inboxBold,
  infoCircleBold,
  logOutBold,
  palmHandIcon,
  searchBold,
  shieldBold,
  starBold,
  storeBold,
  tagBold,
  userBold,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

// Same shape as the Customer settings menu, but pointing at the Repairman's
// own screens. `tab` rows land on Home with that tab already selected.
const MENU = [
  { label: 'Dashboard', icon: homeBold, tab: 'Dashboard' },
  { label: 'Jobs Board', icon: inboxBold, tab: 'JobBoard' },
  { label: 'My Offers', icon: palmHandIcon, tab: 'MyOffers' },
  { label: 'My Jobs', icon: folderBold, tab: 'MyJobs' },
  { label: 'Reviews', icon: starBold, tab: 'Reviews' },
  { label: 'My Messages', icon: commentDotsBold, screen: 'ChatList' },
  {
    label: 'Earnings',
    icon: creditCardBold,
    children: [
      { label: 'Overview & Withdraw', icon: creditCardBold, tab: 'Earnings' },
      { label: 'Banking Information', icon: storeBold, screen: 'BankingInformation' },
    ],
  },
  { label: 'Parts Orders', icon: tagBold, tab: 'PartsOrder' },
  { label: 'My Profile', icon: userBold },
  { label: 'Support', icon: headphonesBold },
  { label: 'About', icon: infoCircleBold },
  { label: 'Privacy Policy', icon: shieldBold, screen: 'PrivacyPolicy' },
  { label: 'Terms & Conditions', icon: fileBold, screen: 'Terms' },
];

function MenuRow({ item, depth = 0, navigation }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const hasChildren = Boolean(item.children);

  const onPress = () => {
    if (hasChildren) setOpen(!open);
    else if (item.tab) navigation?.navigate('Home', { tab: item.tab });
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

        {hasChildren && <Icon source={chevronDownBold} size={16} color={colors.text} />}
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

  const query = search.trim().toLowerCase();
  const menu = query ? MENU.filter(item => item.label.toLowerCase().includes(query)) : MENU;

  return (
    <View
      style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + 12 }]}>
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
          placeholder="Search settings"
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {menu.map((item, index) => (
          <FadeUp key={item.label} delay={15 + index * 12} duration={280}>
            <MenuRow item={item} navigation={navigation} />
          </FadeUp>
        ))}
      </ScrollView>

      <View
        style={[styles.profile, { borderColor: colors.border, marginBottom: insets.bottom + 12 }]}>
        <Image source={dummyProfileExtra} style={styles.avatar} />

        <View style={styles.profileText}>
          <Text style={[styles.name, { color: colors.text }]}>Hammad Raza</Text>
          <Text style={[styles.role, { color: colors.primary }]}>Repairman</Text>
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
