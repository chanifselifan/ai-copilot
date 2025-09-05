import api from './api';

export interface BackendNote {
  id: string;
  title: string;
  content: string;
  type: 'TEXT' | 'MARKDOWN' | 'MINDMAP' | 'FLASHCARD';
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  authorId: string;
  workspaceId?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  tags?: {
    tag: {
      id: string;
      name: string;
      color: string;
    };
  }[];
}

export interface CreateNoteRequest {
  title: string;
  content: string;
  type?: 'TEXT' | 'MARKDOWN' | 'MINDMAP' | 'FLASHCARD';
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  workspaceId?: string;
  parentId?: string;
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  type?: 'TEXT' | 'MARKDOWN' | 'MINDMAP' | 'FLASHCARD';
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export interface NotesListResponse {
  data: BackendNote[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface NotesQuery {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  status?: string;
  workspaceId?: string;
}

class NotesService {
  async createNote(noteData: CreateNoteRequest): Promise<BackendNote> {
    try {
      const response = await api.post('/notes', noteData);
      return response.data;
    } catch (error: any) {
      console.error('Create note error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to create note');
    }
  }

  async getNotes(query: NotesQuery = {}): Promise<NotesListResponse> {
    try {
      const params = new URLSearchParams();
      
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.search) params.append('search', query.search);
      if (query.type) params.append('type', query.type);
      if (query.status) params.append('status', query.status);
      if (query.workspaceId) params.append('workspaceId', query.workspaceId);

      const response = await api.get(`/notes?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Get notes error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch notes');
    }
  }

  async getNoteById(id: string): Promise<BackendNote> {
    try {
      const response = await api.get(`/notes/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Get note error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch note');
    }
  }

  async updateNote(id: string, updateData: UpdateNoteRequest): Promise<BackendNote> {
    try {
      const response = await api.patch(`/notes/${id}`, updateData);
      return response.data;
    } catch (error: any) {
      console.error('Update note error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to update note');
    }
  }

  async deleteNote(id: string): Promise<void> {
    try {
      await api.delete(`/notes/${id}`);
    } catch (error: any) {
      console.error('Delete note error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to delete note');
    }
  }

  async getMyRecentNotes(): Promise<BackendNote[]> {
    try {
      const response = await api.get('/notes/my-notes');
      return response.data;
    } catch (error: any) {
      console.error('Get recent notes error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch recent notes');
    }
  }

  async addTag(noteId: string, tagName: string): Promise<BackendNote> {
    try {
      const response = await api.post(`/notes/${noteId}/tags`, { tagName });
      return response.data;
    } catch (error: any) {
      console.error('Add tag error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to add tag');
    }
  }

  async removeTag(noteId: string, tagId: string): Promise<BackendNote> {
    try {
      const response = await api.delete(`/notes/${noteId}/tags/${tagId}`);
      return response.data;
    } catch (error: any) {
      console.error('Remove tag error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to remove tag');
    }
  }
}

export default new NotesService();