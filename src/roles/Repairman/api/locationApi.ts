import { useEffect, useState } from 'react';

/**
 * Real API (not demo data) — Country State City, scoped to Turkey (prices
 * everywhere in this app are already in TRY). Swap the country code if that
 * ever changes.
 */
const API_KEY = 'cWtGRG1MSFM3WWg3b1ZiaXBueEw3VmZESHRFN3Z3eGRoRU5zQkJPOQ==';
const COUNTRY = 'TR';

// Cached at module scope — every screen's filter bar shares one fetch
// instead of hitting the API again each time you switch tabs.
let citiesCache = null;

export async function fetchCities() {
  if (citiesCache) return citiesCache;

  // The all-cities-in-one-call endpoint (/countries/{c}/cities) is a paid
  // plan feature and 403s on this key. /states is on the free tier and, for
  // Turkey, a "state" IS a city (Istanbul, Ankara, Izmir...) — exactly what
  // a single "Select City" field needs, so no per-district drill-down.
  const response = await fetch(`https://api.countrystatecity.in/v1/countries/${COUNTRY}/states`, {
    method: 'GET',
    headers: { 'X-CSCAPI-KEY': API_KEY },
  });
  if (!response.ok) return [];

  const data = await response.json();
  citiesCache = data.map(state => state.name).sort();
  return citiesCache;
}

/** Uses the shared cache once it's warm, so repeat mounts resolve instantly. */
export function useCities() {
  const [cities, setCities] = useState(citiesCache ?? []);
  const [loading, setLoading] = useState(!citiesCache);

  useEffect(() => {
    if (citiesCache) return;

    fetchCities()
      .then(setCities)
      .catch(() => setCities([]))
      .finally(() => setLoading(false));
  }, []);

  return { cities, loading };
}
