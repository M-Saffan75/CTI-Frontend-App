import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import SellerProfileScreen from '../features/Profile/screens/SellerProfileScreen';
import { homeBold, packageBold, userBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import SellerHomeScreen from '../screens/SellerHomeScreen';
import SellerManageScreen from '../screens/SellerManageScreen';
import { useTranslation } from 'react-i18next';

const Tab = createBottomTabNavigator();

const TABS = [
  {
    name: 'HomeTab',
    label: 'tabs.home',
    icon: homeBold,
    component: SellerHomeScreen,
  },
  {
    name: 'ProductTab',
    label: 'tabs.product',
    icon: packageBold,
    component: SellerManageScreen,
  },
  {
    name: 'ProfileTab',
    label: 'tabs.profile',
    icon: userBold,
    component: SellerProfileScreen,
  },
];

function FloatingTabBar({ state, navigation }: any) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: colors.background,
          paddingBottom: insets.bottom + 12,
        },
      ]}
    >
      <View
        style={[
          styles.bar,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {state.routes.map((route: any, index: number) => {
          const tab = TABS.find(item => item.name === route.name)!;
          const focused = state.index === index;

          return (
            <Squeeze
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              scale={0.9}
              style={styles.tabWrap}
            >
              <View style={styles.tab}>
                <Icon
                  source={tab.icon}
                  size={22}
                  color={focused ? colors.primary : colors.textMuted}
                />
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={[
                    styles.label,
                    { color: focused ? colors.primary : colors.textMuted },
                    focused && { fontFamily: fonts.bold },
                  ]}
                >
                  {t(tab.label)}
                </Text>
              </View>
            </Squeeze>
          );
        })}
      </View>
    </View>
  );
}

const renderTabBar = (props: any) => <FloatingTabBar {...props} />;

// Home (Dashboard), Product (all the other Seller options) and Profile.
export default function SellerTabs() {
  useTranslation();
  return (
    <Tab.Navigator
      id="SellerTabs"
      screenOptions={{ headerShown: false }}
      tabBar={renderTabBar}
    >
      {TABS.map(tab => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 8 },
  bar: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 10,
  },
  tabWrap: { flex: 1 },
  tab: { width: '100%', alignItems: 'center', gap: 4 },
  label: { width: '100%', textAlign: 'center', fontFamily: fonts.medium, fontSize: 11 },
});
