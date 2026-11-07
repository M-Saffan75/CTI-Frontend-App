import React, { useEffect, useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import Icon from '@/components/Icon';
import { infoCircleBold } from '@/assets/icons';

export interface OfflineBannerProps {
  /** Optional custom message */
  message?: string;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
}

export default function OfflineBanner({
  message = 'No internet connection. Waiting for network...',
  style,
}: OfflineBannerProps) {
  const { colors } = useTheme();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Read initial status
    NetInfo.fetch().then(state => {
      const offline = state.isConnected === false || state.isInternetReachable === false;
      setIsOffline(offline);
    });

    // Listen to network transitions
    const unsubscribe = NetInfo.addEventListener(state => {
      const offline = state.isConnected === false || state.isInternetReachable === false;
      setIsOffline(offline);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: colors.error, borderColor: colors.error },
        style,
      ]}>
      <Icon source={infoCircleBold} size={15} color="#FFFFFF" />
      <Text style={styles.text} numberOfLines={2}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
    width: '100%',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: fonts.medium,
    flexShrink: 1,
    textAlign: 'center',
  },
});

