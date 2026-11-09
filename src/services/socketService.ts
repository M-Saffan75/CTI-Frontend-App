import { io, Socket } from 'socket.io-client';
import NetInfo from '@react-native-community/netinfo';
import { SOCKET_URL } from '@/constants/config';
import { getToken } from './tokenStorage';

// Re-export SOCKET_URL for backward compatibility
export { SOCKET_URL };

class SocketService {
  private socket: Socket | null = null;
  private isConnecting: boolean = false;
  private netInfoUnsubscribe: (() => void) | null = null;
  private activeChatId: string | null = null;

  // Single source of truth for listeners to prevent duplicate socket subscriptions
  private listeners: Map<string, Set<Function>> = new Map();
  private masterHandlers: Map<string, (...args: any[]) => void> = new Map();

  constructor() {
    this.initNetworkListener();
  }

  /**
   * Monitor network state via NetInfo.
   * When network transitions back online, automatically reconnect the socket if an auth token exists.
   */
  private initNetworkListener() {
    if (this.netInfoUnsubscribe) return;
    this.netInfoUnsubscribe = NetInfo.addEventListener(state => {
      const isOnline = Boolean(state.isConnected && state.isInternetReachable !== false);
      if (isOnline) {
        getToken()
          .then(token => {
            if (token && (!this.socket || !this.socket.connected)) {
              if (__DEV__) {
                console.log('[Socket] Network restored; reconnecting socket...');
              }
              this.connect().catch(() => {});
            }
          })
          .catch(() => {});
      }
    });
  }

  /**
   * Initialize and connect socket with user's stored auth token from Keychain
   */
  async connect(): Promise<Socket | null> {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (this.isConnecting) {
      return this.socket;
    }

    this.isConnecting = true;

    try {
      const token = await getToken();

      // If a previous disconnected socket instance exists, clean its wire listeners first
      if (this.socket) {
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      }

      this.socket = io(SOCKET_URL, {
        transports: ['polling', 'websocket'],
        upgrade: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        timeout: 20000,
        auth: {
          token: token || '',
        },
        extraHeaders: {
          Authorization: token ? `Bearer ${token}` : '',
          'x-platform': 'mobile',
        },
      });

      // Bind all registered master handlers to the new socket instance without duplicates
      this.bindAllMasterHandlers();

      this.socket.on('connect', () => {
        if (__DEV__) {
          console.log('[Socket] Connected successfully with ID:', this.socket?.id);
        }
        if (token) {
          this.socket?.emit('user_online');
        }
        // Auto-rejoin active chat on socket connect / reconnect after network drop
        if (this.activeChatId) {
          if (__DEV__) {
            console.log('[Socket] Rejoining active chat room on connect:', this.activeChatId);
          }
          this.socket?.emit('join_chat', { chatId: this.activeChatId });
        }
      });

      this.socket.on('disconnect', (reason) => {
        if (__DEV__) {
          console.log('[Socket] Disconnected:', reason);
        }
      });

      this.socket.on('connect_error', (error) => {
        if (__DEV__) {
          console.log('[Socket] Connection error:', error.message);
        }
      });

      return this.socket;
    } catch (error) {
      if (__DEV__) {
        console.error('[Socket] Init error:', error);
      }
      return null;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Attach master handlers for each registered event to the current socket
   */
  private bindAllMasterHandlers() {
    if (!this.socket) return;
    this.masterHandlers.forEach((handler, event) => {
      this.socket?.off(event, handler);
      this.socket?.on(event, handler);
    });
  }

  /**
   * Disconnect and clear socket on logout or cleanup
   */
  disconnect() {
    this.activeChatId = null;
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Get raw socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Check if socket is currently connected
   */
  isConnected(): boolean {
    return Boolean(this.socket && this.socket.connected);
  }

  /**
   * Listen to any event with deduplication and auto-cleanup callback.
   * Guarantees at most ONE underlying socket wire subscription per event name.
   */
  on(event: string, callback: (...args: any[]) => void): () => void {
    let callbacks = this.listeners.get(event);
    if (!callbacks) {
      callbacks = new Set();
      this.listeners.set(event, callbacks);
    }
    callbacks.add(callback);

    // Create single master dispatcher on socket if not yet created
    if (!this.masterHandlers.has(event)) {
      const masterHandler = (...args: any[]) => {
        const cbs = this.listeners.get(event);
        if (cbs) {
          cbs.forEach(cb => {
            try {
              cb(...args);
            } catch (err) {
              if (__DEV__) console.warn(`[Socket] Listener error on event '${event}':`, err);
            }
          });
        }
      };
      this.masterHandlers.set(event, masterHandler);
      this.socket?.on(event, masterHandler);
    }

    if (!this.socket && !this.isConnecting) {
      this.connect().catch(() => {});
    }

    // Return unsubscriber that safely unbinds and removes master wire listener when empty
    return () => {
      const set = this.listeners.get(event);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(event);
          const masterHandler = this.masterHandlers.get(event);
          if (masterHandler) {
            this.socket?.off(event, masterHandler);
            this.masterHandlers.delete(event);
          }
        }
      }
    };
  }

  /**
   * Emit an event safely
   */
  emit(event: string, data?: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      this.connect().then(sock => {
        sock?.emit(event, data);
      });
    }
  }

