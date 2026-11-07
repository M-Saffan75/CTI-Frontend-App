import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import CtiLoader from '@/components/CtiLoader';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';

export interface PaginationFooterProps {
  /** Whether the next page is currently being fetched */
  loading?: boolean;
  /** Whether there are more pages available */
  hasMore?: boolean;
  /** Optional message when all pages have been loaded */
  endText?: string;
  /** Optional container style */
  style?: StyleProp<ViewStyle>;
}

export default function PaginationFooter({
  loading = false,
  hasMore = true,
  endText,
  style,
}: PaginationFooterProps) {
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <CtiLoader size="xs" text="Loading more..." />
      </View>
    );
  }

  if (!hasMore && endText) {
    return (
      <View style={[styles.container, style]}>
        <Text style={[styles.endText, { color: colors.textMuted }]}>
          {endText}
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    textAlign: 'center',
  },
});

