import apiClient from './apiClient';

export interface MobileRepairman {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  shopName: string;
  photo: string;
  city: string;
  state: string;
  location: string;
  fullAddress: string;
  specializations: string[];
  specialty: string;
  experience: string;
  rating: number;
  totalJobs: number;
  pickupService: boolean;
  workingHours?: {
    start?: string;
    end?: string;
  };
  workingDays?: string[];
  description?: string;
}

export function mapBackendToRepairman(raw: any): MobileRepairman {
  if (!raw) {
    return {
      id: '',
      name: 'Expert Repairman',
      shopName: 'CTI Certified Repair',
      photo: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&q=80',
      city: 'Karachi',
      state: 'Sindh',
      location: 'Pakistan',
      fullAddress: '',
      specializations: ['Device Repair'],
      specialty: 'Device Repair',
      experience: 'Certified Tech',
      rating: 4.9,
      totalJobs: 0,
      pickupService: false,
      workingDays: [],
    };
  }

  const profile = raw.repairmanProfile || {};
  const name =
    profile.fullName ||
    raw.name ||
    profile.shopName ||
    'Certified Specialist';

  const shopName =
    profile.shopName ||
    raw.name ||
    'CTI Repair Hub';

  const rawPhoto =
    profile.profilePhoto ||
    raw.photo ||
    raw.profilePhoto ||
    raw.profileImage;

  const photo =
    typeof rawPhoto === 'string' && rawPhoto.startsWith('http')
      ? rawPhoto
      : 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&q=80';

  const cityName =
    typeof raw.city === 'object' && raw.city !== null
      ? raw.city.name
      : typeof raw.city === 'string'
      ? raw.city
      : (typeof profile.city === 'object' && profile.city !== null ? profile.city.name : '');

  const stateName =
    typeof raw.state === 'object' && raw.state !== null
      ? raw.state.name
      : typeof raw.state === 'string'
      ? raw.state
      : (typeof profile.state === 'object' && profile.state !== null ? profile.state.name : '');

  const fullAddress = profile.fullAddress || '';
  const locationParts = [cityName, stateName].filter(Boolean);
  const location = locationParts.length > 0 ? locationParts.join(', ') : fullAddress || 'Pakistan';

  const specializations: string[] = Array.isArray(profile.specializations)
    ? profile.specializations.filter(Boolean)
    : [];

  const specialty = specializations[0] || 'Hardware & Electronics';
  const expYears = profile.yearsOfExperience || 0;
  const experience = expYears > 0 ? `${expYears}+ Years Exp` : 'Certified Pro';

  return {
    id: String(raw._id || raw.id || ''),
    name,
    email: raw.email || profile.emailAddress || '',
    phone: profile.mobileNumber || raw.phone || profile.whatsappNumber || '',
    shopName,
    photo,
    city: cityName,
    state: stateName,
    location,
    fullAddress,
    specializations,
    specialty,
    experience,
    rating: Number(profile.rating || 5.0),
    totalJobs: Number(profile.totalJobs || 0),
    pickupService: Boolean(profile.pickupService),
    workingHours: profile.workingHours,
    workingDays: Array.isArray(profile.workingDays) ? profile.workingDays : [],
    description: profile.description || 'Experienced electronics and device repair technician.',
  };
}

export const repairmanApi = {
  /**
   * Fetch live repairmen with optional filters & pagination
   * Endpoint: GET /public/repairmans
   */
  async getRepairmen(params?: {
    city?: string;
    state?: string;
    specializations?: string;
    page?: number;
    limit?: number;
  }): Promise<{ repairmans: MobileRepairman[]; total: number }> {
    try {
      const res = await apiClient.get('/public/repairmans', {
        params: {
          city: params?.city || undefined,
          state: params?.state || undefined,
          specializations: params?.specializations || undefined,
          page: params?.page || 1,
          limit: params?.limit || 20,
        },
      });

      const data = res.data?.data;
      const list = data?.repairmans;
      const total = data?.pagination?.total || (Array.isArray(list) ? list.length : 0);

      if (Array.isArray(list)) {
        return {
          repairmans: list.map(mapBackendToRepairman),
          total,
        };
      }
      return { repairmans: [], total: 0 };
    } catch (error) {
      if (__DEV__) console.warn('[repairmanApi] getRepairmen error:', error);
      return { repairmans: [], total: 0 };
    }
  },

  /**
   * Fetch single repairman by ID
   * Endpoint: GET /public/repairmans/:id
   */
  async getRepairmanById(id: string): Promise<any | null> {
    try {
      const res = await apiClient.get(`/public/repairmans/${id}`);
      return res.data?.data || null;
    } catch (error) {
      if (__DEV__) console.warn(`[repairmanApi] getRepairmanById(${id}) error:`, error);
      return null;
    }
  },
};

export default repairmanApi;
