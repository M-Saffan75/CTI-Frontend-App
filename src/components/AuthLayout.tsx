import { useEffect, useRef } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Title from '@/components/Title';
import Paragraph from '@/components/Paragraph';
import { FadeUp } from '@/animations';
import { ctiLogo } from '@/assets/images';
import { useTheme } from '@/theme/ThemeContext';

// The logo + title + subtitle block is identical on all five auth screens.
export default function AuthLayout({ title, subtitle = null, children }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scroll = useRef(null);

  // The manifest uses adjustResize, so Android shrinks the window when the
  // keyboard opens — but nothing scrolls on its own, leaving the submit button
  // out of sight. Scrolling to the end on keyboard-open brings it back.
  useEffect(() => {
    // iOS fires a "will" event ahead of the keyboard sliding up, so the scroll
    // rides along with it. Android only has the "did" event.
    const event = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const show = Keyboard.addListener(event, () => {
      scroll.current?.scrollToEnd({ animated: true });
    });
    return () => show.remove();
  }, []);

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        ref={scroll}
        contentContainerStyle={[styles.body, { paddingTop: insets.top + 60 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Image source={ctiLogo} resizeMode="contain" style={styles.logo} />

        <FadeUp>
          <Title>{title}</Title>
          {subtitle && <Paragraph style={styles.subtitle}>{subtitle}</Paragraph>}
        </FadeUp>

        <View style={styles.content}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  logo: {
    alignSelf: 'center',
    width: '30%',
    height: 64,
    marginBottom: 22,
  },
  subtitle: {
    marginTop: 8,
  },
  content: {
    marginTop: 28,
  },
});
