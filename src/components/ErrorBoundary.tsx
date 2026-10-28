import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';

import Icon from '@/components/Icon';
import { exclamationCircleBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { themes } from '@/theme/colors';
import { fonts } from '@/theme/fonts';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function ErrorFallback({
  onRestart,
  error,
}: {
  onRestart: () => void;
  error: Error | null;
}) {
  const systemScheme = useColorScheme();
  let colors = systemScheme === 'dark' ? themes.black : themes.white;

  try {
    const theme = useTheme();
    if (theme?.colors) {
      colors = theme.colors;
    }
  } catch {
    // If mounted outside ThemeProvider, use system scheme fallback
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowColor: colors.text,
          },
        ]}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: colors.error + '18' },
          ]}>
          <Icon source={exclamationCircleBold} size={36} color={colors.error} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Something went wrong</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          An unexpected error occurred. Please try reloading this screen.
        </Text>

        {__DEV__ && error?.message ? (
          <View
            style={[
              styles.devBox,
              { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
            ]}>
            <Text style={[styles.devText, { color: colors.textMuted }]} numberOfLines={3}>
              {error.message}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={onRestart}
          activeOpacity={0.85}>
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          onRestart={this.handleRestart}
          error={this.state.error}
        />
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 6,
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
  },
  devBox: {
    width: '100%',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  devText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: fonts.bold,
    fontSize: 15,
  },
});
