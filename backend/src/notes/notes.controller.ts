import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() createNoteDto: CreateNoteDto) {
    return this.notesService.create(user.id, createNoteDto);
  }

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('workspaceId') workspaceId?: string,
  ) {
    return this.notesService.findAll(user.id, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      type,
      status,
      workspaceId,
    });
  }

  @Get('my-notes')
  getUserNotes(@CurrentUser() user: any) {
    return this.notesService.getUserNotes(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notesService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateNoteDto: UpdateNoteDto,
  ) {
    return this.notesService.update(id, user.id, updateNoteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notesService.remove(id, user.id);
  }

  @Post(':id/tags')
  addTag(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('tagName') tagName: string,
  ) {
    return this.notesService.addTag(id, user.id, tagName);
  }

  @Delete(':id/tags/:tagId')
  removeTag(
    @Param('id') id: string,
    @Param('tagId') tagId: string,
    @CurrentUser() user: any,
  ) {
    return this.notesService.removeTag(id, user.id, tagId);
  }
}