import apiClient from './apiClient';

export interface ChatParticipant {
  id: string;
  _id?: string;
  name: string;
  avatar: string | null;
  isOnline?: boolean;
  lastSeen?: string;
  role?: string;
}

export interface ChatLastMessage {
  content: string;
  senderType: 'customer' | 'repairman' | 'seller';
  timestamp: string;
  messageType: string;
}

export interface ChatItem {
  chatId: string;
  participant: ChatParticipant;
  lastMessage: ChatLastMessage | null;
  unreadCount: number;
  chatType: string;
  updatedAt: string;
}

export interface ChatMessageItem {
  _id: string;
  messageId: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'voice' | 'mixed' | 'quotation';
  senderType: 'customer' | 'repairman' | 'seller';
  senderId: any;
  timestamp: string;
  mediaUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  quotationId?: any;
  quotationData?: any;
  isRead?: boolean;
  user?: ChatParticipant;
}

/**
 * Fetch all conversations for logged in user
 * Endpoint: GET /chat/list
 */
export async function fetchChatList(page = 1, limit = 30): Promise<ChatItem[]> {
  try {
    const res = await apiClient.get(`/chat/list?page=${page}&limit=${limit}`);
    if (res.data?.success && Array.isArray(res.data?.chats)) {
      return res.data.chats.map((c: any) => {
        const other = c.otherUser || c.participant || {};
        return {
          chatId: c.chatId || c._id,
          participant: {
            id: other.id || other._id || '',
            name: other.name || 'User',
            avatar: other.avatar || null,
            isOnline: Boolean(other.isOnline),
            lastSeen: other.lastSeen,
            role: other.role,
          },
          lastMessage: c.lastMessage || null,
          unreadCount: c.unreadCount || 0,
          chatType: c.chatType || 'direct',
          updatedAt: c.updatedAt || new Date().toISOString(),
        };
      });
    }
    return [];
  } catch (error) {
    if (__DEV__) {
      console.log('[chatApi] fetchChatList error:', error);
    }
    return [];
  }
}

/**
 * Fetch message history for a specific chat
 * Endpoint: GET /chat/:chatId/messages
 */
export async function fetchChatMessages(
  chatId: string,
  before?: string,
  limit = 50,
): Promise<{
  messages: ChatMessageItem[];
  hasMore: boolean;
  oldestMessageId: string | null;
  user?: ChatParticipant;
}> {
  try {
    const url = before
      ? `/chat/${chatId}/messages?limit=${limit}&before=${before}`
      : `/chat/${chatId}/messages?limit=${limit}`;
    const res = await apiClient.get(url);

    if (res.data?.success) {
      const messages: ChatMessageItem[] = (res.data.messages || []).map((m: any) => ({
        _id: m._id || m.messageId || String(Math.random()),
        messageId: m.messageId || m._id,
        content: m.content || '',
        messageType: m.messageType || 'text',
        senderType: m.senderType || 'customer',
        senderId: m.senderId?._id || m.senderId || '',
        timestamp: m.timestamp || new Date().toISOString(),
        mediaUrl: m.mediaUrl || null,
        fileName: m.fileName || null,
        quotationId: m.quotationId,
        quotationData: m.quotationData,
        isRead: Boolean(m.isRead),
        user: m.user
          ? {
              id: m.user._id || m.user.id,
              name: m.user.name,
              avatar: m.user.avatar,
              role: m.user.role,
            }
          : undefined,
      }));

      return {
        messages,
        hasMore: Boolean(res.data.hasMore),
        oldestMessageId: res.data.oldestMessageId || null,
        user: res.data.user
          ? {
              id: res.data.user._id || res.data.user.id,
              name: res.data.user.name,
              avatar: res.data.user.avatar,
              role: res.data.user.role,
            }
          : undefined,
      };
    }

    return { messages: [], hasMore: false, oldestMessageId: null };
  } catch (error) {
    if (__DEV__) {
      console.log('[chatApi] fetchChatMessages error:', error);
    }
    return { messages: [], hasMore: false, oldestMessageId: null };
  }
}

/**
 * Start or get an existing chat conversation
 * Endpoint: POST /chat/start
 */
export async function startChat(params: {
  repairmanId?: string;
  sellerId?: string;
  bookingId?: string;
  offerId?: string;
  jobId?: string;
}): Promise<{ success: boolean; chat?: any; message?: string }> {
  try {
    const res = await apiClient.post('/chat/start', params);
    if (res.data?.success) {
      return { success: true, chat: res.data.chat };
    }
    return { success: false, message: res.data?.message || 'Failed to start chat' };
  } catch (error: any) {
    if (__DEV__) {
      console.log('[chatApi] startChat error:', error);
    }
    const message = error?.response?.data?.message || 'Unable to start chat. Please try again.';
    return { success: false, message };
  }
}

/**
 * Mark messages in a chat as read
 * Endpoint: PATCH /chat/:chatId/read
 */
export async function markChatAsRead(chatId: string): Promise<boolean> {
  try {
    const res = await apiClient.patch(`/chat/${chatId}/read`);
    return Boolean(res.data?.success);
  } catch (error) {
    return false;
  }
}

/**
 * Send message fallback over HTTP
 * Endpoint: POST /chat/:chatId/send
 */
export async function sendChatMessageHttp(
  chatId: string,
  payload: {
    content: string;
    messageType?: string;
    mediaUrl?: string;
    fileName?: string;
  },
): Promise<{ success: boolean; message?: any }> {
  try {
    const res = await apiClient.post(`/chat/${chatId}/send`, payload);
    return { success: Boolean(res.data?.success), message: res.data?.data };
  } catch (error: any) {
    return { success: false };
  }
}

/**
 * Send quotation in chat
 * Endpoint: POST /chat/:chatId/send-quotation
 */
export async function sendQuotation(
  chatId: string,
  payload: {
    serviceCharges: number;
    partsPrice?: number;
    description: string;
    estimatedDuration: string;
    serviceType: 'drop-off' | 'pickup' | 'home-service';
  },
): Promise<any> {
  const res = await apiClient.post(`/chat/${chatId}/send-quotation`, payload);
  return res.data;
}

/**
 * Respond to a quotation
 * Endpoint: POST /chat/quotation/:quotationId/respond
 */
export async function respondToQuotation(
  quotationId: string,
  action: 'accepted' | 'rejected',
  customerResponse?: string,
): Promise<any> {
  const res = await apiClient.post(`/chat/quotation/${quotationId}/respond`, {
    action,
    customerResponse,
  });
  return res.data;
}
