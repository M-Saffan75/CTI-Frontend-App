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
      } catch (err) {
        // fallback to auth/user-details if customer/profile fails
      }

      // Also get rich user details (address, country object, etc.)
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
      const countryName = typeof merged.country === 'object' && merged.country?.name
        ? merged.country.name
        : (typeof merged.country === 'string' ? merged.country : '');

      const cityName = typeof merged.city === 'object' && merged.city?.name
        ? merged.city.name
        : (typeof merged.city === 'string' ? merged.city : '');

      return {
        ...EMPTY_CUSTOMER_PROFILE,
        name: merged.name || merged.fullName || (merged.firstName ? `${merged.firstName} ${merged.lastName || ''}`.trim() : 'Customer'),
        role: 'Customer',
        avatarUri: merged.profileImage || merged.avatar || merged.image || undefined,
        city: cityName || merged.address?.city || '',
        aboutMe: merged.aboutMe || merged.bio || merged.description || '',
        phone: merged.phone || merged.mobileNumber || '',
        email: merged.email || '',
        whatsapp: merged.whatsapp || merged.phone || '',
        address: typeof merged.address === 'string' ? merged.address : (merged.address?.street || ''),
        zipCode: merged.zipCode || merged.address?.zipCode || '',
        memberSince: merged.createdAt ? new Date(merged.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' }) : 'Member',
        lastUpdate: merged.profileLastUpdated || merged.updatedAt ? new Date(merged.profileLastUpdated || merged.updatedAt).toLocaleDateString() : 'Today',
        emailVerified: Boolean(merged.isEmailVerified ?? true),
        profileCompleted: Boolean(merged.isProfileComplete ?? true),
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
    // If a local image file is provided, use FormData
    if (payload.profilePhoto && payload.profilePhoto.uri) {
      const formData = new FormData();
      formData.append('profilePhoto', {
        uri: payload.profilePhoto.uri,
        type: payload.profilePhoto.type || 'image/jpeg',
        name: payload.profilePhoto.fileName || 'profile.jpg',
      } as any);

      if (payload.name) formData.append('name', payload.name);
      if (payload.phone) formData.append('phone', payload.phone);
      if (payload.country) formData.append('country', payload.country);
      if (payload.address) formData.append('address', payload.address);

      const res = await apiClient.put('/customer/profile/update-profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      responseData = res.data;
    } else {
      const body: any = {
        name: payload.name || payload.fullName,
        phone: payload.phone,
        country: payload.country,
        address: payload.address,
      };
      const res = await apiClient.put('/customer/profile/update-profile', body);
      responseData = res.data;
    }

    // Keep AuthService memory and AsyncStorage in sync
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
