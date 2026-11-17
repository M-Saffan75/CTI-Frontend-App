import { useEffect, useRef, useState } from 'react';
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
import { canUseApp, effectiveKycStatus } from '@/features/Kyc/kycGate';
import { useTheme } from '@/theme/ThemeContext';
import { ROLES } from '@/constants/roles';
import AuthService, { AuthUser } from '@/services/authService';
import socketService from '@/services/socketService';
import fcmService from '@/services/fcmService';
import { warmupApiServer } from '@/services/apiClient';
import { onAuthLogout } from '@/services/authEvents';
import { useUnreadNotificationsLive } from '@/services/unreadStore';

const Stack = createNativeStackNavigator();

// How long the splash waits for the KYC status check of a stored approved Seller or Repairman
const KYC_CHECK_TIMEOUT_MS = 10000;

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
  const loggingOut = useRef(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  // The unread count on the bell icon, only while a user who can use the app is logged in
  useUnreadNotificationsLive(loggedIn && Boolean(role) && canUseApp(role, currentUser));

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

          // The stored KYC status can be old (approved or sent back for revision while the app was closed).
          // A stored "approved" is checked before the app opens, so an account that is no longer approved
          // never sees the dashboard. If the check takes too long or fails (offline), the stored status is kept.
          // A 401 logs out through the API client.
          if (session.role !== ROLES.CUSTOMER) {
            const refresh = AuthService.fetchUserProfile()
              .then(fresh => {
                if (fresh) setCurrentUser(fresh);
              })
              .catch(() => {});
            if (canUseApp(session.role, session.user)) {
              await Promise.race([
                refresh,
                new Promise<void>(resolve => setTimeout(() => resolve(), KYC_CHECK_TIMEOUT_MS)),
              ]);
            }
          }
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
    if (loggingOut.current) return;
    loggingOut.current = true;
    try {
      await AuthService.logout();
      setLoggedIn(false);
      setRole(null);
      setCurrentUser(null);
    } finally {
      loggingOut.current = false;
    }
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

  // Customer role has no KYC and goes straight to home. Seller and Repairman need an approved account.
  const isKycApproved = canUseApp(role, currentUser);

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
          key={effectiveKycStatus(role, currentUser)}
          user={currentUser}
          role={role || undefined}
          status={effectiveKycStatus(role, currentUser)}
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
                  // Seller and Repairman: load the store or shop name and photo right after login
                  if (role !== ROLES.CUSTOMER) {
                    AuthService.fetchUserProfile()
                      .then(fresh => {
                        if (fresh) setCurrentUser(fresh);
                      })
                      .catch(() => {});
                  }
                }}
              />
            ) : null
          }
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
