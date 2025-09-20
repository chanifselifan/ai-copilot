// Create this file at: mobile/src/services/fileService.ts

export interface UploadedFile {
  id: string;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  status: 'READY' | 'PROCESSING' | 'ERROR' | 'UPLOADING';
  createdAt: string;
  updatedAt: string;
  metadata?: {
    pages?: number;
    wordCount?: number;
    language?: string;
  };
}

export interface FileQueryResponse {
  answer: string;
  confidence: number;
  relevantChunks?: Array<{
    text: string;
    page?: number;
    score: number;
  }>;
  sources?: string[];
}

export interface FileUploadResponse {
  file: UploadedFile;
  message: string;
}

export interface FilesListResponse {
  files: UploadedFile[];
  total: number;
  page: number;
  pageSize: number;
}

export interface QueryFileRequest {
  fileId: string;
  query: string;
  maxResults?: number;
}

class FileService {
  private baseUrl: string;
  private apiKey: string | null = null;

  constructor() {
    // Replace with your actual API base URL
    this.baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://your-api-url.com/api';
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  async uploadFile(uri: string, name: string, mimeType: string): Promise<FileUploadResponse> {
    const formData = new FormData();
    
    // Create file object for upload
    const fileData: any = {
      uri,
      type: mimeType,
      name,
    };

    formData.append('file', fileData);
    formData.append('originalName', name);
    formData.append('mimeType', mimeType);

    const response = await fetch(`${this.baseUrl}/files/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Failed to upload file');
    }

    return await response.json();
  }

  async getFiles(page: number = 1, pageSize: number = 50): Promise<FilesListResponse> {
    const response = await fetch(
      `${this.baseUrl}/files?page=${page}&pageSize=${pageSize}`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch files' }));
      throw new Error(error.message || 'Failed to fetch files');
    }

    return await response.json();
  }

  async deleteFile(fileId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/files/${fileId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to delete file' }));
      throw new Error(error.message || 'Failed to delete file');
    }
  }

  async queryFile(request: QueryFileRequest): Promise<FileQueryResponse> {
    const response = await fetch(`${this.baseUrl}/files/query`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Query failed' }));
      throw new Error(error.message || 'Failed to query file');
    }

    return await response.json();
  }

  async getFileById(fileId: string): Promise<UploadedFile> {
    const response = await fetch(`${this.baseUrl}/files/${fileId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'File not found' }));
      throw new Error(error.message || 'Failed to fetch file');
    }

    return await response.json();
  }

  // Utility methods
  isFileSupported(mimeType: string): boolean {
    const supportedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/rtf',
    ];

    return supportedTypes.includes(mimeType);
  }

  getFileIcon(mimeType: string): string {
    const iconMap: Record<string, string> = {
      'application/pdf': 'document-text',
      'application/msword': 'document',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
      'text/plain': 'document-text',
      'text/markdown': 'document-text',
      'text/csv': 'grid',
      'application/rtf': 'document',
    };

    return iconMap[mimeType] || 'document';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileStatus(status: string): { text: string; color: string } {
    const statusMap: Record<string, { text: string; color: string }> = {
      'READY': { text: 'Ready', color: '#22c55e' },
      'PROCESSING': { text: 'Processing', color: '#f59e0b' },
      'ERROR': { text: 'Error', color: '#ef4444' },
      'UPLOADING': { text: 'Uploading', color: '#3b82f6' },
    };

    return statusMap[status] || { text: 'Unknown', color: '#6b7280' };
  }

  // File type detection
  getFileTypeFromExtension(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    const typeMap: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'md': 'text/markdown',
      'csv': 'text/csv',
      'rtf': 'application/rtf',
    };

    return typeMap[extension || ''] || 'application/octet-stream';
  }

  // Validation methods
  validateFileSize(size: number, maxSizeMB: number = 10): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return size <= maxSizeBytes;
  }

  validateFileName(filename: string): boolean {
    // Check for valid filename (no special characters that might cause issues)
    const invalidChars = /[<>:"/\\|?*]/g;
    return !invalidChars.test(filename) && filename.length > 0 && filename.length <= 255;
  }

  // Error handling helpers
  handleApiError(error: any): Error {
    if (error.response) {
      // API responded with error status
      const message = error.response.data?.message || error.response.statusText || 'API Error';
      return new Error(`API Error: ${message}`);
    } else if (error.request) {
      // Network error
      return new Error('Network Error: Unable to connect to server');
    } else {
      // Other error
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

// Create singleton instance
const fileService = new FileService();

export default fileService;