  // --- Specialized Chat Socket Methods (Matching Next.js Web App) ---

  /**
   * Join a chat room to receive live messages
   */
  joinChat(chatId: string) {
    if (!chatId) return;
    this.activeChatId = chatId;
    this.emit('join_chat', { chatId });
  }

  /**
   * Leave a chat room
   */
  leaveChat(chatId: string) {
    if (this.activeChatId === chatId) {
      this.activeChatId = null;
    }
    this.emit('leave_chat', { chatId });
  }

  /**
   * Get currently active joined chat room ID
   */
  getActiveChatId(): string | null {
    return this.activeChatId;
  }

  /**
   * Send a real-time chat message
   */
  sendChatMessage(payload: {
    chatId: string;
    content: string;
    messageType?: string;
    mediaUrl?: string | null;
    fileName?: string | null;
    fileSize?: number | null;
  }) {
    this.emit('send_message', payload);
  }

  /**
   * Listen for incoming real-time messages
   */
  onNewMessage(callback: (message: any) => void): () => void {
    return this.on('new_message', callback);
  }

  /**
   * Listen for server confirmation when a message is persisted and sent
   */
  onMessageSent(callback: (data: { messageId: string; timestamp: string | Date }) => void): () => void {
    return this.on('message_sent', callback);
  }

  /**
   * Listen for chat list updates (new unread count, new message preview, etc.)
   */
  onChatListUpdated(callback: (data: any) => void): () => void {
    return this.on('chat_list_updated', callback);
  }

  /**
   * Listen for chat joined confirmation and info
   */
  onChatJoined(callback: (data: any) => void): () => void {
    return this.on('chat_joined', callback);
  }

  /**
   * Broadcast start typing
   */
  startTyping(chatId: string) {
    this.emit('typing_start', { chatId });
  }

  /**
   * Broadcast stop typing
   */
  stopTyping(chatId: string) {
    this.emit('typing_stop', { chatId });
  }

  /**
   * Listen for other user typing state changes (Backend emits 'user_typing' event)
   */
  onUserTyping(callback: (data: { userId: string; userName?: string; chatId: string; isTyping: boolean }) => void): () => void {
    return this.on('user_typing', callback);
  }

  /**
   * Listen for other user typing
   */
  onTypingStart(callback: (data: { userId: string; userName?: string; chatId: string }) => void): () => void {
    const unsubUserTyping = this.on('user_typing', (data: any) => {
      if (data?.isTyping) {
        callback(data);
      }
    });
    const unsubLegacy = this.on('typing_start', callback);
    return () => {
      unsubUserTyping();
      unsubLegacy();
    };
  }

  /**
   * Listen for other user stopped typing
   */
  onTypingStop(callback: (data: { userId: string; chatId: string }) => void): () => void {
    const unsubUserTyping = this.on('user_typing', (data: any) => {
      if (data && !data.isTyping) {
        callback(data);
      }
    });
    const unsubLegacy = this.on('typing_stop', callback);
    return () => {
      unsubUserTyping();
      unsubLegacy();
    };
  }

  /**
   * Mark messages as read over socket
   */
  markMessagesRead(chatId: string, messageIds?: string[]) {
    this.emit('mark_messages_read', { chatId, messageIds: messageIds || [] });
  }

  /**
   * Delete message over socket
   */
  deleteMessage(chatId: string, messageId: string) {
    this.emit('delete_message', { chatId, messageId });
  }

  /**
   * Listen for message deletion
   */
  onMessageDeleted(callback: (data: { chatId: string; messageId: string }) => void): () => void {
    return this.on('message_deleted', callback);
  }

  /**
   * Listen for read receipts
   */
  onMessagesRead(callback: (data: { chatId: string; messageIds: string[]; readBy: string; readAt?: string | Date }) => void): () => void {
    return this.on('messages_read', callback);
  }

  /**
   * Listen for user coming online
   */
  onUserOnline(callback: (data: any) => void): () => void {
    return this.on('user_online', callback);
  }

  /**
   * Listen for user going offline
   */
  onUserOffline(callback: (data: any) => void): () => void {
    return this.on('user_offline', callback);
  }

  // --- Specialized Helper Listeners matching Web App ---

  onNotification(callback: (notification: any) => void): () => void {
    return this.on('notification', callback);
  }

  onNewOrder(callback: (order: any) => void): () => void {
    return this.on('new_order', callback);
  }

  onOrderStatusUpdated(callback: (data: { orderId: string; status: string; tracking?: any }) => void): () => void {
    return this.on('order_status_updated', callback);
  }

  onReceiveMessage(callback: (message: any) => void): () => void {
    return this.on('receive_message', callback);
  }

  sendMessage(messageData: { receiverId: string; content: string; orderId?: string }) {
    this.emit('sendMessage', messageData);
  }
}

export const socketService = new SocketService();
export default socketService;
