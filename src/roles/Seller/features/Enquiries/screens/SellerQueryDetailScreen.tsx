import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import AlertModal, { AlertModalType } from '@/components/AlertModal';
import ConfirmModal from '@/components/ConfirmModal';
import { ErrorState, LoadingState, OfflineBanner } from '@/components/states';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import InitialsAvatar from '@/roles/Seller/components/InitialsAvatar';
import SellerScreenHeader from '@/roles/Seller/components/SellerScreenHeader';
import {
  fetchSellerQueryDetailApi,
  replySellerQueryApi,
  SellerQueryDetail,
  SellerQueryMessage,
  updateSellerQueryStatusApi,
} from '@/roles/Seller/services/sellerApi';
import {
  formatDate,
  formatDateTime,
  formatMoney,
  markEnquiriesDirty,
  openWebsite,
} from '@/roles/Seller/utils/sellerUtils';
import { markSellerDataChanged } from '@/roles/Seller/utils/orderEvents';
import { getStatusStyle, ORDER_STATUS_STYLE, queryStatusLabel } from '@/roles/Seller/utils/statusStyles';
import KeyboardSafeView, { useKeyboardVisible } from '@/components/KeyboardSafeView';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

interface AlertState {
  visible: boolean;
  type: AlertModalType;
  title: string;
  message: string;
}

const HIDDEN_ALERT: AlertState = { visible: false, type: 'info', title: '', message: '' };


