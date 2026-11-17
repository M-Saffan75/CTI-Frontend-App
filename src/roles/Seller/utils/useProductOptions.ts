import { useCallback, useEffect, useRef, useState } from 'react';

import i18n from '@/i18n';
import {
  fetchProductBrandsApi,
  fetchProductCategoriesApi,
  SellerOption,
} from '@/roles/Seller/services/sellerApi';

// Categories and brands for the product pickers. A failed request is kept as an error so the picker can show it with a retry.
export default function useProductOptions() {
  const [categories, setCategories] = useState<SellerOption[]>([]);
  const [brands, setBrands] = useState<SellerOption[]>([]);
  const [error, setError] = useState('');
  const mounted = useRef(true);

  const load = useCallback(() => {
    setError('');
    Promise.all([fetchProductCategoriesApi(), fetchProductBrandsApi()])
      .then(([categoryList, brandList]) => {
        if (!mounted.current) return;
        setCategories(categoryList);
        setBrands(brandList);
      })
      .catch(err => {
        if (mounted.current) setError(err?.message || i18n.t('seller.optionsLoadFailed'));
      });
  }, []);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  return { categories, brands, error, retry: load };
}
