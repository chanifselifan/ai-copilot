import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class KeyPointsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000, { message: 'Text is too long for key points extraction' })
  text: string;
}