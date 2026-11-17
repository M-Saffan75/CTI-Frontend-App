import { useEffect, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import ConfirmModal from '@/components/ConfirmModal';
import Squeeze from '@/components/Squeeze';
import ThemePicker from '@/components/ThemePicker';
import { useLanguage } from '@/i18n/LanguageContext';
import { lower } from '@/i18n/locale';
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
  homeBold,
  infoCircleBold,
  lockBold,
  logOutBold,
  mobileBold,
  packageBold,
  phoneBold,
  globeBold,
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
import AuthService, { AuthUser } from '@/services/authService';
import { useTranslation } from 'react-i18next';

// The designer used the same gear icon on every row, so these are picked to match
// what each row actually does.
const MENU = [
  { label: 'settings.menu.home', icon: homeBold, screen: 'Home' },
  { label: 'settings.menu.topExpertRepairmen', icon: usersThreeBold, screen: 'ExpertRepairmen' },
  { label: 'settings.menu.about', icon: infoCircleBold, screen: 'About' },
  { label: 'settings.menu.academy', icon: bookmarkBold, screen: 'Academy' },
  { label: 'settings.menu.blogs', icon: blogExtra, screen: 'Blogs' },
  { label: 'settings.menu.myOrders', icon: packageBold, screen: 'Orders' },
  { label: 'settings.menu.myMessages', icon: commentDotsBold, screen: 'ChatList' },
  { label: 'settings.menu.mySellRequest', icon: tagBold, screen: 'MySellRequests' },
  {
    label: 'settings.menu.refurbishedDevices',
    icon: mobileBold,
    children: [
      { label: 'settings.menu.sellPhone', icon: phoneBold, screen: 'SellRefurbished', params: { mode: 'phone' } },
      { label: 'settings.menu.sellGadgets', icon: storeBold, screen: 'SellRefurbished', params: { mode: 'gadget' } },
    ],
  },
  {
    label: 'settings.menu.buyRefurbishedDevices',
    icon: shoppingBasketBold,
    children: [
      { label: 'settings.menu.browseStore', icon: shoppingBasketBold, screen: 'BuyRefurbished' },
      {
        label: 'settings.menu.smartWatch',
        icon: clockBold,
        screen: 'AllGadgets',
        params: { initialCategory: 'Smart watches', categorySlug: 'smart-watches' },
      },
      {
        label: 'settings.menu.tablet',
        icon: tabletBold,
        screen: 'AllGadgets',
        params: { initialCategory: 'Tablets', categorySlug: 'tablets' },
      },
      {
        label: 'settings.menu.gamingConsole',
        icon: desktopBold,
        screen: 'AllGadgets',
        params: { initialCategory: 'Gaming Console', categorySlug: 'gaming-consoles' },
      },
    ],
  },
  { label: 'settings.menu.changePassword', icon: lockBold, screen: 'ChangePassword' },
  { label: 'settings.menu.privacyPolicy', icon: shieldBold, screen: 'PrivacyPolicy' },
  { label: 'settings.menu.language', icon: globeBold, action: 'language' },
  { label: 'settings.menu.terms', icon: fileBold, screen: 'Terms' },
];

function MenuRow({ item, depth = 0, navigation }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const hasChildren = Boolean(item.children);
  const { openLanguageModal } = useLanguage();

  const onPress = () => {
    try {
      if (item.action === 'language') openLanguageModal();
      else if (hasChildren) setOpen(!open);
      else if (item?.screen) navigation?.navigate(item.screen, item.params);
    } catch (e) {
      if (__DEV__) console.warn('Navigation error:', e);
    }
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
          {t(item.label)}
        </Text>

        {hasChildren && (
          <Icon source={chevronDownBold} size={16} color={colors.text} />
        )}
      </Pressable>

      {hasChildren &&
        open &&
        (item?.children || []).map((child, childIdx) => (
          <MenuRow key={child?.label || `child-${childIdx}`} item={child} depth={depth + 1} navigation={navigation} />
        ))}
    </>
  );
}

export default function SettingsScreen({ navigation, onLogout }: any) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => AuthService.getCachedUser());

  useEffect(() => {
    let mounted = true;
    AuthService.getStoredUser().then(u => {
      if (mounted && u) setCurrentUser(u);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const query = lower((search || '').trim());
  const menu = query
    ? (MENU || []).filter(
        item =>
          lower(t(item?.label)).includes(query) ||
          item?.children?.some((c: any) => lower(t(c?.label)).includes(query)),
      )
    : (MENU || []);

  const avatarSource =
    currentUser?.avatar || currentUser?.profileImage
      ? { uri: currentUser.avatar || currentUser.profileImage }
      : dummyProfileExtra;

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
          placeholder={t('settings.search')}
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
        style={[
          styles.profile,
          { borderColor: colors.border, marginBottom: insets.bottom + 12 },
        ]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation?.navigate('Profile')}
          style={styles.profileBtn}>
          <Image
            source={avatarSource}
            style={[styles.avatar, { borderColor: colors.avatarBorder }]}
          />

          <View style={styles.profileText}>
            <Text style={[styles.name, { color: colors.text }]}>
              {currentUser?.name || t('glossary.customer')}
            </Text>
            <Text style={[styles.role, { color: colors.primary }]}>{t('glossary.customer')}</Text>
          </View>
        </TouchableOpacity>

        <Squeeze onPress={() => setConfirmLogout(true)} scale={0.85}>
          <Icon source={logOutBold} size={24} color={colors.error} />
        </Squeeze>
      </View>

      <ConfirmModal
        visible={confirmLogout}
        title={t('settings.logout')}
        message={t('settings.logoutConfirm')}
        cancelText={t('settings.notNow')}
        confirmText={t('settings.logout')}
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
  profileBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5 },
  profileText: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.bold, fontSize: 16 },
  role: { fontFamily: fonts.regular, fontSize: 13 },
});
