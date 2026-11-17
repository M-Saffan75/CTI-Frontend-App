import apiClient from '@/services/apiClient';
import AuthService from '@/services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProfileData } from '../data/profileData';

const EMPTY_CUSTOMER_PROFILE: ProfileData = {
  name: '',
  role: 'Customer',
  avatarUri: undefined,
  coverUri: undefined,
  city: '',
  experienceYears: '',
  jobsCompleted: 0,
  rating: '',
  aboutMe: '',
  specialization: [],
  workingHours: '',
  workingDays: [],
  phone: '',
  email: '',
  whatsapp: '',
  address: '',
  zipCode: '',
  emergencyPerson: '',
  emergencyPhone: '',
  pickupServiceAvailable: false,
  memberSince: '',
  lastUpdate: '',
  emailVerified: false,
  profileCompleted: false,
  bankDetailsCompleted: false,
  education: [],
  experience: [],
  certificates: [],
};

export interface CountryOption {
  id: string;
  name: string;
  code?: string;
}

/**
 * Upload profile photo directly to /customer/profile/upload-profile
 */
export async function uploadProfilePhotoApi(photo: {
  uri: string;
  type?: string;
  fileName?: string;
}): Promise<any> {
  const formData = new FormData();
  formData.append('profilePhoto', {
    uri: photo.uri,
    type: photo.type || 'image/jpeg',
    name: photo.fileName || 'profile.jpg',
  } as any);

  const res = await apiClient.post(
    '/customer/profile/upload-profile',
    formData,
  );
  const newImage = res.data?.data?.profileImage || res.data?.profileImage;
  if (newImage) {
    const currentUser = AuthService.getCachedUser() || {};
    const updated = {
      ...currentUser,
      profileImage: newImage,
      avatar: newImage,
    };
    AuthService.setCachedSession(
      updated,
      AuthService.getCachedRole() || 'customer',
    );
    await AsyncStorage.setItem('user', JSON.stringify(updated));
  }
  return res.data;
}

/**
 * Delete profile photo directly from /customer/profile/delete-profile
 */
export async function deleteProfilePhotoApi(): Promise<any> {
  const res = await apiClient.delete('/customer/profile/delete-profile');
  const currentUser = AuthService.getCachedUser() || {};
  const updated = { ...currentUser, profileImage: null, avatar: null };
  AuthService.setCachedSession(
    updated,
    AuthService.getCachedRole() || 'customer',
  );
  await AsyncStorage.setItem('user', JSON.stringify(updated));
  return res.data;
}

/**
 * Fetch available countries from public endpoint
 */
