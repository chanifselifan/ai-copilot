import io, { Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  name: string;
  avatar?: string;
  color: string;
}

export interface CollaborationEvent {
  type: 'USER_JOINED' | 'USER_LEFT' | 'NOTE_UPDATED' | 'CURSOR_MOVED' | 'SELECTION_CHANGED';
  userId: string;
  user: User;
  data?: any;
  timestamp: number;
}

export interface NoteUpdate {
  noteId: string;
  content: string;
  title?: string;
  userId: string;
  timestamp: number;
  operation: 'INSERT' | 'DELETE' | 'REPLACE';
  position?: number;
  length?: number;
}

export interface CursorPosition {
  noteId: string;
  userId: string;
  position: number;
  selection?: {
    start: number;
    end: number;
  };
}

export interface CollaborationRoom {
  id: string;
  noteId: string;
  users: User[];
  lastActivity: string;
}

class CollaborationService {
  private socket: Socket | null = null;
  private currentRoom: string | null = null;
  private currentUser: User | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Event callbacks
  private onUserJoined?: (user: User) => void;
  private onUserLeft?: (userId: string) => void;
  private onNoteUpdated?: (update: NoteUpdate) => void;
  private onCursorMoved?: (cursor: CursorPosition) => void;
  private onConnectionStatusChanged?: (connected: boolean) => void;

  async initialize(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      const userData = await AsyncStorage.getItem('@user_data');
      
      if (!token || !userData) {
        throw new Error('No authentication data found');
      }

      this.currentUser = JSON.parse(userData);
      
      const socketUrl = __DEV__ 
        ? 'http://10.0.2.2:3000' 
        : 'https://your-backend-url.com';

      this.socket = io(socketUrl, {
        auth: {
          token,
        },
        transports: ['websocket'],
        upgrade: true,
        timeout: 20000,
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to initialize collaboration service:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to collaboration server');
      this.reconnectAttempts = 0;
      this.onConnectionStatusChanged?.(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from collaboration server:', reason);
      this.onConnectionStatusChanged?.(false);
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.onConnectionStatusChanged?.(false);
      this.handleReconnect();
    });

    // Collaboration events
    this.socket.on('user_joined', (data: { user: User }) => {
      console.log('User joined:', data.user);
      this.onUserJoined?.(data.user);
    });

    this.socket.on('user_left', (data: { userId: string }) => {
      console.log('User left:', data.userId);
      this.onUserLeft?.(data.userId);
    });

    this.socket.on('note_updated', (update: NoteUpdate) => {
      // Only process updates from other users
      if (update.userId !== this.currentUser?.id) {
        this.onNoteUpdated?.(update);
      }
    });

    this.socket.on('cursor_moved', (cursor: CursorPosition) => {
      // Only process cursor moves from other users
      if (cursor.userId !== this.currentUser?.id) {
        this.onCursorMoved?.(cursor);
      }
    });

    this.socket.on('room_updated', (room: CollaborationRoom) => {
      console.log('Room updated:', room);
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.socket?.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  async joinNoteRoom(noteId: string): Promise<CollaborationRoom> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Not connected to collaboration server'));
        return;
      }

      this.socket.emit('join_note', { noteId }, (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          this.currentRoom = response.room.id;
          resolve(response.room);
        }
      });
    });
  }

  async leaveNoteRoom(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected || !this.currentRoom) {
        resolve();
        return;
      }

      this.socket.emit('leave_note', { roomId: this.currentRoom }, (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          this.currentRoom = null;
          resolve();
        }
      });
    });
  }

  updateNote(noteId: string, content: string, operation: 'INSERT' | 'DELETE' | 'REPLACE', position?: number, length?: number): void {
    if (!this.socket?.connected || !this.currentUser) return;

    const update: NoteUpdate = {
      noteId,
      content,
      userId: this.currentUser.id,
      timestamp: Date.now(),
      operation,
      position,
      length,
    };

    this.socket.emit('note_update', update);
  }

  updateCursor(noteId: string, position: number, selection?: { start: number; end: number }): void {
    if (!this.socket?.connected || !this.currentUser) return;

    const cursor: CursorPosition = {
      noteId,
      userId: this.currentUser.id,
      position,
      selection,
    };

    this.socket.emit('cursor_move', cursor);
  }

  // Event listeners
  setOnUserJoined(callback: (user: User) => void): void {
    this.onUserJoined = callback;
  }

  setOnUserLeft(callback: (userId: string) => void): void {
    this.onUserLeft = callback;
  }

  setOnNoteUpdated(callback: (update: NoteUpdate) => void): void {
    this.onNoteUpdated = callback;
  }

  setOnCursorMoved(callback: (cursor: CursorPosition) => void): void {
    this.onCursorMoved = callback;
  }

  setOnConnectionStatusChanged(callback: (connected: boolean) => void): void {
    this.onConnectionStatusChanged = callback;
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getCurrentRoom(): string | null {
    return this.currentRoom;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentRoom = null;
    this.reconnectAttempts = 0;
  }

  // Helper method to generate user colors
  static generateUserColor(userId: string): string {
    const colors = [
      '#FF6B35', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
      '#AED6F1', '#A9DFBF', '#F8C471', '#D7DBDD'
    ];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }

  // Method to apply text operations (for CRDT-like behavior)
  static applyOperation(content: string, operation: NoteUpdate): string {
    switch (operation.operation) {
      case 'INSERT':
        if (operation.position !== undefined) {
          return content.slice(0, operation.position) + 
                 operation.content + 
                 content.slice(operation.position);
        }
        break;
      
      case 'DELETE':
        if (operation.position !== undefined && operation.length !== undefined) {
          return content.slice(0, operation.position) + 
                 content.slice(operation.position + operation.length);
        }
        break;
      
      case 'REPLACE':
        if (operation.position !== undefined && operation.length !== undefined) {
          return content.slice(0, operation.position) + 
                 operation.content + 
                 content.slice(operation.position + operation.length);
        }
        break;
    }
    
    return content;
  }
}

export default new CollaborationService();