import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export enum NoteType {
  TEXT = 'TEXT',
  MARKDOWN = 'MARKDOWN',
  MINDMAP = 'MINDMAP',
  FLASHCARD = 'FLASHCARD',
}

export enum NoteStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(NoteType)
  @IsOptional()
  type?: NoteType = NoteType.TEXT;

  @IsEnum(NoteStatus)
  @IsOptional()
  status?: NoteStatus = NoteStatus.DRAFT;

  @IsString()
  @IsOptional()
  workspaceId?: string;

  @IsString()
  @IsOptional()
  parentId?: string;
}