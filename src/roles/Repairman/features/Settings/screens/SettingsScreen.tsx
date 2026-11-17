import { useCallback, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import AlertModal from '@/components/AlertModal';
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
  exclamationCircleBold,
  fileBold,
  globeBold,
  homeBold,
  infoCircleBold,
  lockBold,
  logOutBold,
  packageBold,
  searchBold,
  shieldBold,
  shoppingBasketBold,
  tabletBold,
  tagBold,
  toolExtra,
} from '@/assets/icons';
import { getWebRepairmanAdsUrl } from '@/constants/config';
import AuthService from '@/services/authService';
import { openWebsite } from '@/roles/Seller/utils/sellerUtils';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useTranslation } from 'react-i18next';

// Only pages that apply to a repairman. "Home" lands on the Dashboard tab; the shop and info pages are shared screens.
const MENU = [
  { label: 'settings.menu.home', icon: homeBold, tab: 'DashboardTab' },
  { label: 'settings.menu.serviceCatalog', icon: toolExtra, screen: 'ServiceCatalog' },
  { label: 'settings.menu.disputes', icon: exclamationCircleBold, screen: 'Disputes' },
  { label: 'settings.menu.advertisements', icon: tagBold, url: getWebRepairmanAdsUrl },
  { label: 'settings.menu.shopProducts', icon: shoppingBasketBold, screen: 'Products' },
  { label: 'settings.menu.about', icon: infoCircleBold, screen: 'About' },
  { label: 'settings.menu.academy', icon: bookmarkBold, screen: 'Academy' },
  { label: 'settings.menu.blogs', icon: blogExtra, screen: 'Blogs' },
  { label: 'settings.menu.myOrder', icon: packageBold, screen: 'Orders' },
  { label: 'settings.menu.myMessages', icon: commentDotsBold, screen: 'ChatList' },
  {
    label: 'settings.menu.buyRefurbishedDevices',
    icon: shoppingBasketBold,
    children: [
      {
        label: 'settings.menu.browseStore',
        icon: shoppingBasketBold,
        screen: 'BuyRefurbished',
      },
      {
        label: 'settings.menu.smartWatch',
        icon: clockBold,
        screen: 'AllGadgets',
        params: { initialCategory: 'Smart watches' },
      },
      {
        label: 'settings.menu.tablet',
        icon: tabletBold,
        screen: 'AllGadgets',
        params: { initialCategory: 'Tablets' },
      },
      {
        label: 'settings.menu.gamingConsole',
        icon: desktopBold,
        screen: 'AllGadgets',
        params: { initialCategory: 'Gaming Console' },
      },
    ],
  },
  { label: 'settings.menu.changePassword', icon: lockBold, screen: 'ChangePassword' },
  { label: 'settings.menu.privacyPolicy', icon: shieldBold, screen: 'PrivacyPolicy' },
  { label: 'settings.menu.language', icon: globeBold, action: 'language' },
  { label: 'settings.menu.terms', icon: fileBold, screen: 'Terms' },
];

function MenuRow({ item, depth = 0, navigation, onOpenUrl }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const hasChildren = Boolean(item.children);
  const { openLanguageModal } = useLanguage();

  const onPress = () => {
    if (item?.action === 'language') openLanguageModal();
    else if (hasChildren) setOpen(!open);
    else if (item?.tab) navigation?.navigate('Home', { screen: item.tab });
    else if (item?.url) onOpenUrl(item.url());
    else if (item?.screen) navigation?.navigate(item.screen, item.params);
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
          pressed &&
            Platform.OS === 'ios' && { backgroundColor: colors.primary + '12' },
        ]}
      >
        <Icon source={item.icon} size={depth ? 18 : 21} color={colors.text} />

        <Text
          style={[
            styles.label,
            {
              color: depth ? colors.textMuted : colors.text,
              fontFamily: hasChildren ? fonts.bold : fonts.regular,
              fontSize: depth ? 14 : 16,
            },
          ]}
        >
          {t(item.label)}
        </Text>

        {hasChildren && (
          <Icon source={chevronDownBold} size={16} color={colors.text} />
        )}
      </Pressable>

      {hasChildren &&
        open &&
        (item?.children || []).map(child => (
          <MenuRow
            key={child.label}
            item={child}
            depth={depth + 1}
            navigation={navigation}
            onOpenUrl={onOpenUrl}
          />
        ))}
    </>
  );
}

export default function SettingsScreen({ navigation, onLogout }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [user, setUser] = useState(AuthService.getCachedUser());
  const [linkFailed, setLinkFailed] = useState('');

  useFocusEffect(
    useCallback(() => {
      setUser(AuthService.getCachedUser());
    }, []),
  );

  const openUrl = async (url: string) => {
    if (!(await openWebsite(url))) setLinkFailed(url);
  };

  const query = lower((search || '').trim());
  const menu = query
    ? (MENU || []).filter(
        item =>
          lower(t(item?.label)).includes(query) ||
          item?.children?.some((c: any) =>
            lower(t(c?.label)).includes(query),
          ),
      )
    : MENU || [];

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.background, paddingTop: insets.top + 12 },
      ]}
    >
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
          placeholder={t('settings.searchSettings')}
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {menu.map((item, index) => (
          <FadeUp key={item.label} delay={15 + index * 12} duration={280}>
            <MenuRow item={item} navigation={navigation} onOpenUrl={openUrl} />
          </FadeUp>
        ))}
      </ScrollView>

      <View
        style={[
          styles.profile,
          { borderColor: colors.border, marginBottom: insets.bottom + 12 },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation?.navigate('Profile')}
          style={styles.profileBtn}
        >
          <Image
            source={
              user?.profileImage || user?.avatar
                ? { uri: user.profileImage || user.avatar }
                : dummyProfileExtra
            }
            style={[styles.avatar, { borderColor: colors.avatarBorder }]}
          />

          <View style={styles.profileText}>
            <Text
              style={[styles.name, { color: colors.text }]}
              numberOfLines={1}
            >
              {user?.name || t('glossary.repairman')}
            </Text>
            <Text style={[styles.role, { color: colors.primary }]}>
              {t('glossary.repairman')}
            </Text>
          </View>
        </TouchableOpacity>

        <Squeeze onPress={() => setConfirmLogout(true)} scale={0.85}>
          <Icon source={logOutBold} size={24} color={colors.error} />
        </Squeeze>
      </View>

      <AlertModal
        visible={Boolean(linkFailed)}
        type="info"
        title={t('settings.openWebsite')}
        message={t('settings.openAddress', { url: linkFailed })}
        onClose={() => setLinkFailed('')}
      />

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
