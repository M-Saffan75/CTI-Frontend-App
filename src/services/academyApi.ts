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
    ? raw.category.title || raw.category.name || 'General'
    : typeof raw.category === 'string'
    ? raw.category
    : 'General';

  const categoryId = typeof raw.category === 'object' && raw.category !== null
    ? raw.category._id || raw.category.id
    : raw.categoryId;

  const rawThumb = raw.thumbnail || raw.image;
  const thumbUrl = typeof rawThumb === 'string' && rawThumb.startsWith('http')
    ? rawThumb
    : 'https://picsum.photos/seed/course/800/450';

  return {
    id: String(raw._id || raw.id || raw.slug || Math.random().toString()),
    slug: raw.slug || '',
    title: raw.title || 'Course',
    category: categoryName,
    categoryId: categoryId ? String(categoryId) : undefined,
    description: cleanDesc,
    shortDescription: raw.shortDescription || cleanDesc,
    articleContent: cleanArticle,
    about: cleanArticle || cleanDesc || 'Comprehensive hands-on training module provided by CTI Academy.',
    video: raw.video,
    thumbnail: thumbUrl,
    views: Number(raw.views || 0),
    averageRating: Number(raw.averageRating || 4.8),
    reviewCount: Number(raw.reviewCount || 0),
    duration: raw.duration || '25 mins',
    lessons: raw.lessons || 6,
  };
}

export const academyApi = {
  /**
   * Fetch all academic categories
   * Endpoint: GET /academic/category
   */
  async getCategories(): Promise<AcademicCategoryItem[]> {
    try {
      const res = await apiClient.get('/academic/category', {
        params: { page: 1, limit: 50 },
      });
      const list = res.data?.data;
      if (Array.isArray(list)) {
        return list.map((cat: any) => ({
          id: String(cat._id || cat.id || cat.slug),
          title: cat.title || cat.name || 'Category',
          slug: cat.slug || '',
          icon: cat.icon,
          image: cat.image,
        }));
      }
      return [];
    } catch (error) {
      if (__DEV__) console.warn('[academyApi] getCategories error:', error);
      return [];
    }
  },

  /**
   * Fetch courses / academic content
   * Endpoint: GET /academic/content/:id
   */
  async getCourses(params?: {
    categoryId?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }): Promise<AcademicCourseItem[]> {
    try {
      const categoryIdParam = params?.categoryId && params.categoryId !== 'all'
        ? params.categoryId
        : 'all';

      const res = await apiClient.get(`/academic/content/${categoryIdParam}`, {
        params: {
          page: params?.page || 1,
          limit: params?.limit || 20,
          search: params?.search?.trim() || undefined,
          sort: params?.sort,
        },
      });

      const list = res.data?.data;
      if (Array.isArray(list)) {
        return list.map(mapBackendToCourse);
      }
      return [];
    } catch (error) {
      if (__DEV__) console.warn('[academyApi] getCourses error:', error);
      return [];
    }
  },

  /**
   * Fetch single course details by slug
   * Endpoint: GET /academic/:slug
   */
  async getCourseBySlug(slug: string): Promise<AcademicCourseItem | null> {
    try {
      const res = await apiClient.get(`/academic/${slug}`);
      const data = res.data?.data;
      if (data) {
        return mapBackendToCourse(data);
      }
      return null;
    } catch (error) {
      if (__DEV__) console.warn(`[academyApi] getCourseBySlug(${slug}) error:`, error);
      return null;
    }
  },
};

export default academyApi;