export default function SellerQueryDetailScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const queryId: string = route?.params?.queryId;

  const [query, setQuery] = useState<SellerQueryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [alert, setAlert] = useState<AlertState>(HIDDEN_ALERT);
  const mounted = useRef(true);
  const scrollRef = useRef<ScrollView>(null);
  const sendingRef = useRef(false);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyboardOpen = useKeyboardVisible(() => {
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
  });
  useEffect(
    () => () => {
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
    },
    [],
  );

  const showAlert = (type: AlertModalType, title: string, message: string) =>
    setAlert({ visible: true, type, title, message });

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (mode === 'refresh') setRefreshing(true);
      else {
        setLoading(true);
        setError(null);
      }
      try {
        const result = await fetchSellerQueryDetailApi(queryId);
        if (!mounted.current) return;
        setQuery(result);
        markEnquiriesDirty();
      } catch (err: any) {
        if (!mounted.current) return;
        const message = err?.message || i18n.t('sellerAuto.couldNotLoadThisEnquiry');
        if (mode === 'initial') setError(message);
        else showAlert('error', i18n.t('customer.couldNotRefresh'), message);
      } finally {
        if (mounted.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [queryId],
  );

  useEffect(() => {
    mounted.current = true;
    load('initial');
    return () => {
      mounted.current = false;
    };
  }, [load]);

  const handleReply = async () => {
    const text = reply.trim();
    if (!query || !text || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    try {
      const res = await replySellerQueryApi(query.id, text);
      if (!mounted.current) return;
      setQuery(prev => (prev ? { ...prev, status: res.status, messages: res.messages } : prev));
      setReply('');
      markEnquiriesDirty();
      markSellerDataChanged();
    } catch (err: any) {
      if (!mounted.current) return;
      showAlert('error', i18n.t('sellerAuto.replyNotSent'), err?.message || i18n.t('sellerAuto.couldNotSendYourReply'));
      // The enquiry may have been closed meanwhile, so show its real state
      load('refresh');
    } finally {
      sendingRef.current = false;
      if (mounted.current) setSending(false);
    }
  };

  const changeStatus = async (status: 'open' | 'closed') => {
    if (!query || statusBusy) return;
    setConfirmClose(false);
    setStatusBusy(true);
    try {
      const res = await updateSellerQueryStatusApi(query.id, status);
      if (!mounted.current) return;
      setQuery(prev => (prev ? { ...prev, status: res.status } : prev));
      markEnquiriesDirty();
      markSellerDataChanged();
      showAlert('success', status === 'closed' ? i18n.t('sellerAuto.queryClosed') : i18n.t('sellerAuto.queryReopened'), res.message || '');
    } catch (err: any) {
      if (!mounted.current) return;
      showAlert('error', i18n.t('sellerAuto.updateFailed'), err?.message || i18n.t('sellerAuto.couldNotUpdateTheEnquiry'));
    } finally {
      if (mounted.current) setStatusBusy(false);
    }
  };

  const openAttachment = async (url: string) => {
    const opened = await openWebsite(url);
    if (!opened && mounted.current) {
      showAlert('info', i18n.t('sellerAuto.openInYourBrowser'), i18n.t('sellerMsg.openFileFailed', { url }));
    }
  };

  const renderMessage = (msg: SellerQueryMessage, index: number, all: SellerQueryMessage[]) => {
    const day = formatDate(msg.createdAt);
    const showDay = index === 0 || formatDate(all[index - 1].createdAt) !== day;
    const mine = msg.fromSeller;
    return (
      <View key={msg.id}>
        {showDay ? <Text style={[styles.day, { color: colors.textMuted }]}>{day}</Text> : null}
        <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
          <View
            style={[
              styles.bubble,
              mine
                ? { backgroundColor: colors.primary }
                : [styles.bubbleBorder, { backgroundColor: colors.surface, borderColor: colors.border }],
            ]}>
            <Text style={[styles.sender, { color: mine ? colors.onPrimary : colors.textMuted }]}>
              {msg.senderName || (mine ? i18n.t('seller.cancelledBy.seller') : i18n.t('glossary.customer'))}
            </Text>
            <Text style={[styles.messageText, { color: mine ? colors.onPrimary : colors.text }]}>{msg.message}</Text>
            {msg.attachments.length > 0 ? (
              <View style={styles.attachments}>
                {msg.attachments.map(url => (
                  <Pressable key={url} onPress={() => openAttachment(url)}>
                    <Image source={{ uri: url }} style={[styles.attachment, { backgroundColor: colors.surfaceAlt }]} />
                  </Pressable>
                ))}
              </View>
            ) : null}
            <Text style={[styles.time, { color: mine ? colors.onPrimary : colors.textMuted }]}>
              {formatDateTime(msg.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderBody = () => {
    if (loading) return <LoadingState text={i18n.t('sellerAuto.loadingEnquiry')} style={styles.stateWrap} />;
    if (error || !query) {
      return <ErrorState error={error || i18n.t('sellerAuto.enquiryNotFound')} onRetry={() => load('initial')} style={styles.stateWrap} />;
    }

    const statusColor =
      query.status === 'closed' ? colors.textMuted : query.status === 'replied' ? colors.primary : colors.success;
    const orderStatus = query.orderStatus ? getStatusStyle(ORDER_STATUS_STYLE, query.orderStatus) : null;

    return (
      <>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.customerRow}>
            <InitialsAvatar name={query.customer.name || i18n.t('glossary.customer')} photo={query.customer.photo} size={44} />
            <View style={styles.flex1}>
              <Text style={[styles.customerName, { color: colors.text }]}>{query.customer.name || i18n.t('glossary.customer')}</Text>
              <Text style={[styles.subject, { color: colors.textMuted }]}>{query.subject}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.badgeText, { color: statusColor }]}>{queryStatusLabel(query.status)}</Text>
            </View>
          </View>

          <InfoRow label={i18n.t('sellerAuto.queryId')} value={query.queryId} />
          <InfoRow label={i18n.t('sellerAuto.created')} value={formatDateTime(query.createdAt)} />
          {query.customer.email ? <InfoRow label={i18n.t('sellerAuto.email')} value={query.customer.email} /> : null}
          {query.customer.phone ? <InfoRow label={i18n.t('sellerAuto.phone')} value={query.customer.phone} /> : null}
          {query.type === 'order' ? (
            <>
              <InfoRow label={i18n.t('sellerAuto.orderNo')} value={query.orderNo || '-'} />
              {orderStatus ? <InfoRow label={i18n.t('sellerAuto.orderStatus')} value={orderStatus.label} /> : null}
              {query.orderAmount !== null ? <InfoRow label={i18n.t('sellerAuto.amount')} value={formatMoney(query.orderAmount)} /> : null}
              {query.orderId ? (
                <Button
                  title={i18n.t('sellerAuto.viewOrder')}
                  size="sm"
                  variant="outline"
                  onPress={() => navigation?.navigate('SellerOrderDetail', { orderId: query.orderId })}
                />
              ) : null}
            </>
          ) : null}

          {query.status === 'closed' ? (
            <Button
              title={i18n.t('sellerAuto.reopenQuery')}
              size="sm"
              variant="outline"
              loading={statusBusy}
              onPress={() => changeStatus('open')}
            />
          ) : (
            <Button
              title={i18n.t('sellerAuto.closeQuery')}
              size="sm"
              variant="outline"
              color={colors.error}
              loading={statusBusy}
              onPress={() => setConfirmClose(true)}
            />
          )}
        </View>

        <View style={styles.thread}>
          {query.messages.length === 0 ? (
            <Text style={[styles.empty, { color: colors.textMuted }]}>{i18n.t('chat.noMessagesYet')}</Text>
          ) : (
            query.messages.map(renderMessage)
          )}
        </View>
      </>
    );
  };

  const isClosed = query?.status === 'closed';

  return (
    <KeyboardSafeView
      style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top + 8 }]}>
      <OfflineBanner />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load('refresh')}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        <SellerScreenHeader
          title={t('glossary.enquiry')}
          subtitle={query?.type === 'order' ? t('sellerAuto.orderQuestion') : t('sellerAuto.productQuestion')}
          onBack={() => navigation?.goBack()}
        />
        {renderBody()}
      </ScrollView>

      {query ? (
        <View
          style={[
            styles.composer,
            { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: keyboardOpen ? 10 : insets.bottom + 10 },
          ]}>
          {isClosed ? (
            <Text style={[styles.closedText, { color: colors.textMuted }]}>
              {t('sellerAuto.thisQueryIsClosedReopen')}
            </Text>
          ) : (
            <>
              <TextInput
                value={reply}
                onChangeText={setReply}
                placeholder={t('sellerAuto.typeYourReply')}
                placeholderTextColor={colors.textMuted}
                multiline
                editable={!sending}
                style={[
                  styles.input,
                  { color: colors.text, backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}
              />
              <Button
                title={t('common.send')}
                size="md"
                fullWidth={false}
                loading={sending}
                disabled={!reply.trim()}
                onPress={handleReply}
              />
            </>
          )}
        </View>
      ) : null}

      <ConfirmModal
        visible={confirmClose}
        title={t('sellerAuto.closeThisQuery')}
        message={t('sellerAuto.theCustomerWillNotBe')}
        confirmText={t('sellerAuto.closeQuery')}
        danger
        onConfirm={() => changeStatus('closed')}
        onCancel={() => setConfirmClose(false)}
      />

      <AlertModal
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert(HIDDEN_ALERT)}
      />
    </KeyboardSafeView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  useTranslation();
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex1: { flex: 1 },
  container: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 16, gap: 14, flexGrow: 1 },
  stateWrap: { paddingVertical: 60 },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  customerName: { fontFamily: fonts.bold, fontSize: 15 },
  subject: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2, lineHeight: 17 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontFamily: fonts.bold, fontSize: 11 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  infoLabel: { fontFamily: fonts.regular, fontSize: 13 },
  infoValue: { flexShrink: 1, textAlign: 'right', fontFamily: fonts.medium, fontSize: 13 },
  thread: { gap: 10 },
  empty: { textAlign: 'center', fontFamily: fonts.medium, fontSize: 13, paddingVertical: 20 },
  day: { textAlign: 'center', fontFamily: fonts.medium, fontSize: 11, marginVertical: 8 },
  bubbleRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '85%', borderRadius: 16, padding: 12, gap: 4 },
  bubbleBorder: { borderWidth: 1 },
  sender: { fontFamily: fonts.bold, fontSize: 11 },
  messageText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  attachments: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  attachment: { width: 70, height: 70, borderRadius: 8 },
  time: { fontFamily: fonts.regular, fontSize: 10, opacity: 0.8, alignSelf: 'flex-end' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  closedText: { flex: 1, textAlign: 'center', fontFamily: fonts.medium, fontSize: 13, paddingVertical: 8 },
});
