import { ReactNode, useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

// Android 15 and newer (the app targets API 36) always draw edge to edge, so the system no longer
// shrinks the window for the keyboard and adjustResize does nothing. Older Android still shrinks
// the window itself, so nothing may be added there or the keyboard gap would be counted twice.
const SYSTEM_RESIZES = Platform.OS === 'android' && Number(Platform.Version) < 35;

const SHOW_EVENT = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
const HIDE_EVENT = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

// True while the keyboard is open. onShow runs each time it opens (scroll to the newest message).
export function useKeyboardVisible(onShow?: () => void): boolean {
  const [visible, setVisible] = useState(false);
  const onShowRef = useRef(onShow);
  onShowRef.current = onShow;

  useEffect(() => {
    const show = Keyboard.addListener(SHOW_EVENT, () => {
      setVisible(true);
      onShowRef.current?.();
    });
    const hide = Keyboard.addListener(HIDE_EVENT, () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return visible;
}

interface Props {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}

// Keeps the content above the keyboard on every platform and Android version.
// The bottom padding is exactly the part of this view that the keyboard covers.
export default function KeyboardSafeView({ style, children }: Props) {
  const ref = useRef<View>(null);
  const [covered, setCovered] = useState(0);
  // The extra inner view must lay out its children the same way as the outer one (a bottom sheet uses flex-end)
  const justifyContent = StyleSheet.flatten(style)?.justifyContent;

  useEffect(() => {
    if (Platform.OS !== 'android' || SYSTEM_RESIZES) return;
    const show = Keyboard.addListener('keyboardDidShow', event => {
      ref.current?.measureInWindow((_x, y, _w, height) => {
        setCovered(Math.max(0, y + height - event.endCoordinates.screenY));
      });
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setCovered(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView behavior="padding" style={[{ flex: 1 }, style]}>
        {children}
      </KeyboardAvoidingView>
    );
  }

  return (
    <View ref={ref} collapsable={false} style={[{ flex: 1 }, style]}>
      <View style={{ flex: 1, paddingBottom: covered, justifyContent }}>{children}</View>
    </View>
  );
}
