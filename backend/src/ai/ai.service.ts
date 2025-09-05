import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required');
    }

    this.openai = new OpenAI({
      apiKey,
    });
  }

  async summarize(text: string): Promise<string> {
    try {
      if (!text || text.trim().length === 0) {
        throw new BadRequestException('Text content is required');
      }

      const response = await this.openai.chat.completions.create({
        model: this.configService.get<string>('CHAT_MODEL', 'gpt-4-mini'),
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that creates concise, informative summaries. Focus on the main points and key insights.',
          },
          {
            role: 'user',
            content: `Please summarize the following text in a clear and concise manner:\n\n${text}`,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      const summary = response.choices[0]?.message?.content;
      if (!summary) {
        throw new Error('Failed to generate summary');
      }

      return summary;
    } catch (error) {
      console.error('Error in AI summarization:', error);
      throw new BadRequestException('Failed to generate summary');
    }
  }

  async generateKeyPoints(text: string): Promise<string[]> {
    try {
      if (!text || text.trim().length === 0) {
        throw new BadRequestException('Text content is required');
      }

      const response = await this.openai.chat.completions.create({
        model: this.configService.get<string>('CHAT_MODEL', 'gpt-4-mini'),
        messages: [
          {
            role: 'system',
            content: 'Extract the key points from the given text. Return them as a JSON array of strings. Each point should be concise and informative.',
          },
          {
            role: 'user',
            content: `Extract key points from this text:\n\n${text}`,
          },
        ],
        max_tokens: 300,
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Failed to generate key points');
      }

      try {
        return JSON.parse(content);
      } catch {
        // If JSON parsing fails, split by newlines and clean up
        return content
          .split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => line.replace(/^[-*•]\s*/, '').trim())
          .filter(line => line.length > 0);
      }
    } catch (error) {
      console.error('Error generating key points:', error);
      throw new BadRequestException('Failed to generate key points');
    }
  }

  async improveText(text: string, instruction?: string): Promise<string> {
    try {
      if (!text || text.trim().length === 0) {
        throw new BadRequestException('Text content is required');
      }

      const defaultInstruction = 'Improve the clarity, grammar, and flow of this text while maintaining its original meaning and tone.';
      const actualInstruction = instruction || defaultInstruction;

      const response = await this.openai.chat.completions.create({
        model: this.configService.get<string>('CHAT_MODEL', 'gpt-4-mini'),
        messages: [
          {
            role: 'system',
            content: 'You are a skilled editor that improves text quality while preserving the author\'s voice and intent.',
          },
          {
            role: 'user',
            content: `${actualInstruction}\n\nText to improve:\n\n${text}`,
          },
        ],
        max_tokens: 1000,
        temperature: 0.4,
      });

      const improvedText = response.choices[0]?.message?.content;
      if (!improvedText) {
        throw new Error('Failed to improve text');
      }

      return improvedText;
    } catch (error) {
      console.error('Error improving text:', error);
      throw new BadRequestException('Failed to improve text');
    }
  }

  async chat(message: string, context?: string): Promise<string> {
    try {
      if (!message || message.trim().length === 0) {
        throw new BadRequestException('Message is required');
      }

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: 'You are a helpful AI assistant for a note-taking application. Help users with their questions about their notes, provide insights, and assist with content organization.',
        },
      ];

      if (context) {
        messages.push({
          role: 'system',
          content: `Context from user's notes: ${context}`,
        });
      }

      messages.push({
        role: 'user',
        content: message,
      });

      const response = await this.openai.chat.completions.create({
        model: this.configService.get<string>('CHAT_MODEL', 'gpt-4-mini'),
        messages,
        max_tokens: 800,
        temperature: 0.7,
      });

      const reply = response.choices[0]?.message?.content;
      if (!reply) {
        throw new Error('Failed to generate response');
      }

      return reply;
    } catch (error) {
      console.error('Error in AI chat:', error);
      throw new BadRequestException('Failed to generate response');
    }
  }
}