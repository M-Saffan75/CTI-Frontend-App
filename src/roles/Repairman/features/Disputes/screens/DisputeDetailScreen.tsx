import { lower } from '@/i18n/locale';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AlertModal, { AlertModalType } from '@/components/AlertModal';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import KeyboardSafeView from '@/components/KeyboardSafeView';
import useRefreshOnActive from '@/utils/useRefreshOnActive';
import Squeeze from '@/components/Squeeze';
import { ErrorState, LoadingState } from '@/components/states';
import {
  arrowLeftBold,
  commentDotsBold,
  dummyProfileExtra,
  exclamationCircleBold,
  userBold,
} from '@/assets/icons';
import repairmanApi, {
  DisputeResponse,
} from '@/roles/Repairman/api/repairmanApi';
import useApiData from '@/roles/Repairman/utils/useApiData';
import { openWebsite } from '@/roles/Seller/utils/sellerUtils';
import { normalizeApiError } from '@/services/apiError';
import { formatDate, formatDateTime } from '@/utils/dateFormat';
import { formatMoney } from '@/utils/money';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import RepairmanHeader from '../../../components/RepairmanHeader';
import {
  resolutionLabel,
  bookingIdOf,
  canReply,
  categoryLabel,
  otherParty,
  priorityLabel,
  priorityTone,
  raisedByMe,
  statusLabel,
  statusTone,
} from '../utils/disputes';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

const MAX_REPLY = 1000;

