import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { clockBold } from '@/assets/icons';
import { normalizeApiError } from '@/services/apiError';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/fonts';
import { SellerProfile, updateSellerProfileApi } from '../services/sellerProfileApi';
import EditModalShell, { useNotice } from './EditModalShell';
import { Field } from './FormParts';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { weekdayLongName } from '@/utils/dateFormat';

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

interface Props {
  visible: boolean;
  seller: SellerProfile;
  onClose: () => void;
  onSaved: () => void;
}

export default function ScheduleModal({ visible, seller, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { notice, show, clear } = useNotice();
  const [saving, setSaving] = useState(false);
  const [days, setDays] = useState<string[]>([]);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  useEffect(() => {
    if (!visible) return;
    setDays(seller.workingDays || []);
    setStart(seller.workingHours?.start || '');
    setEnd(seller.workingHours?.end || '');
  }, [visible, seller]);

  const toggle = (day: string) =>
    setDays(prev => (prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]));

  const handleSave = async () => {
    if (saving) return;
    const from = start.trim();
    const to = end.trim();

    if ((from && !TIME.test(from)) || (to && !TIME.test(to))) {
      return show('warning', i18n.t('sellerMsg.profileMsg.invalidTime'), i18n.t('sellerMsg.profileMsg.invalidTimeBody'));
    }
    if (Boolean(from) !== Boolean(to)) {
      return show('warning', i18n.t('sellerMsg.profileMsg.bothTimes'), i18n.t('sellerMsg.profileMsg.bothTimesBody'));
    }

    const originalDays = seller.workingDays || [];
    const daysChanged =
      days.length !== originalDays.length || days.some(day => !originalDays.includes(day));
    const hoursChanged =
      from !== (seller.workingHours?.start || '') || to !== (seller.workingHours?.end || '');

    if (!daysChanged && !hoursChanged) {
      return show('info', i18n.t('sellerMsg.profileMsg.noChanges'), i18n.t('sellerMsg.profileMsg.noChangesSchedule'));
    }

    setSaving(true);
    try {
      const message = await updateSellerProfileApi({
        ...(daysChanged ? { workingDays: DAYS.filter(day => days.includes(day)) } : {}),
        ...(hoursChanged ? { workingHours: { start: from, end: to } } : {}),
      });
      onSaved();
      show('success', 'Success', message || i18n.t('sellerAuto.workingScheduleUpdatedSuccessfully'));
    } catch (e) {
      show('error', i18n.t('sellerMsg.profileMsg.updateFailed'), normalizeApiError(e).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditModalShell
      visible={visible}
      title={t('sellerAuto.workingSchedule')}
      subtitle={t('sellerAuto.whenYourStoreIsOpen')}
      saving={saving}
      notice={notice}
      onClearNotice={clear}
      onClose={onClose}
      onSave={handleSave}>
      <View style={styles.group}>
        <Text style={[styles.label, { color: colors.text }]}>{t('sellerAuto.workingDays')}</Text>
        <View style={styles.days}>
          {DAYS.map(day => {
            const on = days.includes(day);
            return (
              <TouchableOpacity
                key={day}
                onPress={() => toggle(day)}
                style={[
                  styles.day,
                  {
                    backgroundColor: on ? colors.primary : colors.surfaceAlt,
                    borderColor: on ? colors.primary : colors.border,
                  },
                ]}>
                <Text style={[styles.dayText, { color: on ? colors.onPrimary : colors.text }]}>{weekdayLongName(day).slice(0, 3)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <Field label={t('sellerAuto.openingTime')} icon={clockBold} value={start} onChangeText={setStart} placeholder="09:00" keyboardType="numbers-and-punctuation" maxLength={5} />
      <Field label={t('sellerAuto.closingTime')} icon={clockBold} value={end} onChangeText={setEnd} placeholder="18:00" keyboardType="numbers-and-punctuation" maxLength={5} />
    </EditModalShell>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  label: { fontFamily: fonts.medium, fontSize: 13 },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  day: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  dayText: { fontFamily: fonts.medium, fontSize: 13 },
});
