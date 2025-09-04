import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { NotesModule } from './notes/notes.module';
import { DocumentsModule } from './documents/documents.module';
import { SummariesModule } from './summaries/summaries.module';

@Module({
  imports: [AuthModule, NotesModule, DocumentsModule, SummariesModule],
})
export class AppModule {}
