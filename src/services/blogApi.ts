import apiClient from './apiClient';

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
    : rawImage?.url || 'https://picsum.photos/seed/blog/800/500';

  const wordCount = (cleanContent || cleanDesc).split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 180));

  return {
    id: String(raw._id || raw.id || raw.slug || Math.random().toString()),
    slug: raw.slug || '',
    title: raw.title || 'CTI Blog',
    description: cleanDesc || 'Read our latest device repair and technology insights.',
    content: cleanContent || cleanDesc,
    image: imageUrl,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    date: raw.createdAt
      ? new Date(raw.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'Recent',
    author: raw.author || 'CTI Team',
    readTime: `${minutes} min read`,
  };
}

export const blogApi = {
  /**
   * Fetch all published blogs from backend /public/blogs
   */
  async getBlogs(params?: { search?: string; tag?: string; page?: number; limit?: number }): Promise<MobileBlog[]> {
    try {
      const res = await apiClient.get('/public/blogs', {
        params: {
          page: params?.page || 1,
          limit: params?.limit || 20,
          search: params?.search?.trim() || undefined,
          tag: params?.tag || undefined,
        },
      });
      const list = res.data?.data;
      if (Array.isArray(list)) {
        return list.map(mapBackendToBlog);
      }
      return [];
    } catch (error) {
      if (__DEV__) console.warn('[blogApi] getBlogs error:', error);
      return [];
    }
  },

  /**
   * Fetch single blog details from backend /public/blogs/:slug
   */
  async getBlogBySlug(slug: string): Promise<MobileBlog | null> {
    try {
      const res = await apiClient.get(`/public/blogs/${slug}`);
      const data = res.data?.data;
      if (data) {
        return mapBackendToBlog(data);
      }
      return null;
    } catch (error) {
      if (__DEV__) console.warn(`[blogApi] getBlogBySlug(${slug}) error:`, error);
      return null;
    }
  },
};

export default blogApi;
