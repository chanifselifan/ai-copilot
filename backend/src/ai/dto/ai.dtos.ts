import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class SummarizeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000, { message: 'Text is too long for summarization' })
  text: string;
}

export class KeyPointsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000, { message: 'Text is too long for key points extraction' })
  text: string;
}

export class ImproveTextDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000, { message: 'Text is too long for improvement' })
  text: string;

  @IsString()
  @IsOptional()
  @MaxLength(200, { message: 'Instruction is too long' })
  instruction?: string;
}

export class ChatDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000, { message: 'Message is too long' })
  message: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000, { message: 'Context is too long' })
  context?: string;
}