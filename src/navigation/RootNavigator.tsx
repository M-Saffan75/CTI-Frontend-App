import { useEffect, useState } from 'react';
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
import KycStatusScreen from '@/features/Kyc/screens/KycStatusScreen';
import { useTheme } from '@/theme/ThemeContext';
import { ROLES } from '@/constants/roles';
import AuthService, { AuthUser } from '@/services/authService';
import socketService from '@/services/socketService';
import fcmService from '@/services/fcmService';
import { warmupApiServer } from '@/services/apiClient';
import { onAuthLogout } from '@/services/authEvents';

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
  const [role, setRole] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Auto-login & server warm-up: Check if user already has an active session
  useEffect(() => {
    // Silent warm up request to wake Render cold start instance early
    warmupApiServer().catch(() => {});

    // Initialize push notifications
    fcmService.initialize().catch(() => {});

    (async () => {
      try {
        const session = await AuthService.getStoredSession();
        if (session?.token && session?.role && ROLE_STACKS[session.role]) {
          setRole(session.role);
          setCurrentUser(session.user);
          setLoggedIn(true);
          socketService.connect().catch(() => {});
          fcmService.registerTokenAfterLogin().catch(() => {});
        }
      } catch {
        // Silently continue to login
      } finally {
        setSessionChecked(true);
      }
    })();
  }, []);

  // Subscribe to clean logout events triggered by 401 interceptor or manual logout
  useEffect(() => {
    const unsubscribe = onAuthLogout(() => {
      setLoggedIn(false);
      setRole(null);
      setCurrentUser(null);
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await AuthService.logout();
    setLoggedIn(false);
    setRole(null);
    setCurrentUser(null);
  };

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

  if (showSplash || !sessionChecked) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Check if provider KYC is required and approved
  // Customer role has no KYC and goes straight to home
  const isKycApproved =
    role === ROLES.CUSTOMER ||
    currentUser?.kycStatus === 'approved';

  // Logged in: if KYC approved, show role app. If pending/incomplete/revision/rejected, show KycStatusScreen.
  if (loggedIn && stacks) {
    if (isKycApproved) {
      return (
        <NavigationContainer theme={navigationTheme}>
          <stacks.app onLogout={handleLogout} />
        </NavigationContainer>
      );
    }

    return (
      <NavigationContainer theme={navigationTheme}>
        <KycStatusScreen
          user={currentUser}
          role={role || undefined}
          status={
            currentUser?.kycStatus ||
            (currentUser?.isKycCompleted ? 'pending' : 'incomplete')
          }
          onApproved={(approvedUser: AuthUser) => {
            setCurrentUser(approvedUser);
          }}
          onLogout={handleLogout}
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
          {() =>
            stacks?.auth ? (
              <stacks.auth
                onLoggedIn={(user?: AuthUser) => {
                  if (user) {
                    setCurrentUser(user);
                  }
                  setLoggedIn(true);
                  socketService.connect().catch(() => {});
                  fcmService.registerTokenAfterLogin().catch(() => {});
                }}
              />
            ) : null
          }
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
