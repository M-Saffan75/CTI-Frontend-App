import React from 'react';
import {
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import Icon from '@/components/Icon';
import Button from '@/components/Button';
import { exclamationCircleBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { ApiError } from '@/services/apiError';

export interface ErrorStateProps {
  /** Error instance or normalized string */
  error?: string | ApiError | Error | null;
  /** Callback when Retry button is tapped */
  onRetry?: () => void;
  /** Title heading */
  title?: string;
  /** Label for retry button */
  retryLabel?: string;
  /** Loading state on retry button */
  retrying?: boolean;
  /** Optional custom icon */
  icon?: ImageSourcePropType;
  /** Expand flex: 1 */
  fullScreen?: boolean;
  /** Optional custom container style */
  style?: StyleProp<ViewStyle>;
}

export default function ErrorState({
  error,
  onRetry,
  title = 'Something went wrong',
  retryLabel = 'Try Again',
  retrying = false,
  icon = exclamationCircleBold,
  fullScreen = true,
  style,
}: ErrorStateProps) {
  const { colors } = useTheme();

  let message = 'An unexpected error occurred. Please try again.';
  if (typeof error === 'string' && error.trim().length > 0) {
    message = error;
  } else if (error && typeof error === 'object' && 'message' in error && error.message) {
    message = error.message;
  }

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen, style]}>
      {Boolean(icon) && (
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: colors.error + '14', borderColor: colors.error + '30' },
          ]}>
          <Icon source={icon} size={32} color={colors.error} />
        </View>
      )}

      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

      <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>

      {Boolean(onRetry) && (
        <Button
          title={retryLabel}
          size="md"
          loading={retrying}
          onPress={onRetry}
          style={styles.retryButton}
        />
      )}
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
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: fonts.bold,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    fontFamily: fonts.regular,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 300,
  },
  retryButton: {
    marginTop: 18,
    minWidth: 140,
  },
});
