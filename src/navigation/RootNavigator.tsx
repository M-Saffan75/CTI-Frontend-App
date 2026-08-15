import { useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '@/features/Splash/screens/SplashScreen';
import RoleSelectScreen from '@/features/RoleSelect/screens/RoleSelectScreen';
import CustomerAuthStack from '@/roles/Customer/navigation/CustomerAuthStack';
import CustomerNavigator from '@/roles/Customer/navigation/CustomerNavigator';
import SellerAuthStack from '@/roles/Seller/navigation/SellerAuthStack';
import SellerNavigator from '@/roles/Seller/navigation/SellerNavigator';
import RepairmanAuthStack from '@/roles/Repairman/navigation/RepairmanAuthStack';
import RepairmanNavigator from '@/roles/Repairman/navigation/RepairmanNavigator';
import { useTheme } from '@/theme/ThemeContext';
import { ROLES } from '@/constants/roles';

const Stack = createNativeStackNavigator();

// Each role gets its own auth screens and its own app screens.
const ROLE_STACKS = {
  [ROLES.CUSTOMER]: { auth: CustomerAuthStack, app: CustomerNavigator },
  [ROLES.SELLER]: { auth: SellerAuthStack, app: SellerNavigator },
  [ROLES.REPAIRMAN]: { auth: RepairmanAuthStack, app: RepairmanNavigator },
};

export default function RootNavigator() {
  const { colors } = useTheme();
  const [showSplash, setShowSplash] = useState(true);
  const [role, setRole] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);

  // Giving React Navigation our colours stops the white flash between screens.
  const navigationTheme = {
    ...DefaultTheme,
    dark: colors.barStyle === 'light-content',
    colors: {
      ...DefaultTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
  };

  const stacks = role ? ROLE_STACKS[role] : null;

  if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

  // Logged in: swap to that role's full app. No going back to auth from here.
  if (loggedIn && stacks) {
    return (
      <NavigationContainer theme={navigationTheme}>
        <stacks.app
          onLogout={() => {
            setLoggedIn(false);
            setRole(null);
          }}
        />
      </NavigationContainer>
    );
  }

  // RoleSelect and Auth share one stack so the back button/gesture on Login
  // actually returns to RoleSelect instead of having nowhere to go.
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        id="Root"
        screenOptions={{ headerShown: false, animation: 'simple_push', animationDuration: 380 }}>
        <Stack.Screen name="RoleSelect">
          {props => (
            <RoleSelectScreen
              {...props}
              onNext={chosen => {
                setRole(chosen);
                props.navigation.navigate('Auth');
              }}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Auth">
          {() => (stacks?.auth ? <stacks.auth onLoggedIn={() => setLoggedIn(true)} /> : null)}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
