import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import HomeScreen from '../features/Home/screens/HomeScreen';
import JobsScreen from '../features/Jobs/screens/JobsScreen';
import ProductScreen from '../features/Product/screens/ProductScreen';
import ProfileScreen from '../features/Profile/screens/ProfileScreen';
import { homeBold, packageBold, toolExtra, userBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'HomeTab', label: 'Home', icon: homeBold, component: HomeScreen },
  { name: 'RepairTab', label: 'Repair', icon: toolExtra, component: JobsScreen },
  { name: 'ProductTab', label: 'Product', icon: packageBold, component: ProductScreen },
  { name: 'ProfileTab', label: 'Profile', icon: userBold, component: ProfileScreen },
];

// A plain View, not React Navigation's default bar — that's the only way to get
// the floating rounded-card look with a gap on every side, like the design.
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
                  alignItems:'center', the icon and label center on different
                  widths (icon at 22px, label at its own text width) and drift
                  apart instead of stacking on the same centre line. */}
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

// The 4 tabs at the bottom of every Customer screen. Settings, Blogs, etc. are
// pushed on top of this from CustomerNavigator, which hides the tab bar for them.
export default function CustomerTabs() {
  return (
    <Tab.Navigator
      id="CustomerTabs"
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
