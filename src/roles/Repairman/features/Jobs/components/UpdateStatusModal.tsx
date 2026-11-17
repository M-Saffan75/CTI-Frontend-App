import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import AlertModal from '@/components/AlertModal';
import Button from '@/components/Button';
import DatePickerModal, { toDateText } from '@/components/DatePickerModal';
import Icon from '@/components/Icon';
import KeyboardSafeView from '@/components/KeyboardSafeView';
import { calendarBold } from '@/assets/icons';
import repairmanApi, {
  StatusTransition,
  StatusUpdatePayload,
} from '@/roles/Repairman/api/repairmanApi';
import { normalizeApiError } from '@/services/apiError';
import { formatDate } from '@/utils/dateFormat';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

const MAX_NOTE = 500;
const MAX_REASON = 300;
const MAX_PARTS = 200;
const SCHEDULE_HOUR = 9;

interface Props {
  visible: boolean;
  bookingId: string;
  device: string;
  transitions: StatusTransition[];
  onClose: () => void;
  onUpdated: (message: string) => void;
}

// Only the steps the backend allows for the current status are offered (GET .../status-transitions).
// The extra fields follow what each step asks for (requiresData): a date to schedule, a reason to cancel,
// the parts that are needed. The note is always optional. There is no photo upload.
export default function UpdateStatusModal({
  visible,
  bookingId,
  device,
  transitions,
  onClose,
  onUpdated,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [selected, setSelected] = useState<StatusTransition | null>(null);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [parts, setParts] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);

  useEffect(() => {
    if (visible) {
      setSelected(null);
      setNotes('');
      setDate('');
      setReason('');
      setParts('');
      setErrors({});
      setError('');
    }
  }, [visible]);

  const needs = (field: string) =>
    Boolean(selected?.requiresData.includes(field));
  const clearError = (key: string) =>
    setErrors(prev => (prev[key] ? { ...prev, [key]: '' } : prev));

  const scheduledAt = (): Date | null => {
    const [y, m, d] = date.split('-').map(Number);
    if (!y || !m || !d) return null;
    const chosen = new Date(y, m - 1, d, SCHEDULE_HOUR, 0, 0);
    // today after 09:00: use the current time, so the date is never in the past
    return chosen.getTime() < Date.now() ? new Date() : chosen;
  };

  const submit = async () => {
    if (busy.current || !selected) return;

    const next: Record<string, string> = {};
    if (needs('scheduledDate') && !scheduledAt())
      next.date = i18n.t('repairmanMsg.dateRequired');
    if (needs('cancellationReason') && !reason.trim())
      next.reason = i18n.t('repairmanMsg.cancelReasonRequired');
    if (needs('partsInfo') && !parts.trim())
      next.parts = i18n.t('repairmanMsg.partsRequired');
    setErrors(next);
    if (Object.keys(next).length) return;

    const payload: StatusUpdatePayload = { status: selected.status };
    const note = notes.trim();
    if (needs('scheduledDate'))
      payload.scheduledDate = (scheduledAt() as Date).toISOString();
    if (needs('cancellationReason')) payload.cancellationReason = reason.trim();
    if (needs('partsInfo')) {
      payload.partsInfo = { partsRequired: [{ name: parts.trim() }] };
      payload.notes = [i18n.t('repairmanMsg.partsNeededNote', { parts: parts.trim() }), note]
        .filter(Boolean)
        .join('. ');
    } else if (note) {
      payload.notes = note;
    }

    busy.current = true;
    setSubmitting(true);
    try {
      const { message } = await repairmanApi.updateBookingStatus(
        bookingId,
        payload,
      );
      onUpdated(message || i18n.t('repairman.statusUpdated'));
    } catch (e) {
      setError(normalizeApiError(e).message);
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  };

  const cancelling = selected?.status === 'cancelled';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={submitting ? undefined : onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.backdrop }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={submitting ? undefined : onClose}
        />
        <KeyboardSafeView>
          <View style={styles.center} pointerEvents="box-none">
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.body}
              >
                <Text style={[styles.title, { color: colors.text }]}>
                  {t('repairman.updateStatus')}
                </Text>
                <Text
                  style={[styles.sub, { color: colors.textMuted }]}
                  numberOfLines={2}
                >
                  {device}
                </Text>

                <Text style={[styles.label, { color: colors.text }]}>
                  {t('repairman.nextStep')}
                </Text>
                {transitions.map(item => {
                  const active = selected?.status === item.status;
                  return (
                    <TouchableOpacity
                      key={item.status}
                      disabled={submitting}
                      onPress={() => {
                        setSelected(item);
                        setErrors({});
                      }}
                      style={[
                        styles.option,
                        {
                          backgroundColor: active
                            ? colors.primary + '14'
                            : colors.surfaceAlt,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          {
                            color:
                              item.status === 'cancelled'
                                ? colors.error
                                : active
                                ? colors.primary
                                : colors.text,
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                {needs('scheduledDate') && (
                  <View style={styles.field}>
                    <Text style={[styles.label, { color: colors.text }]}>
                      {i18n.t('repairman.serviceDate')}{' '}
                      <Text style={{ color: colors.error }}>*</Text>
                    </Text>
                    <TouchableOpacity
                      onPress={() => setPickerOpen(true)}
                      style={[
                        styles.input,
                        styles.dateRow,
                        {
                          backgroundColor: colors.surfaceAlt,
                          borderColor: errors.date
                            ? colors.error
                            : colors.surfaceAlt,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.inputText,
                          { color: date ? colors.text : colors.textMuted },
                        ]}
                      >
                        {date
                          ? formatDate(
                              new Date(`${date}T12:00:00`).toISOString(),
                            )
                          : t('repairman.selectTheDate')}
                      </Text>
                      <Icon
                        source={calendarBold}
                        size={16}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                    {errors.date ? (
                      <Text style={[styles.error, { color: colors.error }]}>
                        {errors.date}
                      </Text>
                    ) : null}
                  </View>
                )}

                {needs('partsInfo') && (
                  <View style={styles.field}>
                    <Text style={[styles.label, { color: colors.text }]}>
                      {i18n.t('repairmanMsg.partsNeededLabel')}{' '}
                      <Text style={{ color: colors.error }}>*</Text>
                    </Text>
                    <View
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.surfaceAlt,
                          borderColor: errors.parts
                            ? colors.error
                            : colors.surfaceAlt,
                        },
                      ]}
                    >
                      <TextInput
                        value={parts}
                        onChangeText={text => {
                          setParts(text);
                          clearError('parts');
                        }}
                        placeholder={t('repairman.forExampleScreenBattery')}
                        placeholderTextColor={colors.textMuted}
                        maxLength={MAX_PARTS}
                        editable={!submitting}
                        style={[styles.inputText, { color: colors.text }]}
                      />
                    </View>
                    {errors.parts ? (
                      <Text style={[styles.error, { color: colors.error }]}>
                        {errors.parts}
                      </Text>
                    ) : null}
                  </View>
                )}

                {needs('cancellationReason') && (
                  <View style={styles.field}>
                    <Text style={[styles.label, { color: colors.text }]}>
                      {i18n.t('repairmanMsg.cancelReasonLabel')}{' '}
                      <Text style={{ color: colors.error }}>*</Text>
                    </Text>
                    <View
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.surfaceAlt,
                          borderColor: errors.reason
                            ? colors.error
                            : colors.surfaceAlt,
                        },
                      ]}
                    >
                      <TextInput
                        value={reason}
                        onChangeText={text => {
                          setReason(text);
                          clearError('reason');
                        }}
                        placeholder={t('repairman.whyDoYouCancelThis')}
                        placeholderTextColor={colors.textMuted}
                        multiline
                        maxLength={MAX_REASON}
                        editable={!submitting}
                        style={[
                          styles.inputText,
                          styles.multiline,
                          { color: colors.text },
                        ]}
                      />
                    </View>
                    {errors.reason ? (
                      <Text style={[styles.error, { color: colors.error }]}>
                        {errors.reason}
                      </Text>
                    ) : null}
                    <Text style={[styles.hint, { color: colors.error }]}>
                      {t('repairman.theCustomerIsToldAnd')}
                    </Text>
                  </View>
                )}

                {selected ? (
                  <View style={styles.field}>
                    <Text style={[styles.label, { color: colors.text }]}>
                      {t('repairman.noteOptional')}
                    </Text>
                    <View
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.surfaceAlt,
                          borderColor: colors.surfaceAlt,
                        },
                      ]}
                    >
                      <TextInput
                        value={notes}
                        onChangeText={setNotes}
                        placeholder={t('repairman.addANoteForThe')}
                        placeholderTextColor={colors.textMuted}
                        multiline
                        maxLength={MAX_NOTE}
                        editable={!submitting}
                        style={[
                          styles.inputText,
                          styles.multiline,
                          { color: colors.text },
                        ]}
                      />
                    </View>
                  </View>
                ) : null}

                <View style={styles.actions}>
                  <Button
                    title={t('common.cancel')}
                    variant="outline"
                    size="sm"
                    style={styles.flex}
                    disabled={submitting}
                    onPress={onClose}
                  />
                  <Button
                    title={t('repairman.updateStatus')}
                    size="sm"
                    style={styles.flex}
                    color={cancelling ? colors.error : null}
                    disabled={!selected}
                    loading={submitting}
                    onPress={submit}
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardSafeView>

        <DatePickerModal
          visible={pickerOpen}
          title={t('repairman.serviceDate')}
          value={date}
          minDate={toDateText(new Date())}
          onSelect={picked => {
            setDate(picked);
            clearError('date');
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />

        <AlertModal
          visible={Boolean(error)}
          type="error"
          title={t('repairman.couldNotUpdate')}
          message={error}
          onClose={() => setError('')}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  flex: { flex: 1 },
  card: { borderRadius: 20, borderWidth: 1, maxHeight: '90%' },
  body: { padding: 20, gap: 8 },
  title: { fontFamily: fonts.bold, fontSize: 18 },
  sub: { fontFamily: fonts.regular, fontSize: 12 },
  label: { fontFamily: fonts.medium, fontSize: 13, marginTop: 8 },
  option: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionText: { fontFamily: fonts.bold, fontSize: 14 },
  field: { gap: 6 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputText: { fontFamily: fonts.regular, fontSize: 14, padding: 0 },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  error: { fontFamily: fonts.regular, fontSize: 12 },
  hint: { fontFamily: fonts.regular, fontSize: 11 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
});
