import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AlertModal, { AlertModalType } from '@/components/AlertModal';
import Button from '@/components/Button';
import ConfirmModal from '@/components/ConfirmModal';
import Icon from '@/components/Icon';
import Squeeze from '@/components/Squeeze';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PaginationFooter,
} from '@/components/states';
import { arrowLeftBold, searchBold, toolExtra } from '@/assets/icons';
import {
  getWebRepairmanServiceAddUrl,
  getWebRepairmanServiceEditUrl,
} from '@/constants/config';
import repairmanApi, {
  RepairmanService,
  ServiceApproval,
} from '@/roles/Repairman/api/repairmanApi';
import { markOffersChanged } from '@/roles/Repairman/utils/offerEvents';
import { openWebsite } from '@/roles/Seller/utils/sellerUtils';
import usePagedList from '@/roles/Seller/utils/usePagedList';
import { normalizeApiError } from '@/services/apiError';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import RepairmanHeader from '../../../components/RepairmanHeader';
import ServiceCard from '../components/ServiceCard';
import { STATUS_FILTERS, serviceDevice } from '../utils/services';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

const PAGE_SIZE = 10;

type Notice = { type: AlertModalType; title: string; message: string };

export default function ServiceCatalogScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();

  const [status, setStatus] = useState<ServiceApproval | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RepairmanService | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [linkFailed, setLinkFailed] = useState('');
  const busy = useRef(false);

  const fetchPage = useCallback(
    async (page: number) => {
      const data = await repairmanApi.getServices({
        page,
        limit: PAGE_SIZE,
        status,
      });
      return {
        items: data.data,
        totalPages: data.pagination.pages,
        totalItems: data.pagination.total,
      };
    },
    [status],
  );
  const list = usePagedList<RepairmanService>(fetchPage, focused);

  const query = search.trim().toLowerCase();
  const shown = query
    ? list.items.filter(
        service =>
          service.title?.toLowerCase().includes(query) ||
          service.description?.toLowerCase().includes(query) ||
          serviceDevice(service).toLowerCase().includes(query),
      )
    : list.items;

  const openWeb = async (url: string) => {
    if (!(await openWebsite(url))) setLinkFailed(url);
  };

  const toggle = async (service: RepairmanService) => {
    if (busy.current) return;
    busy.current = true;
    setTogglingId(service._id);
    try {
      const { message, service: updated } = await repairmanApi.toggleService(
        service._id,
      );
      list.updateItem(item => item._id === service._id, {
        isActive: updated?.isActive ?? !service.isActive,
      });
      markOffersChanged();
      setNotice({
        type: 'success',
        title: i18n.t('repairman.serviceUpdated'),
        message:
          message ||
          i18n.t(service.isActive ? 'repairmanMsg.serviceNowInactive' : 'repairmanMsg.serviceNowActive'),
      });
    } catch (e) {
      setNotice({
        type: 'error',
        title: i18n.t('repairman.couldNotUpdate'),
        message: normalizeApiError(e).message,
      });
      list.silentReload();
    } finally {
      busy.current = false;
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {
    const target = deleteTarget;
    if (!target || busy.current) return;
    busy.current = true;
    setDeleting(true);
    setDeleteTarget(null);
    try {
      const message = await repairmanApi.deleteService(target._id);
      list.removeItem(item => item._id === target._id);
      markOffersChanged();
      setNotice({
        type: 'success',
        title: i18n.t('repairman.serviceDeleted'),
        message: message || i18n.t('repairman.theServiceWasDeleted'),
      });
    } catch (e) {
      setNotice({
        type: 'error',
        title: i18n.t('repairman.couldNotDelete'),
        message: normalizeApiError(e).message,
      });
      list.silentReload();
    } finally {
      busy.current = false;
      setDeleting(false);
    }
  };

  const header = (
    <View>
      <Squeeze onPress={() => navigation.goBack()} scale={0.95}>
        <View style={styles.backWrap}>
          <Icon source={arrowLeftBold} size={16} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>{t('common.back')}</Text>
        </View>
      </Squeeze>

      <Text style={[styles.title, { color: colors.text }]}>
        {t('repairman.serviceCatalog')}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        {t('repairman.manageTheServicesYouOffer')}
      </Text>

      <Button
        title={t('repairman.addServiceOnWebsite')}
        icon={toolExtra}
        iconPosition="left"
        size="sm"
        style={styles.add}
        onPress={() => openWeb(getWebRepairmanServiceAddUrl())}
      />

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

      <View style={[styles.search, { borderColor: colors.border }]}>
        <Icon source={searchBold} size={18} color={colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('repairman.searchServicesOrDevices')}
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      {list.total ? (
        <Text style={[styles.count, { color: colors.textMuted }]}>
          {i18n.t('repairmanMsg.showingServices', { shown: shown.length, total: list.total })}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <RepairmanHeader navigation={navigation} />
      <FlatList
        data={shown}
        keyExtractor={service => service._id}
        renderItem={({ item }) => (
          <ServiceCard
            service={item}
            toggling={togglingId === item._id}
            onToggle={() => toggle(item)}
            onEdit={() => openWeb(getWebRepairmanServiceEditUrl(item._id))}
            onDelete={() => setDeleteTarget(item)}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          list.loading ? (
            <LoadingState fullScreen={false} text={t('repairman.loadingServices')} />
          ) : list.error ? (
            <ErrorState
              error={list.error}
              onRetry={list.retry}
              fullScreen={false}
            />
          ) : (
            <EmptyState
              fullScreen={false}
              title={t('repairman.noServicesFound')}
              message={
                query || status
                  ? t('repairman.tryAnotherFilterOrSearch')
                  : t('repairman.youHavenTAddedAny')
              }
              icon={toolExtra}
              action={
                query || status
                  ? {
                      label: t('repairman.clearFilters'),
                      onPress: () => {
                        setSearch('');
                        setStatus(undefined);
                      },
                    }
                  : {
                      label: t('repairman.addServiceOnWebsite'),
                      onPress: () => openWeb(getWebRepairmanServiceAddUrl()),
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
              endText={t('repairman.youHaveSeenAllServices')}
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
            refreshing={list.refreshing || deleting}
            onRefresh={list.onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />

      <ConfirmModal
        visible={Boolean(deleteTarget)}
        title={t('repairman.deleteService')}
        message={i18n.t('repairmanMsg.deleteServiceMsg', { title: deleteTarget?.title || '' })}
        cancelText={t('repairman.keepIt')}
        confirmText={t('common.delete')}
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
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

      <AlertModal
        visible={Boolean(linkFailed)}
        type="info"
        title={t('repairman.openOnTheWebsite')}
        message={i18n.t('settings.openAddress', { url: linkFailed })}
        onClose={() => setLinkFailed('')}
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
  add: { marginTop: 14, alignSelf: 'flex-start' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  chip: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { fontFamily: fonts.medium, fontSize: 12 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginTop: 14,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 13, padding: 0 },
  count: { fontFamily: fonts.regular, fontSize: 12, marginTop: 10 },
});
