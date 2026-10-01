import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import DashboardTabScreen from '../features/Dashboard/screens/DashboardTabScreen';
import JobsScreen from '../features/Jobs/screens/JobsScreen';
import ProfileScreen from '../features/Profile/screens/ProfileScreen';
import ProductScreen from '@/roles/Customer/features/Product/screens/ProductScreen';
import { homeBold, packageBold, toolExtra, userBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'DashboardTab', label: 'Dashboard', icon: homeBold, component: DashboardTabScreen },
  { name: 'JobsTab', label: 'Jobs', icon: toolExtra, component: JobsScreen },
  { name: 'ProductTab', label: 'Product', icon: packageBold, component: ProductScreen },
  { name: 'ProfileTab', label: 'Profile', icon: userBold, component: ProfileScreen },
];

// Same floating bar as the Customer side — a plain View rather than React
// Navigation's default, which is the only way to get the rounded card with a
// gap on every side.
function FloatingTabBar({ state, navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background, paddingBottom: insets.bottom + 12 }]}>
      <View style={[styles.bar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {state.routes.map((route, index) => {
          const tab = TABS.find(t => t.name === route.name);
          const focused = state.index === index;

          return (
            <Squeeze
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              scale={0.9}
              style={styles.tabWrap}>
              {/* Squeeze only centers this View as a block — without its own
                  alignItems:'center' the icon and label center on different
                  widths and drift apart instead of stacking. */}
              <View style={styles.tab}>
                <Icon source={tab.icon} size={22} color={focused ? colors.primary : colors.textMuted} />
                <Text
                  style={[
                    styles.label,
                    { color: focused ? colors.primary : colors.textMuted },
                    focused && { fontFamily: fonts.bold },
                  ]}>
                  {tab.label}
                </Text>
              </View>
            </Squeeze>
          );
        })}
      </View>
    </View>
  );
}

export default function RepairmanBottomTabs() {
  return (
    <Tab.Navigator
      id="RepairmanTabs"
      screenOptions={{ headerShown: false }}
      tabBar={props => <FloatingTabBar {...props} />}>
      {TABS.map(tab => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  bar: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 10,
  },
  tabWrap: {
    flex: 1,
  },
  tab: {
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },
});
