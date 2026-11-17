import apiClient from './apiClient';

export interface NotificationItem {
  _id: string;
  title: string;
  body: string;
  type?: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  total: number;
  unreadCount: number;
  currentPage: number;
  totalPages: number;
}

export const notificationApi = {
  /**
   * Fetch paginated list of notifications
   */
  async getNotifications(page = 1, limit = 20, type?: string): Promise<{ notifications: NotificationItem[]; total: number; unreadCount: number }> {
    const params: Record<string, any> = { page, limit };
    if (type) params.type = type;

    // The list is the source of truth, so a failed request throws and the screen shows the real message
    const res = await apiClient.get('/notifications', { params });
    const data = res.data?.data || {};
    // The backend names the text field message; the app uses body
    const notifications: NotificationItem[] = (data.notifications || []).map((n: any) => ({
      ...n,
      body: n.body || n.message || '',
    }));
    return {
      notifications,
      total: data.pagination?.totalNotifications || notifications.length,
      unreadCount: data.unreadCount || 0,
    };
  },

  /**
   * Get unread notification badge count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const res = await apiClient.get('/notifications/unread-count');
      if (res.data?.success) {
        return res.data?.data?.unreadCount || 0;
      }
      return 0;
    } catch (error) {
      if (__DEV__) console.warn('[notificationApi] getUnreadCount failed:', error);
      return 0;
    }
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const res = await apiClient.patch(`/notifications/${notificationId}/read`);
      return !!res.data?.success;
    } catch (error) {
      if (__DEV__) console.warn('[notificationApi] markAsRead failed:', error);
      return false;
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<boolean> {
    try {
      const res = await apiClient.patch('/notifications/mark-all-read');
      return !!res.data?.success;
    } catch (error) {
      if (__DEV__) console.warn('[notificationApi] markAllAsRead failed:', error);
      return false;
    }
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const res = await apiClient.delete(`/notifications/${notificationId}`);
      return !!res.data?.success;
    } catch (error) {
      if (__DEV__) console.warn('[notificationApi] deleteNotification failed:', error);
      return false;
    }
  },

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<boolean> {
    try {
      const res = await apiClient.delete('/notifications/clear-all');
      return !!res.data?.success;
    } catch (error) {
      if (__DEV__) console.warn('[notificationApi] clearAllNotifications failed:', error);
      return false;
    }
  },

  /**
   * Send FCM Device Token to backend for push notifications
   */
  async updateFcmToken(fcmToken: string): Promise<boolean> {
    try {
      const res = await apiClient.post('/update-fcm-token', { fcmToken });
      return !!res.data?.success;
    } catch (error) {
      if (__DEV__) console.warn('[notificationApi] updateFcmToken failed:', error);
      return false;
    }
  },
};

export default notificationApi;
