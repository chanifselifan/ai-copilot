import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SummarizeDto } from './dto/summarize.dto';
import { KeyPointsDto } from './dto/key-points.dto';
import { ImproveTextDto } from './dto/improve-text.dto';
import { ChatDto } from './dto/chat.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('summarize')
  async summarize(@Body() summarizeDto: SummarizeDto) {
    const summary = await this.aiService.summarize(summarizeDto.text);
    return {
      summary,
      originalLength: summarizeDto.text.length,
      summaryLength: summary.length,
    };
  }

  @Post('key-points')
  async generateKeyPoints(@Body() keyPointsDto: KeyPointsDto) {
    const keyPoints = await this.aiService.generateKeyPoints(keyPointsDto.text);
    return {
      keyPoints,
      count: keyPoints.length,
    };
  }

  @Post('improve')
  async improveText(@Body() improveTextDto: ImproveTextDto) {
    const improvedText = await this.aiService.improveText(
      improveTextDto.text,
      improveTextDto.instruction,
    );
    return {
      original: improveTextDto.text,
      improved: improvedText,
      originalLength: improveTextDto.text.length,
      improvedLength: improvedText.length,
    };
  }

  @Post('chat')
  async chat(@Body() chatDto: ChatDto) {
    const response = await this.aiService.chat(chatDto.message, chatDto.context);
    return {
      message: chatDto.message,
      response,
      timestamp: new Date().toISOString(),
    };
  }
}
