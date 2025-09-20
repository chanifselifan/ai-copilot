import * as SQLite from 'expo-sqlite';

export interface OfflineNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: 'PENDING' | 'SYNCED' | 'CONFLICT';
  lastSyncAt?: string;
  serverId?: string;
}

export interface OfflineMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: string;
  syncStatus: 'PENDING' | 'SYNCED';
  conversationId: string;
}

export interface OfflineFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  localPath: string;
  syncStatus: 'PENDING' | 'SYNCED' | 'UPLOADING';
  serverId?: string;
  createdAt: string;
}

interface SyncQueueItem {
  id: string;
  entityType: string;
  entityId: string;
  operation: string;
  data: any;
  createdAt: string;
  retries: number;
}

class OfflineDatabase {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('aiCopilot.db');
      await this.createTables();
      console.log('Offline database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize offline database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Notes table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        syncStatus TEXT NOT NULL DEFAULT 'PENDING',
        lastSyncAt TEXT,
        serverId TEXT
      );
    `);

    // Messages table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        sender TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        syncStatus TEXT NOT NULL DEFAULT 'PENDING',
        conversationId TEXT NOT NULL
      );
    `);

    // Files table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        originalName TEXT NOT NULL,
        mimeType TEXT NOT NULL,
        size INTEGER NOT NULL,
        localPath TEXT NOT NULL,
        syncStatus TEXT NOT NULL DEFAULT 'PENDING',
        serverId TEXT,
        createdAt TEXT NOT NULL
      );
    `);

    // Sync queue table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        entityType TEXT NOT NULL,
        entityId TEXT NOT NULL,
        operation TEXT NOT NULL,
        data TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        retries INTEGER DEFAULT 0
      );
    `);

    // Create indexes for better performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_notes_sync_status ON notes(syncStatus);
      CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversationId);
      CREATE INDEX IF NOT EXISTS idx_files_sync_status ON files(syncStatus);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON sync_queue(entityType, entityId);
    `);
  }

  // Notes operations
  async saveNote(note: Omit<OfflineNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<OfflineNote> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const newNote: OfflineNote = {
      id,
      ...note,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.runAsync(
      `INSERT INTO notes (id, title, content, createdAt, updatedAt, syncStatus, serverId) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [newNote.id, newNote.title, newNote.content, newNote.createdAt, 
       newNote.updatedAt, newNote.syncStatus, newNote.serverId || null]
    );

    await this.addToSyncQueue('note', newNote.id, 'CREATE', newNote);
    return newNote;
  }

  async updateNote(id: string, updates: Partial<Pick<OfflineNote, 'title' | 'content'>>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const setParts = [];
    const values = [];

    if (updates.title !== undefined) {
      setParts.push('title = ?');
      values.push(updates.title);
    }
    
    if (updates.content !== undefined) {
      setParts.push('content = ?');
      values.push(updates.content);
    }

    setParts.push('updatedAt = ?', 'syncStatus = ?');
    values.push(now, 'PENDING');
    values.push(id);

    await this.db.runAsync(
      `UPDATE notes SET ${setParts.join(', ')} WHERE id = ?`,
      values
    );

    const note = await this.getNoteById(id);
    if (note) {
      await this.addToSyncQueue('note', id, 'UPDATE', note);
    }
  }

  async getNoteById(id: string): Promise<OfflineNote | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<OfflineNote>(
      'SELECT * FROM notes WHERE id = ?',
      [id]
    );

    return result || null;
  }

  async getAllNotes(): Promise<OfflineNote[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync<OfflineNote>(
      'SELECT * FROM notes ORDER BY updatedAt DESC'
    );

    return results;
  }

  async deleteNote(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync('DELETE FROM notes WHERE id = ?', [id]);
    await this.addToSyncQueue('note', id, 'DELETE', { id });
  }

  // Messages operations
  async saveMessage(message: Omit<OfflineMessage, 'id'>): Promise<OfflineMessage> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `offline_msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newMessage: OfflineMessage = { id, ...message };

    await this.db.runAsync(
      `INSERT INTO messages (id, text, sender, timestamp, syncStatus, conversationId) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [newMessage.id, newMessage.text, newMessage.sender, newMessage.timestamp,
       newMessage.syncStatus, newMessage.conversationId]
    );

    return newMessage;
  }

  async getMessagesByConversation(conversationId: string): Promise<OfflineMessage[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync<OfflineMessage>(
      'SELECT * FROM messages WHERE conversationId = ? ORDER BY timestamp ASC',
      [conversationId]
    );

    return results;
  }

  // Files operations
  async saveFile(file: Omit<OfflineFile, 'id' | 'createdAt'>): Promise<OfflineFile> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `offline_file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const newFile: OfflineFile = {
      id,
      ...file,
      createdAt: now,
    };

    await this.db.runAsync(
      `INSERT INTO files (id, filename, originalName, mimeType, size, localPath, syncStatus, serverId, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [newFile.id, newFile.filename, newFile.originalName, newFile.mimeType,
       newFile.size, newFile.localPath, newFile.syncStatus, newFile.serverId || null, newFile.createdAt]
    );

    await this.addToSyncQueue('file', newFile.id, 'CREATE', newFile);
    return newFile;
  }

  async getAllFiles(): Promise<OfflineFile[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync<OfflineFile>(
      'SELECT * FROM files ORDER BY createdAt DESC'
    );

    return results;
  }

  // Sync operations
  async addToSyncQueue(entityType: string, entityId: string, operation: string, data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    await this.db.runAsync(
      `INSERT INTO sync_queue (id, entityType, entityId, operation, data, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, entityType, entityId, operation, JSON.stringify(data), now]
    );
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync<Omit<SyncQueueItem, 'data'> & { data: string }>(
      'SELECT * FROM sync_queue ORDER BY createdAt ASC'
    );

    return results.map((row: any) => ({
      ...row,
      data: JSON.parse(row.data),
    }));
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
  }

  async incrementSyncRetries(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      'UPDATE sync_queue SET retries = retries + 1 WHERE id = ?',
      [id]
    );
  }

  async updateSyncStatus(entityType: string, entityId: string, status: 'PENDING' | 'SYNCED' | 'CONFLICT'): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    
    switch (entityType) {
      case 'note':
        await this.db.runAsync(
          'UPDATE notes SET syncStatus = ?, lastSyncAt = ? WHERE id = ?',
          [status, now, entityId]
        );
        break;
      case 'message':
        await this.db.runAsync(
          'UPDATE messages SET syncStatus = ? WHERE id = ?',
          [status, entityId]
        );
        break;
      case 'file':
        await this.db.runAsync(
          'UPDATE files SET syncStatus = ? WHERE id = ?',
          [status, entityId]
        );
        break;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  async setPendingItems(entityType: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    switch (entityType) {
      case 'note':
        await this.db.runAsync(
          'UPDATE notes SET syncStatus = ? WHERE syncStatus = ?',
          ['PENDING', 'SYNCED']
        );
        break;
      case 'message':
        await this.db.runAsync(
          'UPDATE messages SET syncStatus = ? WHERE syncStatus = ?',
          ['PENDING', 'SYNCED']
        );
        break;
      case 'file':
        await this.db.runAsync(
          'UPDATE files SET syncStatus = ? WHERE syncStatus = ?',
          ['PENDING', 'SYNCED']
        );
        break;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  // Advanced sync operations
  async getConflictItems(): Promise<{
    notes: OfflineNote[];
    messages: OfflineMessage[];
    files: OfflineFile[];
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const notes = await this.db.getAllAsync<OfflineNote>(
      'SELECT * FROM notes WHERE syncStatus = ? ORDER BY updatedAt DESC',
      ['CONFLICT']
    );

    const messages = await this.db.getAllAsync<OfflineMessage>(
      'SELECT * FROM messages WHERE syncStatus = ? ORDER BY timestamp DESC',
      ['CONFLICT']
    );

    const files = await this.db.getAllAsync<OfflineFile>(
      'SELECT * FROM files WHERE syncStatus = ? ORDER BY createdAt DESC',
      ['CONFLICT']
    );

    return { notes, messages, files };
  }

  async resolveConflict(entityType: string, entityId: string, resolution: 'local' | 'remote'): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    if (resolution === 'local') {
      await this.updateSyncStatus(entityType, entityId, 'PENDING');
    } else {
      await this.updateSyncStatus(entityType, entityId, 'SYNCED');
    }
  }

  // Batch operations for better performance
  async batchUpdateSyncStatus(updates: Array<{
    entityType: string;
    entityId: string;
    status: 'PENDING' | 'SYNCED' | 'CONFLICT';
  }>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();

    // Group by entity type for efficient updates
    const noteUpdates = updates.filter(u => u.entityType === 'note');
    const messageUpdates = updates.filter(u => u.entityType === 'message');
    const fileUpdates = updates.filter(u => u.entityType === 'file');

    // Batch update notes
    for (const update of noteUpdates) {
      await this.db.runAsync(
        'UPDATE notes SET syncStatus = ?, lastSyncAt = ? WHERE id = ?',
        [update.status, now, update.entityId]
      );
    }

    // Batch update messages
    for (const update of messageUpdates) {
      await this.db.runAsync(
        'UPDATE messages SET syncStatus = ? WHERE id = ?',
        [update.status, update.entityId]
      );
    }

    // Batch update files
    for (const update of fileUpdates) {
      await this.db.runAsync(
        'UPDATE files SET syncStatus = ? WHERE id = ?',
        [update.status, update.entityId]
      );
    }
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync(`
      DELETE FROM notes;
      DELETE FROM messages;
      DELETE FROM files;
      DELETE FROM sync_queue;
    `);
  }

  async getStorageStats(): Promise<{
    notes: number;
    messages: number;
    files: number;
    pendingSync: number;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const notesCount = await this.db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM notes');
    const messagesCount = await this.db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM messages');
    const filesCount = await this.db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM files');
    const pendingSyncCount = await this.db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM sync_queue');

    return {
      notes: notesCount?.count || 0,
      messages: messagesCount?.count || 0,
      files: filesCount?.count || 0,
      pendingSync: pendingSyncCount?.count || 0,
    };
  }

  // Search functionality
  async searchNotes(query: string): Promise<OfflineNote[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync<OfflineNote>(
      `SELECT * FROM notes 
       WHERE title LIKE ? OR content LIKE ? 
       ORDER BY updatedAt DESC`,
      [`%${query}%`, `%${query}%`]
    );

    return results;
  }

  async searchMessages(query: string, conversationId?: string): Promise<OfflineMessage[]> {
    if (!this.db) throw new Error('Database not initialized');

    let sql = 'SELECT * FROM messages WHERE text LIKE ?';
    const params: any[] = [`%${query}%`];

    if (conversationId) {
      sql += ' AND conversationId = ?';
      params.push(conversationId);
    }

    sql += ' ORDER BY timestamp DESC';

    const results = await this.db.getAllAsync<OfflineMessage>(sql, params);
    return results;
  }

  // Backup and restore
  async exportData(): Promise<{
    notes: OfflineNote[];
    messages: OfflineMessage[];
    files: OfflineFile[];
    exportedAt: string;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const notes = await this.getAllNotes();
    const messages = await this.db.getAllAsync<OfflineMessage>('SELECT * FROM messages ORDER BY timestamp ASC');
    const files = await this.getAllFiles();

    return {
      notes,
      messages,
      files,
      exportedAt: new Date().toISOString(),
    };
  }

  async importData(data: {
    notes: OfflineNote[];
    messages: OfflineMessage[];
    files: OfflineFile[];
  }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Clear existing data
    await this.clearAllData();

    // Import notes
    for (const note of data.notes) {
      await this.db.runAsync(
        `INSERT INTO notes (id, title, content, createdAt, updatedAt, syncStatus, lastSyncAt, serverId) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [note.id, note.title, note.content, note.createdAt, note.updatedAt, 
         note.syncStatus, note.lastSyncAt || null, note.serverId || null]
      );
    }

    // Import messages
    for (const message of data.messages) {
      await this.db.runAsync(
        `INSERT INTO messages (id, text, sender, timestamp, syncStatus, conversationId) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [message.id, message.text, message.sender, message.timestamp, 
         message.syncStatus, message.conversationId]
      );
    }

    // Import files
    for (const file of data.files) {
      await this.db.runAsync(
        `INSERT INTO files (id, filename, originalName, mimeType, size, localPath, syncStatus, serverId, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [file.id, file.filename, file.originalName, file.mimeType, file.size,
         file.localPath, file.syncStatus, file.serverId || null, file.createdAt]
      );
    }
  }

  // Connection status methods
  async getUnsyncedCount(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<{ count: number }>(
      `SELECT 
        (SELECT COUNT(*) FROM notes WHERE syncStatus = 'PENDING') +
        (SELECT COUNT(*) FROM messages WHERE syncStatus = 'PENDING') +
        (SELECT COUNT(*) FROM files WHERE syncStatus = 'PENDING') as count`
    );

    return result?.count || 0;
  }

  async getLastSyncTime(): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<{ lastSync: string }>(
      'SELECT MAX(lastSyncAt) as lastSync FROM notes WHERE lastSyncAt IS NOT NULL'
    );

    return result?.lastSync || null;
  }

  // Additional file operations
  async updateFileStatus(id: string, status: 'PENDING' | 'SYNCED' | 'UPLOADING', serverId?: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const params: any[] = [status, id];
    let sql = 'UPDATE files SET syncStatus = ?';

    if (serverId) {
      sql += ', serverId = ?';
      params.splice(1, 0, serverId);
    }

    sql += ' WHERE id = ?';

    await this.db.runAsync(sql, params);
  }

  async getFileById(id: string): Promise<OfflineFile | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<OfflineFile>(
      'SELECT * FROM files WHERE id = ?',
      [id]
    );

    return result || null;
  }

  async deleteFile(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync('DELETE FROM files WHERE id = ?', [id]);
    await this.addToSyncQueue('file', id, 'DELETE', { id });
  }

  // Message operations extensions
  async updateMessage(id: string, text: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      'UPDATE messages SET text = ?, syncStatus = ? WHERE id = ?',
      [text, 'PENDING', id]
    );

    const message = await this.getMessageById(id);
    if (message) {
      await this.addToSyncQueue('message', id, 'UPDATE', message);
    }
  }

  async getMessageById(id: string): Promise<OfflineMessage | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<OfflineMessage>(
      'SELECT * FROM messages WHERE id = ?',
      [id]
    );

    return result || null;
  }

  async deleteMessage(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync('DELETE FROM messages WHERE id = ?', [id]);
    await this.addToSyncQueue('message', id, 'DELETE', { id });
  }

  async getConversationsList(): Promise<Array<{ conversationId: string; messageCount: number; lastMessage: string; lastTimestamp: string }>> {
    if (!this.db) throw new Error('Database not initialized');

    const results = await this.db.getAllAsync<{
      conversationId: string;
      messageCount: number;
      lastMessage: string;
      lastTimestamp: string;
    }>(
      `SELECT 
        conversationId,
        COUNT(*) as messageCount,
        MAX(text) as lastMessage,
        MAX(timestamp) as lastTimestamp
       FROM messages 
       GROUP BY conversationId 
       ORDER BY MAX(timestamp) DESC`
    );

    return results;
  }

  // Database maintenance
  async vacuum(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.execAsync('VACUUM;');
  }

  async getDatabaseSize(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<{ page_count: number; page_size: number }>(
      'PRAGMA page_count; PRAGMA page_size;'
    );

    return (result?.page_count || 0) * (result?.page_size || 0);
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

// Singleton instance
let offlineDatabase: OfflineDatabase | null = null;

export const getOfflineDatabase = async (): Promise<OfflineDatabase> => {
  if (!offlineDatabase) {
    offlineDatabase = new OfflineDatabase();
    await offlineDatabase.initialize();
  }
  return offlineDatabase;
};

export default OfflineDatabase;