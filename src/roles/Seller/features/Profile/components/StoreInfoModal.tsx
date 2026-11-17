import { useEffect, useState } from 'react';

import { compassBold, envelopeBold, fileBold, globeBold, mapBold, mapPinBold, phoneBold, storeBold, tagBold, userBold } from '@/assets/icons';
import { normalizeApiError } from '@/services/apiError';
import { fetchCitiesApi, fetchCountriesApi, fetchStatesApi, Place } from '@/services/locationApi';
import { SellerProfile, SellerProfilePayload, updateSellerProfileApi } from '../services/sellerProfileApi';
import EditModalShell, { useNotice } from './EditModalShell';
import { Field, PickerField } from './FormParts';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

interface Props {
  visible: boolean;
  seller: SellerProfile;
  onClose: () => void;
  onSaved: (changed: { name?: string; businessName?: string }) => void;
}

const cleanPhone = (value: string) => value.trim().replace(/[\s-()]/g, '');
const emailOf = (seller: SellerProfile) =>
  seller.emailAddress || (typeof seller.userId === 'object' ? seller.userId?.email : '') || '';

export default function StoreInfoModal({ visible, seller, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const { notice, show, clear } = useNotice();
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [zip, setZip] = useState('');
  const [description, setDescription] = useState('');
  const [country, setCountry] = useState<Place | null>(null);
  const [state, setState] = useState<Place | null>(null);
  const [city, setCity] = useState<Place | null>(null);

  const [countries, setCountries] = useState<Place[]>([]);
  const [states, setStates] = useState<Place[]>([]);
  const [cities, setCities] = useState<Place[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setFullName(seller.fullName || '');
    setBusinessName(seller.businessName || '');
    setPhone(seller.phoneNumber || '');
    setAddress(seller.storeAddress || '');
    setZip(seller.zipCode || '');
    setDescription(seller.storeDescription || '');
    setCountry(seller.country || null);
    setState(seller.state || null);
    setCity(seller.city || null);
    fetchCountriesApi().then(setCountries).catch(() => setCountries([]));
  }, [visible, seller]);

  useEffect(() => {
    if (!visible || !country) {
      setStates([]);
      return;
    }
    setLoadingStates(true);
    fetchStatesApi(country._id)
      .then(setStates)
      .catch(() => setStates([]))
      .finally(() => setLoadingStates(false));
  }, [visible, country]);

  useEffect(() => {
    if (!visible || !state) {
      setCities([]);
      return;
    }
    setLoadingCities(true);
    fetchCitiesApi(state._id)
      .then(setCities)
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false));
  }, [visible, state]);

  const handleSave = async () => {
    if (saving) return;

    const next = {
      fullName: fullName.trim(),
      businessName: businessName.trim(),
      phoneNumber: cleanPhone(phone),
      storeAddress: address.trim(),
      zipCode: zip.trim(),
      storeDescription: description.trim(),
    };

    if (!next.fullName) return show('warning', i18n.t('sellerMsg.profileMsg.fullNameNeeded'), i18n.t('sellerMsg.profileMsg.fullNameBody'));
    if (!next.businessName) return show('warning', i18n.t('sellerMsg.profileMsg.storeNameNeeded'), i18n.t('sellerMsg.profileMsg.storeNameBody'));
    if (next.phoneNumber.length < 7) return show('warning', i18n.t('sellerMsg.profileMsg.invalidPhone'), i18n.t('sellerMsg.profileMsg.invalidPhoneBody'));
    if (!next.storeAddress) return show('warning', i18n.t('sellerMsg.profileMsg.addressNeeded'), i18n.t('sellerMsg.profileMsg.addressBody'));
    if (country && country._id !== seller.country?._id && !state) {
      return show('warning', i18n.t('sellerMsg.profileMsg.stateNeeded'), i18n.t('sellerMsg.profileMsg.stateBody'));
    }
    if (state && state._id !== seller.state?._id && !city) {
      return show('warning', i18n.t('sellerMsg.profileMsg.cityNeeded'), i18n.t('sellerMsg.profileMsg.cityBody'));
    }

    const payload: SellerProfilePayload = {};
    if (next.fullName !== (seller.fullName || '').trim()) payload.fullName = next.fullName;
    if (next.businessName !== (seller.businessName || '').trim()) payload.businessName = next.businessName;
    if (next.phoneNumber !== cleanPhone(seller.phoneNumber || '')) payload.phoneNumber = next.phoneNumber;
    if (next.storeAddress !== (seller.storeAddress || '').trim()) payload.storeAddress = next.storeAddress;
    if (next.zipCode !== (seller.zipCode || '').trim()) payload.zipCode = next.zipCode;
    if (next.storeDescription !== (seller.storeDescription || '').trim()) {
      payload.storeDescription = next.storeDescription;
    }
    if (country && country._id !== seller.country?._id) payload.country = country._id;
    if (state && state._id !== seller.state?._id) payload.state = state._id;
    if (city && city._id !== seller.city?._id) payload.city = city._id;

    if (Object.keys(payload).length === 0) {
      return show('info', i18n.t('sellerMsg.profileMsg.noChanges'), i18n.t('sellerMsg.profileMsg.noChangesStore'));
    }

    setSaving(true);
    try {
      const message = await updateSellerProfileApi(payload);
      onSaved({ name: payload.fullName, businessName: payload.businessName });
      show('success', 'Success', message || i18n.t('sellerAuto.profileUpdatedSuccessfully'));
    } catch (e) {
      show('error', i18n.t('sellerMsg.profileMsg.updateFailed'), normalizeApiError(e).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditModalShell
      visible={visible}
      title={t('sellerAuto.storeInformation')}
      subtitle={t('sellerAuto.updateYourPersonalAndStore')}
      saving={saving}
      notice={notice}
      onClearNotice={clear}
      onClose={onClose}
      onSave={handleSave}>
      <Field label={t('profile.edit.fullName')} icon={userBold} value={fullName} onChangeText={setFullName} placeholder={t('sellerAuto.yourFullName')} required maxLength={60} />
      <Field label={t('sellerAuto.businessStoreName')} icon={storeBold} value={businessName} onChangeText={setBusinessName} placeholder={t('sellerAuto.storeName')} required maxLength={80} />
      <Field label={t('profile.phoneNumber')} icon={phoneBold} value={phone} onChangeText={setPhone} placeholder="e.g. +90 555 123 4567" keyboardType="phone-pad" required maxLength={20} />
      <Field label={t('profile.emailAddress')} icon={envelopeBold} value={emailOf(seller)} readOnly helper={t('sellerAuto.emailAddressCannotBeChanged')} />
      <Field label={t('sellerAuto.storeAddress')} icon={mapPinBold} value={address} onChangeText={setAddress} placeholder={t('sellerAuto.fullStoreAddress')} required maxLength={200} />
      <PickerField
        label={t('profile.country')}
        icon={globeBold}
        selectedId={country?._id || ''}
        selectedName={country?.name || ''}
        options={countries}
        placeholder={t('sellerAuto.selectCountry')}
        emptyText={t('sellerAuto.noCountriesFound')}
        onSelect={option => {
          if (option._id === country?._id) return;
          setCountry(option);
          setState(null);
          setCity(null);
        }}
      />
      <PickerField
        label={t('sellerAuto.state')}
        icon={mapBold}
        selectedId={state?._id || ''}
        selectedName={state?.name || ''}
        options={states}
        loading={loadingStates}
        disabled={!country}
        placeholder={country ? t('sellerAuto.selectState') : t('sellerAuto.selectACountryFirst')}
        emptyText={t('sellerAuto.noStatesFound')}
        onSelect={option => {
          if (option._id === state?._id) return;
          setState(option);
          setCity(null);
        }}
      />
      <PickerField
        label={t('profile.city')}
        icon={compassBold}
        selectedId={city?._id || ''}
        selectedName={city?.name || ''}
        options={cities}
        loading={loadingCities}
        disabled={!state}
        placeholder={state ? t('sellerAuto.selectCity') : t('sellerAuto.selectAStateFirst')}
        emptyText={t('sellerAuto.noCitiesFound')}
        onSelect={setCity}
      />
      <Field label={t('sellerAuto.zipPostalCode')} icon={tagBold} value={zip} onChangeText={setZip} placeholder={t('sellerAuto.postalCode')} maxLength={12} />
      <Field label={t('sellerAuto.storeDescription')} icon={fileBold} value={description} onChangeText={setDescription} placeholder={t('sellerAuto.describeYourStore')} multiline maxLength={1000} />
    </EditModalShell>
  );
}
