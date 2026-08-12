import { useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '@/features/Splash/screens/SplashScreen';
import RoleSelectScreen from '@/features/RoleSelect/screens/RoleSelectScreen';
import CustomerAuthStack from '@/roles/Customer/navigation/CustomerAuthStack';
import CustomerNavigator from '@/roles/Customer/navigation/CustomerNavigator';
import SellerNavigator from '@/roles/Seller/navigation/SellerNavigator';
import RepairmanNavigator from '@/roles/Repairman/navigation/RepairmanNavigator';
import { useTheme } from '@/theme/ThemeContext';
import { ROLES } from '@/constants/roles';

const Stack = createNativeStackNavigator();

// Each role gets its own auth screens and its own app screens.
// Seller and Repairman auth stacks come once the Customer flow is signed off.
const ROLE_STACKS = {
  [ROLES.CUSTOMER]: { auth: CustomerAuthStack, app: CustomerNavigator },
  [ROLES.SELLER]: { auth: null, app: SellerNavigator },
  [ROLES.REPAIRMAN]: { auth: null, app: RepairmanNavigator },
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

  const stacks = ROLE_STACKS[role];

  const pickRole = chosen => {
    setLoggedIn(false);
    setRole(chosen);
  };

  if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

  return (
    <NavigationContainer theme={navigationTheme}>
      {!stacks ? (
        <Stack.Navigator id="Root" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="RoleSelect">
            {props => <RoleSelectScreen {...props} onNext={pickRole} />}
          </Stack.Screen>
        </Stack.Navigator>
      ) : loggedIn || !stacks.auth ? (
        // Logging out drops all the way back to RoleSelect.
        <stacks.app
          onLogout={() => {
            setLoggedIn(false);
            setRole(null);
          }}
        />
      ) : (
        <stacks.auth onLoggedIn={() => setLoggedIn(true)} />
      )}
    </NavigationContainer>
  );
}
