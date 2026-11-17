import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AlertModal, { AlertModalType } from '@/components/AlertModal';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PaginationFooter,
} from '@/components/states';
import { searchBold, slidersHBold } from '@/assets/icons';
import repairmanApi, { MyOffer } from '@/roles/Repairman/api/repairmanApi';
import {
  markOffersChanged,
  subscribeOffersChanged,
  useOffersChangedChecker,
} from '@/roles/Repairman/utils/offerEvents';
import usePagedList from '@/roles/Seller/utils/usePagedList';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import Select from '../../../components/Select';
import MyOfferCard from '../components/MyOfferCard';
import WithdrawOfferModal from '../components/WithdrawOfferModal';
import { PRIORITY_OPTIONS } from '../utils/jobBoard';
import { OFFER_STATUS_OPTIONS, offerTitle } from '../utils/offers';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

const PAGE_SIZE = 10;

export default function MyOffersContent({ navigation }: { navigation: any }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<
    (typeof OFFER_STATUS_OPTIONS)[number] | null
  >(null);
  const [priority, setPriority] = useState<
    (typeof PRIORITY_OPTIONS)[number] | null
  >(null);
  const [withdrawTarget, setWithdrawTarget] = useState<MyOffer | null>(null);
  const [notice, setNotice] = useState<{
    type: AlertModalType;
    title: string;
    message: string;
  } | null>(null);

  // The status filter is sent to the backend like the web. The backend applies its search and priority filters to one
  // page only and returns wrong page counts, so those two filter the loaded offers in the app instead.
  const fetchPage = useCallback(
    async (page: number) => {
      const data = await repairmanApi.getMyOffers({
        page,
        limit: PAGE_SIZE,
        status: status?.value,
      });
      const items = data.offers.filter(
        offer => offer.jobId && offer.status !== 'in_progress',
      );
      return {
        items,
        // The backend page count is always 1, so a full page means there may be one more
        totalPages: data.offers.length >= PAGE_SIZE ? page + 1 : page,
        totalItems: data.pagination.totalOffers,
      };
    },
    [status],
  );

  const offersChanged = useOffersChangedChecker();
  const list = usePagedList<MyOffer>(fetchPage, focused, true, offersChanged);

  // A proposal was sent, withdrawn or answered while this list is open: reload quietly
  const silentReloadRef = useRef(list.silentReload);
  silentReloadRef.current = list.silentReload;
  const focusedRef = useRef(focused);
  focusedRef.current = focused;
  useEffect(
    () =>
      subscribeOffersChanged(() => {
        if (focusedRef.current && offersChanged()) silentReloadRef.current();
      }),
    [offersChanged],
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return list.items.filter(offer => {
      if (priority && offer.jobId?.urgency !== priority.value) return false;
      if (!term) return true;
      return (
        offerTitle(offer).toLowerCase().includes(term) ||
        (offer.description || '').toLowerCase().includes(term)
      );
    });
  }, [list.items, search, priority]);

  const hasFilters = Boolean(search.trim() || status || priority);
  const clearFilters = () => {
    setSearch('');
    setStatus(null);
    setPriority(null);
  };

  const header = (
    <View>
      <Text style={[styles.title, { color: colors.text }]}>{t('repairman.myOffers')}</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        {t('repairman.manageYourProposals')}
      </Text>

      <View style={styles.filters}>
        <View style={[styles.search, { borderColor: colors.border }]}>
          <Icon source={searchBold} size={18} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('repairman.searchByDeviceOrDescription')}
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>
        <View style={styles.row}>
          <Select
            placeholder={t('repairman.allStatus')}
            value={status?.label || null}
            options={OFFER_STATUS_OPTIONS.map(o => o.label)}
            onChange={label =>
              setStatus(
                OFFER_STATUS_OPTIONS.find(o => o.label === label) || null,
              )
            }
          />
          <Select
            icon={slidersHBold}
            placeholder={t('repairman.allPriorities')}
            value={priority?.label || null}
            options={PRIORITY_OPTIONS.map(o => o.label)}
            onChange={label =>
              setPriority(PRIORITY_OPTIONS.find(o => o.label === label) || null)
            }
          />
        </View>
        {hasFilters ? (
          <Button
            title={t('repairman.clearFilters2')}
            variant="soft"
            size="sm"
            onPress={clearFilters}
            style={styles.clear}
          />
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={styles.flex}>
      <FlatList
        data={visible}
        keyExtractor={offer => offer._id}
        renderItem={({ item }) => (
          <MyOfferCard
            offer={item}
            onOpen={() =>
              navigation.navigate('MyOfferDetail', {
                offerId: item._id,
                offer: item,
              })
            }
            onWithdraw={() => setWithdrawTarget(item)}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          list.loading ? (
            <LoadingState fullScreen={false} text={t('repairman.fetchingYourOffers')} />
          ) : list.error ? (
            <ErrorState
              error={list.error}
              onRetry={list.retry}
              fullScreen={false}
            />
          ) : (
            <EmptyState
              fullScreen={false}
              title={t('repairman.noOffersFound')}
              message={
                hasFilters
                  ? t('repairman.tryAdjustingYourFilters')
                  : t('repairman.youHaveNotSentAny')
              }
              action={
                hasFilters
                  ? { label: t('repairman.clearAllFilters'), onPress: clearFilters }
                  : {
                      label: t('repairman.openJobBoard'),
                      onPress: () =>
                        navigation.navigate('JobsTab', {
                          tab: 'JobBoard',
                          at: Date.now(),
                        }),
                    }
              }
            />
          )
        }
        ListFooterComponent={
          list.items.length > 0 ? (
            <PaginationFooter
              loading={list.loadingMore}
              hasMore={list.hasMore}
              endText={t('repairman.youHaveSeenAllOffers')}
            />
          ) : null
        }
        contentContainerStyle={[
          styles.body,
          { paddingBottom: insets.bottom + 30 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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

      <WithdrawOfferModal
        visible={Boolean(withdrawTarget)}
        offerId={withdrawTarget?._id || ''}
        title={withdrawTarget ? offerTitle(withdrawTarget) : ''}
        onClose={() => setWithdrawTarget(null)}
        onWithdrawn={message => {
          setWithdrawTarget(null);
          setNotice({ type: 'success', title: i18n.t('repairman.offerWithdrawn'), message });
          // This list reloads, the Job Board shows the job again, the Dashboard counts change
          markOffersChanged();
        }}
      />

      <AlertModal
        visible={Boolean(notice) || Boolean(list.loadError)}
        type={notice?.type || 'error'}
        title={notice?.title || t('repairman.couldNotLoad')}
        message={notice?.message || list.loadError || ''}
        onClose={() => {
          setNotice(null);
          list.clearLoadError();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { paddingHorizontal: 20, paddingTop: 16 },
  title: { fontFamily: fonts.bold, fontSize: 24 },
  subtitle: { fontFamily: fonts.regular, fontSize: 13, marginTop: 4 },
  filters: { marginTop: 16, gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  clear: { alignSelf: 'flex-start', minWidth: 130 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 13, padding: 0 },
});
