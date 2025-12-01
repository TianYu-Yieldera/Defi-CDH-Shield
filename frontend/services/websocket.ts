import { CDPPosition } from '@/types';

type MessageHandler = (data: any) => void;
type ErrorHandler = (error: Event) => void;
type ConnectionHandler = () => void;

interface WebSocketMessage {
  type: 'position_update' | 'price_update' | 'health_factor_update' | 'alert';
  data: any;
  timestamp: number;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private openHandlers: Set<ConnectionHandler> = new Set();
  private closeHandlers: Set<ConnectionHandler> = new Set();
  private isManualClose = false;

  constructor(url?: string) {
    this.url = url || process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    this.isManualClose = false;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.openHandlers.forEach((handler) => handler());
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.errorHandlers.forEach((handler) => handler(error));
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.closeHandlers.forEach((handler) => handler());

        // Attempt to reconnect if not manually closed
        if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
          console.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`);
          setTimeout(() => this.connect(), delay);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }

  disconnect(): void {
    this.isManualClose = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => handler(message.data));
    }

    // Also trigger wildcard handlers
    const wildcardHandlers = this.handlers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => handler(message));
    }
  }

  on(event: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(event);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => {
      this.errorHandlers.delete(handler);
    };
  }

  onOpen(handler: ConnectionHandler): () => void {
    this.openHandlers.add(handler);
    return () => {
      this.openHandlers.delete(handler);
    };
  }

  onClose(handler: ConnectionHandler): () => void {
    this.closeHandlers.add(handler);
    return () => {
      this.closeHandlers.delete(handler);
    };
  }

  send(type: string, data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = {
        type,
        data,
        timestamp: Date.now(),
      };
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent.');
    }
  }

  subscribe(address: string): void {
    this.send('subscribe', { address });
  }

  unsubscribe(address: string): void {
    this.send('unsubscribe', { address });
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
let wsInstance: WebSocketService | null = null;

export function getWebSocketService(): WebSocketService {
  if (!wsInstance) {
    wsInstance = new WebSocketService();
  }
  return wsInstance;
}

export function createWebSocketService(url?: string): WebSocketService {
  return new WebSocketService(url);
}
