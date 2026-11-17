import apiClient from './apiClient';

export interface AcademicCategoryItem {
  id: string;
  title: string;
  slug: string;
  icon?: string;
  image?: string;
}

export interface AcademicCourseItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  categoryId?: string;
  subCategory?: string;
  description: string;
  shortDescription?: string;
  articleContent?: string;
  about: string;
  video?: string;
  thumbnail: string;
  views: number;
  averageRating: number;
  reviewCount: number;
  duration?: string;
  lessons?: number;
}

export function mapBackendToCourse(raw: any): AcademicCourseItem {
  if (!raw) {
    return {
      id: '',
      slug: '',
      title: '',
      category: '',
      description: '',
      about: '',
      thumbnail: '',
      views: 0,
      averageRating: 0,
      reviewCount: 0,
    };
  }

  const cleanDesc = typeof raw.description === 'string'
    ? raw.description.replace(/<[^>]+>/g, '').trim()
    : raw.shortDescription || '';

  const cleanArticle = typeof raw.articleContent === 'string'
    ? raw.articleContent.replace(/<[^>]+>/g, '').trim()
    : cleanDesc;

  const categoryName = typeof raw.category === 'object' && raw.category !== null
    ? raw.category.title || raw.category.name || ''
    : typeof raw.category === 'string'
    ? raw.category
    : '';

  const categoryId = typeof raw.category === 'object' && raw.category !== null
    ? raw.category._id || raw.category.id
    : raw.categoryId;

  const rawThumb = raw.thumbnail || raw.image;
  const thumbUrl = typeof rawThumb === 'string' && rawThumb.startsWith('http')
    ? rawThumb
    : (typeof rawThumb === 'string' ? rawThumb : '');

  const subCatTitle = raw.subCategory?.title || (typeof raw.subCategory === 'string' ? raw.subCategory : undefined);

  return {
    id: String(raw._id || raw.id || raw.slug || ''),
    slug: raw.slug || '',
    title: raw.title || '',
    category: categoryName,
    categoryId: categoryId ? String(categoryId) : undefined,
    subCategory: subCatTitle,
    description: cleanDesc,
    shortDescription: raw.shortDescription || cleanDesc,
    articleContent: cleanArticle,
    about: cleanArticle || cleanDesc,
    video: raw.video || undefined,
    thumbnail: thumbUrl,
    views: Number(raw.views || 0),
    averageRating: Number(raw.averageRating || raw.rating || 0),
    reviewCount: Number(raw.reviewCount || 0),
    duration: raw.duration || '',
    lessons: Number(raw.lessons || 0),
  };
}

export const academyApi = {
  /**
   * Fetch all academic categories
   * Endpoint: GET /academic/category
   */
  async getCategories(): Promise<AcademicCategoryItem[]> {
    const res = await apiClient.get('/academic/category', {
      params: { page: 1, limit: 50 },
    });
    const list = res.data?.data;
    if (!Array.isArray(list)) return [];
    return list.map((cat: any) => ({
      id: String(cat._id || cat.id || cat.slug),
      title: cat.title || cat.name || '',
      slug: cat.slug || '',
      icon: cat.icon,
      image: cat.image,
    }));
  },

  /**
   * Fetch courses / academic content (all pages, up to 10)
   * Endpoint: GET /academic/content/:id
   */
  async getCourses(params?: {
    categoryId?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }): Promise<AcademicCourseItem[]> {
    const categoryIdParam = params?.categoryId && params.categoryId !== 'all' ? params.categoryId : 'all';
    const limit = params?.limit || 20;
    const fetchPage = async (page: number) => {
      const res = await apiClient.get(`/academic/content/${categoryIdParam}`, {
        params: {
          page,
          limit,
          search: params?.search?.trim() || undefined,
          sort: params?.sort,
        },
      });
      const list = res.data?.data;
      return Array.isArray(list) ? list.map(mapBackendToCourse) : [];
    };
    // a failed request throws so the screen shows an error, not "no courses"
    if (params?.page) return fetchPage(params.page);
    const all: AcademicCourseItem[] = [];
    for (let page = 1; page <= 10; page++) {
      const items = await fetchPage(page);
      all.push(...items);
      if (items.length < limit) break;
    }
    return all;
  },

  /**
   * Fetch single course details by slug
   * Endpoint: GET /academic/:slug
   */
  async getCourseBySlug(slug: string): Promise<AcademicCourseItem | null> {
    try {
      const res = await apiClient.get(`/academic/${slug}`);
      const data = res.data?.data;
      return data ? mapBackendToCourse(data) : null;
    } catch (err: any) {
      if (err?.isNetworkError || err?.isTimeout || (err?.status && err.status >= 500)) throw err;
      return null;
    }
  },

  /**
   * Increment course views count
   * Endpoint: PATCH /academic/:slug/views
   */
  async patchCourseViews(slug: string): Promise<void> {
    try {
      await apiClient.patch(`/academic/${slug}/views`);
    } catch {
      // Ignore views tracking error
    }
  },
};

export default academyApi;
