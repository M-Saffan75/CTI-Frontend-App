import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ErrorState, LoadingState } from '@/components/states';
import { ApiError } from '@/services/apiError';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useTranslation } from 'react-i18next';

interface Props {
  title: string;
  subtitle?: string;
  loading: boolean;
  error: ApiError | null;
  onRetry: () => void;
  children?: ReactNode;
  filter?: ReactNode;
}

// A dashboard card. Each card loads on its own, so one failed request never blanks the others.
export default function SectionCard({
  title,
  subtitle,
  loading,
  error,
  onRetry,
  children,
  filter,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {subtitle}
        </Text>
      ) : null}
      {filter}

      <View style={styles.body}>
        {loading ? (
          <LoadingState fullScreen={false} size="sm" text={t('common.loading')} />
        ) : error ? (
          <ErrorState
            error={error}
            onRetry={onRetry}
            fullScreen={false}
            title={t('repairman.couldNotLoad')}
            style={styles.error}
          />
        ) : (
          children
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 16 },
  title: { fontFamily: fonts.bold, fontSize: 16 },
  subtitle: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  body: { marginTop: 12 },
  error: { padding: 8 },
});
