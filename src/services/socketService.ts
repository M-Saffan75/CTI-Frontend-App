import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base server URL (without /api path)
export const SOCKET_URL = 'https://tbt-backend-hwu3.onrender.com';

class SocketService {
  private socket: Socket | null = null;
  private isConnecting: boolean = false;

  /**
   * Initialize and connect socket with user's stored auth token
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
      let token = await AsyncStorage.getItem('token');
      if (!token) {
        const authData = await AsyncStorage.getItem('auth');
        if (authData) {
          const parsed = JSON.parse(authData);
          token = parsed?.token || parsed?.tokens?.accessToken;
        }
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

      this.socket.on('connect', () => {
        if (__DEV__) {
          console.log('[Socket] Connected successfully with ID:', this.socket?.id);
        }
        if (token) {
          this.socket?.emit('user_online', { token });
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
   * Disconnect and clear socket
   */
  disconnect() {
    if (this.socket) {
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
   * Listen to any event with auto-cleanup callback
   */
  on(event: string, callback: (...args: any[]) => void): () => void {
    if (!this.socket) {
      this.connect().then(sock => {
        sock?.on(event, callback);
      });
    } else {
      this.socket.on(event, callback);
    }

    return () => {
      this.socket?.off(event, callback);
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
    this.emit('join_chat', { chatId });
  }

  /**
   * Leave a chat room
   */
  leaveChat(chatId: string) {
    this.emit('leave_chat', { chatId });
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
   * Listen for other user typing
   */
  onTypingStart(callback: (data: { userId: string; userName?: string; chatId: string }) => void): () => void {
    return this.on('typing_start', callback);
  }

  /**
   * Listen for other user stopped typing
   */
  onTypingStop(callback: (data: { userId: string; chatId: string }) => void): () => void {
    return this.on('typing_stop', callback);
  }

  /**
   * Mark messages as read over socket
   */
  markMessagesRead(chatId: string, messageIds?: string[]) {
    this.emit('mark_messages_read', { chatId, messageIds: messageIds || [] });
  }

  /**
   * Listen for read receipts
   */
  onMessagesRead(callback: (data: { chatId: string; messageIds: string[]; readBy: string }) => void): () => void {
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
