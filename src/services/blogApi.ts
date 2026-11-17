import apiClient from './apiClient';
import { getLocaleTag } from '@/i18n/locale';

export interface MobileBlog {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  image: string;
  tags: string[];
  date: string;
  author: string;
  readTime: string;
}

export function mapBackendToBlog(raw: any): MobileBlog {
  if (!raw) {
    return {
      id: '',
      slug: '',
      title: '',
      description: '',
      content: '',
      image: '',
      tags: [],
      date: '',
      author: '',
      readTime: '',
    };
  }

  const cleanDesc = typeof raw.description === 'string'
    ? raw.description.replace(/<[^>]+>/g, '').trim()
    : '';

  const cleanContent = typeof raw.content === 'string'
    ? raw.content.replace(/<[^>]+>/g, '').trim()
    : cleanDesc;

  const rawImage = raw.featuredImage || raw.image || raw.thumbnail;
  const imageUrl = typeof rawImage === 'string'
    ? rawImage
    : rawImage?.url || '';

  const wordCount = (cleanContent || cleanDesc).split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 180));

  return {
    id: String(raw._id || raw.id || raw.slug || ''),
    slug: raw.slug || '',
    title: raw.title || '',
    description: cleanDesc || '',
    content: cleanContent || cleanDesc,
    image: imageUrl,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    date: raw.createdAt
      ? new Date(raw.createdAt).toLocaleDateString(getLocaleTag(), {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '',
    author: raw.author || '',
    readTime: `${minutes} min read`,
  };
}

export const blogApi = {
  /**
   * Fetch all published blogs from backend /public/blogs
   */
  async getBlogs(params?: { search?: string; tag?: string; page?: number; limit?: number }): Promise<MobileBlog[]> {
    const limit = params?.limit || 20;
    const fetchPage = async (page: number) => {
      const res = await apiClient.get('/public/blogs', {
        params: {
          page,
          limit,
          search: params?.search?.trim() || undefined,
          tag: params?.tag || undefined,
        },
      });
      const list = res.data?.data;
      return Array.isArray(list) ? list.map(mapBackendToBlog) : [];
    };
    if (params?.page) return fetchPage(params.page);
    // all pages (up to 10): a failed request throws so the screen shows an error, not "no blogs"
    const all: MobileBlog[] = [];
    for (let page = 1; page <= 10; page++) {
      const items = await fetchPage(page);
      all.push(...items);
      if (items.length < limit) break;
    }
    return all;
  },

  /**
   * Fetch single blog details from backend /public/blogs/:slug
   */
  async getBlogBySlug(slug: string): Promise<MobileBlog | null> {
    try {
      const res = await apiClient.get(`/public/blogs/${slug}`);
      const data = res.data?.data;
      return data ? mapBackendToBlog(data) : null;
    } catch (err: any) {
      if (err?.isNetworkError || err?.isTimeout || (err?.status && err.status >= 500)) throw err;
      return null;
    }
  },
};

export default blogApi;
