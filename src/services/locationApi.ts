import apiClient from '@/services/apiClient';

// Countries, states and cities all come from the backend's public endpoints (same as the web).
export interface Place {
  _id: string;
  name: string;
}

async function fetchPlaces(url: string): Promise<Place[]> {
  const res = await apiClient.get<{ data?: Place[] }>(url);
  const list = res.data?.data;
  return Array.isArray(list) ? list.filter(p => p && p._id && p.name) : [];
}

export const fetchCountriesApi = () => fetchPlaces('/public/countries');
export const fetchStatesApi = (countryId: string) => fetchPlaces(`/public/states/country/${countryId}`);
export const fetchCitiesApi = (stateId: string) => fetchPlaces(`/public/cities/state/${stateId}`);
