import { useEffect, useState } from 'react';

import {
  commentDotsBold,
  facebookIcon,
  filmBold,
  globeBold,
  imageBold,
  linkedinIcon,
  twitterIcon,
  videoBold,
} from '@/assets/icons';
import { normalizeApiError } from '@/services/apiError';
import { SellerProfile, SellerSocial, SocialKey, updateSellerProfileApi } from '../services/sellerProfileApi';
import EditModalShell, { useNotice } from './EditModalShell';
import { Field } from './FormParts';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

export const SOCIAL_LINKS: { key: SocialKey; label: string; icon: number; placeholder: string; brand?: boolean }[] = [
  { key: 'facebook', get label() { return i18n.t('sellerAuto.facebook'); }, icon: facebookIcon, brand: true, placeholder: 'https://facebook.com/yourpage' },
  { key: 'instagram', get label() { return i18n.t('sellerAuto.instagram'); }, icon: imageBold, placeholder: 'https://instagram.com/yourprofile' },
  { key: 'twitter', get label() { return i18n.t('sellerAuto.xTwitter'); }, icon: twitterIcon, brand: true, placeholder: 'https://x.com/yourhandle' },
  { key: 'linkedin', get label() { return i18n.t('sellerAuto.linkedin'); }, icon: linkedinIcon, brand: true, placeholder: 'https://linkedin.com/in/yourprofile' },
  { key: 'whatsapp', get label() { return i18n.t('profile.whatsapp'); }, icon: commentDotsBold, placeholder: 'https://wa.me/905551234567' },
  { key: 'youtube', get label() { return i18n.t('sellerAuto.youtube'); }, icon: videoBold, placeholder: 'https://youtube.com/@yourchannel' },
  { key: 'tiktok', get label() { return i18n.t('sellerAuto.tiktok'); }, icon: filmBold, placeholder: 'https://tiktok.com/@yourprofile' },
  { key: 'website', get label() { return i18n.t('sellerAuto.website'); }, icon: globeBold, placeholder: 'https://yourstore.com' },
];

interface Props {
  visible: boolean;
  seller: SellerProfile;
  onClose: () => void;
  onSaved: () => void;
}

const toForm = (links?: SellerSocial) =>
  SOCIAL_LINKS.reduce(
    (acc, { key }) => ({ ...acc, [key]: (links?.[key] || '').trim() }),
    {} as Record<SocialKey, string>,
  );

export default function SocialModal({ visible, seller, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const { notice, show, clear } = useNotice();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(toForm());

  useEffect(() => {
    if (visible) setForm(toForm(seller.socialLinks));
  }, [visible, seller]);

  const handleSave = async () => {
    if (saving) return;
    const original = toForm(seller.socialLinks);
    const changed: SellerSocial = {};

    for (const { key, label } of SOCIAL_LINKS) {
      const value = form[key].trim();
      if (value && !/^https?:\/\/\S+$/i.test(value)) {
        return show('warning', i18n.t('sellerMsg.profileMsg.invalidLink'), i18n.t('sellerMsg.profileMsg.invalidLinkBody', { label }));
      }
      if (value !== original[key]) changed[key] = value;
    }

    if (Object.keys(changed).length === 0) {
      return show('info', i18n.t('sellerMsg.profileMsg.noChanges'), i18n.t('sellerMsg.profileMsg.noChangesSocial'));
    }

    setSaving(true);
    try {
      const message = await updateSellerProfileApi({ socialLinks: changed });
      onSaved();
      show('success', 'Success', message || i18n.t('sellerAuto.socialLinksUpdatedSuccessfully'));
    } catch (e) {
      show('error', i18n.t('sellerMsg.profileMsg.updateFailed'), normalizeApiError(e).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditModalShell
      visible={visible}
      title={t('sellerAuto.socialLinks')}
      subtitle={t('sellerAuto.shownOnYourStoreProfile')}
      saving={saving}
      notice={notice}
      onClearNotice={clear}
      onClose={onClose}
      onSave={handleSave}>
      {SOCIAL_LINKS.map(item => (
        <Field
          key={item.key}
          label={item.label}
          icon={item.icon}
          brandIcon={item.brand}
          value={form[item.key]}
          onChangeText={text => setForm(prev => ({ ...prev, [item.key]: text }))}
          placeholder={item.placeholder}
          keyboardType="url"
          autoCapitalize="none"
          maxLength={200}
        />
      ))}
    </EditModalShell>
  );
}
