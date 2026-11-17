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
  chartPieBold,
  commentDotsBold,
  creditCardBold,
  dummyProfileExtra,
  fileBold,
  globeBold,
  folderBold,
  homeBold,
  inboxBold,
  lockBold,
  logOutBold,
  packageBold,
  searchBold,
  shieldBold,
  shoppingBasketBold,
  starBold,
  userBold,
  volumeUpBold,
} from '@/assets/icons';
import AuthService, { AuthUser } from '@/services/authService';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { fetchSellerQueryStatsApi } from '@/roles/Seller/services/sellerApi';
import { openSellerTab } from '@/roles/Seller/utils/sellerUtils';
import { useTranslation } from 'react-i18next';

const MENU: MenuItem[] = [
  { label: 'settings.menu.home', icon: homeBold, tab: 'Dashboard' },
  { label: 'settings.menu.myProfile', icon: userBold, screen: 'Profile' },
  { label: 'settings.menu.myProducts', icon: shoppingBasketBold, tab: 'Product' },
  { label: 'settings.menu.myOrders', icon: packageBold, tab: 'OrderManagement' },
  { label: 'settings.menu.wallet', icon: creditCardBold, tab: 'Wallet' },
  { label: 'settings.menu.myAds', icon: volumeUpBold, tab: 'Ads' },
  { label: 'settings.menu.reports', icon: chartPieBold, tab: 'Reported' },
  { label: 'settings.menu.invoices', icon: folderBold, tab: 'Invoices' },
  { label: 'settings.menu.enquiries', icon: inboxBold, tab: 'Enquiries' },
  { label: 'settings.menu.reviews', icon: starBold, tab: 'Reviews' },
  { label: 'settings.menu.myMessages', icon: commentDotsBold, screen: 'ChatList' },
  { label: 'settings.menu.changePassword', icon: lockBold, screen: 'ChangePassword' },
  { label: 'settings.menu.privacyPolicy', icon: shieldBold, screen: 'PrivacyPolicy' },
  { label: 'settings.menu.language', icon: globeBold, action: 'language' },
  { label: 'settings.menu.terms', icon: fileBold, screen: 'Terms' },
];

interface MenuItem {
  label: string;
  icon: any;
  tab?: string;
  screen?: string;
  action?: 'language';
}

function MenuRow({ item, navigation, badge }: { item: MenuItem; navigation: any; badge?: number }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { openLanguageModal } = useLanguage();

  const onPress = () => {
    if (item.action === 'language') {
      openLanguageModal();
    } else if (item.tab) {
      openSellerTab(navigation, item.tab);
    } else if (item.screen) {
      navigation?.navigate(item.screen);
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
      <Icon source={item.icon} size={21} color={colors.text} />
      <Text style={[styles.label, { color: colors.text }]}>{t(item.label)}</Text>
      {!!badge && badge > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={[styles.badgeText, { color: colors.onPrimary }]}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function SettingsScreen({ navigation, onLogout }: any) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [unreadEnquiries, setUnreadEnquiries] = useState(0);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => AuthService.getCachedUser());

  // Read the stored user again each time the screen is shown, so a new photo or name appears at once
  useEffect(() => {
    let alive = true;
    const load = () => {
      AuthService.getStoredUser().then(user => {
        if (alive && user) setCurrentUser(user);
      });
      // Same count as the web Enquiries badge; a failed request keeps the last number
      fetchSellerQueryStatsApi()
        .then(stats => {
          if (alive) setUnreadEnquiries(stats.unread);
        })
        .catch(() => {});
    };
    load();
    const unsubscribe = navigation?.addListener?.('focus', load);
    return () => {
      alive = false;
      unsubscribe?.();
    };
  }, [navigation]);

  const query = lower((search || '').trim());
  const menu = query ? MENU.filter(item => lower(t(item.label)).includes(query)) : MENU;

  const photo = currentUser?.avatar || currentUser?.profileImage;
  const avatarSource = photo ? { uri: photo } : dummyProfileExtra;

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

      {/* Search Bar */}
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

      {/* Menu List */}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {menu.map((item, index) => (
          <FadeUp key={item.label} delay={15 + index * 12} duration={280}>
            <MenuRow
              item={item}
              navigation={navigation}
              badge={item.tab === 'Enquiries' ? unreadEnquiries : 0}
            />
          </FadeUp>
        ))}
      </ScrollView>

      {/* Profile Card & Logout */}
      <View
        style={[styles.profile, { borderColor: colors.border, marginBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation?.navigate('Profile')}
          style={styles.profileBtn}>
          <Image
            source={avatarSource}
            style={[styles.avatar, { borderColor: colors.avatarBorder }]}
          />

          <View style={styles.profileText}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {currentUser?.name || t('glossary.seller')}
            </Text>
            <Text style={[styles.role, { color: colors.primary }]} numberOfLines={1}>
              {currentUser?.businessName || t('glossary.seller')}
            </Text>
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
    overflow: 'hidden',
  },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.bold, fontSize: 11 },
  label: { flex: 1, fontFamily: fonts.regular, fontSize: 16 },
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