export async function fetchCountriesApi(): Promise<CountryOption[]> {
  try {
    const res = await apiClient.get('/public/countries');
    const list = res.data?.data || res.data || [];
    if (Array.isArray(list)) {
      return list
        .filter((c: any) => c && c.name)
        .map((c: any) => ({
          id: String(c._id || c.id),
          name: String(c.name).trim(),
          code: c.code,
        }));
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Fetch the signed-in customer profile from the backend
 */
export async function fetchUserProfileApi(): Promise<ProfileData> {
  try {
    const storedUser =
      AuthService.getCachedUser() || (await AuthService.getStoredUser());

    let res: any = null;
    let userDetails: any = null;

    let firstError: any = null;
    try {
      res = await apiClient.get('/customer/profile');
    } catch (err) {
      // auth/user-details can still answer
      firstError = err;
    }

    // Also get rich user details (populated country object, etc.)
    try {
      const detailsRes = await apiClient.get('/auth/user-details');
      userDetails =
        detailsRes?.data?.data || detailsRes?.data?.user || detailsRes?.data;
    } catch (err) {
      firstError = firstError || err;
    }

    // Both requests failed: the screen shows an error, not a profile made from old data
    if (!res && !userDetails && firstError) throw firstError;

    const customerData =
      res?.data?.data?.user || res?.data?.user || res?.data?.data || res?.data;
    const merged = {
      ...(storedUser || {}),
      ...(userDetails || {}),
      ...(customerData || {}),
    };

    const countryObj =
      typeof userDetails?.location?.country === 'object' &&
      userDetails?.location?.country
        ? userDetails.location.country
        : typeof merged.country === 'object' && merged.country
        ? merged.country
        : null;
    const countryName =
      countryObj?.name ||
      (typeof userDetails?.location?.country === 'string' &&
      !/^[0-9a-fA-F]{24}$/.test(userDetails.location.country)
        ? userDetails.location.country
        : typeof merged.country === 'string' &&
          !/^[0-9a-fA-F]{24}$/.test(merged.country)
        ? merged.country
        : '');
    const countryId =
      countryObj?._id ||
      countryObj?.id ||
      (typeof userDetails?.location?.country === 'string' &&
      /^[0-9a-fA-F]{24}$/.test(userDetails.location.country)
        ? userDetails.location.country
        : typeof merged.country === 'string' &&
          /^[0-9a-fA-F]{24}$/.test(merged.country)
        ? merged.country
        : undefined);

    const stateObj =
      typeof userDetails?.location?.state === 'object' &&
      userDetails?.location?.state
        ? userDetails.location.state
        : typeof merged.state === 'object' && merged.state
        ? merged.state
        : null;
    const stateName =
      stateObj?.name ||
      (typeof userDetails?.location?.state === 'string' &&
      !/^[0-9a-fA-F]{24}$/.test(userDetails.location.state)
        ? userDetails.location.state
        : typeof merged.state === 'string' &&
          !/^[0-9a-fA-F]{24}$/.test(merged.state)
        ? merged.state
        : '');

    const cityObj =
      typeof userDetails?.location?.city === 'object' &&
      userDetails?.location?.city
        ? userDetails.location.city
        : typeof merged.city === 'object' && merged.city
        ? merged.city
        : null;
    const cityName =
      cityObj?.name ||
      (typeof userDetails?.location?.city === 'string' &&
      !/^[0-9a-fA-F]{24}$/.test(userDetails.location.city)
        ? userDetails.location.city
        : typeof merged.city === 'string' &&
          !/^[0-9a-fA-F]{24}$/.test(merged.city)
        ? merged.city
        : '');

    const streetAddress =
      userDetails?.location?.address || merged.address || '';

    return {
      ...EMPTY_CUSTOMER_PROFILE,
      name:
        merged.name ||
        merged.fullName ||
        (merged.firstName
          ? `${merged.firstName} ${merged.lastName || ''}`.trim()
          : ''),
      role: 'Customer',
      avatarUri:
        merged.profileImage || merged.avatar || merged.image || undefined,
      country: countryName || '',
      countryId,
      state: stateName,
      stateId: stateObj?._id || stateObj?.id,
      city: cityName,
      cityId: cityObj?._id || cityObj?.id,
      address: streetAddress,
      aboutMe: '',
      phone: merged.phone || merged.mobileNumber || '',
      email: merged.email || '',
      whatsapp: '',
      zipCode: '',
      memberSince: merged.createdAt || '',
      lastUpdate: merged.profileLastUpdated || merged.updatedAt || '',
      emailVerified: Boolean(merged.isEmailVerified),
      profileCompleted: Boolean(merged.isProfileComplete),
      status: merged.status || 'approved',
      disputeStats: merged.disputeStats || undefined,
      bankDetailsCompleted: false,
      specialization: [],
      workingHours: '',
      workingDays: [],
      education: [],
      experience: [],
      certificates: [],
    };
  } catch (err) {
    // the screen shows the error and a retry
    throw err;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfileApi(payload: any): Promise<any> {
  let responseData: any = null;

  // Backend accepts: name (string 2-50), phone (valid phone), country (ObjectId ONLY), profilePhoto (file)
  const isHexObjectId = (val?: string) =>
    Boolean(val && /^[0-9a-fA-F]{24}$/.test(val));
  const cleanName = (payload.name || payload.fullName || '').trim();
  const cleanPhone = (payload.phone || '').replace(/[\s-()]/g, '').trim();
  const targetCountryId =
    payload.countryId ||
    (isHexObjectId(payload.country) ? payload.country : undefined);

  if (payload.profilePhoto && payload.profilePhoto.uri) {
    const formData = new FormData();
    formData.append('profilePhoto', {
      uri: payload.profilePhoto.uri,
      type: payload.profilePhoto.type || 'image/jpeg',
      name: payload.profilePhoto.fileName || 'profile.jpg',
    } as any);

    if (cleanName.length >= 2) formData.append('name', cleanName);
    if (cleanPhone.length >= 7) formData.append('phone', cleanPhone);
    if (targetCountryId) formData.append('country', targetCountryId);

    const res = await apiClient.put(
      '/customer/profile/update-profile',
      formData,
    );
    responseData = res.data;
  } else {
    const body: any = {};
    if (cleanName.length >= 2) body.name = cleanName;
    if (cleanPhone.length >= 7) body.phone = cleanPhone;
    if (targetCountryId) body.country = targetCountryId;

    const res = await apiClient.put('/customer/profile/update-profile', body);
    responseData = res.data;
  }

  // Keep AuthService memory and AsyncStorage in sync with live backend user
  const updatedUser = responseData?.data?.user || responseData?.user;
  if (updatedUser) {
    const currentUser = AuthService.getCachedUser() || {};
    const merged = { ...currentUser, ...updatedUser };
    AuthService.setCachedSession(merged, 'customer');
    await AsyncStorage.setItem('user', JSON.stringify(merged));
  }

  return responseData;
}
