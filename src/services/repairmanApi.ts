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
      name: '',
      shopName: '',
      photo: '',
      city: '',
      state: '',
      location: '',
      fullAddress: '',
      specializations: [],
      specialty: '',
      experience: '',
      rating: 0,
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
    '';

  const shopName =
    profile.shopName ||
    raw.name ||
    '';

  const rawPhoto =
    profile.profilePhoto ||
    raw.photo ||
    raw.profilePhoto ||
    raw.profileImage;

  const photo =
    typeof rawPhoto === 'string' && rawPhoto.startsWith('http')
      ? rawPhoto
      : '';

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
  const location = locationParts.length > 0 ? locationParts.join(', ') : fullAddress;

  const specializations: string[] = Array.isArray(profile.specializations)
    ? profile.specializations.filter(Boolean)
    : [];

  const specialty = specializations[0] || '';
  const expYears = profile.yearsOfExperience || 0;
  const experience = expYears > 0 ? `${expYears}+ Years Exp` : '';

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
    rating: Number(profile.rating || 0),
    totalJobs: Number(profile.totalJobs || 0),
    pickupService: Boolean(profile.pickupService),
    workingHours: profile.workingHours,
    workingDays: Array.isArray(profile.workingDays) ? profile.workingDays : [],
    description: profile.description || '',
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
    const limit = params?.limit || 20;
    const fetchPage = async (page: number) => {
      const res = await apiClient.get('/public/repairmans', {
        params: {
          city: params?.city || undefined,
          state: params?.state || undefined,
          specializations: params?.specializations || undefined,
          page,
          limit,
        },
      });
      const data = res.data?.data;
      const list = data?.repairmans;
      return {
        items: Array.isArray(list) ? (list.map(mapBackendToRepairman) as MobileRepairman[]) : [],
        total: Number(data?.pagination?.total || 0),
      };
    };
    // A failed request throws, so the screen shows an error and a retry (not "no repairmen").
    if (params?.page) {
      const one = await fetchPage(params.page);
      return { repairmans: one.items, total: one.total || one.items.length };
    }
    const all: MobileRepairman[] = [];
    let total = 0;
    for (let page = 1; page <= 10; page++) {
      const one = await fetchPage(page);
      all.push(...one.items);
      total = one.total || total;
      if (one.items.length < limit) break;
    }
    return { repairmans: all, total: total || all.length };
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
