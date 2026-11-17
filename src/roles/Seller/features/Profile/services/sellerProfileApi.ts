import apiClient from '@/services/apiClient';
import { Place } from '@/services/locationApi';

export interface SellerBank {
  accountTitle?: string | null;
  accountNumber?: string | null;
  bankName?: string | null;
  branchName?: string | null;
  iban?: string | null;
}

export type SocialKey =
  | 'facebook'
  | 'instagram'
  | 'twitter'
  | 'linkedin'
  | 'whatsapp'
  | 'youtube'
  | 'tiktok'
  | 'website';

export type SellerSocial = Partial<Record<SocialKey, string | null>>;

export interface SellerProfile {
  _id: string;
  sellerId?: string | null;
  userId?: { email?: string } | string | null;
  fullName?: string;
  businessName?: string;
  phoneNumber?: string;
  emailAddress?: string;
  storeAddress?: string;
  zipCode?: string;
  storeDescription?: string | null;
  country?: Place | null;
  state?: Place | null;
  city?: Place | null;
  profilePictureOrLogo?: string | null;
  coverPhoto?: string | null;
  nationalIdOrPassport?: string | null;
  shopLicenseOrTaxCertificate?: string | null;
  proofOfAddress?: string | null;
  workingDays?: string[];
  workingHours?: { start?: string; end?: string };
  bankDetails?: SellerBank;
  socialLinks?: SellerSocial;
  isKycCompleted?: boolean;
  kycStatus?: 'pending' | 'approved' | 'rejected' | 'revision';
  kycReason?: string | null;
  kycLastUpdated?: string | null;
  isActive?: boolean;
  sellsRefurbishedDevices?: boolean;
  commissionRate?: number;
  shippingMethod?: string | null;
}

// What PATCH /seller/profile/update reads from the `sellerProfile` JSON (strings only, the backend calls .trim() on them)
export interface SellerProfilePayload {
  fullName?: string;
  businessName?: string;
  phoneNumber?: string;
  storeAddress?: string;
  zipCode?: string;
  storeDescription?: string;
  country?: string;
  state?: string;
  city?: string;
  workingDays?: string[];
  workingHours?: { start: string; end: string };
  socialLinks?: SellerSocial;
  bankDetails?: SellerBank;
}

export interface PickedImage {
  uri: string;
  type?: string;
  fileName?: string;
}

export interface SellerProfileFiles {
  logo?: PickedImage;
  cover?: PickedImage;
}

// Same request as the web profile page. Unlike GET /seller/profile/me, it returns the full profile in every KYC state.
export async function fetchSellerProfileApi(): Promise<SellerProfile> {
  const res = await apiClient.get('/seller/profile/me-seller');
  return res.data.data as SellerProfile;
}

// Returns the backend message. Callers reload the profile afterwards because the response has no country, state or city names.
export async function updateSellerProfileApi(
  payload: SellerProfilePayload,
  files: SellerProfileFiles = {},
): Promise<string> {
  const form = new FormData();
  form.append('sellerProfile', JSON.stringify(payload));
  if (files.logo) {
    form.append('profilePictureOrLogo', {
      uri: files.logo.uri,
      type: files.logo.type || 'image/jpeg',
      name: files.logo.fileName || 'logo.jpg',
    } as any);
  }
  if (files.cover) {
    form.append('coverPhoto', {
      uri: files.cover.uri,
      type: files.cover.type || 'image/jpeg',
      name: files.cover.fileName || 'cover.jpg',
    } as any);
  }
  const res = await apiClient.patch('/seller/profile/update', form);
  return res.data?.message || '';
}
