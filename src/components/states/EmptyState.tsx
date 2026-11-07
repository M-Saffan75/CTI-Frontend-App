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
import { inboxBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

export interface EmptyStateAction {
  label: string;
  onPress: () => void;
  loading?: boolean;
}

export interface EmptyStateProps {
  /** Main heading. Defaults to "No data found" */
  title?: string;
  /** Optional secondary explanatory message */
  message?: string;
  /** Optional icon to display. Defaults to inboxBold */
  icon?: ImageSourcePropType;
  /** Optional CTA button */
  action?: EmptyStateAction;
  /** Whether to occupy flex: 1 */
  fullScreen?: boolean;
  /** Optional container style */
  style?: StyleProp<ViewStyle>;
}

export default function EmptyState({
  title = 'No data found',
  message,
  icon = inboxBold,
  action,
  fullScreen = true,
  style,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, fullScreen && styles.fullScreen, style]}>
      {Boolean(icon) && (
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
          ]}>
          <Icon source={icon} size={32} color={colors.textMuted} />
        </View>
      )}

      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

      {Boolean(message) && (
        <Text style={[styles.message, { color: colors.textMuted }]}>
          {message}
        </Text>
      )}

      {Boolean(action) && (
        <Button
          title={action!.label}
          size="md"
          loading={action!.loading}
          onPress={action!.onPress}
          style={styles.actionButton}
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
    maxWidth: 280,
  },
  actionButton: {
    marginTop: 18,
    minWidth: 140,
  },
});
