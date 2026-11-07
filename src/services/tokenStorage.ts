import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_SERVICE = 'com.cti.auth.token';
const REFRESH_TOKEN_SERVICE = 'com.cti.auth.refreshToken';

// Legacy keys previously stored in AsyncStorage
const LEGACY_TOKEN_KEY = 'token';
const LEGACY_REFRESH_TOKEN_KEY = 'refreshToken';
const LEGACY_AUTH_KEY = 'auth';

let migrationPromise: Promise<void> | null = null;

/**
 * Migrate legacy tokens from AsyncStorage to Keychain once on launch.
 * Reads existing token, writes to secure Keychain, and deletes from AsyncStorage.
 * Keeps non-sensitive profile and role preferences in AsyncStorage.
 */
export async function migrateTokensFromAsyncStorage(): Promise<void> {
  if (migrationPromise) {
    return migrationPromise;
  }

  migrationPromise = (async () => {
    try {
      const [oldToken, oldRefreshToken, oldAuthStr] = await Promise.all([
        AsyncStorage.getItem(LEGACY_TOKEN_KEY),
        AsyncStorage.getItem(LEGACY_REFRESH_TOKEN_KEY),
        AsyncStorage.getItem(LEGACY_AUTH_KEY),
      ]);

      let tokenToMigrate = oldToken;
      let refreshTokenToMigrate = oldRefreshToken;

      if (oldAuthStr) {
        try {
          const parsed = JSON.parse(oldAuthStr);
          if (!tokenToMigrate) {
            tokenToMigrate = parsed?.token || parsed?.tokens?.accessToken;
          }
          if (!refreshTokenToMigrate) {
            refreshTokenToMigrate = parsed?.refreshToken || parsed?.tokens?.refreshToken;
          }

          // Strip sensitive tokens from legacy auth object in AsyncStorage, preserving user & role
          if (parsed && (parsed.token || parsed.refreshToken || parsed.tokens)) {
            delete parsed.token;
            delete parsed.refreshToken;
            delete parsed.tokens;
            await AsyncStorage.setItem(LEGACY_AUTH_KEY, JSON.stringify(parsed));
          }
        } catch {
          // Ignore JSON parse errors
        }
      }

      // If legacy token exists, write to keychain if keychain doesn't already have one
      if (tokenToMigrate) {
        const existingKeychain = await Keychain.getGenericPassword({ service: TOKEN_SERVICE });
        if (!existingKeychain) {
          await Keychain.setGenericPassword('auth_token', tokenToMigrate, {
            service: TOKEN_SERVICE,
            accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
          });
        }
      }

      if (refreshTokenToMigrate) {
        const existingRefresh = await Keychain.getGenericPassword({ service: REFRESH_TOKEN_SERVICE });
        if (!existingRefresh) {
          await Keychain.setGenericPassword('refresh_token', refreshTokenToMigrate, {
            service: REFRESH_TOKEN_SERVICE,
            accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
          });
        }
      }

      // Always remove plaintext tokens from AsyncStorage
      await Promise.all([
        AsyncStorage.removeItem(LEGACY_TOKEN_KEY),
        AsyncStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY),
      ]);
    } catch (error) {
      if (__DEV__) {
        console.warn('[tokenStorage] Token migration failed gracefully:', error);
      }
    }
  })();

  return migrationPromise;
}

/**
 * Retrieve the current JWT auth token securely from Keychain.
 * Auto-triggers legacy migration if not yet run.
 */
export async function getToken(): Promise<string | null> {
  try {
    await migrateTokensFromAsyncStorage();
    const credentials = await Keychain.getGenericPassword({ service: TOKEN_SERVICE });
    if (credentials && credentials.password) {
      return credentials.password;
    }
    return null;
  } catch {
    if (__DEV__) {
      console.warn('[tokenStorage] Error getting token from keychain');
    }
    return null;
  }
}

/**
 * Store the JWT auth token securely in Keychain.
 * Never writes token to AsyncStorage.
 */
export async function setToken(token: string): Promise<boolean> {
  try {
    if (!token) {
      return await clearToken();
    }
    await Keychain.setGenericPassword('auth_token', token, {
      service: TOKEN_SERVICE,
      accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
    });
    // Ensure legacy AsyncStorage token is wiped
    await AsyncStorage.removeItem(LEGACY_TOKEN_KEY).catch(() => {});
    return true;
  } catch {
    if (__DEV__) {
      console.warn('[tokenStorage] Error setting token in keychain');
    }
    return false;
  }
}

/**
 * Clear the JWT auth token from Keychain and legacy storage.
 */
export async function clearToken(): Promise<boolean> {
  try {
    await Keychain.resetGenericPassword({ service: TOKEN_SERVICE });
    await AsyncStorage.removeItem(LEGACY_TOKEN_KEY).catch(() => {});
    return true;
  } catch {
    if (__DEV__) {
      console.warn('[tokenStorage] Error clearing token from keychain');
    }
    return false;
  }
}

/**
 * Retrieve the refresh token securely from Keychain.
 */
export async function getRefreshToken(): Promise<string | null> {
  try {
    await migrateTokensFromAsyncStorage();
    const credentials = await Keychain.getGenericPassword({ service: REFRESH_TOKEN_SERVICE });
    if (credentials && credentials.password) {
      return credentials.password;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Store refresh token securely in Keychain.
 */
export async function setRefreshToken(refreshToken: string): Promise<boolean> {
  try {
    if (!refreshToken) {
      return await clearRefreshToken();
    }
    await Keychain.setGenericPassword('refresh_token', refreshToken, {
      service: REFRESH_TOKEN_SERVICE,
      accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK,
    });
    await AsyncStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear the refresh token from Keychain.
 */
export async function clearRefreshToken(): Promise<boolean> {
  try {
    await Keychain.resetGenericPassword({ service: REFRESH_TOKEN_SERVICE });
    await AsyncStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear all auth credentials from Keychain and legacy AsyncStorage.
 */
export async function clearAllTokens(): Promise<void> {
  await Promise.all([
    clearToken(),
    clearRefreshToken(),
  ]);
}

export const tokenStorage = {
  getToken,
  setToken,
  clearToken,
  getRefreshToken,
  setRefreshToken,
  clearAllTokens,
  migrateTokensFromAsyncStorage,
};

export default tokenStorage;

