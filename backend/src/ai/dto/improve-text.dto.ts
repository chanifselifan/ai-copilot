import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

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