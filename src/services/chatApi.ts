import AsyncStorage from '@react-native-async-storage/async-storage';
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
  queryId?: string;
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

const messageCache = new Map<string, ChatMessageItem[]>();

export function getCachedMessages(chatId: string): ChatMessageItem[] | undefined {
  return messageCache.get(chatId);
}

export function setCachedMessages(chatId: string, messages: ChatMessageItem[]): void {
  messageCache.set(chatId, messages);
}

export function clearCachedMessages(chatId?: string): void {
  if (chatId) {
    messageCache.delete(chatId);
  } else {
    messageCache.clear();
  }
}

/**
 * Fetch all conversations for logged in user (Includes live chats & customer seller queries)
 * Endpoint: GET /chat/list & GET /customer/queries
 */
export async function fetchChatList(page = 1, limit = 30): Promise<ChatItem[]> {
  try {
    let allChats: ChatItem[] = [];

    // 1. Fetch live chats (/chat/list)
    try {
      const res = await apiClient.get(`/chat/list?page=${page}&limit=${limit}`);
      if (res.data?.success && Array.isArray(res.data?.chats)) {
        const mappedChats = res.data.chats.map((c: any) => {
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
        allChats = [...mappedChats];
      }
    } catch (chatErr) {
      if (__DEV__) console.log('[chatApi] /chat/list fetch error:', chatErr);
    }

    // 2. Fetch Customer Queries with Sellers (/customer/queries?limit=50)
    try {
      let role = '';
      try {
        role = (await AsyncStorage.getItem('role')) || 'customer';
      } catch {}

      if (!role || role === 'customer') {
        const qRes = await apiClient.get('/customer/queries?limit=50');
        const queries = qRes.data?.data || qRes.data?.queries || [];
        if (Array.isArray(queries) && queries.length > 0) {
          const queryItems: ChatItem[] = queries.map((q: any) => {
            const seller = q.sellerId || {};
            const sellerName = seller.storeName || seller.businessName || seller.name || 'Verified Seller';
            const sellerAvatar = seller.profilePictureOrLogo || seller.avatar || seller.profilePhoto || seller.logo || null;
            const rawMsgs = Array.isArray(q.messages) ? q.messages : [];
            const lastMsg = q.lastMessage || rawMsgs[rawMsgs.length - 1];
            const lastContent = lastMsg
              ? (lastMsg.senderRole === 'seller' ? '' : 'You: ') + (lastMsg.message || lastMsg.text || lastMsg.content || '')
              : q.subject || 'Enquiry';

            return {
              chatId: `query_${q._id}`,
              queryId: q._id,
              participant: {
                id: seller._id || seller.id || '',
                name: sellerName,
                avatar: sellerAvatar,
                isOnline: false,
                role: 'seller',
              },
              lastMessage: {
                content: lastContent,
                senderType: lastMsg?.senderRole === 'seller' ? 'seller' : 'customer',
                timestamp: lastMsg?.createdAt || q.updatedAt || q.createdAt || new Date().toISOString(),
                messageType: 'text',
              },
              unreadCount: Number(q.customerUnread || 0),
              chatType: 'seller_query',
              updatedAt: q.updatedAt || q.createdAt || new Date().toISOString(),
            };
          });

          allChats = [...allChats, ...queryItems];
        }
      }
    } catch (qErr) {
      if (__DEV__) console.log('[chatApi] /customer/queries fetch error:', qErr);
    }

    // Sort combined conversations by updatedAt descending
    allChats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return allChats;
  } catch (error) {
    if (__DEV__) {
      console.log('[chatApi] fetchChatList error:', error);
    }
    return [];
  }
}

/**
 * Fetch total count of unread messages across all chats
 */
export async function fetchUnreadChatCount(): Promise<number> {
  try {
    const list = await fetchChatList(1, 50);
    return list.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  } catch {
    return 0;
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

      if (!before) {
        setCachedMessages(chatId, messages);
      }

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
 * Fetch messages for a customer seller query thread
 * Endpoint: GET /customer/queries/:id
 */
export async function fetchQueryMessages(
  queryId: string,
): Promise<{ messages: ChatMessageItem[]; user?: ChatParticipant }> {
  try {
    const cleanId = queryId.replace(/^query_/, '');
    const res = await apiClient.get(`/customer/queries/${cleanId}`);
    if (res.data?.success && res.data?.data) {
      const q = res.data.data;
      const seller = q.sellerId || {};
      const sellerName = seller.storeName || seller.businessName || seller.name || 'Verified Seller';
      const sellerAvatar = seller.profilePictureOrLogo || seller.avatar || seller.profilePhoto || seller.logo || null;
      const rawMsgs = Array.isArray(q.messages) ? q.messages : [];

      const mapped: ChatMessageItem[] = rawMsgs.map((m: any, idx: number) => ({
        _id: m._id || `qmsg-${idx}`,
        messageId: m._id || `qmsg-${idx}`,
        content: m.message || m.text || '',
        messageType: 'text',
        senderType: m.senderRole === 'seller' ? 'seller' : 'customer',
        senderId: m.senderId || (m.senderRole === 'seller' ? seller._id : 'me'),
        timestamp: m.createdAt || q.createdAt || new Date().toISOString(),
        isRead: true,
      }));

      // If no messages array but there was subject/message on root query object
      if (mapped.length === 0 && (q.subject || q.message)) {
        mapped.push({
          _id: `qmsg-root-${q._id}`,
          messageId: `qmsg-root-${q._id}`,
          content: q.subject ? `[${q.subject}]\n${q.message || ''}` : (q.message || ''),
          messageType: 'text',
          senderType: 'customer',
          senderId: 'me',
          timestamp: q.createdAt || new Date().toISOString(),
          isRead: true,
        });
      }

      return {
        messages: mapped,
        user: {
          id: seller._id || seller.id || '',
          name: sellerName,
          avatar: sellerAvatar,
        },
      };
    }
    return { messages: [] };
  } catch (error: any) {
    if (__DEV__) console.log('[chatApi] fetchQueryMessages error:', error);
    return { messages: [] };
  }
}

/**
 * Send a reply to a customer seller query thread
 * Endpoint: POST /customer/queries/:id/reply
 */
export async function sendQueryReply(
  queryId: string,
  message: string,
): Promise<boolean> {
  try {
    const cleanId = queryId.replace(/^query_/, '');
    const res = await apiClient.post(`/customer/queries/${cleanId}/reply`, {
      message,
    });
    return Boolean(res.data?.success);
  } catch (error: any) {
    if (__DEV__) console.log('[chatApi] sendQueryReply error:', error);
    return false;
  }
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