function Card({
  icon,
  title,
  children,
}: {
  icon: number;
  title: string;
  children: ReactNode;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.cardHead}>
        <Icon source={icon} size={16} color={colors.primary} />
        <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Line({ label, value }: { label: string; value?: string | null }) {
  const { colors } = useTheme();
  if (!value) return null;

  return (
    <View style={styles.line}>
      <Text style={[styles.lineLabel, { color: colors.textMuted }]}>
        {label}
      </Text>
      <Text style={[styles.lineValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function Message({ response }: { response: DisputeResponse }) {
  const { colors } = useTheme();
  const role = response.respondedBy?.userType;
  const mine = role === 'repairman';
  const person = response.respondedBy?.userId;
  const name = mine
    ? i18n.t('repairman.you')
    : role === 'admin'
    ? i18n.t('repairmanMsg.support')
    : person?.name || i18n.t('glossary.customer');
  const files = (response.evidenceFiles || []).filter(file => file.fileUrl);

  return (
    <View
      style={[
        styles.message,
        {
          backgroundColor: mine ? colors.primary + '14' : colors.surfaceAlt,
          borderColor: mine ? colors.primary : colors.border,
        },
      ]}
    >
      <View style={styles.messageHead}>
        <Image
          source={
            person?.profilePicture
              ? { uri: person.profilePicture }
              : dummyProfileExtra
          }
          style={[styles.avatar, { borderColor: colors.avatarBorder }]}
        />
        <View style={styles.flex}>
          <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            {formatDateTime(response.respondedAt)}
          </Text>
        </View>
      </View>
      <Text style={[styles.lineValue, { color: colors.text }]}>
        {response.message}
      </Text>
      {files.map((file, index) => (
        <TouchableOpacity
          key={`${file.fileUrl}-${index}`}
          onPress={() => openWebsite(file.fileUrl || '')}
        >
          <Text style={[styles.link, { color: colors.primary }]}>
            {i18n.t('repairmanMsg.attachment', { n: index + 1 })}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function DisputeDetailScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const disputeId: string = route.params?.disputeId;

  const detail = useApiData(
    () => repairmanApi.getDispute(disputeId),
    [disputeId],
  );
  const [refreshing, setRefreshing] = useState(false);
  const [reply, setReply] = useState('');
  const [replyError, setReplyError] = useState('');
  const [sending, setSending] = useState(false);
  const busy = useRef(false);
  const [notice, setNotice] = useState<{
    type: AlertModalType;
    title: string;
    message: string;
  } | null>(null);

  const dispute = detail.data;

  // The backend sends no notification for dispute replies, so the screen reloads quietly when it comes back into view or the app returns
  const isFocused = useIsFocused();
  const markLoaded = useRefreshOnActive(isFocused, () => {
    detail.reload(true);
  });
  useEffect(() => {
    if (detail.data) markLoaded();
  }, [detail.data, markLoaded]);

  const onRefresh = async () => {
    setRefreshing(true);
    const error = await detail.reload(true);
    setRefreshing(false);
    if (error)
      setNotice({
        type: 'error',
        title: i18n.t('customer.couldNotRefresh'),
        message: error.message,
      });
  };

  const send = async () => {
    if (busy.current) return;
    const text = reply.trim();
    if (!text) {
      setReplyError(i18n.t('repairman.writeYourReplyFirst'));
      return;
    }
    busy.current = true;
    setSending(true);
    try {
      const message = await repairmanApi.respondToDispute(disputeId, text);
      setReply('');
      setReplyError('');
      setNotice({
        type: 'success',
        title: i18n.t('repairman.replySent'),
        message: message || i18n.t('repairman.yourReplyWasAdded'),
      });
      detail.reload(true);
    } catch (e) {
      setNotice({
        type: 'error',
        title: i18n.t('repairman.couldNotSend'),
        message: normalizeApiError(e).message,
      });
      // the dispute may have been closed meanwhile: show the real state
      detail.reload(true);
    } finally {
      busy.current = false;
      setSending(false);
    }
  };

  const customer = dispute ? otherParty(dispute)?.userId : null;
  const bookingId = dispute ? bookingIdOf(dispute) : '';
  const status = dispute ? colors[statusTone(dispute.status)] : colors.primary;
  const priority = dispute
    ? colors[priorityTone(dispute.priority)]
    : colors.primary;
  const resolution = dispute?.resolution;
  const open = dispute ? canReply(dispute) : false;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <RepairmanHeader navigation={navigation} />

      {detail.loading && !dispute ? (
        <LoadingState text={t('repairman.loadingDispute')} />
      ) : detail.error || !dispute ? (
        <ErrorState
          error={detail.error}
          onRetry={() => detail.reload()}
          fullScreen
        />
      ) : (
        <KeyboardSafeView>
          <ScrollView
            contentContainerStyle={[
              styles.body,
              { paddingBottom: insets.bottom + 30 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          >
            <Squeeze onPress={() => navigation.goBack()} scale={0.95}>
              <View style={styles.backWrap}>
                <Icon source={arrowLeftBold} size={16} color={colors.primary} />
                <Text style={[styles.backText, { color: colors.primary }]}>
                  {t('repairman.backToDisputes')}
                </Text>
              </View>
            </Squeeze>

            <Text style={[styles.title, { color: colors.text }]}>
              {categoryLabel(dispute.category)}
            </Text>
            <Text style={[styles.meta, { color: colors.textMuted }]}>
              {dispute.disputeId} • {formatDate(dispute.createdAt)}
            </Text>
            <View style={styles.pills}>
              <View style={[styles.pill, { backgroundColor: status + '22' }]}>
                <Text style={[styles.pillText, { color: status }]}>
                  {statusLabel(dispute.status)}
                </Text>
              </View>
              {dispute.priority ? (
                <View
                  style={[styles.pill, { backgroundColor: priority + '22' }]}
                >
                  <Text style={[styles.pillText, { color: priority }]}>
                    {i18n.t('repairmanMsg.priorityTitle', { priority: priorityLabel(dispute.priority) })}
                  </Text>
                </View>
              ) : null}
            </View>

            {bookingId ? (
              <Button
                title={t('repairman.viewJob')}
                variant="outline"
                size="sm"
                style={styles.action}
                onPress={() =>
                  navigation.navigate('MyJobDetail', { bookingId })
                }
              />
            ) : null}

            <Card icon={exclamationCircleBold} title={t('glossary.dispute')}>
              <Text style={[styles.lineValue, { color: colors.text }]}>
                {dispute.description}
              </Text>
              <Line
                label={t('repairman.raisedBy')}
                value={raisedByMe(dispute) ? t('repairman.you') : t('repairman.theCustomer')}
              />
              <Line label={t('repairman.job')} value={dispute.jobId?.title} />
            </Card>

            <Card icon={userBold} title={t('glossary.customer')}>
              <View style={styles.messageHead}>
                <Image
                  source={
                    customer?.profilePicture
                      ? { uri: customer.profilePicture }
                      : dummyProfileExtra
                  }
                  style={[styles.avatar, { borderColor: colors.avatarBorder }]}
                />
                <View style={styles.flex}>
                  <Text style={[styles.name, { color: colors.text }]}>
                    {customer?.name || i18n.t('glossary.customer')}
                  </Text>
                  {customer?.phone ? (
                    <Text style={[styles.meta, { color: colors.textMuted }]}>
                      {customer.phone}
                    </Text>
                  ) : null}
                </View>
              </View>
            </Card>

            {resolution?.resolutionType ? (
              <Card icon={exclamationCircleBold} title={t('repairman.resolution')}>
                <Line
                  label={t('repairman.decision')}
                  value={
                    resolutionLabel(resolution.resolutionType)
                  }
                />
                {resolution.refundAmount ? (
                  <Line
                    label={t('glossary.refund')}
                    value={formatMoney(resolution.refundAmount)}
                  />
                ) : null}
                <Line label={t('repairman.notes')} value={resolution.resolutionNotes} />
                <Line
                  label={t('repairman.resolved')}
                  value={formatDate(resolution.resolvedAt)}
                />
              </Card>
            ) : null}

            <Card icon={commentDotsBold} title={t('repairman.conversation')}>
              {dispute.responses?.length ? (
                dispute.responses.map((response, index) => (
                  <Message key={response._id || index} response={response} />
                ))
              ) : (
                <Text style={[styles.meta, { color: colors.textMuted }]}>
                  {t('repairman.noRepliesYet')}
                </Text>
              )}
            </Card>

            {open ? (
              <Card icon={commentDotsBold} title={t('repairman.yourReply')}>
                <View
                  style={[
                    styles.inputBox,
                    {
                      backgroundColor: colors.surfaceAlt,
                      borderColor: replyError
                        ? colors.error
                        : colors.surfaceAlt,
                    },
                  ]}
                >
                  <TextInput
                    value={reply}
                    onChangeText={value => {
                      setReply(value);
                      setReplyError('');
                    }}
                    placeholder={t('repairman.writeYourReply')}
                    placeholderTextColor={colors.textMuted}
                    multiline
                    maxLength={MAX_REPLY}
                    editable={!sending}
                    style={[styles.input, { color: colors.text }]}
                  />
                </View>
                {replyError ? (
                  <Text style={[styles.meta, { color: colors.error }]}>
                    {replyError}
                  </Text>
                ) : null}
                <Button
                  title={t('repairman.sendReply')}
                  loading={sending}
                  disabled={!reply.trim()}
                  onPress={send}
                />
              </Card>
            ) : (
              <Text style={[styles.closed, { color: colors.textMuted }]}>
                {i18n.t('repairmanMsg.disputeClosedNote', { status: lower(statusLabel(dispute.status)) })}
              </Text>
            )}
          </ScrollView>
        </KeyboardSafeView>
      )}

      <AlertModal
        visible={Boolean(notice)}
        type={notice?.type || 'info'}
        title={notice?.title || ''}
        message={notice?.message || ''}
        onClose={() => setNotice(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  flex: { flex: 1 },
  body: { paddingHorizontal: 20, paddingTop: 8 },
  backWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  backText: { flexShrink: 1, fontFamily: fonts.medium, fontSize: 14 },
  title: { fontFamily: fonts.bold, fontSize: 22, marginTop: 4 },
  meta: { fontFamily: fonts.regular, fontSize: 12 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  pill: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontFamily: fonts.bold, fontSize: 11 },
  action: { marginTop: 14, alignSelf: 'flex-start' },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginTop: 14,
    gap: 10,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 15 },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  lineLabel: { fontFamily: fonts.regular, fontSize: 13 },
  lineValue: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'left',
  },
  message: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 8 },
  messageHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, borderWidth: 1 },
  name: { fontFamily: fonts.bold, fontSize: 13 },
  link: { fontFamily: fonts.medium, fontSize: 13 },
  inputBox: { borderRadius: 12, borderWidth: 1, padding: 12 },
  input: {
    minHeight: 100,
    textAlignVertical: 'top',
    fontFamily: fonts.regular,
    fontSize: 14,
    padding: 0,
  },
  closed: {
    fontFamily: fonts.regular,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 18,
  },
});
