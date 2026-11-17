import { ReactElement, useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import AlertModal from '@/components/AlertModal';
import { EmptyState, ErrorState, LoadingState, OfflineBanner, PaginationFooter } from '@/components/states';
import { fileBold } from '@/assets/icons';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { getWebSellerImportExportUrl } from '@/constants/config';
import SellerScreenHeader from '@/roles/Seller/components/SellerScreenHeader';
import { fetchSellerImportHistoryApi, SellerImportRecord } from '@/roles/Seller/services/sellerApi';
import { formatDateTime, openWebsite } from '@/roles/Seller/utils/sellerUtils';
import { getStatusStyle, IMPORT_STATUS_STYLE } from '@/roles/Seller/utils/statusStyles';
import usePagedList from '@/roles/Seller/utils/usePagedList';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

const PAGE_SIZE = 10;

const ItemSeparator = () => <View style={styles.separator} />;

export default function ImportExportScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [webError, setWebError] = useState(false);

  const fetchPage = useCallback(async (page: number) => {
    const res = await fetchSellerImportHistoryApi({ page, limit: PAGE_SIZE });
    return {
      items: res.records,
      totalPages: res.pagination.totalPages,
      totalItems: res.pagination.totalItems,
    };
  }, []);

  const list = usePagedList<SellerImportRecord>(fetchPage);

  const openWeb = async () => {
    if (!(await openWebsite(getWebSellerImportExportUrl()))) setWebError(true);
  };

  const renderRecord = ({ item }: { item: SellerImportRecord }) => {
    const badge = getStatusStyle(IMPORT_STATUS_STYLE, item.status);
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardTop}>
          <Text style={[styles.fileName, { color: colors.text }]}>{item.fileName}</Text>
          <View style={[styles.badge, { backgroundColor: badge.color + '20' }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>
        <Text style={[styles.meta, { color: colors.textMuted }]}>{formatDateTime(item.createdAt)}</Text>
        <Text style={[styles.meta, { color: colors.text }]}>
          {i18n.t('sellerMsg.importLine', { total: item.totalProducts, imported: item.imported, skipped: item.skipped })}
        </Text>
        {item.errors.slice(0, 3).map((err, idx) => (
          <Text key={`${err.modelNumber}-${idx}`} style={[styles.meta, { color: colors.error }]}>
            {err.modelNumber ? `${err.modelNumber}: ` : ''}
            {err.reason}
          </Text>
        ))}
        {item.errors.length > 3 ? (
          <Text style={[styles.meta, { color: colors.textMuted }]}>{i18n.t('sellerMsg.moreErrors', { count: item.errors.length - 3 })}</Text>
        ) : null}
      </View>
    );
  };

  const header = (
    <View style={styles.headerWrap}>
      <SellerScreenHeader title={t('sellerAuto.importExport')} subtitle={t('sellerAuto.productsInCsvFiles')} onBack={() => navigation.goBack()} />
      <View style={[styles.infoBox, { backgroundColor: colors.primary + '12' }]}>
        <Text style={[styles.infoText, { color: colors.text }]}>
          {t('sellerAuto.importingAndExportingProductsAs')}
        </Text>
        <Button title={t('sellerAuto.openImportAndExportOn')} size="md" onPress={openWeb} />
      </View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('sellerAuto.importHistory')}</Text>
    </View>
  );

  let body: ReactElement | null = null;
  if (list.loading && list.items.length === 0) {
    body = <LoadingState text={t('sellerAuto.loadingHistory')} style={styles.stateWrap} />;
  } else if (list.error && list.items.length === 0) {
    body = <ErrorState error={list.error} onRetry={list.retry} style={styles.stateWrap} />;
  } else if (list.items.length === 0) {
    body = (
      <EmptyState
        icon={fileBold}
        title={t('sellerAuto.noImportsYet')}
        message={t('sellerAuto.importsYouMakeOnThe')}
        style={styles.stateWrap}
      />
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <OfflineBanner />
      <FlatList
        data={list.items}
        keyExtractor={item => item.id}
        renderItem={renderRecord}
        ListHeaderComponent={header}
        ListEmptyComponent={body}
        ListFooterComponent={<PaginationFooter loading={list.loadingMore} hasMore={list.hasMore} />}
        ItemSeparatorComponent={ItemSeparator}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        onEndReached={list.onEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={list.refreshing}
            onRefresh={list.onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
      <AlertModal
        visible={webError}
        type="error"
        title={t('sellerAuto.couldNotOpenTheWebsite')}
        message={i18n.t('sellerMsg.openUrlIn', { url: getWebSellerImportExportUrl() })}
        onClose={() => setWebError(false)}
      />
      <AlertModal
        visible={!!list.loadError}
        type="error"
        title={t('sellerAuto.couldNotLoadHistory')}
        message={list.loadError || ''}
        onClose={list.clearLoadError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { paddingHorizontal: 16, flexGrow: 1 },
  separator: { height: 12 },
  stateWrap: { paddingVertical: 40 },
  headerWrap: { gap: 14, marginBottom: 14 },
  infoBox: { borderRadius: 14, padding: 14, gap: 12 },
  infoText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 16 },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 6 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  fileName: { flex: 1, fontFamily: fonts.bold, fontSize: 14 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontFamily: fonts.medium, fontSize: 12 },
  meta: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17 },
});
