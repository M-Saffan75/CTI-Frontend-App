import apiClient from '@/services/apiClient';
import AuthService from '@/services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CatalogServiceItem,
  INITIAL_CATALOG_SERVICES,
  ProfileData,
} from '../data/profileData';

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
  lastUpdate: 'Today',
  emailVerified: true,
  profileCompleted: true,
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

  const res = await apiClient.post('/customer/profile/upload-profile', formData);
  const newImage = res.data?.data?.profileImage || res.data?.profileImage;
  if (newImage) {
    const currentUser = AuthService.getCachedUser() || {};
    const updated = { ...currentUser, profileImage: newImage, avatar: newImage };
    AuthService.setCachedSession(updated, 'customer');
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
  AuthService.setCachedSession(updated, 'customer');
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
 * Fetch current user profile from backend (supports Customer, Seller, Repairman)
 */
export async function fetchUserProfileApi(): Promise<ProfileData> {
  try {
    const cachedRole = AuthService.getCachedRole();
    const storedRole = cachedRole || (await AuthService.getStoredRole()) || 'customer';
    const roleLower = storedRole.toLowerCase();

    const storedUser = AuthService.getCachedUser() || (await AuthService.getStoredUser());

    let res: any = null;
    let userDetails: any = null;

    if (roleLower === 'customer') {
      try {
        res = await apiClient.get('/customer/profile');
      } catch {
        // fallback to auth/user-details if customer/profile fails
      }

      // Also get rich user details (populated country object, etc.)
      try {
        const detailsRes = await apiClient.get('/auth/user-details');
        userDetails = detailsRes?.data?.data || detailsRes?.data?.user || detailsRes?.data;
      } catch {
        // ignore
      }
    } else {
      res = await apiClient.get('/repairman/profile');
    }

    const customerData = res?.data?.data?.user || res?.data?.user || res?.data?.data || res?.data;
    const merged = {
      ...(storedUser || {}),
      ...(userDetails || {}),
      ...(customerData || {}),
    };

    if (roleLower === 'customer') {
      const countryObj =
        typeof userDetails?.location?.country === 'object' && userDetails?.location?.country
          ? userDetails.location.country
          : typeof merged.country === 'object' && merged.country
          ? merged.country
          : null;
      const countryName =
        countryObj?.name ||
        (typeof userDetails?.location?.country === 'string' &&
        !/^[0-9a-fA-F]{24}$/.test(userDetails.location.country)
          ? userDetails.location.country
          : typeof merged.country === 'string' && !/^[0-9a-fA-F]{24}$/.test(merged.country)
          ? merged.country
          : '');
      const countryId =
        countryObj?._id ||
        countryObj?.id ||
        (typeof userDetails?.location?.country === 'string' &&
        /^[0-9a-fA-F]{24}$/.test(userDetails.location.country)
          ? userDetails.location.country
          : typeof merged.country === 'string' && /^[0-9a-fA-F]{24}$/.test(merged.country)
          ? merged.country
          : undefined);

      const stateObj =
        typeof userDetails?.location?.state === 'object' && userDetails?.location?.state
          ? userDetails.location.state
          : typeof merged.state === 'object' && merged.state
          ? merged.state
          : null;
      const stateName =
        stateObj?.name ||
        (typeof userDetails?.location?.state === 'string' &&
        !/^[0-9a-fA-F]{24}$/.test(userDetails.location.state)
          ? userDetails.location.state
          : typeof merged.state === 'string' && !/^[0-9a-fA-F]{24}$/.test(merged.state)
          ? merged.state
          : '');

      const cityObj =
        typeof userDetails?.location?.city === 'object' && userDetails?.location?.city
          ? userDetails.location.city
          : typeof merged.city === 'object' && merged.city
          ? merged.city
          : null;
      const cityName =
        cityObj?.name ||
        (typeof userDetails?.location?.city === 'string' &&
        !/^[0-9a-fA-F]{24}$/.test(userDetails.location.city)
          ? userDetails.location.city
          : typeof merged.city === 'string' && !/^[0-9a-fA-F]{24}$/.test(merged.city)
          ? merged.city
          : '');

      const streetAddress = userDetails?.location?.address || merged.address || '';

      return {
        ...EMPTY_CUSTOMER_PROFILE,
        name:
          merged.name ||
          merged.fullName ||
          (merged.firstName ? `${merged.firstName} ${merged.lastName || ''}`.trim() : 'Customer'),
        role: 'Customer',
        avatarUri: merged.profileImage || merged.avatar || merged.image || undefined,
        country: countryName || 'Turkey',
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
        memberSince: merged.createdAt
          ? new Date(merged.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' })
          : 'Member',
        lastUpdate:
          merged.profileLastUpdated || merged.updatedAt
            ? new Date(merged.profileLastUpdated || merged.updatedAt).toLocaleDateString()
            : 'Today',
        emailVerified: Boolean(merged.isEmailVerified ?? true),
        profileCompleted: Boolean(merged.isProfileComplete ?? true),
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
    }

    // Provider / Repairman fallback
    const data = merged;
    return {
      ...EMPTY_CUSTOMER_PROFILE,
      name: data.fullName || data.name || 'Provider',
      role: storedRole,
      avatarUri: data.avatar || data.profileImage || data.image,
      coverUri: data.coverImage,
      city: data.city || data.address?.city || '',
      experienceYears: data.yearsOfExperience ? `${data.yearsOfExperience} Years Experience` : '',
      jobsCompleted: data.jobsCompleted || 0,
      rating: data.rating ? `${data.rating} ★` : 'No rating',
      aboutMe: data.description || data.aboutMe || '',
      specialization: Array.isArray(data.specializations) ? data.specializations : [],
      workingHours: data.workingHours ? (typeof data.workingHours === 'string' ? data.workingHours : `${data.workingHours.start || '09:00'} - ${data.workingHours.end || '21:00'}`) : '',
      workingDays: data.workingDays || [],
      phone: data.phone || '',
      email: data.email || '',
      whatsapp: data.whatsapp || '',
      address: data.address?.street || data.fullAddress || data.address || '',
      zipCode: data.zipCode || data.address?.zipCode || '',
      emergencyPerson: data.emergencyContactPerson || '',
      emergencyPhone: data.emergencyContactNumber || '',
      pickupServiceAvailable: Boolean(data.pickupServiceAvailable),
      memberSince: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'Member',
      lastUpdate: data.updatedAt ? new Date(data.updatedAt).toLocaleDateString() : 'Today',
      emailVerified: Boolean(data.isEmailVerified ?? true),
      profileCompleted: Boolean(data.isProfileCompleted ?? true),
      bankDetailsCompleted: Boolean(data.bankDetails?.accountNumber || data.bankDetailsCompleted),
      education: Array.isArray(data.education) ? data.education : [],
      experience: Array.isArray(data.experience) ? data.experience : [],
      certificates: Array.isArray(data.certificates) ? data.certificates : [],
    };
  } catch {
    const cached = AuthService.getCachedUser();
    if (cached) {
      return {
        ...EMPTY_CUSTOMER_PROFILE,
        name: cached.name || 'Customer',
        email: cached.email || '',
        phone: cached.phone || '',
        avatarUri: cached.avatar || cached.profileImage,
        role: cached.role || 'Customer',
      };
    }
    return EMPTY_CUSTOMER_PROFILE;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfileApi(payload: any): Promise<any> {
  const cachedRole = AuthService.getCachedRole();
  const storedRole = cachedRole || (await AuthService.getStoredRole()) || 'customer';
  const roleLower = storedRole.toLowerCase();

  let responseData: any = null;

  if (roleLower === 'customer') {
    // Backend accepts: name (string 2-50), phone (valid phone), country (ObjectId ONLY), profilePhoto (file)
    const isHexObjectId = (val?: string) => Boolean(val && /^[0-9a-fA-F]{24}$/.test(val));
    const cleanName = (payload.name || payload.fullName || '').trim();
    const cleanPhone = (payload.phone || '').replace(/[\s-()]/g, '').trim();
    const targetCountryId = payload.countryId || (isHexObjectId(payload.country) ? payload.country : undefined);

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

      const res = await apiClient.put('/customer/profile/update-profile', formData);
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
  } else {
    const res = await apiClient.put('/repairman/profile', payload);
    return res.data;
  }
}

/**
 * Fetch catalog services (for providers)
 */
export async function fetchCatalogServicesApi(): Promise<CatalogServiceItem[]> {
  try {
    const res = await apiClient.get('/customer/services');
    const data = res.data?.data || res.data || [];
    if (Array.isArray(data) && data.length > 0) {
      return data.map((s: any, idx: number) => ({
        id: s._id || s.id || `srv-${idx + 1}`,
        title: s.title || s.name || 'Service Item',
        description: s.description || 'Professional repair & maintenance',
        price: typeof s.price === 'number' ? `$${s.price.toFixed(2)}` : (s.price || '$35.00'),
        basePrice: s.basePrice || '$20.00',
        partsPrice: s.partsPrice || '$15.00',
        status: s.status || 'In Progress',
        category: s.category?.name || s.category || 'General Repair',
        customerName: s.customer?.name || s.customerName || 'Customer User',
        device: s.device || 'Smartphone',
        location: s.location || 'Local Workshop',
        date: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '7/1/2026',
      }));
    }
    return INITIAL_CATALOG_SERVICES;
  } catch {
    return INITIAL_CATALOG_SERVICES;
  }
}
