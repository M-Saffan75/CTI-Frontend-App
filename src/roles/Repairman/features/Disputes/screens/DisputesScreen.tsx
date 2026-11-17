import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AlertModal from '@/components/AlertModal';
import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PaginationFooter,
} from '@/components/states';
import { arrowLeftBold, exclamationCircleBold } from '@/assets/icons';
import repairmanApi, {
  DisputeStatus,
  RepairmanDispute,
} from '@/roles/Repairman/api/repairmanApi';
import {
  subscribeOffersChanged,
  useOffersChangedChecker,
} from '@/roles/Repairman/utils/offerEvents';
import usePagedList from '@/roles/Seller/utils/usePagedList';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import RepairmanHeader from '../../../components/RepairmanHeader';
import DisputeCard from '../components/DisputeCard';
import { STATUS_FILTERS } from '../utils/disputes';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

const PAGE_SIZE = 10;

export default function DisputesScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const [status, setStatus] = useState<DisputeStatus | undefined>(undefined);

  const fetchPage = useCallback(
    async (page: number) => {
      const data = await repairmanApi.getMyDisputes({
        page,
        limit: PAGE_SIZE,
        status,
      });
      return {
        items: data.data,
        totalPages: data.pagination.totalPages,
        totalItems: data.pagination.totalDisputes,
      };
    },
    [status],
  );
  const changed = useOffersChangedChecker();
  const list = usePagedList<RepairmanDispute>(
    fetchPage,
    focused,
    true,
    changed,
  );

  const silentReloadRef = useRef(list.silentReload);
  silentReloadRef.current = list.silentReload;
  const focusedRef = useRef(focused);
  focusedRef.current = focused;
  useEffect(
    () =>
      subscribeOffersChanged(() => {
        if (focusedRef.current && changed()) silentReloadRef.current();
      }),
    [changed],
  );

  const header = (
    <View>
      <Squeeze onPress={() => navigation.goBack()} scale={0.95}>
        <View style={styles.backWrap}>
          <Icon source={arrowLeftBold} size={16} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>{t('common.back')}</Text>
        </View>
      </Squeeze>

      <Text style={[styles.title, { color: colors.text }]}>{t('repairman.disputes')}</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        {t('repairman.disputesOnYourJobsOpen')}
      </Text>

      <View style={styles.chips}>
        {STATUS_FILTERS.map(filter => {
          const active = filter.value === status;
          return (
            <TouchableOpacity
              key={filter.label}
              onPress={() => setStatus(filter.value)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.primary : colors.surfaceAlt,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: active ? colors.onPrimary : colors.textMuted },
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {list.total ? (
        <Text style={[styles.count, { color: colors.textMuted }]}>
          {i18n.t('repairmanMsg.showingDisputes', { shown: list.items.length, total: list.total })}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <RepairmanHeader navigation={navigation} />
      <FlatList
        data={list.items}
        keyExtractor={dispute => dispute._id}
        renderItem={({ item }) => (
          <DisputeCard
            dispute={item}
            onOpen={() =>
              navigation.navigate('DisputeDetail', { disputeId: item._id })
            }
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          list.loading ? (
            <LoadingState fullScreen={false} text={t('repairman.loadingDisputes')} />
          ) : list.error ? (
            <ErrorState
              error={list.error}
              onRetry={list.retry}
              fullScreen={false}
            />
          ) : (
            <EmptyState
              fullScreen={false}
              title={t('repairman.noDisputes')}
              message={
                status
                  ? t('repairman.noDisputesWithThisStatus')
                  : t('repairman.youHaveNoDisputesThat')
              }
              icon={exclamationCircleBold}
              action={
                status
                  ? {
                      label: t('repairman.showAll'),
                      onPress: () => setStatus(undefined),
                    }
                  : undefined
              }
            />
          )
        }
        ListFooterComponent={
          list.items.length > 0 ? (
            <PaginationFooter
              loading={list.loadingMore}
              hasMore={list.hasMore}
              endText={t('repairman.youHaveSeenAllDisputes')}
            />
          ) : null
        }
        contentContainerStyle={[
          styles.body,
          { paddingBottom: insets.bottom + 30 },
        ]}
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
        visible={Boolean(list.loadError)}
        type="error"
        title={t('repairman.couldNotLoad')}
        message={list.loadError || ''}
        onClose={list.clearLoadError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 20, paddingTop: 8 },
  backWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  backText: { flexShrink: 1, fontFamily: fonts.medium, fontSize: 14 },
  title: { fontFamily: fonts.bold, fontSize: 24, marginTop: 4 },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  chip: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { fontFamily: fonts.medium, fontSize: 12 },
  count: { fontFamily: fonts.regular, fontSize: 12, marginTop: 10 },
});
