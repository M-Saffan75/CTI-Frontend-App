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
  creditCardBold,
  dummyProfileExtra,
  fileBold,
  headphonesBold,
  homeBold,
  infoCircleBold,
  logOutBold,
  packageBold,
  searchBold,
  settingsBold,
  shieldBold,
  storeBold,
  usersThreeBold,
} from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

const MENU = [
  { label: 'Store Dashboard', icon: homeBold, tab: 'Dashboard' },
  { label: 'Manage Products', icon: packageBold, tab: 'Product' },
  { label: 'Orders & Fulfillment', icon: storeBold, tab: 'OrderManagement' },
  { label: 'Payouts & Banking', icon: creditCardBold, tab: 'Wallet' },
  { label: 'Seller Support', icon: headphonesBold },
  { label: 'About CTI Marketplace', icon: infoCircleBold },
  { label: 'Community Guidelines', icon: usersThreeBold },
  { label: 'Privacy Policy', icon: shieldBold },
  { label: 'Terms & Conditions', icon: fileBold },
];

function MenuRow({ item, navigation, onSelectTab }) {
  const { colors } = useTheme();

  const onPress = () => {
    if (item.tab) {
      onSelectTab?.(item.tab);
      navigation?.goBack();
    }
  };

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: colors.primary + '12' }}
      style={({ pressed }) => [
        styles.row,
        pressed && Platform.OS === 'ios' && { backgroundColor: colors.primary + '12' },
      ]}>
      <Icon source={item.icon} size={20} color={colors.text} />
      <Text style={[styles.label, { color: colors.text }]}>{item.label}</Text>
      <Icon source={chevronDownBold} size={14} color={colors.textMuted} />
    </Pressable>
  );
}

export default function SettingsScreen({ navigation, onLogout, onSelectTab }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [confirmLogout, setConfirmLogout] = useState(false);

  const query = search.trim().toLowerCase();
  const menu = query ? MENU.filter(item => item.label.toLowerCase().includes(query)) : MENU;

  return (
    <View
      style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + 12 }]}>
      {/* Top Header */}
      <View style={styles.topRow}>
        <Squeeze onPress={() => navigation?.goBack()} scale={0.9}>
          <View style={[styles.back, { backgroundColor: colors.primary }]}>
            <Icon source={arrowLeftBold} size={20} color={colors.onPrimary} />
          </View>
        </Squeeze>

        <ThemePicker />
      </View>

      {/* Search Input */}
      <View style={[styles.search, { borderColor: colors.border }]}>
        <Icon source={searchBold} size={20} color={colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search settings..."
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      {/* Menu List */}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {menu.map((item, index) => (
          <FadeUp key={item.label} delay={15 + index * 12} duration={280}>
            <MenuRow item={item} navigation={navigation} onSelectTab={onSelectTab} />
          </FadeUp>
        ))}
      </ScrollView>

      {/* Profile Card & Logout */}
      <View
        style={[styles.profile, { borderColor: colors.border, marginBottom: insets.bottom + 12 }]}>
        <Image source={dummyProfileExtra} style={styles.avatar} />

        <View style={styles.profileText}>
          <Text style={[styles.name, { color: colors.text }]}>Hammad Raza</Text>
          <Text style={[styles.role, { color: colors.primary }]}>Verified Seller</Text>
        </View>

        <Squeeze onPress={() => setConfirmLogout(true)} scale={0.85}>
          <Icon source={logOutBold} size={24} color={colors.error} />
        </Squeeze>
      </View>

      <ConfirmModal
        visible={confirmLogout}
        title="Logout"
        message="Are you sure you want to log out of your seller store?"
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
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    paddingHorizontal: 18,
    marginTop: 20,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    padding: 0,
  },
  list: { paddingTop: 18, paddingBottom: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  label: { flex: 1, fontFamily: fonts.regular, fontSize: 15 },
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
