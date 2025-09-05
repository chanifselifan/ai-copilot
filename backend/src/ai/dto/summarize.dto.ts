import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class SummarizeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000, { message: 'Text is too long for summarization' })
  text: string;
}