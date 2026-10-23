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
          token = parsed?.token;
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
