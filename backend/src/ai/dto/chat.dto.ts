import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

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