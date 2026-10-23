import apiClient from '@/services/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CatalogServiceItem,
  INITIAL_CATALOG_SERVICES,
  INITIAL_PROFILE_DATA,
  ProfileData,
} from '../data/profileData';

/**
 * Fetch current user profile from backend (supports Customer, Seller, Repairman)
 */
export async function fetchUserProfileApi(): Promise<ProfileData> {
  try {
    let role = 'Customer';
    let savedUser: any = null;

    try {
      const authStr = await AsyncStorage.getItem('auth');
      if (authStr) {
        const parsed = JSON.parse(authStr);
        role = parsed?.role || parsed?.user?.role || 'Customer';
        savedUser = parsed?.user;
      }
    } catch {
      // ignore
    }

    let res: any = null;
    if (role?.toLowerCase() === 'customer') {
      res = await apiClient.get('/customer/profile');
    } else {
      res = await apiClient.get('/repairman/profile');
    }

    const data = res?.data?.data || res?.data?.user || res?.data || savedUser;

    if (!data) return INITIAL_PROFILE_DATA;

    return {
      name: data.fullName || data.name || (data.firstName ? `${data.firstName} ${data.lastName || ''}`.trim() : INITIAL_PROFILE_DATA.name),
      role: role || INITIAL_PROFILE_DATA.role,
      avatarUri: data.avatar || data.profileImage || data.image,
      coverUri: data.coverImage,
      city: data.city || data.address?.city || INITIAL_PROFILE_DATA.city,
      experienceYears: data.yearsOfExperience ? `${data.yearsOfExperience} Years Experience` : INITIAL_PROFILE_DATA.experienceYears,
      jobsCompleted: data.jobsCompleted || 0,
      rating: data.rating ? `${data.rating} ★` : INITIAL_PROFILE_DATA.rating,
      aboutMe: data.description || data.aboutMe || data.shopDescription || INITIAL_PROFILE_DATA.aboutMe,
      specialization: Array.isArray(data.specializations) ? data.specializations : (Array.isArray(data.specialization) ? data.specialization : INITIAL_PROFILE_DATA.specialization),
      workingHours: data.workingHours ? (typeof data.workingHours === 'string' ? data.workingHours : `${data.workingHours.start || '09:00'} - ${data.workingHours.end || '21:00'}`) : INITIAL_PROFILE_DATA.workingHours,
      workingDays: data.workingDays || INITIAL_PROFILE_DATA.workingDays,
      phone: data.phone || data.mobileNumber || data.contactNumber || INITIAL_PROFILE_DATA.phone,
      email: data.email || data.emailAddress || INITIAL_PROFILE_DATA.email,
      whatsapp: data.whatsapp || data.whatsappNumber || INITIAL_PROFILE_DATA.whatsapp,
      address: data.address?.street || data.fullAddress || data.address || INITIAL_PROFILE_DATA.address,
      zipCode: data.zipCode || data.address?.zipCode || INITIAL_PROFILE_DATA.zipCode,
      emergencyPerson: data.emergencyContactPerson || INITIAL_PROFILE_DATA.emergencyPerson,
      emergencyPhone: data.emergencyContactNumber || INITIAL_PROFILE_DATA.emergencyPhone,
      pickupServiceAvailable: Boolean(data.pickupServiceAvailable),
      memberSince: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : INITIAL_PROFILE_DATA.memberSince,
      lastUpdate: data.updatedAt ? new Date(data.updatedAt).toLocaleDateString() : 'Today',
      emailVerified: Boolean(data.isEmailVerified ?? true),
      profileCompleted: Boolean(data.isProfileCompleted ?? true),
      bankDetailsCompleted: Boolean(data.bankDetails?.accountNumber || data.bankDetailsCompleted),
      education: Array.isArray(data.education) ? data.education : INITIAL_PROFILE_DATA.education,
      experience: Array.isArray(data.experience) ? data.experience : INITIAL_PROFILE_DATA.experience,
      certificates: Array.isArray(data.certificates) ? data.certificates : INITIAL_PROFILE_DATA.certificates,
    };
  } catch (error) {
    console.log('[profileApi] fetchUserProfileApi fallback:', error);
    return INITIAL_PROFILE_DATA;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfileApi(payload: any): Promise<any> {
  let role = 'Customer';
  try {
    const authStr = await AsyncStorage.getItem('auth');
    if (authStr) {
      const parsed = JSON.parse(authStr);
      role = parsed?.role || parsed?.user?.role || 'Customer';
    }
  } catch {
    // ignore
  }

  if (role?.toLowerCase() === 'customer') {
    const res = await apiClient.put('/customer/profile/update-profile', payload);
    return res.data;
  } else {
    const res = await apiClient.put('/repairman/profile', payload);
    return res.data;
  }
}

/**
 * Fetch catalog services
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
