import apiClient from './apiClient';

export interface DeviceBrand {
  _id: string;
  id?: string;
  name: string;
  icon?: string;
  slug?: string;
  totalModels?: number;
}

export interface DeviceModel {
  _id: string;
  id?: string;
  name: string;
  icon?: string;
  slug?: string;
  colors?: string[];
}

export async function fetchPublicBrands(): Promise<DeviceBrand[]> {
  try {
    const res = await apiClient.get('/public/brands');
    if (res.data?.success && res.data?.data) {
      const list = res.data.data.brands || res.data.data;
      if (Array.isArray(list)) return list;
    }
    return [];
  } catch (error) {
    if (__DEV__) console.warn('[deviceBrandApi] fetchPublicBrands failed:', error);
    return [];
  }
}

export async function fetchModelsByBrand(brandId: string): Promise<DeviceModel[]> {
  try {
    const res = await apiClient.get(`/public/models/brand/${brandId}`);
    if (res.data?.success && res.data?.data) {
      const list = res.data.data.models || res.data.data;
      if (Array.isArray(list)) return list;
    }
    return [];
  } catch (error) {
    if (__DEV__) console.warn('[deviceBrandApi] fetchModelsByBrand failed:', error);
    return [];
  }
}
