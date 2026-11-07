import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import CtiLoader, { CtiLoaderSize } from '@/components/CtiLoader';

export interface LoadingStateProps {
  /** Optional message displayed below the loader */
  text?: string;
  /** Size variant or pixel dimension */
  size?: CtiLoaderSize;
  /** Whether to expand flex: 1 and occupy the full screen/container */
  fullScreen?: boolean;
  /** Optional custom container style */
  style?: StyleProp<ViewStyle>;
}

export default function LoadingState({
  text = 'Loading...',
  size = 'md',
  fullScreen = true,
  style,
}: LoadingStateProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen, style]}>
      <CtiLoader size={size} text={text} fullScreen={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fullScreen: {
    flex: 1,
  },
});

