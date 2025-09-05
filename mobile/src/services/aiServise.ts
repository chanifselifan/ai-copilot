import api from './api';

export interface SummarizeRequest {
  text: string;
}

export interface SummarizeResponse {
  summary: string;
  originalLength: number;
  summaryLength: number;
}

export interface KeyPointsRequest {
  text: string;
}

export interface KeyPointsResponse {
  keyPoints: string[];
  count: number;
}

export interface ImproveTextRequest {
  text: string;
  instruction?: string;
}

export interface ImproveTextResponse {
  original: string;
  improved: string;
  originalLength: number;
  improvedLength: number;
}

export interface ChatRequest {
  message: string;
  context?: string;
}

export interface ChatResponse {
  message: string;
  response: string;
  timestamp: string;
}

class AiService {
  async summarizeText(text: string): Promise<SummarizeResponse> {
    try {
      const response = await api.post('/ai/summarize', { text });
      return response.data;
    } catch (error: any) {
      console.error('Summarize error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to summarize text');
    }
  }

  async extractKeyPoints(text: string): Promise<KeyPointsResponse> {
    try {
      const response = await api.post('/ai/key-points', { text });
      return response.data;
    } catch (error: any) {
      console.error('Key points error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to extract key points');
    }
  }

  async improveText(text: string, instruction?: string): Promise<ImproveTextResponse> {
    try {
      const response = await api.post('/ai/improve', { text, instruction });
      return response.data;
    } catch (error: any) {
      console.error('Improve text error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to improve text');
    }
  }

  async chatWithAI(message: string, context?: string): Promise<ChatResponse> {
    try {
      const response = await api.post('/ai/chat', { message, context });
      return response.data;
    } catch (error: any) {
      console.error('AI chat error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to get AI response');
    }
  }

  // Helper method to check if text is suitable for processing
  validateTextLength(text: string, maxLength: number = 10000): boolean {
    return text.trim().length > 0 && text.length <= maxLength;
  }

  // Helper method to truncate text if too long
  truncateText(text: string, maxLength: number = 10000): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }
}

export default new AiService();