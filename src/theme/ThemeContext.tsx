import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { StatusBar, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { captureRef } from 'react-native-view-shot';

import ThemeReveal from './ThemeReveal';
import { themes } from './colors';

const STORAGE_KEY = 'app.theme';
const DEFAULT_THEME = 'white';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeName, setName] = useState(DEFAULT_THEME);
  const [ready, setReady] = useState(false);
  const [reveal, setReveal] = useState(null);
  const root = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(saved => {
        if (saved && themes[saved]) setName(saved);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const apply = name => {
    setName(name);
    AsyncStorage.setItem(STORAGE_KEY, name).catch(() => {});
  };

  const snap = () => captureRef(root, { format: 'jpg', quality: 0.9 });

  /**
   * `origin` is where the user tapped, in screen coordinates. Without it the
   * theme just swaps with no animation.
   */
  const setThemeName = async (name, origin = null) => {
    if (!themes[name] || name === themeName) return;

    if (!origin) {
      apply(name);
      return;
    }

    try {
      // Freeze how the app looks right now. Nothing changes yet — the theme is
      // only switched once this frozen image has actually painted (onCovered),
      // otherwise the new theme flashes through while the image is loading.
      const oldUri = await snap();
      setReveal({ oldUri, newUri: null, x: origin.x, y: origin.y, next: name });
    } catch {
      apply(name);
    }
  };

  // The old screenshot is now covering everything, so switch the theme behind it
  // and photograph the result for the circle to reveal.
  const onCovered = () => {
    if (!reveal?.next) return;
    apply(reveal.next);

    setTimeout(async () => {
      try {
        const newUri = await snap();
        setReveal(current => current && { ...current, newUri });
      } catch {
        setReveal(null);
      }
    }, 80);
  };

  if (!ready) return null;

  const colors = themes[themeName];

  return (
    <ThemeContext.Provider value={{ colors, themeName, setThemeName }}>
      {/* Android 15 forces edge-to-edge, so backgroundColor is ignored here —
          only barStyle still does anything. */}
      <StatusBar barStyle={colors.barStyle} />

      {/* collapsable={false} is required or Android has nothing to screenshot. */}
      <View ref={root} collapsable={false} style={styles.root}>
        {children}
      </View>

      {reveal && (
        <ThemeReveal {...reveal} onCovered={onCovered} onDone={() => setReveal(null)} />
      )}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error('useTheme() was called outside <ThemeProvider>. Wrap the app in App.tsx.');
  }

  return value;
}

const styles = { root: { flex: 1 } };
