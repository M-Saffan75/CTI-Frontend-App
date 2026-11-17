import { useEffect, useState } from 'react';

import { creditCardBold, fileBold, mapMarkerBold, storeBold, userBold } from '@/assets/icons';
import { normalizeApiError } from '@/services/apiError';
import { markSellerDataChanged } from '../../../utils/orderEvents';
import { SellerBank, SellerProfile, updateSellerProfileApi } from '../services/sellerProfileApi';
import EditModalShell, { useNotice } from './EditModalShell';
import { Field } from './FormParts';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

interface Props {
  visible: boolean;
  seller: SellerProfile;
  onClose: () => void;
  onSaved: () => void;
}

const FIELDS = ['accountTitle', 'accountNumber', 'bankName', 'branchName', 'iban'] as const;

const clean = (bank: SellerBank | undefined) => ({
  accountTitle: (bank?.accountTitle || '').trim(),
  accountNumber: (bank?.accountNumber || '').trim(),
  bankName: (bank?.bankName || '').trim(),
  branchName: (bank?.branchName || '').trim(),
  iban: (bank?.iban || '').replace(/\s/g, '').toUpperCase(),
});

export default function BankModal({ visible, seller, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const { notice, show, clear } = useNotice();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(clean(undefined));

  useEffect(() => {
    if (visible) setForm(clean(seller.bankDetails));
  }, [visible, seller]);

  const set = (key: keyof typeof form) => (value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (saving) return;
    const next = clean(form);

    if (!next.accountTitle) return show('warning', i18n.t('sellerMsg.profileMsg.accountTitleNeeded'), i18n.t('sellerMsg.profileMsg.accountTitleBody'));
    if (!next.accountNumber) return show('warning', i18n.t('sellerMsg.profileMsg.accountNumberNeeded'), i18n.t('sellerMsg.profileMsg.accountNumberBody'));
    if (!next.bankName) return show('warning', i18n.t('sellerMsg.profileMsg.bankNameNeeded'), i18n.t('sellerMsg.profileMsg.bankNameBody'));

    const original = clean(seller.bankDetails);
    if (FIELDS.every(key => next[key] === original[key])) {
      return show('info', i18n.t('sellerMsg.profileMsg.noChanges'), i18n.t('sellerMsg.profileMsg.noChangesBank'));
    }

    setSaving(true);
    try {
      // The backend replaces the whole bank block, so all five fields are always sent
      const message = await updateSellerProfileApi({ bankDetails: next });
      markSellerDataChanged();
      onSaved();
      show('success', 'Success', message || i18n.t('sellerAuto.bankDetailsUpdatedSuccessfully'));
    } catch (e) {
      show('error', i18n.t('sellerMsg.profileMsg.updateFailed'), normalizeApiError(e).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditModalShell
      visible={visible}
      title={t('sellerAuto.bankDetails')}
      subtitle={t('sellerAuto.usedForYourWalletWithdrawals')}
      saving={saving}
      notice={notice}
      onClearNotice={clear}
      onClose={onClose}
      onSave={handleSave}>
      <Field label={t('sellerAuto.accountTitle')} icon={userBold} value={form.accountTitle} onChangeText={set('accountTitle')} placeholder={t('sellerAuto.accountTitle2')} required maxLength={80} />
      <Field label={t('sellerAuto.accountNumber')} icon={creditCardBold} value={form.accountNumber} onChangeText={set('accountNumber')} placeholder={t('sellerAuto.accountNumber2')} required keyboardType="number-pad" maxLength={30} />
      <Field label={t('sellerAuto.bankName')} icon={storeBold} value={form.bankName} onChangeText={set('bankName')} placeholder={t('sellerAuto.bankName2')} required maxLength={80} />
      <Field label={t('sellerAuto.branchName')} icon={mapMarkerBold} value={form.branchName} onChangeText={set('branchName')} placeholder={t('sellerAuto.branchName2')} maxLength={80} />
      <Field label="IBAN" icon={fileBold} value={form.iban} onChangeText={set('iban')} placeholder="IBAN" autoCapitalize="none" maxLength={40} />
    </EditModalShell>
  );
}
